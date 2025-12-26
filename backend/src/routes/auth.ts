import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { jwtConfig } from "../middleware/auth";
import { log } from "../lib/logger";
import { sendEmail, generateVerificationCode, getVerificationEmailHtml } from "../lib/email";

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
        
        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date();
        verificationExpires.setMinutes(verificationExpires.getMinutes() + 15); // 15 minutes
        
        const user = await db.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
            role: isAdminEmail ? "admin" : "user",
            verificationCode,
            verificationExpires,
            emailVerified: isAdminEmail, // Auto-verify admin emails
          },
        });
        log.auth.info("User created", { userId: user.id, role: user.role });

        // Send verification email (skip for admin or if email sending fails)
        if (!isAdminEmail) {
          const emailSent = await sendEmail({
            to: email,
            subject: "Verify your Stack-it account",
            html: getVerificationEmailHtml(verificationCode, username),
          });

          if (!emailSent) {
            log.auth.warn("Failed to send verification email", { email });
          }
        }

        set.status = 201; // Created
        return {
          message: "User created successfully",
          requiresVerification: !isAdminEmail,
          email: email,
          user: isAdminEmail ? {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          } : undefined,
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

      // Check if email is verified
      if (!user.emailVerified) {
        log.auth.info("Login blocked - email not verified", { email, userId: user.id });
        set.status = 401;
        return {
          error: "Email not verified",
          requiresVerification: true,
          email: user.email,
        };
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
  // Verify email with code
  .post(
    "/verify",
    async ({ body, set, jwt, cookie: { auth } }) => {
      try {
        const { email, code } = body;

        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
          log.auth.warn("Verification attempt - user not found", { email });
          set.status = 404;
          return { error: "User not found" };
        }

        if (user.emailVerified) {
          log.auth.info("Verification attempt - already verified", { email, userId: user.id });
          // Still return success and generate token
          const token = await jwt.sign({
            userId: user.id,
            username: user.username,
            role: user.role,
          });

          auth.set({
            value: token,
            ...getCookieOptions(),
          });

          return {
            message: "Email already verified",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
            },
          };
        }

        // Check if code matches and hasn't expired
        if (!user.verificationCode || user.verificationCode !== code) {
          log.auth.warn("Verification attempt - invalid code", { email, userId: user.id });
          set.status = 400;
          return { error: "Invalid verification code" };
        }

        if (!user.verificationExpires || user.verificationExpires < new Date()) {
          log.auth.warn("Verification attempt - expired code", { email, userId: user.id });
          set.status = 400;
          return { error: "Verification code has expired" };
        }

        // Verify email
        await db.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            verificationCode: null,
            verificationExpires: null,
          },
        });

        log.auth.info("Email verified successfully", { email, userId: user.id });

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

        return {
          message: "Email verified successfully",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        log.auth.error("Verification failed", { email: body.email }, error as Error);
        set.status = 500;
        return { error: "Verification failed" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        code: t.String({ minLength: 6, maxLength: 6 }),
      }),
    }
  )
  // Resend verification code
  .post(
    "/resend-code",
    async ({ body, set }) => {
      try {
        const { email } = body;

        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
          log.auth.warn("Resend code attempt - user not found", { email });
          set.status = 404;
          return { error: "User not found" };
        }

        if (user.emailVerified) {
          log.auth.info("Resend code attempt - already verified", { email, userId: user.id });
          return { message: "Email already verified" };
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date();
        verificationExpires.setMinutes(verificationExpires.getMinutes() + 15); // 15 minutes

        await db.user.update({
          where: { id: user.id },
          data: {
            verificationCode,
            verificationExpires,
          },
        });

        // Send verification email
        const emailSent = await sendEmail({
          to: email,
          subject: "Verify your Stack-it account",
          html: getVerificationEmailHtml(verificationCode, user.username),
        });

        if (!emailSent) {
          log.auth.warn("Failed to send verification email", { email });
          set.status = 500;
          return { error: "Failed to send verification email" };
        }

        log.auth.info("Verification code resent", { email, userId: user.id });
        return { message: "Verification code sent successfully" };
      } catch (error) {
        log.auth.error("Resend code failed", { email: body.email }, error as Error);
        set.status = 500;
        return { error: "Failed to resend verification code" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
    }
  )
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
