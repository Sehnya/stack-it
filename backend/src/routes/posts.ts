import { Elysia, t } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { db } from "../db"

export const postsRoutes = new Elysia({ prefix: "/api/posts" })
  .use(jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  }))
  .get("/", async ({ query }) => {
    const { sort = "latest", limit = "20", offset = "0" } = query
    try {
      const posts = await db.post.findMany({
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
          _count: { select: { favorites: true, comments: true } }
        }
      })
      return posts.map(post => ({
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
          avatar: post.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.username}`
        },
        files: post.files,
        likes: post._count.favorites,
        favorites: post._count.favorites,
        comments: post._count.comments
      }))
    } catch (error) {
      console.error("[POSTS] Error fetching posts:", error)
      return []
    }
  })
  .get("/:id", async ({ params, set }) => {
    try {
      const post = await db.post.findUnique({
        where: { id: Number(params.id) },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true,
          _count: { select: { favorites: true, comments: true } }
        }
      })
      if (!post) {
        set.status = 404
        return { error: "Post not found" }
      }
      await db.post.update({ where: { id: post.id }, data: { viewCount: post.viewCount + 1 } })
      return {
        id: String(post.id),
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        technologies: JSON.parse(post.technologies || "[]"),
        viewCount: post.viewCount + 1,
        createdAt: post.createdAt.toISOString(),
        author: {
          id: String(post.author.id),
          username: post.author.username,
          avatar: post.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.username}`
        },
        files: post.files,
        likes: post._count.favorites,
        favorites: post._count.favorites,
        comments: post._count.comments
      }
    } catch (error) {
      console.error("[POSTS] Error fetching post:", error)
      set.status = 500
      return { error: "Failed to fetch post" }
    }
  })
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
    const { title, excerpt, content, coverImage, technologies, files } = body as {
      title: string; excerpt: string; content: string; coverImage?: string
      technologies: string[]; files?: { name: string; language: string; code: string }[]
    }
    try {
      const post = await db.post.create({
        data: {
          title, excerpt, content, coverImage,
          technologies: JSON.stringify(technologies),
          authorId: payload.userId as number,
          files: files ? { create: files.map(f => ({ name: f.name, language: f.language, code: f.code })) } : undefined
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          files: true
        }
      })
      return {
        id: String(post.id), title: post.title, excerpt: post.excerpt, content: post.content,
        coverImage: post.coverImage, technologies: JSON.parse(post.technologies || "[]"),
        createdAt: post.createdAt.toISOString(),
        author: {
          id: String(post.author.id), username: post.author.username,
          avatar: post.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.username}`
        },
        files: post.files, likes: 0, favorites: 0
      }
    } catch (error) {
      console.error("[POSTS] Error creating post:", error)
      set.status = 500
      return { error: "Failed to create post" }
    }
  })
  .post("/:id/like", async ({ params, set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") { set.status = 401; return { error: "Not authenticated" } }
    const payload = await jwt.verify(authValue)
    if (!payload) { set.status = 401; return { error: "Invalid token" } }
    const userId = payload.userId as number
    const postId = Number(params.id)
    try {
      const existing = await db.like.findUnique({ where: { userId_postId: { userId, postId } } })
      if (existing) {
        await db.like.delete({ where: { id: existing.id } })
        return { liked: false }
      } else {
        await db.like.create({ data: { userId, postId } })
        return { liked: true }
      }
    } catch (error) {
      console.error("[POSTS] Error toggling like:", error)
      set.status = 500
      return { error: "Failed to toggle like" }
    }
  })
  .post("/:id/favorite", async ({ params, set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") { set.status = 401; return { error: "Not authenticated" } }
    const payload = await jwt.verify(authValue)
    if (!payload) { set.status = 401; return { error: "Invalid token" } }
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
  .get("/favorites/me", async ({ set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") { set.status = 401; return { error: "Not authenticated" } }
    const payload = await jwt.verify(authValue)
    if (!payload) { set.status = 401; return { error: "Invalid token" } }
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
              _count: { select: { favorites: true, comments: true } }
            }
          }
        }
      })
      return favorites.map(fav => ({
        id: String(fav.post.id), title: fav.post.title, excerpt: fav.post.excerpt,
        content: fav.post.content, coverImage: fav.post.coverImage,
        technologies: JSON.parse(fav.post.technologies || "[]"),
        viewCount: fav.post.viewCount, createdAt: fav.post.createdAt.toISOString(),
        savedAt: fav.createdAt.toISOString(),
        author: {
          id: String(fav.post.author.id), username: fav.post.author.username,
          avatar: fav.post.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${fav.post.author.username}`
        },
        files: fav.post.files, likes: fav.post._count.favorites,
        favorites: fav.post._count.favorites, comments: fav.post._count.comments
      }))
    } catch (error) {
      console.error("[POSTS] Error fetching favorites:", error)
      return []
    }
  })
  .get("/stats/me", async ({ set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value
    if (!authValue || typeof authValue !== "string") { set.status = 401; return { error: "Not authenticated" } }
    const payload = await jwt.verify(authValue)
    if (!payload) { set.status = 401; return { error: "Invalid token" } }
    const userId = payload.userId as number
    try {
      const [postCount, totalLikes, totalViews, followerCount, followingCount] = await Promise.all([
        db.post.count({ where: { authorId: userId } }),
        db.like.count({ where: { post: { authorId: userId } } }),
        db.post.aggregate({ where: { authorId: userId }, _sum: { viewCount: true } }),
        db.follow.count({ where: { followingId: userId } }),
        db.follow.count({ where: { followerId: userId } })
      ])
      return {
        posts: postCount, likes: totalLikes, views: totalViews._sum.viewCount || 0,
        followers: followerCount, following: followingCount
      }
    } catch (error) {
      console.error("[POSTS] Error fetching stats:", error)
      return { posts: 0, likes: 0, views: 0, followers: 0, following: 0 }
    }
  })
