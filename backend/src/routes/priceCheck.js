/**
 * Price Check API — compare a Naneka product's price against mock market data.
 *
 * Endpoint: GET /api/price-check?slug=<product-slug>
 *       or: GET /api/price-check?id=<product-uuid>
 *
 * Market average is derived from a per-category multiplier applied to the
 * Naneka price (mock data — will be replaced with live market feeds in v2).
 * Rounded to the nearest 500 TZS for realism.
 */

import { Router } from 'express';
import { createError } from '../middleware/errorHandler.js';
import { findProductBySlug, findProductById } from '../models/product.js';

const router = Router();

// ── Market multipliers by category slug ───────────────────────────────────────
// These represent how much more expensive the same product typically sells
// for at physical Dar es Salaam retail stores vs. Naneka's direct price.
const MARKET_MULTIPLIERS = {
  'electronics':       1.12,
  'phones':            1.10,
  'apparel':           1.18,
  'furniture':         1.15,
  'made-in-tanzania':  1.08,
};
const DEFAULT_MULTIPLIER = 1.10;

function roundTo500(n) {
  return Math.round(n / 500) * 500;
}

// ── GET /api/price-check ──────────────────────────────────────────────────────
router.get('/price-check', async (req, res, next) => {
  try {
    const { slug, id } = req.query;

    if (!slug && !id) {
      return next(createError(400, 'Provide either ?slug= or ?id= to identify the product.'));
    }

    const product = slug
      ? await findProductBySlug(slug)
      : await findProductById(id);

    if (!product) {
      return next(createError(404, 'Product not found.'));
    }

    const nanekaPrice  = parseFloat(product.price);
    const multiplier   = MARKET_MULTIPLIERS[product.category_slug] ?? DEFAULT_MULTIPLIER;
    const marketAvg    = roundTo500(nanekaPrice * multiplier);
    const savingAmount = marketAvg - nanekaPrice;
    const savingPct    = ((savingAmount / marketAvg) * 100).toFixed(1);

    res.json({
      product: {
        id:               product.id,
        name:             product.name,
        slug:             product.slug,
        brand:            product.brand,
        category:         product.category_name,
        subcategory:      product.subcategory_name,
      },
      price_comparison: {
        currency:       product.currency,
        naneka_price:   nanekaPrice,
        market_average: marketAvg,
        saving_amount:  savingAmount,
        saving_pct:     parseFloat(savingPct),
        note:           'Market average based on current Dar es Salaam retail store prices (mock data)',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
