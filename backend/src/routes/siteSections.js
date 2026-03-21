/**
 * Site Sections routes.
 *
 * Public:
 *   GET  /api/v1/site-sections          List active sections (with resolved products)
 *
 * Admin:
 *   GET    /api/v1/admin/site-sections          List all sections (incl. inactive)
 *   POST   /api/v1/admin/site-sections          Create a section
 *   PATCH  /api/v1/admin/site-sections/:id      Update a section
 *   DELETE /api/v1/admin/site-sections/:id      Delete a section
 *
 * This file exports two routers. server.js mounts them separately.
 */

import { Router } from 'express';
import { createError } from '../middleware/errorHandler.js';
import {
  listSiteSections,
  findSiteSectionById,
  createSiteSection,
  updateSiteSection,
  deleteSiteSection,
} from '../models/siteSection.js';
import { listProducts } from '../models/product.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Apply an algorithmic_rule object to listProducts and return the results.
 * Supports: category_slug, subcategory_slug, brand, search, min_price, max_price, limit.
 */
async function resolveRule(rule) {
  const {
    category_slug,
    subcategory_slug,
    brand,
    search,
    min_price,
    max_price,
    limit = 8,
  } = rule ?? {};

  const { products } = await listProducts({
    categorySlug:    category_slug,
    subcategorySlug: subcategory_slug,
    brand,
    search,
    minPrice: min_price != null ? Number(min_price) : undefined,
    maxPrice: max_price != null ? Number(max_price) : undefined,
    limit: Math.min(Number(limit) || 8, 50),
    offset: 0,
    includeInactive: false,
  });
  return products;
}

// ─── Public Router ────────────────────────────────────────────────────────────
export const publicSectionsRouter = Router();

// GET /api/v1/site-sections
publicSectionsRouter.get('/', async (_req, res, next) => {
  try {
    const sections = await listSiteSections({ includeInactive: false });

    // Resolve each section's rule independently so one bad rule never
    // crashes the entire response — failing sections return empty products.
    const resolved = await Promise.all(
      sections.map(async s => {
        let products = [];
        try {
          products = await resolveRule(s.algorithmic_rule);
        } catch (ruleErr) {
          console.error(`[site-sections] Failed to resolve rule for "${s.title}":`, ruleErr.message);
        }
        return { ...s, products };
      })
    );

    res.json({ sections: resolved });
  } catch (err) {
    next(err);
  }
});

// ─── Admin Router ─────────────────────────────────────────────────────────────
export const adminSectionsRouter = Router();

// GET /api/v1/admin/site-sections
adminSectionsRouter.get('/', async (_req, res, next) => {
  try {
    const sections = await listSiteSections({ includeInactive: true });
    res.json({ sections });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/site-sections
adminSectionsRouter.post('/', async (req, res, next) => {
  try {
    const { title, algorithmicRule, position, isActive } = req.body;
    if (!title?.trim()) return next(createError(400, 'title is required.'));

    const section = await createSiteSection({
      title,
      algorithmicRule: algorithmicRule ?? {},
      position:        position ?? 0,
      isActive:        isActive ?? true,
    });
    res.status(201).json({ section });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/site-sections/:id
adminSectionsRouter.patch('/:id', async (req, res, next) => {
  try {
    const existing = await findSiteSectionById(req.params.id);
    if (!existing) return next(createError(404, 'Site section not found.'));

    const { title, algorithmicRule, position, isActive } = req.body;
    const updated = await updateSiteSection(req.params.id, {
      title, algorithmicRule, position, isActive,
    });
    res.json({ section: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/site-sections/:id
adminSectionsRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteSiteSection(req.params.id);
    if (!deleted) return next(createError(404, 'Site section not found.'));
    res.json({ message: `Site section ${req.params.id} deleted.` });
  } catch (err) {
    next(err);
  }
});
