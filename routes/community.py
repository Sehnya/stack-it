from flask import Blueprint, render_template, request, redirect, session
from flask_caching import Cache
from peewee import DoesNotExist

from db import User, Post, Favorite
from utils.decorators import login_required

community_bp = Blueprint('community', __name__)

# Cache will be initialized from main app
cache = None


def init_cache(app_cache):
    global cache
    cache = app_cache


@community_bp.route('/community')
def community():
    """Render the community page with filterable posts feed"""
    
    # Apply caching if available
    if cache:
        cache_key = f"community_{request.query_string.decode()}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
    
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

        result = render_template('community.html',
                              posts=posts,
                              all_tags=sorted(list(all_tags)),
                              selected_tag=selected_tag,
                              current_page=page,
                              total_pages=total_pages)
        
        # Cache the result if caching is available
        if cache:
            cache.set(cache_key, result, timeout=300)
        
        return result
        
    except Exception as e:
        return render_template('404.html'), 404


@community_bp.route('/favorites')
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