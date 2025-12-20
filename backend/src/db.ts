import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { resolve } from "path";

// Get the correct path to the database
const dbPath = process.env.TURSO_DATABASE_URL || 
  `file:${resolve(import.meta.dir, "../prisma/dev.db")}`;

const libsql = createClient({
  url: dbPath,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);

export const db = new PrismaClient({ adapter });

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
