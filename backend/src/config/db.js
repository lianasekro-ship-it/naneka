import dns from 'dns';
import pg from 'pg';

// ── IPv4-first DNS ─────────────────────────────────────────────────────────────
// GitHub Codespaces and some cloud environments have no IPv6 outbound route.
// Without this, Node's DNS resolver may pick an AAAA (IPv6) record for hostnames
// that advertise both A and AAAA — causing ENETUNREACH on every connection attempt.
// This must be called before any Pool/Client is constructed.
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;

// ── SSL ────────────────────────────────────────────────────────────────────────
// Supabase requires SSL. rejectUnauthorized:false accepts their publicly-trusted
// cert without a CA bundle — safe for Supabase.
// Set DB_SSL=false to disable (local dev with no SSL only).
const ssl = process.env.DB_SSL === 'false'
  ? false
  : { rejectUnauthorized: false };

// ── Connection string sanitisation ────────────────────────────────────────────
// Supabase's Transaction pooler URL appends ?pgbouncer=true which is not a valid
// PostgreSQL server parameter — the pg driver will forward it and Postgres will
// reject the connection. Strip it (and any other non-pg query params) here.
function sanitizeConnectionString(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete('pgbouncer');
    return u.toString();
  } catch {
    return url; // not a valid URL — return as-is and let pg report the real error
  }
}

// ── Pool config ────────────────────────────────────────────────────────────────
// Vercel serverless: each invocation is short-lived.
//   max:1              — one connection per invocation; never pool across requests.
//   idleTimeoutMillis:0 — release immediately when idle.
//   allowExitOnIdle:true — lets the Node process exit cleanly after the query
//                          finishes (prevents Vercel function timeout on teardown).
//   connectionTimeoutMillis:5000 — fail fast on cold start rather than hanging.
const _sharedSettings = {
  ssl,
  max: 1,
  idleTimeoutMillis: 0,
  allowExitOnIdle: true,
  connectionTimeoutMillis: 5000,
};

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: sanitizeConnectionString(process.env.DATABASE_URL),
      ..._sharedSettings,
    }
  : {
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ..._sharedSettings,
    };

console.log(`[db] Connecting to ${process.env.DB_HOST || '(from DATABASE_URL)'} ssl=${!!ssl}`);

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message, err.stack);
});

/**
 * Convenience wrapper — returns rows directly.
 * Logs every query error in full so Vercel logs show the root cause.
 * @param {string} text   SQL query string
 * @param {any[]}  params Parameterised values
 */
export async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('[db] Query failed:', err.message);
    console.error('[db] Query text:', text);
    console.error('[db] Stack:', err.stack);
    throw err;
  }
}
