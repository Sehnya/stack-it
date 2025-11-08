# Stack-It

A modern web application for creating and managing posts, stacks, and favorites with role-based access control. Built with Flask, Tailwind CSS, and SQLite/PostgreSQL.

## Prerequisites

- Python 3.9 or higher
- Node.js 16+ and npm (or Bun)
- Git

## Quick Start

Follow these steps to get the project running locally:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stack-it
```

### 2. Set Up Python Environment

Create and activate a virtual environment:

```bash
python -m venv venv

# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Install Node Dependencies

```bash
npm install

# Or if using Bun:
bun install
```

### 5. Set Up Database

For local development, the app uses SQLite by default (no configuration needed). The database file `stack_it.db` will be created automatically on first run.

If you want to use PostgreSQL instead, see the [Environment Variables](#environment-variables) section below.

### 6. Initialize Database Tables

The database tables will be created automatically when you first run the application. The app uses Peewee ORM with the following models:
- **User** - User accounts with role-based permissions
- **Stack** - Collections or categories
- **Post** - Main content items
- **Favorite** - User favorites tracking

### 7. Seed Sample Data (Optional)

To populate the database with sample community posts for testing and development:

```bash
python seed.py
```

This will create 3 sample posts:
- 2 frontend-focused posts (React Server Components, Vue vs React)
- 1 backend-focused post (GraphQL vs REST API design)

**Note:** Run this after creating your first user account (username: `sallen20`). If posts with IDs 1001-1003 already exist, you'll be prompted to delete and recreate them.

### 8. Run the Development Server

```bash
python main.py
```

The application will be available at `http://localhost:5000`

## Environment Variables

For local development with SQLite, no environment variables are required. For production or PostgreSQL setup, create a `.env` file in the root directory:

```bash
# Required for production
SECRET_KEY=your-secret-key-here
FLASK_ENV=production

# PostgreSQL connection (choose one method)

# Method 1: DATABASE_URL
DATABASE_URL=postgresql://user:password@host:port/dbname

# Method 2: Individual variables (used by Render)
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name

# Method 3: Non-prefixed variables
user=your_db_user
password=your_db_password
host=your_db_host
port=5432
dbname=your_db_name
```

**Note:** If no PostgreSQL configuration is found, the app automatically falls back to SQLite for local development.

## Project Structure

```
stack-it/
├── main.py                 # Main Flask application
├── db.py                   # Database models and configuration
├── seed.py                 # Database seeding script
├── routes/                 # Route handlers (modular)
├── templates/              # Jinja2 HTML templates
├── static/                 # Static assets
│   ├── css/               # Compiled CSS
│   ├── images/            # Image assets
│   └── uploads/           # User-uploaded files
├── solutions/              # Solution documentation
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
├── postcss.config.js      # PostCSS configuration
└── stack_it.db            # SQLite database (auto-generated)
```

## Development Workflow

### Running the Application

```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run the Flask development server
python main.py
```

### Working with CSS

The project uses Tailwind CSS v4. CSS is processed through PostCSS:

```bash
# If you modify Tailwind classes, the CSS will be recompiled automatically
# You may need to set up a PostCSS watch process depending on your workflow
```

### Database Migrations

The application uses Peewee ORM. Database schema changes require manual migrations. Check the `solutions/` directory for examples of past migrations.

## User Roles

The application supports two user roles:

- **User** - Standard access (can view posts, create favorites)
- **Admin** - Full access (can create posts, manage users, access admin panel)

To set up an admin user, you'll need to modify the database directly or use a migration script. See `solutions/SOLUTION_ROLE_FIELD.md` for details.

## Production Deployment

For production deployment instructions, see:
- `PRODUCTION.md` - Production configuration guide
- `DEPLOYMENT_SUMMARY.md` - Deployment summary
- `render.yaml` - Render.com configuration

The application is configured to run with Gunicorn in production (see `Procfile`).

## Additional Documentation

- See the `solutions/` directory for detailed documentation on specific features:
  - Navigation and dropdown menus
  - Favorites system
  - Post management
  - Role-based access control
  - Three-dot menu implementation

## Troubleshooting

**Database connection errors:**
- For SQLite: Ensure the application has write permissions in the project directory
- For PostgreSQL: Verify your connection credentials in the `.env` file

**CSS not loading:**
- Make sure Node dependencies are installed (`npm install`)
- Check that `static/css/` directory exists

**Import errors:**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

## License

ISC

## Contributing

This is a personal project. For questions or issues, please open an issue on the repository.
