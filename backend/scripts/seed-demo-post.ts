import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const demoPost = {
  title: "Building a Lightning-Fast Backend with Bun, Prisma & Turso",
  excerpt: "Learn how to connect a SQL database using Prisma ORM with Bun runtime and Turso's edge database for blazing fast performance.",
  coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=800&fit=crop",
  technologies: JSON.stringify(["Bun", "Prisma", "Turso", "TypeScript", "SQLite"]),
  content: `
<div class="prose prose-lg max-w-none">

<p class="text-xl text-gray-600 leading-relaxed mb-8">
In this guide, we'll build a <strong>production-ready backend</strong> using the modern stack of <span class="text-purple-600 font-semibold">Bun</span>, <span class="text-emerald-600 font-semibold">Prisma</span>, and <span class="text-cyan-600 font-semibold">Turso</span>. This combination gives you incredible speed, type safety, and edge-ready database access.
</p>

<div class="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-6 rounded-r-xl mb-8">
  <h4 class="text-amber-800 font-bold text-lg mb-2">🚀 Why This Stack?</h4>
  <ul class="text-amber-900 space-y-2">
    <li><strong>Bun</strong> - 3x faster than Node.js, built-in TypeScript support</li>
    <li><strong>Prisma</strong> - Type-safe ORM with auto-generated queries</li>
    <li><strong>Turso</strong> - SQLite at the edge with global replication</li>
  </ul>
</div>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl">1</span>
  Project Setup
</h2>

<p class="mb-4">First, let's initialize our project with Bun:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-bash"><span class="text-green-400"># Create new project</span>
mkdir my-turso-app && cd my-turso-app
bun init -y

<span class="text-green-400"># Install dependencies</span>
bun add prisma @prisma/client @prisma/adapter-libsql @libsql/client elysia
bun add -d typescript @types/bun</code></pre>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">2</span>
  Configure Prisma Schema
</h2>

<p class="mb-4">Create your <code class="bg-gray-100 px-2 py-1 rounded text-pink-600">prisma/schema.prisma</code> file:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-prisma"><span class="text-purple-400">generator</span> client {
  provider        = <span class="text-green-400">"prisma-client-js"</span>
  previewFeatures = [<span class="text-green-400">"driverAdapters"</span>]
}

<span class="text-purple-400">datasource</span> db {
  provider = <span class="text-green-400">"sqlite"</span>
  url      = <span class="text-cyan-400">env</span>(<span class="text-green-400">"DATABASE_URL"</span>)
}

<span class="text-purple-400">model</span> <span class="text-yellow-400">User</span> {
  id        <span class="text-cyan-400">Int</span>      <span class="text-gray-500">@id @default(autoincrement())</span>
  email     <span class="text-cyan-400">String</span>   <span class="text-gray-500">@unique</span>
  name      <span class="text-cyan-400">String?</span>
  posts     <span class="text-yellow-400">Post</span>[]
  createdAt <span class="text-cyan-400">DateTime</span> <span class="text-gray-500">@default(now())</span>
}

<span class="text-purple-400">model</span> <span class="text-yellow-400">Post</span> {
  id        <span class="text-cyan-400">Int</span>      <span class="text-gray-500">@id @default(autoincrement())</span>
  title     <span class="text-cyan-400">String</span>
  content   <span class="text-cyan-400">String</span>
  author    <span class="text-yellow-400">User</span>     <span class="text-gray-500">@relation(fields: [authorId], references: [id])</span>
  authorId  <span class="text-cyan-400">Int</span>
}</code></pre>

<div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8">
  <h4 class="text-blue-800 font-bold text-lg mb-3 flex items-center gap-2">
    <span class="text-2xl">💡</span> Pro Tip
  </h4>
  <p class="text-blue-900">
    The <code class="bg-blue-100 px-2 py-0.5 rounded text-blue-700">previewFeatures = ["driverAdapters"]</code> is crucial! It enables Prisma to work with Turso's libSQL driver instead of the default SQLite driver.
  </p>
</div>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center text-xl">3</span>
  Database Connection
</h2>

<p class="mb-4">Create <code class="bg-gray-100 px-2 py-1 rounded text-pink-600">src/db.ts</code> to handle the Turso connection:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-typescript"><span class="text-purple-400">import</span> { PrismaClient } <span class="text-purple-400">from</span> <span class="text-green-400">"@prisma/client"</span>;
<span class="text-purple-400">import</span> { PrismaLibSQL } <span class="text-purple-400">from</span> <span class="text-green-400">"@prisma/adapter-libsql"</span>;
<span class="text-purple-400">import</span> { createClient } <span class="text-purple-400">from</span> <span class="text-green-400">"@libsql/client"</span>;

<span class="text-gray-500">// Create libSQL client for Turso</span>
<span class="text-purple-400">const</span> libsql = <span class="text-cyan-400">createClient</span>({
  url: <span class="text-cyan-400">process.env</span>.TURSO_DATABASE_URL!,
  authToken: <span class="text-cyan-400">process.env</span>.TURSO_AUTH_TOKEN!,
});

<span class="text-gray-500">// Create Prisma adapter</span>
<span class="text-purple-400">const</span> adapter = <span class="text-purple-400">new</span> <span class="text-yellow-400">PrismaLibSQL</span>(libsql);

<span class="text-gray-500">// Initialize Prisma with the adapter</span>
<span class="text-purple-400">export const</span> db = <span class="text-purple-400">new</span> <span class="text-yellow-400">PrismaClient</span>({ adapter });

<span class="text-purple-400">export async function</span> <span class="text-cyan-400">testConnection</span>() {
  <span class="text-purple-400">try</span> {
    <span class="text-purple-400">await</span> db.<span class="text-cyan-400">$connect</span>();
    <span class="text-cyan-400">console</span>.<span class="text-cyan-400">log</span>(<span class="text-green-400">"✅ Database connected!"</span>);
    <span class="text-purple-400">return true</span>;
  } <span class="text-purple-400">catch</span> (error) {
    <span class="text-cyan-400">console</span>.<span class="text-cyan-400">error</span>(<span class="text-green-400">"❌ Connection failed:"</span>, error);
    <span class="text-purple-400">return false</span>;
  }
}</code></pre>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-xl">4</span>
  Environment Variables
</h2>

<p class="mb-4">Create your <code class="bg-gray-100 px-2 py-1 rounded text-pink-600">.env</code> file:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-bash"><span class="text-green-400"># For Prisma CLI (local development)</span>
DATABASE_URL=<span class="text-yellow-400">"file:./dev.db"</span>

<span class="text-green-400"># Turso credentials (get from turso.tech dashboard)</span>
TURSO_DATABASE_URL=<span class="text-yellow-400">"libsql://your-db-name.turso.io"</span>
TURSO_AUTH_TOKEN=<span class="text-yellow-400">"your-auth-token"</span></code></pre>

<div class="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-6 mb-8">
  <h4 class="text-rose-800 font-bold text-lg mb-3 flex items-center gap-2">
    <span class="text-2xl">⚠️</span> Important
  </h4>
  <p class="text-rose-900">
    Never commit your <code class="bg-rose-100 px-2 py-0.5 rounded text-rose-700">.env</code> file! Add it to <code class="bg-rose-100 px-2 py-0.5 rounded text-rose-700">.gitignore</code> immediately.
  </p>
</div>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center text-xl">5</span>
  Create Your API
</h2>

<p class="mb-4">Build a simple API with Elysia in <code class="bg-gray-100 px-2 py-1 rounded text-pink-600">src/index.ts</code>:</p>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-typescript"><span class="text-purple-400">import</span> { Elysia } <span class="text-purple-400">from</span> <span class="text-green-400">"elysia"</span>;
<span class="text-purple-400">import</span> { db } <span class="text-purple-400">from</span> <span class="text-green-400">"./db"</span>;

<span class="text-purple-400">const</span> app = <span class="text-purple-400">new</span> <span class="text-yellow-400">Elysia</span>()
  .<span class="text-cyan-400">get</span>(<span class="text-green-400">"/"</span>, () => ({ message: <span class="text-green-400">"Hello from Bun + Turso!"</span> }))
  
  .<span class="text-cyan-400">get</span>(<span class="text-green-400">"/users"</span>, <span class="text-purple-400">async</span> () => {
    <span class="text-purple-400">return await</span> db.user.<span class="text-cyan-400">findMany</span>({
      include: { posts: <span class="text-purple-400">true</span> }
    });
  })
  
  .<span class="text-cyan-400">post</span>(<span class="text-green-400">"/users"</span>, <span class="text-purple-400">async</span> ({ body }) => {
    <span class="text-purple-400">return await</span> db.user.<span class="text-cyan-400">create</span>({
      data: body <span class="text-purple-400">as</span> { email: <span class="text-cyan-400">string</span>; name?: <span class="text-cyan-400">string</span> }
    });
  })
  
  .<span class="text-cyan-400">listen</span>(<span class="text-yellow-400">3000</span>);

<span class="text-cyan-400">console</span>.<span class="text-cyan-400">log</span>(<span class="text-green-400">\`🚀 Server running at \${app.server?.hostname}:\${app.server?.port}\`</span>);</code></pre>

<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
  <span class="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl">6</span>
  Run & Test
</h2>

<pre class="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto mb-6"><code class="language-bash"><span class="text-green-400"># Generate Prisma client</span>
bunx prisma generate

<span class="text-green-400"># Push schema to Turso</span>
bunx prisma db push

<span class="text-green-400"># Start the server</span>
bun run src/index.ts</code></pre>

<div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 mt-10">
  <h3 class="text-green-800 font-bold text-2xl mb-4 flex items-center gap-3">
    <span class="text-3xl">🎉</span> You're Done!
  </h3>
  <p class="text-green-900 text-lg">
    You now have a fully functional backend with type-safe database queries, running on Bun with Turso's globally distributed SQLite. Your API is ready to scale to millions of users!
  </p>
</div>

</div>
`,
  files: [
    {
      name: "prisma/schema.prisma",
      language: "prisma",
      code: `generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}`
    },
    {
      name: "src/db.ts",
      language: "typescript",
      code: `import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Create libSQL client for Turso
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Create Prisma adapter
const adapter = new PrismaLibSQL(libsql);

// Initialize Prisma with the adapter
export const db = new PrismaClient({ adapter });

export async function testConnection() {
  try {
    await db.$connect();
    console.log("✅ Database connected!");
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error);
    return false;
  }
}`
    },
    {
      name: "src/index.ts",
      language: "typescript",
      code: `import { Elysia } from "elysia";
import { db } from "./db";

const app = new Elysia()
  .get("/", () => ({ message: "Hello from Bun + Turso!" }))
  
  .get("/users", async () => {
    return await db.user.findMany({
      include: { posts: true }
    });
  })
  
  .post("/users", async ({ body }) => {
    return await db.user.create({
      data: body as { email: string; name?: string }
    });
  })
  
  .get("/posts", async () => {
    return await db.post.findMany({
      include: { author: true }
    });
  })
  
  .post("/posts", async ({ body }) => {
    return await db.post.create({
      data: body as { title: string; content: string; authorId: number }
    });
  })
  
  .listen(3000);

console.log(\`🚀 Server running at \${app.server?.hostname}:\${app.server?.port}\`);`
    },
    {
      name: ".env.example",
      language: "bash",
      code: `# For Prisma CLI (local development)
DATABASE_URL="file:./dev.db"

# Turso credentials (get from turso.tech dashboard)
TURSO_DATABASE_URL="libsql://your-db-name.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"

# Server
PORT=3000`
    },
    {
      name: "package.json",
      language: "json",
      code: `{
  "name": "bun-prisma-turso",
  "version": "1.0.0",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "db:generate": "bunx prisma generate",
    "db:push": "bunx prisma db push",
    "db:studio": "bunx prisma studio"
  },
  "dependencies": {
    "@libsql/client": "^0.5.0",
    "@prisma/adapter-libsql": "^5.22.0",
    "@prisma/client": "^5.22.0",
    "elysia": "^1.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "prisma": "^5.22.0",
    "typescript": "^5.0.0"
  }
}`
    }
  ]
};

