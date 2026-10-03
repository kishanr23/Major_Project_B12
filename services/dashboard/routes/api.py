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


@api_bp.post("/api/node-location")
@login_required
@require_role("admin")
def set_node_location():
    """Manually set a node's fixed GPS location (admin override — no hardware needed)."""
    data = request.get_json(silent=True) or {}
    node_id = data.get("node_id", "").strip()
    lat = data.get("lat")
    lon = data.get("lon")
    label = data.get("label", "")

    if not node_id or lat is None or lon is None:
        return jsonify({"error": "node_id, lat, lon required"}), 400

    db  = get_db(current_app.config["DB_PATH"])
    now = int(time.time())
    db.execute(
        """INSERT INTO nodes (node_id, last_seen_unix, latitude, longitude)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(node_id) DO UPDATE SET
               latitude  = excluded.latitude,
               longitude = excluded.longitude""",
        (node_id, now, float(lat), float(lon)),
    )
    db.commit()

    socketio.emit("node_update", {"node_id": node_id, "lat": float(lat), "lon": float(lon), "label": label})
    print(f"[DASHBOARD] Location set for {node_id}: {lat}, {lon}")
    return jsonify({"status": "ok", "node_id": node_id, "lat": lat, "lon": lon})


@api_bp.post("/api/node-heartbeat")
def node_heartbeat():
    """
    Lightweight heartbeat posted by the serial bridge for every Meshtastic
    packet (including plain-text and NODEINFO).  No auth required — the bridge
    runs locally and this endpoint only upserts a node row.
    """
    data    = request.get_json(force=True) or {}
    node_id = data.get("node_id", "").strip()
    if not node_id:
        return jsonify({"error": "node_id required"}), 400

    db  = get_db(current_app.config["DB_PATH"])
    now = int(time.time())
    lat = data.get("lat")
    lon = data.get("lon")

    db.execute(
        """INSERT INTO nodes (node_id, last_seen_unix, latitude, longitude)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(node_id) DO UPDATE SET
               last_seen_unix = excluded.last_seen_unix,
               latitude       = COALESCE(excluded.latitude,  nodes.latitude),
               longitude      = COALESCE(excluded.longitude, nodes.longitude)""",
        (node_id, now, lat, lon),
    )
    db.commit()

    socketio.emit("node_update", {
        "node_id":        node_id,
        "last_seen_unix": now,
        "lat":            lat,
        "lon":            lon,
    })

    print(f"[DASHBOARD] Heartbeat from node {node_id} @ {now}")
    return jsonify({"status": "ok", "node_id": node_id})


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


@api_bp.post("/api/plain-sos")
def plain_sos():
    """Accept a plain-text LoRa message from the serial bridge (no signature required).

    Used when a node sends a raw text SOS over Meshtastic instead of a signed
    TrailGuard protobuf. Stores the message and emits a real-time socket event
    so the SOS alerts page updates immediately.
    """
    data = request.get_json(force=True)

    msg_type       = data.get("msg_type", "SOS")
    hiker_id       = data.get("hiker_id", "unknown")
    node_id        = data.get("node_id", "unknown")
    ts             = int(data.get("timestamp_unix", time.time()))
    payload_json   = data.get("payload_json", "{}")

    now = int(time.time())
    db  = get_db(current_app.config["DB_PATH"])

    import hashlib, json as _json
    mid = hashlib.sha256(f"{hiker_id}{node_id}{ts}".encode()).hexdigest()[:32]

    try:
        db.execute(
            "INSERT OR IGNORE INTO messages "
            "(message_id, msg_type, hiker_id, node_id, timestamp_unix, payload_json) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (mid, msg_type, hiker_id, node_id, ts, payload_json),
        )
        db.commit()
        print(f"[DASHBOARD] Plain {msg_type} from {hiker_id} via {node_id} | id={mid}")
    except Exception as e:
        print(f"[DASHBOARD] plain-sos DB error: {e}")

    # Register / update node
    try:
        db.execute(
            """INSERT INTO nodes (node_id, last_seen_unix)
               VALUES (?, ?)
               ON CONFLICT(node_id) DO UPDATE SET last_seen_unix = excluded.last_seen_unix""",
            (node_id, now),
        )
        db.commit()
    except Exception:
        pass

    # Emit real-time socket event to update the alerts page
    try:
        payload_obj = _json.loads(payload_json)
    except Exception:
        payload_obj = {}

    socketio.emit("new_message", {
        "msg_type":  msg_type,
        "hiker_id":  hiker_id,
        "node_id":   node_id,
        "timestamp": ts,
        "is_new_device": False,
        **payload_obj,
    })

    return jsonify({"status": "ok", "message_id": mid}), 200

