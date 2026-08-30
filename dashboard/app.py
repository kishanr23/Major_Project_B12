"""
app.py — TrailGuard Dashboard (Flask + Socket.IO).

Ingests TrailGuard protobuf messages from the gateway, verifies signatures,
enforces replay protection, and broadcasts verified events to the Leaflet
frontend in real-time via WebSockets.

Ack flow:
  1. Dashboard receives and verifies an SOS or CheckIn.
  2. Generates a signed Ack (Ed25519, gateway keypair) and persists it.
  3. Pushes the Ack back to the gateway via the /ack_ready endpoint (gateway
     polls or is notified and relays it back through the mesh to the hiker's
     node → BLE → phone).

Run with:
  pip install flask flask-socketio pynacl
  python dashboard/app.py

SIMULATED — the /ingest endpoint accepts direct POST requests from the
gateway simulator. Clearly marked as SIMULATED in console output.
"""

from __future__ import annotations

import json
import os
import sqlite3
import struct
import time
import logging
import threading
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, render_template, request, g
from flask_socketio import SocketIO

import nacl.signing

from dashboard.crypto_utils import (
    TofuStore,
    build_ack_payload,
    dedup_key,
    is_replay,
    message_id,
    verify_hiker_signature,
)

# ── App bootstrap ─────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
DB_PATH  = BASE_DIR / "trailguard.db"

app = Flask(__name__, template_folder=str(BASE_DIR / "templates"))
app.config["SECRET_KEY"] = os.environ.get("TRAILGUARD_SECRET", "dev-secret-change-in-prod")
socketio = SocketIO(app, cors_allowed_origins="*")

