import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function testConnection() {
    console.log("Testing connection to:", process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":****@")); // Hide password in log

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Often needed for Supabase from local
    });

    try {
        const client = await pool.connect();
        console.log("Successfully connected to the database!");
        const res = await client.query('SELECT NOW()');
        console.log("Current DB Time:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await pool.end();
    }
}

testConnection();
