import { Elysia, t } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { db } from "../db"

// Standard error response type
export interface ApiError {
  error: string
  code?: string
}

// Standard success response wrapper
export interface ApiSuccess<T> {
  data: T
}

// HTTP error helper functions
export const httpError = (status: number, message: string, code?: string): { status: number; body: ApiError } => ({
  status,
  body: { error: message, ...(code && { code }) },
})

export const unauthorized = (message = "Not authenticated") => httpError(401, message, "UNAUTHORIZED")
export const forbidden = (message = "Not authorized") => httpError(403, message, "FORBIDDEN")
export const notFound = (resource = "Resource") => httpError(404, `${resource} not found`, "NOT_FOUND")
export const badRequest = (message: string) => httpError(400, message, "BAD_REQUEST")
export const serverError = (message = "Internal server error") => httpError(500, message, "SERVER_ERROR")

// JWT configuration
export const jwtConfig = {
  name: "jwt" as const,
  secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
}

// Auth payload type
export interface AuthPayload {
  userId: number
  username: string
  role: string
}

// Helper to extract and verify JWT from cookie
export async function verifyAuth(
  jwtInstance: { verify: (token: string) => Promise<any> },
  authValue: unknown
): Promise<AuthPayload | null> {
  if (!authValue || typeof authValue !== "string") {
    return null
  }
  const payload = await jwtInstance.verify(authValue)
  if (!payload) return null
  return {
    userId: payload.userId as number,
    username: payload.username as string,
    role: payload.role as string,
  }
}

// Helper to get full user from auth
export async function getUserFromAuth(
  jwtInstance: { verify: (token: string) => Promise<any> },
  authValue: unknown
) {
  const payload = await verifyAuth(jwtInstance, authValue)
  if (!payload) return null

  return db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      profilePhoto: true,
    },
  })
}

// Validation schemas for common types
export const schemas = {
  // Post schemas
  createPost: t.Object({
    title: t.String({ minLength: 1, maxLength: 200, error: "Title is required (1-200 characters)" }),
    excerpt: t.Optional(t.String({ maxLength: 500 })),
    content: t.String({ minLength: 1, error: "Content is required" }),
    coverImage: t.Optional(t.String()),
    technologies: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 20 })),
    files: t.Optional(t.Array(t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      language: t.String({ minLength: 1, maxLength: 50 }),
      code: t.String(),
    }), { maxItems: 50 })),
  }),

  updatePost: t.Object({
    title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
    excerpt: t.Optional(t.String({ maxLength: 500 })),
    content: t.Optional(t.String({ minLength: 1 })),
    coverImage: t.Optional(t.String()),
    technologies: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 20 })),
    files: t.Optional(t.Array(t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      language: t.String({ minLength: 1, maxLength: 50 }),
      code: t.String(),
    }), { maxItems: 50 })),
  }),

  // Discussion schemas
  createDiscussion: t.Object({
    title: t.String({ minLength: 1, maxLength: 200, error: "Title is required (1-200 characters)" }),
    content: t.String({ minLength: 1, error: "Content is required" }),
    category: t.Optional(t.Union([
      t.Literal("general"),
      t.Literal("help"),
      t.Literal("showcase"),
      t.Literal("feedback"),
    ])),
    tags: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 10 })),
    postId: t.Optional(t.Number()),
  }),

  updateDiscussion: t.Object({
    title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
    content: t.Optional(t.String({ minLength: 1 })),
    category: t.Optional(t.Union([
      t.Literal("general"),
      t.Literal("help"),
      t.Literal("showcase"),
      t.Literal("feedback"),
    ])),
    tags: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 10 })),
    resolved: t.Optional(t.Boolean()),
  }),

  // Comment schema
  createComment: t.Object({
    content: t.String({ minLength: 1, maxLength: 5000, error: "Comment content is required" }),
    parentId: t.Optional(t.Number()),
  }),

  // User profile schema
  updateProfile: t.Object({
    username: t.Optional(t.String({ minLength: 3, maxLength: 30 })),
    profilePhoto: t.Optional(t.String()),
  }),

  // Pagination query params
  pagination: t.Object({
    limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
    offset: t.Optional(t.String({ pattern: "^[0-9]+$" })),
    sort: t.Optional(t.Union([t.Literal("latest"), t.Literal("popular")])),
  }),

  // ID param
  idParam: t.Object({
    id: t.String({ pattern: "^[0-9]+$" }),
  }),
}

// Reusable auth guard that sets proper status codes
export function requireAuth(set: any, payload: AuthPayload | null): payload is AuthPayload {
  if (!payload) {
    set.status = 401
    return false
  }
  return true
}

// Admin check
export async function requireAdmin(
  set: any,
  payload: AuthPayload | null
): Promise<boolean> {
  if (!payload) {
    set.status = 401
    return false
  }
  
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { role: true, email: true },
  })
  
  if (!user || user.role !== "admin") {
    set.status = 403
    return false
  }
  
  return true
}
