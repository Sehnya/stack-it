import { Elysia, t } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { db } from "../db"
import { jwtConfig, schemas, verifyAuth, requireAuth } from "../middleware/auth"
import { log } from "../lib/logger"

// Helper to format post response (full - for single post view)
function formatPost(post: any): any {
  return {
    id: String(post.id),
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    technologies: JSON.parse(post.technologies || "[]"),
    viewCount: post._count?.views ?? post.viewCount ?? 0,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: String(post.author.id),
      username: post.author.username,
      avatar: post.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.username}`,
    },
    files: post.files || [],
    likes: post._count?.likes || 0,
    favorites: post._count?.favorites || 0,
    reposts: post._count?.reposts || 0,
    comments: post._count?.comments || 0,
  }
}

// Helper to format post for list views (excludes content and files for smaller payload)
function formatPostSummary(post: any): any {
  return {
    id: String(post.id),
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    technologies: JSON.parse(post.technologies || "[]"),
    viewCount: post._count?.views ?? post.viewCount ?? 0,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: String(post.author.id),
      username: post.author.username,
      avatar: post.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.username}`,
    },
    files: post.files ? post.files.map((f: any) => ({ id: f.id, name: f.name, language: f.language })) : [],
    likes: post._count?.likes || 0,
    favorites: post._count?.favorites || 0,
    reposts: post._count?.reposts || 0,
    comments: post._count?.comments || 0,
  }
}

