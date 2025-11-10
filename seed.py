#!/usr/bin/env python3
"""
Seed script to populate the database with sample community posts.
Run this script with: python seed.py
"""

from db import db, Post, User
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import sys


def seed_posts():
    """Create sample posts for the community page."""

    print("🌱 Starting database seeding...")

    # Connect to database
    db.connect()

    try:
        # Get or create the stack-it team user to be the author
        try:
            author = User.get(User.username == 'stackit-team')
            print(f"✓ Found author: {author.username} (ID: {author.id})")
        except User.DoesNotExist:
            # Create the team user if it doesn't exist
            print("Creating 'stackit-team' user...")
            hashed_password = generate_password_hash('password')
            author = User.create(
                username='stackit-team',
                email='team@stackit.com',
                password=hashed_password,
                role='admin',
                profile_photo='/static/images/apple-touch-icon.png'
            )
            print(f"✓ Created author: {author.username} (ID: {author.id})")

        # Check if posts already exist
        existing_posts = list(Post.select().where(Post.id.in_([1001, 1002, 1003, 1004, 1005, 1006])))
        if existing_posts:
            print(f"⚠️  Warning: {len(existing_posts)} post(s) with IDs 1001-1006 already exist.")
            response = input("Do you want to delete them and recreate? (y/n): ")
            if response.lower() == 'y':
                for post in existing_posts:
                    post.delete_instance()
                print("✓ Deleted existing posts")
            else:
                print("Skipping seed. Exiting.")
                return

        # Post 1: React Server Components (Frontend)
        post1 = Post.create(
            id=1001,
            title="React Server Components: The Future of Frontend in 2025",
            summary="Discover how React Server Components are revolutionizing the way we build modern web applications with improved performance, reduced client-side JavaScript, and better user experiences.",
            body="""
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
""",
            tags="react,server-components,performance,ssr,web-development",
            category="frontend",
            author=author,
            created_at=datetime.now() - timedelta(days=2)
        )
        print(f"✓ Created post 1: {post1.title}")

        # Post 2: Vue vs React (Frontend)
        post2 = Post.create(
            id=1002,
            title="Vue vs React 2025: Choosing the Right Framework for Your Project",
            summary="A comprehensive comparison of Vue and React in 2025. Learn which framework suits your project based on team size, complexity, TypeScript integration, and ecosystem maturity.",
            body="""
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
""",
            tags="vue,react,frameworks,comparison,typescript,frontend",
            category="frontend",
            author=author,
            created_at=datetime.now() - timedelta(days=1)
        )
        print(f"✓ Created post 2: {post2.title}")

        # Post 3: GraphQL vs REST (Backend)
        post3 = Post.create(
            id=1003,
            title="GraphQL vs REST: Modern API Design Best Practices for 2025",
            summary="Explore the evolution of API design in 2025. Learn when to use GraphQL or REST, implement Zero Trust security, optimize performance with caching, and create developer-friendly documentation.",
            body="""
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

<h3>Documentation: The Developer Experience</h3>
<p>Good documentation is non-negotiable in 2025. Developers should achieve basic integration in <strong>15 minutes</strong>.</p>

<p><strong>Tools for API Documentation:</strong></p>
<ul>
    <li><strong>REST:</strong> OpenAPI/Swagger, Postman Collections, Redoc</li>
    <li><strong>GraphQL:</strong> GraphiQL, Apollo Studio, built-in introspection</li>
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
""",
            tags="graphql,rest,api-design,best-practices,performance,security",
            category="backend",
            author=author,
            created_at=datetime.now()
        )
        print(f"✓ Created post 3: {post3.title}")

        # Post 4: Building ChatGPT-Style App with Next.js and Ollama (AI)
        post4 = Post.create(
            id=1004,
            title="Building a ChatGPT-Style Chat App with Next.js and Ollama",
            summary="Learn how to build a fully functional AI chat application using Next.js 14, Ollama for local LLM inference, and modern React patterns. Includes streaming responses, chat history, and a beautiful UI—all running locally on your machine.",
            body="""
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
                  &lt;h2 className="text-3xl mb-2"&gt;👋&lt;/h2&gt;
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

<p><strong>Key React features:</strong></p>
<ul>
    <li><code>"use client"</code> - Marks this as a Client Component for interactivity</li>
    <li><code>useChat()</code> - Hook from Vercel AI SDK that manages messages, input state, and streaming</li>
    <li><code>&lt;Markdown&gt;</code> - Renders AI responses with proper formatting (bold, lists, code blocks)</li>
    <li>Responsive design using Tailwind CSS with a dark theme</li>
</ul>

<h3>Step 6: Run Your Application</h3>
<p>Make sure Ollama is running in the background, then start your dev server:</p>

<pre><code># In one terminal, ensure Ollama is running:
ollama serve

# In another terminal, start Next.js:
npm run dev</code></pre>

<p>Open your browser to <code>http://localhost:3000</code> and start chatting! 🎉</p>

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

<h3>Best Practices & Next Steps</h3>

<h4>Performance Optimization</h4>
<ul>
    <li><strong>Model selection:</strong> Smaller models like <code>gemma2</code> are faster; larger models like <code>llama3.1:70b</code> are more capable</li>
    <li><strong>GPU acceleration:</strong> Ollama automatically uses your GPU if available for faster inference</li>
    <li><strong>Streaming:</strong> Already implemented—users see responses immediately instead of waiting</li>
</ul>

<h4>Feature Enhancements</h4>
<ul>
    <li><strong>Chat history:</strong> Use localStorage or a database to persist conversations</li>
    <li><strong>Multiple conversations:</strong> Add a sidebar to switch between different chat threads</li>
    <li><strong>System prompts:</strong> Customize the AI's personality and behavior</li>
    <li><strong>Model switching:</strong> Let users choose which Ollama model to use</li>
    <li><strong>File uploads:</strong> Add support for analyzing images or documents</li>
    <li><strong>Export chats:</strong> Allow users to download conversations as markdown or PDF</li>
</ul>

<h4>Security Considerations</h4>
<ul>
    <li><strong>Rate limiting:</strong> Prevent abuse by limiting requests per user/IP</li>
    <li><strong>Input sanitization:</strong> Validate user input before sending to the model</li>
    <li><strong>Authentication:</strong> Add user accounts if deploying publicly</li>
    <li><strong>Content filtering:</strong> Consider implementing guardrails for inappropriate content</li>
</ul>

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

<p><strong>Issue: Model not found</strong></p>
<ul>
    <li>Solution: Download the model first: <code>ollama pull llama3.1</code></li>
</ul>

<h3>Deployment Options</h3>

<p>While this runs locally, you can deploy it for personal or team use:</p>
<ul>
    <li><strong>Docker:</strong> Containerize both Next.js and Ollama for consistent deployment</li>
    <li><strong>Self-hosted server:</strong> Run on a dedicated machine with a powerful GPU</li>
    <li><strong>Vercel + Ollama server:</strong> Deploy Next.js to Vercel, connect to your own Ollama instance</li>
</ul>

<h3>Conclusion</h3>

<p>Congratulations! You've built a fully functional ChatGPT-style application that runs entirely on your infrastructure. You now have:</p>

<ul>
    <li>✅ A beautiful, responsive chat interface</li>
    <li>✅ Real-time streaming AI responses</li>
    <li>✅ Complete data privacy (everything runs locally)</li>
    <li>✅ No API costs or usage limits</li>
    <li>✅ Production-ready TypeScript codebase</li>
</ul>

<p>The combination of Next.js and Ollama gives you the power to build AI applications without compromising on privacy or breaking the bank. Whether you're building a personal assistant, a customer support bot, or a creative writing tool, you now have the foundation to create it.</p>

<p><strong>Ready to level up?</strong> Explore the <a href="https://ollama.com/library">Ollama model library</a> to try different models, and check out the <a href="https://sdk.vercel.ai/">Vercel AI SDK documentation</a> for advanced features like tool calling, multimodal inputs, and more!</p>
""",
            tags="nextjs,ollama,ai,chatgpt,react,llm,streaming,typescript",
            category="ai",
            author=author,
            created_at=datetime.now() - timedelta(hours=2)
        )
        print(f"✓ Created post 4: {post4.title}")

        # Post 5: Building GBA Games with Butano and Aseprite (Game Dev)
        post5 = Post.create(
            id=1005,
            title="Building Game Boy Advance Games with Butano and Aseprite",
            summary="Learn how to create your own Game Boy Advance games in 2025 using the modern Butano C++ engine and Aseprite for pixel art. Complete guide covering setup, sprite creation, physics systems, and deploying to real GBA hardware.",
            body="""
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
    <li><strong>Debugging tools:</strong> Profiler, logger, and memory viewer included</li>
    <li><strong>Cross-platform:</strong> Develop on Windows, macOS, or Linux</li>
</ul>

<h3>Games Built with Butano</h3>
<p>Butano powers real commercial and hobby games:</p>
<ul>
    <li>Varooom 3D - Full 3D racing game</li>
    <li>Demons of Asteborg DX - Commercial platformer</li>
    <li>GBA Microjam '23 collection - 40+ game jam entries</li>
    <li>Hundreds of homebrew projects on gbadev.net</li>
</ul>

<h2>GBA Hardware Specifications</h2>
<p>Understanding the GBA's capabilities helps you design better games. Here are the key specs:</p>

<h3>Display</h3>
<ul>
    <li><strong>Resolution:</strong> 240×160 pixels (3:2 aspect ratio)</li>
    <li><strong>Colors:</strong> 15-bit RGB (32,768 total colors, 512 on-screen simultaneously)</li>
    <li><strong>Refresh rate:</strong> 60 Hz (~16.7ms per frame)</li>
    <li><strong>No backlight:</strong> Original GBA models required external lighting</li>
</ul>

<h3>Sprite System</h3>
<ul>
    <li><strong>Max sprites:</strong> 128 simultaneous sprite objects</li>
    <li><strong>Sizes:</strong> 8×8, 16×16, 32×32, 64×64, plus rectangular variants</li>
    <li><strong>Scanline limit:</strong> ~960 sprite pixels per horizontal line (avoid sprite stacking)</li>
    <li><strong>Tile-based:</strong> All graphics use 8×8 pixel tiles as building blocks</li>
    <li><strong>Color modes:</strong> 16-color (4bpp) or 256-color (8bpp) palettes</li>
</ul>

<h3>Memory Constraints</h3>
<ul>
    <li><strong>VRAM:</strong> 96 KB (64 KB backgrounds, 32 KB sprites)</li>
    <li><strong>Palette RAM:</strong> 1 KB (512 color slots total)</li>
    <li><strong>No floating-point:</strong> Use fixed-point math for physics and movement</li>
</ul>

<h2>Development Environment Setup</h2>
<p>Let's set up your GBA development environment. You have two toolchain options—both work great with Butano.</p>

<h3>Option 1: Wonderful Toolchain (Recommended for Beginners)</h3>
<p>Wonderful Toolchain is a modern, easy-to-install alternative to devkitPro with better cross-platform support.</p>

<h4>Installation (Linux/macOS)</h4>
<pre><code># Download and install
curl -L https://wonderful.asie.pl/bootstrap/wf-pacman -o /tmp/wf-pacman
chmod +x /tmp/wf-pacman
/tmp/wf-pacman

# Set up environment
source ~/.wonderful/env/wf.sh

# Install GBA toolchain
wf-pacman -Syu
wf-pacman -S target-gba wf-tools

# Add to your shell profile (~/.bashrc or ~/.zshrc)
echo 'export WONDERFUL_TOOLCHAIN="$HOME/.wonderful"' &gt;&gt; ~/.bashrc
echo 'source "$WONDERFUL_TOOLCHAIN/env/wf.sh"' &gt;&gt; ~/.bashrc
source ~/.bashrc

# Verify installation
arm-none-eabi-g++ --version</code></pre>

<h3>Option 2: devkitPro/devkitARM (Industry Standard)</h3>
<p>The traditional toolchain used by most GBA developers. More mature but slightly more complex to set up.</p>

<pre><code># Follow platform-specific instructions at:
# https://devkitpro.org/wiki/Getting_Started

# After installation, verify:
echo $DEVKITARM
arm-none-eabi-g++ --version</code></pre>

<h3>Install Additional Tools</h3>
<pre><code># Python (required for Butano asset conversion)
sudo apt install python3        # Debian/Ubuntu
sudo pacman -S python           # Arch Linux
brew install python             # macOS

# GBA emulator (mGBA recommended)
sudo apt install mgba-qt        # Debian/Ubuntu
sudo pacman -S mgba-qt          # Arch Linux
brew install mgba               # macOS
# or download from https://mgba.io

# Git (for cloning Butano)
sudo apt install git            # Debian/Ubuntu
sudo pacman -S git              # Arch Linux
brew install git                # macOS</code></pre>

<h3>Get Butano Engine</h3>
<pre><code># Clone Butano repository
cd ~/Documents/code_projects
git clone https://github.com/GValiente/butano.git
cd butano

# Explore the examples
ls examples/</code></pre>

<h2>Creating Sprites with Aseprite</h2>
<p>Aseprite is the perfect tool for creating GBA sprites. Its indexed color mode, frame tagging, and sprite sheet export align perfectly with GBA requirements.</p>

<h3>Setting Up Your Canvas</h3>
<ol>
    <li>Open Aseprite and create a new file: <strong>File → New</strong></li>
    <li>Configure settings:
        <ul>
            <li><strong>Width/Height:</strong> 16×16 (or 32×32 for larger sprites)</li>
            <li><strong>Color Mode:</strong> Indexed (critical for GBA!)</li>
            <li><strong>Palette:</strong> Start with a GBA-compatible palette</li>
        </ul>
    </li>
</ol>

<h3>GBA Color Palette Guidelines</h3>
<ul>
    <li><strong>15-bit color:</strong> GBA uses 5 bits per channel (32 levels of R, G, B)</li>
    <li><strong>First color = transparent:</strong> Index 0 in your palette won't render</li>
    <li><strong>16 colors for 4bpp:</strong> More memory-efficient (recommended)</li>
    <li><strong>256 colors for 8bpp:</strong> More colors but uses 2× memory</li>
</ul>

<p><strong>Pro tip:</strong> Download GBA-optimized palettes from <a href="https://lospec.com/palette-list/tag/gba">Lospec</a> for authentic retro aesthetics.</p>

<h3>Creating Your First Sprite</h3>
<ol>
    <li>Draw your character using the indexed palette</li>
    <li>Use layers for organization (merged on export)</li>
    <li>Create animation frames if needed (right-click frame timeline)</li>
    <li>Tag animation sequences (e.g., "walk", "jump", "idle")</li>
</ol>

<h3>Exporting for Butano</h3>
<p>Butano requires <strong>BMP files</strong> in indexed color mode. Here's how to export correctly:</p>

<ol>
    <li>Go to <strong>File → Export Sprite Sheet</strong></li>
    <li>Configure export settings:
        <ul>
            <li><strong>Format:</strong> BMP</li>
            <li><strong>Color Mode:</strong> Indexed (8-bit or 4-bit depending on palette size)</li>
            <li><strong>Trim:</strong> Disabled</li>
            <li><strong>Padding:</strong> None</li>
            <li><strong>Color space:</strong> Do NOT include color space information</li>
        </ul>
    </li>
    <li>Save with lowercase filename: <code>player.bmp</code></li>
</ol>

<h3>Important Aseprite Tips</h3>
<ul>
    <li>Keep dimensions as multiples of 8 (GBA uses 8×8 tiles)</li>
    <li>Export uncompressed BMP only (no PNG or JPEG)</li>
    <li>First color in palette must be your transparent color</li>
    <li>Limit palette to ≤16 colors for better performance</li>
</ul>

<h2>Building Your First GBA Game</h2>
<p>Let's create a simple game from scratch using Butano. This will get you from zero to a playable ROM in minutes.</p>

<h3>Step 1: Create Project from Template</h3>
<pre><code># Copy Butano template to new project
cp -r ~/Documents/code_projects/butano/template ~/Documents/code_projects/my-gba-game
cd ~/Documents/code_projects/my-gba-game

# Open in your text editor
code .</code></pre>

<h3>Step 2: Configure Your Project</h3>
<p>Edit the <code>Makefile</code> to set up your project:</p>

<pre><code># Find these lines and update them:
LIBBUTANO := ../butano/butano
TARGET := mygame
ROMTITLE := MY GAME</code></pre>

<h3>Step 3: Create Your First Sprite Asset</h3>
<p>Create the graphics directory and add your sprite:</p>

<pre><code>mkdir -p graphics</code></pre>

<p>Using Aseprite, create a 16×16 sprite of a player character (use indexed color, ≤16 colors) and export as <code>graphics/player.bmp</code>.</p>

<p>Create <code>graphics/player.json</code> to tell Butano how to process it:</p>

<pre><code>{
    "type": "sprite"
}</code></pre>

<p><strong>That's it!</strong> Butano's build system auto-generates C++ headers from your BMP+JSON files.</p>

<h3>Step 4: Write Game Code</h3>
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
}
</code></pre>

<h3>Step 5: Build and Run</h3>
<pre><code># Build the ROM (use -j for parallel compilation)
make -j8

# Run in emulator
mgba-qt mygame.gba

# Or drag mygame.gba into your emulator</code></pre>

<p><strong>Congratulations!</strong> You've just built your first GBA game. Use the D-Pad to move your sprite around!</p>

<h2>Advanced Butano Techniques</h2>
<p>Once you've mastered the basics, these patterns will help you build more sophisticated games.</p>

<h3>Physics System with Fixed-Point Math</h3>
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
constexpr bn::fixed MOVE_SPEED = bn::fixed(2);

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
}

void handle_input(Player&amp; player) {
    // Horizontal movement
    if(bn::keypad::left_held()) {
        player.velocity.set_x(-MOVE_SPEED);
    } else if(bn::keypad::right_held()) {
        player.velocity.set_x(MOVE_SPEED);
    } else {
        player.velocity.set_x(0);
    }

    // Jump
    if(bn::keypad::a_pressed() &amp;&amp; player.on_ground) {
        player.velocity.set_y(JUMP_FORCE);
        player.on_ground = false;
    }
}

// In main loop:
while(true) {
    handle_input(player);
    update_physics(player);
    sprite.set_position(player.position);
    bn::core::update();
}</code></pre>

<h3>Sprite Animation</h3>
<p>Butano makes sprite animation simple with its actions system:</p>

<pre><code>#include "bn_sprite_animate_actions.h"

// Assuming ninja.bmp is 64×16 (4 frames of 16×16)
bn::sprite_ptr ninja = bn::sprite_items::ninja.create_sprite(0, 0);

// Create animation: cycle through frames 0,1,2,3
// 16 = frames to wait per animation frame (slower = higher number)
bn::sprite_animate_action&lt;4&gt; animation =
    bn::create_sprite_animate_action_forever(
        ninja, 16,
        bn::sprite_items::ninja.tiles_item(),
        0, 1, 2, 3
    );

while(true) {
    animation.update();  // Advance animation
    bn::core::update();
}</code></pre>

<h3>Backgrounds and Scrolling</h3>
<p>Add backgrounds to create depth and atmosphere:</p>

<pre><code>#include "bn_regular_bg_ptr.h"
#include "bn_regular_bg_items_sky.h"

// Create background (sky.bmp must be at least 256×256)
bn::regular_bg_ptr bg = bn::regular_bg_items::sky.create_bg(0, 0);

// Set priority (0=front, 3=back)
bg.set_priority(3);

// Scrolling background in game loop
while(true) {
    bg.set_x(bg.x() + 1);  // Scroll right
    if(bg.x() &gt; 256) bg.set_x(0);  // Loop
    bn::core::update();
}</code></pre>

<h3>Sprite Actions (Tweening)</h3>
<p>Create smooth movements without manual interpolation:</p>

<pre><code>#include "bn_sprite_move_actions.h"
#include "bn_sprite_rotate_actions.h"

bn::sprite_ptr coin = bn::sprite_items::coin.create_sprite(100, 50);

// Move coin to (0, 0) over 60 frames (1 second)
bn::sprite_move_to_action move(coin, 60, 0, 0);

// Rotate continuously
bn::sprite_rotate_loop_action rotate(coin, 120, 360);

while(true) {
    if(!move.done()) move.update();
    rotate.update();
    bn::core::update();
}</code></pre>

<h2>Asset Pipeline Deep Dive</h2>
<p>Understanding Butano's asset system helps you manage graphics, audio, and data efficiently.</p>

<h3>Graphics JSON Configuration</h3>
<p>Every BMP file needs a matching JSON file. Here are common configurations:</p>

<h4>Simple Sprite</h4>
<p><code>graphics/enemy.json</code>:</p>
<pre><code>{
    "type": "sprite"
}</code></pre>

<h4>Sprite with Multiple Frames</h4>
<p><code>graphics/explosion.json</code> (explosion.bmp is 64×16 = 4 frames of 16×16):</p>
<pre><code>{
    "type": "sprite",
    "height": 16
}</code></pre>

<h4>Optimized 16-Color Sprite</h4>
<p><code>graphics/particle.json</code>:</p>
<pre><code>{
    "type": "sprite",
    "bpp_mode": "bpp_4",
    "compression": "auto"
}</code></pre>

<h4>Regular Background</h4>
<p><code>graphics/level_bg.json</code> (level_bg.bmp must be ≥256×256):</p>
<pre><code>{
    "type": "regular_bg"
}</code></pre>

<h3>Using Assets in Code</h3>
<p>Butano auto-generates headers during build. If you have <code>graphics/player.bmp</code>, you get:</p>

<pre><code>#include "bn_sprite_items_player.h"

// Access the generated item
bn::sprite_items::player.create_sprite(x, y);
bn::sprite_items::player.tiles_item();
bn::sprite_items::player.palette_item();</code></pre>

<h2>Best Practices and Performance Tips</h2>

<h3>Graphics Optimization</h3>
<ul>
    <li><strong>Use 4bpp when possible:</strong> 16-color sprites use half the VRAM of 256-color</li>
    <li><strong>Share palettes:</strong> Multiple sprites with same palette save memory</li>
    <li><strong>Respect scanline limits:</strong> Don't stack too many sprites horizontally</li>
    <li><strong>Tile alignment:</strong> Organize sprite sheets in 8×8 grids for optimal compression</li>
</ul>

<h3>Code Performance</h3>
<ul>
    <li><strong>Use bn::fixed, not float:</strong> Fixed-point math is 10× faster than software float</li>
    <li><strong>Avoid heap allocation:</strong> Stack-only allocation prevents fragmentation</li>
    <li><strong>Leverage actions:</strong> Built-in actions are heavily optimized</li>
    <li><strong>Profile your code:</strong> Use <code>bn::profiler</code> to find bottlenecks</li>
</ul>

<h3>Project Organization</h3>
<pre><code>my-gba-game/
├── src/              # C++ source files
│   ├── main.cpp
│   └── player.cpp
├── include/          # Header files
│   └── player.h
├── graphics/         # BMP + JSON files
│   ├── player.bmp
│   ├── player.json
│   ├── enemy.bmp
│   └── enemy.json
├── audio/            # Music and sound effects
│   ├── bgm.wav
│   └── jump.wav
├── Makefile          # Build configuration
└── butano/           # Engine (as git submodule)</code></pre>

<h2>Common Issues and Solutions</h2>

<h3>Problem: "DEVKITARM not found" or "WONDERFUL_TOOLCHAIN not found"</h3>
<p><strong>Solution:</strong> Source your environment file or restart your terminal after installation:</p>
<pre><code>source ~/.bashrc
# or
source ~/.wonderful/env/wf.sh</code></pre>

<h3>Problem: Sprite not showing</h3>
<p><strong>Solutions:</strong></p>
<ul>
    <li>Ensure BMP is indexed color (not RGB)</li>
    <li>Verify .json file exists with correct name</li>
    <li>Check sprite is within screen bounds (-120 to 120, -80 to 80)</li>
    <li>First color in palette is transparent—use color index 1+ for visible pixels</li>
</ul>

<h3>Problem: Build takes forever</h3>
<p><strong>Solution:</strong> Use parallel compilation with make -j flag:</p>
<pre><code>make -j8  # Use 8 cores (adjust to your CPU)</code></pre>

<h3>Problem: Colors look wrong</h3>
<p><strong>Solutions:</strong></p>
<ul>
    <li>Use 15-bit GBA palette (5 bits per RGB channel)</li>
    <li>Export BMP as indexed color without color space info</li>
    <li>Download GBA-optimized palettes from Lospec</li>
</ul>

<h2>Resources and Community</h2>

<h3>Official Documentation</h3>
<ul>
    <li><strong>Butano Docs:</strong> <a href="https://gvaliente.github.io/butano/">gvaliente.github.io/butano</a></li>
    <li><strong>Butano GitHub:</strong> <a href="https://github.com/GValiente/butano">github.com/GValiente/butano</a></li>
    <li><strong>Examples:</strong> Check <code>butano/examples/</code> for 30+ sample projects</li>
</ul>

<h3>GBA Development Resources</h3>
<ul>
    <li><strong>Tonc Tutorial:</strong> <a href="https://www.coranac.com/tonc/text/toc.htm">coranac.com/tonc</a> - Comprehensive GBA programming guide</li>
    <li><strong>GBATEK:</strong> <a href="https://problemkaputt.de/gbatek.htm">problemkaputt.de/gbatek.htm</a> - Complete hardware reference</li>
    <li><strong>GBA Architecture:</strong> <a href="https://www.copetti.org/writings/consoles/game-boy-advance/">copetti.org/writings/consoles/game-boy-advance</a></li>
    <li><strong>gbadev.net:</strong> Community hub with tutorials and downloads</li>
</ul>

<h3>Tools</h3>
<ul>
    <li><strong>Aseprite:</strong> <a href="https://www.aseprite.org/">aseprite.org</a> - Best pixel art editor for GBA</li>
    <li><strong>mGBA:</strong> <a href="https://mgba.io/">mgba.io</a> - Most accurate GBA emulator</li>
    <li><strong>Wonderful Toolchain:</strong> <a href="https://wonderful.asie.pl/">wonderful.asie.pl</a></li>
    <li><strong>devkitPro:</strong> <a href="https://devkitpro.org/">devkitpro.org</a></li>
</ul>

<h3>Community</h3>
<ul>
    <li><strong>gbadev Discord:</strong> <a href="https://discord.gg/ctGSNxRkg2">discord.gg/ctGSNxRkg2</a> - Active community with thousands of developers</li>
    <li><strong>gbadev Forums:</strong> <a href="https://forum.gbadev.net">forum.gbadev.net</a></li>
    <li><strong>r/gbadev:</strong> Reddit community for GBA homebrew</li>
</ul>

<h2>Deploying to Real Hardware</h2>
<p>The ultimate thrill is playing your game on an actual Game Boy Advance!</p>

<h3>Flash Carts</h3>
<p>Flash cartridges let you load ROMs onto real GBA hardware:</p>
<ul>
    <li><strong>EZ-Flash Omega Definitive Edition:</strong> Modern, affordable, excellent compatibility</li>
    <li><strong>Everdrive GBA X5:</strong> Premium option with save state support</li>
    <li><strong>EZ-Flash Junior:</strong> Budget-friendly for original Game Boy/GBC/GBA</li>
</ul>

<h3>Loading Your ROM</h3>
<ol>
    <li>Copy your <code>.gba</code> file to the flash cart's SD card</li>
    <li>Insert cart into GBA/GBA SP/DS/DS Lite</li>
    <li>Power on and select your game</li>
    <li>Experience your creation on real hardware!</li>
</ol>

<h2>Next Steps and Game Ideas</h2>

<h3>Beginner Projects</h3>
<ul>
    <li><strong>Pong clone:</strong> Learn sprite movement and collision</li>
    <li><strong>Snake game:</strong> Practice grid-based movement and data structures</li>
    <li><strong>Flappy Bird clone:</strong> Implement physics and scrolling backgrounds</li>
    <li><strong>Top-down adventure:</strong> Create tile-based maps and character movement</li>
</ul>

<h3>Intermediate Projects</h3>
<ul>
    <li><strong>Platformer:</strong> Advanced physics, level design, power-ups</li>
    <li><strong>Puzzle game:</strong> Grid systems, match logic, particle effects</li>
    <li><strong>Shmup (shoot 'em up):</strong> Bullet patterns, enemy AI, power-up systems</li>
    <li><strong>RPG battle system:</strong> Turn-based combat, menu systems, animations</li>
</ul>

<h3>Advanced Challenges</h3>
<ul>
    <li><strong>Mode 7 racer:</strong> Pseudo-3D using affine backgrounds</li>
    <li><strong>Metroidvania:</strong> Large interconnected maps with save system</li>
    <li><strong>Rhythm game:</strong> Audio synchronization and timing mechanics</li>
    <li><strong>Multiplayer game:</strong> Link cable communication between GBAs</li>
</ul>

<h2>Conclusion</h2>

<p>You now have everything you need to create Game Boy Advance games in 2025! From setting up your development environment with Butano and the Wonderful Toolchain, to creating pixel-perfect sprites in Aseprite, to implementing physics and gameplay—you're ready to build.</p>

<p>The GBA development community is welcoming, active, and excited to see what you create. Whether you're building for nostalgia, learning low-level programming, or just having fun making retro games, you're part of a thriving homebrew scene.</p>

<p><strong>Your next steps:</strong></p>
<ol>
    <li>Install the toolchain and Butano</li>
    <li>Create your first sprite in Aseprite</li>
    <li>Build and run the example code above</li>
    <li>Join the gbadev Discord to share your progress</li>
    <li>Start your first game project!</li>
</ol>

<p>The Game Boy Advance is waiting for your creativity. <strong>Happy coding, and welcome to the world of GBA homebrew!</strong></p>
""",
            tags="butano,gba,gameboy-advance,aseprite,retro-gaming,game-development,homebrew,pixel-art",
            category="game-dev",
            author=author,
            created_at=datetime.now() - timedelta(hours=6)
        )
        print(f"✓ Created post 5: {post5.title}")

        # Post 6: Getting Started with Stack-It (Documentation)
        post6 = Post.create(
            id=1006,
            title="Getting Started with Stack-It: Your Complete Guide",
            summary="A comprehensive guide to using Stack-It - learn how to create an account, share technical content, organize posts by categories, bookmark favorites, and collaborate with the developer community.",
            body="""
<h2>Welcome to Stack-It!</h2>
<p>Stack-It is your go-to platform for discovering, sharing, and managing technical content. Whether you're looking for the latest code snippets, tutorials, or best practices for your favorite tech stacks, Stack-It provides a seamless, community-driven experience.</p>

<p><strong>Our Mission:</strong> Provide the most up-to-date code and documentation for popular technology stacks to give developers a seamless experience with cohesiveness in mind.</p>

<h2>What Can You Do with Stack-It?</h2>
<ul>
    <li>📚 <strong>Discover Content:</strong> Browse curated posts across Frontend, Backend, AI, Game Dev, and Documentation categories</li>
    <li>✍️ <strong>Share Knowledge:</strong> Create rich, formatted posts with code snippets, images, and detailed explanations</li>
    <li>⭐ <strong>Save Favorites:</strong> Bookmark posts you love for quick access later</li>
    <li>🏷️ <strong>Filter by Tags:</strong> Find exactly what you need with our powerful tagging system</li>
    <li>👥 <strong>Join the Community:</strong> Connect with developers and see who's online</li>
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

<p><strong>Security Note:</strong> Your password is securely hashed using industry-standard encryption. We never store passwords in plain text.</p>

<h4>Step 2: Log In to Your Account</h4>
<p>Already have an account? Logging in is simple:</p>
<ol>
    <li>Click the <strong>"Login"</strong> button in the navigation bar</li>
    <li>Enter your <strong>email</strong> and <strong>password</strong></li>
    <li>Click <strong>"Sign In"</strong></li>
    <li>Welcome back! You'll be redirected to your personalized dashboard</li>
</ol>

<h4>Step 3: Explore Your Dashboard</h4>
<p>Once logged in, you'll land on the Dashboard - your home base for discovering content. The dashboard features five organized tabs:</p>

<ul>
    <li>🎨 <strong>Frontend:</strong> Posts about React, Vue, Next.js, Tailwind CSS, TypeScript, and modern frontend development</li>
    <li>⚙️ <strong>Backend:</strong> Posts about Node.js, Express, Flask, databases, APIs, GraphQL, REST, and server-side development</li>
    <li>🤖 <strong>AI:</strong> Posts about AI/ML frameworks, LLMs, Ollama, ChatGPT integrations, and artificial intelligence</li>
    <li>🎮 <strong>Game Dev:</strong> Posts about game development, engines, tools like Butano, and retro gaming</li>
    <li>📄 <strong>Docs:</strong> Documentation, guides, tutorials, and "how-to" content (like this post!)</li>
</ul>

<p>Click any tab to browse posts in that category. Each post card shows:</p>
<ul>
    <li>Post title</li>
    <li>Short summary</li>
    <li>Tags for filtering</li>
    <li>Author information with avatar</li>
    <li>Creation date</li>
    <li>Favorite button (heart icon)</li>
</ul>

<h2>Creating Your First Post</h2>
<p>Ready to share your knowledge with the community? Here's how to create a post:</p>

<h4>Step 1: Navigate to Create Post</h4>
<p>Click the <strong>"Create Post"</strong> button in the navigation bar (visible when logged in).</p>

<h4>Step 2: Fill in Post Details</h4>

<h4>Title</h4>
<p>Give your post a clear, descriptive title that tells readers what they'll learn.</p>
<p><strong>Example:</strong> "Building a REST API with Flask and PostgreSQL"</p>

<h4>Summary</h4>
<p>Write a brief 1-2 sentence summary. This appears on post cards and helps users decide if they want to read more.</p>
<p><strong>Example:</strong> "Learn how to build a production-ready REST API using Flask, PostgreSQL, and best practices for authentication and error handling."</p>

<h4>Tags</h4>
<p>Add comma-separated tags to make your post discoverable. Use relevant keywords that describe the technologies, concepts, or topics covered.</p>
<p><strong>Example:</strong> <code>flask,python,rest-api,postgresql,backend,authentication</code></p>

<h4>Category</h4>
<p>Select the category that best fits your post:</p>
<ul>
    <li><strong>Frontend:</strong> Client-side development, UI frameworks, styling</li>
    <li><strong>Backend:</strong> Server-side development, databases, APIs</li>
    <li><strong>AI:</strong> Machine learning, AI tools, LLMs</li>
    <li><strong>Game Dev:</strong> Game development and related tools</li>
    <li><strong>Docs:</strong> Documentation, guides, getting started content</li>
</ul>

<h4>Body (Content)</h4>
<p>This is where you write the main content of your post. Stack-It provides a powerful rich text editor with extensive formatting options.</p>

<h4>Step 3: Use the Rich Text Editor</h4>
<p>Our editor gives you complete control over formatting:</p>

<h4>Text Formatting</h4>
<ul>
    <li><strong>Bold</strong> - Make text stand out</li>
    <li><em>Italic</em> - Add emphasis</li>
    <li><u>Underline</u> - Highlight important points</li>
    <li><s>Strikethrough</s> - Show deletions or corrections</li>
</ul>

<h4>Headings</h4>
<p>Organize your content with hierarchical headings:</p>
<ul>
    <li><strong>Heading 1 (H1):</strong> Main title (used sparingly)</li>
    <li><strong>Heading 2 (H2):</strong> Major sections</li>
    <li><strong>Heading 3 (H3):</strong> Subsections</li>
    <li><strong>Heading 4-6:</strong> Smaller subsections</li>
</ul>

<h4>Lists</h4>
<ul>
    <li>Unordered lists (bullet points) - Like this one!</li>
    <li>Ordered lists (numbered) - For step-by-step instructions</li>
    <li>Nested lists - Indent for hierarchy</li>
</ul>

<h4>Code</h4>
<p>Share code snippets in two ways:</p>
<ul>
    <li><strong>Inline code:</strong> Use for short snippets like <code>const myVar = 42;</code></li>
    <li><strong>Code blocks:</strong> Use for multi-line code</li>
</ul>

<pre><code>// Example code block
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet('Stack-It'));</code></pre>

<h4>Links and Images</h4>
<ul>
    <li><strong>Links:</strong> Add hyperlinks to external resources or documentation</li>
    <li><strong>Images:</strong> Insert images via URL to enhance your posts</li>
</ul>

<h4>Tables</h4>
<p>Create tables for structured data comparisons:</p>

<table border="1" cellpadding="8">
    <tr>
        <th>Feature</th>
        <th>Description</th>
    </tr>
    <tr>
        <td>Rich Text Editor</td>
        <td>Full formatting capabilities</td>
    </tr>
    <tr>
        <td>Code Blocks</td>
        <td>Syntax highlighting support</td>
    </tr>
</table>

<h4>Colors and Fonts</h4>
<ul>
    <li><strong>Text Color:</strong> Change text color for emphasis</li>
    <li><strong>Background Color:</strong> Highlight important text</li>
    <li><strong>Font Family:</strong> Choose different fonts</li>
</ul>

<h4>Alignment and Indentation</h4>
<ul>
    <li>Left, center, right, or justify text alignment</li>
    <li>Increase or decrease indentation</li>
</ul>

<h4>Step 4: Preview and Publish</h4>
<ol>
    <li>Review your content for accuracy and formatting</li>
    <li>Click the <strong>"Create Post"</strong> button at the bottom</li>
    <li>Your post will be published and you'll be redirected to your dashboard!</li>
</ol>

<p><strong>Pro Tip:</strong> All HTML content is automatically sanitized to prevent security issues while preserving your formatting.</p>

<h2>Managing Your Posts</h2>

<h4>Editing Posts</h4>
<p>Need to update a post? No problem:</p>
<ol>
    <li>Navigate to the post you want to edit</li>
    <li>Click the three-dot menu (⋯) in the top-right corner</li>
    <li>Select <strong>"Edit"</strong></li>
    <li>Make your changes in the editor</li>
    <li>Click <strong>"Save Changes"</strong></li>
</ol>

<p><strong>Who can edit:</strong> You can edit your own posts. Admins can edit any post.</p>

<h4>Deleting Posts</h4>
<p>To remove a post:</p>
<ol>
    <li>Navigate to the post</li>
    <li>Click the three-dot menu (⋯)</li>
    <li>Select <strong>"Delete"</strong></li>
    <li>Confirm the deletion</li>
</ol>

<p><strong>Who can delete:</strong> You can delete your own posts. Admins can delete any post.</p>

<h2>Using the Favorites System</h2>
<p>Found a post you love? Save it to your favorites for easy access!</p>

<h4>Adding to Favorites</h4>
<ol>
    <li>Find a post you want to save (on Dashboard, Community, or individual post page)</li>
    <li>Click the <strong>heart icon (♡)</strong> on the post card or post page</li>
    <li>The heart will fill in (♥) to show it's favorited</li>
    <li>The post is now saved to your favorites!</li>
</ol>

<h4>Viewing Your Favorites</h4>
<ol>
    <li>Click <strong>"Favorites"</strong> in the navigation bar</li>
    <li>Browse all your saved posts in one place</li>
    <li>Filter favorites by tags using the tag buttons</li>
    <li>Click any post to read it</li>
</ol>

<h4>Removing from Favorites</h4>
<p>Changed your mind? Simply click the filled heart icon (♥) again to unfavorite the post.</p>

<h2>Exploring the Community</h2>

<h4>Community Page</h4>
<p>The Community page shows all posts from all categories in one feed:</p>
<ol>
    <li>Click <strong>"Community"</strong> in the navigation bar</li>
    <li>Browse posts from all categories</li>
    <li>Use pagination to navigate through pages (12 posts per page)</li>
    <li>Filter by specific tags using tag buttons</li>
</ol>

<h4>Filtering by Tags</h4>
<p>Tags help you find exactly what you're looking for:</p>
<ul>
    <li>Click any tag on a post card to filter by that tag</li>
    <li>See all posts with the selected tag</li>
    <li>Click <strong>"Clear Filters"</strong> or the tag again to show all posts</li>
</ul>

<h4>Author Information</h4>
<p>Each post displays the author's information:</p>
<ul>
    <li><strong>Avatar:</strong> Profile photo (default or custom-uploaded)</li>
    <li><strong>Username:</strong> The author's display name</li>
    <li><strong>Online Status:</strong> Green dot indicates the author is currently online (active within the last 5 minutes)</li>
</ul>

<h2>Customizing Your Profile</h2>

<h4>Profile Settings</h4>
<p>Make your profile unique:</p>
<ol>
    <li>Click <strong>"Settings"</strong> in the navigation bar</li>
    <li>Upload a custom profile photo:
        <ul>
            <li>Click <strong>"Choose File"</strong></li>
            <li>Select a PNG, JPG, JPEG, GIF, or WebP image (max 4MB)</li>
            <li>Click <strong>"Upload"</strong></li>
        </ul>
    </li>
    <li>Your new avatar will appear throughout the site!</li>
</ol>

<h4>Online Status</h4>
<p>Your online status is automatically managed:</p>
<ul>
    <li>You're shown as online when active within the last 5 minutes</li>
    <li>A green dot appears next to your avatar when you're online</li>
    <li>Other users can see when you're available</li>
</ul>

<h2>Tips and Best Practices</h2>

<h4>Writing Great Posts</h4>
<ul>
    <li><strong>Clear Titles:</strong> Use descriptive, specific titles that tell readers what they'll learn</li>
    <li><strong>Good Summaries:</strong> Write compelling 1-2 sentence summaries</li>
    <li><strong>Structure Content:</strong> Use headings, lists, and paragraphs to organize information</li>
    <li><strong>Code Examples:</strong> Include practical, working code snippets</li>
    <li><strong>Relevant Tags:</strong> Add 5-10 specific tags for discoverability</li>
    <li><strong>Proofread:</strong> Check for typos and formatting issues before publishing</li>
</ul>

<h4>Using Tags Effectively</h4>
<ul>
    <li>Use lowercase for consistency: <code>react</code> not <code>React</code></li>
    <li>Be specific: <code>react-hooks</code> is better than just <code>react</code></li>
    <li>Include technology names: <code>python</code>, <code>javascript</code>, <code>flask</code></li>
    <li>Add concept tags: <code>authentication</code>, <code>performance</code>, <code>best-practices</code></li>
    <li>Separate with commas: <code>react,hooks,typescript,frontend</code></li>
</ul>

<h4>Choosing the Right Category</h4>
<ul>
    <li><strong>Frontend:</strong> If it runs in the browser or relates to UI/UX</li>
    <li><strong>Backend:</strong> If it runs on the server, database, or API-related</li>
    <li><strong>AI:</strong> If it involves machine learning, LLMs, or AI tools</li>
    <li><strong>Game Dev:</strong> If it's about building games or game engines</li>
    <li><strong>Docs:</strong> If it's a guide, tutorial, or documentation</li>
</ul>

<h4>Building Your Favorites Collection</h4>
<ul>
    <li>Favorite posts you want to reference later</li>
    <li>Create a personal knowledge base of useful content</li>
    <li>Use tag filtering to organize your favorites by topic</li>
    <li>Revisit favorited posts when working on similar projects</li>
</ul>

<h2>Welcome to the Community!</h2>

<p>Stack-It is built by developers, for developers. Whether you're here to learn, share, or both, we're excited to have you as part of our community.</p>

<p><strong>Happy coding, and welcome to Stack-It!</strong> 🚀</p>

<p><em>Last updated: November 2025</em></p>
""",
            tags="documentation,getting-started,guide,tutorial,stack-it,help,introduction",
            category="docs",
            author=author,
            created_at=datetime.now() - timedelta(days=3)
        )
        print(f"✓ Created post 6: {post6.title}")

        print(f"\n✅ Successfully seeded {Post.select().count()} posts!")
        print("\n📊 Created posts:")
        print(f"   • Post 1001 (Frontend): {post1.title}")
        print(f"   • Post 1002 (Frontend): {post2.title}")
        print(f"   • Post 1003 (Backend): {post3.title}")
        print(f"   • Post 1004 (AI): {post4.title}")
        print(f"   • Post 1005 (Game Dev): {post5.title}")
        print(f"   • Post 1006 (Docs): {post6.title}")

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        # Close database connection
        if not db.is_closed():
            db.close()
            print("\n✓ Database connection closed")


if __name__ == "__main__":
    print("=" * 60)
    print("  Stack-It Database Seeder")
    print("=" * 60)
    seed_posts()
    print("=" * 60)
