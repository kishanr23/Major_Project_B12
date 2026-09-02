import sqlite3
from flask import g
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*")

def get_db(db_path: str) -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()
