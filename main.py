
from datetime import datetime

from flask import Flask, render_template, request, redirect, jsonify, session, abort
from peewee import DoesNotExist, IntegrityError
from db import User, db, Stack, Post, Favorite
from functools import wraps
from flask_caching import Cache
import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash


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
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    from werkzeug.middleware.proxy_fix import ProxyFix
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

cache = Cache(app, config={
    'CACHE_TYPE': 'SimpleCache',
    'CACHE_DEFAULT_TIMEOUT': 60  # seconds
})

@app.context_processor
def inject_helpers():
    def avatar_url(user):
        if not user:
            return '/static/images/Ellipse-2.png'
        return user.profile_photo or '/static/images/Ellipse-2.png'
    def is_online(user):
        try:
            return bool(user and user.is_online)
        except Exception:
            return False
    def current_user():
        try:
            uid = session.get('user_id')
            return User.get_by_id(uid) if uid else None
        except Exception:
            return None
    return dict(avatar_url=avatar_url, is_online=is_online, current_user=current_user)


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


# ---------------------------
# SESSION VERIFICATION DECORATORS
# ---------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect('/login')
        return f(*args, **kwargs)

    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect('/login')
        if not session.get('is_admin', False):
            return abort(403)  # Forbidden
        return f(*args, **kwargs)

    return decorated_function


# ---------------------------
# INDEX ROUTE
# ---------------------------
@app.route('/')
def index():
    # If user is logged in, redirect to dashboard
    if 'user_id' in session:
        return redirect('/dashboard')
    return render_template('index.html')


# Lightweight health check endpoint (no DB access)
@app.route('/healthz')
def healthz():
    return jsonify({'status': 'ok', 'time': datetime.utcnow().isoformat() + 'Z'}), 200


# ---------------------------
# DASHBOARD ROUTE
# ---------------------------
@app.route('/dashboard')
@login_required
@cache.cached(timeout=60, query_string=True)
def dashboard():
    try:
        user = User.get_by_id(session['user_id'])
        posts = Post.select().order_by(Post.created_at.desc())
        # Ensure Get Started doc exists and fetch its id
        try:
            gs_doc = ensure_get_started_doc(user.id)
            get_started_doc_id = gs_doc.id
        except Exception:
            get_started_doc_id = None
        return render_template('dashboard.html', user=user, posts=posts, get_started_doc_id=get_started_doc_id)
    except DoesNotExist:
        session.clear()
        return redirect('/login')



# ---------------------------
# LOGIN ROUTE
# ---------------------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    # If user is already logged in, redirect to dashboard
    if 'user_id' in session:
        return redirect('/dashboard')

    if request.method == 'POST':
        # Handle JSON data from the form
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
        else:
            # Fallback for form data
            email = request.form.get('email')
            password = request.form.get('password')

        if not email or not password:
            if request.is_json:
                return jsonify({'error': 'Email and password required'}), 400
            return 'Email and password required', 400

        try:
            user = User.get(User.email == email)
            # Use secure password checking
            if check_password_hash(user.password, password):
                # Set session
                session['user_id'] = user.id
                session['username'] = user.username
                # Set admin flag based on user role
                session['is_admin'] = user.is_admin()

                if request.is_json:
                    return jsonify({'message': 'Login successful', 'redirect': '/dashboard'}), 200
                return redirect('/dashboard')
            else:
                if request.is_json:
                    return jsonify({'error': 'Invalid credentials'}), 401
                return 'Invalid credentials', 401
        except DoesNotExist:
            if request.is_json:
                return jsonify({'error': 'Invalid credentials'}), 401
            return 'Invalid credentials', 401

    return render_template('login.html')


