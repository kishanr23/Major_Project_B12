import time
from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from dashboard.core.auth import require_role
from dashboard.extensions import get_db, socketio

api_bp = Blueprint("api", __name__)

@api_bp.get("/api/messages")
@login_required
def api_messages():
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute(
        "SELECT msg_type, hiker_id, node_id, timestamp_unix, payload_json, message_id, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, notes"
        " FROM messages ORDER BY received_unix DESC LIMIT 200"
    )
    return jsonify([dict(r) for r in cur.fetchall()])

@api_bp.post("/api/incidents/<message_id>/transition")
@login_required
@require_role("ranger")
def transition_incident(message_id: str):
    data = request.get_json(force=True)
    new_status = data.get("status")
    notes = data.get("notes", "")
    now = int(time.time())
    
    valid_statuses = ["new", "acknowledged", "responding", "resolved", "false_alarm"]
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400
        
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT status FROM messages WHERE message_id = ?", (message_id,))
    row = cur.fetchone()
    if not row:
        return jsonify({"error": "Incident not found"}), 404
        
    updates = ["status = ?", "notes = ?"]
    params = [new_status, notes]
    
    if new_status in ["acknowledged", "responding"] and row["status"] == "new":
        updates.extend(["acknowledged_by = ?", "acknowledged_at = ?"])
        params.extend([current_user.username, now])
    elif new_status in ["resolved", "false_alarm"]:
        updates.extend(["resolved_by = ?", "resolved_at = ?"])
        params.extend([current_user.username, now])
        
    query = f"UPDATE messages SET {', '.join(updates)} WHERE message_id = ?"
    params.append(message_id)
    
    db.execute(query, params)
    db.commit()
    
    socketio.emit("incident_update", {
        "message_id": message_id,
        "status": new_status,
        "notes": notes,
        "updated_by": current_user.username,
        "updated_at": now
    })
    
    return jsonify({"status": "ok"})

@api_bp.get("/api/nodes")
@login_required
def api_nodes():
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT * FROM nodes ORDER BY node_id")
    return jsonify([dict(r) for r in cur.fetchall()])

@api_bp.post("/api/demo-ingest")
def demo_ingest():
    import json
    from flask import current_app
    if not current_app.config.get("IS_DEV", False):
        return jsonify({"error": "Demo ingest is disabled in production"}), 403
    from dashboard.core.crypto import message_id, build_ack_payload, GATEWAY_SK
    data = request.get_json(force=True)
    db = get_db(current_app.config["DB_PATH"])
    now = int(time.time())
    
    hiker_id = data.get("hiker_id", "demo_hiker")
    node_id = data.get("node_id", "!demo-node")
    ts = int(data.get("timestamp_unix", now))
    msg_type = data.get("msg_type", "CheckIn")
    lat = data.get("lat", 0.0)
    lon = data.get("lon", 0.0)
    message = data.get("message", "")
    
    mid = message_id(hiker_id, node_id, ts)
    payload_json = json.dumps({"lat": lat, "lon": lon, "message": message})
    
    try:
        db.execute(
            "INSERT INTO messages (message_id, msg_type, hiker_id, node_id, timestamp_unix, payload_json) VALUES (?, ?, ?, ?, ?, ?)",
            (mid, msg_type, hiker_id, node_id, ts, payload_json)
        )
        db.commit()
    except Exception:
        pass # Ignore duplicates
        
    ack_ts = now
    ack_payload = build_ack_payload(mid, ack_ts)
    sig = GATEWAY_SK.sign(ack_payload).signature
    sig_hex = sig.hex()
    
    db.execute("INSERT OR IGNORE INTO pending_acks (message_id, ack_timestamp_unix, signature_hex) VALUES (?, ?, ?)", (mid, ack_ts, sig_hex))
    db.execute("UPDATE messages SET ack_sent=1 WHERE message_id=?", (mid,))
    db.commit()
    
    event_data = {
        "msg_type": msg_type,
        "hiker_id": hiker_id,
        "node_id": node_id,
        "timestamp": ts,
        "is_new_device": False,
        "lat": lat,
        "lon": lon,
        "message": message
    }
    socketio.emit("new_message", event_data)
    
    return jsonify({
        "status": "ok",
        "message_id": mid,
        "ack": {
            "original_message_id": mid,
            "ack_timestamp_unix": ack_ts,
            "signature_hex": sig_hex
        }
    }), 200
