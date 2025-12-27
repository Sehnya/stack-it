import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})
const adapter = new PrismaLibSQL(libsql)
const db = new PrismaClient({ adapter }) as unknown as PrismaClient

const posts = [
  {
    title: "Building a Real-time Chat App with Socket.io and React",
    excerpt: "Learn how to create a fully functional real-time chat application using Socket.io for WebSocket communication and React for the frontend.",
    content: `<h2>Introduction</h2><p>Real-time communication is essential for modern web applications. In this guide, we'll build a chat app from scratch.</p><h2>Setting Up the Server</h2><p>First, let's create our Express server with Socket.io integration.</p><h2>Building the React Frontend</h2><p>We'll use React hooks to manage our chat state and connect to the WebSocket server.</p><h2>Key Features</h2><ul><li>Real-time message delivery</li><li>User presence indicators</li><li>Typing indicators</li><li>Message history</li></ul>`,
    technologies: ["React", "Socket.io", "Node.js", "Express", "TypeScript"],
    coverImage: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800",
    files: [
      { name: "server.ts", language: "typescript", code: `import express from 'express'\nimport { Server } from 'socket.io'\nimport http from 'http'\n\nconst app = express()\nconst server = http.createServer(app)\nconst io = new Server(server, { cors: { origin: '*' } })\n\nio.on('connection', (socket) => {\n  console.log('User connected:', socket.id)\n  \n  socket.on('message', (data) => {\n    io.emit('message', data)\n  })\n  \n  socket.on('disconnect', () => {\n    console.log('User disconnected:', socket.id)\n  })\n})\n\nserver.listen(3001, () => console.log('Server running on :3001'))` },
      { name: "useChat.ts", language: "typescript", code: `import { useState, useEffect } from 'react'\nimport { io, Socket } from 'socket.io-client'\n\nexport function useChat() {\n  const [messages, setMessages] = useState<Message[]>([])\n  const [socket, setSocket] = useState<Socket | null>(null)\n\n  useEffect(() => {\n    const s = io('http://localhost:3001')\n    setSocket(s)\n    \n    s.on('message', (msg) => {\n      setMessages(prev => [...prev, msg])\n    })\n    \n    return () => { s.disconnect() }\n  }, [])\n\n  const sendMessage = (text: string) => {\n    socket?.emit('message', { text, timestamp: Date.now() })\n  }\n\n  return { messages, sendMessage }\n}` }
    ]
  },
  {
    title: "Mastering Tailwind CSS: Advanced Techniques",
    excerpt: "Take your Tailwind CSS skills to the next level with custom plugins, animations, and responsive design patterns.",
    content: `<h2>Beyond the Basics</h2><p>Tailwind CSS is more than just utility classes. Let's explore advanced patterns.</p><h2>Custom Plugins</h2><p>Create reusable components with Tailwind plugins.</p><h2>Animation Utilities</h2><p>Build smooth, performant animations using Tailwind's animation system.</p>`,
    technologies: ["Tailwind CSS", "CSS", "JavaScript"],
    coverImage: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800",
    files: [
      { name: "tailwind.config.js", language: "javascript", code: `module.exports = {\n  theme: {\n    extend: {\n      animation: {\n        'fade-in': 'fadeIn 0.5s ease-out',\n        'slide-up': 'slideUp 0.3s ease-out',\n      },\n      keyframes: {\n        fadeIn: {\n          '0%': { opacity: '0' },\n          '100%': { opacity: '1' },\n        },\n        slideUp: {\n          '0%': { transform: 'translateY(10px)', opacity: '0' },\n          '100%': { transform: 'translateY(0)', opacity: '1' },\n        },\n      },\n    },\n  },\n  plugins: [],\n}` }
    ]
  },
  {
    title: "PostgreSQL Performance Optimization Guide",
    excerpt: "Deep dive into PostgreSQL query optimization, indexing strategies, and performance tuning for production databases.",
    content: `<h2>Understanding Query Plans</h2><p>Learn to read and interpret EXPLAIN ANALYZE output.</p><h2>Indexing Strategies</h2><p>Choose the right index type for your queries: B-tree, Hash, GIN, GiST.</p><h2>Connection Pooling</h2><p>Implement PgBouncer for efficient connection management.</p>`,
    technologies: ["PostgreSQL", "SQL", "Database"],
    coverImage: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800",
    files: [
      { name: "optimize.sql", language: "sql", code: `-- Create composite index for common queries\nCREATE INDEX CONCURRENTLY idx_users_email_created \nON users(email, created_at DESC);\n\n-- Partial index for active users only\nCREATE INDEX idx_active_users \nON users(last_login) \nWHERE status = 'active';\n\n-- Analyze query performance\nEXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)\nSELECT * FROM orders \nWHERE user_id = 123 \nAND created_at > NOW() - INTERVAL '30 days';` }
    ]
  },
  {
    title: "Building CLI Tools with Go",
    excerpt: "Create powerful command-line applications using Go's cobra library and best practices for CLI design.",
    content: `<h2>Why Go for CLI?</h2><p>Go compiles to a single binary, making distribution easy.</p><h2>Using Cobra</h2><p>Cobra provides a simple interface for creating powerful CLI apps.</p><h2>Adding Flags and Arguments</h2><p>Handle user input elegantly with persistent and local flags.</p>`,
    technologies: ["Go", "CLI", "Cobra"],
    coverImage: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800",
    files: [
      { name: "main.go", language: "go", code: `package main\n\nimport (\n\t"fmt"\n\t"github.com/spf13/cobra"\n)\n\nvar rootCmd = &cobra.Command{\n\tUse:   "myapp",\n\tShort: "A brief description",\n\tRun: func(cmd *cobra.Command, args []string) {\n\t\tfmt.Println("Hello from myapp!")\n\t},\n}\n\nfunc main() {\n\tif err := rootCmd.Execute(); err != nil {\n\t\tfmt.Println(err)\n\t}\n}` }
    ]
  },
  {
    title: "Docker Compose for Local Development",
    excerpt: "Set up a complete local development environment with Docker Compose including databases, caches, and services.",
    content: `<h2>Why Docker Compose?</h2><p>Reproducible development environments for your entire team.</p><h2>Multi-Service Setup</h2><p>Configure your app, database, Redis, and more in one file.</p>`,
    technologies: ["Docker", "Docker Compose", "DevOps"],
    coverImage: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800",
    files: [
      { name: "docker-compose.yml", language: "yaml", code: `version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - DATABASE_URL=postgres://user:pass@db:5432/myapp\n      - REDIS_URL=redis://cache:6379\n    depends_on:\n      - db\n      - cache\n\n  db:\n    image: postgres:15-alpine\n    environment:\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: pass\n      POSTGRES_DB: myapp\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n\n  cache:\n    image: redis:7-alpine\n\nvolumes:\n  pgdata:` }
    ]
  },
  {
    title: "Vue 3 Composition API Patterns",
    excerpt: "Master Vue 3's Composition API with reusable composables, reactive patterns, and TypeScript integration.",
    content: `<h2>Composables</h2><p>Extract and reuse stateful logic across components.</p><h2>Reactive References</h2><p>Understanding ref vs reactive and when to use each.</p>`,
    technologies: ["Vue.js", "TypeScript", "JavaScript"],
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    files: [
      { name: "useFetch.ts", language: "typescript", code: `import { ref, Ref } from 'vue'\n\nexport function useFetch<T>(url: string) {\n  const data: Ref<T | null> = ref(null)\n  const error = ref<Error | null>(null)\n  const loading = ref(true)\n\n  fetch(url)\n    .then(res => res.json())\n    .then(json => { data.value = json })\n    .catch(err => { error.value = err })\n    .finally(() => { loading.value = false })\n\n  return { data, error, loading }\n}` }
    ]
  },
  {
    title: "Rust for Web Assembly",
    excerpt: "Compile Rust to WebAssembly and integrate it with JavaScript for high-performance web applications.",
    content: `<h2>Why WASM?</h2><p>Near-native performance in the browser for compute-intensive tasks.</p><h2>Setting Up</h2><p>Use wasm-pack to compile and bundle your Rust code.</p>`,
    technologies: ["Rust", "WebAssembly", "JavaScript"],
    coverImage: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800",
    files: [
      { name: "lib.rs", language: "rust", code: `use wasm_bindgen::prelude::*;\n\n#[wasm_bindgen]\npub fn fibonacci(n: u32) -> u32 {\n    match n {\n        0 => 0,\n        1 => 1,\n        _ => fibonacci(n - 1) + fibonacci(n - 2),\n    }\n}\n\n#[wasm_bindgen]\npub fn greet(name: &str) -> String {\n    format!("Hello, {}!", name)\n}` }
    ]
  },
  {
    title: "Next.js 14 App Router Deep Dive",
    excerpt: "Explore the new App Router in Next.js 14 with server components, streaming, and parallel routes.",
    content: `<h2>Server Components</h2><p>Reduce client-side JavaScript with React Server Components.</p><h2>Streaming</h2><p>Progressive rendering with Suspense boundaries.</p>`,
    technologies: ["Next.js", "React", "TypeScript"],
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    files: [
      { name: "page.tsx", language: "typescript", code: `import { Suspense } from 'react'\n\nasync function getData() {\n  const res = await fetch('https://api.example.com/data', {\n    cache: 'no-store'\n  })\n  return res.json()\n}\n\nexport default async function Page() {\n  const data = await getData()\n  \n  return (\n    <main>\n      <h1>Dashboard</h1>\n      <Suspense fallback={<Loading />}>\n        <DataTable data={data} />\n      </Suspense>\n    </main>\n  )\n}` }
    ]
  }
]

