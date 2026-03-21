/**
 * Sales analytics routes — all reads come from data/orders.json (localStore).
 *
 * GET /api/v1/admin/sales/summary               Revenue, COGS, Margin, Tax
 * GET /api/v1/admin/sales/chart?period=          daily | weekly | monthly data points
 * GET /api/v1/admin/sales/top-products           Top products by revenue potential
 */

import { Router } from 'express';
import { readOrders }  from '../utils/localStore.js';
import { listProducts } from '../models/product.js';

const router = Router();

// Statuses that count as recognised revenue
const REVENUE_STATUSES = new Set(['paid', 'processing', 'out_for_delivery', 'delivered']);

// Tanzania VAT: 18 % inclusive. Tax portion of a VAT-inclusive price = price × 18/118.
const VAT_RATE     = 18;
const VAT_FRACTION = VAT_RATE / (100 + VAT_RATE);

// Assumed gross margin when cost_price is unknown (luxury retail heuristic: 40% margin)
const DEFAULT_MARGIN = 0.40;

// ── Helpers ───────────────────────────────────────────────────────────────────

function revenueOrders(orders) {
  return orders.filter(o => REVENUE_STATUSES.has(o.status));
}

function isoWeekMonday(d) {
  const copy = new Date(d);
  const day  = copy.getDay();                          // 0=Sun
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy.toISOString().slice(0, 10);
}

function groupByPeriod(orders, period) {
  const groups = {};
  for (const o of revenueOrders(orders)) {
    const d = new Date(o.created_at);
    const key =
      period === 'daily'   ? d.toISOString().slice(0, 10) :
      period === 'weekly'  ? isoWeekMonday(d)             :
      /* monthly */          d.toISOString().slice(0, 7);
    if (!groups[key]) groups[key] = { date: key, revenue: 0, orders: 0 };
    groups[key].revenue += parseFloat(o.total ?? 0);
    groups[key].orders  += 1;
  }
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}

/** Fill in missing dates so the chart has no gaps. */
function fillGaps(points, period, n) {
  if (points.length === 0) return [];
  const result   = [];
  const last     = new Date();
  const advance  = (d) => {
    const copy = new Date(d);
    if (period === 'daily')   copy.setDate(copy.getDate() + 1);
    if (period === 'weekly')  copy.setDate(copy.getDate() + 7);
    if (period === 'monthly') copy.setMonth(copy.getMonth() + 1);
    return copy;
  };

  // Generate the last N date keys
  const keys = [];
  let cursor = new Date(last);
  for (let i = 0; i < n; i++) {
    const key =
      period === 'daily'   ? cursor.toISOString().slice(0, 10) :
      period === 'weekly'  ? isoWeekMonday(cursor)             :
      /* monthly */          cursor.toISOString().slice(0, 7);
    keys.unshift(key);
    if (period === 'daily')   cursor.setDate(cursor.getDate() - 1);
    if (period === 'weekly')  cursor.setDate(cursor.getDate() - 7);
    if (period === 'monthly') cursor.setMonth(cursor.getMonth() - 1);
  }

  const map = Object.fromEntries(points.map(p => [p.date, p]));
  for (const key of keys) {
    result.push(map[key] ?? { date: key, revenue: 0, orders: 0 });
  }
  return result;
}

function formatLabel(key, period) {
  if (period === 'monthly') {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
  }
  if (period === 'weekly') {
    const d = new Date(key);
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short' });
  }
  // daily
  const d = new Date(key);
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric' });
}

// ── GET /api/v1/admin/sales/summary ──────────────────────────────────────────

router.get('/summary', async (_req, res, next) => {
  try {
    const orders    = await readOrders();
    const paid      = revenueOrders(orders);

    const revenue   = paid.reduce((s, o) => s + parseFloat(o.total ?? 0), 0);
    const tax       = revenue * VAT_FRACTION;
    const revenueEx = revenue - tax;                         // ex-VAT revenue
    const cogs      = revenueEx * (1 - DEFAULT_MARGIN);
    const margin    = revenueEx - cogs;

    const today     = new Date().toISOString().slice(0, 10);
    const todayRevenue = paid
      .filter(o => o.created_at?.slice(0, 10) === today)
      .reduce((s, o) => s + parseFloat(o.total ?? 0), 0);

    const weekAgo  = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekRevenue = paid
      .filter(o => new Date(o.created_at) >= weekAgo)
      .reduce((s, o) => s + parseFloat(o.total ?? 0), 0);

    return res.json({
      currency:       'TZS',
      total_orders:   orders.length,
      paid_orders:    paid.length,
      revenue,
      revenue_ex_vat: Math.round(revenueEx),
      cogs:           Math.round(cogs),
      margin:         Math.round(margin),
      margin_pct:     revenueEx > 0 ? ((margin / revenueEx) * 100).toFixed(1) : '0.0',
      tax,
      tax_rate:       VAT_RATE,
      today_revenue:  todayRevenue,
      week_revenue:   weekRevenue,
      cogs_note:      `COGS estimated at ${((1 - DEFAULT_MARGIN) * 100).toFixed(0)}% of ex-VAT revenue. Add cost_price to products for accurate figures.`,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/admin/sales/chart ─────────────────────────────────────────────

router.get('/chart', async (req, res, next) => {
  try {
    const period = ['daily', 'weekly', 'monthly'].includes(req.query.period)
      ? req.query.period : 'daily';
    const n      = period === 'daily' ? 14 : period === 'weekly' ? 12 : 12;

    const orders = await readOrders();
    const raw    = groupByPeriod(orders, period);
    const filled = fillGaps(raw, period, n);
    const points = filled.map(p => ({ ...p, label: formatLabel(p.date, period) }));

    return res.json({ period, points });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/admin/sales/top-products ──────────────────────────────────────

router.get('/top-products', async (_req, res, next) => {
  try {
    let products = [];
    try {
      const result = await listProducts({ limit: 100, includeInactive: false });
      products = result.products ?? [];
    } catch {
      // DB unavailable — return empty list
    }

    // Sort by price DESC as a proxy for revenue potential (no order_items table yet)
    const top = products
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      .slice(0, 10)
      .map(p => ({
        id:             p.id,
        name:           p.name,
        sku:            p.sku ?? null,
        price:          parseFloat(p.price),
        cost_price:     p.cost_price ? parseFloat(p.cost_price) : null,
        stock_qty:      p.stock_qty,
        category:       p.category_name,
        subcategory:    p.subcategory_name,
        currency:       p.currency,
      }));

    return res.json({ top_products: top, note: 'Ranked by price (order-item tracking coming in v2)' });
  } catch (err) {
    next(err);
  }
});

export default router;
