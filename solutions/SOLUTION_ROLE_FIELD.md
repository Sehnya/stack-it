# Database Column Error Resolution

## Issue

The application was failing with the following error when accessing the dashboard:

```
[2025-08-07 13:27:36,275] ERROR in app: Exception on /dashboard [GET]
psycopg2.errors.UndefinedColumn: column t1.role does not exist
LINE 1: ..., "t1"."username", "t1"."email", "t1"."password", "t1"."role...
                                                             ^
peewee.ProgrammingError: column t1.role does not exist
```

This error occurred because:
1. The User model in `db.py` had a `role` field defined
2. The code was trying to access this field when querying the database
3. The database table didn't have the corresponding column

## Solution

The solution involved running the migration script to add the missing column to the database:

1. Fixed the migration script (`migrate_add_role.py`) to properly check if the column exists
2. Ran the migration script to add the 'role' column to the User table
3. Set the admin role for user SehnyaE

## Verification

We verified the fix by:
1. Creating and running a test script that queries the User model with the role field
2. Confirming that all users have a role value (admin or user)
3. Verifying that admin users can be correctly identified

## Next Steps

The application should now work correctly. Users can log in and access the dashboard without encountering the database error. The role-based access control system is now functional, with:

- SehnyaE as an admin user
- All other users as regular users

If you need to make additional users admins, you can run the migration script again with a different email:

```
python migrate_add_role.py user@email.com
```

## Technical Details

The error occurred because the code was updated to include role-based access control, but the database schema wasn't updated to match. This is a common issue when deploying code changes that include database schema changes.

In the future, consider:
1. Using database migrations as part of your deployment process
2. Testing schema changes in a staging environment before production
3. Including database schema version checks in your application startup