const snippets = [
  { title: "Debounce Function", description: "Limit function execution rate", language: "typescript", tags: ["utility", "performance"], code: `function debounce<T extends (...args: any[]) => any>(\n  fn: T,\n  delay: number\n): (...args: Parameters<T>) => void {\n  let timeoutId: ReturnType<typeof setTimeout>\n  return (...args) => {\n    clearTimeout(timeoutId)\n    timeoutId = setTimeout(() => fn(...args), delay)\n  }\n}` },
  { title: "Deep Clone Object", description: "Recursively clone nested objects", language: "typescript", tags: ["utility", "objects"], code: `function deepClone<T>(obj: T): T {\n  if (obj === null || typeof obj !== 'object') return obj\n  if (Array.isArray(obj)) return obj.map(deepClone) as T\n  return Object.fromEntries(\n    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])\n  ) as T\n}` },
  { title: "React useLocalStorage Hook", description: "Persist state to localStorage", language: "typescript", tags: ["react", "hooks", "storage"], code: `function useLocalStorage<T>(key: string, initial: T) {\n  const [value, setValue] = useState<T>(() => {\n    const stored = localStorage.getItem(key)\n    return stored ? JSON.parse(stored) : initial\n  })\n\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value))\n  }, [key, value])\n\n  return [value, setValue] as const\n}` },
  { title: "Fetch with Retry", description: "Auto-retry failed requests", language: "typescript", tags: ["fetch", "async", "utility"], code: `async function fetchWithRetry(\n  url: string,\n  retries = 3,\n  delay = 1000\n): Promise<Response> {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url)\n      if (res.ok) return res\n    } catch (e) {\n      if (i === retries - 1) throw e\n      await new Promise(r => setTimeout(r, delay * (i + 1)))\n    }\n  }\n  throw new Error('Max retries reached')\n}` },
  { title: "CSS Grid Auto-fit Layout", description: "Responsive grid without media queries", language: "css", tags: ["css", "grid", "responsive"], code: `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(\n    auto-fit,\n    minmax(250px, 1fr)\n  );\n  gap: 1rem;\n}` },
  { title: "Python List Comprehension Examples", description: "Common list comprehension patterns", language: "python", tags: ["python", "lists"], code: `# Filter and transform\nevens = [x * 2 for x in range(10) if x % 2 == 0]\n\n# Flatten nested list\nflat = [x for row in matrix for x in row]\n\n# Dictionary comprehension\nsquares = {x: x**2 for x in range(5)}\n\n# Set comprehension\nunique = {word.lower() for word in words}` },
  { title: "SQL Window Functions", description: "Running totals and rankings", language: "sql", tags: ["sql", "analytics"], code: `SELECT \n  date,\n  revenue,\n  SUM(revenue) OVER (ORDER BY date) as running_total,\n  ROW_NUMBER() OVER (PARTITION BY month ORDER BY revenue DESC) as rank,\n  LAG(revenue) OVER (ORDER BY date) as prev_day\nFROM sales;` },
  { title: "Go Error Handling Pattern", description: "Idiomatic Go error wrapping", language: "go", tags: ["go", "errors"], code: `func processFile(path string) error {\n\tfile, err := os.Open(path)\n\tif err != nil {\n\t\treturn fmt.Errorf("opening file: %w", err)\n\t}\n\tdefer file.Close()\n\n\tif err := parse(file); err != nil {\n\t\treturn fmt.Errorf("parsing: %w", err)\n\t}\n\treturn nil\n}` }
]

