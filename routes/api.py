from flask import Blueprint, request, jsonify, session
from flask_caching import Cache
from peewee import DoesNotExist

from db import Stack, Post, Favorite, User
from utils.decorators import login_required

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Cache will be initialized from main app
cache = None


def init_cache(app_cache):
    global cache
    cache = app_cache


@api_bp.route('/stacks')
@login_required
def get_stacks():
    # Apply caching if available
    if cache:
        cache_key = f"stacks_{request.query_string.decode()}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
    
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

    result = jsonify(stacks)
    
    # Cache the result if caching is available
    if cache:
        cache.set(cache_key, result, timeout=120)
    
    return result


@api_bp.route('/stacks/<int:stack_id>', methods=['GET'])
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


@api_bp.route('/stats', methods=['GET'])
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


@api_bp.route('/user/favorites', methods=['GET'])
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


@api_bp.route('/user/contributions', methods=['GET'])
@login_required
def get_user_contributions():
    # This would query user's contributed stacks
    return jsonify([])


@api_bp.route('/stacks/<int:stack_id>/favorite', methods=['POST'])
@login_required
def toggle_stack_favorite(stack_id):
    # Implementation for favoriting/unfavoriting stacks
    return jsonify({'message': 'Stack favorite toggled'})


@api_bp.route('/posts/<int:post_id>/favorite', methods=['POST'])
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


@api_bp.route('/posts', methods=['GET'])
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


@api_bp.route('/posts/<int:post_id>', methods=['GET'])
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