from flask import Blueprint, render_template, request, redirect, session
from peewee import DoesNotExist

from db import User
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