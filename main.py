

from flask import Flask, render_template, request, redirect, jsonify, session
from peewee import DoesNotExist, IntegrityError
from db import User, db, Stack, Post
from functools import wraps
from flask_caching import Cache
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv()

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
    if db.is_closed():
        db.connect()


@app.teardown_request
def _db_close(exc):
    if not db.is_closed():
        db.close()


# ---------------------------
# SESSION VERIFICATION DECORATOR
# ---------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect('/login')
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
@login_required
def created_post():
    data = request.get_json()
    post = Post.create(
        title=data['title'],
        tags=','.join(data['tags']),
        content=data['content'],
        created_at=Post.created_at.isoformat()
    )
    return jsonify({'id': post.id})


@app.route('/create-post', methods=['GET', 'POST'])
@login_required
def create_post():
    if request.method == 'POST':
        data = request.form
        try:
            Post.create(
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


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404

# ---------------------------
# DEBUG MODE ENTRY POINT
# ---------------------------
if __name__ == '__main__':
    db.connect()
    db.create_tables([User, Stack, Post])
    app.run(debug=True, port=5000)