# ── Security Logging & Rate Limiting ──────────────────────────────────────────
logging.basicConfig(
    filename=str(BASE_DIR / "security_audit.log"),
    level=logging.WARNING,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

class SecurityMonitor:
    def __init__(self):
        self.rejections = [] # list of (timestamp, hiker_id)
        self.lock = threading.Lock()

    def record_rejection(self, hiker_id: str, reason: str):
        with self.lock:
            now = time.time()
            self.rejections.append((now, hiker_id))
            # Prune older than 60s
            self.rejections = [(t, h) for t, h in self.rejections if now - t <= 60]

            fleet_count = len(self.rejections)
            hiker_count = sum(1 for t, h in self.rejections if h == hiker_id)

        logging.warning(f"Security rejection ({reason}) for hiker_id={hiker_id}")

        # If a single ID is spiking, it's likely a spoofing attack
        if hiker_count > 3:
            socketio.emit("security_escalation", {
                "type": "Spoofing/Replay Attack",
                "hiker_id": hiker_id,
                "message": f"Multiple security rejections ({hiker_count}/60s) from {hiker_id}. Potential attack."
            })
        # If many IDs are spiking, it might be a fleet-wide serialization mismatch
        elif fleet_count > 5:
            socketio.emit("security_escalation", {
                "type": "Elevated security failure rate",
                "hiker_id": "FLEET",
                "message": f"High fleet-wide security failures ({fleet_count}/60s). Possible version mismatch."
            })
        else:
            socketio.emit("security_alert", {
                "hiker_id": hiker_id,
                "message": f"Security rejection ({reason}) detected and dropped."
            })

security_monitor = SecurityMonitor()

# ── Gateway Ed25519 keypair ───────────────────────────────────────────────────
# At startup the dashboard generates (or loads) its signing keypair.
# The public key must be provisioned into every node and the mobile app via
# dashboard/provisioning.py before deployment.
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
    print(f"[DASHBOARD] Generated new gateway keypair. "
          f"Public key (hex): {sk.verify_key.encode().hex()}")
    print("[DASHBOARD] Provision this public key into nodes and the mobile app "
          "using dashboard/provisioning.py")
    return sk

GATEWAY_SK: nacl.signing.SigningKey = _load_or_generate_gateway_keypair()

# ── SQLite helpers ────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(str(DB_PATH))
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(_: Any) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db() -> None:
    with sqlite3.connect(str(DB_PATH)) as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS hikers (
                hiker_id        TEXT PRIMARY KEY,
                public_key_hex  TEXT NOT NULL,
                first_seen_unix INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                is_tofu_flagged INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS nodes (
                node_id         TEXT PRIMARY KEY,
                public_key_hex  TEXT,
                latitude        REAL,
                longitude       REAL,
                battery_pct     REAL,
                last_seen_unix  INTEGER
            );

            CREATE TABLE IF NOT EXISTS messages (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id      TEXT UNIQUE,
                msg_type        TEXT NOT NULL,   -- 'SOS', 'CheckIn', 'TrailMessage'
                hiker_id        TEXT NOT NULL,
                node_id         TEXT NOT NULL,
                timestamp_unix  INTEGER NOT NULL,
                payload_json    TEXT,
                received_unix   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                ack_sent        INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS pending_acks (
                message_id          TEXT PRIMARY KEY,
                ack_timestamp_unix  INTEGER NOT NULL,
                signature_hex       TEXT NOT NULL
            );
        """)
    print("[DASHBOARD] Database initialised.")

# ── Ingest endpoint ───────────────────────────────────────────────────────────

@app.post("/ingest")
def ingest():
    """
    Receives a TrailGuard message from the gateway simulator.
    Expected JSON body:
      {
        "msg_type":        "SOS" | "CheckIn" | "TrailMessage",
        "hiker_id":        str,
        "node_id":         str,
        "timestamp_unix":  int,
        "public_key_hex":  str,   # 32-byte Ed25519 pub key as hex
        "signature_hex":   str,   # 64-byte Ed25519 sig as hex
        "payload_json":    str    # JSON-encoded message fields for display
      }
    """
    data = request.get_json(force=True)
    print(f"[SIMULATED] Received ingest: {data.get('msg_type')} from {data.get('hiker_id')}")

    db = get_db()
    now = int(time.time())

    hiker_id       = data["hiker_id"]
    node_id        = data["node_id"]
    ts             = int(data["timestamp_unix"])
    msg_type       = data["msg_type"]
    pubkey_hex     = data["public_key_hex"]
    sig_bytes      = bytes.fromhex(data["signature_hex"])
    payload_json   = data.get("payload_json", "{}")
    payload_bytes  = payload_json.encode("utf-8")

    # 1. Replay check
    if is_replay(hiker_id, msg_type, ts, now):
        print(f"[DASHBOARD] Dropped replay: {msg_type} from {hiker_id} @ {ts}")
        security_monitor.record_rejection(hiker_id, "replay")
        return jsonify({"status": "replay"}), 200

    # 2. TOFU signature verification
    tofu = TofuStore(db)
    sig_valid, is_new = tofu.verify_or_register(hiker_id, pubkey_hex, payload_bytes, sig_bytes)
    if not sig_valid:
        print(f"[DASHBOARD] Dropped invalid signature from {hiker_id}")
        security_monitor.record_rejection(hiker_id, "invalid_signature")
        return jsonify({"status": "invalid_signature"}), 200

    # 3. Persist
    mid = message_id(hiker_id, node_id, ts)
    try:
        db.execute(
            "INSERT INTO messages (message_id, msg_type, hiker_id, node_id, timestamp_unix, payload_json)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (mid, msg_type, hiker_id, node_id, ts, payload_json),
        )
        db.commit()
    except sqlite3.IntegrityError:
        pass  # duplicate message_id — already stored

    # 4. Build and sign Ack (for SOS and CheckIn)
    ack_event: dict | None = None
    if msg_type in ("SOS", "CheckIn"):
        ack_ts  = now
        ack_payload = build_ack_payload(mid, ack_ts)
        sig    = GATEWAY_SK.sign(ack_payload).signature
        sig_hex = sig.hex()

        db.execute(
            "INSERT OR IGNORE INTO pending_acks (message_id, ack_timestamp_unix, signature_hex)"
            " VALUES (?, ?, ?)",
            (mid, ack_ts, sig_hex),
        )
        db.execute("UPDATE messages SET ack_sent=1 WHERE message_id=?", (mid,))
        db.commit()

        ack_event = {
            "original_message_id": mid,
            "ack_timestamp_unix":  ack_ts,
            "signature_hex":       sig_hex,
            "gateway_pubkey_hex":  GATEWAY_SK.verify_key.encode().hex(),
        }

    # 5. Broadcast to frontend
    payload_obj = json.loads(payload_json)
    event_data = {
        "msg_type":    msg_type,
        "hiker_id":    hiker_id,
        "node_id":     node_id,
        "timestamp":   ts,
        "is_new_device": is_new,
        **payload_obj,
    }
    socketio.emit("new_message", event_data)
    if is_new:
        socketio.emit("new_device_alert", {"hiker_id": hiker_id})

    print(f"[DASHBOARD] Accepted {msg_type} from {hiker_id} | message_id={mid}"
          + (" [NEW DEVICE]" if is_new else ""))

    return jsonify({"status": "ok", "message_id": mid, "ack": ack_event}), 200


# ── Ack retrieval for gateway ──────────────────────────────────────────────────

@app.get("/pending_acks")
def pending_acks():
    """
    Gateway polls this to pick up signed Acks and route them back through
    the mesh to the originating node.
    """
    db  = get_db()
    cur = db.execute("SELECT message_id, ack_timestamp_unix, signature_hex FROM pending_acks")
    rows = [dict(r) for r in cur.fetchall()]
    return jsonify(rows)


@app.delete("/pending_acks/<message_id>")
def delete_ack(message_id: str):
    """Called by gateway after it has successfully relayed the Ack into the mesh."""
    db = get_db()
    db.execute("DELETE FROM pending_acks WHERE message_id=?", (message_id,))
    db.commit()
    return jsonify({"status": "deleted"})


# ── Frontend ───────────────────────────────────────────────────────────────────

@app.get("/")
def index():
    return render_template("index.html",
                           gateway_pubkey=GATEWAY_SK.verify_key.encode().hex())

@app.get("/api/messages")
def api_messages():
    db = get_db()
    cur = db.execute(
        "SELECT msg_type, hiker_id, node_id, timestamp_unix, payload_json"
        " FROM messages ORDER BY received_unix DESC LIMIT 200"
    )
    return jsonify([dict(r) for r in cur.fetchall()])


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print("[DASHBOARD] Starting TrailGuard dashboard on http://localhost:5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
