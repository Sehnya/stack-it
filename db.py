import datetime

from peewee import Model, CharField, AutoField, PostgresqlDatabase, FloatField, TextField, DateTimeField, IntegerField, \
    ForeignKeyField

# ✅ Replace with your actual Supabase or Neon connection info
db = PostgresqlDatabase(
    'postgres',                             # database name
    user='postgres',
    password='Serena11052017$',
    host='db.nahlqtzrdgoytmemxhao.supabase.co',       # or Neon, Render, etc.
    port=5432
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


