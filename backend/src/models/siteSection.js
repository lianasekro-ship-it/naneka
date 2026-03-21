/**
 * SiteSection model — query layer for the site_sections table.
 *
 * Each site section has an `algorithmic_rule` JSONB field that describes
 * how to filter products for the public storefront. Supported rule keys:
 *   category_slug    — filter by top-level category
 *   subcategory_slug — filter by subcategory
 *   brand            — filter by brand (ILIKE)
 *   search           — full-text search query
 *   max_price        — upper price bound (NUMERIC)
 *   min_price        — lower price bound (NUMERIC)
 *   limit            — max products to return (default 8, max 50)
 */

import { query } from '../config/db.js';

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function listSiteSections({ includeInactive = false } = {}) {
  const where = includeInactive ? '' : 'WHERE is_active = TRUE';
  const result = await query(
    `SELECT * FROM site_sections ${where} ORDER BY position, created_at`,
    []
  );
  return result.rows;
}

export async function findSiteSectionById(id) {
  const result = await query(
    `SELECT * FROM site_sections WHERE id = $1`, [id]
  );
  return result.rows[0] ?? null;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function createSiteSection({ title, algorithmicRule = {}, position = 0, isActive = true }) {
  const result = await query(
    `INSERT INTO site_sections (title, algorithmic_rule, position, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title.trim(), JSON.stringify(algorithmicRule), position, isActive]
  );
  return result.rows[0];
}

export async function updateSiteSection(id, updates) {
  const fields = [];
  const values = [];
  let   idx    = 1;

  if (updates.title            !== undefined) { fields.push(`title = $${idx++}`);             values.push(updates.title.trim()); }
  if (updates.algorithmicRule  !== undefined) { fields.push(`algorithmic_rule = $${idx++}`);  values.push(JSON.stringify(updates.algorithmicRule)); }
  if (updates.position         !== undefined) { fields.push(`position = $${idx++}`);          values.push(updates.position); }
  if (updates.isActive         !== undefined) { fields.push(`is_active = $${idx++}`);         values.push(updates.isActive); }

  if (fields.length === 0) {
    throw Object.assign(new Error('No updatable fields provided.'), { status: 400 });
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE site_sections SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteSiteSection(id) {
  const { rowCount } = await query(
    `DELETE FROM site_sections WHERE id = $1`, [id]
  );
  return rowCount > 0;
}
