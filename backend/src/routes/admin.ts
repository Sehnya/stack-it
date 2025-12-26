import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { jwtConfig, verifyAuth } from "../middleware/auth";
import { log } from "../lib/logger";

// The only email allowed to have admin role
const ADMIN_EMAIL = "sehnyaw@gmail.com";

// Middleware to check admin role (specific to admin routes - checks email too)
async function requireAdminAccess(
  jwtInstance: { verify: (token: string) => Promise<any> },
  authValue: unknown
) {
  const payload = await verifyAuth(jwtInstance, authValue);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, email: true },
  });

  // Only allow admin if role is admin AND email matches
  if (!user || user.role !== "admin" || user.email !== ADMIN_EMAIL) return null;
  return user;
}

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(jwt(jwtConfig))
  // Get admin stats
  .get("/stats", async ({ set, jwt, cookie: { auth } }) => {
    const admin = await requireAdminAccess(jwt, auth?.value);
    if (!admin) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    try {
      const [userCount, postCount, commentCount, totalViews] = await Promise.all([
        db.user.count(),
        db.post.count(),
        db.comment.count(),
        db.post.aggregate({ _sum: { viewCount: true } }),
      ]);

      // Get recent signups (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentSignups = await db.user.count({
        where: { createdAt: { gte: weekAgo } },
      });

      // Get recent posts (last 7 days)
      const recentPosts = await db.post.count({
        where: { createdAt: { gte: weekAgo } },
      });

      return {
        users: userCount,
        posts: postCount,
        comments: commentCount,
        views: totalViews._sum.viewCount || 0,
        recentSignups,
        recentPosts,
      };
    } catch (error) {
      log.admin.error("Error fetching stats", {}, error as Error);
      set.status = 500;
      return { error: "Failed to fetch stats" };
    }
  })
  // Get all users
  .get("/users", async ({ query, set, jwt, cookie: { auth } }) => {
    const admin = await requireAdminAccess(jwt, auth?.value);
    if (!admin) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const { limit = "20", offset = "0", search = "" } = query as any;

    try {
      const where = search
        ? {
            OR: [
              { username: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          take: parseInt(limit),
          skip: parseInt(offset),
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profilePhoto: true,
            createdAt: true,
            lastSeen: true,
            _count: { select: { posts: true } },
          },
        }),
        db.user.count({ where }),
      ]);

      return {
        users: users.map((u: any) => ({
          ...u,
          postCount: u._count.posts,
          _count: undefined,
        })),
        total,
      };
    } catch (error) {
      log.admin.error("Error fetching users", {}, error as Error);
      set.status = 500;
      return { error: "Failed to fetch users" };
    }
  })

  // Update user role
  .patch("/users/:id/role", async ({ params, body, set, jwt, cookie: { auth } }) => {
    const admin = await requireAdminAccess(jwt, auth?.value);
    if (!admin) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const { role } = body as { role: string };
    if (!["user", "admin"].includes(role)) {
      set.status = 400;
      return { error: "Invalid role" };
    }

    // If trying to set admin role, check if target user has the allowed email
    if (role === "admin") {
      const targetUser = await db.user.findUnique({
        where: { id: Number(params.id) },
        select: { email: true },
      });
      
      if (!targetUser || targetUser.email !== ADMIN_EMAIL) {
        set.status = 403;
        return { error: "Only sehnyaw@gmail.com can have admin role" };
      }
    }

    try {
      const user = await db.user.update({
        where: { id: Number(params.id) },
        data: { role },
        select: { id: true, username: true, role: true },
      });
      return { message: "Role updated", user };
    } catch (error) {
      log.admin.error("Error updating role", { userId: params.id }, error as Error);
      set.status = 500;
      return { error: "Failed to update role" };
    }
  })
  // Delete user
  .delete("/users/:id", async ({ params, set, jwt, cookie: { auth } }) => {
    const admin = await requireAdminAccess(jwt, auth?.value);
    if (!admin) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    // Prevent self-deletion
    if (Number(params.id) === admin.id) {
      set.status = 400;
      return { error: "Cannot delete yourself" };
    }

    try {
      await db.user.delete({ where: { id: Number(params.id) } });
      return { message: "User deleted" };
    } catch (error) {
      log.admin.error("Error deleting user", { userId: params.id }, error as Error);
      set.status = 500;
      return { error: "Failed to delete user" };
    }
  })
  // Get all posts (admin view)
  .get("/posts", async ({ query, set, jwt, cookie: { auth } }) => {
    const admin = await requireAdminAccess(jwt, auth?.value);
    if (!admin) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const { limit = "20", offset = "0", search = "" } = query as any;

    try {
      const where = search ? { title: { contains: search } } : {};

      const [posts, total] = await Promise.all([
        db.post.findMany({
          where,
          take: parseInt(limit),
          skip: parseInt(offset),
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, username: true } },
            _count: { select: { favorites: true, comments: true } },
          },
        }),
        db.post.count({ where }),
      ]);

      return {
        posts: posts.map((p: any) => ({
          id: p.id,
          title: p.title,
          author: p.author,
          viewCount: p.viewCount,
          favorites: p._count.favorites,
          comments: p._count.comments,
          createdAt: p.createdAt,
        })),
        total,
      };
    } catch (error) {
      log.admin.error("Error fetching posts", {}, error as Error);
      set.status = 500;
      return { error: "Failed to fetch posts" };
    }
  })
  // Delete post
  .delete("/posts/:id", async ({ params, set, jwt, cookie: { auth } }) => {
    const admin = await requireAdminAccess(jwt, auth?.value);
    if (!admin) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    try {
      await db.post.delete({ where: { id: Number(params.id) } });
      return { message: "Post deleted" };
    } catch (error) {
      log.admin.error("Error deleting post", { postId: params.id }, error as Error);
      set.status = 500;
      return { error: "Failed to delete post" };
    }
  });
