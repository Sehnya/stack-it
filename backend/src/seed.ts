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

  // Create stackit-team user (main author for seed posts)
  const teamPassword = await Bun.password.hash("password");
  const teamUser = await db.user.upsert({
    where: { email: "team@stackit.dev" },
    update: {},
    create: {
      username: "stackit-team",
      email: "team@stackit.dev",
      password: teamPassword,
      role: "admin",
    },
  });
  console.log("✅ Stack-It team user created:", teamUser.username);

  // Delete existing seed posts if they exist (IDs 1001-1006)
  await db.post.deleteMany({
    where: {
      id: { in: [1001, 1002, 1003, 1004, 1005, 1006] }
    }
  });

  // Create original sample posts (these will get auto-generated IDs)
  const samplePosts = [
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

  for (const post of samplePosts) {
    await db.post.create({ data: post });
  }
  console.log(`✅ Created ${samplePosts.length} sample posts`);

  // Post 1: React Server Components (Frontend)
  await db.post.create({
    data: {
      id: 1001,
      title: "React Server Components: The Future of Frontend in 2025",
      excerpt: "Discover how React Server Components are revolutionizing the way we build modern web applications with improved performance, reduced client-side JavaScript, and better user experiences.",
      content: `
<h2>What are React Server Components?</h2>
<p>React Server Components (RSC) represent a paradigm shift in how we think about rendering in React applications. Unlike traditional React components that run entirely on the client, Server Components execute on the server and stream rendered content to the browser.</p>

<h3>Key Benefits</h3>
<ul>
    <li><strong>Reduced Bundle Size:</strong> Server Components don't ship JavaScript to the client, significantly reducing your bundle size</li>
    <li><strong>Direct Backend Access:</strong> Access databases, file systems, and internal services directly without exposing sensitive data</li>
    <li><strong>Improved Performance:</strong> Faster initial page loads with server-side rendering</li>
    <li><strong>Automatic Code Splitting:</strong> Only load the client-side code you actually need</li>
</ul>

<h3>Example: Server Component</h3>
<pre><code>// app/BlogPost.server.js
async function BlogPost({ id }) {
  // This runs on the server - no API needed!
  const post = await db.posts.find(id);

  return (
    &lt;article&gt;
      &lt;h1&gt;{post.title}&lt;/h1&gt;
      &lt;p&gt;{post.content}&lt;/p&gt;
      &lt;LikeButton postId={id} /&gt; {/* Client Component */}
    &lt;/article&gt;
  );
}</code></pre>

<h3>Server vs Client Components</h3>
<p>The beauty of RSC is the ability to mix server and client components seamlessly:</p>
<ul>
    <li><strong>Server Components:</strong> Use for data fetching, rendering static content, accessing backend resources</li>
    <li><strong>Client Components:</strong> Use for interactivity, browser APIs, state management, event handlers</li>
</ul>

<h3>Best Practices for 2025</h3>
<ol>
    <li>Start with Server Components by default, only use Client Components when you need interactivity</li>
    <li>Leverage streaming and Suspense for better perceived performance</li>
    <li>Combine RSC with SSR/SSG for optimal performance and SEO</li>
    <li>Use the <code>'use client'</code> directive explicitly for interactive components</li>
</ol>

<h3>Real-World Impact</h3>
<p>Companies adopting React Server Components have reported:</p>
<ul>
    <li>Up to 80% reduction in initial JavaScript payload</li>
    <li>30-50% faster Time to Interactive (TTI)</li>
    <li>Simplified data fetching patterns without complex state management</li>
</ul>

<p><strong>Conclusion:</strong> React Server Components aren't just a trend—they're becoming the standard for building performant, scalable React applications in 2025. If you haven't explored RSC yet, now is the time to dive in!</p>
`,
      technologies: JSON.stringify(["React", "Server Components", "Performance", "SSR", "Web Development", "Frontend"]),
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200",
      authorId: teamUser.id,
    },
  });
  console.log("✅ Created post 1: React Server Components");

  // Post 2: Vue vs React (Frontend)
  await db.post.create({
    data: {
      id: 1002,
      title: "Vue vs React 2025: Choosing the Right Framework for Your Project",
      excerpt: "A comprehensive comparison of Vue and React in 2025. Learn which framework suits your project based on team size, complexity, TypeScript integration, and ecosystem maturity.",
      content: `
<h2>The Frontend Framework Dilemma</h2>
<p>In 2025, both React and Vue remain powerhouse frameworks, but they serve different needs. Let's break down when to choose each one.</p>

<h3>React: The Enterprise Champion</h3>
<p>React continues to dominate with <strong>80% of enterprise teams</strong> using it directly or through Next.js. Here's why:</p>

<ul>
    <li><strong>Massive Ecosystem:</strong> Unparalleled library support and third-party integrations</li>
    <li><strong>Flexibility:</strong> Choose your own routing, state management, and build tools</li>
    <li><strong>Server Components:</strong> Cutting-edge features like RSC and Suspense</li>
    <li><strong>Market Demand:</strong> More job opportunities and larger community</li>
</ul>

<h4>React Example: Component with Hooks</h4>
<pre><code>import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() =&gt; {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return user ? &lt;div&gt;{user.name}&lt;/div&gt; : &lt;Loading /&gt;;
}</code></pre>

<h3>Vue: The Developer Experience Favorite</h3>
<p>Vue is gaining momentum, especially among <strong>small to medium teams and startups</strong>. Here's what makes it special:</p>

<ul>
    <li><strong>Gentle Learning Curve:</strong> Easier for beginners and teams transitioning from vanilla JS</li>
    <li><strong>Integrated Solution:</strong> Official routing (Vue Router), state management (Pinia), and tooling (Vite)</li>
    <li><strong>Single File Components:</strong> HTML, CSS, and JS in one file for better organization</li>
    <li><strong>Performance:</strong> Slightly faster runtime and smaller bundle sizes</li>
</ul>

<h4>Vue Example: Composition API</h4>
<pre><code>&lt;script setup&gt;
import { ref, onMounted } from 'vue';

const user = ref(null);

onMounted(async () =&gt; {
  user.value = await fetchUser(props.userId);
});
&lt;/script&gt;

&lt;template&gt;
  &lt;div v-if="user"&gt;{{ user.name }}&lt;/div&gt;
  &lt;Loading v-else /&gt;
&lt;/template&gt;</code></pre>

<h3>Key Comparison Table</h3>
<table border="1" cellpadding="8">
    <tr>
        <th>Feature</th>
        <th>React</th>
        <th>Vue</th>
    </tr>
    <tr>
        <td>Learning Curve</td>
        <td>Moderate to Steep</td>
        <td>Gentle</td>
    </tr>
    <tr>
        <td>TypeScript</td>
        <td>Excellent</td>
        <td>Excellent (improved in 2025)</td>
    </tr>
    <tr>
        <td>Build Tool</td>
        <td>Create React App / Vite</td>
        <td>Vite (official)</td>
    </tr>
    <tr>
        <td>State Management</td>
        <td>Redux / Zustand / Context</td>
        <td>Pinia (official)</td>
    </tr>
    <tr>
        <td>Enterprise Adoption</td>
        <td>Very High</td>
        <td>Growing</td>
    </tr>
</table>

<h3>Decision Guide: When to Choose What</h3>

<p><strong>Choose React if:</strong></p>
<ul>
    <li>You're building a large-scale enterprise application</li>
    <li>You need the most cutting-edge features (Server Components, etc.)</li>
    <li>Your team is already familiar with React or you're hiring React developers</li>
    <li>You want maximum flexibility in choosing your tech stack</li>
</ul>

<p><strong>Choose Vue if:</strong></p>
<ul>
    <li>You're a startup or small team that needs to move fast</li>
    <li>You prefer an integrated solution with official tooling</li>
    <li>You want a gentler learning curve for your team</li>
    <li>You're building a content-heavy website or moderate complexity app</li>
</ul>

<h3>The 2025 Verdict</h3>
<p>There's no wrong choice—both frameworks are production-ready and actively maintained. React offers power and flexibility for complex applications, while Vue provides developer happiness and rapid development. Consider your team's experience, project requirements, and long-term maintenance needs.</p>

<p><em>Pro tip: Try building a small project in both frameworks before making your decision!</em></p>
`,
      technologies: JSON.stringify(["Vue", "React", "Frameworks", "Comparison", "TypeScript", "Frontend"]),
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
      authorId: teamUser.id,
    },
  });
  console.log("✅ Created post 2: Vue vs React 2025");

  // Post 3: GraphQL vs REST (Backend)
  await db.post.create({
    data: {
      id: 1003,
      title: "GraphQL vs REST: Modern API Design Best Practices for 2025",
      excerpt: "Explore the evolution of API design in 2025. Learn when to use GraphQL or REST, implement Zero Trust security, optimize performance with caching, and create developer-friendly documentation.",
      content: `
<h2>The State of API Design in 2025</h2>
<p>API design is the backbone of modern applications. While RESTful APIs still dominate, GraphQL is rapidly gaining ground. Let's explore both approaches and when to use each.</p>

<h3>REST: The Proven Standard</h3>
<p>REST remains the most widely adopted API architecture, and for good reason:</p>

<h4>REST Best Practices for 2025</h4>
<ul>
    <li><strong>Use nouns for resources:</strong> <code>/users</code>, <code>/posts</code>, <code>/comments</code></li>
    <li><strong>HTTP verbs for actions:</strong> GET (read), POST (create), PUT/PATCH (update), DELETE (delete)</li>
    <li><strong>Plural nouns for collections:</strong> <code>/api/users</code> not <code>/api/user</code></li>
    <li><strong>Nested resources:</strong> <code>/users/123/posts</code> for user-specific posts</li>
</ul>

<h4>Example: RESTful Endpoint Design</h4>
<pre><code># Good REST API Design
GET    /api/users           # List all users
GET    /api/users/123       # Get specific user
POST   /api/users           # Create new user
PUT    /api/users/123       # Update user
DELETE /api/users/123       # Delete user
GET    /api/users/123/posts # Get user's posts</code></pre>

<h3>GraphQL: The Flexible Alternative</h3>
<p>GraphQL shines in scenarios where you need precise data fetching and want to avoid over-fetching or under-fetching data.</p>

<h4>GraphQL Advantages</h4>
<ul>
    <li><strong>Single Endpoint:</strong> One endpoint for all data operations</li>
    <li><strong>Precise Data Fetching:</strong> Request exactly the fields you need</li>
    <li><strong>Reduced API Calls:</strong> Fetch related data in a single request</li>
    <li><strong>Strong Typing:</strong> Schema-based with built-in validation</li>
</ul>

<h4>Example: GraphQL Query</h4>
<pre><code>query GetUserWithPosts {
  user(id: "123") {
    id
    name
    email
    posts {
      id
      title
      summary
      createdAt
    }
  }
}

# Returns exactly what you asked for - no more, no less!</code></pre>

<h3>Security: Zero Trust Architecture</h3>
<p>In 2025, <strong>Zero Trust security models</strong> are becoming the standard for API security:</p>

<ol>
    <li><strong>Authentication:</strong> Use JWT tokens or OAuth 2.0 with short expiration times</li>
    <li><strong>Authorization:</strong> Implement role-based access control (RBAC) at the API level</li>
    <li><strong>Rate Limiting:</strong> Protect against abuse with rate limits per user/IP</li>
    <li><strong>Input Validation:</strong> Never trust client input—validate everything</li>
    <li><strong>HTTPS Only:</strong> Encrypt all API traffic with TLS 1.3</li>
</ol>

<h4>Rate Limiting Example (Flask)</h4>
<pre><code>from flask_limiter import Limiter

limiter = Limiter(
    app,
    key_func=lambda: request.headers.get('X-API-Key'),
    default_limits=["100 per hour", "10 per minute"]
)

@app.route('/api/posts')
@limiter.limit("30 per minute")
def get_posts():
    # Rate limited to 30 requests per minute
    return jsonify(posts)</code></pre>

<h3>Performance: Caching Strategies</h3>
<p>Caching is essential for API performance in 2025:</p>

<ul>
    <li><strong>HTTP Caching:</strong> Use <code>Cache-Control</code>, <code>ETag</code>, and <code>Last-Modified</code> headers</li>
    <li><strong>Server-Side Caching:</strong> Redis or Memcached for frequently accessed data</li>
    <li><strong>CDN Caching:</strong> Cache static API responses at the edge</li>
    <li><strong>Database Query Caching:</strong> Cache expensive database queries</li>
</ul>

<h3>When to Choose What?</h3>

<p><strong>Choose REST when:</strong></p>
<ul>
    <li>You need a simple, well-understood architecture</li>
    <li>You're building public APIs for third-party consumption</li>
    <li>HTTP caching is important for your use case</li>
    <li>You have simple, predictable data relationships</li>
</ul>

<p><strong>Choose GraphQL when:</strong></p>
<ul>
    <li>You have complex, nested data requirements</li>
    <li>Multiple client types (web, mobile, desktop) need different data shapes</li>
    <li>You want to reduce the number of API requests</li>
    <li>Your team can handle the additional complexity</li>
</ul>

<h3>Hybrid Approach: Best of Both Worlds</h3>
<p>Many organizations in 2025 are adopting a hybrid approach:</p>
<ul>
    <li>REST for public APIs and simple CRUD operations</li>
    <li>GraphQL for internal APIs and complex client applications</li>
    <li>gRPC for internal microservice communication</li>
</ul>

<p><strong>Conclusion:</strong> Whether you choose REST or GraphQL, focus on security, performance, and developer experience. A well-designed API is intuitive, fast, secure, and thoroughly documented. The best API is the one that serves your specific needs and scales with your application.</p>
`,
      technologies: JSON.stringify(["GraphQL", "REST", "API Design", "Best Practices", "Performance", "Security", "Backend"]),
      coverImage: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200",
      authorId: teamUser.id,
    },
  });
  console.log("✅ Created post 3: GraphQL vs REST");

  // Post 4: Building ChatGPT-Style App with Next.js and Ollama (AI)
  await db.post.create({
    data: {
      id: 1004,
      title: "Building a ChatGPT-Style Chat App with Next.js and Ollama",
      excerpt: "Learn how to build a fully functional AI chat application using Next.js 14, Ollama for local LLM inference, and modern React patterns. Includes streaming responses, chat history, and a beautiful UI—all running locally on your machine.",
      content: `
<h2>Introduction to Local AI Chat Apps</h2>
<p>Building ChatGPT-style interfaces has never been easier. With Next.js and Ollama, you can create a production-ready AI chat application that runs entirely on your infrastructure—no API keys, no usage limits, complete data privacy.</p>

<p>In this comprehensive guide, we'll build a fully functional chat application with:</p>
<ul>
    <li><strong>Streaming responses:</strong> Real-time AI message generation</li>
    <li><strong>Modern UI:</strong> ChatGPT-inspired interface with message bubbles</li>
    <li><strong>Local inference:</strong> All processing happens on your machine</li>
    <li><strong>TypeScript support:</strong> Type-safe development</li>
    <li><strong>Markdown rendering:</strong> Beautiful formatted responses</li>
</ul>

<h3>Prerequisites</h3>
<p>Before we begin, make sure you have:</p>
<ul>
    <li><strong>Node.js:</strong> Version 18 or higher installed</li>
    <li><strong>Ollama:</strong> Downloaded from <code>ollama.com</code></li>
    <li><strong>Basic React knowledge:</strong> Familiarity with hooks and components</li>
    <li><strong>Terminal access:</strong> Command line for running commands</li>
</ul>

<h3>Step 1: Install and Set Up Ollama</h3>
<p>Ollama allows you to run large language models locally on your machine. It's like having ChatGPT running on your computer!</p>

<h4>Installation</h4>
<ol>
    <li>Visit <code>ollama.com</code> and download the installer for your OS (macOS, Linux, or Windows)</li>
    <li>Install and verify it's working:</li>
</ol>

<pre><code># Verify installation
ollama -v

# Download and run a model (this will take a few minutes)
ollama run llama3.1

# Alternative models you can try:
ollama run gemma2
ollama run mistral</code></pre>

<p>Once you see the model responding in your terminal, you're ready to proceed!</p>

<h3>Step 2: Create Your Next.js Project</h3>
<p>Let's create a new Next.js 14 application with TypeScript support:</p>

<pre><code># Create new Next.js app
npx create-next-app@latest ollama-chat

# When prompted, choose:
# ✓ TypeScript: Yes
# ✓ ESLint: Yes
# ✓ Tailwind CSS: Yes
# ✓ App Router: Yes
# ✓ Turbopack: No (optional)
# ✓ Import alias: No

# Navigate to project
cd ollama-chat</code></pre>

<h3>Step 3: Install Required Dependencies</h3>
<p>We need several packages to make our chat app work:</p>

<pre><code>npm install ai ollama ollama-ai-provider react-markdown</code></pre>

<p><strong>Package breakdown:</strong></p>
<ul>
    <li><code>ai</code> - Vercel AI SDK for streaming and chat hooks</li>
    <li><code>ollama</code> - JavaScript library to communicate with Ollama</li>
    <li><code>ollama-ai-provider</code> - Bridge between AI SDK and Ollama</li>
    <li><code>react-markdown</code> - Render AI responses with markdown formatting</li>
</ul>

<h3>Step 4: Build the Backend API Route</h3>
<p>Create the API endpoint that will handle chat requests. Create a new file <code>src/app/api/chat/route.ts</code>:</p>

<pre><code>import { createOllama } from 'ollama-ai-provider';
import { streamText } from 'ai';

// Create Ollama instance
const ollama = createOllama();

export async function POST(req: Request) {
  // Extract messages from request body
  const { messages } = await req.json();

  // Stream AI response using Ollama
  const result = await streamText({
    model: ollama('llama3.1'),  // Use llama3.1 model
    messages,
  });

  // Return streaming response to client
  return result.toDataStreamResponse();
}</code></pre>

<p><strong>How it works:</strong></p>
<ol>
    <li><code>createOllama()</code> initializes communication with your locally-running Ollama instance</li>
    <li>The POST handler receives the conversation history from the frontend</li>
    <li><code>streamText()</code> sends messages to the LLM and streams the response back</li>
    <li><code>toDataStreamResponse()</code> formats the stream as server-sent events for the browser</li>
</ol>

<h3>Step 5: Create the Chat UI Frontend</h3>
<p>Replace the contents of <code>src/app/page.tsx</code> with this beautiful chat interface:</p>

<pre><code>"use client";
import { useChat } from "ai/react";
import Markdown from "react-markdown";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    &lt;main className="flex min-h-screen flex-col items-center justify-start p-24"&gt;
      &lt;div className="flex flex-col w-full max-w-3xl rounded-lg bg-white/10 shadow-2xl"&gt;

        {/* Header */}
        &lt;div className="px-6 py-4 border-b border-gray-700"&gt;
          &lt;h1 className="text-2xl font-bold text-white"&gt;Local AI Chat&lt;/h1&gt;
          &lt;p className="text-sm text-gray-400"&gt;Powered by Ollama & Next.js&lt;/p&gt;
        &lt;/div&gt;

        {/* Messages Container */}
        &lt;div className="min-h-[60vh] h-[60vh] max-h-[60vh] overflow-y-auto p-6"&gt;
          &lt;div className="flex flex-col justify-end gap-4 w-full pb-4"&gt;

            {messages.length ? (
              messages.map((m, i) =&gt;
                m.role === "user" ? (
                  // User Message
                  &lt;div key={i} className="w-full flex flex-col gap-2 items-end"&gt;
                    &lt;span className="px-2 text-sm text-gray-400"&gt;You&lt;/span&gt;
                    &lt;div className="flex flex-col px-4 py-3 max-w-[85%] bg-blue-600 rounded-lg text-white whitespace-pre-wrap"&gt;
                      &lt;Markdown&gt;{m.content}&lt;/Markdown&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;
                ) : (
                  // AI Message
                  &lt;div key={i} className="w-full flex flex-col gap-2 items-start"&gt;
                    &lt;span className="px-2 text-sm text-gray-400"&gt;AI&lt;/span&gt;
                    &lt;div className="flex flex-col max-w-[85%] px-4 py-3 bg-gray-700 rounded-lg text-white whitespace-pre-wrap"&gt;
                      &lt;Markdown&gt;{m.content}&lt;/Markdown&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;
                )
              )
            ) : (
              // Empty State
              &lt;div className="flex-1 flex items-center justify-center text-gray-500"&gt;
                &lt;div className="text-center"&gt;
                  &lt;p className="text-xl"&gt;Start a conversation!&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;

        {/* Input Form */}
        &lt;form onSubmit={handleSubmit} className="w-full px-6 py-4 border-t border-gray-700"&gt;
          &lt;div className="flex gap-2"&gt;
            &lt;input
              className="flex-1 px-4 py-3 border border-gray-600 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              placeholder="Ask me anything..."
              onChange={handleInputChange}
            /&gt;
            &lt;button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            &gt;
              Send
            &lt;/button&gt;
          &lt;/div&gt;
        &lt;/form&gt;

      &lt;/div&gt;
    &lt;/main&gt;
  );
}</code></pre>

<h3>Step 6: Run Your Application</h3>
<p>Make sure Ollama is running in the background, then start your dev server:</p>

<pre><code># In one terminal, ensure Ollama is running:
ollama serve

# In another terminal, start Next.js:
npm run dev</code></pre>

<p>Open your browser to <code>http://localhost:3000</code> and start chatting!</p>

<h3>Understanding the Architecture</h3>
<p>Here's how the pieces fit together:</p>

<ol>
    <li><strong>User types message:</strong> The input is captured by the <code>useChat()</code> hook</li>
    <li><strong>Frontend sends request:</strong> Message history is sent to <code>/api/chat</code></li>
    <li><strong>Backend processes:</strong> API route forwards messages to Ollama running locally</li>
    <li><strong>Ollama generates response:</strong> The LLM processes the conversation and generates a reply</li>
    <li><strong>Streaming response:</strong> Tokens stream back through the API to the frontend in real-time</li>
    <li><strong>UI updates:</strong> React renders each token as it arrives, creating the typing effect</li>
</ol>

<p>All of this happens <strong>locally on your machine</strong>—no data leaves your computer!</p>

<h3>Troubleshooting Common Issues</h3>

<p><strong>Issue: "Failed to fetch" error</strong></p>
<ul>
    <li>Solution: Make sure Ollama is running (<code>ollama serve</code>)</li>
    <li>Check that the model is downloaded (<code>ollama list</code>)</li>
</ul>

<p><strong>Issue: Slow response times</strong></p>
<ul>
    <li>Solution: Try a smaller model like <code>gemma2</code> or <code>mistral</code></li>
    <li>Close other resource-intensive applications</li>
    <li>Check if your GPU is being utilized</li>
</ul>

<p><strong>Conclusion:</strong> You've built a fully functional ChatGPT-style application that runs entirely on your infrastructure. You now have complete data privacy, no API costs, and a production-ready TypeScript codebase!</p>
`,
      technologies: JSON.stringify(["Next.js", "Ollama", "AI", "ChatGPT", "React", "LLM", "Streaming", "TypeScript"]),
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200",
      authorId: teamUser.id,
    },
  });
  console.log("✅ Created post 4: ChatGPT-Style Chat App");

  // Post 5: Building GBA Games with Butano and Aseprite (Game Dev)
  await db.post.create({
    data: {
      id: 1005,
      title: "Building Game Boy Advance Games with Butano and Aseprite",
      excerpt: "Learn how to create your own Game Boy Advance games in 2025 using the modern Butano C++ engine and Aseprite for pixel art. Complete guide covering setup, sprite creation, physics systems, and deploying to real GBA hardware.",
      content: `
<h2>Why Make GBA Games in 2025?</h2>
<p>The Game Boy Advance might be over 20 years old, but creating games for it has never been more accessible or rewarding. With modern tools like the <strong>Butano engine</strong> and <strong>Aseprite</strong>, you can build professional-quality GBA games without touching low-level hardware registers or assembly code.</p>

<p>Why GBA development is thriving in 2025:</p>
<ul>
    <li><strong>Nostalgia meets creativity:</strong> Build games for the iconic handheld that defined a generation</li>
    <li><strong>Constraints breed innovation:</strong> Limited hardware forces creative problem-solving</li>
    <li><strong>Active community:</strong> Growing scene with Discord, forums, and game jams</li>
    <li><strong>Real hardware deployment:</strong> Flash carts let you play your games on actual GBA consoles</li>
    <li><strong>Modern tooling:</strong> High-level engines like Butano make development fast and fun</li>
</ul>

<h2>What is Butano?</h2>
<p>Butano is a modern C++ engine for the Game Boy Advance that transforms GBA development from hardware wrestling into high-level game creation. Created by GValiente, Butano provides single-line APIs for tasks that traditionally required dozens of lines of register manipulation.</p>

<h3>Key Features</h3>
<ul>
    <li><strong>Modern C++17:</strong> RAII, smart pointers, and template metaprogramming</li>
    <li><strong>Zero heap allocations:</strong> Stack-only memory management for predictable performance</li>
    <li><strong>Automatic asset pipeline:</strong> Drop BMP/audio files in folders, get GBA-ready assets</li>
    <li><strong>30+ included examples:</strong> Learn from working games like Butano Fighter</li>
    <li><strong>Actions system:</strong> Built-in tweening, animations, and sprite management</li>
</ul>

<h2>GBA Hardware Specifications</h2>
<p>Understanding the GBA's capabilities helps you design better games:</p>

<h3>Display</h3>
<ul>
    <li><strong>Resolution:</strong> 240x160 pixels (3:2 aspect ratio)</li>
    <li><strong>Colors:</strong> 15-bit RGB (32,768 total colors, 512 on-screen simultaneously)</li>
    <li><strong>Refresh rate:</strong> 60 Hz (~16.7ms per frame)</li>
</ul>

<h3>Sprite System</h3>
<ul>
    <li><strong>Max sprites:</strong> 128 simultaneous sprite objects</li>
    <li><strong>Sizes:</strong> 8x8, 16x16, 32x32, 64x64, plus rectangular variants</li>
    <li><strong>Tile-based:</strong> All graphics use 8x8 pixel tiles as building blocks</li>
</ul>

<h2>Development Environment Setup</h2>

<h3>Option 1: Wonderful Toolchain (Recommended for Beginners)</h3>
<pre><code># Download and install
curl -L https://wonderful.asie.pl/bootstrap/wf-pacman -o /tmp/wf-pacman
chmod +x /tmp/wf-pacman
/tmp/wf-pacman

# Set up environment
source ~/.wonderful/env/wf.sh

# Install GBA toolchain
wf-pacman -Syu
wf-pacman -S target-gba wf-tools

# Verify installation
arm-none-eabi-g++ --version</code></pre>

<h3>Get Butano Engine</h3>
<pre><code># Clone Butano repository
cd ~/Documents/code_projects
git clone https://github.com/GValiente/butano.git
cd butano

# Explore the examples
ls examples/</code></pre>

<h2>Creating Sprites with Aseprite</h2>
<p>Aseprite is the perfect tool for creating GBA sprites. Its indexed color mode aligns perfectly with GBA requirements.</p>

<h3>Setting Up Your Canvas</h3>
<ol>
    <li>Open Aseprite and create a new file: <strong>File → New</strong></li>
    <li>Configure settings:
        <ul>
            <li><strong>Width/Height:</strong> 16x16 (or 32x32 for larger sprites)</li>
            <li><strong>Color Mode:</strong> Indexed (critical for GBA!)</li>
        </ul>
    </li>
</ol>

<h3>GBA Color Palette Guidelines</h3>
<ul>
    <li><strong>15-bit color:</strong> GBA uses 5 bits per channel (32 levels of R, G, B)</li>
    <li><strong>First color = transparent:</strong> Index 0 in your palette won't render</li>
    <li><strong>16 colors for 4bpp:</strong> More memory-efficient (recommended)</li>
</ul>

<h2>Building Your First GBA Game</h2>

<h3>Step 1: Create Project from Template</h3>
<pre><code># Copy Butano template to new project
cp -r ~/Documents/code_projects/butano/template ~/Documents/code_projects/my-gba-game
cd ~/Documents/code_projects/my-gba-game</code></pre>

<h3>Step 2: Write Game Code</h3>
<p>Replace <code>src/main.cpp</code> with this simple game:</p>

<pre><code>#include "bn_core.h"
#include "bn_sprite_ptr.h"
#include "bn_sprite_items_player.h"
#include "bn_keypad.h"

int main() {
    // Initialize Butano
    bn::core::init();

    // Create player sprite at center of screen (0, 0)
    bn::sprite_ptr player = bn::sprite_items::player.create_sprite(0, 0);

    // Game loop (60 FPS)
    while(true) {
        // Handle input
        if(bn::keypad::left_held()) {
            player.set_x(player.x() - 2);
        }
        if(bn::keypad::right_held()) {
            player.set_x(player.x() + 2);
        }
        if(bn::keypad::up_held()) {
            player.set_y(player.y() - 2);
        }
        if(bn::keypad::down_held()) {
            player.set_y(player.y() + 2);
        }

        // Keep player on screen (-120 to 120, -80 to 80)
        if(player.x() &lt; -120) player.set_x(-120);
        if(player.x() &gt; 120) player.set_x(120);
        if(player.y() &lt; -80) player.set_y(-80);
        if(player.y() &gt; 80) player.set_y(80);

        // Update screen (must call every frame)
        bn::core::update();
    }
}</code></pre>

<h3>Step 3: Build and Run</h3>
<pre><code># Build the ROM (use -j for parallel compilation)
make -j8

# Run in emulator
mgba-qt mygame.gba</code></pre>

<p><strong>Congratulations!</strong> You've just built your first GBA game!</p>

<h2>Advanced: Physics System with Fixed-Point Math</h2>
<p>The GBA has no floating-point unit, so use <code>bn::fixed</code> for all decimal numbers:</p>

<pre><code>#include "bn_fixed.h"
#include "bn_fixed_point.h"

struct Player {
    bn::fixed_point position{0, -60};
    bn::fixed_point velocity{0, 0};
    bool on_ground = false;
};

constexpr bn::fixed GRAVITY = bn::fixed(0.5);
constexpr bn::fixed JUMP_FORCE = bn::fixed(-8);

void update_physics(Player&amp; player) {
    // Apply gravity if in air
    if(!player.on_ground) {
        player.velocity.set_y(player.velocity.y() + GRAVITY);
    }

    // Update position based on velocity
    player.position += player.velocity;

    // Ground collision at Y=50
    if(player.position.y() &gt;= 50) {
        player.position.set_y(50);
        player.velocity.set_y(0);
        player.on_ground = true;
    } else {
        player.on_ground = false;
    }
}</code></pre>

<h2>Resources and Community</h2>
<ul>
    <li><strong>Butano Docs:</strong> gvaliente.github.io/butano</li>
    <li><strong>Butano GitHub:</strong> github.com/GValiente/butano</li>
    <li><strong>gbadev Discord:</strong> discord.gg/ctGSNxRkg2</li>
    <li><strong>Aseprite:</strong> aseprite.org</li>
    <li><strong>mGBA Emulator:</strong> mgba.io</li>
</ul>

<h2>Deploying to Real Hardware</h2>
<p>The ultimate thrill is playing your game on an actual Game Boy Advance! Flash cartridges like <strong>EZ-Flash Omega</strong> or <strong>Everdrive GBA X5</strong> let you load ROMs onto real GBA hardware.</p>

<p><strong>Happy coding, and welcome to the world of GBA homebrew!</strong></p>
`,
      technologies: JSON.stringify(["Butano", "GBA", "Game Boy Advance", "Aseprite", "Retro Gaming", "Game Development", "Homebrew", "Pixel Art"]),
      coverImage: "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=1200",
      authorId: teamUser.id,
    },
  });
  console.log("✅ Created post 5: GBA Games with Butano");

  // Post 6: Getting Started with Stack-It (Documentation)
  await db.post.create({
    data: {
      id: 1006,
      title: "Getting Started with Stack-It: Your Complete Guide",
      excerpt: "A comprehensive guide to using Stack-It - learn how to create an account, share technical content, organize posts by categories, bookmark favorites, and collaborate with the developer community.",
      content: `
<h2>Welcome to Stack-It!</h2>
<p>Stack-It is your go-to platform for discovering, sharing, and managing technical content. Whether you're looking for the latest code snippets, tutorials, or best practices for your favorite tech stacks, Stack-It provides a seamless, community-driven experience.</p>

<p><strong>Our Mission:</strong> Provide the most up-to-date code and documentation for popular technology stacks to give developers a seamless experience with cohesiveness in mind.</p>

<h2>What Can You Do with Stack-It?</h2>
<ul>
    <li><strong>Discover Content:</strong> Browse curated posts across Frontend, Backend, AI, Game Dev, and Documentation categories</li>
    <li><strong>Share Knowledge:</strong> Create rich, formatted posts with code snippets, images, and detailed explanations</li>
    <li><strong>Save Favorites:</strong> Bookmark posts you love for quick access later</li>
    <li><strong>Filter by Tags:</strong> Find exactly what you need with our powerful tagging system</li>
    <li><strong>Join the Community:</strong> Connect with developers and see who's online</li>
</ul>

<h2>Getting Started: Your First Steps</h2>

<h4>Step 1: Create Your Account</h4>
<p>Creating an account on Stack-It is quick and easy:</p>
<ol>
    <li>Click the <strong>"Sign Up"</strong> button in the navigation bar</li>
    <li>Fill in your details:
        <ul>
            <li><strong>Username:</strong> Choose a unique username (this will be visible to other users)</li>
            <li><strong>Email:</strong> Your email address (used for login and must be unique)</li>
            <li><strong>Password:</strong> Create a secure password (minimum 6 characters recommended)</li>
        </ul>
    </li>
    <li>Click <strong>"Create Account"</strong></li>
    <li>You'll be automatically logged in and redirected to your dashboard!</li>
</ol>

<h4>Step 2: Explore Your Dashboard</h4>
<p>Once logged in, you'll land on the Dashboard - your home base for discovering content. The dashboard features five organized tabs:</p>

<ul>
    <li><strong>Frontend:</strong> Posts about React, Vue, Next.js, Tailwind CSS, TypeScript, and modern frontend development</li>
    <li><strong>Backend:</strong> Posts about Node.js, Express, Flask, databases, APIs, GraphQL, REST, and server-side development</li>
    <li><strong>AI:</strong> Posts about AI/ML frameworks, LLMs, Ollama, ChatGPT integrations, and artificial intelligence</li>
    <li><strong>Game Dev:</strong> Posts about game development, engines, tools like Butano, and retro gaming</li>
    <li><strong>Docs:</strong> Documentation, guides, tutorials, and "how-to" content (like this post!)</li>
</ul>

<h2>Creating Your First Post</h2>
<p>Ready to share your knowledge with the community? Here's how to create a post:</p>

<h4>Step 1: Navigate to Create Post</h4>
<p>Click the <strong>"Create Post"</strong> button in the navigation bar (visible when logged in).</p>

<h4>Step 2: Fill in Post Details</h4>
<ul>
    <li><strong>Title:</strong> Give your post a clear, descriptive title</li>
    <li><strong>Summary:</strong> Write a brief 1-2 sentence summary</li>
    <li><strong>Tags:</strong> Add comma-separated tags to make your post discoverable</li>
    <li><strong>Body:</strong> Write your main content using the rich text editor</li>
</ul>

<h4>Rich Text Editor Features</h4>
<ul>
    <li><strong>Text Formatting:</strong> Bold, Italic, Underline, Strikethrough</li>
    <li><strong>Headings:</strong> H1-H6 for organizing content</li>
    <li><strong>Lists:</strong> Ordered and unordered lists</li>
    <li><strong>Code:</strong> Inline code and code blocks</li>
    <li><strong>Links and Images:</strong> Add hyperlinks and images via URL</li>
    <li><strong>Tables:</strong> Create structured data comparisons</li>
</ul>

<h2>Using the Favorites System</h2>
<p>Found a post you love? Save it to your favorites for easy access!</p>

<h4>Adding to Favorites</h4>
<ol>
    <li>Find a post you want to save</li>
    <li>Click the <strong>heart icon</strong> on the post card or post page</li>
    <li>The heart will fill in to show it's favorited</li>
</ol>

<h4>Viewing Your Favorites</h4>
<ol>
    <li>Click <strong>"Favorites"</strong> in the navigation bar</li>
    <li>Browse all your saved posts in one place</li>
    <li>Filter favorites by tags using the tag buttons</li>
</ol>

<h2>Tips and Best Practices</h2>

<h4>Writing Great Posts</h4>
<ul>
    <li><strong>Clear Titles:</strong> Use descriptive, specific titles that tell readers what they'll learn</li>
    <li><strong>Good Summaries:</strong> Write compelling 1-2 sentence summaries</li>
    <li><strong>Structure Content:</strong> Use headings, lists, and paragraphs to organize information</li>
    <li><strong>Code Examples:</strong> Include practical, working code snippets</li>
    <li><strong>Relevant Tags:</strong> Add 5-10 specific tags for discoverability</li>
</ul>

<h4>Using Tags Effectively</h4>
<ul>
    <li>Use lowercase for consistency: <code>react</code> not <code>React</code></li>
    <li>Be specific: <code>react-hooks</code> is better than just <code>react</code></li>
    <li>Include technology names: <code>python</code>, <code>javascript</code>, <code>flask</code></li>
    <li>Separate with commas: <code>react,hooks,typescript,frontend</code></li>
</ul>

<h2>Welcome to the Community!</h2>

<p>Stack-It is built by developers, for developers. Whether you're here to learn, share, or both, we're excited to have you as part of our community.</p>

<p><strong>Happy coding, and welcome to Stack-It!</strong></p>
`,
      technologies: JSON.stringify(["Documentation", "Getting Started", "Guide", "Tutorial", "Stack-It", "Help"]),
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
      authorId: teamUser.id,
    },
  });
  console.log("✅ Created post 6: Getting Started with Stack-It");

  const postCount = await db.post.count();
  console.log(`\n🎉 Seeding complete! Total posts: ${postCount}`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
