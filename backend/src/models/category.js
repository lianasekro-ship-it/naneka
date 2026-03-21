/**
 * Category model — categories and subcategories query layer.
 */

import { query } from '../config/db.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Return the full category tree: each category with its subcategories nested.
 */
export async function listCategoryTree({ includeInactive = false } = {}) {
  const activeWhere = includeInactive ? '' : 'WHERE is_active = TRUE';
  const cats = await query(
    `SELECT id, name, slug, icon, sort_order, is_active, image_url
     FROM categories ${activeWhere} ORDER BY sort_order, name`
  );
  const subs = await query(
    `SELECT id, category_id, name, slug, sort_order FROM subcategories ORDER BY sort_order, name`
  );

  return cats.rows.map(c => ({
    ...c,
    subcategories: subs.rows.filter(s => s.category_id === c.id),
  }));
}

/**
 * Find a category by slug.
 * @param {string} slug
 */
export async function findCategoryBySlug(slug) {
  const result = await query(
    `SELECT * FROM categories WHERE slug = $1`, [slug]
  );
  return result.rows[0] ?? null;
}

/**
 * Find a subcategory by slug (unique across all categories).
 * @param {string} slug
 */
export async function findSubcategoryBySlug(slug) {
  const result = await query(
    `SELECT * FROM subcategories WHERE slug = $1`, [slug]
  );
  return result.rows[0] ?? null;
}

/**
 * Find a category by UUID.
 * @param {string} id
 */
export async function findCategoryById(id) {
  const result = await query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

// ─── Category Writes ──────────────────────────────────────────────────────────

/**
 * Create a new top-level category.
 * @param {string} name
 * @param {{ icon?: string, sortOrder?: number }} opts
 */
export async function createCategory(name, { icon, sortOrder } = {}) {
  const slug = slugify(name);
  const result = await query(
    `INSERT INTO categories (name, slug, icon, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name.trim(), slug, icon ?? null, sortOrder ?? 0]
  );
  return result.rows[0];
}

/**
 * Update mutable fields of a category.
 * @param {string} id
 * @param {{ name?: string, icon?: string, sortOrder?: number, isActive?: boolean, imageUrl?: string }} updates
 */
export async function updateCategory(id, updates) {
  const fields = [];
  const values = [];
  let   idx    = 1;

  if (updates.name     !== undefined) { fields.push(`name = $${idx++}`);       values.push(updates.name.trim()); }
  if (updates.icon     !== undefined) { fields.push(`icon = $${idx++}`);       values.push(updates.icon);        }
  if (updates.sortOrder!== undefined) { fields.push(`sort_order = $${idx++}`); values.push(updates.sortOrder);   }
  if (updates.isActive !== undefined) { fields.push(`is_active = $${idx++}`);  values.push(updates.isActive);    }
  if (updates.imageUrl !== undefined) { fields.push(`image_url = $${idx++}`);  values.push(updates.imageUrl);    }

  // Regenerate slug if name changed
  if (updates.name !== undefined) {
    fields.push(`slug = $${idx++}`);
    values.push(slugify(updates.name));
  }

  if (fields.length === 0) {
    throw Object.assign(new Error('No updatable fields provided.'), { status: 400 });
  }

  values.push(id);
  const result = await query(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

/**
 * Delete a category by UUID.
 * Fails with a 409 if any products still reference it.
 * Subcategories cascade automatically (ON DELETE CASCADE).
 * @param {string} id
 * @returns {boolean}
 */
export async function deleteCategory(id) {
  // Guard: refuse to delete if products are assigned to this category
  const { rowCount: productCount } = await query(
    `SELECT 1 FROM products WHERE category_id = $1 LIMIT 1`, [id]
  );
  if (productCount > 0) {
    const err = new Error('Cannot delete a category that still has products. Reassign or delete the products first.');
    err.status = 409;
    throw err;
  }

  const { rowCount } = await query(`DELETE FROM categories WHERE id = $1`, [id]);
  return rowCount > 0;
}

// ─── Subcategory Writes ───────────────────────────────────────────────────────

/**
 * Create a subcategory under an existing category.
 * The slug is prefixed with the parent category's slug to guarantee
 * global uniqueness (the subcategories.slug column has a UNIQUE constraint).
 * @param {string} categoryId
 * @param {string} name
 * @param {{ sortOrder?: number }} opts
 */
export async function createSubcategory(categoryId, name, { sortOrder } = {}) {
  // Fetch the parent slug so we can prefix the subcategory slug
  const catRes = await query(`SELECT slug FROM categories WHERE id = $1`, [categoryId]);
  if (!catRes.rows[0]) {
    const err = new Error('Parent category not found.');
    err.status = 404;
    throw err;
  }
  const parentSlug = catRes.rows[0].slug;
  const slug = `${parentSlug}-${slugify(name)}`;

  const result = await query(
    `INSERT INTO subcategories (category_id, name, slug, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [categoryId, name.trim(), slug, sortOrder ?? 0]
  );
  return result.rows[0];
}

/**
 * Delete a subcategory by UUID.
 * Fails with a 409 if any products still reference it.
 * @param {string} id
 * @returns {boolean}
 */
export async function deleteSubcategory(id) {
  const { rowCount: productCount } = await query(
    `SELECT 1 FROM products WHERE subcategory_id = $1 LIMIT 1`, [id]
  );
  if (productCount > 0) {
    const err = new Error('Cannot delete a subcategory that still has products. Reassign or delete the products first.');
    err.status = 409;
    throw err;
  }

  const { rowCount } = await query(`DELETE FROM subcategories WHERE id = $1`, [id]);
  return rowCount > 0;
}
