# Railway Deployment Guide

Stack-it is deployed on Railway with two services: Backend (Bun + Elysia) and Frontend (Vite + React).

## Project Structure

```
stack-it/
├── backend/          # Bun + Elysia API server
│   ├── railway.json  # Railway config for backend
│   └── ...
├── frontend/         # Vite + React SPA
│   ├── railway.json  # Railway config for frontend
│   └── ...
└── railway.json      # Root config (optional)
```

## Deployment Steps

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select the `stack-it` repository

### 2. Set Up Backend Service

1. In Railway dashboard, click "New Service" → "GitHub Repo"
2. Select the repo and set **Root Directory** to `backend`
3. Railway will auto-detect Bun and use the `railway.json` config

**Environment Variables (Backend):**
```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=3001
```

### 3. Set Up Frontend Service

1. Click "New Service" → "GitHub Repo" again
2. Select the repo and set **Root Directory** to `frontend`
3. Railway will build and serve the Vite app

**Environment Variables (Frontend):**
```
VITE_API_URL=https://your-backend-service.railway.app
```

### 4. Add Database (Optional)

1. Click "New Service" → "Database" → "PostgreSQL" or use external DB
2. Copy the `DATABASE_URL` to backend environment variables

## Build Commands

**Backend:**
- Build: `bun install && bunx prisma generate`
- Start: `bun run start`

**Frontend:**
- Build: `bun install && bun run build`
- Start: `bun run preview --host --port $PORT`

## Custom Domains

1. Go to service settings → "Domains"
2. Add custom domain or use Railway's generated domain

## Monitoring

- View logs in Railway dashboard
- Set up health checks via `healthcheckPath` in railway.json

## Local Development

```bash
# Backend
cd backend
bun install
bun run dev

# Frontend (separate terminal)
cd frontend
bun install
bun run dev
```
