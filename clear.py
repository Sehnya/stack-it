#!/usr/bin/env python3
"""
Database reset script - clears all data and re-seeds the database.
Run this script with: python clear.py
"""

from db import db, User, Stack, Post, Favorite
from seed import seed_posts
import sys


def clear_database():
    """Drop all tables, recreate them, and re-seed with sample data."""

    print("=" * 60)
    print("  Stack-It Database Reset")
    print("=" * 60)
    print("\n🗑️  Clearing database...")

    # Connect to database
    db.connect()

    try:
        # Drop all tables
        print("\n📋 Dropping tables...")
        db.drop_tables([Favorite, Post, Stack, User], safe=True)
        print("✓ All tables dropped")

        # Recreate tables
        print("\n📋 Creating tables...")
        db.create_tables([User, Stack, Post, Favorite])
        print("✓ All tables created")

        # Close connection before seeding
        db.close()

        # Run seed script
        print("\n🌱 Seeding database with sample data...")
        print("-" * 60)
        seed_posts()
        print("-" * 60)

        print("\n✅ Database reset complete!")
        print("\n📊 Summary:")
        print("   • All tables dropped and recreated")
        print("   • Admin user created: stackit-team (password: password)")
        print("   • 3 sample posts seeded (IDs: 1001-1003)")
        print("\n" + "=" * 60)

    except Exception as e:
        print(f"\n❌ Error during database reset: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        # Ensure connection is closed
        if not db.is_closed():
            db.close()


if __name__ == "__main__":
    clear_database()
