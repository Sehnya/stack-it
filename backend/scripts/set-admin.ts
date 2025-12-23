import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function setAdmin() {
  const email = "sehnyaw@gmail.com";
  
  // Check if user exists
  const result = await client.execute({
    sql: "SELECT id, username, role FROM users WHERE email = ?",
    args: [email],
  });

  if (result.rows.length === 0) {
    console.log(`User with email ${email} not found. They need to register first.`);
    return;
  }

  const user = result.rows[0];
  console.log(`Found user: ${user.username} (current role: ${user.role})`);

  // Update to admin
  await client.execute({
    sql: "UPDATE users SET role = 'admin' WHERE email = ?",
    args: [email],
  });

  console.log(`✓ Updated ${user.username} to admin role`);
}

setAdmin().catch(console.error);