# ---------------------------
# SIGNUP ROUTE
# ---------------------------
@app.route('/signup', methods=['POST'])
def signup():
    if not request.is_json:
        return jsonify({'error': 'Expected JSON'}), 400

    try:
        data = request.get_json()

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not all([username, email, password]):
            return jsonify({'error': 'All fields are required'}), 400

        # Create user in the database with hashed password
        hashed_password = generate_password_hash(password)
        user = User.create(
            username=username,
            email=email,
            password=hashed_password
        )

        # Automatically log in the user after signup
        session['user_id'] = user.id
        session['username'] = user.username

        return jsonify({
            'message': 'User created successfully',
            'id': user.id,
            'redirect': '/dashboard'
        }), 201

    except IntegrityError:
        return jsonify({'error': 'Username or email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---------------------------
# LOGOUT ROUTE
# ---------------------------
@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# ---------------------------
# SETTINGS / PROFILE ROUTES
# ---------------------------
@app.route('/settings', methods=['GET'])
@login_required
def settings():
    try:
        user = User.get_by_id(session['user_id'])
        return render_template('settings.html', user=user)
    except DoesNotExist:
        session.clear()
        return redirect('/login')

@app.route('/profile/photo', methods=['POST'])
@login_required
def upload_profile_photo():
    try:
        if 'photo' not in request.files:
            return redirect('/settings?error=No file part')
        file = request.files['photo']
        if file.filename == '':
            return redirect('/settings?error=No selected file')
        if file and _allowed_file(file.filename):
            # Make a safe unique filename
            from werkzeug.utils import secure_filename
            name = secure_filename(file.filename)
            # Prefix with user id and timestamp
            ts = int(time.time())
            filename = f"u{session['user_id']}_{ts}_{name}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            rel_url = f"/static/uploads/{filename}"
            # Update user
            user = User.get_by_id(session['user_id'])
            user.profile_photo = rel_url
            user.save()
            # Update session username unchanged; nothing else required
            return redirect('/settings?success=Photo updated')
        else:
            return redirect('/settings?error=Invalid file type')
    except Exception as e:
        return redirect(f"/settings?error={str(e)}")


# ---------------------------
# API ROUTES (Protected)
# ---------------------------
@app.route('/api/stacks')
@login_required
@cache.cached(timeout=120, query_string=True)
def get_stacks():
    # Your filtering logic remains unchanged
    difficulty = request.args.get('difficulty')
    technology = request.args.get('technology')
    sort_by = request.args.get('sort', 'latest')

    query = Stack.select()

    if difficulty and difficulty != 'all':
        query = query.where(Stack.difficulty == difficulty)

    if technology and technology != 'all':
        query = query.where(Stack.technologies.contains(technology))

    if sort_by == 'popular':
        query = query.order_by(Stack.usage_count.desc())
    elif sort_by == 'rating':
        query = query.order_by(Stack.rating.desc())
    else:
        query = query.order_by(Stack.created_at.desc())

    stacks = []
    for stack in query:
        stacks.append({
            'id': stack.id,
            'name': stack.name,
            'description': stack.description,
            'difficulty': stack.difficulty,
            'rating': stack.rating,
            'usage_count': stack.usage_count,
            'technologies': stack.technologies,
            'created_at': stack.created_at.isoformat()
        })

    return jsonify(stacks)


@app.route('/api/stacks/<int:stack_id>', methods=['GET'])
@login_required
def get_stack_detail(stack_id):
    try:
        stack = Stack.get_by_id(stack_id)
        return jsonify({
            'id': stack.id,
            'name': stack.name,
            'description': stack.description,
            'difficulty': stack.difficulty,
            'rating': stack.rating,
            'usage_count': stack.usage_count,
            'technologies': stack.technologies,
            'code_snippet': stack.code_snippet,
            'created_at': stack.created_at.isoformat()
        })
    except Stack.DoesNotExist:
        return jsonify({'error': 'Stack not found'}), 404


@app.route('/api/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    total_stacks = Stack.select().count()
    # Add more stats as needed
    return jsonify({
        'total_stacks': total_stacks,
        'favorites': 12,  # This would come from user favorites table
        'contributors': 1200,
        'new_this_week': 8
    })


# ---------------------------
# ADDITIONAL DASHBOARD API ROUTES
# ---------------------------
@app.route('/api/user/favorites', methods=['GET'])
@login_required
def get_user_favorites_api():
    """API endpoint to get a user's favorite posts with optional tag filtering"""
    try:
        user_id = session['user_id']
        tag_filter = request.args.get('tag', None)
        
        # Query to get all favorites for the current user
        query = (Favorite
                .select(Favorite, Post)
                .join(Post)
                .where(Favorite.user == user_id)
                .order_by(Favorite.created_at.desc()))
        
        # Apply tag filtering if specified
        if tag_filter:
            query = query.where(Post.tags.contains(tag_filter))
        
        favorites = []
        for fav in query:
            favorites.append({
                'id': fav.post.id,
                'title': fav.post.title,
                'tags': fav.post.tags.split(','),
                'category': fav.post.category,
                'created_at': fav.post.created_at.strftime('%B %d, %Y'),
                'favorited_at': fav.created_at.strftime('%B %d, %Y'),
                'excerpt': fav.post.content[:200] + '...' if len(fav.post.content) > 200 else fav.post.content
            })
        
        return jsonify(favorites)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/favorites')
@login_required
def favorites_page():
    """Render the favorites page"""
    try:
        user_id = session['user_id']
        user = User.get_by_id(user_id)
        
        # Get all unique tags from user's favorited posts for the filter dropdown
        tag_query = (Post
                    .select(Post.tags)
                    .join(Favorite)
                    .where(Favorite.user == user_id)
                    .distinct())
        
        all_tags = set()
        for post in tag_query:
            post_tags = post.tags.split(',')
            for tag in post_tags:
                if tag.strip():  # Only add non-empty tags
                    all_tags.add(tag.strip())
        
        # Sort tags alphabetically
        all_tags = sorted(list(all_tags))
        
        # Get the selected tag filter from query parameters
        selected_tag = request.args.get('tag', None)
        
        return render_template('favorites.html', 
                              user=user, 
                              all_tags=all_tags,
                              selected_tag=selected_tag)
    except DoesNotExist:
        session.clear()
        return redirect('/login')
    except Exception as e:
        return render_template('404.html'), 404


@app.route('/api/user/contributions', methods=['GET'])
@login_required
def get_user_contributions():
    # This would query user's contributed stacks
    return jsonify([])


@app.route('/api/stacks/<int:stack_id>/favorite', methods=['POST'])
@login_required
def toggle_stack_favorite(stack_id):
    # Implementation for favoriting/unfavoriting stacks
    return jsonify({'message': 'Stack favorite toggled'})


@app.route('/api/posts/<int:post_id>/favorite', methods=['POST'])
@login_required
def toggle_post_favorite(post_id):
    """Toggle favorite status for a post"""
    try:
        # Get the current user
        user_id = session['user_id']
        
        # Check if the post exists
        post = Post.get_or_none(Post.id == post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Check if the post is already favorited by this user
        favorite = Favorite.get_or_none(
            (Favorite.user == user_id) & 
            (Favorite.post == post_id)
        )
        
        if favorite:
            # If already favorited, remove the favorite
            favorite.delete_instance()
            return jsonify({
                'success': True, 
                'favorited': False,
                'message': 'Post removed from favorites'
            })
        else:
            # If not favorited, add it to favorites
            Favorite.create(
                user=user_id,
                post=post_id
            )
            return jsonify({
                'success': True, 
                'favorited': True,
                'message': 'Post added to favorites'
            })
            
    except DoesNotExist:
        return jsonify({'error': 'Post not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/post/<int:post_id>')
@login_required
def view_post(post_id):
    post = Post.get_or_none(Post.id == post_id)
    if not post:
        return render_template('404.html'), 404

    return render_template(
        'post.html',
        post_id=post.id,
        title=post.title,
        tags=post.tags.split(','),
        content=post.content,
        created_at=post.created_at.strftime('%B %d, %Y %I:%M%p EST'),
        author_user=post.author,
        is_author=(post.author == session['user_id']),
        is_admin=session.get('is_admin', False)
    )

# GET all posts
@app.route('/api/posts', methods=['GET'])
@login_required
def get_all_posts():
    posts = Post.select().order_by(Post.created_at.desc())
    return jsonify([
        {
            'id': p.id,
            'title': p.title,
            'tags': p.tags.split(','),
            'created_at': p.created_at.strftime('%B %d, %Y'),
            'excerpt': p.content[:200] + '...'
        }
        for p in posts
    ])

# GET single post
@app.route('/api/posts/<int:post_id>', methods=['GET'])
@login_required
def get_post(post_id):
    post = Post.get_or_none(Post.id == post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    return jsonify({
        'id': post.id,
        'title': post.title,
        'tags': post.tags.split(','),
        'content': post.content,
        'created_at': post.created_at.strftime('%B %d, %Y %I:%M%p EST')
    })

# POST new post (for future team form)
@app.route('/api/posts', methods=['POST'])
@admin_required
def created_post():
    data = request.get_json()
    post = Post.create(
        id=data['id'],
        title=data['title'],
        tags=','.join(data['tags']),
        body=data['content'],  # Map content from request to body field
        category=data.get('category', 'frontend'),  # Default to frontend if not provided
        author=session['user_id'],
        created_at=datetime.now()
    )
    return jsonify({'id': post.id})


@app.route('/create-post', methods=['GET', 'POST'])
@admin_required
def create_post():
    if request.method == 'POST':
        data = request.form
        try:
            Post.create(
                id=data['id'],
                title=data['title'],
                summary=data['summary'],
                body=data['body'],
                tags=data['tags'],
                category=data['category'],
                author=session['user_id'],
            )
            return redirect('/dashboard')
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return render_template('create_post.html')


@app.route('/edit-post/<int:post_id>', methods=['GET', 'POST'])
@login_required
def edit_post(post_id):
    post = Post.get_or_none(Post.id == post_id)
    
    if not post:
        return render_template('404.html'), 404
        
    # Check if the current user is the author of the post or an admin
    if post.author != session['user_id'] and not session.get('is_admin', False):
        return abort(403)  # Forbidden
    
    if request.method == 'POST':
        data = request.form
        try:
            post.id=data['id']
            post.title = data['title']
            post.summary = data['summary']
            post.body = data['body']
            post.tags = data['tags']
            post.category = data['category']
            post.save()
            return redirect(f'/post/{post_id}')
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # For GET request, render the edit form with the post data
    return render_template('create_post.html', post=post, edit_mode=True)


@app.route('/delete-post/<int:post_id>', methods=['GET', 'DELETE'])
@login_required
def delete_post(post_id):
    post = Post.get_or_none(Post.id == post_id)
    
    if not post:
        return render_template('404.html'), 404
        
    # Check if the current user is the author of the post or an admin
    if post.author != session['user_id'] and not session.get('is_admin', False):
        return abort(403)  # Forbidden
    
    try:
        post.delete_instance()
        # For DELETE requests, return a JSON response
        if request.method == 'DELETE':
            return jsonify({'success': True, 'message': 'Post deleted successfully'}), 200
        # For GET requests, redirect to dashboard
        return redirect('/dashboard')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


# ---------------------------
# ADMIN ROUTES
# ---------------------------
@app.route('/admin')
@admin_required
def admin_dashboard():
    """Admin dashboard for managing users and roles"""
    users = User.select().order_by(User.id)
    success_message = request.args.get('success')
    error_message = request.args.get('error')
    return render_template('admin.html', users=users, 
                          success_message=success_message,
                          error_message=error_message)


@app.route('/admin/update-role/<int:user_id>', methods=['POST'])
@admin_required
def update_user_role(user_id):
    """Update a user's role"""
    try:
        user = User.get_by_id(user_id)
        new_role = request.form.get('role')
        
        if new_role not in ['user', 'admin']:
            return redirect('/admin?error=Invalid role specified')
        
        user.role = new_role
        user.save()
        
        # If the user updated their own role, update the session
        if user_id == session.get('user_id'):
            session['is_admin'] = (new_role == 'admin')
            
        return redirect('/admin?success=Role updated successfully')
    except DoesNotExist:
        return redirect('/admin?error=User not found')
    except Exception as e:
        return redirect(f'/admin?error={str(e)}')

@app.route('/community')
@cache.cached(timeout=300, query_string=True)
def community():
    """Render the community page with filterable posts feed"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        selected_tag = request.args.get('tag')
        per_page = 10

        # Base query for posts
        query = Post.select().order_by(Post.created_at.desc())

        # Apply tag filter if specified
        if selected_tag:
            query = query.where(Post.tags.contains(selected_tag))

        # Get total count for pagination
        total_posts = query.count()
        total_pages = (total_posts + per_page - 1) // per_page

        # Apply pagination
        posts = query.paginate(page, per_page)

        # Get all unique tags for filter dropdown
        tag_query = Post.select(Post.tags).distinct()
        all_tags = set()
        for post in tag_query:
            post_tags = post.tags.split(',')
            for tag in post_tags:
                if tag.strip():
                    all_tags.add(tag.strip())

        return render_template('community.html',
                               posts=posts,
                               all_tags=sorted(list(all_tags)),
                               selected_tag=selected_tag,
                               current_page=page,
                               total_pages=total_pages)
    except Exception as e:
        return render_template('404.html'), 404


@app.route('/favorites')
@login_required
def favorites():
    """Render the favorites page"""
    try:
        user_id = session['user_id']
        user = User.get_by_id(user_id)

        # Get all unique tags from user's favorited posts for the filter dropdown
        tag_query = (Post
                     .select(Post.tags)
                     .join(Favorite)
                     .where(Favorite.user == user_id)
                     .distinct())

        all_tags = set()
        for post in tag_query:
            post_tags = post.tags.split(',')
            for tag in post_tags:
                if tag.strip():  # Only add non-empty tags
                    all_tags.add(tag.strip())

        # Sort tags alphabetically
        all_tags = sorted(list(all_tags))

        # Get the selected tag filter from query parameters
        selected_tag = request.args.get('tag', None)

        return render_template('favorites.html',
                               user=user,
                               all_tags=all_tags,
                               selected_tag=selected_tag)
    except DoesNotExist:
        session.clear()
        return redirect('/login')
    except Exception as e:
        return render_template('404.html'), 404


# ---------------------------
# DOCS SUPPORT
# ---------------------------

def ensure_get_started_doc(author_id: int):
    """Ensure a 'Get Started' document exists as a Post with category 'docs'."""
    try:
        doc = Post.get_or_none((Post.category == 'docs') & (Post.title == 'Get Started'))
        if doc:
            return doc
        last = Post.select().order_by(Post.id.desc()).first()
        next_id = (last.id + 1) if last else 1000
        body = (
            "<div class='post-content-headers'>Welcome to Stack-it</div>"
            "<p>Thanks for signing in. This short guide will show you how to navigate your dashboard and find code for your stacks.</p>"
            "<div class='post-content-headers-2'>What you can do</div>"
            "<ul><li>Browse Frontend and Backend posts.</li><li>Open Docs for curated guides.</li><li>Favorite posts to find them quickly.</li></ul>"
            "<div class='post-content-headers-2'>Next steps</div>"
            "<ol><li>Explore the tabs on your dashboard.</li><li>Open a post to view details and copy snippets.</li><li>Come back to this Get Started doc anytime from the banner.</li></ol>"
        )
        return Post.create(
            id=next_id,
            title='Get Started',
            summary='How to get started with Stack-it',
            body=body,
            tags='docs,getting-started',
            category='docs',
            author=author_id,
        )
    except Exception as e:
        raise e

@app.route('/docs/<int:doc_id>')
@login_required
def view_doc(doc_id: int):
    post = Post.get_or_none(Post.id == doc_id)
    if not post:
        return render_template('404.html'), 404
    return render_template(
        'docs.html',
        post_id=post.id,
        title=post.title,
        tags=post.tags.split(',') if post.tags else [],
        content=post.content,
        created_at=post.created_at.strftime('%B %d, %Y %I:%M%p EST'),
        author_user=post.author,
        is_author=(post.author == session.get('user_id')),
        is_admin=session.get('is_admin', False)
    )

# ---------------------------
# DEBUG MODE ENTRY POINT
# ---------------------------
if __name__ == '__main__':
    db.connect()
    db.create_tables([User, Stack, Post, Favorite])
    app.run(debug=True, port=5000)



