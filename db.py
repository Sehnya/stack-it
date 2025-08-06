import datetime
import os
from dotenv import load_dotenv

from peewee import Model, CharField, AutoField, PostgresqlDatabase, FloatField, TextField, DateTimeField, IntegerField, \
    ForeignKeyField

# Load environment variables
load_dotenv()

# Get database configuration from environment variables
database_url = os.environ.get('DATABASE_URL')

if database_url:
    # If DATABASE_URL is provided, use it directly
    import re
    pattern = r'postgresql://(?P<user>.+):(?P<password>.+)@(?P<host>.+):(?P<port>\d+)/(?P<database>.+)'
    match = re.match(pattern, database_url)
    if match:
        db_config = match.groupdict()
        db = PostgresqlDatabase(
            db_config['database'],
            user=db_config['user'],
            password=db_config['password'],
            host=db_config['host'],
            port=int(db_config['port'])
        )
    else:
        raise ValueError("Invalid DATABASE_URL format")
else:
    # Otherwise use individual environment variables
    db = PostgresqlDatabase(
        os.environ.get('DB_NAME', 'postgres'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', ''),
        host=os.environ.get('DB_HOST', 'localhost'),
        port=int(os.environ.get('DB_PORT', 5432))
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
    db.connect()
    db.create_tables([User, Stack, Post])


