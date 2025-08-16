from flask import Blueprint, render_template, session

from db import Post
from utils.decorators import login_required

docs_bp = Blueprint('docs', __name__)


@docs_bp.route('/docs/<int:doc_id>')
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