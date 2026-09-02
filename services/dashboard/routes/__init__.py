from dashboard.routes.admin import admin_bp
from dashboard.routes.auth_routes import auth_bp
from dashboard.routes.gateway import gateway_bp
from dashboard.routes.mobile import mobile_bp
from dashboard.routes.api import api_bp
from dashboard.routes.trails import trails_bp

__all__ = [
    "admin_bp",
    "auth_bp",
    "gateway_bp",
    "mobile_bp",
    "api_bp",
    "trails_bp"
]
