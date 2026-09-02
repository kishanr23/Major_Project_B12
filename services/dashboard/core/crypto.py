"""
crypto_utils.py — TrailGuard dashboard cryptographic utilities.

Implements:
  - djb2_64: canonical 64-bit hash (dedup key and message_id), as specified
    in docs/MESSAGE_HASH_SPEC.md. Separator is ':'.
  - dedup_key(hiker_id, timestamp_unix): replay-protection hash.
  - message_id(hiker_id, node_id, timestamp_unix): Ack correlation hash.
  - verify_hiker_signature: Ed25519 signature verification via PyNaCl.
  - TOFU key store: trust-on-first-use for hiker public keys.
  - verify_ack_signature: Ed25519 signature verification for signed Acks.
  - build_ack_payload: canonical bytes the gateway signs when issuing an Ack.

All hashes use ':' as a field separator, matching the firmware and mobile app.
"""

from __future__ import annotations

import struct
import sqlite3
from typing import Optional

import nacl.signing
import nacl.exceptions


# ── djb2-64 ──────────────────────────────────────────────────────────────────

def djb2_64(s: str) -> int:
    """64-bit djb2 over UTF-8 bytes. Wraps at 2^64. See MESSAGE_HASH_SPEC.md."""
    h = 5381
    for b in s.encode("utf-8"):
        h = ((h << 5) + h + b) & 0xFFFFFFFFFFFFFFFF
    return h


def dedup_key(hiker_id: str, msg_type: str, timestamp_unix: int) -> int:
    """Replay-protection hash: djb2_64('{hiker_id}:{msg_type}:{timestamp_unix}')."""
    return djb2_64(f"{hiker_id}:{msg_type}:{timestamp_unix}")


def message_id(hiker_id: str, node_id: str, timestamp_unix: int) -> str:
    """Ack-correlation hash: zero-padded 16-char lowercase hex string."""
    h = djb2_64(f"{hiker_id}:{node_id}:{timestamp_unix}")
    return f"{h:016x}"


# ── Ack signature payload ─────────────────────────────────────────────────────

def build_ack_payload(orig_message_id: str, ack_timestamp_unix: int) -> bytes:
    """
    Canonical bytes the gateway signs when issuing an Ack, and that receivers
    must reconstruct verbatim before verifying.

      payload = orig_message_id_utf8 || ack_timestamp_unix_big_endian_4_bytes
    """
    return orig_message_id.encode("utf-8") + struct.pack(">I", ack_timestamp_unix)


# ── Hiker signature verification ──────────────────────────────────────────────

def verify_hiker_signature(
    public_key_hex: str,
    payload_bytes: bytes,
    signature_bytes: bytes,
) -> bool:
    """
    Verify an Ed25519 signature from a hiker device.
    Returns True if valid, False on any failure.
    """
    try:
        vk = nacl.signing.VerifyKey(bytes.fromhex(public_key_hex))
        vk.verify(payload_bytes, signature_bytes)
        return True
    except (nacl.exceptions.BadSignatureError, Exception):
        return False


# ── Ack signature verification ────────────────────────────────────────────────

def verify_ack_signature(
    gateway_public_key_hex: str,
    orig_message_id: str,
    ack_timestamp_unix: int,
    signature_bytes: bytes,
) -> bool:
    """
    Verify a gateway-signed Ack. Returns True if valid, False otherwise.
    A False result means the Ack must be silently dropped.
    """
    payload = build_ack_payload(orig_message_id, ack_timestamp_unix)
    try:
        vk = nacl.signing.VerifyKey(bytes.fromhex(gateway_public_key_hex))
        vk.verify(payload, signature_bytes)
        return True
    except (nacl.exceptions.BadSignatureError, Exception):
        return False


# ── Replay protection ─────────────────────────────────────────────────────────

# In-memory set — bounded by replay acceptance window (10 min).
# At startup, also checked against the DB for cross-restart protection.
_seen_dedup_keys: set[int] = set()

REPLAY_WINDOW_SECONDS = 600  # 10 minutes, matching firmware


def is_replay(hiker_id: str, msg_type: str, timestamp_unix: int, now_unix: int) -> bool:
    """
    Returns True if this (hiker_id, msg_type, timestamp) tuple has already been seen,
    or if the timestamp is outside the ±REPLAY_WINDOW_SECONDS acceptance window.
    """
    if abs(now_unix - timestamp_unix) > REPLAY_WINDOW_SECONDS:
        return True  # stale — treat as replay
    key = dedup_key(hiker_id, msg_type, timestamp_unix)
    if key in _seen_dedup_keys:
        return True
    _seen_dedup_keys.add(key)
    return False


# ── TOFU key store ────────────────────────────────────────────────────────────

class TofuStore:
    """
    Trust-On-First-Use hiker public key registry backed by SQLite.
    First packet from a hiker_id: stores and flags as 'new_device'.
    Subsequent packets: verifies against the stored key.
    """

    def __init__(self, db: sqlite3.Connection) -> None:
        self._db = db

    def verify_or_register(
        self,
        hiker_id: str,
        public_key_hex: str,
        payload_bytes: bytes,
        signature_bytes: bytes,
    ) -> tuple[bool, bool]:
        """
        Returns (signature_valid: bool, is_new_device: bool).

        is_new_device=True means the key was registered for the first time —
        the dashboard must surface this to the operator.
        """
        cur = self._db.execute(
            "SELECT public_key_hex FROM hikers WHERE hiker_id = ?", (hiker_id,)
        )
        row = cur.fetchone()

        if row is None:
            # First encounter: register and validate
            sig_valid = verify_hiker_signature(public_key_hex, payload_bytes, signature_bytes)
            if sig_valid:
                self._db.execute(
                    "INSERT INTO hikers (hiker_id, public_key_hex) VALUES (?, ?)",
                    (hiker_id, public_key_hex),
                )
                self._db.commit()
            return sig_valid, True  # is_new_device

        # Known hiker: verify against stored key (ignore supplied key)
        stored_key_hex: str = row[0]
        sig_valid = verify_hiker_signature(stored_key_hex, payload_bytes, signature_bytes)
        return sig_valid, False

import os
import json
import nacl.signing
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
GATEWAY_KEYPAIR_PATH = BASE_DIR / "gateway_keypair.json"

def _load_or_generate_gateway_keypair() -> nacl.signing.SigningKey:
    if GATEWAY_KEYPAIR_PATH.exists():
        data = json.loads(GATEWAY_KEYPAIR_PATH.read_text())
        return nacl.signing.SigningKey(bytes.fromhex(data["signing_key_hex"]))
    sk = nacl.signing.SigningKey.generate()
    GATEWAY_KEYPAIR_PATH.write_text(json.dumps({
        "signing_key_hex": sk.encode().hex(),
        "verify_key_hex":  sk.verify_key.encode().hex(),
    }))
    return sk

GATEWAY_SK: nacl.signing.SigningKey = _load_or_generate_gateway_keypair()