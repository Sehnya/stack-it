from flask import Blueprint, render_template, request, redirect, session, jsonify, current_app
from peewee import DoesNotExist

from db import User, Stack, Post, Favorite, db, USE_SQLITE
from utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


@admin_bp.route('/')
@admin_required
def admin_dashboard():
    """Admin dashboard for managing users and roles"""
    users = User.select().order_by(User.id)
    success_message = request.args.get('success')
    error_message = request.args.get('error')
    return render_template('admin.html', users=users, 
                          success_message=success_message,
                          error_message=error_message)


@admin_bp.route('/update-role/<int:user_id>', methods=['POST'])
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


@admin_bp.route('/db-viewer')
@admin_required
def db_viewer():
    """Database viewer for local development (SQLite only)"""
    # Only allow in debug mode with SQLite
    if not current_app.debug or not USE_SQLITE:
        return "Database viewer is only available in local development mode with SQLite", 403

    # Get all tables
    tables = {
        'user': User,
        'stack': Stack,
        'post': Post,
        'favorite': Favorite
    }

    # Get counts for each table
    table_info = []
    for table_name, model in tables.items():
        count = model.select().count()
        table_info.append({
            'name': table_name,
            'count': count,
            'model': model._meta.table_name
        })

    selected_table = request.args.get('table', 'user')
    page = int(request.args.get('page', 1))
    per_page = 50

    # Get data from selected table
    if selected_table in tables:
        model = tables[selected_table]
        total = model.select().count()
        data = list(model.select().paginate(page, per_page).dicts())

        # Get column names
        columns = list(data[0].keys()) if data else []

        # Calculate pagination
        total_pages = (total + per_page - 1) // per_page

        return render_template('db_viewer.html',
                             tables=table_info,
                             selected_table=selected_table,
                             columns=columns,
                             data=data,
                             page=page,
                             total_pages=total_pages,
                             total=total)

    return "Invalid table", 400


@admin_bp.route('/db-viewer/query', methods=['POST'])
@admin_required
def db_query():
    """Execute a read-only SQL query (local development only)"""
    # Only allow in debug mode with SQLite
    if not current_app.debug or not USE_SQLITE:
        return jsonify({"error": "Query execution is only available in local development mode"}), 403

    query = request.form.get('query', '').strip()

    # Basic safety check - only allow SELECT queries
    if not query.upper().startswith('SELECT'):
        return jsonify({"error": "Only SELECT queries are allowed"}), 400

    try:
        cursor = db.execute_sql(query)
        rows = cursor.fetchall()

        # Get column names
        columns = [desc[0] for desc in cursor.description] if cursor.description else []

        # Convert to list of dicts
        result = []
        for row in rows:
            result.append(dict(zip(columns, row)))

        return jsonify({
            "success": True,
            "columns": columns,
            "data": result,
            "count": len(result)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400