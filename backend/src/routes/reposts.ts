import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { jwtConfig, verifyAuth, requireAuth } from "../middleware/auth";
import { log } from "../lib/logger";

export const repostRoutes = new Elysia({ prefix: "/api/reposts" })
  .use(jwt(jwtConfig))
  // Create or remove repost
  .post(
    "/:postId",
    async ({ params, body, set, jwt, cookie: { auth } }) => {
      const payload = await verifyAuth(jwt, auth?.value);
      if (!requireAuth(set, payload)) {
        return { error: "Not authenticated" };
      }

      const postId = Number(params.postId);
      if (isNaN(postId)) {
        set.status = 400;
        return { error: "Invalid post ID" };
      }

      // Check if post exists
      const post = await db.post.findUnique({ where: { id: postId } });
      if (!post) {
        set.status = 404;
        return { error: "Post not found" };
      }

      try {
        // Check if already reposted
        const existing = await db.repost.findUnique({
          where: {
            userId_postId: {
              userId: payload.userId,
              postId,
            },
          },
        });

        if (existing) {
          // Remove repost
          await db.repost.delete({ where: { id: existing.id } });
          log.posts.info("Repost removed", { userId: payload.userId, postId });
          return { reposted: false };
        } else {
          // Create repost
          const repost = await db.repost.create({
            data: {
              userId: payload.userId,
              postId,
              quote: body?.quote || null,
            },
          });
          log.posts.info("Post reposted", { userId: payload.userId, postId, quote: !!body?.quote });
          return { reposted: true, repostId: repost.id };
        }
      } catch (error) {
        log.posts.error("Error toggling repost", { postId }, error as Error);
        set.status = 500;
        return { error: "Failed to toggle repost" };
      }
    },
    {
      params: t.Object({ postId: t.String() }),
      body: t.Optional(t.Object({
        quote: t.Optional(t.String()),
      })),
    }
  )
  // Update repost quote
  .put(
    "/:postId",
    async ({ params, body, set, jwt, cookie: { auth } }) => {
      const payload = await verifyAuth(jwt, auth?.value);
      if (!requireAuth(set, payload)) {
        return { error: "Not authenticated" };
      }

      const postId = Number(params.postId);
      if (isNaN(postId)) {
        set.status = 400;
        return { error: "Invalid post ID" };
      }

      try {
        const repost = await db.repost.findUnique({
          where: {
            userId_postId: {
              userId: payload.userId,
              postId,
            },
          },
        });

        if (!repost) {
          set.status = 404;
          return { error: "Repost not found" };
        }

        await db.repost.update({
          where: { id: repost.id },
          data: { quote: body.quote || null },
        });

        return { success: true };
      } catch (error) {
        log.posts.error("Error updating repost", { postId }, error as Error);
        set.status = 500;
        return { error: "Failed to update repost" };
      }
    },
    {
      params: t.Object({ postId: t.String() }),
      body: t.Object({
        quote: t.Optional(t.String()),
      }),
    }
  )
  // Check if user has reposted a post
  .get(
    "/:postId/status",
    async ({ params, set, jwt, cookie: { auth } }) => {
      const payload = await verifyAuth(jwt, auth?.value);
      if (!payload) {
        return { reposted: false, quote: null };
      }

      const postId = Number(params.postId);
      if (isNaN(postId)) {
        return { reposted: false, quote: null };
      }

      const repost = await db.repost.findUnique({
        where: {
          userId_postId: {
            userId: payload.userId,
            postId,
          },
        },
      });

      return {
        reposted: !!repost,
        quote: repost?.quote || null,
      };
    },
    {
      params: t.Object({ postId: t.String() }),
    }
  )
  // Get reposts for a post
  .get(
    "/:postId",
    async ({ params, query }) => {
      const postId = Number(params.postId);
      const limit = parseInt(query.limit as string) || 20;
      const offset = parseInt(query.offset as string) || 0;

      if (isNaN(postId)) {
        return [];
      }

      const reposts = await db.repost.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return reposts.map((r: any) => ({
        id: r.id,
        quote: r.quote,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          username: r.user.username,
          avatar: r.user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${r.user.username}`,
        },
      }));
    },
    {
      params: t.Object({ postId: t.String() }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  // Get repost count for a post
  .get(
    "/:postId/count",
    async ({ params }) => {
      const postId = Number(params.postId);
      if (isNaN(postId)) {
        return { count: 0 };
      }

      const count = await db.repost.count({ where: { postId } });
      return { count };
    },
    {
      params: t.Object({ postId: t.String() }),
    }
  );
