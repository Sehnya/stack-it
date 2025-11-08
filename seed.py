#!/usr/bin/env python3
"""
Seed script to populate the database with sample community posts.
Run this script with: python seed.py
"""

from db import db, Post, User
from datetime import datetime, timedelta
import sys


def seed_posts():
    """Create sample posts for the community page."""

    print("🌱 Starting database seeding...")

    # Connect to database
    db.connect()

    try:
        # Get the admin user (sallen20) to be the author
        try:
            author = User.get(User.username == 'sallen20')
            print(f"✓ Found author: {author.username} (ID: {author.id})")
        except User.DoesNotExist:
            print("❌ Error: User 'sallen20' not found. Please create a user first.")
            return

        # Check if posts already exist
        existing_posts = list(Post.select().where(Post.id.in_([1001, 1002, 1003])))
        if existing_posts:
            print(f"⚠️  Warning: {len(existing_posts)} post(s) with IDs 1001-1003 already exist.")
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

        print(f"\n✅ Successfully seeded {Post.select().count()} posts!")
        print("\n📊 Created posts:")
        print(f"   • Post 1001 (Frontend): {post1.title}")
        print(f"   • Post 1002 (Frontend): {post2.title}")
        print(f"   • Post 1003 (Backend): {post3.title}")

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
