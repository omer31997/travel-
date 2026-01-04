import * as schema from "@shared/schema";
import pg from "pg";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";

// Support both Postgres (production) and SQLite (local dev fallback)

function initDb() {
  if (process.env.DATABASE_URL) {
    // Postgres
    const { Pool } = pg;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzlePostgres(pool, { schema });
    console.log("Using Postgres database from DATABASE_URL");
    return { db, pool };
  } else {
    // SQLite fallback for local development (no external DB required)
    const sqliteDb = new Database("dev.db");
    const db = drizzleSqlite(sqliteDb, { schema });
    console.log("No DATABASE_URL detected — using local SQLite database at dev.db");
    return { db, pool: undefined };
  }
}

export const { db, pool } = initDb();
