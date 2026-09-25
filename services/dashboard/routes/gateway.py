import time
import json
import logging
import threading
from flask import Blueprint, request, jsonify, current_app
from dashboard.core.crypto import TofuStore, build_ack_payload, is_replay, message_id, GATEWAY_SK
from dashboard.extensions import get_db, socketio

gateway_bp = Blueprint("gateway", __name__)

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

        event_type = 'routine_rejection'
        message = f"Security rejection ({reason}) detected and dropped."
        status = 'reviewed' # Routine rejections don't need escalation

        if hiker_count > 3:
            event_type = 'spoofing_attack'
            message = f"Multiple security rejections ({hiker_count}/60s) from {hiker_id}. Potential attack."
            status = 'active'
            socketio.emit("security_escalation", {
                "type": "Spoofing/Replay Attack",
                "hiker_id": hiker_id,
                "message": message
            })
        elif fleet_count > 5:
            event_type = 'fleet_escalation'
            message = f"High fleet-wide security failures ({fleet_count}/60s). Possible version mismatch."
            status = 'active'
            socketio.emit("security_escalation", {
                "type": "Elevated security failure rate",
                "hiker_id": "FLEET",
                "message": message
            })
        else:
            socketio.emit("security_alert", {
                "hiker_id": hiker_id,
                "message": message
            })

        # Persist to DB
        try:
            from flask import current_app
            from dashboard.extensions import get_db
            db = get_db(current_app.config["DB_PATH"])
            ts = int(time.time())
            db.execute(
                "INSERT INTO security_logs (timestamp_unix, hiker_id, event_type, message, escalation_status) VALUES (?, ?, ?, ?, ?)",
                (ts, hiker_id, event_type, message, status)
            )
            db.commit()
        except Exception as e:
            logging.error(f"Failed to persist security log: {e}")

security_monitor = SecurityMonitor()

@gateway_bp.post("/ingest")
def ingest():
    data = request.get_json(force=True)
    print(f"[SIMULATED] Received ingest: {data.get('msg_type')} from {data.get('hiker_id')}")

    db = get_db(current_app.config["DB_PATH"])
    now = int(time.time())

    hiker_id       = data["hiker_id"]
    node_id        = data["node_id"]
    ts             = int(data["timestamp_unix"])
    msg_type       = data["msg_type"]
    pubkey_hex     = data["public_key_hex"]
    sig_bytes      = bytes.fromhex(data["signature_hex"])
    payload_json   = data.get("payload_json", "{}")
    payload_bytes  = payload_json.encode("utf-8")

    if is_replay(hiker_id, msg_type, ts, now):
        print(f"[DASHBOARD] Dropped replay: {msg_type} from {hiker_id} @ {ts}")
        security_monitor.record_rejection(hiker_id, "replay")
        return jsonify({"status": "replay"}), 200

    tofu = TofuStore(db)
    sig_valid, is_new = tofu.verify_or_register(hiker_id, pubkey_hex, payload_bytes, sig_bytes)
    if not sig_valid:
        print(f"[DASHBOARD] Dropped invalid signature from {hiker_id}")
        security_monitor.record_rejection(hiker_id, "invalid_signature")
        return jsonify({"status": "invalid_signature"}), 200

    mid = message_id(hiker_id, node_id, ts)
    try:
        db.execute(
            "INSERT INTO messages (message_id, msg_type, hiker_id, node_id, timestamp_unix, payload_json)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (mid, msg_type, hiker_id, node_id, ts, payload_json),
        )
        db.commit()
    except Exception as e:
        logging.debug(f"Duplicate or DB error for message_id={mid}: {e}")

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

    print(f"[DASHBOARD] Accepted {msg_type} from {hiker_id} | message_id={mid}")

    return jsonify({"status": "ok", "message_id": mid, "ack": ack_event}), 200

@gateway_bp.get("/pending_acks")
def pending_acks():
    db  = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT message_id, ack_timestamp_unix, signature_hex FROM pending_acks")
    rows = [dict(r) for r in cur.fetchall()]
    return jsonify(rows)

@gateway_bp.delete("/pending_acks/<message_id>")
def delete_ack(message_id: str):
    db = get_db(current_app.config["DB_PATH"])
    db.execute("DELETE FROM pending_acks WHERE message_id=?", (message_id,))
    db.commit()
    return jsonify({"status": "deleted"})
