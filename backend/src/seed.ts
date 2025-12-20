import { db } from "./db";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await Bun.password.hash("admin123");
  const admin = await db.user.upsert({
    where: { email: "admin@stackit.dev" },
    update: {},
    create: {
      username: "admin",
      email: "admin@stackit.dev",
      password: adminPassword,
      role: "admin",
    },
  });
  console.log("✅ Admin user created:", admin.username);

  // Create demo user
  const userPassword = await Bun.password.hash("user123");
  const user = await db.user.upsert({
    where: { email: "demo@stackit.dev" },
    update: {},
    create: {
      username: "demo",
      email: "demo@stackit.dev",
      password: userPassword,
      role: "user",
    },
  });
  console.log("✅ Demo user created:", user.username);

  // Create sample posts
  const posts = [
    {
      title: "Getting Started with React",
      summary: "Learn the basics of React and build your first component",
      body: "# Getting Started with React\n\nReact is a JavaScript library for building user interfaces...",
      tags: "react,javascript,frontend",
      category: "frontend",
      authorId: admin.id,
    },
    {
      title: "Building REST APIs with Elysia",
      summary: "Create fast and type-safe APIs using Elysia and Bun",
      body: "# Building REST APIs with Elysia\n\nElysia is a fast and friendly web framework...",
      tags: "elysia,bun,typescript,backend",
      category: "backend",
      authorId: admin.id,
    },
    {
      title: "Introduction to Prisma ORM",
      summary: "Database management made easy with Prisma",
      body: "# Introduction to Prisma ORM\n\nPrisma is a next-generation ORM for Node.js and TypeScript...",
      tags: "prisma,database,typescript",
      category: "backend",
      authorId: user.id,
    },
    {
      title: "Tailwind CSS Best Practices",
      summary: "Tips and tricks for writing clean Tailwind CSS",
      body: "# Tailwind CSS Best Practices\n\nTailwind CSS is a utility-first CSS framework...",
      tags: "tailwind,css,frontend",
      category: "frontend",
      authorId: user.id,
    },
  ];

  for (const post of posts) {
    await db.post.create({ data: post });
  }
  console.log(`✅ Created ${posts.length} sample posts`);

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
