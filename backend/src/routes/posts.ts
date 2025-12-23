import { Elysia } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { db } from "../db"

// Helper to format post response
function formatPost(post: any): any {
  return {
    id: String(post.id),
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    technologies: JSON.parse(post.technologies || "[]"),
    viewCount: post.viewCount,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: String(post.author.id),
      username: post.author.username,
      avatar: post.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.username}`,
    },
    files: post.files || [],
    likes: post._count?.favorites || 0,
    favorites: post._count?.favorites || 0,
    comments: post._count?.comments || 0,
  }
}

export const postsRoutes = new Elysia({ prefix: "/api/posts" })
  .use(jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  }))
  // STATIC ROUTES FIRST (before /:id to avoid route conflicts)
  // Get user's favorites
  .get("/favorites/me", async ({ set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") {
      set.status = 401
      return { error: "Not authenticated" }
    }
    const payload = await jwt.verify(authValue)
    if (!payload) {
      set.status = 401
      return { error: "Invalid token" }
    }
    const userId = payload.userId as number
    try {
      const favorites = await db.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            include: {
              author: { select: { id: true, username: true, profilePhoto: true } },
              files: true,
              _count: { select: { favorites: true, comments: true } },
            },
          },
        },
      })
      return favorites.map((fav: any) => ({
        ...formatPost(fav.post),
        savedAt: fav.createdAt.toISOString(),
      }))
    } catch (error) {
      console.error("[POSTS] Error fetching favorites:", error)
      return []
    }
  })
  // Get user stats
  .get("/stats/me", async ({ set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") {
      set.status = 401
      return { error: "Not authenticated" }
    }
    const payload = await jwt.verify(authValue)
    if (!payload) {
      set.status = 401
      return { error: "Invalid token" }
    }
    const userId = payload.userId as number
    try {
      const [postCount, totalViews, followerCount, followingCount] = await Promise.all([
        db.post.count({ where: { authorId: userId } }),
        db.post.aggregate({ where: { authorId: userId }, _sum: { viewCount: true } }),
        db.follow.count({ where: { followingId: userId } }),
        db.follow.count({ where: { followerId: userId } }),
      ])
      return {
        posts: postCount,
        likes: 0,
        views: totalViews._sum.viewCount || 0,
        followers: followerCount,
        following: followingCount,
      }
    } catch (error) {
      console.error("[POSTS] Error fetching stats:", error)
      return { posts: 0, likes: 0, views: 0, followers: 0, following: 0 }
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
      console.error("[POSTS] Error fetching top users:", error)
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
      console.error("[POSTS] Error fetching trending tech:", error)
      return []
    }
  })
  // Get posts by technology
  .get("/tech/:tech", async ({ params }) => {
    const tech = decodeURIComponent(params.tech)
    try {
      const posts = await db.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
          _count: { select: { favorites: true, comments: true } },
        },
      })
      // Filter posts that contain the technology (case-insensitive)
      const filtered = posts.filter((p: any) => {
        const techs = JSON.parse(p.technologies || "[]")
        return techs.some((t: string) => t.toLowerCase() === tech.toLowerCase())
      })
      return filtered.map(formatPost)
    } catch (error) {
      console.error("[POSTS] Error fetching posts by tech:", error)
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
        orderBy: sort === "popular" ? { viewCount: "desc" } : { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
          _count: { select: { favorites: true, comments: true } },
        },
      })
      return posts.map(formatPost)
    } catch (error) {
      console.error("[POSTS] Error fetching posts:", error)
      return []
    }
  })
  // Create post
  .post("/", async ({ body, set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") {
      set.status = 401
      return { error: "Not authenticated" }
    }
    const payload = await jwt.verify(authValue)
    if (!payload) {
      set.status = 401
      return { error: "Invalid token" }
    }
    const { title, excerpt, content, coverImage, technologies, files } = body as any
    try {
      const post = await db.post.create({
        data: {
          title,
          excerpt,
          content,
          coverImage,
          technologies: JSON.stringify(technologies || []),
          authorId: payload.userId as number,
          files: files?.length
            ? { create: files.map((f: any) => ({ name: f.name, language: f.language, code: f.code })) }
            : undefined,
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
        },
      })
      return formatPost({ ...post, _count: { favorites: 0, comments: 0 } })
    } catch (error) {
      console.error("[POSTS] Error creating post:", error)
      set.status = 500
      return { error: "Failed to create post" }
    }
  })
  // PARAMETERIZED ROUTES LAST (after static routes)
  // Get single post
  .get("/:id", async ({ params, set }) => {
    try {
      const post = await db.post.findUnique({
        where: { id: Number(params.id) },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
          _count: { select: { favorites: true, comments: true } },
        },
      })
      if (!post) {
        set.status = 404
        return { error: "Post not found" }
      }
      await db.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
      return formatPost({ ...post, viewCount: post.viewCount + 1 })
    } catch (error) {
      console.error("[POSTS] Error fetching post:", error)
      set.status = 500
      return { error: "Failed to fetch post" }
    }
  })
  // Update post
  .put("/:id", async ({ params, body, set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") {
      set.status = 401
      return { error: "Not authenticated" }
    }
    const payload = await jwt.verify(authValue)
    if (!payload) {
      set.status = 401
      return { error: "Invalid token" }
    }
    const postId = Number(params.id)
    const userId = payload.userId as number
    try {
      const existing = await db.post.findUnique({ where: { id: postId } })
      if (!existing) {
        set.status = 404
        return { error: "Post not found" }
      }
      const user = await db.user.findUnique({ where: { id: userId } })
      if (existing.authorId !== userId && user?.role !== "admin") {
        set.status = 403
        return { error: "Not authorized" }
      }
      const { title, excerpt, content, coverImage, technologies, files } = body as any
      await db.postFile.deleteMany({ where: { postId } })
      const post = await db.post.update({
        where: { id: postId },
        data: {
          title,
          excerpt,
          content,
          coverImage,
          technologies: JSON.stringify(technologies || []),
          files: files?.length
            ? { create: files.map((f: any) => ({ name: f.name, language: f.language, code: f.code })) }
            : undefined,
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
          _count: { select: { favorites: true, comments: true } },
        },
      })
      return formatPost(post)
    } catch (error) {
      console.error("[POSTS] Error updating post:", error)
      set.status = 500
      return { error: "Failed to update post" }
    }
  })
  // Delete post
  .delete("/:id", async ({ params, set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") {
      set.status = 401
      return { error: "Not authenticated" }
    }
    const payload = await jwt.verify(authValue)
    if (!payload) {
      set.status = 401
      return { error: "Invalid token" }
    }
    const postId = Number(params.id)
    const userId = payload.userId as number
    try {
      const existing = await db.post.findUnique({ where: { id: postId } })
      if (!existing) {
        set.status = 404
        return { error: "Post not found" }
      }
      const user = await db.user.findUnique({ where: { id: userId } })
      if (existing.authorId !== userId && user?.role !== "admin") {
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
      console.error("[POSTS] Error deleting post:", error)
      set.status = 500
      return { error: "Failed to delete post" }
    }
  })
  // Like post (toggle favorite)
  .post("/:id/like", async ({ params, set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") {
      set.status = 401
      return { error: "Not authenticated" }
    }
    const payload = await jwt.verify(authValue)
    if (!payload) {
      set.status = 401
      return { error: "Invalid token" }
    }
    const userId = payload.userId as number
    const postId = Number(params.id)
    try {
      const existing = await db.favorite.findUnique({ where: { userId_postId: { userId, postId } } })
      if (existing) {
        await db.favorite.delete({ where: { id: existing.id } })
        return { liked: false }
      } else {
        await db.favorite.create({ data: { userId, postId } })
        return { liked: true }
      }
    } catch (error) {
      console.error("[POSTS] Error toggling like:", error)
      set.status = 500
      return { error: "Failed to toggle like" }
    }
  })
  // Favorite post
  .post("/:id/favorite", async ({ params, set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") {
      set.status = 401
      return { error: "Not authenticated" }
    }
    const payload = await jwt.verify(authValue)
    if (!payload) {
      set.status = 401
      return { error: "Invalid token" }
    }
    const userId = payload.userId as number
    const postId = Number(params.id)
    try {
      const existing = await db.favorite.findUnique({ where: { userId_postId: { userId, postId } } })
      if (existing) {
        await db.favorite.delete({ where: { id: existing.id } })
        return { favorited: false }
      } else {
        await db.favorite.create({ data: { userId, postId } })
        return { favorited: true }
      }
    } catch (error) {
      console.error("[POSTS] Error toggling favorite:", error)
      set.status = 500
      return { error: "Failed to toggle favorite" }
    }
  })
