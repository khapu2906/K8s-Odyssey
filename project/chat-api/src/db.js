import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Compose starts the postgres container immediately, but Postgres itself
// takes a moment longer to accept connections — so the first few attempts
// here are expected to fail on a fresh `docker compose up`, not a bug.
export async function initSchema(retries = 10, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          message TEXT NOT NULL,
          reply TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(
        `Postgres not ready yet (attempt ${attempt}/${retries}), retrying in ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
