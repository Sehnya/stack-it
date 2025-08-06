# Stack-It

A web application for sharing and discovering tech stacks.

## Deployment to Render

This guide will help you deploy the Stack-It application to Render.

### Prerequisites

1. A [Render](https://render.com/) account
2. A PostgreSQL database (you can use Render's PostgreSQL service, Supabase, Neon, or any other PostgreSQL provider)

### Deployment Steps

#### 1. Set Up Your Database

If you're using Render's PostgreSQL service:

1. Create a new PostgreSQL database in Render
2. Note the connection details (host, database name, username, password, port)

If you're using Supabase or another provider, make sure you have the connection details ready.

#### 2. Deploy the Web Service

1. Log in to your Render account
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: stack-it (or your preferred name)
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn main:app`

#### 3. Set Environment Variables

In the Render dashboard, add the following environment variables:

- `FLASK_ENV`: Set to `production`
- `SECRET_KEY`: Generate a secure random string (or let Render generate one for you)
- `DB_HOST`: Your database host
- `DB_NAME`: Your database name
- `DB_USER`: Your database username
- `DB_PASSWORD`: Your database password
- `DB_PORT`: Your database port (usually 5432)

Alternatively, you can set a single `DATABASE_URL` variable with the format:
```
postgresql://username:password@host:port/database
```

#### 4. Deploy

Click "Create Web Service" and Render will build and deploy your application.

### Custom Domain Setup

To use your own domain with the Render deployment:

1. Go to your web service in the Render dashboard
2. Click on "Settings" and then "Custom Domain"
3. Add your domain and follow the instructions to configure DNS settings

### Local Development

To run the application locally:

1. Clone the repository
2. Create a `.env` file based on the `.env.example` template
3. Install dependencies: `pip install -r requirements.txt`
4. Run the application: `python main.py`

### Troubleshooting

If you encounter issues with the deployment:

1. Check the Render logs for error messages
2. Verify that all environment variables are set correctly
3. Ensure your database is accessible from Render

For more help, refer to the [Render documentation](https://render.com/docs) or open an issue in this repository.