import { Elysia } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { db } from "../db"
import { jwtConfig, schemas, verifyAuth, requireAuth } from "../middleware/auth"
import { log } from "../lib/logger"

// Helper to format discussion response
function formatDiscussion(thread: any): any {
  return {
    id: String(thread.id),
    title: thread.title,
    content: thread.content,
    category: thread.category,
    tags: JSON.parse(thread.tags || "[]"),
    resolved: thread.resolved,
    pinned: thread.pinned,
    viewCount: thread.viewCount,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    author: {
      id: String(thread.author.id),
      username: thread.author.username,
      avatar: thread.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${thread.author.username}`,
    },
    replies: thread._count?.replies || 0,
    postId: thread.postId ? String(thread.postId) : null,
  }
}

export const discussionsRoutes = new Elysia({ prefix: "/api/discussions" })
  .use(jwt(jwtConfig))

  // Get all discussions
  .get("/", async ({ query }) => {
    const sort = query.sort || "latest"
    const limit = parseInt(query.limit as string) || 20
    const offset = parseInt(query.offset as string) || 0
    const category = query.category as string | undefined

    try {
      const where = category && category !== "all" ? { category } : {}
      
      const threads = await db.forumThread.findMany({
        where,
        orderBy: sort === "popular" 
          ? [{ pinned: "desc" }, { viewCount: "desc" }]
          : [{ pinned: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          _count: { select: { replies: true } },
        },
      })

      return threads.map(formatDiscussion)
    } catch (error) {
      log.discussions.error("Error fetching threads", {}, error as Error)
      return []
    }
  })

  // Get discussion by ID
  .get("/:id", async ({ params, set }) => {
    try {
      const thread = await db.forumThread.findUnique({
        where: { id: parseInt(params.id) },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          replies: {
            orderBy: [{ isAnswer: "desc" }, { createdAt: "asc" }],
            include: {
              // We'll need to add author relation to ForumReply
            },
          },
          _count: { select: { replies: true } },
        },
      })

      if (!thread) {
        set.status = 404
        return { error: "Discussion not found" }
      }

      // Increment view count
      await db.forumThread.update({
        where: { id: parseInt(params.id) },
        data: { viewCount: { increment: 1 } },
      })

      return formatDiscussion(thread)
    } catch (error) {
      log.discussions.error("Error fetching thread", { threadId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to fetch discussion" }
    }
  })

  // Create discussion
  .post("/", async ({ body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const { title, content, category, tags, postId } = body

    try {
      const thread = await db.forumThread.create({
        data: {
          title,
          content,
          category: category || "general",
          tags: JSON.stringify(tags || []),
          authorId: payload.userId,
          postId: postId || null,
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          _count: { select: { replies: true } },
        },
      })

      set.status = 201
      return formatDiscussion(thread)
    } catch (error) {
      log.discussions.error("Error creating thread", {}, error as Error)
      set.status = 500
      return { error: "Failed to create discussion" }
    }
  }, {
    body: schemas.createDiscussion,
  })

  // Update discussion
  .put("/:id", async ({ params, body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const threadId = parseInt(params.id)
    if (isNaN(threadId)) {
      set.status = 400
      return { error: "Invalid discussion ID" }
    }
    const { title, content, category, tags, resolved } = body

    try {
      const thread = await db.forumThread.findUnique({
        where: { id: threadId },
      })

      if (!thread) {
        set.status = 404
        return { error: "Discussion not found" }
      }

      if (thread.authorId !== payload.userId) {
        set.status = 403
        return { error: "Not authorized" }
      }

      const updated = await db.forumThread.update({
        where: { id: threadId },
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(category && { category }),
          ...(tags && { tags: JSON.stringify(tags) }),
          ...(resolved !== undefined && { resolved }),
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          _count: { select: { replies: true } },
        },
      })

      return formatDiscussion(updated)
    } catch (error) {
      log.discussions.error("Error updating thread", { threadId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to update discussion" }
    }
  }, {
    params: schemas.idParam,
    body: schemas.updateDiscussion,
  })

  // Delete discussion
  .delete("/:id", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const threadId = parseInt(params.id)
    if (isNaN(threadId)) {
      set.status = 400
      return { error: "Invalid discussion ID" }
    }

    try {
      const thread = await db.forumThread.findUnique({
        where: { id: threadId },
      })

      if (!thread) {
        set.status = 404
        return { error: "Discussion not found" }
      }

      if (thread.authorId !== payload.userId) {
        set.status = 403
        return { error: "Not authorized" }
      }

      await db.forumThread.delete({
        where: { id: threadId },
      })

      return { message: "Discussion deleted" }
    } catch (error) {
      log.discussions.error("Error deleting thread", { threadId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to delete discussion" }
    }
  }, {
    params: schemas.idParam,
  })

  // Get discussions by tech tag
  .get("/tech/:tech", async ({ params, query }) => {
    const tech = decodeURIComponent(params.tech).toLowerCase()
    const limit = parseInt(query.limit as string) || 20

    try {
      const threads = await db.forumThread.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          _count: { select: { replies: true } },
        },
      })

      // Filter by tag (since tags are stored as JSON string)
      const filtered = threads.filter((t: any) => {
        const tags = JSON.parse(t.tags || "[]") as string[]
        return tags.some((tag: string) => tag.toLowerCase() === tech)
      })

      return filtered.map(formatDiscussion)
    } catch (error) {
      log.discussions.error("Error fetching by tech", { tech }, error as Error)
      return []
    }
  })

  // Get discussions by user
  .get("/user/:userId", async ({ params, query }) => {
    const userId = parseInt(params.userId)
    const limit = parseInt(query.limit as string) || 20

    try {
      const threads = await db.forumThread.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          _count: { select: { replies: true } },
        },
      })

      return threads.map(formatDiscussion)
    } catch (error) {
      log.discussions.error("Error fetching user threads", { userId: params.userId }, error as Error)
      return []
    }
  })
