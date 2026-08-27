import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export const db = drizzle(pool);

// Compose starts the postgres container immediately, but Postgres itself
// takes a moment longer to accept connections — so the first few attempts
// here are expected to fail on a fresh `docker compose up`, not a bug.
export async function initSchema(retries = 10, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          filename TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          message TEXT NOT NULL,
          reply TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      // conversations existed before users did — ALTER instead of redefining
      // the CREATE TABLE, so real data from before this column existed
      // survives instead of getting wiped.
      await pool.query(`
        ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
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
