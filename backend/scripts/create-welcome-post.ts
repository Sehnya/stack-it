import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function createWelcomePost() {
  // Get admin user
  const adminResult = await client.execute(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  );
  
  if (adminResult.rows.length === 0) {
    console.log("No admin user found!");
    return;
  }

  const authorId = adminResult.rows[0].id;

  const title = "Welcome to Stack-it!";
  const excerpt = "Your new home for sharing tech stacks, code snippets, and connecting with developers worldwide.";
  const content = `
<h2>Welcome to Stack-it!</h2>

<p>We're excited to have you here. Stack-it is a platform built by developers, for developers.</p>

<h3>What can you do here?</h3>

<ul>
  <li><strong>Share your tech stacks</strong> - Show off the tools and technologies you use</li>
  <li><strong>Post code snippets</strong> - Share useful code with syntax highlighting</li>
  <li><strong>Connect with developers</strong> - Follow others and build your network</li>
  <li><strong>Discover new tools</strong> - See what technologies are trending</li>
</ul>

<h3>Getting Started</h3>

<p>Click the <strong>"Share Stack"</strong> button in the sidebar to create your first post. Add a title, description, and tag it with the technologies you're using.</p>

<blockquote>
  <p>"The best way to learn is to build and share." - Every developer ever</p>
</blockquote>

<p>Happy coding!</p>
`;

  const technologies = JSON.stringify(["React", "TypeScript", "Bun", "Elysia", "Turso"]);

  await client.execute({
    sql: `INSERT INTO posts (title, excerpt, content, technologies, author_id, view_count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))`,
    args: [title, excerpt, content, technologies, authorId],
  });

  console.log("✓ Welcome post created!");

  // Verify
  const posts = await client.execute("SELECT id, title FROM posts");
  console.log(`Total posts: ${posts.rows.length}`);
}

createWelcomePost().catch(console.error);
