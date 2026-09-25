"""
app.py — TrailGuard Dashboard (Flask + Socket.IO).

Main entrypoint that initializes the Flask application, registers modular blueprints,
and sets up database / websockets.
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Any

from flask import Flask, g
from dashboard.core.auth import init_auth
from dashboard.extensions import socketio, close_db
from dashboard.routes import admin_bp, auth_bp, gateway_bp, mobile_bp, api_bp, trails_bp

# ── App bootstrap ─────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
DB_PATH  = BASE_DIR / "trailguard.db"

IS_DEV = os.environ.get("FLASK_ENV", "development") == "development"

app = Flask(__name__, template_folder=str(BASE_DIR / "templates"))

_secret = os.environ.get("TRAILGUARD_SECRET", "")
if not _secret and not IS_DEV:
    raise RuntimeError(
        "TRAILGUARD_SECRET environment variable must be set in production. "
        "Set FLASK_ENV=development to bypass this check."
    )
app.config["SECRET_KEY"] = _secret or "dev-secret-change-in-prod"
app.config["UPLOAD_FOLDER"] = str(BASE_DIR / "uploads")
app.config["BASE_DIR"] = BASE_DIR
app.config["DB_PATH"] = str(DB_PATH)
app.config["IS_DEV"] = IS_DEV

init_auth(app)
cors_origins = "*" if IS_DEV else os.environ.get("TRAILGUARD_CORS_ORIGINS", "http://localhost:5000")
socketio.init_app(app, cors_allowed_origins=cors_origins)

# Register Blueprints
app.register_blueprint(admin_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(gateway_bp)
app.register_blueprint(mobile_bp)
app.register_blueprint(api_bp)
app.register_blueprint(trails_bp)

app.teardown_appcontext(close_db)

def init_db() -> None:
    with sqlite3.connect(str(DB_PATH)) as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
            );

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
                msg_type        TEXT NOT NULL,
                hiker_id        TEXT NOT NULL,
                node_id         TEXT NOT NULL,
                timestamp_unix  INTEGER NOT NULL,
                payload_json    TEXT,
                received_unix   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                ack_sent        INTEGER NOT NULL DEFAULT 0,
                status          TEXT DEFAULT 'new',
                acknowledged_by TEXT,
                acknowledged_at INTEGER,
                resolved_by     TEXT,
                resolved_at     INTEGER,
                notes           TEXT
            );

            CREATE TABLE IF NOT EXISTS pending_acks (
                message_id          TEXT PRIMARY KEY,
                ack_timestamp_unix  INTEGER NOT NULL,
                signature_hex       TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS trail_catalog (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                country TEXT NOT NULL,
                state TEXT NOT NULL,
                district TEXT NOT NULL,
                center_lat REAL NOT NULL,
                center_lon REAL NOT NULL,
                default_zoom INTEGER NOT NULL DEFAULT 13,
                description TEXT,
                mbtiles_filename TEXT
            );

            CREATE TABLE IF NOT EXISTS security_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp_unix INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                hiker_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                escalation_status TEXT DEFAULT 'active',
                resolved_by TEXT,
                resolved_at INTEGER
            );

            CREATE INDEX IF NOT EXISTS idx_messages_received ON messages(received_unix DESC);
        """)
    print("[DASHBOARD] Database initialised.")

# Always ensure tables exist on import
init_db()

if __name__ == "__main__":
    print("[DASHBOARD] Starting TrailGuard dashboard on http://localhost:5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=IS_DEV, allow_unsafe_werkzeug=IS_DEV)
