import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { staticPlugin } from "@elysiajs/static";
import { resolve } from "path";
import { authRoutes } from "./routes/auth";
import { postRoutes } from "./routes/posts";
import { userRoutes } from "./routes/users";
import { favoriteRoutes } from "./routes/favorites";
import { pageRoutes } from "./routes/pages";

// Resolve static path relative to this file's directory
const staticPath = resolve(import.meta.dir, "../../static");

const app = new Elysia()
  .use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }))
  .use(jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    exp: "7d",
  }))
  .use(staticPlugin({
    assets: staticPath,
    prefix: "/static",
  }))
  // Health check
  .get("/healthz", () => ({
    status: "ok",
    time: new Date().toISOString(),
  }))
  // Mount routes
  .use(pageRoutes)      // HTML pages
  .use(authRoutes)      // /api/auth/*
  .use(postRoutes)      // /api/posts/*
  .use(userRoutes)      // /api/users/*
  .use(favoriteRoutes)  // /api/favorites/*
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
