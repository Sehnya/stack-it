# Stack-It Navigation and User Roles Implementation

This document describes the changes made to implement a cohesive navigation bar across all pages and a user role system with admin capabilities.

## Changes Made

### 1. Navigation Bar Consistency

A reusable navigation bar component has been created to ensure consistency across all pages:

- Created a new template file `_navbar.html` that includes:
  - Home, Favorites, Community links for all logged-in users
  - Create Post link for admin users only
  - User menu dropdown with appropriate options based on user role
  - Login/Signup options for guests

- Updated all template files to use the new navigation component:
  - dashboard.html
  - create_post.html
  - post.html
  - 404.html
  - community.html
  - db_error.html

### 2. User Role System

A user role system has been implemented to distinguish between admin and regular users:

- Modified the User model in `db.py` to add a role field with possible values 'user' and 'admin'
- Created a migration script `migrate_add_role.py` to add the role field to existing users
- Implemented role-based access control in `main.py` with an admin_required decorator
- Added admin functionality to assign admin roles to other users
- Restricted post creation and admin views to admin users only

## How to Use

### Running the Migration Script

To add the role field to existing users and set the admin role for a specific user:

```bash
python migrate_add_role.py <admin_email>
```

Replace `<admin_email>` with the email of the user you want to make an admin.

### Accessing Admin Features

Once you've set up an admin user, you can:

1. Log in as the admin user
2. Access the admin dashboard at `/admin`
3. Manage user roles by selecting 'Admin' or 'User' for each user and clicking 'Save'
4. Create new posts using the 'Create New Post' link in the navigation bar

### Testing the Implementation

A test script has been provided to verify that all the changes work correctly:

```bash
# Install the requests module if you don't have it
pip install requests

# Run the test script
python test_user_roles.py <admin_email> <admin_password> <regular_user_email> <regular_user_password>
```

Replace the parameters with actual user credentials.

The test script checks:
1. Navigation consistency across all pages
2. Role-based access control
3. Admin functionality to assign roles

## Technical Details

### Navigation Bar Component

The navigation bar component uses Jinja2's include directive and conditional rendering:

```html
{% include '_navbar.html' %}
```

The component checks if the user is logged in and if they have admin privileges:

```html
{% if session.get('user_id') %}
    <!-- Navigation for logged-in users -->
    {% if session.get('is_admin', False) %}
        <!-- Admin-only features -->
    {% endif %}
{% else %}
    <!-- Navigation for guests -->
{% endif %}
```

### User Role System

The User model has been extended with a role field and an is_admin method:

```python
class User(BaseModel):
    id = AutoField()
    username = CharField(unique=True)
    email = CharField(unique=True)
    password = CharField()
    role = CharField(default='user')  # Possible values: 'user', 'admin'
    
    def is_admin(self):
        """Check if the user has admin role"""
        return self.role == 'admin'
```

The admin_required decorator checks if the user has admin privileges:

```python
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect('/login')
        if not session.get('is_admin', False):
            return abort(403)  # Forbidden
        return f(*args, **kwargs)
    return decorated_function
```

The login route sets the is_admin flag in the session based on the user's role:

```python
session['is_admin'] = user.is_admin()
```

## Troubleshooting

If you encounter any issues:

1. Make sure you've run the migration script to add the role field to existing users
2. Check that you've set the admin role for at least one user
3. Verify that you're logged in as an admin user to access admin features
4. If the navigation bar doesn't appear consistent across all pages, clear your browser cache

For any other issues, please refer to the test script output for detailed error messages.