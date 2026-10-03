import os, json
from flask import Blueprint, jsonify, send_from_directory, current_app
from dashboard.extensions import get_db

mobile_bp = Blueprint("mobile", __name__)

@mobile_bp.get("/api/trails")
def api_get_trails():
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT * FROM trail_catalog")
    trails = [dict(r) for r in cur.fetchall()]
    for t in trails:
        t["center"]      = [t["center_lon"], t["center_lat"]]
        t["defaultZoom"] = 13
    return jsonify({"version": 2, "trails": trails})

@mobile_bp.get("/api/trails/<trail_id>/map")
def api_download_map(trail_id: str):
    db  = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT mbtiles_filename FROM trail_catalog WHERE id = ?", (trail_id,))
    row = cur.fetchone()
    if not row or not row["mbtiles_filename"]:
        return jsonify({"error": "Map not found"}), 404

    filename = row["mbtiles_filename"]
    filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)

    # Serve GeoJSON as JSON (for live route overlay on the map)
    if filename.endswith(".geojson"):
        if not os.path.exists(filepath):
            return jsonify({"error": "File not found on server"}), 404
        with open(filepath) as f:
            return jsonify(json.load(f))

    # Serve MBTiles as binary download
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename, as_attachment=True)