const discussions = [
  { title: "Best practices for API versioning?", content: "<p>What's your preferred approach for versioning REST APIs? URL path (/v1/), headers, or query params?</p>", category: "help", tags: ["API", "REST", "architecture"] },
  { title: "Migrating from Create React App to Vite", content: "<p>Just migrated our large CRA project to Vite. Build times went from 2 minutes to 15 seconds! Happy to share our migration guide.</p>", category: "showcase", tags: ["React", "Vite", "migration"] },
  { title: "TypeScript strict mode - worth it?", content: "<p>Considering enabling strict mode on our existing codebase. Anyone have experience with the migration effort?</p>", category: "general", tags: ["TypeScript", "best-practices"] },
  { title: "Feedback on my portfolio site", content: "<p>Just launched my developer portfolio. Would love constructive feedback on the design and UX!</p>", category: "feedback", tags: ["portfolio", "design", "career"] },
  { title: "How do you handle feature flags?", content: "<p>Looking for recommendations on feature flag services or self-hosted solutions. What works for your team?</p>", category: "help", tags: ["DevOps", "feature-flags"] },
  { title: "Monorepo vs Polyrepo for microservices", content: "<p>Our team is debating repository structure. What are the pros/cons you've experienced?</p>", category: "general", tags: ["architecture", "git", "microservices"] }
]

