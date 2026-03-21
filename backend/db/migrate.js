/**
 * Database migration runner.
 *
 * - Creates a `schema_migrations` table on first run to track applied files.
 * - Reads every *.sql file from db/migrations/ in filename order.
 * - Skips files that have already been recorded as applied.
 * - Each migration runs inside its own transaction; a failure rolls back
 *   only that file and stops the runner.
 *
 * Usage (from naneka-platform/backend/):
 *   node db/migrate.js
 */

import 'dotenv/config';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg   from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Resolve the migrations directory relative to this file:
// backend/db/migrate.js → ../../db/migrations  (naneka-platform/db/migrations)
const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../db/migrations');
const SEEDS_DIR      = path.resolve(__dirname, '../../db/seeds');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}

async function appliedMigrations(client) {
  const result = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
  return new Set(result.rows.map((r) => r.filename));
}

async function runFile(client, filepath, filename) {
  const sql = fs.readFileSync(filepath, 'utf8');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    console.log(`  ✓  ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function migrate() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await appliedMigrations(client);

    // Sort files numerically by the leading number prefix
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log('\n── Migrations ──────────────────────────');
    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  –  ${file} (already applied)`);
        continue;
      }
      await runFile(client, path.join(MIGRATIONS_DIR, file), file);
      ran++;
    }
    if (ran === 0) console.log('  All migrations already up to date.');

    // ── Seeds ────────────────────────────────
    console.log('\n── Seeds ───────────────────────────────');
    const seedFiles = fs.readdirSync(SEEDS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of seedFiles) {
      if (applied.has(`seed:${file}`)) {
        console.log(`  –  ${file} (already seeded)`);
        continue;
      }
      // Seeds tracked with a "seed:" prefix to distinguish from migrations
      const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [`seed:${file}`]
        );
        await client.query('COMMIT');
        console.log(`  ✓  ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.warn(`  ⚠  ${file} skipped (${err.message})`);
      }
    }

    console.log('\n── Done ────────────────────────────────\n');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('\n[migrate] Fatal error:', err.message);
  process.exit(1);
});
