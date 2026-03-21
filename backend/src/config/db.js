import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  database: env.DB_NAME,
  user:     env.DB_USER,
  password: env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

/**
 * Convenience wrapper — returns rows directly.
 * @param {string} text   SQL query string
 * @param {any[]}  params Parameterised values
 */
export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}
