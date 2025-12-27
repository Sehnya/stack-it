import { Elysia, t } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { db } from "../db"
import { jwtConfig, verifyAuth, requireAuth } from "../middleware/auth"
import { log } from "../lib/logger"

interface CommentResponse {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    avatar: string
  }
  likes: number
  liked: boolean
  replyCount: number
  replies?: CommentResponse[]
}

function formatComment(comment: any, userId?: number): CommentResponse {
  const liked = userId 
    ? comment.likes?.some((l: any) => l.userId === userId) 
    : false
  
  return {
    id: String(comment.id),
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      id: String(comment.user.id),
      username: comment.user.username,
      avatar: comment.user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user.username}`,
    },
    likes: comment._count?.likes || comment.likes?.length || 0,
    liked,
    replyCount: comment._count?.replies || 0,
    replies: comment.replies?.map((r: any) => formatComment(r, userId)),
  }
}

export const commentsRoutes = new Elysia({ prefix: "/api/comments" })
  .use(jwt(jwtConfig))
  // Get comments for a post (top-level with nested replies)
  .get("/post/:postId", async ({ params, query, jwt, cookie: { auth } }) => {
    const postId = Number(params.postId)
    if (isNaN(postId)) return []
    
    const { sort = "top", limit = "50", offset = "0" } = query as any
    
    // Get current user for liked status
    let userId: number | undefined
    const authValue = auth?.value
    if (authValue && typeof authValue === "string") {
      const payload = await jwt.verify(authValue)
      if (payload) userId = payload.userId as number
    }

    try {
      const orderBy = sort === "newest" 
        ? { createdAt: "desc" as const }
        : sort === "oldest"
        ? { createdAt: "asc" as const }
        : { likes: { _count: "desc" as const } }

      // Get top-level comments
      const comments = await db.comment.findMany({
        where: { postId, parentId: null },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy,
        include: {
          user: { select: { id: true, username: true, profilePhoto: true } },
          likes: userId ? { where: { userId } } : false,
          _count: { select: { likes: true, replies: true } },
          replies: {
            take: 3, // Show first 3 replies inline
            orderBy: { likes: { _count: "desc" } },
            include: {
              user: { select: { id: true, username: true, profilePhoto: true } },
              likes: userId ? { where: { userId } } : false,
              _count: { select: { likes: true, replies: true } },
            },
          },
        },
      })

      return comments.map((c) => formatComment(c, userId))
    } catch (error) {
      log.posts.error("Error fetching comments", { postId }, error as Error)
      return []
    }
  })
  // Get replies for a comment
  .get("/:commentId/replies", async ({ params, query, jwt, cookie: { auth } }) => {
    const commentId = Number(params.commentId)
    if (isNaN(commentId)) return []
    
    const { limit = "20", offset = "0" } = query as any
    
    let userId: number | undefined
    const authValue = auth?.value
    if (authValue && typeof authValue === "string") {
      const payload = await jwt.verify(authValue)
      if (payload) userId = payload.userId as number
    }

    try {
      const replies = await db.comment.findMany({
        where: { parentId: commentId },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, username: true, profilePhoto: true } },
          likes: userId ? { where: { userId } } : false,
          _count: { select: { likes: true, replies: true } },
        },
      })

      return replies.map((r) => formatComment(r, userId))
    } catch (error) {
      log.posts.error("Error fetching replies", { commentId }, error as Error)
      return []
    }
  })
  // Create comment
  .post("/post/:postId", async ({ params, body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    
    const postId = Number(params.postId)
    if (isNaN(postId)) {
      set.status = 400
      return { error: "Invalid post ID" }
    }

    const { content, parentId } = body as { content: string; parentId?: number }
    
    if (!content?.trim()) {
      set.status = 400
      return { error: "Content is required" }
    }

    try {
      // Verify post exists
      const post = await db.post.findUnique({ where: { id: postId } })
      if (!post) {
        set.status = 404
        return { error: "Post not found" }
      }

      // If replying, verify parent comment exists and belongs to same post
      if (parentId) {
        const parent = await db.comment.findUnique({ where: { id: parentId } })
        if (!parent || parent.postId !== postId) {
          set.status = 400
          return { error: "Invalid parent comment" }
        }
      }

      const comment = await db.comment.create({
        data: {
          content: content.trim(),
          userId: payload.userId,
          postId,
          parentId: parentId || null,
        },
        include: {
          user: { select: { id: true, username: true, profilePhoto: true } },
          _count: { select: { likes: true, replies: true } },
        },
      })

      set.status = 201
      return formatComment({ ...comment, likes: [] }, payload.userId)
    } catch (error) {
      log.posts.error("Error creating comment", { postId }, error as Error)
      set.status = 500
      return { error: "Failed to create comment" }
    }
  }, {
    body: t.Object({
      content: t.String(),
      parentId: t.Optional(t.Number()),
    }),
  })
  // Update comment
  .put("/:commentId", async ({ params, body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    
    const commentId = Number(params.commentId)
    if (isNaN(commentId)) {
      set.status = 400
      return { error: "Invalid comment ID" }
    }

    const { content } = body as { content: string }

    try {
      const comment = await db.comment.findUnique({ where: { id: commentId } })
      if (!comment) {
        set.status = 404
        return { error: "Comment not found" }
      }

      // Only author can edit
      if (comment.userId !== payload.userId) {
        set.status = 403
        return { error: "Not authorized" }
      }

      const updated = await db.comment.update({
        where: { id: commentId },
        data: { content: content.trim() },
        include: {
          user: { select: { id: true, username: true, profilePhoto: true } },
          likes: { where: { userId: payload.userId } },
          _count: { select: { likes: true, replies: true } },
        },
      })

      return formatComment(updated, payload.userId)
    } catch (error) {
      log.posts.error("Error updating comment", { commentId }, error as Error)
      set.status = 500
      return { error: "Failed to update comment" }
    }
  }, {
    body: t.Object({ content: t.String() }),
  })
  // Delete comment
  .delete("/:commentId", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    
    const commentId = Number(params.commentId)
    if (isNaN(commentId)) {
      set.status = 400
      return { error: "Invalid comment ID" }
    }

    try {
      const comment = await db.comment.findUnique({ where: { id: commentId } })
      if (!comment) {
        set.status = 404
        return { error: "Comment not found" }
      }

      // Author or admin can delete
      const user = await db.user.findUnique({ where: { id: payload.userId } })
      if (comment.userId !== payload.userId && user?.role !== "admin") {
        set.status = 403
        return { error: "Not authorized" }
      }

      await db.comment.delete({ where: { id: commentId } })
      return { message: "Comment deleted" }
    } catch (error) {
      log.posts.error("Error deleting comment", { commentId }, error as Error)
      set.status = 500
      return { error: "Failed to delete comment" }
    }
  })
  // Like/unlike comment
  .post("/:commentId/like", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    
    const commentId = Number(params.commentId)
    if (isNaN(commentId)) {
      set.status = 400
      return { error: "Invalid comment ID" }
    }

    try {
      const existing = await db.commentLike.findUnique({
        where: { userId_commentId: { userId: payload.userId, commentId } },
      })

      if (existing) {
        await db.commentLike.delete({ where: { id: existing.id } })
        return { liked: false }
      } else {
        await db.commentLike.create({
          data: { userId: payload.userId, commentId },
        })
        return { liked: true }
      }
    } catch (error) {
      log.posts.error("Error toggling comment like", { commentId }, error as Error)
      set.status = 500
      return { error: "Failed to toggle like" }
    }
  })
