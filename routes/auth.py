import os
import time
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, jsonify, session
from peewee import DoesNotExist, IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from db import User
from utils.decorators import login_required
from utils.helpers import _allowed_file, ensure_get_started_doc

auth_bp = Blueprint('auth', __name__)

# Upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


@auth_bp.route('/')
def index():
    # If user is logged in, redirect to dashboard
    if 'user_id' in session:
        return redirect('/dashboard')
    return render_template('index.html')


@auth_bp.route('/dashboard')
@login_required
def dashboard():
    try:
        from db import Post
        user = User.get_by_id(session['user_id'])
        posts = Post.select().order_by(Post.created_at.desc())
        # Only show welcome banner if user hasn't dismissed it
        get_started_doc_id = None
        if not user.dismissed_welcome_banner:
            try:
                gs_doc = ensure_get_started_doc(user.id)
                get_started_doc_id = gs_doc.id
            except Exception:
                pass
        return render_template('dashboard.html', user=user, posts=posts, get_started_doc_id=get_started_doc_id)
    except DoesNotExist:
        session.clear()
        return redirect('/login')


@auth_bp.route('/login', methods=['GET', 'POST'])
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
            # Use secure password checking with legacy plaintext fallback
            password_ok = False
            try:
                password_ok = check_password_hash(user.password, password)
            except ValueError:
                # Legacy plaintext password detected; compare directly and upgrade to hashed
                if user.password == password:
                    password_ok = True
                    try:
                        user.password = generate_password_hash(password)
                        user.save()
                    except Exception:
                        # If hashing fails, still allow login but do not crash
                        pass

            if password_ok:
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


@auth_bp.route('/signup', methods=['POST'])
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


@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect('/')


@auth_bp.route('/settings', methods=['GET'])
@login_required
def settings():
    try:
        user = User.get_by_id(session['user_id'])
        return render_template('settings.html', user=user)
    except DoesNotExist:
        session.clear()
        return redirect('/login')


@auth_bp.route('/profile/photo', methods=['POST'])
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
            name = secure_filename(file.filename)
            # Prefix with user id and timestamp
            ts = int(time.time())
            filename = f"u{session['user_id']}_{ts}_{name}"
            save_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(save_path)
            rel_url = f"/static/uploads/{filename}"
            # Update user
            user = User.get_by_id(session['user_id'])
            user.profile_photo = rel_url
            user.save()
            return redirect('/settings?success=Photo updated')
        else:
            return redirect('/settings?error=Invalid file type')
    except Exception as e:
        return redirect(f"/settings?error={str(e)}")