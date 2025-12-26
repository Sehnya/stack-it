# Stack-It Changelog

## Architecture

Stack-It is a full-stack application with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Elysia (Bun) + Prisma + Turso (SQLite)

## Recent Changes

### Code Organization & Modularity
- Refactored Admin page from ~400 lines to ~111 lines by extracting reusable components
- Created shared `StatCard` component for dashboard statistics
- Created `AdminUserTable` and `AdminPostTable` components with self-contained state
- Moved admin API methods to shared `api.ts` library

### API Design & Validation
- Created shared auth middleware (`middleware/auth.ts`) with:
  - Centralized JWT configuration
  - `verifyAuth()` and `requireAuth()` helpers
  - Validation schemas for posts, discussions, comments, profiles
- Added proper HTTP status codes (400, 401, 403, 404, 500)
- Consistent error response format: `{ error: "message" }`

### Performance Optimizations
- Implemented code-splitting with `React.lazy()` for non-critical pages
- Added `loading="lazy"` and `decoding="async"` to images
- Created `formatPostSummary()` to reduce payload size for list endpoints
- Optimized backend queries to exclude unnecessary fields

### Testing Infrastructure
- Backend tests using Bun's test runner (44 tests)
  - Auth tests: signup, login, logout, token validation
  - Posts tests: CRUD, authorization, favorites
  - Admin tests: stats, user management, post management
- Frontend tests using Vitest + React Testing Library (34 tests)
  - Component tests: TechTag, StatCard
  - Context tests: AuthContext
  - API client tests

### Security
- Admin role restricted to single email (`sehnyaw@gmail.com`)
- JWT-based authentication with HTTP-only cookies
- Input validation on all API endpoints

### Cleanup
- Removed legacy server-rendered templates (Jinja)
- Removed legacy `pages.ts` route handler
- Removed legacy `template.ts` library
- Removed legacy `static/` folder

## Future Improvements
- Add more comprehensive E2E tests with Cypress
- Implement caching for trending tech list
- Add rate limiting to API endpoints
- Implement WebSocket for real-time updates
