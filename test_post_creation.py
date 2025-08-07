"""
Test script for post creation functionality.
This script tests direct database creation of posts.
"""
import os
import sys
from datetime import datetime

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the necessary modules
from db import db, Post, User

def test_direct_db_creation():
    """Test creating a post directly in the database"""
    print("Testing direct database post creation...")
    
    try:
        # Connect to the database
        db.connect()
        
        # First, make sure we have a test user
        test_user, created = User.get_or_create(
            username="testuser",
            defaults={
                'email': 'test@example.com',
                'password': 'password123'
            }
        )
        
        # Create a test post
        test_post = Post.create(
            title="Test Post",
            summary="This is a test post summary",
            body="This is the body of the test post. It contains the main content.",
            tags="test,post,creation",
            category="frontend",
            author=test_user,
            created_at=datetime.now()
        )
        
        # Verify the post was created
        print(f"Post created with ID: {test_post.id}")
        print(f"Post title: {test_post.title}")
        print(f"Post body: {test_post.body}")
        print(f"Post content (via property): {test_post.content}")
        print(f"Post tags: {test_post.tags}")
        print(f"Post category: {test_post.category}")
        print(f"Post author: {test_post.author.username}")
        print(f"Post created at: {test_post.created_at}")
        
        # Clean up - delete the test post
        test_post.delete_instance()
        print("Test post deleted")
        
        print("Direct database post creation test passed!")
        return True
        
    except Exception as e:
        print(f"Error in direct database post creation test: {e}")
        return False
    finally:
        # Close the database connection
        if not db.is_closed():
            db.close()

if __name__ == "__main__":
    # Run the test
    db_test_result = test_direct_db_creation()
    
    # Print overall results
    print("\nTest Results:")
    print(f"Direct DB Creation: {'PASSED' if db_test_result else 'FAILED'}")
    
    # Exit with appropriate status code
    sys.exit(0 if db_test_result else 1)