async function seed() {
  console.log("🌱 Seeding content...")
  
  // Get or create a user
  let user = await db.user.findFirst({ where: { role: "admin" } })
  if (!user) {
    user = await db.user.findFirst()
  }
  if (!user) {
    console.log("No users found, creating demo user...")
    user = await db.user.create({
      data: { username: "stackit", email: "demo@stack-it.dev", password: "hashed", role: "admin", emailVerified: true }
    })
  }
  
  console.log(`Using user: ${user.username} (ID: ${user.id})`)

  // Create posts
  for (const p of posts) {
    const existing = await db.post.findFirst({ where: { title: p.title } })
    if (existing) {
      console.log(`  ⏭️  Post exists: ${p.title}`)
      continue
    }
    await db.post.create({
      data: {
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        technologies: JSON.stringify(p.technologies),
        coverImage: p.coverImage,
        authorId: user.id,
        files: { create: p.files }
      }
    })
    console.log(`  ✅ Created post: ${p.title}`)
  }

  // Create snippets
  for (const s of snippets) {
    const existing = await db.snippet.findFirst({ where: { title: s.title } })
    if (existing) {
      console.log(`  ⏭️  Snippet exists: ${s.title}`)
      continue
    }
    await db.snippet.create({
      data: {
        title: s.title,
        description: s.description,
        code: s.code,
        language: s.language,
        tags: JSON.stringify(s.tags),
        authorId: user.id
      }
    })
    console.log(`  ✅ Created snippet: ${s.title}`)
  }

  // Create discussions
  for (const d of discussions) {
    const existing = await db.forumThread.findFirst({ where: { title: d.title } })
    if (existing) {
      console.log(`  ⏭️  Discussion exists: ${d.title}`)
      continue
    }
    await db.forumThread.create({
      data: {
        title: d.title,
        content: d.content,
        category: d.category,
        tags: JSON.stringify(d.tags),
        authorId: user.id
      }
    })
    console.log(`  ✅ Created discussion: ${d.title}`)
  }

  console.log("\n✨ Seeding complete!")
  process.exit(0)
}

seed().catch(console.error)