async function seedDemoPost() {
  try {
    // Get a real user to be the author (first available user)
    const authorResult = await client.execute(
      "SELECT id, username FROM users ORDER BY id ASC LIMIT 1"
    );
    
    if (authorResult.rows.length === 0) {
      console.error("❌ No users found! Please sign up first.");
      return;
    }
    
    const authorId = authorResult.rows[0].id as number;
    const authorName = authorResult.rows[0].username as string;
    console.log(`Using author: ${authorName} (ID: ${authorId})`);

    // Insert the post with 0 views (real data only)
    const postResult = await client.execute({
      sql: `INSERT INTO posts (title, excerpt, content, cover_image, technologies, view_count, author_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        demoPost.title,
        demoPost.excerpt,
        demoPost.content,
        demoPost.coverImage,
        demoPost.technologies,
        0, // Real view count starts at 0
        authorId
      ]
    });

    const postId = postResult.lastInsertRowid;
    console.log(`Created post with ID: ${postId}`);

    // Insert the files
    for (const file of demoPost.files) {
      await client.execute({
        sql: `INSERT INTO post_files (post_id, name, language, code) VALUES (?, ?, ?, ?)`,
        args: [postId, file.name, file.language, file.code]
      });
      console.log(`  Added file: ${file.name}`);
    }

    console.log("\n✅ Demo post created successfully!");
    console.log(`   Title: ${demoPost.title}`);
    console.log(`   Author: ${authorName}`);
    console.log(`   Files: ${demoPost.files.length}`);
    console.log(`   Technologies: ${JSON.parse(demoPost.technologies).join(", ")}`);

  } catch (error) {
    console.error("Error seeding demo post:", error);
    throw error;
  }
}

seedDemoPost();
