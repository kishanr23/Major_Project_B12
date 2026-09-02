from flask import Blueprint, jsonify, send_from_directory, current_app
from dashboard.extensions import get_db

mobile_bp = Blueprint("mobile", __name__)

@mobile_bp.get("/api/trails")
def api_get_trails():
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT * FROM trail_catalog")
    trails = [dict(r) for r in cur.fetchall()]
    # Format center as [lon, lat] for the mobile app
    for t in trails:
        t["center"] = [t["center_lon"], t["center_lat"]]
    return jsonify({"version": 2, "trails": trails})

@mobile_bp.get("/api/trails/<trail_id>/map")
def api_download_map(trail_id: str):
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT mbtiles_filename FROM trail_catalog WHERE id = ?", (trail_id,))
    row = cur.fetchone()
    if not row or not row["mbtiles_filename"]:
        return jsonify({"error": "Map not found"}), 404
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], row["mbtiles_filename"], as_attachment=True)
