import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkPosts() {
  const result = await client.execute("SELECT id, title, author_id FROM posts");
  console.log(`Found ${result.rows.length} posts:`);
  result.rows.forEach((row) => {
    console.log(`  - [${row.id}] ${row.title} (author: ${row.author_id})`);
  });

  const users = await client.execute("SELECT id, username, role FROM users");
  console.log(`\nFound ${users.rows.length} users:`);
  users.rows.forEach((row) => {
    console.log(`  - [${row.id}] ${row.username} (${row.role})`);
  });
}

checkPosts().catch(console.error);
