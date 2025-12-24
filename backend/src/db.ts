import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { resolve } from "path";

// Get the correct path to the database
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

console.log(`[DB] TURSO_DATABASE_URL set: ${!!tursoUrl}`);
console.log(`[DB] TURSO_AUTH_TOKEN set: ${!!tursoToken}`);

let db: PrismaClient;

if (tursoUrl && tursoToken) {
  console.log(`[DB] Connecting to Turso: ${tursoUrl.substring(0, 50)}...`);
  
  const libsql = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  const adapter = new PrismaLibSQL(libsql);
  db = new PrismaClient({ adapter });
} else {
  // Local SQLite fallback - convert relative path to absolute for libsql
  const dbPath = resolve(process.cwd(), "prisma/dev.db");
  const localPath = `file:${dbPath}`;
  console.log(`[DB] Using local SQLite: ${localPath}`);

  const libsql = createClient({
    url: localPath,
  });

  const adapter = new PrismaLibSQL(libsql);
  db = new PrismaClient({ adapter });
}

export { db };

export async function testConnection() {
  try {
    await db.$connect();
    console.log("✅ Database connection successful!");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}
