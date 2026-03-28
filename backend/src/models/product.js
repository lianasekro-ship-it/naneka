/**
 * Product model — query layer for the products table.
 *
 * All public-facing reads return a joined object that includes
 * category_name, category_slug, subcategory_name, subcategory_slug.
 */

import { query } from '../config/db.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert an arbitrary string to a URL-safe slug.
 * e.g. "Samsung Galaxy A55 5G (2024)" → "samsung-galaxy-a55-5g-2024"
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensure a slug is unique in the products table.
 * Appends -2, -3, … if the base slug is taken.
 */
async function uniqueSlug(base, excludeId = null) {
  let candidate = base;
  let suffix    = 2;
  while (true) {
    const q = excludeId
      ? `SELECT 1 FROM products WHERE slug = $1 AND id != $2`
      : `SELECT 1 FROM products WHERE slug = $1`;
    const params = excludeId ? [candidate, excludeId] : [candidate];
    const { rowCount } = await query(q, params);
    if (rowCount === 0) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

// ─── Base SELECT with joins ───────────────────────────────────────────────────
const BASE_SELECT = `
  SELECT
    p.id, p.name, p.slug, p.description, p.price, p.currency,
    p.brand, p.image_url, p.stock_qty, p.is_active,
    p.sku, p.features, p.gallery, p.cost_price, p.tax_rate,
    p.created_at, p.updated_at,
    c.id   AS category_id,    c.name AS category_name,    c.slug AS category_slug,
    s.id   AS subcategory_id, s.name AS subcategory_name, s.slug AS subcategory_slug
  FROM products p
  JOIN categories    c ON c.id = p.category_id
  JOIN subcategories s ON s.id = p.subcategory_id
`;

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * List products with optional filters.
 * @param {{ categorySlug?: string, subcategorySlug?: string, brand?: string, search?: string, minPrice?: number, maxPrice?: number, limit?: number, offset?: number, includeInactive?: boolean }} opts
 */
export async function listProducts({
  categorySlug,
  subcategorySlug,
  brand,
  search,
  minPrice,
  maxPrice,
  limit  = 50,
  offset = 0,
  includeInactive = false,
} = {}) {
  const conditions = [];
  const values     = [];
  let   idx        = 1;

  if (!includeInactive) {
    conditions.push(`p.is_active = TRUE`);
  }
  if (categorySlug) {
    conditions.push(`c.slug = $${idx++}`);
    values.push(categorySlug);
  }
  if (subcategorySlug) {
    conditions.push(`s.slug = $${idx++}`);
    values.push(subcategorySlug);
  }
  if (brand) {
    conditions.push(`p.brand ILIKE $${idx++}`);
    values.push(brand);
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx} OR p.brand ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }
  if (minPrice != null) {
    conditions.push(`p.price >= $${idx++}`);
    values.push(minPrice);
  }
  if (maxPrice != null) {
    conditions.push(`p.price <= $${idx++}`);
    values.push(maxPrice);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count for pagination
  const countRes = await query(
    `SELECT COUNT(*) FROM products p JOIN categories c ON c.id = p.category_id JOIN subcategories s ON s.id = p.subcategory_id ${where}`,
    values
  );
  const total = parseInt(countRes.rows[0].count, 10);

  // Paged results
  values.push(limit, offset);
  const dataRes = await query(
    `${BASE_SELECT} ${where} ORDER BY c.sort_order, s.sort_order, p.name LIMIT $${idx} OFFSET $${idx + 1}`,
    values
  );

  return { products: dataRes.rows, total, limit, offset };
}

/**
 * Find a product by UUID.
 * @param {string} id
 */
export async function findProductById(id) {
  const result = await query(`${BASE_SELECT} WHERE p.id = $1`, [id]);
  return result.rows[0] ?? null;
}

/**
 * Find a product by slug (used for deep links and price-check).
 * @param {string} slug
 */
export async function findProductBySlug(slug) {
  const result = await query(`${BASE_SELECT} WHERE p.slug = $1`, [slug]);
  return result.rows[0] ?? null;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Create a new product.
 * @param {{ name: string, price: number, categoryId: string, subcategoryId: string, description?: string, brand?: string, imageUrl?: string, stockQty?: number, currency?: string, sku?: string, features?: string[], gallery?: string[], costPrice?: number, taxRate?: number }} data
 */
export async function createProduct(data) {
  const base = slugify(`${data.brand ? data.brand + '-' : ''}${data.name}`);
  const slug = await uniqueSlug(base);

  const result = await query(
    `INSERT INTO products
       (name, slug, description, description_sw, price, currency, brand, image_url, stock_qty,
        category_id, subcategory_id, sku, features, gallery, cost_price, tax_rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      data.name,
      slug,
      data.description   ?? null,
      data.descriptionSw ?? null,
      data.price,
      data.currency    ?? 'TZS',
      data.brand       ?? null,
      data.imageUrl    ?? null,
      data.stockQty    ?? 0,
      data.categoryId,
      data.subcategoryId,
      data.sku         ?? null,
      JSON.stringify(data.features ?? []),
      JSON.stringify(data.gallery  ?? []),
      data.costPrice   ?? null,
      data.taxRate     ?? 18.00,
    ]
  );
  return result.rows[0];
}

/**
 * Update a product's mutable fields.
 * Only the keys present in `updates` are changed.
 * @param {string} id
 * @param {{ name?: string, price?: number, description?: string, brand?: string, imageUrl?: string, stockQty?: number, categoryId?: string, subcategoryId?: string }} updates
 */
export async function updateProduct(id, updates) {
  const fields = [];
  const values = [];
  let   idx    = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
    // Regenerate slug when name changes
    const base = slugify(`${updates.brand ?? ''}${updates.name}`);
    const slug = await uniqueSlug(base, id);
    fields.push(`slug = $${idx++}`);
    values.push(slug);
  }
  if (updates.price       !== undefined) { fields.push(`price = $${idx++}`);          values.push(updates.price);       }
  if (updates.description   !== undefined) { fields.push(`description = $${idx++}`);    values.push(updates.description);   }
  if (updates.descriptionSw !== undefined) { fields.push(`description_sw = $${idx++}`); values.push(updates.descriptionSw); }
  if (updates.brand       !== undefined) { fields.push(`brand = $${idx++}`);          values.push(updates.brand);       }
  if (updates.imageUrl    !== undefined) { fields.push(`image_url = $${idx++}`);      values.push(updates.imageUrl);    }
  if (updates.stockQty    !== undefined) { fields.push(`stock_qty = $${idx++}`);      values.push(updates.stockQty);    }
  if (updates.categoryId    !== undefined) { fields.push(`category_id = $${idx++}`);    values.push(updates.categoryId);  }
  if (updates.subcategoryId !== undefined) { fields.push(`subcategory_id = $${idx++}`); values.push(updates.subcategoryId); }
  if (updates.sku         !== undefined) { fields.push(`sku = $${idx++}`);              values.push(updates.sku);         }
  if (updates.features    !== undefined) { fields.push(`features = $${idx++}`);         values.push(JSON.stringify(updates.features)); }
  if (updates.gallery     !== undefined) { fields.push(`gallery = $${idx++}`);          values.push(JSON.stringify(updates.gallery));  }
  if (updates.costPrice   !== undefined) { fields.push(`cost_price = $${idx++}`);       values.push(updates.costPrice);   }
  if (updates.taxRate     !== undefined) { fields.push(`tax_rate = $${idx++}`);         values.push(updates.taxRate);     }
  if (updates.isActive    !== undefined) { fields.push(`is_active = $${idx++}`);        values.push(updates.isActive);    }

  if (fields.length === 0) {
    throw Object.assign(new Error('No updatable fields provided.'), { status: 400 });
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

/**
 * Delete a product by UUID.
 * @param {string} id
 * @returns {boolean}
 */
export async function deleteProduct(id) {
  const { rowCount } = await query(
    `DELETE FROM products WHERE id = $1 RETURNING id`, [id]
  );
  return rowCount > 0;
}

// ─── Instant Search ───────────────────────────────────────────────────────────

/**
 * High-performance product search using PostgreSQL full-text search.
 * Falls back to ILIKE for partial-word matches (e.g. "Sam" → Samsung).
 * Results are ranked by relevance: exact FTS matches rank above ILIKE-only.
 *
 * @param {string} q - Raw search query from the user
 * @param {{ limit?: number, includeInactive?: boolean }} opts
 */
export async function searchProducts(q, { limit = 20, includeInactive = false } = {}) {
  const activeClause = includeInactive ? '' : 'AND p.is_active = TRUE';
  const pattern      = `%${q}%`;

  const result = await query(
    `${BASE_SELECT}
     WHERE (
       p.search_vector @@ plainto_tsquery('english', $1)
       OR p.name        ILIKE $2
       OR p.brand       ILIKE $2
       OR c.name        ILIKE $2
       OR s.name        ILIKE $2
     ) ${activeClause}
     ORDER BY
       ts_rank(p.search_vector, plainto_tsquery('english', $1)) DESC,
       p.name ASC
     LIMIT $3`,
    [q, pattern, Math.min(limit, 50)]
  );

  return result.rows;
}

// ─── Similar Products ─────────────────────────────────────────────────────────

/**
 * Return active products in the same category, excluding the source product.
 * Used for the "You May Also Like" section.
 *
 * @param {string} productId
 * @param {{ limit?: number }} opts
 */
export async function findSimilarProducts(productId, { limit = 6 } = {}) {
  // Grab the category_id of the source product first
  const ref = await query(
    `SELECT category_id FROM products WHERE id = $1`, [productId]
  );
  if (!ref.rows[0]) return [];

  const { category_id } = ref.rows[0];

  const result = await query(
    `${BASE_SELECT}
     WHERE p.category_id = $1
       AND p.id          != $2
       AND p.is_active    = TRUE
     ORDER BY RANDOM()
     LIMIT $3`,
    [category_id, productId, Math.min(limit, 20)]
  );
  return result.rows;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

/**
 * List all reviews for a product, plus aggregate rating stats.
 * @param {string} productId
 */
export async function listReviews(productId) {
  const [reviewsRes, statsRes] = await Promise.all([
    query(
      `SELECT id, rating, comment, created_at
       FROM product_reviews
       WHERE product_id = $1
       ORDER BY created_at DESC`,
      [productId]
    ),
    query(
      `SELECT COUNT(*)::int AS count, ROUND(AVG(rating), 1)::float AS average
       FROM product_reviews
       WHERE product_id = $1`,
      [productId]
    ),
  ]);

  return {
    reviews:  reviewsRes.rows,
    count:    statsRes.rows[0].count,
    average:  statsRes.rows[0].average,
  };
}

/**
 * Create a review for a product.
 * @param {string} productId
 * @param {{ rating: number, comment?: string }} data
 */
export async function createReview(productId, { rating, comment }) {
  const result = await query(
    `INSERT INTO product_reviews (product_id, rating, comment)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [productId, rating, comment?.trim() ?? null]
  );
  return result.rows[0];
}
