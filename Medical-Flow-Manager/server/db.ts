import * as schema from "@shared/schema";

// Support both Postgres (production) and SQLite (local dev fallback)

if (process.env.DATABASE_URL) {
  // Postgres
  import pg from "pg";
  import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";

  const { Pool } = pg;
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzlePostgres(pool, { schema });
  console.log("Using Postgres database from DATABASE_URL");
} else {
  // SQLite fallback for local development (no external DB required)
  import Database from "better-sqlite3";
  import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";

  const sqliteDb = new Database("dev.db");
  export const db = drizzleSqlite(sqliteDb, { schema });
  console.log("No DATABASE_URL detected — using local SQLite database at dev.db");
}
