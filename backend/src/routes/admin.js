/**
 * Admin routes — product and category management panel.
 *
 * Base path: /api/v1/admin
 *
 * Categories:
 *   GET    /api/v1/admin/categories                          Full tree (for dropdowns)
 *   POST   /api/v1/admin/categories                          Create top-level category
 *   DELETE /api/v1/admin/categories/:id                      Delete (409 if products exist)
 *   POST   /api/v1/admin/categories/:id/subcategories        Create subcategory
 *   DELETE /api/v1/admin/categories/:id/subcategories/:subId Delete subcategory (nested)
 *   DELETE /api/v1/admin/subcategories/:id                   Delete subcategory (standalone)
 *
 * Products:
 *   GET    /api/v1/admin/products                            List all (incl. inactive)
 *   POST   /api/v1/admin/products                            Create
 *   PATCH  /api/v1/admin/products/:id                        Update (incl. isActive / is_visible toggle)
 *   DELETE /api/v1/admin/products/:id                        Delete
 *   POST   /api/v1/admin/products/:id/upload-image           Upload product image (multipart/form-data)
 */

import path   from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { createError } from '../middleware/errorHandler.js';
import { uploadImage } from '../middleware/upload.js';
import {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../models/product.js';
import {
  listCategoryTree,
  findCategoryById,
  findCategoryBySlug,
  findSubcategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  deleteSubcategory,
} from '../models/category.js';
import { syncProductToSheets } from '../utils/sheetsSync.js';

const router = Router();

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/admin/categories  (includes inactive)
router.get('/categories', async (_req, res, next) => {
  try {
    const tree = await listCategoryTree({ includeInactive: true });
    res.json({ categories: tree });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/categories
router.post('/categories', async (req, res, next) => {
  try {
    const { name, icon, sortOrder } = req.body;
    if (!name?.trim()) return next(createError(400, 'name is required.'));
    const category = await createCategory(name, { icon, sortOrder });
    res.status(201).json({ category });
  } catch (err) {
    if (err.code === '23505') return next(createError(409, 'A category with that name already exists.'));
    next(err);
  }
});

// PATCH /api/v1/admin/categories/:id
router.patch('/categories/:id', async (req, res, next) => {
  try {
    const existing = await findCategoryById(req.params.id);
    if (!existing) return next(createError(404, 'Category not found.'));

    const { name, icon, sortOrder, isActive } = req.body;
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return next(createError(400, 'isActive must be a boolean.'));
    }

    const updated = await updateCategory(req.params.id, { name, icon, sortOrder, isActive });
    res.json({ category: updated });
  } catch (err) {
    if (err.code === '23505') return next(createError(409, 'A category with that name already exists.'));
    next(err);
  }
});

// POST /api/v1/admin/categories/:id/upload-image
router.post('/categories/:id/upload-image', uploadImage, async (req, res, next) => {
  try {
    const existing = await findCategoryById(req.params.id);
    if (!existing) return next(createError(404, 'Category not found.'));
    if (!req.file)  return next(createError(400, 'No image file provided. Use field name "image".'));

    const relPath = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relPath}`;

    const updated = await updateCategory(req.params.id, { imageUrl: relPath });
    res.json({ category: updated, url: fullUrl, path: relPath });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/categories/:id
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const deleted = await deleteCategory(req.params.id);
    if (!deleted) return next(createError(404, 'Category not found.'));
    res.json({ message: `Category ${req.params.id} deleted.` });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/categories/:id/subcategories
router.post('/categories/:id/subcategories', async (req, res, next) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name?.trim()) return next(createError(400, 'name is required.'));
    const subcategory = await createSubcategory(req.params.id, name, { sortOrder });
    res.status(201).json({ subcategory });
  } catch (err) {
    if (err.code === '23505') return next(createError(409, 'A subcategory with that name already exists in this category.'));
    next(err);
  }
});

// DELETE /api/v1/admin/categories/:id/subcategories/:subId  (nested form)
router.delete('/categories/:id/subcategories/:subId', async (req, res, next) => {
  try {
    const deleted = await deleteSubcategory(req.params.subId);
    if (!deleted) return next(createError(404, 'Subcategory not found.'));
    res.json({ message: `Subcategory ${req.params.subId} deleted.` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/subcategories/:id  (standalone — used by the Admin UI)
router.delete('/subcategories/:id', async (req, res, next) => {
  try {
    const deleted = await deleteSubcategory(req.params.id);
    if (!deleted) return next(createError(404, 'Subcategory not found.'));
    res.json({ message: `Subcategory ${req.params.id} deleted.` });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/admin/products
router.get('/products', async (req, res, next) => {
  try {
    const { category: categorySlug, subcategory: subcategorySlug, brand, search, limit = '200', offset = '0' } = req.query;
    const result = await listProducts({
      categorySlug, subcategorySlug, brand, search,
      limit:           Math.min(parseInt(limit,  10) || 200, 500),
      offset:          Math.max(parseInt(offset, 10) || 0,   0),
      includeInactive: true,
    });
    res.json({ count: result.products.length, total: result.total, products: result.products });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/products
router.post('/products', async (req, res, next) => {
  try {
    const {
      name, price, categorySlug, subcategorySlug,
      description, brand, imageUrl, stockQty, currency,
      sku, features, gallery, costPrice, taxRate,
    } = req.body;

    if (!name || price === undefined || !categorySlug || !subcategorySlug) {
      return next(createError(400, 'name, price, categorySlug, and subcategorySlug are required.'));
    }
    if (typeof price !== 'number' || price < 0) {
      return next(createError(400, 'price must be a non-negative number.'));
    }

    const category    = await findCategoryBySlug(categorySlug);
    if (!category)    return next(createError(400, `Unknown category slug: ${categorySlug}`));
    const subcategory = await findSubcategoryBySlug(subcategorySlug);
    if (!subcategory) return next(createError(400, `Unknown subcategory slug: ${subcategorySlug}`));
    if (subcategory.category_id !== category.id) {
      return next(createError(400, `Subcategory "${subcategorySlug}" does not belong to category "${categorySlug}".`));
    }

    const product = await createProduct({
      name, price, description, brand, imageUrl, currency,
      stockQty:      stockQty ?? 0,
      categoryId:    category.id,
      subcategoryId: subcategory.id,
      sku:       sku       ?? null,
      features:  Array.isArray(features) ? features : [],
      gallery:   Array.isArray(gallery)  ? gallery  : [],
      costPrice: costPrice ?? null,
      taxRate:   taxRate   ?? 18.00,
    });

    syncProductToSheets(product).catch(() => {});
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/products/:id
// Accepts both `isActive` (camelCase) and `is_visible` (what the Admin UI sends).
router.patch('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, price, description, brand, imageUrl, stockQty,
      categorySlug, subcategorySlug,
      sku, features, gallery, costPrice, taxRate,
    } = req.body;

    // Support both naming conventions from the frontend
    const isActive = req.body.isActive ?? req.body.is_visible;

    const existing = await findProductById(id);
    if (!existing) return next(createError(404, 'Product not found.'));

    if (price    !== undefined && (typeof price    !== 'number' || price    < 0)) return next(createError(400, 'price must be a non-negative number.'));
    if (stockQty !== undefined && (typeof stockQty !== 'number' || stockQty < 0)) return next(createError(400, 'stockQty must be a non-negative integer.'));
    if (isActive !== undefined && typeof isActive  !== 'boolean')                  return next(createError(400, 'isActive / is_visible must be a boolean.'));

    let categoryId, subcategoryId;
    if (categorySlug) {
      const cat = await findCategoryBySlug(categorySlug);
      if (!cat) return next(createError(400, `Unknown category slug: ${categorySlug}`));
      categoryId = cat.id;
    }
    if (subcategorySlug) {
      const sub = await findSubcategoryBySlug(subcategorySlug);
      if (!sub) return next(createError(400, `Unknown subcategory slug: ${subcategorySlug}`));
      subcategoryId = sub.id;
    }

    const updated = await updateProduct(id, {
      name, price, description, brand, imageUrl,
      stockQty, categoryId, subcategoryId, sku,
      features: features !== undefined ? (Array.isArray(features) ? features : []) : undefined,
      gallery:  gallery  !== undefined ? (Array.isArray(gallery)  ? gallery  : []) : undefined,
      costPrice, taxRate, isActive,
    });

    res.json({ product: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/products/:id/upload-image
// Accepts: multipart/form-data with field name "image"
router.post('/products/:id/upload-image', uploadImage, async (req, res, next) => {
  try {
    const existing = await findProductById(req.params.id);
    if (!existing) return next(createError(404, 'Product not found.'));
    if (!req.file)  return next(createError(400, 'No image file provided. Use field name "image".'));

    // Relative path stored in the DB — works across any host/port
    const relPath  = `/uploads/${req.file.filename}`;
    // Full URL returned to the caller so the admin panel can preview it
    const fullUrl  = `${req.protocol}://${req.get('host')}${relPath}`;

    const updated  = await updateProduct(req.params.id, { imageUrl: relPath });
    res.json({ product: updated, url: fullUrl, path: relPath });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/products/:id
router.delete('/products/:id', async (req, res, next) => {
  try {
    const deleted = await deleteProduct(req.params.id);
    if (!deleted) return next(createError(404, 'Product not found.'));
    res.json({ message: `Product ${req.params.id} deleted.` });
  } catch (err) {
    next(err);
  }
});

export default router;
