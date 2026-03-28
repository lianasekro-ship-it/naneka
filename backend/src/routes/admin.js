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
import { syncProductToSheets, syncToSheets } from '../utils/sheetsSync.js';

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
      description, description_sw, brand, imageUrl, stockQty, currency,
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
      name, price, description, descriptionSw: description_sw, brand, imageUrl, currency,
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
      name, price, description, description_sw, brand, imageUrl, stockQty,
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
      name, price, description, descriptionSw: description_sw, brand, imageUrl,
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

// ══════════════════════════════════════════════════════════════════════════════
// WAHA DIAGNOSTIC TOOLS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/debug-groups
 *
 * No API key required — open directly in a browser to see:
 *   1. Which WAHA env vars are configured on this server
 *   2. All WhatsApp groups the session is in (to find WAHA_GROUP_ID)
 *
 * Remove this route (or set DISABLE_DEBUG_GROUPS=true) once WAHA_GROUP_ID is set.
 */
router.get('/debug-groups', async (req, res) => {
  const wahaBaseUrl = process.env.WAHA_BASE_URL;
  const wahaApiKey  = process.env.WAHA_API_KEY;
  const wahaSession = process.env.WAHA_SESSION || 'default';

  // Always include env status so you can verify what the server sees
  const envStatus = {
    WAHA_BASE_URL:  wahaBaseUrl ? `✓ set → ${wahaBaseUrl}` : '✗ NOT SET',
    WAHA_API_KEY:   wahaApiKey  ? '✓ set (value hidden)'   : '✗ NOT SET',
    WAHA_SESSION:   wahaSession,
    WAHA_GROUP_ID:  process.env.WAHA_GROUP_ID
                      ? `✓ already set → ${process.env.WAHA_GROUP_ID}`
                      : '✗ NOT SET — this is what you need to find',
    WAHA_ADMIN_PHONE: process.env.WAHA_ADMIN_PHONE || '(not set)',
  };

  if (!wahaBaseUrl || !wahaApiKey) {
    return res.json({
      ok: false,
      error: 'WAHA is not configured on this server.',
      env_status: envStatus,
      fix: 'Add WAHA_BASE_URL and WAHA_API_KEY to your Vercel environment variables and redeploy.',
    });
  }

  try {
    const url     = `${wahaBaseUrl}/api/${wahaSession}/chats`;
    const wahaRes = await fetch(url, {
      headers: { 'X-Api-Key': wahaApiKey },
      signal:  AbortSignal.timeout(10_000),
    });

    if (!wahaRes.ok) {
      const detail = await wahaRes.text().catch(() => '');
      return res.json({
        ok: false,
        error: `WAHA returned HTTP ${wahaRes.status}`,
        detail,
        env_status: envStatus,
        hint: 'Is the WAHA session started and the phone connected?',
      });
    }

    const payload = await wahaRes.json();
    const all     = Array.isArray(payload) ? payload : (payload.chats ?? []);
    const groups  = all
      .filter(c => (c.id || '').endsWith('@g.us'))
      .map(g => ({ id: g.id, name: g.name ?? g.subject ?? '(unnamed)' }));

    return res.json({
      ok: true,
      env_status: envStatus,
      groups,
      total: groups.length,
      next_step: groups.length > 0
        ? 'Copy the "id" of your Naneka Orders group → add WAHA_GROUP_ID=<id> to Vercel env vars → redeploy → this route is no longer needed.'
        : 'No groups found. Make sure the WAHA session is active and the WhatsApp number is in at least one group.',
    });
  } catch (err) {
    return res.json({
      ok: false,
      error: `Could not reach WAHA: ${err.message}`,
      env_status: envStatus,
      hint: `Tried: ${wahaBaseUrl}. Is WAHA publicly accessible from Vercel?`,
    });
  }
});

/**
 * GET /api/v1/admin/rescue-id
 *
 * Zero-friction WAHA group finder — open in a browser, no API key needed.
 * Returns an HTML page showing:
 *   • Which env vars are live on this server
 *   • The Naneka Orders group ID (plain, ready to copy)
 *   • Exact fix instructions for every failure mode (401, localhost, etc.)
 *
 * Remove this route once WAHA_GROUP_ID is set in Vercel.
 */
