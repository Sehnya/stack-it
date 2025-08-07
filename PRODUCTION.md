# Production Readiness and Deployment Guide

This document summarizes the project’s production readiness, the configuration required to run it safely in production, and a simple deployment checklist.

Status summary:
- The app includes production-oriented safeguards: secure cookies, security headers (HSTS, CSP, Referrer-Policy, Permissions-Policy), reverse-proxy awareness (ProxyFix), a DB circuit breaker, and a lightweight health endpoint.
- With proper environment configuration and a WSGI server (e.g., Gunicorn) behind a reverse proxy (e.g., Nginx/Render/Heroku), the app is production-capable for small-to-moderate loads.
- For higher scale and multi-instance deployments, see “Caching & state” and “File uploads” notes.

## 1) Environment variables
Set these in your production environment:

- SECRET_KEY: a long, random string; the app will refuse to start in production if this is unset or the dev default.
- FLASK_ENV=production (or FLASK_DEBUG=0)
- Database (choose one of the following styles):
  - DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
  - DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME (render-style prefixed vars)
  - or user, password, host, port, dbname (local-style vars)

Optional:
- PORT: external port your reverse proxy binds to (Gunicorn will bind to 0.0.0.0:8000 in examples below).

## 2) Security hardening in app (already enabled when FLASK_ENV=production)
- Cookies: SESSION_COOKIE_SECURE, SESSION_COOKIE_SAMESITE=Lax, HTTPOnly, 7-day lifetime.
- Strict Transport Security (HSTS) and a CSP tailored to our templates/CDN usage.
- Referrer-Policy and a minimal Permissions-Policy.
- Reverse proxy header handling via Werkzeug’s ProxyFix.

Note: CSP currently allows 'unsafe-inline' for scripts/styles to support existing inline code in templates. To tighten CSP further, move inline scripts/styles into static files and remove 'unsafe-inline'.

## 3) Health checks
- Liveness: GET /healthz returns {"status":"ok"} without touching the database.
- The DB connection middleware skips /static and /healthz to keep health checks lightweight.

## 4) Running with Gunicorn
Install:
- pip install gunicorn

From the repository root:
- gunicorn -w 3 -k gthread --threads 4 -t 60 -b 0.0.0.0:8000 stack-it.main:app

Notes:
- Adjust workers/threads according to CPU and workload.
- Keep a reverse proxy (Nginx/Render/Heroku router) in front to terminate TLS and serve as edge.

## 5) Reverse proxy (example Nginx snippet)
```
server {
  listen 80;
  server_name example.com;

  location /static/ {
    alias /path/to/repo/stack-it/static/;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000";
  }

  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Prefix /;
  }
}
```

## 6) Database schema
- The app runs a lightweight schema guard on import to create tables and add new columns if missing. For long-term production, consider proper migrations (Peewee migrations) to track schema changes explicitly.

## 7) Caching & state
- The app uses a simple in-process cache (SimpleCache) suitable for single-process deployments.
- For multi-worker/replica setups, use a shared cache backend (e.g., Redis via Flask-Caching) so cached entries are consistent across processes/instances.

## 8) File uploads
- User profile photos are stored under stack-it/static/uploads.
- In multi-instance deployments, use a shared filesystem or object storage (e.g., S3/Cloud Storage) and serve via CDN to keep uploads available across instances.
- Max upload size is 4MB and allowed formats are png, jpg, jpeg, gif, webp.

## 9) Logging & monitoring
- Ensure your platform captures stdout/stderr from Gunicorn.
- Monitor HTTP 5xx rates and application logs; alert on sustained DB circuit breaker openings.

## 10) Deployment checklist
- [ ] Set SECRET_KEY and database env vars.
- [ ] Set FLASK_ENV=production (or FLASK_DEBUG=0).
- [ ] Start Gunicorn with appropriate workers/threads.
- [ ] Put a reverse proxy in front; enable TLS.
- [ ] Configure static file caching at the proxy/CDN.
- [ ] Configure health checks to hit /healthz.
- [ ] For multi-instance deployments, externalize cache and uploads.
- [ ] Set up log collection and monitoring/alerts.

With these steps, the project is production-ready for typical small-to-medium deployments and can be scaled further with shared cache/object storage as needed.