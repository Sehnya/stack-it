from datetime import datetime, timedelta
import os

from flask import Flask, render_template, request, jsonify, session
from peewee import DoesNotExist
from db import User, db
from flask_caching import Cache
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix

# Load environment variables
load_dotenv()

# Circuit breaker configuration
DB_CIRCUIT_BREAKER = {
    'failures': 0,                      # Current failure count
    'failure_threshold': 3,             # Number of failures before circuit opens
    'reset_timeout': 60,                # Seconds to wait before trying to reconnect
    'last_failure_time': None,          # Timestamp of the last failure
    'circuit_open': False,              # Whether the circuit is currently open
    'max_backoff': 300,                 # Maximum backoff time in seconds (5 minutes)
}

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-key-for-testing')  # Use env var with fallback
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Upload configuration
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
app.config['MAX_CONTENT_LENGTH'] = 4 * 1024 * 1024  # 4MB limit

# Set additional security and production configurations
if os.environ.get('FLASK_ENV') == 'production':
    # Require a strong secret key in production
    if app.secret_key == 'dev-key-for-testing':
        raise RuntimeError('SECRET_KEY must be set in production')

    # Cookie and session settings
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
    app.config['PREFERRED_URL_SCHEME'] = 'https'
    
    # Configure static files for production
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000  # 1 year in seconds
    
    # Respect reverse proxy headers (e.g., when behind Nginx/Render/Heroku)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    
    # Add CSP and other security headers
    @app.after_request
    def add_security_headers(response):
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = "geolocation=(), microphone=(), camera=()"
        # Content Security Policy tuned for our templates using Bootstrap & Highlight.js CDNs and inline scripts
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net data:; "
            "connect-src 'self'; "
            "frame-ancestors 'self'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        response.headers['Content-Security-Policy'] = csp
        return response

# Initialize cache
cache = Cache(app, config={
    'CACHE_TYPE': 'SimpleCache',
    'CACHE_DEFAULT_TIMEOUT': 60  # seconds
})

# Context processors
@app.context_processor
def inject_helpers():
    from utils.helpers import avatar_url, is_online, current_user
    return dict(avatar_url=avatar_url, is_online=is_online, current_user=current_user)


# Database connection middleware
@app.before_request
def update_last_seen():
    # Update user's last_seen on each request (except static)
    try:
        if 'user_id' in session and not request.path.startswith('/static/'):
            user = User.get_by_id(session['user_id'])
            user.last_seen = datetime.now()
            user.save()
    except Exception:
        # Don't block request if updating last_seen fails
        pass


@app.before_request
def _db_connect():
    global DB_CIRCUIT_BREAKER
    
    # Skip database connection for static resources and health checks
    if request.path.startswith('/static/') or request.path == '/healthz':
        return None
        
    # Check if the circuit is open (database connection is failing)
    if DB_CIRCUIT_BREAKER['circuit_open']:
        current_time = datetime.now()
        last_failure = DB_CIRCUIT_BREAKER['last_failure_time']
        
        # Calculate backoff time with exponential increase based on failure count
        backoff_factor = min(DB_CIRCUIT_BREAKER['failures'], 10)  # Cap at 10 to avoid excessive backoff
        backoff_time = min(DB_CIRCUIT_BREAKER['reset_timeout'] * (2 ** (backoff_factor - 1)), 
                          DB_CIRCUIT_BREAKER['max_backoff'])
        
        # Check if enough time has passed to try reconnecting
        if last_failure and (current_time - last_failure) < timedelta(seconds=backoff_time):
            app.logger.info(f"Circuit open, skipping database connection attempt. Will retry in {backoff_time - (current_time - last_failure).total_seconds():.1f} seconds")
            
            # Return appropriate response based on request type
            if request.path.startswith('/api/'):
                return jsonify({
                    "error": "Database unavailable", 
                    "message": "Database connection is temporarily disabled due to repeated failures",
                    "retry_after": backoff_time
                }), 503
            else:
                return render_template('db_error.html', 
                                      error="Database connection is temporarily disabled due to repeated failures",
                                      retry_after=int(backoff_time)), 503
    
    # Attempt to connect to the database
    if db.is_closed():
        try:
            db.connect()
            
            # Reset circuit breaker on successful connection
            if DB_CIRCUIT_BREAKER['failures'] > 0:
                app.logger.info("Database connection restored, resetting circuit breaker")
                DB_CIRCUIT_BREAKER['failures'] = 0
                DB_CIRCUIT_BREAKER['circuit_open'] = False
                DB_CIRCUIT_BREAKER['last_failure_time'] = None
                
        except Exception as e:
            # Update circuit breaker state
            DB_CIRCUIT_BREAKER['failures'] += 1
            DB_CIRCUIT_BREAKER['last_failure_time'] = datetime.now()
            
            # Open the circuit if threshold is reached
            if DB_CIRCUIT_BREAKER['failures'] >= DB_CIRCUIT_BREAKER['failure_threshold']:
                DB_CIRCUIT_BREAKER['circuit_open'] = True
            
            # Log the error with circuit breaker status
            app.logger.error(f"Database connection error: {e} (Failures: {DB_CIRCUIT_BREAKER['failures']}, Circuit open: {DB_CIRCUIT_BREAKER['circuit_open']})")
            
            # Return appropriate response based on request type
            if request.path.startswith('/api/'):
                return jsonify({"error": "Database unavailable", "message": str(e)}), 503
            else:
                return render_template('db_error.html', error=str(e)), 503


@app.teardown_request
def _db_close(exc):
    if not db.is_closed():
        db.close()


# Health check endpoint (no DB access)
@app.route('/healthz')
def healthz():
    return jsonify({'status': 'ok', 'time': datetime.utcnow().isoformat() + 'Z'}), 200


# Error handler
@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


# Register blueprints
from routes import register_blueprints
from routes.api import init_cache as init_api_cache
from routes.community import init_cache as init_community_cache

# Initialize cache for modules that need it
init_api_cache(cache)
init_community_cache(cache)

# Register all route blueprints
register_blueprints(app)


# Debug mode entry point
if __name__ == '__main__':
    db.connect()
    from db import Stack, Post, Favorite
    db.create_tables([User, Stack, Post, Favorite])
    app.run(debug=True, port=5000)