# Stack-it Backend

A modern backend built with Elysia, Bun, Prisma, and Turso.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript runtime
- **Framework**: [Elysia](https://elysiajs.com) - Fast and friendly web framework
- **ORM**: [Prisma](https://prisma.io) - Type-safe database client
- **Database**: [Turso](https://turso.tech) - Edge SQLite database (libSQL)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- [Turso CLI](https://docs.turso.tech/cli/installation) (for production)

### Installation

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push schema to database (creates tables)
bun run db:push

# Seed the database with sample data
bun run db:seed
```

### Development

```bash
# Start dev server with hot reload
bun run dev
```

### Production

```bash
# Start production server
bun run start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `CORS_ORIGIN` | Allowed CORS origin |
| `JWT_SECRET` | Secret for JWT signing |
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - List posts (query: `category`, `limit`, `offset`)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile (auth required)
- `POST /api/users/dismiss-banner` - Dismiss welcome banner
- `GET /api/users/:id/posts` - Get user's posts

### Favorites
- `GET /api/favorites` - Get user's favorites (auth required)
- `POST /api/favorites/:postId` - Add to favorites
- `DELETE /api/favorites/:postId` - Remove from favorites
- `GET /api/favorites/check/:postId` - Check if favorited

## Setting up Turso

1. Install Turso CLI:
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

2. Login to Turso:
```bash
turso auth login
```

3. Create a database:
```bash
turso db create stack-it
```

4. Get the database URL:
```bash
turso db show stack-it --url
```

5. Create an auth token:
```bash
turso db tokens create stack-it
```

6. Add to your `.env`:
```
TURSO_DATABASE_URL=libsql://stack-it-yourname.turso.io
TURSO_AUTH_TOKEN=your-token-here
```
