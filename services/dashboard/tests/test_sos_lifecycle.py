import pytest
import os
import tempfile
import sqlite3
import json
from dashboard.app import app, init_db, DB_PATH
from dashboard.auth import hash_password

@pytest.fixture
def client():
    # Setup test DB
    db_fd, temp_db_path = tempfile.mkstemp()
    app.config['TESTING'] = True
    
    import dashboard.app
    dashboard.app.DB_PATH = temp_db_path
    
    with app.app_context():
        init_db()
        with sqlite3.connect(str(temp_db_path)) as db:
            db.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ("ranger_user", hash_password("pass"), "ranger"))
            db.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ("viewer_user", hash_password("pass"), "viewer"))
            # Insert a fake SOS message
            db.execute("INSERT INTO messages (message_id, msg_type, hiker_id, node_id, timestamp_unix, status) VALUES (?, ?, ?, ?, ?, ?)",
                       ("msg_sos_123", "SOS", "hiker_1", "node_1", 1000, "new"))
            db.commit()

    with app.test_client() as client:
        yield client

    os.close(db_fd)
    os.unlink(temp_db_path)

def test_sos_lifecycle(client):
    # Viewer tries to update status (should fail, no access)
    client.post('/login', data=dict(username="viewer_user", password="pass"))
    rv = client.post('/api/incidents/msg_sos_123/transition', json={"status": "acknowledged"})
    assert rv.status_code == 403
    client.get('/logout')
    
    # Ranger updates status
    client.post('/login', data=dict(username="ranger_user", password="pass"))
    
    # Invalid status
    rv = client.post('/api/incidents/msg_sos_123/transition', json={"status": "invalid_status"})
    assert rv.status_code == 400
    
    # Valid transition to acknowledged
    rv = client.post('/api/incidents/msg_sos_123/transition', json={"status": "acknowledged"})
    assert rv.status_code == 200
    
    # Check DB
    import dashboard.app
    with sqlite3.connect(str(dashboard.app.DB_PATH)) as db:
        db.row_factory = sqlite3.Row
        cur = db.execute("SELECT status, acknowledged_by FROM messages WHERE message_id = 'msg_sos_123'")
        row = cur.fetchone()
        assert row["status"] == "acknowledged"
        assert row["acknowledged_by"] == "ranger_user"

    # Transition to resolved
    rv = client.post('/api/incidents/msg_sos_123/transition', json={"status": "resolved"})
    assert rv.status_code == 200
    
    with sqlite3.connect(str(dashboard.app.DB_PATH)) as db:
        db.row_factory = sqlite3.Row
        cur = db.execute("SELECT status, resolved_by FROM messages WHERE message_id = 'msg_sos_123'")
        row = cur.fetchone()
        assert row["status"] == "resolved"
        assert row["resolved_by"] == "ranger_user"
