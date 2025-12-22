# Cloudflare Deployment Guide

Stack-it frontend is deployed on Cloudflare Pages.

## Frontend Deployment (Cloudflare Pages)

### Option 1: Connect GitHub (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click "Create a project" → "Connect to Git"
3. Select your GitHub repository
4. Configure build settings:
   - **Project name:** `stack-it`
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** `cd frontend && bun install && bun run build`
   - **Build output directory:** `frontend/dist`
   - **Root directory:** `/` (leave empty)

5. Add environment variables if needed:
   - `VITE_API_URL` - Your backend API URL

6. Click "Save and Deploy"

### Option 2: Direct Upload via CLI

```bash
# Install Wrangler CLI
bun add -g wrangler

# Login to Cloudflare
wrangler login

# Build the frontend
cd frontend
bun install
bun run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=stack-it
```

## Build Settings Summary

| Setting | Value |
|---------|-------|
| Build command | `cd frontend && bun install && bun run build` |
| Build output | `frontend/dist` |
| Node version | 18+ (or Bun) |

## Custom Domain

1. Go to Pages project → Custom domains
2. Add your domain
3. Update DNS records as instructed

## Environment Variables

Set these in Cloudflare Pages dashboard:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## SPA Routing

The `_redirects` file handles client-side routing:
```
/*    /index.html   200
```

This ensures all routes serve `index.html` for React Router to handle.

## Local Development

```bash
cd frontend
bun install
bun run dev
```

## Backend Options

For the backend API, consider:
- **Cloudflare Workers** - Serverless functions
- **Railway/Render** - Traditional Node.js hosting
- **Supabase** - Database + Auth + API

The frontend is a static SPA that can work with any backend.
