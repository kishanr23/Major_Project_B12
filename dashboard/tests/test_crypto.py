"""
test_crypto.py — Dashboard crypto unit tests.

Run with: pytest dashboard/tests/test_crypto.py -v

Test coverage mirrors the firmware's test_priority.cpp rigour:
  - Replay protection: duplicate hash rejection, stale timestamp rejection
  - Signature verification: valid, tampered payload, wrong key, malformed bytes
  - TOFU: first registration, subsequent verification, key-conflict detection
  - message_id: canonical hex output format
  - Ack signatures: valid Ack accepted, tampered Ack rejected, missing sig rejected
  - Ack UI gate: confirms a tampered/unsigned Ack does NOT produce "Delivered" state
  - Cross-language hash vectors: Python implementation matches hash_vectors.json
"""

from __future__ import annotations

import json
import sqlite3
import struct
import time
from pathlib import Path
from unittest.mock import patch

import nacl.signing
import pytest

# Make dashboard package importable from project root
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dashboard.crypto_utils import (
    TofuStore,
    build_ack_payload,
    dedup_key,
    djb2_64,
    is_replay,
    message_id,
    verify_ack_signature,
    verify_hiker_signature,
    _seen_dedup_keys,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clear_replay_cache():
    """Reset the in-memory replay cache before each test."""
    _seen_dedup_keys.clear()
    yield
    _seen_dedup_keys.clear()


@pytest.fixture()
def db():
    conn = sqlite3.connect(":memory:")
    conn.executescript("""
        CREATE TABLE hikers (
            hiker_id TEXT PRIMARY KEY,
            public_key_hex TEXT NOT NULL
        );
    """)
    yield conn
    conn.close()


@pytest.fixture()
def hiker_keypair():
    sk = nacl.signing.SigningKey.generate()
    return sk, sk.verify_key.encode().hex()


@pytest.fixture()
def gateway_keypair():
    sk = nacl.signing.SigningKey.generate()
    return sk, sk.verify_key.encode().hex()


# ── djb2_64 & dedup_key ───────────────────────────────────────────────────────

class TestDjb2_64:
    def test_known_vector(self):
        """Matches the canonical test vectors from hash_vectors.json."""
        vectors_path = Path(__file__).parent.parent.parent / "test_vectors" / "hash_vectors.json"
        vectors = json.loads(vectors_path.read_text())
        for v in vectors["dedup_vectors"] + vectors["message_id_vectors"]:
            h = djb2_64(v["input"])
            assert f"{h:016x}" == v["hex"], f"Mismatch for input {v['input']!r}"
            assert str(h) == v["decimal"]

    def test_uses_colon_separator(self):
        """Separator must be ':' not '_' — reconciled from Phase 1 firmware."""
        colon = djb2_64("hiker_001:1700000000")
        underscore = djb2_64("hiker_001_1700000000")
        assert colon != underscore

    def test_empty_string(self):
        assert djb2_64("") == 5381  # no iterations, returns seed

    def test_dedup_key_format(self):
        k = dedup_key("alice", "SOS", 1000)
        assert 0 <= k <= 0xFFFFFFFFFFFFFFFF


# ── message_id ────────────────────────────────────────────────────────────────

class TestMessageId:
    def test_returns_16char_hex(self):
        mid = message_id("hiker_001", "node_A", 1700000000)
        assert len(mid) == 16
        assert all(c in "0123456789abcdef" for c in mid)

    def test_known_vector(self):
        mid = message_id("hiker_001", "node_A", 1700000000)
        assert mid == "8897f462c390fb2a"

    def test_different_nodes_give_different_ids(self):
        a = message_id("alice", "node_A", 1000)
        b = message_id("alice", "node_B", 1000)
        assert a != b


# ── Replay protection ─────────────────────────────────────────────────────────

class TestReplayProtection:
    def test_first_message_accepted(self):
        now = int(time.time())
        assert is_replay("hiker_001", "SOS", now, now) is False

    def test_duplicate_rejected(self):
        now = int(time.time())
        is_replay("hiker_001", "SOS", now, now)
        assert is_replay("hiker_001", "SOS", now, now) is True

    def test_stale_timestamp_rejected(self):
        now = int(time.time())
        old = now - 601  # > 10-minute window
        assert is_replay("hiker_001", "SOS", old, now) is True

    def test_future_timestamp_rejected(self):
        now = int(time.time())
        future = now + 601
        assert is_replay("hiker_001", "SOS", future, now) is True

    def test_different_hiker_ids_independent(self):
        now = int(time.time())
        is_replay("alice", "SOS", now, now)
        assert is_replay("bob", "SOS", now, now) is False  # different hiker

    def test_different_timestamps_independent(self):
        now = int(time.time())
        is_replay("alice", "SOS", now, now)
        assert is_replay("alice", "SOS", now - 1, now) is False  # different timestamp

    def test_different_msg_types_independent(self):
        now = int(time.time())
        is_replay("alice", "SOS", now, now)
        assert is_replay("alice", "CheckIn", now, now) is False  # different msg_type, same time/hiker


# ── Hiker signature verification ──────────────────────────────────────────────

class TestHikerSignatureVerification:
    def test_valid_signature_accepted(self, hiker_keypair):
        sk, pub_hex = hiker_keypair
        payload = b"test payload"
        sig = sk.sign(payload).signature
        assert verify_hiker_signature(pub_hex, payload, sig) is True

    def test_tampered_payload_rejected(self, hiker_keypair):
        sk, pub_hex = hiker_keypair
        payload = b"original payload"
        sig = sk.sign(payload).signature
        assert verify_hiker_signature(pub_hex, b"tampered payload", sig) is False

    def test_wrong_key_rejected(self, hiker_keypair):
        sk, _pub_hex = hiker_keypair
        other_sk = nacl.signing.SigningKey.generate()
        other_pub_hex = other_sk.verify_key.encode().hex()
        payload = b"hello"
        sig = sk.sign(payload).signature
        assert verify_hiker_signature(other_pub_hex, payload, sig) is False

    def test_malformed_signature_bytes_rejected(self, hiker_keypair):
        sk, pub_hex = hiker_keypair
        payload = b"hello"
        bad_sig = bytes(64)  # all-zero signature
        assert verify_hiker_signature(pub_hex, payload, bad_sig) is False

    def test_truncated_signature_rejected(self, hiker_keypair):
        sk, pub_hex = hiker_keypair
        payload = b"hello"
        sig = sk.sign(payload).signature
        assert verify_hiker_signature(pub_hex, payload, sig[:32]) is False

    def test_empty_payload_accepted(self, hiker_keypair):
        """Ed25519 must sign and verify an empty payload."""
        sk, pub_hex = hiker_keypair
        sig = sk.sign(b"").signature
        assert verify_hiker_signature(pub_hex, b"", sig) is True


# ── TOFU key store ────────────────────────────────────────────────────────────

class TestTofuStore:
    def test_first_encounter_registers_and_flags(self, db, hiker_keypair):
        sk, pub_hex = hiker_keypair
        payload = b"first checkin"
        sig = sk.sign(payload).signature
        store = TofuStore(db)
        valid, is_new = store.verify_or_register("alice", pub_hex, payload, sig)
        assert valid is True
        assert is_new is True

    def test_second_encounter_not_flagged(self, db, hiker_keypair):
        sk, pub_hex = hiker_keypair
        payload = b"first checkin"
        sig = sk.sign(payload).signature
        store = TofuStore(db)
        store.verify_or_register("alice", pub_hex, payload, sig)

        payload2 = b"second checkin"
        sig2 = sk.sign(payload2).signature
        valid, is_new = store.verify_or_register("alice", pub_hex, payload2, sig2)
        assert valid is True
        assert is_new is False

    def test_wrong_key_on_second_encounter_rejected(self, db, hiker_keypair):
        sk, pub_hex = hiker_keypair
        payload = b"first"
        store = TofuStore(db)
        store.verify_or_register("alice", pub_hex, payload, sk.sign(payload).signature)

        # Attacker uses a different key
        attacker_sk = nacl.signing.SigningKey.generate()
        attacker_pub = attacker_sk.verify_key.encode().hex()
        payload2 = b"second"
        valid, is_new = store.verify_or_register(
            "alice", attacker_pub, payload2, attacker_sk.sign(payload2).signature
        )
        assert valid is False
        assert is_new is False

    def test_invalid_signature_not_registered(self, db, hiker_keypair):
        sk, pub_hex = hiker_keypair
        payload = b"hello"
        bad_sig = bytes(64)
        store = TofuStore(db)
        valid, _ = store.verify_or_register("bob", pub_hex, payload, bad_sig)
        assert valid is False
        # Check not persisted
        cur = db.execute("SELECT hiker_id FROM hikers WHERE hiker_id='bob'")
        assert cur.fetchone() is None


# ── Ack signature ─────────────────────────────────────────────────────────────

class TestAckSignature:
    def _make_ack(self, gateway_sk: nacl.signing.SigningKey):
        mid    = message_id("hiker_001", "node_A", 1700000000)
        ack_ts = 1700000010
        payload = build_ack_payload(mid, ack_ts)
        sig = gateway_sk.sign(payload).signature
        return mid, ack_ts, sig

    def test_valid_ack_accepted(self, gateway_keypair):
        sk, pub_hex = gateway_keypair
        mid, ack_ts, sig = self._make_ack(sk)
        assert verify_ack_signature(pub_hex, mid, ack_ts, sig) is True

    def test_tampered_message_id_rejected(self, gateway_keypair):
        """
        Ack with tampered original_message_id must NOT produce 'Delivered' state.
        Verifier reconstructs payload from received fields; tampered ID makes it fail.
        """
        sk, pub_hex = gateway_keypair
        mid, ack_ts, sig = self._make_ack(sk)
        tampered_mid = "0000000000000000"  # wrong message_id
        result = verify_ack_signature(pub_hex, tampered_mid, ack_ts, sig)
        assert result is False, "Tampered Ack must NOT trigger Delivered state"

    def test_tampered_ack_timestamp_rejected(self, gateway_keypair):
        sk, pub_hex = gateway_keypair
        mid, ack_ts, sig = self._make_ack(sk)
        result = verify_ack_signature(pub_hex, mid, ack_ts + 1, sig)
        assert result is False

    def test_wrong_gateway_key_rejected(self, gateway_keypair):
        sk, _pub_hex = gateway_keypair
        mid, ack_ts, sig = self._make_ack(sk)
        wrong_sk = nacl.signing.SigningKey.generate()
        wrong_pub_hex = wrong_sk.verify_key.encode().hex()
        assert verify_ack_signature(wrong_pub_hex, mid, ack_ts, sig) is False

    def test_missing_signature_rejected(self, gateway_keypair):
        """Empty/zero signature must not produce Delivered state."""
        _sk, pub_hex = gateway_keypair
        mid    = message_id("hiker_001", "node_A", 1700000000)
        ack_ts = 1700000010
        assert verify_ack_signature(pub_hex, mid, ack_ts, bytes(64)) is False

    def test_truncated_signature_rejected(self, gateway_keypair):
        sk, pub_hex = gateway_keypair
        mid, ack_ts, sig = self._make_ack(sk)
        assert verify_ack_signature(pub_hex, mid, ack_ts, sig[:32]) is False

    def test_ack_payload_canonical_format(self, gateway_keypair):
        """
        Confirms the payload bytes match the spec:
          orig_message_id_utf8 || ack_timestamp_big_endian_4_bytes
        """
        sk, _pub_hex = gateway_keypair
        mid    = "8897f462c390fb2a"
        ack_ts = 1700000010
        payload = build_ack_payload(mid, ack_ts)
        assert payload[:16] == mid.encode("utf-8")
        assert payload[16:] == struct.pack(">I", ack_ts)
        assert len(payload) == 20
