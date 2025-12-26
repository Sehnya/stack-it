import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { jwtConfig, verifyAuth, requireAuth } from "../middleware/auth";
import { log } from "../lib/logger";

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .use(jwt(jwtConfig))
  // Get user profile (public)
  .get(
    "/:id",
    async ({ params, set, jwt, cookie: { auth } }) => {
      const userId = Number(params.id);
      if (isNaN(userId)) {
        set.status = 400;
        return { error: "Invalid user ID" };
      }

      // Get current user for isFollowing check
      const payload = await verifyAuth(jwt, auth?.value);
      const currentUserId = payload?.userId;

      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          profilePhoto: true,
          bio: true,
          lastSeen: true,
          createdAt: true,
          _count: {
            select: { 
              posts: true, 
              favorites: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      // Check if current user is following this user
      let isFollowing = false;
      if (currentUserId && currentUserId !== userId) {
        const follow = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: userId,
            },
          },
        });
        isFollowing = !!follow;
      }

      return { 
        user: {
          ...user,
          isFollowing,
        }
      };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )
  // Follow/unfollow user
  .post(
    "/:id/follow",
    async ({ params, set, jwt, cookie: { auth } }) => {
      const payload = await verifyAuth(jwt, auth?.value);
      if (!requireAuth(set, payload)) {
        return { error: "Not authenticated" };
      }

      const targetUserId = Number(params.id);
      if (isNaN(targetUserId)) {
        set.status = 400;
        return { error: "Invalid user ID" };
      }

      // Can't follow yourself
      if (payload.userId === targetUserId) {
        set.status = 400;
        return { error: "Cannot follow yourself" };
      }

      try {
        // Check if already following
        const existing = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: payload.userId,
              followingId: targetUserId,
            },
          },
        });

        if (existing) {
          // Unfollow
          await db.follow.delete({ where: { id: existing.id } });
          log.users.info("User unfollowed", { followerId: payload.userId, followingId: targetUserId });
          return { following: false };
        } else {
          // Follow
          await db.follow.create({
            data: {
              followerId: payload.userId,
              followingId: targetUserId,
            },
          });
          log.users.info("User followed", { followerId: payload.userId, followingId: targetUserId });
          return { following: true };
        }
      } catch (error) {
        log.users.error("Error toggling follow", { targetUserId }, error as Error);
        set.status = 500;
        return { error: "Failed to toggle follow" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )
  // Get user's followers
  .get(
    "/:id/followers",
    async ({ params, query }) => {
      const userId = Number(params.id);
      const limit = parseInt(query.limit as string) || 20;
      const offset = parseInt(query.offset as string) || 0;

      const followers = await db.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              profilePhoto: true,
              bio: true,
              _count: { select: { posts: true, followers: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return followers.map((f: any) => ({
        id: f.follower.id,
        username: f.follower.username,
        avatar: f.follower.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${f.follower.username}`,
        bio: f.follower.bio,
        posts: f.follower._count.posts,
        followers: f.follower._count.followers,
        followedAt: f.createdAt,
      }));
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  // Get user's following
  .get(
    "/:id/following",
    async ({ params, query }) => {
      const userId = Number(params.id);
      const limit = parseInt(query.limit as string) || 20;
      const offset = parseInt(query.offset as string) || 0;

      const following = await db.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              profilePhoto: true,
              bio: true,
              _count: { select: { posts: true, followers: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return following.map((f: any) => ({
        id: f.following.id,
        username: f.following.username,
        avatar: f.following.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${f.following.username}`,
        bio: f.following.bio,
        posts: f.following._count.posts,
        followers: f.following._count.followers,
        followedAt: f.createdAt,
      }));
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  // Update profile (auth required)
  .put(
    "/profile",
    async ({ body, set, jwt, cookie: { auth } }) => {
      const payload = await verifyAuth(jwt, auth?.value);
      if (!requireAuth(set, payload)) {
        return { error: "Not authenticated" };
      }

      try {
        const updated = await db.user.update({
          where: { id: payload.userId },
          data: {
            ...(body.username && { username: body.username }),
            ...(body.profilePhoto !== undefined && { profilePhoto: body.profilePhoto }),
            ...(body.bio !== undefined && { bio: body.bio }),
          },
          select: {
            id: true,
            username: true,
            email: true,
            profilePhoto: true,
            bio: true,
          },
        });

        return { message: "Profile updated", user: updated };
      } catch (error) {
        log.users.error("Error updating profile", { userId: payload.userId }, error as Error);
        set.status = 500;
        return { error: "Failed to update profile" };
      }
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        profilePhoto: t.Optional(t.String()),
        bio: t.Optional(t.String()),
      }),
    }
  )
  // Dismiss welcome banner (auth required)
  .post("/dismiss-banner", async ({ set, jwt, cookie: { auth } }) => {
    const payload = await verifyAuth(jwt, auth?.value);
    if (!requireAuth(set, payload)) {
      return { error: "Not authenticated" };
    }

    try {
      await db.user.update({
        where: { id: payload.userId },
        data: { dismissedWelcomeBanner: true },
      });

      return { message: "Banner dismissed" };
    } catch (error) {
      log.users.error("Error dismissing banner", { userId: payload.userId }, error as Error);
      set.status = 500;
      return { error: "Failed to dismiss banner" };
    }
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
