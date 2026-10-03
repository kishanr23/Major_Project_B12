import os
import uuid
import json
from flask import Blueprint, request, redirect, url_for, flash, render_template, current_app, jsonify
from flask_login import login_required
from werkzeug.utils import secure_filename
from dashboard.core.auth import require_role
from dashboard.extensions import get_db

trails_bp = Blueprint("trails", __name__)

@trails_bp.post("/api/trails/upload")
def api_upload_trail():
    """Accept a GeoJSON trail recording uploaded from the mobile app.

    Expected JSON body:
        {
          "name":        "My Trail",        // required
          "description": "...",             // optional
          "geojson":     { ... }            // GeoJSON FeatureCollection or Feature
        }

    The center lat/lon is auto-computed from the LineString midpoint.
    The GeoJSON is stored as a .geojson file in UPLOAD_FOLDER and
    registered in trail_catalog so it appears on the dashboard map.
    """
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No JSON body"}), 400

    name        = data.get("name", "Unnamed Trail").strip()
    description = data.get("description", "")
    geojson     = data.get("geojson")

    if not geojson:
        return jsonify({"error": "Missing 'geojson' field"}), 400

    # Auto-compute center from LineString coordinates
    center_lat, center_lon = 0.0, 0.0
    try:
        coords = []
        features = geojson.get("features", [geojson]) if geojson.get("type") == "FeatureCollection" else [geojson]
        for feat in features:
            geom = feat.get("geometry", {})
            if geom.get("type") == "LineString":
                coords = geom.get("coordinates", [])
                break
        if coords:
            mid = coords[len(coords) // 2]
            center_lon, center_lat = float(mid[0]), float(mid[1])
    except Exception:
        pass

    # Save GeoJSON file
    trail_id  = "trail_" + str(uuid.uuid4())[:8]
    filename  = f"{trail_id}.geojson"
    upload_dir = current_app.config.get("UPLOAD_FOLDER", ".")
    os.makedirs(upload_dir, exist_ok=True)
    filepath  = os.path.join(upload_dir, filename)
    with open(filepath, "w") as f:
        json.dump(geojson, f)

    # Register in DB
    db = get_db(current_app.config["DB_PATH"])
    try:
        db.execute(
            "INSERT INTO trail_catalog (id, name, country, state, district, center_lat, center_lon, description, mbtiles_filename)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (trail_id, name, "IN", "", "", center_lat, center_lon, description, filename)
        )
        db.commit()
        print(f"[DASHBOARD] Trail uploaded: {name} ({trail_id}) — {len(coords)} points")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"status": "ok", "trail_id": trail_id, "name": name, "points": len(coords)}), 200


@trails_bp.route("/admin/trails", methods=["GET", "POST"])
@login_required
@require_role("admin")
def manage_trails():
    db = get_db(current_app.config["DB_PATH"])
    if request.method == "POST":
        action = request.form.get("action")
        if action == "add":
            trail_id = "trail_" + str(uuid.uuid4())[:8]
            name = request.form.get("name")
            country = request.form.get("country")
            state = request.form.get("state")
            district = request.form.get("district")
            center_lat = float(request.form.get("center_lat", 0))
            center_lon = float(request.form.get("center_lon", 0))
            description = request.form.get("description", "")
            
            mbtiles_filename = None
            if "mbtiles" in request.files:
                file = request.files["mbtiles"]
                if file.filename != "":
                    mbtiles_filename = secure_filename(file.filename)
                    file.save(os.path.join(current_app.config["UPLOAD_FOLDER"], mbtiles_filename))

            db.execute(
                "INSERT INTO trail_catalog (id, name, country, state, district, center_lat, center_lon, description, mbtiles_filename) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (trail_id, name, country, state, district, center_lat, center_lon, description, mbtiles_filename)
            )
            db.commit()
            flash(f"Trail {name} added.", "success")
        elif action == "delete":
            trail_id = request.form.get("trail_id")
            db.execute("DELETE FROM trail_catalog WHERE id = ?", (trail_id,))
            db.commit()
            flash("Trail deleted.", "success")
            
        return redirect(url_for("trails.manage_trails"))

    cur = db.execute("SELECT * FROM trail_catalog")
    trails = [dict(r) for r in cur.fetchall()]
    return render_template("manage_trails.html", trails=trails)
