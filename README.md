# Stack-It

A modern web application for developers to share and discover tech stacks. Built with Bun, Elysia, React, and Tailwind CSS.

## Tech Stack

**Backend:**
- Bun runtime
- Elysia framework
- Prisma ORM
- SQLite/LibSQL database

**Frontend:**
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS
- Framer Motion animations

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stack-it
```

### 2. Install Dependencies

```bash
# Backend
cd backend
bun install

# Frontend
cd ../frontend
bun install
```

### 3. Configure Environment

Create `backend/.env`:

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=3001
```

### 4. Set Up Database

From the project root:

```bash
bun run db:setup
```

This generates the Prisma client, pushes the schema, and seeds sample data.

### 5. Run Development Servers

From the project root:

```bash
bun run dev
```

This starts both servers concurrently:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

```
stack-it/
├── backend/
│   ├── src/
│   │   ├── index.ts        # Elysia server entry
│   │   ├── db.ts           # Prisma client
│   │   └── routes/         # API routes
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   └── railway.json        # Railway deployment config
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app with routing
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── railway.json        # Railway deployment config
├── templates/              # Legacy Jinja templates
├── static/                 # Static assets
└── DEPLOYMENT.md           # Railway deployment guide
```

## Available Scripts

**Root (recommended):**
```bash
bun run dev          # Start both frontend and backend
bun run dev:backend  # Start backend only
bun run dev:frontend # Start frontend only
bun run db:setup     # Set up database (generate, push, seed)
bun run db:reset     # Reset database (delete, regenerate, reseed)
```

**Backend (`cd backend`):**
```bash
bun run dev         # Start dev server with hot reload
bun run start       # Start production server
bun run db:generate # Generate Prisma client
bun run db:push     # Push schema changes
bun run db:studio   # Open Prisma Studio
bun run db:seed     # Seed database
```

**Frontend (`cd frontend`):**
```bash
bun run dev        # Start Vite dev server
bun run build      # Build for production
bun run preview    # Preview production build
```

## Deployment

Stack-It is configured for Railway deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

**Quick deploy:**
1. Push to GitHub
2. Connect repo to Railway
3. Create two services: `backend/` and `frontend/`
4. Set environment variables
5. Deploy

## Features

- User authentication (JWT)
- Create and share tech stack posts
- Community feed with trending posts
- Favorites system
- Responsive design
- Animated UI components

## API Endpoints

```
POST   /api/auth/register   # Register new user
POST   /api/auth/login      # Login user
GET    /api/posts           # Get all posts
POST   /api/posts           # Create post
GET    /api/posts/:id       # Get single post
DELETE /api/posts/:id       # Delete post
GET    /api/users/:id       # Get user profile
POST   /api/favorites       # Add favorite
DELETE /api/favorites/:id   # Remove favorite
```

## License

ISC
