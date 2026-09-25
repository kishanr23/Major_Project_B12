from flask import Blueprint, render_template, current_app
from flask_login import login_required
from dashboard.core.auth import require_role
from dashboard.core.crypto import GATEWAY_SK
from dashboard.extensions import get_db

admin_bp = Blueprint("admin", __name__)

@admin_bp.get("/")
@login_required
def index():
    return render_template("index.html",
                           gateway_pubkey=GATEWAY_SK.verify_key.encode().hex())

@admin_bp.get("/analytics")
@login_required
@require_role("admin")
def analytics():
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT COUNT(*) as count FROM messages WHERE msg_type = 'SOS'")
    sos_count = cur.fetchone()["count"]
    
    cur = db.execute("SELECT COUNT(*) as count FROM messages WHERE msg_type = 'CheckIn'")
    checkin_count = cur.fetchone()["count"]
    
    return render_template("analytics.html", sos_count=sos_count, checkin_count=checkin_count)

@admin_bp.get("/sos_alerts")
@login_required
@require_role("ranger")
def sos_alerts():
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT * FROM messages WHERE msg_type = 'SOS' ORDER BY timestamp_unix DESC")
    alerts = [dict(r) for r in cur.fetchall()]
    
    total_sos = len(alerts)
    total_responded = sum(1 for a in alerts if a['status'] != 'new' or a['acknowledged_by'])
    
    response_times = []
    for a in alerts:
        if a['acknowledged_at']:
            response_times.append(a['acknowledged_at'] - a['timestamp_unix'])
        elif a['resolved_at']:
            response_times.append(a['resolved_at'] - a['timestamp_unix'])
            
    avg_response_time = (sum(response_times) / len(response_times)) if response_times else 0
    avg_minutes = round(avg_response_time / 60, 1)

    return render_template("sos_alerts.html", 
                           alerts=alerts, 
                           total_sos=total_sos, 
                           total_responded=total_responded, 
                           avg_minutes=avg_minutes)

@admin_bp.post("/sos_alerts/<int:alert_id>/status")
@login_required
@require_role("ranger")
def update_sos_status(alert_id):
    from flask import request
    import time
    from flask_login import current_user
    
    data = request.get_json()
    new_status = data.get("status")
    
    if new_status not in ("acknowledged", "resolved"):
        return {"error": "Invalid status"}, 400
        
    db = get_db(current_app.config["DB_PATH"])
    now = int(time.time())
    
    if new_status == "acknowledged":
        db.execute(
            "UPDATE messages SET status = ?, acknowledged_by = ?, acknowledged_at = ? WHERE id = ? AND status = 'new'",
            (new_status, current_user.username, now, alert_id)
        )
    elif new_status == "resolved":
        db.execute(
            "UPDATE messages SET status = ?, resolved_by = ?, resolved_at = ? WHERE id = ?",
            (new_status, current_user.username, now, alert_id)
        )
        
    db.commit()
    return {"status": "ok"}

@admin_bp.get("/nodes")
@login_required
@require_role("ranger")
def nodes():
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT * FROM nodes ORDER BY node_id")
    nodes_data = [dict(r) for r in cur.fetchall()]
    return render_template("nodes.html", nodes=nodes_data)

@admin_bp.post("/nodes/register")
@login_required
@require_role("admin")
def register_node():
    from flask import request, redirect, url_for
    import time
    db = get_db(current_app.config["DB_PATH"])
    node_id = request.form.get("node_id")
    pub_key = request.form.get("public_key")
    if node_id and pub_key:
        try:
            db.execute(
                "INSERT OR REPLACE INTO nodes (node_id, public_key_hex, latitude, longitude, battery_pct, last_seen_unix) VALUES (?, ?, ?, ?, ?, ?)",
                (node_id, pub_key, 13.42, 75.25, 100.0, int(time.time()))
            )
            db.commit()
        except Exception as e:
            print("Error registering node:", e)
    return redirect(url_for("admin.nodes"))

@admin_bp.get("/audit")
@login_required
@require_role("admin")
def audit():
    log_path = current_app.config["BASE_DIR"] / "security_audit.log"
    logs = []
    if log_path.exists():
        with open(log_path, "r") as f:
            logs = f.readlines()
    logs.reverse() # newest first
    return render_template("audit_log.html", logs=logs)

@admin_bp.get("/security")
@login_required
@require_role("admin")
def security_log():
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT * FROM security_logs ORDER BY timestamp_unix DESC")
    logs = [dict(r) for r in cur.fetchall()]
    return render_template("security_log.html", logs=logs)

@admin_bp.post("/security/resolve/<int:log_id>")
@login_required
@require_role("admin")
def resolve_security(log_id):
    from flask import request
    db = get_db(current_app.config["DB_PATH"])
    data = request.get_json(force=True)
    status = data.get("status")
    
    if status not in ("reviewed", "confirmed_attack"):
        return {"error": "invalid status"}, 400
        
    import time
    from flask_login import current_user
    
    db.execute(
        "UPDATE security_logs SET escalation_status = ?, resolved_by = ?, resolved_at = ? WHERE id = ?",
        (status, current_user.username, int(time.time()), log_id)
    )
    db.commit()
    return {"status": "ok"}
