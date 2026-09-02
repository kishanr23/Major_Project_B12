import functools
from flask import abort, g, current_app
from flask_login import LoginManager, UserMixin, current_user
from werkzeug.security import generate_password_hash, check_password_hash

login_manager = LoginManager()
login_manager.login_view = "auth_routes.login"

class User(UserMixin):
    def __init__(self, username, role):
        self.id = username
        self.username = username
        self.role = role
        
    def is_admin(self):
        return self.role == 'admin'

    def is_ranger(self):
        return self.role in ('admin', 'ranger')
        
    def is_viewer(self):
        return True # viewers, rangers, admins can all view

@login_manager.user_loader
def load_user(user_id):
    from dashboard.extensions import get_db
    db = get_db(current_app.config["DB_PATH"])
    cur = db.execute("SELECT username, role FROM users WHERE username = ?", (user_id,))
    row = cur.fetchone()
    if row:
        return User(row["username"], row["role"])
    return None

def init_auth(app):
    login_manager.init_app(app)

def require_role(role):
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return login_manager.unauthorized()
            
            # Roles hierarchy: admin > ranger > viewer
            if role == 'admin' and not current_user.is_admin():
                abort(403)
            if role == 'ranger' and not current_user.is_ranger():
                abort(403)
            # viewer can be anyone logged in
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def hash_password(password):
    return generate_password_hash(password)

def verify_password(pwhash, password):
    return check_password_hash(pwhash, password)
