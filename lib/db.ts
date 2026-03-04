/**
 * TrafficGenius — PostgreSQL Connection Pool
 *
 * Singleton Pool connection to Cloud SQL PostgreSQL.
 * Uses the `pg` library directly (no ORM).
 *
 * @see emailgenius-broadcasts-generator pattern
 */

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  // Import logger lazily to avoid circular deps
  import("@/lib/logger").then(({ logger }) => {
    logger.error({ err }, "Unexpected idle client error");
  });
});

/**
 * Execute a parameterized query.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Get a client from the pool for transactions.
 * Remember to call client.release() when done.
 */
export async function getClient() {
  return pool.connect();
}

export default pool;
