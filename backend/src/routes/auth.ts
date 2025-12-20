import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
      exp: "7d",
    })
  )
  // Sign up
  .post(
    "/signup",
    async ({ body, jwt, cookie: { auth } }) => {
      const { username, email, password } = body;

      // Check if user exists
      const existing = await db.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existing) {
        return { error: "Username or email already exists" };
      }

      // Hash password
      const hashedPassword = await Bun.password.hash(password);

      // Create user
      const user = await db.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });

      // Generate JWT
      const token = await jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      auth.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });

      return {
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    }
  )
  // Login
  .post(
    "/login",
    async ({ body, jwt, cookie: { auth } }) => {
      const { email, password } = body;

      const user = await db.user.findUnique({ where: { email } });

      if (!user) {
        return { error: "Invalid credentials" };
      }

      const validPassword = await Bun.password.verify(password, user.password);

      if (!validPassword) {
        return { error: "Invalid credentials" };
      }

      // Update last seen
      await db.user.update({
        where: { id: user.id },
        data: { lastSeen: new Date() },
      });

      // Generate JWT
      const token = await jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      auth.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return {
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )
  // Logout
  .post("/logout", ({ cookie: { auth } }) => {
    auth.set({
      value: "",
      maxAge: 0,
      path: "/",
    });
    return { message: "Logged out successfully" };
  })
  // Get current user
  .get("/me", async ({ jwt, cookie: { auth } }) => {
    const authValue = auth?.value;
    if (!authValue || typeof authValue !== "string") {
      return { error: "Not authenticated" };
    }

    const payload = await jwt.verify(authValue);
    if (!payload) {
      return { error: "Invalid token" };
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId as number },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        profilePhoto: true,
        lastSeen: true,
        dismissedWelcomeBanner: true,
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    return { user };
  });
