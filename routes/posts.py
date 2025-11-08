from datetime import datetime
from flask import Blueprint, render_template, request, redirect, jsonify, session, abort
from peewee import DoesNotExist

from db import Post
from utils.decorators import login_required, admin_required

posts_bp = Blueprint('posts', __name__)


@posts_bp.route('/post/<int:post_id>')
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


@posts_bp.route('/create-post', methods=['GET', 'POST'])
@login_required
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


@posts_bp.route('/edit-post/<int:post_id>', methods=['GET', 'POST'])
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


@posts_bp.route('/delete-post/<int:post_id>', methods=['GET', 'DELETE'])
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


# API route for creating posts
@posts_bp.route('/api/posts', methods=['POST'])
@admin_required
def create_post_api():
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