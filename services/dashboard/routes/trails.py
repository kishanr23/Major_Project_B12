import os
import uuid
from flask import Blueprint, request, redirect, url_for, flash, render_template, current_app
from flask_login import login_required
from werkzeug.utils import secure_filename
from dashboard.core.auth import require_role
from dashboard.extensions import get_db

trails_bp = Blueprint("trails", __name__)

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
