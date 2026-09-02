import pytest
import os
import tempfile
import sqlite3
from dashboard.app import app, init_db, DB_PATH
from dashboard.auth import hash_password

@pytest.fixture
def client():
    # Setup test DB
    db_fd, temp_db_path = tempfile.mkstemp()
    app.config['TESTING'] = True
    
    # Overwrite DB_PATH in app module for testing
    import dashboard.app
    dashboard.app.DB_PATH = temp_db_path
    
    with app.app_context():
        init_db()
        # Create test users
        with sqlite3.connect(str(temp_db_path)) as db:
            db.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ("admin_user", hash_password("pass"), "admin"))
            db.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ("ranger_user", hash_password("pass"), "ranger"))
            db.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ("viewer_user", hash_password("pass"), "viewer"))
            db.commit()

    with app.test_client() as client:
        yield client

    os.close(db_fd)
    os.unlink(temp_db_path)

def test_login_logout(client):
    rv = client.post('/login', data=dict(username="admin_user", password="wrongpassword"))
    assert b"Invalid username or password" in rv.data

    rv = client.post('/login', data=dict(username="admin_user", password="pass"), follow_redirects=True)
    assert b"Operations Dashboard" in rv.data # Success login
    
    rv = client.get('/logout', follow_redirects=True)
    assert b"Log In" in rv.data # Back to login

def test_role_access(client):
    # viewer tries to access analytics (admin)
    client.post('/login', data=dict(username="viewer_user", password="pass"))
    rv = client.get('/analytics')
    assert rv.status_code == 403
    
    # viewer tries to access nodes (ranger)
    rv = client.get('/nodes')
    assert rv.status_code == 403
    client.get('/logout')
    
    # ranger tries to access analytics (admin)
    client.post('/login', data=dict(username="ranger_user", password="pass"))
    rv = client.get('/analytics')
    assert rv.status_code == 403
    
    # ranger accesses nodes
    rv = client.get('/nodes')
    assert rv.status_code == 200
    client.get('/logout')
    
    # admin accesses analytics
    client.post('/login', data=dict(username="admin_user", password="pass"))
    rv = client.get('/analytics')
    assert rv.status_code == 200
    
    # admin accesses nodes
    rv = client.get('/nodes')
    assert rv.status_code == 200
