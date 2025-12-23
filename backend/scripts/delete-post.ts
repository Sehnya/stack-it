import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function deletePost() {
  const postId = process.argv[2];
  
  if (!postId) {
    // List all posts
    const posts = await client.execute("SELECT id, title FROM posts");
    console.log("Posts:");
    posts.rows.forEach((row) => {
      console.log(`  [${row.id}] ${row.title}`);
    });
    console.log("\nUsage: bun run scripts/delete-post.ts <post_id>");
    return;
  }

  await client.execute({
    sql: "DELETE FROM posts WHERE id = ?",
    args: [parseInt(postId)],
  });

  console.log(`✓ Deleted post ${postId}`);
}

deletePost().catch(console.error);
