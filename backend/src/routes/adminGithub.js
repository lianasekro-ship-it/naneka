/**
 * Admin — GitHub product catalog import routes.
 *
 * Reads products.json from the GitHub repo via GITHUB_TOKEN and syncs
 * (upsert by SKU) into the Supabase products table.
 *
 * All routes require a valid Bearer token + admin/staff role.
 *
 * GET  /api/v1/admin/github/products/preview  — fetch & validate products.json, no DB write
 * POST /api/v1/admin/github/products/import   — upsert all products into DB
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getFile }    from '../services/github.js';
import { supabase }   from '../config/supabase.js';
import { slugify }    from '../models/product.js';

const router = Router();
const CATALOG_PATH = 'backend/products.json';

// All routes: must be authenticated + admin or staff
router.use(authenticate);
router.use(requireRole('admin', 'staff'));

// ─── Shared: fetch + parse catalog from GitHub ────────────────────────────────
async function fetchCatalog(ref) {
  const file = await getFile(CATALOG_PATH, ref);
  let catalog;
  try {
    catalog = JSON.parse(file.content);
  } catch {
    throw Object.assign(new Error('products.json is not valid JSON'), { status: 422 });
  }
  if (!Array.isArray(catalog.products)) {
    throw Object.assign(
      new Error('products.json must have a top-level "products" array'),
      { status: 422 },
    );
  }
  return catalog;
}

// ─── Shared: resolve category + subcategory slugs → UUIDs ────────────────────
async function resolveSlugs(products) {
  // Collect unique slugs
  const catSlugs  = [...new Set(products.map(p => p.category_slug).filter(Boolean))];
  const subSlugs  = [...new Set(products.map(p => p.subcategory_slug).filter(Boolean))];

  const [{ data: cats }, { data: subs }] = await Promise.all([
    supabase.from('categories').select('id, slug').in('slug', catSlugs),
    supabase.from('subcategories').select('id, slug').in('slug', subSlugs),
  ]);

  const catMap = Object.fromEntries((cats || []).map(c => [c.slug, c.id]));
  const subMap = Object.fromEntries((subs || []).map(s => [s.slug, s.id]));

  return { catMap, subMap };
}

// ─── GET /preview ─────────────────────────────────────────────────────────────
router.get('/products/preview', async (req, res, next) => {
  try {
    const catalog = await fetchCatalog(req.query.ref);
    const { catMap, subMap } = await resolveSlugs(catalog.products);

    const previewed = catalog.products.map(p => {
      const categoryId    = catMap[p.category_slug];
      const subcategoryId = subMap[p.subcategory_slug];
      return {
        ...p,
        category_id:    categoryId    || null,
        subcategory_id: subcategoryId || null,
        _warnings: [
          !categoryId    && `category_slug "${p.category_slug}" not found in DB`,
          !subcategoryId && `subcategory_slug "${p.subcategory_slug}" not found in DB`,
          !p.sku         && 'missing sku — row will be inserted without upsert key',
        ].filter(Boolean),
      };
    });

    res.json({
      version:  catalog.version,
      count:    previewed.length,
      source:   `github:${CATALOG_PATH}`,
      products: previewed,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── POST /import ─────────────────────────────────────────────────────────────
router.post('/products/import', async (req, res, next) => {
  try {
    const catalog = await fetchCatalog(req.query.ref);
    const { catMap, subMap } = await resolveSlugs(catalog.products);

    const results = { inserted: [], updated: [], skipped: [] };

    for (const p of catalog.products) {
      const categoryId    = catMap[p.category_slug];
      const subcategoryId = subMap[p.subcategory_slug];

      // Skip rows we can't resolve
      if (!categoryId || !subcategoryId) {
        results.skipped.push({
          sku:    p.sku ?? '(no sku)',
          name:   p.name,
          reason: `slug not resolved — category: ${p.category_slug}, subcategory: ${p.subcategory_slug}`,
        });
        continue;
      }

      const base = slugify(`${p.brand ? p.brand + '-' : ''}${p.name}`);

      const row = {
        name:           p.name,
        description:    p.description    ?? null,
        price:          p.price,
        currency:       p.currency       ?? 'TZS',
        brand:          p.brand          ?? null,
        image_url:      p.image_url      ?? null,
        stock_qty:      p.stock_qty      ?? 0,
        category_id:    categoryId,
        subcategory_id: subcategoryId,
        sku:            p.sku            ?? null,
        features:       p.features       ?? [],
        gallery:        p.gallery        ?? [],
        cost_price:     p.cost_price     ?? null,
        tax_rate:       p.tax_rate       ?? 18.00,
        is_active:      p.is_active      ?? true,
      };

      if (p.sku) {
        // Upsert by SKU — update if exists, insert if new
        const { data: existing } = await supabase
          .from('products')
          .select('id, slug')
          .eq('sku', p.sku)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('products')
            .update({ ...row, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
          results.updated.push({ sku: p.sku, name: p.name, id: existing.id });
        } else {
          const { data: inserted, error } = await supabase
            .from('products')
            .insert({ ...row, slug: base })
            .select('id')
            .single();
          if (error) throw error;
          results.inserted.push({ sku: p.sku, name: p.name, id: inserted.id });
        }
      } else {
        // No SKU — plain insert (no upsert key available)
        const { data: inserted, error } = await supabase
          .from('products')
          .insert({ ...row, slug: base })
          .select('id')
          .single();
        if (error) throw error;
        results.inserted.push({ sku: null, name: p.name, id: inserted.id });
      }
    }

    res.json({
      message:  `Import complete — ${results.inserted.length} inserted, ${results.updated.length} updated, ${results.skipped.length} skipped`,
      source:   `github:${CATALOG_PATH}`,
      ...results,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
