from flask import Flask


def register_blueprints(app: Flask):
    """Register all blueprints with the Flask app"""
    from .auth import auth_bp
    from .api import api_bp
    from .posts import posts_bp
    from .admin import admin_bp
    from .community import community_bp
    from .docs import docs_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(community_bp)
    app.register_blueprint(docs_bp)