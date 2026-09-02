from flask import Blueprint, request, redirect, url_for, flash, render_template, current_app
from flask_login import login_user, logout_user, login_required
from dashboard.core.auth import verify_password, User, require_role, hash_password
from dashboard.extensions import get_db

auth_bp = Blueprint("auth_routes", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        db = get_db(current_app.config["DB_PATH"])
        cur = db.execute("SELECT password_hash, role FROM users WHERE username = ?", (username,))
        row = cur.fetchone()
        
        if row and verify_password(row["password_hash"], password):
            user = User(username, row["role"])
            login_user(user)
            return redirect(url_for("admin.index"))
            
        flash("Invalid username or password", "error")
    return render_template("login.html")

@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth_routes.login"))

@auth_bp.route("/users", methods=["GET", "POST"])
@login_required
@require_role("admin")
def manage_users():
    db = get_db(current_app.config["DB_PATH"])
    if request.method == "POST":
        action = request.form.get("action")
        username = request.form.get("username")
        
        if action == "add":
            password = request.form.get("password")
            role = request.form.get("role")
            db.execute("INSERT OR REPLACE INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       (username, hash_password(password), role))
            db.commit()
            flash(f"User {username} added.", "success")
        elif action == "delete":
            db.execute("DELETE FROM users WHERE username = ?", (username,))
            db.commit()
            flash(f"User {username} deleted.", "success")
            
        return redirect(url_for("auth_routes.manage_users"))
        
    cur = db.execute("SELECT username, role, created_at FROM users")
    users = [dict(r) for r in cur.fetchall()]
    return render_template("manage_users.html", users=users)
