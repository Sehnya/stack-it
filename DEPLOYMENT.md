# Stack-it Deployment Guide

## Architecture

- **Frontend:** Cloudflare Pages (React SPA)
- **Backend:** Railway (Elysia/Bun API)
- **Database:** Turso (SQLite edge database)

---

## 1. Database Setup (Turso)

1. Sign up at [turso.tech](https://turso.tech)
2. Install Turso CLI:
   ```bash
   brew install tursodatabase/tap/turso
   turso auth login
   ```
3. Create database:
   ```bash
   turso db create stack-it
   turso db show stack-it --url  # Copy the URL
   turso db tokens create stack-it  # Copy the token
   ```
4. Push schema:
   ```bash
   cd backend
   TURSO_DATABASE_URL=libsql://your-db.turso.io TURSO_AUTH_TOKEN=your-token bunx prisma db push
   ```

---

## 2. Backend Deployment (Railway)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, set **Root Directory** to `backend`
3. Add environment variables:
   | Variable | Value |
   |----------|-------|
   | `TURSO_DATABASE_URL` | `libsql://your-db.turso.io` |
   | `TURSO_AUTH_TOKEN` | Your Turso token |
   | `JWT_SECRET` | Generate secure random string |
   | `CORS_ORIGIN` | `https://stack-it.pages.dev` |

4. Railway auto-detects Bun and deploys
5. Copy your Railway URL (e.g., `https://stack-it-backend.up.railway.app`)

---

## 3. Frontend Deployment (Cloudflare Pages)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Create project → Connect to Git → Select repo
3. Configure:
   - **Root directory:** `frontend`
   - **Build command:** `bun install && bun run build`
   - **Build output:** `dist`
4. Add environment variable:
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | Your Railway backend URL |

5. Deploy

---

## Environment Variables Summary

### Backend (Railway)
```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
JWT_SECRET=your-secure-secret
CORS_ORIGIN=https://stack-it.pages.dev
```

### Frontend (Cloudflare)
```
VITE_API_URL=https://your-backend.up.railway.app
```

---

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

---

## Custom Domain

### Frontend (Cloudflare)
Pages → Custom domains → Add domain

### Backend (Railway)
Settings → Domains → Add custom domain
