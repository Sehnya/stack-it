import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { staticPlugin } from "@elysiajs/static";
import { resolve } from "path";
import { existsSync } from "fs";
import { authRoutes } from "./routes/auth";
import { postsRoutes, pinnedTechRoutes } from "./routes/posts";
import { userRoutes } from "./routes/users";
import { pageRoutes } from "./routes/pages";
import { adminRoutes } from "./routes/admin";

// Resolve static path relative to this file's directory
const staticPath = resolve(import.meta.dir, "../../static");
const hasStaticFolder = existsSync(staticPath);

// Allow multiple origins for dev and production
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://stack-it.dev",
  "https://www.stack-it.dev",
].filter(Boolean) as string[];

const app = new Elysia()
  .onRequest(({ request, set }) => {
    const origin = request.headers.get('origin')
    if (origin && allowedOrigins.includes(origin)) {
      set.headers['Access-Control-Allow-Origin'] = origin
      set.headers['Access-Control-Allow-Credentials'] = 'true'
      set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cookie'
    }
    if (request.method === 'OPTIONS') {
      set.status = 204
      return new Response(null, { status: 204 })
    }
  })
  .use(jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    exp: "7d",
  }));

// Only add static plugin if folder exists (local dev)
if (hasStaticFolder) {
  app.use(staticPlugin({
    assets: staticPath,
    prefix: "/static",
  }));
}

app
  // Health check
  .get("/healthz", () => ({
    status: "ok",
    time: new Date().toISOString(),
  }))
  // Mount routes
  .use(pageRoutes)      // HTML pages
  .use(authRoutes)      // /api/auth/*
  .use(postsRoutes)     // /api/posts/*
  .use(pinnedTechRoutes) // /api/pinned-tech/*
  .use(userRoutes)      // /api/users/*
  .use(adminRoutes)     // /api/admin/*
  // Global error handler
  .onError(({ code, error }) => {
    console.error(`Error [${code}]:`, error);
    if ("message" in error) {
      return {
        error: code === "VALIDATION" ? "Validation error" : "Internal server error",
        message: error.message,
      };
    }
    return {
      error: code === "VALIDATION" ? "Validation error" : "Internal server error",
    };
  })
  .listen(process.env.PORT || 3000);

console.log(`🚀 Stack-it API running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
