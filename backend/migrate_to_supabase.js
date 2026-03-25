/**
 * migrate_to_supabase.js
 *
 * Migrates categories, subcategories, and products from local PostgreSQL
 * to Supabase in the correct order (respecting foreign key constraints).
 *
 * Usage:
 *   SUPABASE_URI="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres" \
 *   node migrate_to_supabase.js
 *
 * Use the Transaction pooler URL (port 6543) from:
 *   Supabase Dashboard → Settings → Database → Connection string → Transaction pooler
 * This URL is IPv4 and works from GitHub Codespaces.
 */

import dns from 'dns';
import pg from 'pg';

// Force IPv4 DNS resolution — Codespaces has no IPv6 outbound route.
// Without this, the Supabase hostname may resolve to an AAAA record → ENETUNREACH.
dns.setDefaultResultOrder('ipv4first');

const { Client } = pg;

// SSL required by Supabase — rejectUnauthorized:false accepts their publicly-trusted
// cert without a local CA bundle.
const ssl = { rejectUnauthorized: false };

const LOCAL_URI    = 'postgresql://naneka_user:changeme@localhost:5432/naneka';
const SUPABASE_URI = process.env.SUPABASE_URI;

if (!SUPABASE_URI) {
  console.error('❌ SUPABASE_URI environment variable is required.');
  console.error('   Run: SUPABASE_URI="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres" node migrate_to_supabase.js');
  process.exit(1);
}

// Strip ?pgbouncer=true — not a valid Postgres server parameter.
function sanitizeUri(uri) {
  try { const u = new URL(uri); u.searchParams.delete('pgbouncer'); return u.toString(); }
  catch { return uri; }
}

const local    = new Client({ connectionString: LOCAL_URI });
const supabase = new Client({ connectionString: sanitizeUri(SUPABASE_URI), ssl });

async function migrateCategories() {
  const { rows } = await local.query(
    'SELECT id, name, slug, sort_order, created_at FROM categories ORDER BY sort_order'
  );
  console.log(`📂 Migrating ${rows.length} categories...`);

  for (const r of rows) {
    await supabase.query(
      `INSERT INTO categories (id, name, slug, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.name, r.slug, r.sort_order, r.created_at]
    );
  }
  console.log(`   ✅ Categories done.`);
}

async function migrateSubcategories() {
  const { rows } = await local.query(
    'SELECT id, name, slug, category_id, sort_order, created_at FROM subcategories ORDER BY sort_order'
  );
  console.log(`📁 Migrating ${rows.length} subcategories...`);

  for (const r of rows) {
    await supabase.query(
      `INSERT INTO subcategories (id, name, slug, category_id, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.name, r.slug, r.category_id, r.sort_order, r.created_at]
    );
  }
  console.log(`   ✅ Subcategories done.`);
}

async function migrateProducts() {
  const { rows } = await local.query(
    `SELECT id, name, slug, description, price, currency, brand,
            image_url, stock_qty, is_active, sku, features, gallery,
            cost_price, tax_rate, category_id, subcategory_id,
            created_at, updated_at
     FROM products
     ORDER BY created_at`
  );
  console.log(`📦 Migrating ${rows.length} products...`);

  let ok = 0, skipped = 0;
  for (const p of rows) {
    try {
      await supabase.query(
        `INSERT INTO products
           (id, name, slug, description, price, currency, brand,
            image_url, stock_qty, is_active, sku, features, gallery,
            cost_price, tax_rate, category_id, subcategory_id,
            created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO NOTHING`,
        [
          p.id, p.name, p.slug, p.description, p.price,
          p.currency ?? 'TZS', p.brand, p.image_url,
          p.stock_qty ?? 0, p.is_active ?? true,
          p.sku, p.features, p.gallery,
          p.cost_price, p.tax_rate ?? 18.00,
          p.category_id, p.subcategory_id,
          p.created_at, p.updated_at,
        ]
      );
      ok++;
    } catch (err) {
      console.warn(`   ⚠️  Skipped product "${p.name}" (${p.id}): ${err.message}`);
      skipped++;
    }
  }
  console.log(`   ✅ Products done — ${ok} inserted, ${skipped} skipped.`);
}

async function main() {
  try {
    await local.connect();
    await supabase.connect();
    console.log('✅ Connected to both databases.\n');

    await migrateCategories();
    await migrateSubcategories();
    await migrateProducts();

    console.log('\n🚀 Migration complete!');
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  } finally {
    await local.end();
    await supabase.end();
  }
}

main();
