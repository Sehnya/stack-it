from datetime import datetime
from flask import session
from db import User


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


def _allowed_file(filename: str) -> bool:
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    return "." in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def ensure_get_started_doc(author_id: int):
    """Ensure a 'Get Started' document exists as a Post with category 'docs'."""
    from db import Post
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