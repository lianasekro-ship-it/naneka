/**
 * Public product routes.
 *
 * Base path: /api/v1
 *
 *   GET /api/v1/categories                  Full category tree (with subcategories)
 *   GET /api/v1/categories/tree            Alias — same tree, explicit path for nav components
 *   GET /api/v1/products                    List products (?category, ?subcategory, ?brand, ?search, ?limit, ?offset)
 *   GET /api/v1/products/search?q=          Instant full-text search
 *   GET /api/v1/products/:id/reviews        List reviews + aggregate rating for a product
 *   POST /api/v1/products/:id/reviews       Submit a review
 *   GET /api/v1/products/:id/similar        "You May Also Like" — same-category products
 *   GET /api/v1/products/:slug              Single product by URL slug
 *
 * IMPORTANT: specific sub-paths (/search, /:id/reviews, /:id/similar) must be
 * declared before the catch-all /:slug route so Express matches them first.
 */

import { Router } from 'express';
import { createError } from '../middleware/errorHandler.js';
import {
  listProducts,
  findProductBySlug,
  findProductById,
  searchProducts,
  findSimilarProducts,
  listReviews,
  createReview,
} from '../models/product.js';
import { listCategoryTree } from '../models/category.js';

const router = Router();

// ─── GET /api/v1/categories & /api/v1/categories/tree ────────────────────────
// Both paths return the same full tree. /tree is an explicit alias used by
// storefront navigation components that want a self-documenting URL.
async function handleCategoryTree(_req, res, next) {
  try {
    const tree = await listCategoryTree();
    res.json({ categories: tree });
  } catch (err) {
    next(err);
  }
}
router.get('/categories/tree', handleCategoryTree);
router.get('/categories',      handleCategoryTree);

// ─── GET /api/v1/products ─────────────────────────────────────────────────────
router.get('/products', async (req, res, next) => {
  try {
    const {
      category: categorySlug,
      subcategory: subcategorySlug,
      brand,
      search,
      limit  = '50',
      offset = '0',
    } = req.query;

    const limitN  = Math.min(parseInt(limit,  10) || 50, 200);
    const offsetN = Math.max(parseInt(offset, 10) || 0,  0);

    const result = await listProducts({
      categorySlug,
      subcategorySlug,
      brand,
      search,
      limit:  limitN,
      offset: offsetN,
      // Public storefront only shows active products
    });

    res.json({
      ...result,
      pagination: {
        total:   result.total,
        limit:   limitN,
        offset:  offsetN,
        hasMore: offsetN + limitN < result.total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/products/search?q= ──────────────────────────────────────────
// NOTE: Must be declared before /:slug to prevent "search" being captured as a slug.
router.get('/products/search', async (req, res, next) => {
  try {
    const { q, limit = '20' } = req.query;
    if (!q || !q.trim()) {
      return next(createError(400, 'Query parameter "q" is required.'));
    }

    const products = await searchProducts(q.trim(), {
      limit: Math.min(parseInt(limit, 10) || 20, 50),
    });

    res.json({ products, query: q.trim(), count: products.length });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/products/:id/reviews ────────────────────────────────────────
router.get('/products/:id/reviews', async (req, res, next) => {
  try {
    const product = await findProductById(req.params.id);
    if (!product) return next(createError(404, 'Product not found.'));

    const data = await listReviews(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/products/:id/reviews ───────────────────────────────────────
router.post('/products/:id/reviews', async (req, res, next) => {
  try {
    const product = await findProductById(req.params.id);
    if (!product) return next(createError(404, 'Product not found.'));

    const { rating, comment } = req.body;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return next(createError(400, 'rating must be an integer between 1 and 5.'));
    }

    const review = await createReview(req.params.id, { rating, comment });
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/products/:id/similar ────────────────────────────────────────
router.get('/products/:id/similar', async (req, res, next) => {
  try {
    const product = await findProductById(req.params.id);
    if (!product) return next(createError(404, 'Product not found.'));

    const limit    = Math.min(parseInt(req.query.limit, 10) || 6, 20);
    const products = await findSimilarProducts(req.params.id, { limit });
    res.json({ products, category: product.category_name });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/products/:identifier ────────────────────────────────────────
// Resolves by UUID first (search results pass the product id), then by slug
// (storefront deep-links use the slug). Must stay last — catch-all.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/products/:identifier', async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const product = UUID_RE.test(identifier)
      ? await findProductById(identifier)
      : await findProductBySlug(identifier);

    if (!product) return next(createError(404, 'Product not found.'));
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

export default router;
