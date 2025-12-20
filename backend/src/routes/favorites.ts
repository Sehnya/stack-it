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

export const favoriteRoutes = new Elysia({ prefix: "/api/favorites" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    })
  )
  // Get user's favorites
  .get("/", async ({ jwt, cookie: { auth } }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (!user) {
      return { error: "Unauthorized" };
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { favorites };
  })
  // Add to favorites
  .post(
    "/:postId",
    async ({ params, jwt, cookie: { auth } }) => {
      const user = await getUserFromAuth(jwt, auth?.value);
      if (!user) {
        return { error: "Unauthorized" };
      }

      const postId = Number(params.postId);

      // Check if post exists
      const post = await db.post.findUnique({ where: { id: postId } });
      if (!post) {
        return { error: "Post not found" };
      }

      // Check if already favorited
      const existing = await db.favorite.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId,
          },
        },
      });

      if (existing) {
        return { error: "Already favorited" };
      }

      const favorite = await db.favorite.create({
        data: {
          userId: user.id,
          postId,
        },
      });

      return { message: "Added to favorites", favorite };
    },
    {
      params: t.Object({ postId: t.String() }),
    }
  )
  // Remove from favorites
  .delete(
    "/:postId",
    async ({ params, jwt, cookie: { auth } }) => {
      const user = await getUserFromAuth(jwt, auth?.value);
      if (!user) {
        return { error: "Unauthorized" };
      }

      const postId = Number(params.postId);

      const favorite = await db.favorite.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId,
          },
        },
      });

      if (!favorite) {
        return { error: "Not in favorites" };
      }

      await db.favorite.delete({
        where: { id: favorite.id },
      });

      return { message: "Removed from favorites" };
    },
    {
      params: t.Object({ postId: t.String() }),
    }
  )
  // Check if post is favorited
  .get(
    "/check/:postId",
    async ({ params, jwt, cookie: { auth } }) => {
      const user = await getUserFromAuth(jwt, auth?.value);
      if (!user) {
        return { isFavorited: false };
      }

      const favorite = await db.favorite.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: Number(params.postId),
          },
        },
      });

      return { isFavorited: !!favorite };
    },
    {
      params: t.Object({ postId: t.String() }),
    }
  );
