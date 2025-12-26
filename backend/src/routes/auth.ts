import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { jwtConfig } from "../middleware/auth";
import { log } from "../lib/logger";

const isProduction = process.env.NODE_ENV === "production";

// The only email allowed to have admin role
const ADMIN_EMAIL = "sehnyaw@gmail.com";

// Cookie options for cross-domain auth
const getCookieOptions = () => ({
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: "/",
  secure: isProduction, // HTTPS only in production
  sameSite: isProduction ? "none" as const : "lax" as const, // Required for cross-domain cookies
});

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(
    jwt({
      ...jwtConfig,
      exp: "7d",
    })
  )
  // Sign up
  .post(
    "/signup",
    async ({ body, set, jwt, cookie: { auth } }) => {
      try {
        const { username, email, password } = body;
        log.auth.info("Signup attempt", { email });

        // Check if user exists
        const existing = await db.user.findFirst({
          where: { OR: [{ email }, { username }] },
        });

        if (existing) {
          log.auth.info("Signup rejected - user exists", { email });
          set.status = 409; // Conflict
          return { error: "Username or email already exists" };
        }

        // Hash password and create user
        const hashedPassword = await Bun.password.hash(password);
        const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const user = await db.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
            role: isAdminEmail ? "admin" : "user",
          },
        });
        log.auth.info("User created", { userId: user.id, role: user.role });

        // Generate JWT
        const token = await jwt.sign({
          userId: user.id,
          username: user.username,
          role: user.role,
        });

        auth.set({
          value: token,
          ...getCookieOptions(),
        });

        set.status = 201; // Created
        return {
          message: "User created successfully",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        log.auth.error("Signup failed", { email: body.email }, error as Error);
        set.status = 500;
        return { error: "Signup failed" };
      }
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
    async ({ body, set, jwt, cookie: { auth } }) => {
      const { email, password } = body;

      const user = await db.user.findUnique({ where: { email } });

      if (!user) {
        log.auth.debug("Login failed - user not found", { email });
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const validPassword = await Bun.password.verify(password, user.password);

      if (!validPassword) {
        log.auth.debug("Login failed - invalid password", { email });
        set.status = 401;
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
        ...getCookieOptions(),
      });

      log.auth.info("Login successful", { userId: user.id });
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
      secure: isProduction,
      sameSite: isProduction ? "none" as const : "lax" as const,
    });
    return { message: "Logged out successfully" };
  })
  // Check username availability
  .get("/check-username", async ({ query, set }) => {
    const { username } = query;
    
    if (!username || typeof username !== "string") {
      set.status = 400;
      return { error: "Username is required" };
    }

    // Validate username format (alphanumeric, 3-20 characters)
    if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
      return { available: false, error: "Username must be 3-20 alphanumeric characters" };
    }

    try {
      const existing = await db.user.findUnique({
        where: { username },
      });

      return { available: !existing };
    } catch (error) {
      log.auth.error("Check username failed", { username }, error as Error);
      set.status = 500;
      return { error: "Failed to check username availability" };
    }
  }, {
    query: t.Object({
      username: t.String(),
    }),
  })
  // Get current user
  .get("/me", async ({ set, jwt, cookie: { auth } }) => {
    const authValue = auth?.value;
    if (!authValue || typeof authValue !== "string") {
      set.status = 401;
      return { error: "Not authenticated" };
    }

    const payload = await jwt.verify(authValue);
    if (!payload) {
      set.status = 401;
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
      set.status = 404;
      return { error: "User not found" };
    }

    return { user };
  });
