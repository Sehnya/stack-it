
from datetime import datetime

from flask import Flask, render_template, request, redirect, jsonify, session, abort
from peewee import DoesNotExist, IntegrityError
from db import User, db, Stack, Post
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

# Set additional security and production configurations
if os.environ.get('FLASK_ENV') == 'production':
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['PREFERRED_URL_SCHEME'] = 'https'
    
    # Configure static files for production
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000  # 1 year in seconds
    
    # Add CSP and other security headers
    @app.after_request
    def add_security_headers(response):
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response

cache = Cache(app, config={
    'CACHE_TYPE': 'SimpleCache',
    'CACHE_DEFAULT_TIMEOUT': 60  # seconds
})


@app.before_request
def _db_connect():
    global DB_CIRCUIT_BREAKER
    
    # Skip database connection for static resources
    if request.path.startswith('/static/'):
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
        return render_template('dashboard.html', user=user, posts=posts)
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
def get_user_favorites():
    # This would query a favorites table when implemented
    return jsonify([])


@app.route('/api/user/contributions', methods=['GET'])
@login_required
def get_user_contributions():
    # This would query user's contributed stacks
    return jsonify([])


@app.route('/api/stacks/<int:stack_id>/favorite', methods=['POST'])
@login_required
def toggle_favorite(stack_id):
    # Implementation for favoriting/unfavoriting stacks
    return jsonify({'message': 'Favorite toggled'})


@app.route('/post/<int:post_id>')
@login_required
def view_post(post_id):
    post = Post.get_or_none(Post.id == post_id)
    if not post:
        return render_template('404.html'), 404

    return render_template(
        'post.html',
        title=post.title,
        tags=post.tags.split(','),
        content=post.content,
        created_at=post.created_at.strftime('%B %d, %Y %I:%M%p EST')
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



# ---------------------------
# DEBUG MODE ENTRY POINT
# ---------------------------
if __name__ == '__main__':
    db.connect()
    db.create_tables([User, Stack, Post])
    app.run(debug=True, port=5000)

