# Favorites Feature Implementation

## Overview

This document describes the implementation of a favorites feature for Stack-It that allows users to save posts for later review. The feature includes:

1. Ability to add/remove posts to favorites
2. A dedicated favorites page to view saved posts
3. Filtering favorites by tags
4. Visual indicators for favorited posts

## Changes Made

### 1. Database Model

A new `Favorite` model was added to `db.py` to establish a many-to-many relationship between users and posts:

```python
class Favorite(BaseModel):
    """Model to store user favorites"""
    user = ForeignKeyField(User, backref='favorites', on_delete='CASCADE')
    post = ForeignKeyField(Post, backref='favorited_by', on_delete='CASCADE')
    created_at = DateTimeField(default=datetime.now)
    
    class Meta:
        # Ensure a user can only favorite a post once
        indexes = (
            (('user', 'post'), True),  # Unique index on user and post
        )
```

### 2. Backend Routes

The following routes were added to `main.py`:

- `POST /api/posts/<post_id>/favorite`: Toggle favorite status for a post
- `GET /api/user/favorites`: Get a user's favorite posts with optional tag filtering
- `GET /favorites`: Render the favorites page

### 3. Frontend Components

#### Favorites Page

A new `favorites.html` template was created with:
- Tag filtering dropdown
- Dynamic loading of favorites via JavaScript
- Ability to remove posts from favorites directly from the page

#### Favorite Buttons

Favorite buttons were added to:
- Post detail page (`post.html`)
- Dashboard posts (`dashboard.html`)

The buttons dynamically update their appearance based on whether a post is favorited or not.

### 4. JavaScript Functionality

JavaScript was implemented to:
- Check if posts are already favorited
- Toggle favorite status when the button is clicked
- Update button appearance based on favorite status
- Load and filter favorites on the favorites page

## How to Use

### Adding/Removing Favorites

1. Navigate to the dashboard or a post detail page
2. Click the heart icon labeled "Add to Favorites" next to any post
3. The heart will turn orange and the text will change to "Remove from Favorites"
4. Click again to remove from favorites

### Viewing Favorites

1. Click on "Favorites" in the navigation bar
2. All your favorited posts will be displayed
3. Use the tag filter dropdown to filter by specific tags
4. Click on a post title to view the full post
5. Click "Remove from Favorites" to remove a post from your favorites

## Testing

### Manual Testing

1. Log in to your account
2. Navigate to the dashboard and favorite a few posts
3. Click on "Favorites" in the navigation bar to view your favorites
4. Try filtering by different tags
5. Remove some posts from your favorites
6. Verify that the favorites are correctly added/removed

### Automated Testing

A test script is provided to verify the favorites functionality:

```bash
# Install the requests module if you don't have it
pip install requests

# Run the test script
python test_favorites.py <email> <password> <post_id>
```

Replace the parameters with your actual credentials and a valid post ID.

The test script checks:
1. Adding a post to favorites
2. Removing a post from favorites
3. Retrieving a user's favorites
4. Filtering favorites by tag
5. Accessing the favorites page

## Technical Details

### Database Schema

The `Favorite` model creates a join table between users and posts with the following structure:

- `user`: Foreign key to the User model
- `post`: Foreign key to the Post model
- `created_at`: Timestamp of when the favorite was created

The table has a unique index on the combination of user and post to ensure a user can only favorite a post once.

### API Endpoints

#### Toggle Favorite

```
POST /api/posts/<post_id>/favorite
```

**Response:**
```json
{
  "success": true,
  "favorited": true,
  "message": "Post added to favorites"
}
```

Or when removing from favorites:

```json
{
  "success": true,
  "favorited": false,
  "message": "Post removed from favorites"
}
```

#### Get Favorites

```
GET /api/user/favorites?tag=<optional_tag>
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Post Title",
    "tags": ["tag1", "tag2"],
    "category": "frontend",
    "created_at": "August 7, 2025",
    "favorited_at": "August 7, 2025",
    "excerpt": "Post excerpt..."
  },
  {
    "id": 2,
    "title": "Another Post",
    "tags": ["tag3", "tag4"],
    "category": "backend",
    "created_at": "August 6, 2025",
    "favorited_at": "August 7, 2025",
    "excerpt": "Another post excerpt..."
  }
]
```

## Future Improvements

Potential enhancements for the favorites feature:

1. **Favorite Collections**: Allow users to organize favorites into collections
2. **Bulk Actions**: Add ability to favorite/unfavorite multiple posts at once
3. **Sorting Options**: Add options to sort favorites by date added, post date, etc.
4. **Export Functionality**: Allow users to export their favorites list
5. **Favorite Notifications**: Notify users when favorited posts are updated

## Conclusion

The favorites feature enhances the user experience by allowing users to save posts for later reference. The implementation is fully integrated with the existing codebase and follows the same design patterns and styling.