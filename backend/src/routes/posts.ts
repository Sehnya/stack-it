import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";

// Helper to get user from JWT
async function getUserFromAuth(
  jwtInstance: { verify: (token: string) => Promise<any> },
  authValue: unknown
) {
  if (!authValue || typeof authValue !== "string") {
    return null;
  }
  const payload = await jwtInstance.verify(authValue);
  if (!payload) return null;

  return db.user.findUnique({
    where: { id: payload.userId as number },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      profilePhoto: true,
    },
  });
}

export const postRoutes = new Elysia({ prefix: "/api/posts" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    })
  )
  // Get all posts (public)
  .get(
    "/",
    async ({ query }) => {
      const { category, limit = "20", offset = "0" } = query;

      const where = category ? { category } : {};

      const posts = await db.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePhoto: true,
            },
          },
          _count: {
            select: { favorites: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
      });

      return { posts };
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  // Get single post (public)
  .get(
    "/:id",
    async ({ params }) => {
      const post = await db.post.findUnique({
        where: { id: Number(params.id) },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePhoto: true,
            },
          },
          _count: {
            select: { favorites: true },
          },
        },
      });

      if (!post) {
        return { error: "Post not found" };
      }

      return { post };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Create post (auth required)
  .post(
    "/",
    async ({ body, jwt, cookie: { auth } }) => {
      const user = await getUserFromAuth(jwt, auth?.value);
      if (!user) {
        return { error: "Unauthorized" };
      }

      const post = await db.post.create({
        data: {
          title: body.title,
          summary: body.summary,
          body: body.body,
          tags: body.tags,
          category: body.category,
          authorId: user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePhoto: true,
            },
          },
        },
      });

      return { message: "Post created", post };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        summary: t.String(),
        body: t.String(),
        tags: t.String(),
        category: t.String(),
      }),
    }
  )
  // Update post (auth required)
  .put(
    "/:id",
    async ({ params, body, jwt, cookie: { auth } }) => {
      const user = await getUserFromAuth(jwt, auth?.value);
      if (!user) {
        return { error: "Unauthorized" };
      }

      const post = await db.post.findUnique({
        where: { id: Number(params.id) },
      });

      if (!post) {
        return { error: "Post not found" };
      }

      // Check ownership or admin
      if (post.authorId !== user.id && user.role !== "admin") {
        return { error: "Forbidden" };
      }

      const updated = await db.post.update({
        where: { id: Number(params.id) },
        data: {
          title: body.title,
          summary: body.summary,
          body: body.body,
          tags: body.tags,
          category: body.category,
        },
      });

      return { message: "Post updated", post: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        summary: t.Optional(t.String()),
        body: t.Optional(t.String()),
        tags: t.Optional(t.String()),
        category: t.Optional(t.String()),
      }),
    }
  )
  // Delete post (auth required)
  .delete(
    "/:id",
    async ({ params, jwt, cookie: { auth } }) => {
      const user = await getUserFromAuth(jwt, auth?.value);
      if (!user) {
        return { error: "Unauthorized" };
      }

      const post = await db.post.findUnique({
        where: { id: Number(params.id) },
      });

      if (!post) {
        return { error: "Post not found" };
      }

      if (post.authorId !== user.id && user.role !== "admin") {
        return { error: "Forbidden" };
      }

      await db.post.delete({ where: { id: Number(params.id) } });

      return { message: "Post deleted" };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );
