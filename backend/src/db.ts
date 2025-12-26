import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { resolve } from "path";
import { log } from "./lib/logger";

// Get the correct path to the database
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

log.db.info("Database configuration", {
  tursoUrlSet: !!tursoUrl,
  tursoTokenSet: !!tursoToken,
});

let db: PrismaClient;

if (tursoUrl && tursoToken) {
  log.db.info("Connecting to Turso", { url: tursoUrl.substring(0, 50) + "..." });
  
  const libsql = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  const adapter = new PrismaLibSQL(libsql);
  db = new PrismaClient({ adapter }) as unknown as PrismaClient;
} else {
  // Local SQLite fallback - convert relative path to absolute for libsql
  const dbPath = resolve(process.cwd(), "prisma/dev.db");
  const localPath = `file:${dbPath}`;
  log.db.info("Using local SQLite", { path: localPath });

  const libsql = createClient({
    url: localPath,
  });

  const adapter = new PrismaLibSQL(libsql);
  db = new PrismaClient({ adapter }) as unknown as PrismaClient;
}

export { db };

export async function testConnection() {
  try {
    await db.$connect();
    log.db.info("Database connection successful");
    return true;
  } catch (error) {
    log.db.error("Database connection failed", {}, error as Error);
    return false;
  }
}
