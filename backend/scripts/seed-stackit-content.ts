import { db } from "../src/db";

// Cover image for Stack-it posts - using Unsplash for reliable hosting
const STACKIT_COVER_IMAGE = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=800&fit=crop";

async function seedStackItContent() {
  console.log("Seeding Stack-it content...");

  // Find existing stackitdevteam account
  const adminUser = await db.user.findUnique({ where: { username: "stackitdevteam" } });
  
  if (!adminUser) {
    console.error("Error: stackitdevteam account not found. Please create it first.");
    process.exit(1);
  }
  
  console.log("Using existing account:", adminUser.username);

  // 1. CREATE STACK POST - About Stack-it's Tech Stack (Interactive & Eye-catching)
  const stackPost = await db.post.create({
    data: {
      title: "The Stack Behind Stack-it: How We Built This Platform",
      excerpt: "A deep dive into the technologies powering Stack-it - from our blazing fast Bun + Elysia backend to our React frontend with Tailwind CSS.",
      content: `
<p style="text-align: center"><strong>Welcome to Stack-it</strong> - where developers share what they build with.</p>

<blockquote><p>Every great project starts with a question: <em>"What stack should I use?"</em></p><p>We built Stack-it to help you answer that question by learning from real developers building real things.</p></blockquote>

<h2>Why We Built This</h2>

<p>Choosing a tech stack is one of the most important decisions in any project. But most of us make these choices based on:</p>

<ul><li><p><mark>Blog posts</mark> that are often outdated</p></li><li><p><mark>Tutorial projects</mark> that don't reflect production reality</p></li><li><p><mark>Hype cycles</mark> that come and go</p></li></ul>

<p>We wanted something different - a place where you can see <strong>actual stacks</strong> from <strong>actual developers</strong> with <strong>actual code</strong>.</p>

<hr>

<h2>Our Tech Stack</h2>

<p>We practice what we preach. Here's exactly what powers Stack-it:</p>

<table><tbody><tr><th colspan="1" rowspan="1"><p>Layer</p></th><th colspan="1" rowspan="1"><p>Technology</p></th><th colspan="1" rowspan="1"><p>Why We Chose It</p></th></tr><tr><td colspan="1" rowspan="1"><p><strong>Runtime</strong></p></td><td colspan="1" rowspan="1"><p>Bun</p></td><td colspan="1" rowspan="1"><p>3x faster than Node, native TypeScript</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>Backend</strong></p></td><td colspan="1" rowspan="1"><p>Elysia</p></td><td colspan="1" rowspan="1"><p>End-to-end type safety, incredible DX</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>Database</strong></p></td><td colspan="1" rowspan="1"><p>Turso + Prisma</p></td><td colspan="1" rowspan="1"><p>Edge SQLite with type-safe queries</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>Frontend</strong></p></td><td colspan="1" rowspan="1"><p>React + Vite</p></td><td colspan="1" rowspan="1"><p>Fast builds, great ecosystem</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>Styling</strong></p></td><td colspan="1" rowspan="1"><p>Tailwind CSS</p></td><td colspan="1" rowspan="1"><p>Rapid UI development</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>Animations</strong></p></td><td colspan="1" rowspan="1"><p>Framer Motion</p></td><td colspan="1" rowspan="1"><p>Smooth, declarative animations</p></td></tr></tbody></table>

<h3>Backend Architecture</h3>

<p>Our API is built with <strong>Elysia</strong> - a Bun-first web framework that gives us:</p>

<ul><li><p>Full type inference from routes to responses</p></li><li><p>Built-in validation with TypeBox</p></li><li><p>JWT authentication out of the box</p></li><li><p>Blazing fast performance</p></li></ul>

<pre><code class="language-typescript">// Type-safe API routes with Elysia
app.post('/api/posts', async ({ body, jwt }) => {
  const { title, content, technologies } = body
  
  const post = await db.post.create({
    data: { title, content, technologies }
  })
  
  return { success: true, post }
})</code></pre>

<h3>Frontend Stack</h3>

<p>The UI is built with <strong>React 18</strong> and styled with <strong>Tailwind CSS</strong>. We use:</p>

<ol><li><p><strong>React Router</strong> for navigation</p></li><li><p><strong>TipTap</strong> for the rich text editor you're reading right now</p></li><li><p><strong>Framer Motion</strong> for all those smooth animations</p></li><li><p><strong>Lucide</strong> for consistent iconography</p></li></ol>

<hr>

<h2>What You Can Do Here</h2>

<p>Stack-it has three main content types:</p>

<h3>Stacks</h3>

<p>Share your project's complete tech stack with <mark>code samples</mark>, explanations, and the reasoning behind your choices. Each stack post includes an interactive code editor where others can explore your implementation.</p>

<h3>Snippets</h3>

<p>Quick, reusable code snippets that solve specific problems. Rate them, favorite them, and build your personal collection of go-to solutions.</p>

<h3>Discussions</h3>

<p>Ask questions, share feedback, and connect with other developers. Whether you need help choosing between frameworks or want to show off what you built - this is the place.</p>

<hr>

<h2>Getting Started Checklist</h2>

<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Create your account</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Verify your email</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Share your first stack</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Follow developers you admire</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Join a discussion</p></div></li></ul>

<hr>

<p style="text-align: center"><strong>Ready to share what you're building?</strong></p>

<p style="text-align: center">We can't wait to see your stack.</p>
      `.trim(),
      technologies: JSON.stringify(["React", "TypeScript", "Bun", "Elysia", "Prisma", "Tailwind CSS", "Turso", "Framer Motion", "Vite"]),
      coverImage: STACKIT_COVER_IMAGE,
      authorId: adminUser.id,
      viewCount: 0,
    },
  });

  // Add code files to the post
  await db.postFile.createMany({
    data: [
      {
        postId: stackPost.id,
        name: "backend/src/index.ts",
        language: "typescript",
        code: `import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { authRoutes } from "./routes/auth";
import { postsRoutes } from "./routes/posts";
import { snippetsRoutes } from "./routes/snippets";
import { discussionsRoutes } from "./routes/discussions";

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  }))
  .use(jwt({ secret: process.env.JWT_SECRET! }))
  .use(authRoutes)
  .use(postsRoutes)
  .use(snippetsRoutes)
  .use(discussionsRoutes)
  .get("/healthz", () => ({ status: "ok", timestamp: new Date() }))
  .listen(3000);

console.log("Stack-it API running on port 3000");

export type App = typeof app;`,
      },
      {
        postId: stackPost.id,
        name: "backend/src/db.ts",
        language: "typescript",
        code: `import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Connect to Turso edge database
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const adapter = new PrismaLibSQL(libsql);

export const db = new PrismaClient({ adapter });`,
      },
      {
        postId: stackPost.id,
        name: "frontend/src/App.tsx",
        language: "tsx",
        code: `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 ml-64">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/create" element={<CreatePost />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;`,
      },
      {
        postId: stackPost.id,
        name: "frontend/src/lib/api.ts",
        language: "typescript",
        code: `const API_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(\`\${API_URL}\${endpoint}\`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (data.error) {
    return { error: data.error };
  }
  
  return { data };
}

export const api = {
  posts: {
    list: () => request<Post[]>('/api/posts'),
    get: (id: number) => request<Post>(\`/api/posts/\${id}\`),
    create: (data: CreatePostData) => 
      request<Post>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  },
  auth: {
    me: () => request<User>('/api/auth/me'),
    login: (email: string, password: string) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
  }
};`,
      },
      {
        postId: stackPost.id,
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
  id            Int       @id @default(autoincrement())
  username      String    @unique
  email         String    @unique
  password      String
  role          String    @default("user")
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  
  posts     Post[]
  snippets  Snippet[]
  favorites Favorite[]
}

model Post {
  id           Int        @id @default(autoincrement())
  title        String
  excerpt      String
  content      String
  technologies String     // JSON array
  authorId     Int
  createdAt    DateTime   @default(now())
  
  author    User       @relation(fields: [authorId], references: [id])
  files     PostFile[]
  favorites Favorite[]
}`,
      },
    ],
  });

  console.log("Created stack post:", stackPost.title);

  // 2. CREATE DISCUSSION - Welcome Thread
  const discussion = await db.forumThread.create({
    data: {
      title: "Welcome to Stack-it - Introduce yourself here",
      content: `
<p>Hey everyone, welcome to the Stack-it community.</p>

<p>This is the place to introduce yourself and connect with fellow developers. We'd love to hear:</p>

<ul>
  <li>What's your name and where are you from?</li>
  <li>What kind of projects are you working on?</li>
  <li>What's your favorite tech stack right now?</li>
  <li>What are you hoping to learn or share here?</li>
</ul>

<p>Stack-it is all about learning from each other's tech choices. Whether you're a seasoned architect or just starting out, your perspective matters.</p>

<h3>Community Guidelines</h3>

<p>Let's keep this a welcoming space:</p>
<ul>
  <li>Be respectful and constructive</li>
  <li>Share knowledge freely</li>
  <li>Ask questions - there are no dumb questions</li>
  <li>Give credit where it's due</li>
  <li>Have fun building cool stuff</li>
</ul>

<p>Drop a comment below and say hi.</p>
      `.trim(),
      category: "general",
      tags: JSON.stringify(["welcome", "introductions", "community"]),
      authorId: adminUser.id,
      pinned: true,
      viewCount: 0,
    },
  });

  console.log("Created discussion:", discussion.title);

  // 3. CREATE SNIPPET - Useful TypeScript utility
  const snippet = await db.snippet.create({
    data: {
      title: "Type-safe API Response Handler",
      description: "A reusable TypeScript pattern for handling API responses with proper error handling. Used throughout Stack-it's frontend.",
      language: "typescript",
      code: `interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (data.error) {
      return { error: data.error };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

// Usage example:
const result = await request<User>('/api/auth/me');
if (result.error) {
  console.log('Error:', result.error);
} else {
  console.log('User:', result.data);
}`,
      tags: JSON.stringify(["TypeScript", "API", "fetch", "error-handling"]),
      authorId: adminUser.id,
      viewCount: 0,
    },
  });

  console.log("Created snippet:", snippet.title);

  // Create another snippet
  const snippet2 = await db.snippet.create({
    data: {
      title: "React useDebounce Hook",
      description: "A custom React hook for debouncing values - perfect for search inputs and API calls. Prevents excessive re-renders and API requests.",
      language: "typescript",
      code: `import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in a search component:
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // API call only fires 300ms after user stops typing
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}`,
      tags: JSON.stringify(["React", "TypeScript", "hooks", "performance"]),
      authorId: adminUser.id,
      viewCount: 0,
    },
  });

  console.log("Created snippet:", snippet2.title);

  console.log("\nSeeding complete!");
  console.log(`
Summary:
- Using existing stackitdevteam account
- 1 Stack post with code files (with cover image)
- 1 Pinned discussion thread
- 2 Code snippets
  `);
}

seedStackItContent()
  .catch(console.error)
  .finally(() => process.exit(0));