export const postsRoutes = new Elysia({ prefix: "/api/posts" })
  .use(jwt(jwtConfig))
  // STATIC ROUTES FIRST (before /:id to avoid route conflicts)
  // Get user's favorites
  .get("/favorites/me", async ({ set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    try {
      const favorites = await db.favorite.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              excerpt: true,
              coverImage: true,
              technologies: true,
              viewCount: true,
              createdAt: true,
              author: { select: { id: true, username: true, profilePhoto: true } },
              files: { select: { id: true, name: true, language: true } },
              _count: { select: { favorites: true, likes: true, comments: true, reposts: true } },
            },
          },
        },
      })
      return favorites.map((fav: any) => ({
        ...formatPostSummary(fav.post),
        savedAt: fav.createdAt.toISOString(),
      }))
    } catch (error) {
      log.posts.error("Error fetching favorites", {}, error as Error)
      set.status = 500
      return { error: "Failed to fetch favorites" }
    }
  })
  // Get user stats
  .get("/stats/me", async ({ set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    try {
      const [postCount, viewCount, likeCount, followerCount, followingCount] = await Promise.all([
        db.post.count({ where: { authorId: payload.userId } }),
        db.postView.count({ where: { post: { authorId: payload.userId } } }),
        db.like.count({ where: { post: { authorId: payload.userId } } }),
        db.follow.count({ where: { followingId: payload.userId } }),
        db.follow.count({ where: { followerId: payload.userId } }),
      ])
      return {
        posts: postCount,
        likes: likeCount,
        views: viewCount,
        followers: followerCount,
        following: followingCount,
      }
    } catch (error) {
      log.posts.error("Error fetching stats", {}, error as Error)
      set.status = 500
      return { error: "Failed to fetch stats" }
    }
  })
  // Get top users
  .get("/top-users", async () => {
    try {
      const users = await db.user.findMany({
        take: 5,
        orderBy: { posts: { _count: "desc" } },
        select: {
          id: true,
          username: true,
          profilePhoto: true,
          _count: { select: { posts: true } },
        },
      })
      return users.map((u: any, i: number) => ({
        id: u.id,
        name: u.username,
        avatar: u.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`,
        stacks: u._count.posts,
        rank: i + 1,
      }))
    } catch (error) {
      log.posts.error("Error fetching top users", {}, error as Error)
      return []
    }
  })
  // Get trending tech
  .get("/trending-tech", async () => {
    try {
      const posts = await db.post.findMany({
        select: { technologies: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      const techCounts: Record<string, number> = {}
      posts.forEach((p: any) => {
        const techs = JSON.parse(p.technologies || "[]")
        techs.forEach((t: string) => {
          techCounts[t] = (techCounts[t] || 0) + 1
        })
      })
      return Object.entries(techCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count], i) => ({ name, posts: count, hot: i < 3 }))
    } catch (error) {
      log.posts.error("Error fetching trending tech", {}, error as Error)
      return []
    }
  })
  // Get posts by technology
  .get("/tech/:tech", async ({ params }) => {
    const tech = decodeURIComponent(params.tech)
    try {
      const posts = await db.post.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          excerpt: true,
          coverImage: true,
          technologies: true,
          viewCount: true,
          createdAt: true,
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: { select: { id: true, name: true, language: true } },
          _count: { select: { favorites: true, likes: true, comments: true, reposts: true } },
        },
      })
      // Filter posts that contain the technology (case-insensitive)
      const filtered = posts.filter((p: any) => {
        const techs = JSON.parse(p.technologies || "[]")
        return techs.some((t: string) => t.toLowerCase() === tech.toLowerCase())
      })
      return filtered.map(formatPostSummary)
    } catch (error) {
      log.posts.error("Error fetching posts by tech", { tech }, error as Error)
      return []
    }
  })
  // Get all posts
  .get("/", async ({ query }) => {
    const { sort = "latest", limit = "20", offset = "0" } = query as any
    try {
      const posts = await db.post.findMany({
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          excerpt: true,
          coverImage: true,
          technologies: true,
          viewCount: true,
          createdAt: true,
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: { select: { id: true, name: true, language: true } },
          _count: { select: { favorites: true, likes: true, comments: true, reposts: true } },
        },
      })

      // Get view counts for each post
      const postsWithViews = await Promise.all(posts.map(async (post) => {
        const viewCount = await db.$queryRaw<[{count: number}]>`
          SELECT COUNT(*) as count FROM post_views WHERE post_id = ${post.id}
        `
        return { ...post, viewCount: Number(viewCount[0]?.count || 0) }
      }))
      
      // Sort by views if popular
      if (sort === "popular") {
        postsWithViews.sort((a, b) => b.viewCount - a.viewCount)
      }
      
      return postsWithViews.map(formatPostSummary)
    } catch (error) {
      log.posts.error("Error fetching posts", {}, error as Error)
      return []
    }
  })
  // Create post
  .post("/", async ({ body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const { title, excerpt, content, coverImage, technologies, files } = body
    try {
      const post = await db.post.create({
        data: {
          title,
          excerpt: excerpt || "",
          content,
          coverImage: coverImage || null,
          technologies: JSON.stringify(technologies || []),
          authorId: payload.userId,
          files: files?.length
            ? { create: files.map((f) => ({ name: f.name, language: f.language, code: f.code })) }
            : undefined,
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
        },
      })
      set.status = 201
      return formatPost({ ...post, _count: { favorites: 0, likes: 0, comments: 0, reposts: 0 } })
    } catch (error) {
      log.posts.error("Error creating post", {}, error as Error)
      set.status = 500
      return { error: "Failed to create post" }
    }
  }, {
    body: schemas.createPost,
  })
  // PARAMETERIZED ROUTES LAST (after static routes)
  // Get single post
  .get("/:id", async ({ params, set, jwt, cookie: { auth } }) => {
    try {
      const post = await db.post.findUnique({
        where: { id: Number(params.id) },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
          _count: { select: { favorites: true, likes: true, comments: true, reposts: true } },
        },
      })
      if (!post) {
        set.status = 404
        return { error: "Post not found" }
      }

      // Track unique view per user (only if authenticated)
      const authValue = auth?.value
      if (authValue && typeof authValue === "string") {
        const payload = await jwt.verify(authValue)
        if (payload) {
          const userId = payload.userId as number
          // Only count view if user hasn't viewed this post before
          try {
            await db.$executeRaw`
              INSERT OR IGNORE INTO post_views (user_id, post_id, created_at) 
              VALUES (${userId}, ${post.id}, datetime('now'))
            `
          } catch (e) {
            // Ignore duplicate key errors
          }
        }
      }

      // Get actual unique view count
      const viewCountResult = await db.$queryRaw<[{count: number}]>`
        SELECT COUNT(*) as count FROM post_views WHERE post_id = ${post.id}
      `
      const viewCount = Number(viewCountResult[0]?.count || 0)
      
      return formatPost({ ...post, viewCount })
    } catch (error) {
      log.posts.error("Error fetching post", { postId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to fetch post" }
    }
  })
  // Update post
  .put("/:id", async ({ params, body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const postId = Number(params.id)
    if (isNaN(postId)) {
      set.status = 400
      return { error: "Invalid post ID" }
    }
    try {
      const existing = await db.post.findUnique({ where: { id: postId } })
      if (!existing) {
        set.status = 404
        return { error: "Post not found" }
      }
      const user = await db.user.findUnique({ where: { id: payload.userId } })
      if (existing.authorId !== payload.userId && user?.role !== "admin") {
        set.status = 403
        return { error: "Not authorized" }
      }
      const { title, excerpt, content, coverImage, technologies, files } = body
      await db.postFile.deleteMany({ where: { postId } })
      const post = await db.post.update({
        where: { id: postId },
        data: {
          ...(title && { title }),
          ...(excerpt !== undefined && { excerpt }),
          ...(content && { content }),
          ...(coverImage !== undefined && { coverImage }),
          ...(technologies && { technologies: JSON.stringify(technologies) }),
          files: files?.length
            ? { create: files.map((f) => ({ name: f.name, language: f.language, code: f.code })) }
            : undefined,
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
          _count: { select: { favorites: true, likes: true, comments: true, reposts: true } },
        },
      })
      return formatPost(post)
    } catch (error) {
      log.posts.error("Error updating post", { postId }, error as Error)
      set.status = 500
      return { error: "Failed to update post" }
    }
  }, {
    params: schemas.idParam,
    body: schemas.updatePost,
  })
  // Delete post
  .delete("/:id", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const postId = Number(params.id)
    if (isNaN(postId)) {
      set.status = 400
      return { error: "Invalid post ID" }
    }
    try {
      const existing = await db.post.findUnique({ where: { id: postId } })
      if (!existing) {
        set.status = 404
        return { error: "Post not found" }
      }
      const user = await db.user.findUnique({ where: { id: payload.userId } })
      if (existing.authorId !== payload.userId && user?.role !== "admin") {
        set.status = 403
        return { error: "Not authorized" }
      }
      // Delete related records first
      await db.postFile.deleteMany({ where: { postId } })
      await db.favorite.deleteMany({ where: { postId } })
      await db.comment.deleteMany({ where: { postId } })
      await db.post.delete({ where: { id: postId } })
      return { message: "Post deleted" }
    } catch (error) {
      log.posts.error("Error deleting post", { postId }, error as Error)
      set.status = 500
      return { error: "Failed to delete post" }
    }
  }, {
    params: schemas.idParam,
  })
  // Like post (toggle like)
  .post("/:id/like", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const postId = Number(params.id)
    if (isNaN(postId)) {
      set.status = 400
      return { error: "Invalid post ID" }
    }
    try {
      const existing = await db.like.findUnique({ where: { userId_postId: { userId: payload.userId, postId } } })
      if (existing) {
        await db.like.delete({ where: { id: existing.id } })
        return { liked: false }
      } else {
        await db.like.create({ data: { userId: payload.userId, postId } })
        return { liked: true }
      }
    } catch (error) {
      log.posts.error("Error toggling like", { postId }, error as Error)
      set.status = 500
      return { error: "Failed to toggle like" }
    }
  })
  // Favorite post
  .post("/:id/favorite", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const postId = Number(params.id)
    if (isNaN(postId)) {
      set.status = 400
      return { error: "Invalid post ID" }
    }
    try {
      const existing = await db.favorite.findUnique({ where: { userId_postId: { userId: payload.userId, postId } } })
      if (existing) {
        await db.favorite.delete({ where: { id: existing.id } })
        return { favorited: false }
      } else {
        await db.favorite.create({ data: { userId: payload.userId, postId } })
        return { favorited: true }
      }
    } catch (error) {
      log.posts.error("Error toggling favorite", { postId }, error as Error)
      set.status = 500
      return { error: "Failed to toggle favorite" }
    }
  })

// Pinned tech routes
export const pinnedTechRoutes = new Elysia({ prefix: "/api/pinned-tech" })
  .use(jwt(jwtConfig))
  // Get user's pinned techs with unread counts
  .get("/", async ({ set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    try {
      const pinnedTechs = await db.pinnedTech.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: "asc" },
      })

      // Get unread counts for each pinned tech
      const result = await Promise.all(
        pinnedTechs.map(async (pt: any) => {
          const posts = await db.post.findMany({
            where: { createdAt: { gt: pt.lastReadAt } },
            select: { technologies: true, createdAt: true },
          })
          const unreadCount = posts.filter((p: any) => {
            const techs = JSON.parse(p.technologies || "[]")
            return techs.some((t: string) => t.toLowerCase() === pt.techName.toLowerCase())
          }).length
          return {
            techName: pt.techName,
            unreadCount,
            lastReadAt: pt.lastReadAt.toISOString(),
          }
        })
      )
      return result
    } catch (error) {
      log.posts.error("Error fetching pinned techs", {}, error as Error)
      return []
    }
  })
  // Pin a tech
  .post("/:tech", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const techName = decodeURIComponent(params.tech)
    log.posts.debug("Pinning tech", { techName, userId: payload.userId })
    try {
      const existing = await db.pinnedTech.findFirst({
        where: { userId: payload.userId, techName },
      })
      if (existing) {
        return { pinned: true, message: "Already pinned" }
      }
      await db.pinnedTech.create({
        data: { userId: payload.userId, techName, lastReadAt: new Date() },
      })
      log.posts.info("Tech pinned", { techName })
      set.status = 201
      return { pinned: true }
    } catch (error) {
      log.posts.error("Error pinning tech", { techName }, error as Error)
      set.status = 500
      return { error: "Failed to pin tech" }
    }
  })
  // Unpin a tech
  .delete("/:tech", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const techName = decodeURIComponent(params.tech)
    try {
      await db.pinnedTech.deleteMany({ where: { userId: payload.userId, techName } })
      return { pinned: false }
    } catch (error) {
      log.posts.error("Error unpinning tech", { techName }, error as Error)
      set.status = 500
      return { error: "Failed to unpin tech" }
    }
  })
  // Mark tech as read (update lastReadAt)
  .post("/:tech/read", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }
    const techName = decodeURIComponent(params.tech)
    try {
      await db.pinnedTech.updateMany({
        where: { userId: payload.userId, techName },
        data: { lastReadAt: new Date() },
      })
      return { success: true }
    } catch (error) {
      log.posts.error("Error marking as read", { techName }, error as Error)
      set.status = 500
      return { error: "Failed to mark as read" }
    }
  })
