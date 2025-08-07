from datetime import datetime

from peewee import Model, CharField, AutoField, PostgresqlDatabase, FloatField, TextField, DateTimeField, IntegerField, \
    ForeignKeyField
from playhouse.db_url import connect

# Import necessary modules
import psycopg2
import psycopg2.extensions
from dotenv import load_dotenv
import os
import re
import socket

from playhouse.sqlite_ext import AutoIncrementField

# Load environment variables from .env
load_dotenv()

# Configure psycopg2 to prefer IPv4 connections
def force_ipv4_connections():
    # Original connection function
    orig_connect = psycopg2.connect
    
    # Override connect function for Supabase pooler
    def ipv4_connect(*args, **kwargs):
        # Force IPv4 by setting the socket family
        kwargs['connection_factory'] = kwargs.get('connection_factory', psycopg2.extensions.connection)
        
        # Configure options for Supabase pooler
        if 'options' in kwargs:
            kwargs['options'] += " -c statement_timeout=5000"
        else:
            kwargs['options'] = "-c statement_timeout=5000"
        
        # Use getaddrinfo to resolve hostname to IPv4 address
        if 'host' in kwargs and not kwargs.get('hostaddr'):
            try:
                host = kwargs['host']
                # Get only IPv4 addresses (socket.AF_INET)
                addrinfo = socket.getaddrinfo(host, None, socket.AF_INET)
                if addrinfo:
                    # Use the first IPv4 address
                    ipv4_addr = addrinfo[0][4][0]
                    kwargs['hostaddr'] = ipv4_addr
            except socket.gaierror:
                # If hostname resolution fails, continue with original host
                pass
                
        return orig_connect(*args, **kwargs)
    
    # Replace the connect function
    psycopg2.connect = ipv4_connect

# Apply the IPv4 preference
force_ipv4_connections()

# Initialize database connection
# First try with DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

# If DATABASE_URL is not provided, try to construct it from individual variables
if not DATABASE_URL:
    # Try with DB_ prefixed environment variables (used in render.yaml)
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME")
    
    if all([DB_USER, DB_PASSWORD, DB_HOST, DB_NAME]):
        DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        # Fall back to non-prefixed variables (used in local .env)
        USER = os.getenv("user")
        PASSWORD = os.getenv("password")
        HOST = os.getenv("host")
        PORT = os.getenv("port")
        DBNAME = os.getenv("dbname")
        
        if all([USER, PASSWORD, HOST, PORT, DBNAME]):
            DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}"
        else:
            raise ValueError("❌ Database configuration not found. Either DATABASE_URL or individual connection parameters must be set.")

# Connect to the database using playhouse.db_url
# For Supabase pooler, we need to disable prepared statements
db = connect(DATABASE_URL)

# Define a function to test the connection
def test_connection():
    try:
        # Extract connection parameters from DATABASE_URL
        pattern = r'postgresql:\/\/(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:]+):(?P<port>\d+)\/(?P<database>[^\s?]+)'
        match = re.match(pattern, DATABASE_URL)
        
        if not match:
            raise ValueError("❌ Invalid DATABASE_URL format")
        
        params = match.groupdict()
        
        # Configure connection for Supabase pooler
        connection = psycopg2.connect(
            user=params['user'],
            password=params['password'],
            host=params['host'],
            port=params['port'],
            dbname=params['database'],
            options="-c statement_timeout=5000"  # Set statement timeout for Supabase pooler
        )
        print("Connection successful!")

        # Create a cursor to execute SQL queries
        cursor = connection.cursor()

        # Example query
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()
        print("Current Time:", result)

        # Close the cursor and connection
        cursor.close()
        connection.close()
        print("Connection closed.")
        return True

    except Exception as e:
        print(f"Failed to connect: {e}")
        return False


# ✅ Base model to bind models to the database
class BaseModel(Model):
    class Meta:
        database = db

# ✅ Example user model
class User(BaseModel):
    id = AutoField()
    username = CharField(unique=True)
    email = CharField(unique=True)
    password = CharField()
    role = CharField(default='user')  # Possible values: 'user', 'admin'
    # Profile photo relative URL under static/ (e.g., '/static/uploads/abc.png')
    profile_photo = CharField(null=True)
    # Last time the user made a request; used for online status indicator
    last_seen = DateTimeField(null=True)
    
    def is_admin(self):
        """Check if the user has admin role"""
        return self.role == 'admin'
    
    @property
    def is_online(self):
        """User is online if active within last 5 minutes"""
        try:
            if not self.last_seen:
                return False
            return (datetime.now() - self.last_seen).total_seconds() <= 300
        except Exception:
            return False

class Stack(BaseModel):
    name = CharField()
    description = TextField()
    difficulty = CharField()  # beginner, intermediate, advanced
    rating = FloatField(default=0.0)
    usage_count = IntegerField(default=0)
    technologies = TextField()  # JSON string of tech stack
    code_snippet = TextField()
    created_at = DateTimeField()

class Post(BaseModel):
    id = IntegerField(primary_key=True)
    title = CharField()
    summary = TextField()
    body = TextField()
    tags = CharField()  # comma-separated
    category = CharField()  # e.g., 'frontend', 'backend', 'docs'
    author = ForeignKeyField(User, backref='posts', on_delete='CASCADE')
    created_at = DateTimeField(default=datetime.now)
    
    @property
    def content(self):
        """Alias for body field to maintain compatibility with templates and API"""
        return self.body


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


# ✅ Lightweight schema guard to add new columns if missing
def ensure_schema():
    try:
        if db.is_closed():
            db.connect()
        # Ensure tables exist first
        db.create_tables([User, Stack, Post, Favorite])
        # Add missing columns to user table if they don't exist
        user_table = User._meta.table_name
        # Quote table name to handle reserved words (e.g., user)
        qt = f'"{user_table}"'
        db.execute_sql(f'ALTER TABLE {qt} ADD COLUMN IF NOT EXISTS profile_photo VARCHAR NULL;')
        db.execute_sql(f'ALTER TABLE {qt} ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP NULL;')
    except Exception as e:
        # Do not crash app on migration issues; logs could be added here if needed
        pass
    finally:
        if not db.is_closed():
            db.close()

# Invoke schema guard on import so the app can query safely
ensure_schema()

# ✅ Connect and create the tables only when running db.py directly

if __name__ == "__main__":
    # Test the connection first
    connection_successful = test_connection()
    
    try:
        db.connect()
        db.create_tables([User, Stack, Post, Favorite])
        print(" Connected and tables created.")
    except Exception as e:
        print(" Database connection failed:", e)

