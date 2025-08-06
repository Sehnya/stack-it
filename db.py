from datetime import datetime

from peewee import Model, CharField, AutoField, PostgresqlDatabase, FloatField, TextField, DateTimeField, IntegerField, \
    ForeignKeyField
from playhouse.db_url import connect

# Import necessary modules
import psycopg2
from dotenv import load_dotenv
import os
import re

# Load environment variables from .env
load_dotenv()

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
        
        connection = psycopg2.connect(
            user=params['user'],
            password=params['password'],
            host=params['host'],
            port=params['port'],
            dbname=params['database']
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
    title = CharField()
    summary = TextField()
    body = TextField()
    tags = CharField()  # comma-separated
    category = CharField()  # e.g., 'frontend', 'backend', 'docs'
    author = ForeignKeyField(User, backref='posts', on_delete='CASCADE')
    created_at = DateTimeField(default=datetime.now)


# ✅ Connect and create the tables only when running db.py directly

if __name__ == "__main__":
    # Test the connection first
    connection_successful = test_connection()
    
    try:
        db.connect()
        db.create_tables([User, Stack, Post])
        print(" Connected and tables created.")
    except Exception as e:
        print(" Database connection failed:", e)

