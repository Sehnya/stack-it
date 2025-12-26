import { Elysia, t } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { db } from "../db"
import { jwtConfig, verifyAuth, requireAuth } from "../middleware/auth"
import { log } from "../lib/logger"

// Helper to format snippet response
function formatSnippet(snippet: any, userId?: number): any {
  const ratings = snippet.ratings || []
  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
    : 0
  const userRating = userId ? ratings.find((r: any) => r.userId === userId)?.rating : null
  const isFavorited = userId ? snippet.favorites?.some((f: any) => f.userId === userId) : false

  return {
    id: String(snippet.id),
    title: snippet.title,
    description: snippet.description,
    code: snippet.code,
    language: snippet.language,
    tags: JSON.parse(snippet.tags || "[]"),
    viewCount: snippet.viewCount,
    createdAt: snippet.createdAt.toISOString(),
    updatedAt: snippet.updatedAt.toISOString(),
    author: {
      id: String(snippet.author.id),
      username: snippet.author.username,
      avatar: snippet.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${snippet.author.username}`,
    },
    rating: {
      average: Math.round(avgRating * 10) / 10,
      count: ratings.length,
      userRating,
    },
    favorites: snippet._count?.favorites || snippet.favorites?.length || 0,
    isFavorited,
  }
}

export const snippetsRoutes = new Elysia({ prefix: "/api/snippets" })
  .use(jwt(jwtConfig))

  // Get all snippets
  .get("/", async ({ query, jwt, cookie: { auth } }) => {
    const sort = query.sort || "latest"
    const limit = parseInt(query.limit as string) || 20
    const offset = parseInt(query.offset as string) || 0
    const language = query.language as string | undefined

    // Get current user for personalized data
    const payload = await verifyAuth(jwt, auth?.value)
    const userId = payload?.userId

    try {
      const where = language ? { language } : {}
      
      const snippets = await db.snippet.findMany({
        where,
        orderBy: sort === "popular" 
          ? [{ viewCount: "desc" }, { createdAt: "desc" }]
          : sort === "top-rated"
          ? [{ createdAt: "desc" }] // Will sort by rating after
          : [{ createdAt: "desc" }],
        take: limit,
        skip: offset,
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          ratings: true,
          favorites: true,
          _count: { select: { favorites: true, ratings: true } },
        },
      })

      let formatted = snippets.map((s: any) => formatSnippet(s, userId))

      // Sort by rating if requested
      if (sort === "top-rated") {
        formatted.sort((a: any, b: any) => b.rating.average - a.rating.average)
      }

      return formatted
    } catch (error) {
      log.server.error("Error fetching snippets", {}, error as Error)
      return []
    }
  })

  // Get snippet by ID
  .get("/:id", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    const userId = payload?.userId

    try {
      const snippet = await db.snippet.findUnique({
        where: { id: parseInt(params.id) },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          ratings: true,
          favorites: true,
          _count: { select: { favorites: true, ratings: true } },
        },
      })

      if (!snippet) {
        set.status = 404
        return { error: "Snippet not found" }
      }

      // Increment view count
      await db.snippet.update({
        where: { id: parseInt(params.id) },
        data: { viewCount: { increment: 1 } },
      })

      return formatSnippet(snippet, userId)
    } catch (error) {
      log.server.error("Error fetching snippet", { snippetId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to fetch snippet" }
    }
  })

  // Create snippet
  .post("/", async ({ body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }

    const { title, description, code, language, tags } = body

    try {
      const snippet = await db.snippet.create({
        data: {
          title,
          description: description || null,
          code,
          language,
          tags: JSON.stringify(tags || []),
          authorId: payload.userId,
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          ratings: true,
          favorites: true,
          _count: { select: { favorites: true, ratings: true } },
        },
      })

      log.server.info("Snippet created", { snippetId: snippet.id, userId: payload.userId })
      set.status = 201
      return formatSnippet(snippet, payload.userId)
    } catch (error) {
      log.server.error("Error creating snippet", {}, error as Error)
      set.status = 500
      return { error: "Failed to create snippet" }
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 200 }),
      description: t.Optional(t.String({ maxLength: 500 })),
      code: t.String({ minLength: 1 }),
      language: t.String({ minLength: 1 }),
      tags: t.Optional(t.Array(t.String())),
    }),
  })

  // Update snippet
  .put("/:id", async ({ params, body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }

    const snippetId = parseInt(params.id)

    try {
      const snippet = await db.snippet.findUnique({
        where: { id: snippetId },
      })

      if (!snippet) {
        set.status = 404
        return { error: "Snippet not found" }
      }

      if (snippet.authorId !== payload.userId) {
        set.status = 403
        return { error: "Not authorized" }
      }

      const { title, description, code, language, tags } = body

      const updated = await db.snippet.update({
        where: { id: snippetId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(code && { code }),
          ...(language && { language }),
          ...(tags && { tags: JSON.stringify(tags) }),
        },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          ratings: true,
          favorites: true,
          _count: { select: { favorites: true, ratings: true } },
        },
      })

      return formatSnippet(updated, payload.userId)
    } catch (error) {
      log.server.error("Error updating snippet", { snippetId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to update snippet" }
    }
  }, {
    body: t.Object({
      title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
      description: t.Optional(t.String({ maxLength: 500 })),
      code: t.Optional(t.String({ minLength: 1 })),
      language: t.Optional(t.String({ minLength: 1 })),
      tags: t.Optional(t.Array(t.String())),
    }),
  })

  // Delete snippet
  .delete("/:id", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }

    const snippetId = parseInt(params.id)

    try {
      const snippet = await db.snippet.findUnique({
        where: { id: snippetId },
      })

      if (!snippet) {
        set.status = 404
        return { error: "Snippet not found" }
      }

      if (snippet.authorId !== payload.userId) {
        set.status = 403
        return { error: "Not authorized" }
      }

      await db.snippet.delete({ where: { id: snippetId } })
      return { message: "Snippet deleted" }
    } catch (error) {
      log.server.error("Error deleting snippet", { snippetId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to delete snippet" }
    }
  })

  // Rate snippet (1-5 stars)
  .post("/:id/rate", async ({ params, body, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }

    const snippetId = parseInt(params.id)
    const { rating } = body

    if (rating < 1 || rating > 5) {
      set.status = 400
      return { error: "Rating must be between 1 and 5" }
    }

    try {
      // Upsert rating
      await db.snippetRating.upsert({
        where: {
          snippetId_userId: {
            snippetId,
            userId: payload.userId,
          },
        },
        update: { rating },
        create: {
          snippetId,
          userId: payload.userId,
          rating,
        },
      })

      // Get updated average
      const ratings = await db.snippetRating.findMany({
        where: { snippetId },
      })
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

      log.server.info("Snippet rated", { snippetId, userId: payload.userId, rating })
      return { 
        rating,
        average: Math.round(avgRating * 10) / 10,
        count: ratings.length,
      }
    } catch (error) {
      log.server.error("Error rating snippet", { snippetId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to rate snippet" }
    }
  }, {
    body: t.Object({
      rating: t.Number({ minimum: 1, maximum: 5 }),
    }),
  })

  // Toggle favorite
  .post("/:id/favorite", async ({ params, set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }

    const snippetId = parseInt(params.id)

    try {
      const existing = await db.snippetFavorite.findUnique({
        where: {
          snippetId_userId: {
            snippetId,
            userId: payload.userId,
          },
        },
      })

      if (existing) {
        await db.snippetFavorite.delete({
          where: { id: existing.id },
        })
        return { favorited: false }
      } else {
        await db.snippetFavorite.create({
          data: {
            snippetId,
            userId: payload.userId,
          },
        })
        return { favorited: true }
      }
    } catch (error) {
      log.server.error("Error toggling favorite", { snippetId: params.id }, error as Error)
      set.status = 500
      return { error: "Failed to toggle favorite" }
    }
  })

  // Get snippets by tech/language
  .get("/tech/:tech", async ({ params, jwt, cookie: { auth } }) => {
    const tech = decodeURIComponent(params.tech).toLowerCase()
    const payload = await verifyAuth(jwt, auth?.value)
    const userId = payload?.userId

    try {
      const snippets = await db.snippet.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          ratings: true,
          favorites: true,
          _count: { select: { favorites: true, ratings: true } },
        },
      })

      // Filter by language or tag
      const filtered = snippets.filter((s: any) => {
        if (s.language.toLowerCase() === tech) return true
        const tags = JSON.parse(s.tags || "[]") as string[]
        return tags.some((tag: string) => tag.toLowerCase() === tech)
      })

      return filtered.map((s: any) => formatSnippet(s, userId))
    } catch (error) {
      log.server.error("Error fetching snippets by tech", { tech }, error as Error)
      return []
    }
  })

  // Get snippets by user
  .get("/user/:userId", async ({ params, jwt, cookie: { auth } }) => {
    const userId = parseInt(params.userId)
    const payload = await verifyAuth(jwt, auth?.value)
    const currentUserId = payload?.userId

    try {
      const snippets = await db.snippet.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, profilePhoto: true } },
          ratings: true,
          favorites: true,
          _count: { select: { favorites: true, ratings: true } },
        },
      })

      return snippets.map((s: any) => formatSnippet(s, currentUserId))
    } catch (error) {
      log.server.error("Error fetching user snippets", { userId: params.userId }, error as Error)
      return []
    }
  })

  // Get user's favorited snippets
  .get("/favorites/me", async ({ set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value)
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" }
    }

    try {
      const favorites = await db.snippetFavorite.findMany({
        where: { userId: payload.userId },
        include: {
          snippet: {
            include: {
              author: { select: { id: true, username: true, profilePhoto: true } },
              ratings: true,
              favorites: true,
              _count: { select: { favorites: true, ratings: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return favorites.map((f: any) => formatSnippet(f.snippet, payload.userId))
    } catch (error) {
      log.server.error("Error fetching favorite snippets", {}, error as Error)
      return []
    }
  })
