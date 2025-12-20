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

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    })
  )
  // Get user profile (public)
  .get(
    "/:id",
    async ({ params }) => {
      const user = await db.user.findUnique({
        where: { id: Number(params.id) },
        select: {
          id: true,
          username: true,
          profilePhoto: true,
          lastSeen: true,
          createdAt: true,
          _count: {
            select: { posts: true, favorites: true },
          },
        },
      });

      if (!user) {
        return { error: "User not found" };
      }

      return { user };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )
  // Update profile (auth required)
  .put(
    "/profile",
    async ({ body, jwt, cookie: { auth } }) => {
      const user = await getUserFromAuth(jwt, auth?.value);
      if (!user) {
        return { error: "Unauthorized" };
      }

      const updated = await db.user.update({
        where: { id: user.id },
        data: {
          username: body.username,
          profilePhoto: body.profilePhoto,
        },
        select: {
          id: true,
          username: true,
          email: true,
          profilePhoto: true,
        },
      });

      return { message: "Profile updated", user: updated };
    },
    {
      body: t.Object({
        username: t.Optional(t.String({ minLength: 3 })),
        profilePhoto: t.Optional(t.String()),
      }),
    }
  )
  // Dismiss welcome banner (auth required)
  .post("/dismiss-banner", async ({ jwt, cookie: { auth } }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (!user) {
      return { error: "Unauthorized" };
    }

    await db.user.update({
      where: { id: user.id },
      data: { dismissedWelcomeBanner: true },
    });

    return { message: "Banner dismissed" };
  })
  // Get user's posts (public)
  .get(
    "/:id/posts",
    async ({ params, query }) => {
      const { limit = "20", offset = "0" } = query;

      const posts = await db.post.findMany({
        where: { authorId: Number(params.id) },
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
      params: t.Object({ id: t.String() }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  );
