import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { render } from "../lib/template";

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
  });
}

// Avatar URL helper
function avatarUrl(user: any): string {
  if (user?.profilePhoto) {
    return user.profilePhoto;
  }
  return "/static/images/Ellipse-2.png";
}

// Check if user is online (active in last 5 minutes)
function isOnline(user: any): boolean {
  if (!user?.lastSeen) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(user.lastSeen) > fiveMinutesAgo;
}

export const pageRoutes = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    })
  )
  // Landing page
  .get("/", async ({ jwt, cookie: { auth }, redirect }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (user) {
      return redirect("/dashboard");
    }
    
    return new Response(render("index.html", {
      session: {},
      request: { path: "/" },
    }), {
      headers: { "Content-Type": "text/html" },
    });
  })
  // Login page
  .get("/login", async ({ jwt, cookie: { auth }, redirect }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (user) {
      return redirect("/dashboard");
    }
    
    return new Response(render("login.html", {
      session: {},
      request: { path: "/login" },
    }), {
      headers: { "Content-Type": "text/html" },
    });
  })
  // Dashboard
  .get("/dashboard", async ({ jwt, cookie: { auth }, redirect }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (!user) {
      return redirect("/login");
    }

    const posts = await db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: true }
    });

    return new Response(render("dashboard.html", {
      user,
      session: { user_id: user.id, username: user.username, is_admin: user.role === "admin" },
      request: { path: "/dashboard" },
      posts,
      current_user: () => user,
      avatar_url: avatarUrl,
      is_online: isOnline,
    }), {
      headers: { "Content-Type": "text/html" },
    });
  })
  // Community page
  .get("/community", async ({ jwt, cookie: { auth }, redirect }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (!user) {
      return redirect("/login");
    }

    const posts = await db.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: true },
    });

    return new Response(render("community.html", {
      user,
      posts,
      session: { user_id: user.id, username: user.username, is_admin: user.role === "admin" },
      request: { path: "/community" },
      current_user: () => user,
      avatar_url: avatarUrl,
      is_online: isOnline,
    }), {
      headers: { "Content-Type": "text/html" },
    });
  })
  // Favorites page
  .get("/favorites", async ({ jwt, cookie: { auth }, redirect }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (!user) {
      return redirect("/login");
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: { post: { include: { author: true } } },
      orderBy: { createdAt: "desc" },
    });

    return new Response(render("favorites.html", {
      user,
      favorites,
      session: { user_id: user.id, username: user.username, is_admin: user.role === "admin" },
      request: { path: "/favorites" },
      current_user: () => user,
      avatar_url: avatarUrl,
      is_online: isOnline,
    }), {
      headers: { "Content-Type": "text/html" },
    });
  })
  // Create post page
  .get("/create-post", async ({ jwt, cookie: { auth }, redirect }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (!user) {
      return redirect("/login");
    }

    return new Response(render("create_post.html", {
      user,
      session: { user_id: user.id, username: user.username, is_admin: user.role === "admin" },
      request: { path: "/create-post" },
      current_user: () => user,
      avatar_url: avatarUrl,
      is_online: isOnline,
    }), {
      headers: { "Content-Type": "text/html" },
    });
  })
  // Settings page
  .get("/settings", async ({ jwt, cookie: { auth }, redirect }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    if (!user) {
      return redirect("/login");
    }

    return new Response(render("settings.html", {
      user,
      session: { user_id: user.id, username: user.username, is_admin: user.role === "admin" },
      request: { path: "/settings" },
      current_user: () => user,
      avatar_url: avatarUrl,
      is_online: isOnline,
    }), {
      headers: { "Content-Type": "text/html" },
    });
  })
  // Single post page
  .get("/post/:id", async ({ jwt, cookie: { auth }, params, redirect }) => {
    const user = await getUserFromAuth(jwt, auth?.value);
    
    const post = await db.post.findUnique({
      where: { id: Number(params.id) },
      include: { author: true },
    });

    if (!post) {
      return new Response(render("404.html", {}), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(render("post.html", {
      user,
      post,
      session: user ? { user_id: user.id, username: user.username, is_admin: user.role === "admin" } : {},
      request: { path: `/post/${params.id}` },
      current_user: () => user,
      avatar_url: avatarUrl,
      is_online: isOnline,
    }), {
      headers: { "Content-Type": "text/html" },
    });
  })
  // Logout
  .get("/logout", ({ cookie: { auth }, redirect }) => {
    auth.set({
      value: "",
      maxAge: 0,
      path: "/",
    });
    return redirect("/");
  });
