import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { jwtConfig, verifyAuth, requireAuth } from "../middleware/auth";

// Helper to format post data
const formatPost = (post: any) => ({
  id: String(post.id),
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  coverImage: post.coverImage,
  technologies: JSON.parse(post.technologies || "[]"),
  viewCount: post.viewCount,
  createdAt: post.createdAt,
  author: {
    id: String(post.author.id),
    username: post.author.username,
    avatar: post.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.username}`,
  },
  favorites: post._count?.favorites || 0,
  reposts: post._count?.reposts || 0,
  comments: post._count?.comments || 0,
});

export const feedRoutes = new Elysia({ prefix: "/api/feed" })
  .use(jwt(jwtConfig))
  // Get personalized feed for logged-in user (posts + reposts from followed users)
  .get(
    "/",
    async ({ query, set, jwt, cookie: { auth } }) => {
      const payload = await verifyAuth(jwt, auth?.value);
      const limit = parseInt(query.limit as string) || 20;
      const offset = parseInt(query.offset as string) || 0;

      if (!payload) {
        // Not logged in - return latest posts
        const posts = await db.post.findMany({
          include: {
            author: {
              select: { id: true, username: true, profilePhoto: true },
            },
            _count: { select: { favorites: true, reposts: true, comments: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        });

        return posts.map((p: any) => ({
          type: "post" as const,
          ...formatPost(p),
        }));
      }

      const userId = payload.userId;

      // Get IDs of users the current user follows
      const following = await db.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map((f: any) => f.followingId);

      // Get posts from followed users
      const posts = await db.post.findMany({
        where: { authorId: { in: followingIds } },
        include: {
          author: {
            select: { id: true, username: true, profilePhoto: true },
          },
          _count: { select: { favorites: true, reposts: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2, // Get more to merge with reposts
      });

      // Get reposts from followed users
      const reposts = await db.repost.findMany({
        where: { userId: { in: followingIds } },
        include: {
          user: {
            select: { id: true, username: true, profilePhoto: true },
          },
          post: {
            include: {
              author: {
                select: { id: true, username: true, profilePhoto: true },
              },
              _count: { select: { favorites: true, reposts: true, comments: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
      });

      // Combine and sort by date
      const feedItems: any[] = [];

      posts.forEach((p: any) => {
        feedItems.push({
          type: "post",
          sortDate: p.createdAt,
          ...formatPost(p),
        });
      });

      reposts.forEach((r: any) => {
        feedItems.push({
          type: "repost",
          sortDate: r.createdAt,
          repostId: r.id,
          repostedBy: {
            id: String(r.user.id),
            username: r.user.username,
            avatar: r.user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${r.user.username}`,
          },
          repostedAt: r.createdAt,
          quote: r.quote,
          ...formatPost(r.post),
        });
      });

      // Sort by date descending
      feedItems.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

      // Remove sortDate and apply pagination
      return feedItems.slice(offset, offset + limit).map(({ sortDate, ...item }) => item);
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  // Get user's activity feed (their posts + reposts)
  .get(
    "/user/:userId",
    async ({ params, query }) => {
      const userId = Number(params.userId);
      const limit = parseInt(query.limit as string) || 20;
      const offset = parseInt(query.offset as string) || 0;

      if (isNaN(userId)) {
        return [];
      }

      // Get user's posts
      const posts = await db.post.findMany({
        where: { authorId: userId },
        include: {
          author: {
            select: { id: true, username: true, profilePhoto: true },
          },
          _count: { select: { favorites: true, reposts: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
      });

      // Get user's reposts
      const reposts = await db.repost.findMany({
        where: { userId },
        include: {
          user: {
            select: { id: true, username: true, profilePhoto: true },
          },
          post: {
            include: {
              author: {
                select: { id: true, username: true, profilePhoto: true },
              },
              _count: { select: { favorites: true, reposts: true, comments: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
      });

      // Combine and sort
      const feedItems: any[] = [];

      posts.forEach((p: any) => {
        feedItems.push({
          type: "post",
          sortDate: p.createdAt,
          ...formatPost(p),
        });
      });

      reposts.forEach((r: any) => {
        feedItems.push({
          type: "repost",
          sortDate: r.createdAt,
          repostId: r.id,
          repostedBy: {
            id: String(r.user.id),
            username: r.user.username,
            avatar: r.user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${r.user.username}`,
          },
          repostedAt: r.createdAt,
          quote: r.quote,
          ...formatPost(r.post),
        });
      });

      feedItems.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

      return feedItems.slice(offset, offset + limit).map(({ sortDate, ...item }) => item);
    },
    {
      params: t.Object({ userId: t.String() }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  // Get discover feed (popular posts for non-logged-in or mixed content)
  .get(
    "/discover",
    async ({ query }) => {
      const limit = parseInt(query.limit as string) || 20;
      const offset = parseInt(query.offset as string) || 0;

      const posts = await db.post.findMany({
        include: {
          author: {
            select: { id: true, username: true, profilePhoto: true },
          },
          _count: { select: { favorites: true, reposts: true, comments: true } },
        },
        orderBy: [
          { viewCount: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
        skip: offset,
      });

      return posts.map((p: any) => ({
        type: "post" as const,
        ...formatPost(p),
      }));
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  );
