import datetime
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from peewee import Model, CharField, AutoField, PostgresqlDatabase, FloatField, TextField, DateTimeField, IntegerField, \
    ForeignKeyField
from playhouse.db_url import connect

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# If DATABASE_URL is not provided, try to construct it from individual variables
if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_PORT = os.getenv("DB_PORT", "5432")
    
    if all([DB_HOST, DB_NAME, DB_USER, DB_PASSWORD]):
        DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        raise ValueError("❌ Database configuration not found. Either DATABASE_URL or individual DB_* variables must be set.")

# ✅ Parse Supabase pooler URL manually
pattern = r'postgresql:\/\/(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:]+):(?P<port>\d+)\/(?P<database>[^\s?]+)'
match = re.match(pattern, DATABASE_URL)

if not match:
    raise ValueError("❌ Invalid DATABASE_URL format")

config = match.groupdict()

# ✅ Initialize PostgresqlDatabase manually
db = PostgresqlDatabase(
    config['database'],
    user=config['user'],
    password=config['password'],
    host=config['host'],
    port=int(config['port'])
)
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
    created_at = DateTimeField(default=datetime.datetime.now)


# ✅ Connect and create the tables only when running db.py directly

if __name__ == "__main__":
    try:
        db.connect()
        db.create_tables([User, Stack, Post])
        print(" Connected and tables created.")
    except Exception as e:
        print(" Database connection failed:", e)

