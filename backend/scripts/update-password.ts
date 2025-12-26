import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function updatePassword() {
  const email = "sehnyaw@gmail.com";
  const newPassword = "sehnya1";
  
  // Hash the password using Bun
  const hashedPassword = await Bun.password.hash(newPassword);
  
  try {
    const result = await client.execute({
      sql: "UPDATE users SET password = ? WHERE email = ?",
      args: [hashedPassword, email],
    });
    
    if (result.rowsAffected > 0) {
      console.log(`✅ Password updated for ${email}`);
    } else {
      console.log(`❌ User not found: ${email}`);
    }
  } catch (error) {
    console.error("Error updating password:", error);
  }
}

updatePassword();
