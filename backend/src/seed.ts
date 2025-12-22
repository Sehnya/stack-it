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
      excerpt: "Learn the basics of React and build your first component",
      content: "<h1>Getting Started with React</h1><p>React is a JavaScript library for building user interfaces...</p>",
      technologies: JSON.stringify(["React", "JavaScript", "Frontend"]),
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200",
      authorId: admin.id,
    },
    {
      title: "Building REST APIs with Elysia",
      excerpt: "Create fast and type-safe APIs using Elysia and Bun",
      content: "<h1>Building REST APIs with Elysia</h1><p>Elysia is a fast and friendly web framework...</p>",
      technologies: JSON.stringify(["Elysia", "Bun", "TypeScript", "Backend"]),
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
      authorId: admin.id,
    },
    {
      title: "Introduction to Prisma ORM",
      excerpt: "Database management made easy with Prisma",
      content: "<h1>Introduction to Prisma ORM</h1><p>Prisma is a next-generation ORM for Node.js and TypeScript...</p>",
      technologies: JSON.stringify(["Prisma", "Database", "TypeScript"]),
      coverImage: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200",
      authorId: user.id,
    },
    {
      title: "Tailwind CSS Best Practices",
      excerpt: "Tips and tricks for writing clean Tailwind CSS",
      content: "<h1>Tailwind CSS Best Practices</h1><p>Tailwind CSS is a utility-first CSS framework...</p>",
      technologies: JSON.stringify(["Tailwind", "CSS", "Frontend"]),
      coverImage: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1200",
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