router.get('/rescue-id', async (req, res) => {
  const wahaBaseUrl    = process.env.WAHA_BASE_URL   || '';
  const wahaApiKey     = process.env.WAHA_API_KEY    || '';
  const wahaSession    = process.env.WAHA_SESSION    || 'default';
  const currentGroupId = process.env.WAHA_GROUP_ID   || '';
  const keyPreview     = wahaApiKey
    ? `${wahaApiKey.slice(0, 6)}…${wahaApiKey.slice(-4)}`
    : '(not set)';

  const css = `
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         max-width:680px;margin:40px auto;padding:0 20px;background:#f8fafc;color:#1e293b}
    h1{margin-bottom:4px}p.sub{color:#64748b;margin-top:0}
    .card{background:#fff;border-radius:12px;padding:20px 24px;margin:16px 0;
          box-shadow:0 1px 4px rgba(0,0,0,.08)}
    .ok{border-left:4px solid #22c55e}.err{border-left:4px solid #ef4444}
    .warn{border-left:4px solid #f59e0b}.info{border-left:4px solid #3b82f6}
    .bigid{font-family:monospace;font-size:1.35em;font-weight:700;color:#15803d;
           background:#f0fdf4;padding:12px 16px;border-radius:8px;
           word-break:break-all;display:block;margin:10px 0}
    code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:.9em}
    ol,ul{padding-left:20px;line-height:1.9}
    .env-table{width:100%;border-collapse:collapse;font-size:.9em}
    .env-table td{padding:6px 10px;border-bottom:1px solid #f1f5f9}
    .env-table td:first-child{color:#64748b;width:200px}
    .tick{color:#22c55e}.cross{color:#ef4444}`;

  const envRows = `
    <table class="env-table">
      <tr><td>WAHA_BASE_URL</td><td>${wahaBaseUrl  || '<span class="cross">✗ NOT SET</span>'}</td></tr>
      <tr><td>WAHA_API_KEY</td><td>${wahaApiKey   ? `<span class="tick">✓</span> ${keyPreview}` : '<span class="cross">✗ NOT SET</span>'}</td></tr>
      <tr><td>WAHA_SESSION</td><td>${wahaSession}</td></tr>
      <tr><td>WAHA_GROUP_ID</td><td>${currentGroupId || '<span class="cross">✗ NOT SET — this is what you need</span>'}</td></tr>
    </table>`;

  const page = (title, body) => res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Naneka — ${title}</title><style>${css}</style></head>
<body><h1>🔍 Naneka Rescue</h1><p class="sub">${title}</p>${body}</body></html>`);

  // ── Already done ─────────────────────────────────────────────────────────
  if (currentGroupId) {
    return page('WAHA_GROUP_ID already set', `
      <div class="card ok">
        <h2>✅ Already configured!</h2>
        <span class="bigid">${currentGroupId}</span>
        <p>This ID is live in <code>WAHA_GROUP_ID</code>. WhatsApp group notifications are enabled.</p>
      </div>
      <div class="card info"><h3>Environment</h3>${envRows}</div>`);
  }

  // ── Missing env vars ──────────────────────────────────────────────────────
  if (!wahaBaseUrl || !wahaApiKey) {
    return page('WAHA not configured', `
      <div class="card err">
        <h2>❌ Missing environment variables</h2>
        <p>The server can't reach WAHA because one or more env vars are not set in Vercel.</p>
        <ul>
          ${!wahaBaseUrl ? '<li>Add <code>WAHA_BASE_URL</code> — the public URL of your WAHA instance (not localhost!)</li>' : ''}
          ${!wahaApiKey  ? '<li>Add <code>WAHA_API_KEY</code> — must match the key in your WAHA dashboard</li>' : ''}
        </ul>
        <p>After adding them: <strong>Vercel → Project → Settings → Environment Variables → Redeploy</strong></p>
      </div>
      <div class="card info"><h3>Current environment on this server</h3>${envRows}</div>`);
  }

  // ── Try WAHA ─────────────────────────────────────────────────────────────
  let wahaRes;
  try {
    wahaRes = await fetch(`${wahaBaseUrl}/api/${wahaSession}/chats`, {
      headers: { 'X-Api-Key': wahaApiKey },
      signal:  AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const isLocal = wahaBaseUrl.includes('localhost') || wahaBaseUrl.includes('127.0.0.1');
    return page('Cannot reach WAHA', `
      <div class="card err">
        <h2>🔌 Could not connect to WAHA</h2>
        <p>Tried: <code>${wahaBaseUrl}</code></p>
        <p>Error: <code>${err.message}</code></p>
      </div>
      ${isLocal ? `
      <div class="card warn">
        <h2>⚠️ <code>localhost</code> won't work from Vercel</h2>
        <p>Vercel runs in the cloud — <code>localhost:3001</code> on Vercel is Vercel's own machine, not yours.</p>
        <ol>
          <li>Expose WAHA publicly using <a href="https://ngrok.com">ngrok</a>, Cloudflare Tunnel, or your VPS public IP</li>
          <li>Update <code>WAHA_BASE_URL</code> in Vercel to that public URL (e.g. <code>https://abc123.ngrok.io</code>)</li>
          <li>Redeploy and open this page again</li>
        </ol>
      </div>` : ''}
      <div class="card info"><h3>Environment</h3>${envRows}</div>`);
  }

  // ── 401 — key mismatch ────────────────────────────────────────────────────
  if (wahaRes.status === 401) {
    return page('401 — API Key mismatch', `
      <div class="card err">
        <h2>🔑 401 Unauthorized — the API key doesn't match</h2>
        <p>This server is sending key: <code>${keyPreview}</code></p>
        <p>WAHA is rejecting it. Choose one fix:</p>
        <h3>Option A — Update WAHA to use the same key</h3>
        <ol>
          <li>Open your WAHA dashboard at <code>${wahaBaseUrl}</code></li>
          <li>Go to <strong>Settings → API Key</strong></li>
          <li>Set it to exactly: <code>${wahaApiKey}</code></li>
          <li>Restart WAHA and refresh this page</li>
        </ol>
        <h3>Option B — Update Vercel to match WAHA's current key</h3>
        <ol>
          <li>Find the current API key in your WAHA dashboard</li>
          <li>Set <code>WAHA_API_KEY=&lt;that key&gt;</code> in Vercel → Redeploy</li>
        </ol>
      </div>
      <div class="card info"><h3>Environment</h3>${envRows}</div>`);
  }

  // ── Other WAHA error ──────────────────────────────────────────────────────
  if (!wahaRes.ok) {
    const detail = await wahaRes.text().catch(() => '');
    return page(`WAHA error ${wahaRes.status}`, `
      <div class="card err">
        <h2>❌ WAHA returned HTTP ${wahaRes.status}</h2>
        <p>${detail || 'No details returned.'}</p>
        <p>Is the WAHA session started and the phone connected?</p>
      </div>
      <div class="card info"><h3>Environment</h3>${envRows}</div>`);
  }

  // ── Parse groups ──────────────────────────────────────────────────────────
  const payload  = await wahaRes.json();
  const all      = Array.isArray(payload) ? payload : (payload.chats ?? []);
  const groups   = all
    .filter(c => (c.id || '').endsWith('@g.us'))
    .map(g => ({ id: g.id, name: g.name ?? g.subject ?? '(unnamed)' }));

  const target = groups.find(g =>
    /naneka|order/i.test(g.name)
  );

  const groupCards = groups.map(g => `
    <div class="card ${target && g.id === target.id ? 'ok' : ''}">
      <strong>${g.name}</strong>
      <span class="bigid">${g.id}</span>
    </div>`).join('');

  if (target) {
    return page('Group ID found!', `
      <div class="card ok">
        <h2>✅ "${target.name}" found</h2>
        <p>Copy this value → add it as <code>WAHA_GROUP_ID</code> in Vercel → Redeploy:</p>
        <span class="bigid">${target.id}</span>
      </div>
      <div class="card info"><h3>Environment</h3>${envRows}</div>
      <h3>All groups (${groups.length})</h3>${groupCards}`);
  }

  if (groups.length === 0) {
    return page('No groups found', `
      <div class="card warn">
        <h2>⚠️ No WhatsApp groups found</h2>
        <p>The WAHA session is connected but the phone isn't in any group, or the session isn't fully started.</p>
        <p>Add the Naneka phone number to a group, then refresh this page.</p>
      </div>
      <div class="card info"><h3>Environment</h3>${envRows}</div>`);
  }

  return page('Pick your group', `
    <div class="card warn">
      <h2>⚠️ Could not auto-detect "Naneka Orders"</h2>
      <p>Pick the correct group below and copy its ID into <code>WAHA_GROUP_ID</code> in Vercel:</p>
    </div>
    ${groupCards}
    <div class="card info"><h3>Environment</h3>${envRows}</div>`);
});

/**
 * GET /api/v1/admin/waha/groups?key=<WAHA_API_KEY>
 *
 * Proxies through to WAHA (using the server's WAHA_BASE_URL, which IS
 * reachable from Vercel) and returns all WhatsApp groups the session is in.
 *
 * Usage: open in browser →
 *   https://naneka-backend.vercel.app/api/v1/admin/waha/groups?key=<WAHA_API_KEY>
 *
 * Copy the "id" field from the group named "Naneka Orders" and set it as
 * WAHA_GROUP_ID in your Vercel environment variables.
 */
router.get('/waha/groups', async (req, res, next) => {
  const wahaBaseUrl = process.env.WAHA_BASE_URL;
  const wahaApiKey  = process.env.WAHA_API_KEY;
  const wahaSession = process.env.WAHA_SESSION || 'default';

  if (!wahaBaseUrl || !wahaApiKey) {
    return next(createError(503, 'WAHA_BASE_URL and WAHA_API_KEY are not configured on this server.'));
  }

  // Caller must pass the WAHA API key to access this endpoint
  if (req.query.key !== wahaApiKey) {
    return res.status(401).json({ error: 'Invalid key. Pass ?key=<WAHA_API_KEY>' });
  }

  try {
    const url = `${wahaBaseUrl}/api/${wahaSession}/chats`;
    const wahaRes = await fetch(url, {
      headers: { 'X-Api-Key': wahaApiKey },
      signal:  AbortSignal.timeout(10_000),
    });

    if (!wahaRes.ok) {
      const detail = await wahaRes.text().catch(() => '');
      return next(createError(502, `WAHA returned ${wahaRes.status}: ${detail}`));
    }

    const payload = await wahaRes.json();
    const all     = Array.isArray(payload) ? payload : (payload.chats ?? []);
    const groups  = all
      .filter(c => (c.id || '').endsWith('@g.us'))
      .map(g => ({
        id:   g.id,
        name: g.name ?? g.subject ?? '(unnamed)',
      }));

    return res.json({
      groups,
      total: groups.length,
      next_step: 'Copy the "id" of your "Naneka Orders" group and add WAHA_GROUP_ID=<id> to Vercel env vars.',
    });
  } catch (err) {
    return next(createError(502, `Could not reach WAHA at ${wahaBaseUrl}: ${err.message}. Is WAHA running and publicly accessible?`));
  }
});

// ─── GET /api/v1/admin/test-sheets ───────────────────────────────────────────
// Fires a real test upsert to Google Sheets and returns the raw GAS response.
// Use this to verify the GAS deployment is live and returning our JSON shape.
router.get('/test-sheets', async (_req, res, next) => {
  const { env } = await import('../config/env.js');
  const url = env.GOOGLE_SHEETS_URL;
  if (!url) {
    return res.status(500).json({ ok: false, error: 'GOOGLE_SHEETS_URL is not set in environment variables.' });
  }

  const axios = (await import('axios')).default;
  const payload = {
    action: 'upsert',
    type: 'order',
    orderNumber: 'DIAG0001',
    createdAt: new Date().toISOString(),
    customerName: 'Diagnostic Test',
    customerPhone: '+255700000000',
    total: 1,
    deliveryAddress: 'Sheets Connectivity Test',
    status: 'pending_payment',
    lastUpdated: new Date().toISOString(),
  };

  try {
    const gasRes = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
      maxRedirects: 5,
    });
    const body = gasRes.data;
    const ok = typeof body === 'object' && body?.success === true;
    return res.json({
      ok,
      httpStatus: gasRes.status,
      gasResponse: body,
      urlPrefix: url.slice(0, 60) + '…',
      warning: ok ? null : 'GAS returned unexpected shape — deployment is stale. Re-deploy the Apps Script.',
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: err.message,
      httpStatus: err.response?.status ?? 'network',
      gasResponse: err.response?.data ?? null,
    });
  }
});

export default router;
