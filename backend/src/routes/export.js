/**
 * Data export routes — CSV downloads for admin use.
 *
 * GET /api/v1/admin/export/customers     Name, Phone, WhatsApp, Address (from orders)
 * GET /api/v1/admin/export/inventory     SKU, Name, Category, Price, Cost, Stock
 * GET /api/v1/admin/export/sales         Orders in date range (from=YYYY-MM-DD&to=YYYY-MM-DD)
 */

import { Router } from 'express';
import { readOrders }  from '../utils/localStore.js';
import { listProducts } from '../models/product.js';

const router = Router();

// ── CSV helper ────────────────────────────────────────────────────────────────

function escape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if it contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows, headers) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\r\n');
}

function sendCSV(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

// ── GET /api/v1/admin/export/customers ────────────────────────────────────────

router.get('/customers', async (_req, res, next) => {
  try {
    const orders = await readOrders();

    // De-duplicate by phone number; keep most recent occurrence
    const seen = new Map();
    for (const o of orders) {
      seen.set(o.customer_phone, o);
    }

    const rows = [...seen.values()].map(o => [
      o.customer_name,
      o.customer_phone,
      o.customer_whatsapp ?? '',
      o.customer_email    ?? '',
      o.delivery_address,
    ]);

    const csv = toCSV(rows, ['Name', 'Phone', 'WhatsApp', 'Email', 'Delivery Address']);
    sendCSV(res, `naneka-customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/admin/export/inventory ────────────────────────────────────────

router.get('/inventory', async (_req, res, next) => {
  try {
    let products = [];
    try {
      const result = await listProducts({ limit: 1000, includeInactive: true });
      products = result.products ?? [];
    } catch {
      // DB unavailable — return empty CSV with headers only
    }

    const rows = products.map(p => [
      p.sku            ?? '',
      p.name,
      p.category_name  ?? '',
      p.subcategory_name ?? '',
      p.brand          ?? '',
      parseFloat(p.price),
      p.cost_price     ? parseFloat(p.cost_price) : '',
      p.stock_qty      ?? 0,
      p.currency       ?? 'TZS',
      p.is_active ? 'Yes' : 'No',
    ]);

    const csv = toCSV(rows, [
      'SKU', 'Name', 'Category', 'Subcategory', 'Brand',
      'Price', 'Cost Price', 'Stock Qty', 'Currency', 'Active',
    ]);
    sendCSV(res, `naneka-inventory-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/admin/export/sales?from=YYYY-MM-DD&to=YYYY-MM-DD ─────────────

router.get('/sales', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : null;
    const to   = req.query.to   ? new Date(req.query.to + 'T23:59:59.999Z') : null;

    const orders = await readOrders();

    const filtered = orders.filter(o => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });

    const rows = filtered.map(o => [
      o.id.slice(0, 8).toUpperCase(),
      o.created_at?.slice(0, 10) ?? '',
      o.customer_name,
      o.customer_phone,
      o.status,
      o.payment_method ?? '',
      parseFloat(o.subtotal ?? 0),
      parseFloat(o.delivery_fee ?? 0),
      parseFloat(o.total ?? 0),
      o.currency ?? 'TZS',
    ]);

    const csv = toCSV(rows, [
      'Order #', 'Date', 'Customer', 'Phone', 'Status',
      'Payment Method', 'Subtotal', 'Delivery Fee', 'Total', 'Currency',
    ]);

    const tag = from || to
      ? `${(req.query.from ?? 'all')}-to-${(req.query.to ?? 'all')}`
      : 'all';
    sendCSV(res, `naneka-sales-${tag}.csv`, csv);
  } catch (err) {
    next(err);
  }
});

export default router;
