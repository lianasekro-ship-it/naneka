/**
 * orderController.js
 *
 * Data flow for every WRITE (createOrder):
 *   1. Validate → Geofence → Build order object
 *   2. PRIMARY: write to Supabase via REST — authoritative record
 *   3. FALLBACK (local dev only): if DB unreachable, write to data/orders.json
 *      ── On Vercel (IS_SERVERLESS=true) this fallback is DISABLED because the
 *         filesystem is read-only. A DB failure returns 503 instead.
 *   4. Generate Flutterwave payment link
 *   5. Sync to Google Sheets (fire-and-forget)
 *
 * Data flow for every READ:
 *   1. Try Supabase first (authoritative)
 *   2. Fall back to localStore only in local dev (never on Vercel)
 */

// ── Serverless guard ───────────────────────────────────────────────────────────
// process.env.VERCEL is automatically set on all Vercel deployments.
// Never attempt filesystem reads/writes in that environment.
const IS_SERVERLESS = !!process.env.VERCEL;

import { randomUUID } from 'crypto';
import { z }          from 'zod';

import { env }         from '../config/env.js';
import { createError } from '../middleware/errorHandler.js';

import { isLocationDeliverable, validateDeliveryCoords } from '../services/geo/geofence.js';
import { generateTxRef, initiatePayment }                from '../services/payments/flutterwave.js';
import { pollAndUpdateDeliveryPosition }                 from '../services/logistics/traccar.js';
import { notifyAdminNewOrder }                           from '../services/whatsapp/wahaService.js';

import {
  createOrder          as dbCreateOrder,
  findOrderById        as dbFindById,
  findOrderByShortCode as dbFindByCode,
  updateOrderStatus    as dbUpdateStatus,
  listOrders           as dbListOrders,
  listOrdersByStatuses as dbListByStatuses,
} from '../models/order.js';
import { findDeliveryByOrderId } from '../models/activeDelivery.js';
import { syncToSheets }          from '../utils/sheetsSync.js';
import {
  readOrders,
  readPendingOrders,
  saveOrder,
  updateOrder    as localUpdate,
  getOrderById   as localGetById,
  getOrderByShortCode as localGetByCode,
} from '../utils/localStore.js';

// ─── Validation schema ────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  customerName:     z.string().min(2).max(200),
  customerPhone:    z.string().min(7).max(20),
  customerEmail:    z.string().email().optional(),
  customerWhatsapp: z.string().min(7).max(20).optional(),
  deliveryAddress:  z.string().min(5).max(500),
  latitude:         z.number().min(-90).max(90),
  longitude:        z.number().min(-180).max(180),
  paymentMethod:    z.enum(['mobile_money', 'card', 'whatsapp']),
  subtotal:         z.number().positive(),
  deliveryFee:      z.number().min(0),
  total:            z.number().positive(),
  currency:         z.string().length(3).default('TZS'),
  notes:            z.string().max(500).optional(),
  deliveryZoneId:   z.string().uuid().optional(),
  productName:      z.string().max(300).optional(),
  items:            z.array(z.object({
    id:    z.string().optional(),
    name:  z.string(),
    price: z.number(),
    qty:   z.number().int().positive(),
  })).optional(),
});

const VALID_STATUSES = [
  'pending_payment', 'paid', 'preparing', 'ready_for_pickup',
  'processing', 'out_for_delivery', 'delivered', 'cancelled',
];

/**
 * Returns true only when the Flutterwave secret key is present and looks like
 * a real key (FLWSECK_PROD-... or FLWSECK_TEST-...).
 * Placeholder values ("FLWSECK-xxxx") and missing values both return false,
 * so the payment step falls back gracefully instead of throwing a 401.
 */
function isFlutterwaveConfigured() {
  const key = env.FLUTTERWAVE_SECRET_KEY;
  return typeof key === 'string' && /^FLWSECK_(PROD|TEST)-/.test(key);
}

const UUID_RE     = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_NO_RE = /^[0-9a-f]{8}$/i;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Normalise a DB row into the same flat shape that the localStore produces,
 * so the rest of the codebase can treat both sources identically.
 */
function normaliseDbOrder(row) {
  if (!row) return null;
  return {
    id:                  row.id,
    order_number:        row.order_number,
    customer_name:       row.customer_name,
    customer_phone:      row.customer_phone,
    customer_email:      row.customer_email    ?? null,
    customer_whatsapp:   row.customer_whatsapp ?? null,
    delivery_address:    row.delivery_address,
    delivery_zone_id:    row.delivery_zone_id  ?? null,
    status:              row.status,
    payment_method:      row.payment_method,
    payment_reference:   row.payment_reference ?? null,
    payment_verified_at: row.payment_verified_at ?? null,
    currency:            row.currency,
    subtotal:            parseFloat(row.subtotal),
    delivery_fee:        parseFloat(row.delivery_fee),
    total:               parseFloat(row.total),
    notes:               row.notes ?? null,
    items:               row.items ?? null,
    created_at:          row.created_at,
    updated_at:          row.updated_at,
  };
}

/**
 * Resolve a full UUID or 8-char order code → order object.
 * Tries DB first (authoritative), falls back to localStore.
 */
async function resolveOrder(idOrCode) {
  if (UUID_RE.test(idOrCode)) {
    try {
      const dbRow = await dbFindById(idOrCode);
      if (dbRow) return normaliseDbOrder(dbRow);
    } catch (err) {
      console.warn('[orders] DB lookup failed:', err.message);
      if (IS_SERVERLESS) return null;
    }
    return IS_SERVERLESS ? null : localGetById(idOrCode);
  }
  if (ORDER_NO_RE.test(idOrCode)) {
    try {
      const dbRow = await dbFindByCode(idOrCode);
      if (dbRow) return normaliseDbOrder(dbRow);
    } catch (err) {
      console.warn('[orders] DB lookup failed:', err.message);
      if (IS_SERVERLESS) return null;
    }
    return IS_SERVERLESS ? null : localGetByCode(idOrCode);
  }
  return null;
}

// ─── GET /api/v1/orders ───────────────────────────────────────────────────────
/**
 * List all orders (admin view).
 * Reads from PostgreSQL (primary). Falls back to localStore if DB is down.
 */
export async function listOrders(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? '1',   10));
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '100', 10)));
    const offset = (page - 1) * limit;

    let orders = [];
    let total  = 0;

    try {
      const result = await dbListOrders({ limit, offset });
      orders = (result.rows ?? []).map(normaliseDbOrder);
      total  = result.total ?? orders.length;
    } catch (dbErr) {
      console.warn('[orders] DB list failed:', dbErr.message);
      if (IS_SERVERLESS) throw dbErr; // propagate to 500 handler — no FS on Vercel
      const all = await readOrders();
      total     = all.length;
      orders    = all.slice(offset, offset + limit);
    }

    return res.status(200).json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/v1/orders/pending (Driver App) ──────────────────────────────────
// Only shows orders the driver needs to act on: ready_for_pickup + out_for_delivery
export async function listPendingOrders(req, res, next) {
  try {
    const DRIVER_STATUSES = ['ready_for_pickup', 'out_for_delivery'];
    let orders = [];

    try {
      orders = (await dbListByStatuses(DRIVER_STATUSES)).map(normaliseDbOrder);
    } catch (dbErr) {
      if (IS_SERVERLESS) throw dbErr;
      // local dev fallback — filter from local store
      const all = await readPendingOrders();
      orders = all.filter(o => DRIVER_STATUSES.includes(o.status));
    }

    return res.status(200).json({ orders, total: orders.length });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/v1/orders/preparing (Preparer App) ──────────────────────────────
// Shows orders the kitchen/preparer needs to act on: pending_payment, paid, preparing
export async function listPreparerOrders(req, res, next) {
  try {
    const PREPARER_STATUSES = ['pending_payment', 'paid', 'preparing'];
    let orders = [];

    try {
      orders = (await dbListByStatuses(PREPARER_STATUSES)).map(normaliseDbOrder);
    } catch (dbErr) {
      if (IS_SERVERLESS) throw dbErr;
      const all = await readPendingOrders();
      orders = all.filter(o => PREPARER_STATUSES.includes(o.status));
    }

    return res.status(200).json({ orders, total: orders.length });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/v1/orders ──────────────────────────────────────────────────────
/**
 * Create a new order.
 * PRIMARY: PostgreSQL. FALLBACK: localStore (for offline/dev resilience).
 */
export async function createOrder(req, res, next) {
  try {
    // 1. Validate
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(400, parsed.error.issues.map(i => i.message).join('; ')));
    }
    const body = parsed.data;

    // 2a. Synchronous geofence pre-check (no DB needed)
    if (!isLocationDeliverable(body.latitude, body.longitude)) {
      return next(createError(422,
        "Sorry, we don't deliver to your area yet. " +
        'We currently serve central Dar es Salaam, Masaki, and Kigamboni.'
      ));
    }

    // 2b. PostGIS zone check — skip gracefully if DB is down
    let zone = null;
    try {
      zone = await validateDeliveryCoords(body.latitude, body.longitude);
    } catch {
      console.warn('[orders] PostGIS zone check skipped — using sync pre-check only.');
    }

    // 3. Build order
    const orderId = randomUUID();
    const txRef   = generateTxRef(orderId);
    const now     = new Date().toISOString();

    // WhatsApp orders are cash-on-delivery in the DB (the 'whatsapp' value only
    // exists at the API layer to drive the WAHA notification + confirmation page).
    const dbPaymentMethod = body.paymentMethod === 'whatsapp' ? 'cash_on_delivery' : body.paymentMethod;

    const orderPayload = {
      id:               orderId,
      customerName:     body.customerName,
      customerPhone:    body.customerPhone,
      customerEmail:    body.customerEmail,
      customerWhatsapp: body.customerWhatsapp,
      deliveryAddress:  body.deliveryAddress,
      latitude:         body.latitude,
      longitude:        body.longitude,
      deliveryZoneId:   body.deliveryZoneId ?? zone?.id,
      paymentMethod:    dbPaymentMethod,
      subtotal:         body.subtotal,
      deliveryFee:      body.deliveryFee,
      total:            body.total,
      currency:         body.currency,
      notes:            body.notes,
      productName:      body.productName,
      items:            body.items ?? (body.productName ? [{ name: body.productName, price: body.subtotal, qty: 1 }] : null),
      txRef,
    };

    // Flat shape for localStore (matches column names)
    const orderFlat = {
      id:                  orderId,
      customer_name:       body.customerName,
      customer_phone:      body.customerPhone,
      customer_email:      body.customerEmail      ?? null,
      customer_whatsapp:   body.customerWhatsapp   ?? null,
      delivery_address:    body.deliveryAddress,
      delivery_zone_id:    body.deliveryZoneId ?? zone?.id ?? null,
      status:              'pending_payment',
      payment_method:      dbPaymentMethod,
      payment_reference:   txRef,
      payment_verified_at: null,
      currency:            body.currency,
      subtotal:            body.subtotal,
      delivery_fee:        body.deliveryFee,
      total:               body.total,
      notes:               body.notes ?? null,
      created_at:          now,
      updated_at:          now,
    };

    // 4. PRIMARY WRITE — Supabase REST
    let savedViaDb = false;
    try {
      await dbCreateOrder(orderPayload);
      savedViaDb = true;
      console.log(`[orders] ✓ Order ${orderId} written to Supabase.`);
    } catch (dbErr) {
      console.error(`[orders] ✗ DB write failed for ${orderId}: ${dbErr.message}`);
      if (IS_SERVERLESS) {
        // Vercel filesystem is read-only — cannot fall back to localStore.
        // Return 503 so the customer knows to retry rather than losing their order silently.
        return next(createError(503, 'Our order system is temporarily unavailable. Please try again in a moment.'));
      }
    }

    // 5. FALLBACK WRITE — localStore (local dev only, never on Vercel)
    if (!IS_SERVERLESS) {
      if (!savedViaDb) {
        await saveOrder(orderFlat);
        console.log(`[orders] ✓ Order ${orderId} saved to localStore (DB was unavailable).`);
        console.warn(`[orders] ⚠ Order ${orderId} exists only in localStore. Check DB connection.`);
      } else {
        // Mirror to localStore in background for dev convenience — non-blocking
        saveOrder(orderFlat).catch(() => {});
      }
    }

    // 6. WhatsApp admin notification
    // Awaited so Vercel doesn't kill the lambda before the WAHA HTTP request
    // completes. Errors are caught inside notifyAdminNewOrder — never propagates.
    await notifyAdminNewOrder({
      orderId,
      customerName:    body.customerName,
      customerPhone:   body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      paymentMethod:   body.paymentMethod,
      subtotal:        body.subtotal,
      deliveryFee:     body.deliveryFee,
      total:           body.total,
      currency:        body.currency,
      productName:     body.productName,
      notes:           body.notes,
    });

    // 7. Generate payment link (or WhatsApp confirmation redirect)
    let paymentLink;
    const confirmUrl = `${env.FRONTEND_URL}/order-confirmed?orderId=${orderId}`;
    const paymentRedirect = `${env.FRONTEND_URL}/checkout/payment-result?orderId=${orderId}`;

    if (body.paymentMethod === 'whatsapp') {
      // WhatsApp orders skip Flutterwave — redirect straight to the thank-you page.
      paymentLink = confirmUrl;
      console.log(`[orders] WhatsApp order ${orderId} — skipping Flutterwave, redirecting to /order-confirmed`);
    } else if (env.NODE_ENV === 'development' || !isFlutterwaveConfigured()) {
      // Dev mode OR Flutterwave keys not yet configured → passthrough link.
      paymentLink = `${paymentRedirect}&dev=true`;
      if (!isFlutterwaveConfigured()) {
        console.warn('[orders] Flutterwave key not configured — returning passthrough payment link. Set FLUTTERWAVE_SECRET_KEY in Vercel to enable live payments.');
      } else {
        console.log(`[orders] [dev] Flutterwave skipped — dummy link for order ${orderId}`);
      }
    } else {
      ({ paymentLink } = await initiatePayment({
        orderId,
        amount:        body.total,
        currency:      body.currency,
        customerName:  body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail ?? `${orderId}@orders.naneka.co.tz`,
        txRef,
        redirectUrl:   paymentRedirect,
      }));
    }

    // 7. Sheets sync (fire-and-forget)
    syncToSheets({
      orderNumber:     orderId.slice(0, 8).toUpperCase(),
      createdAt:       orderFlat.created_at,
      customerName:    orderFlat.customer_name,
      total:           orderFlat.total,
      deliveryAddress: orderFlat.delivery_address,
      status:          orderFlat.status,
    });

    return res.status(201).json({
      orderId,
      txRef,
      paymentLink,
      currency: body.currency,
      total:    body.total,
      status:   'pending_payment',
      ...(env.NODE_ENV === 'development' && { _dev: 'Payment step skipped in development mode' }),
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/v1/orders/:id ───────────────────────────────────────────────────
export async function getOrder(req, res, next) {
  try {
    const order = await resolveOrder(req.params.id);
    if (!order) return next(createError(404, 'Order not found.'));
    return res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/v1/orders/:id/track ────────────────────────────────────────────
export async function trackOrder(req, res, next) {
  try {
    const order = await resolveOrder(req.params.id);
    if (!order) return next(createError(404, 'Order not found.'));

    const trackable = ['processing', 'out_for_delivery'];
    if (!trackable.includes(order.status)) {
      return res.status(200).json({
        orderId:  req.params.id,
        status:   order.status,
        tracking: null,
        message:  order.status === 'delivered'
          ? 'Your order has been delivered.'
          : 'Your order has not been dispatched yet. Check back soon.',
      });
    }

    let delivery;
    try {
      delivery = await findDeliveryByOrderId(order.id);
    } catch {
      return next(createError(503, 'Live tracking is temporarily unavailable.'));
    }
    if (!delivery) return next(createError(404, 'No active delivery found for this order.'));

    let position;
    try {
      position = await pollAndUpdateDeliveryPosition(delivery.id);
    } catch (err) {
      console.warn('[track] Traccar poll failed, falling back to cached position:', err.message);
      if (delivery.last_known_coords) {
        const [lng, lat] = delivery.last_known_coords.coordinates;
        position = { latitude: lat, longitude: lng, speed: null };
      } else {
        return next(createError(503, 'Live tracking is temporarily unavailable. Please try again shortly.'));
      }
    }

    return res.status(200).json({
      orderId:  req.params.id,
      status:   order.status,
      tracking: {
        latitude:    position.latitude,
        longitude:   position.longitude,
        speedKmh:    position.speed ?? null,
        lastUpdated: new Date().toISOString(),
        etaMinutes:  delivery.eta_minutes ?? null,
        driver: {
          name:  delivery.driver_name  ?? null,
          phone: delivery.driver_phone ?? null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/v1/orders/:id/status ─────────────────────────────────────────
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`));
    }

    // Primary update in DB
    let updated   = null;
    let dbError   = null;
    try {
      const dbRow = await dbUpdateStatus(req.params.id, status);
      updated = normaliseDbOrder(dbRow);
    } catch (dbErr) {
      dbError = dbErr;
      console.error(`[orders] DB status update failed for ${req.params.id}: ${dbErr.message}`);
    }

    // Mirror update to localStore only in local dev (Vercel FS is read-only)
    const localUpdated = IS_SERVERLESS
      ? null
      : await localUpdate(req.params.id, { status }).catch(() => null);

    // Use whichever succeeded
    const result = updated ?? localUpdated;
    if (!result) {
      // Propagate real DB error so the frontend shows "invalid enum" etc. instead of 404
      if (dbError) return next(createError(500, `Status update failed: ${dbError.message}`));
      return next(createError(404, 'Order not found.'));
    }

    // Sync every status change to Google Sheets
    syncToSheets({
      orderNumber:     result.id.slice(0, 8).toUpperCase(),
      createdAt:       result.created_at,
      customerName:    result.customer_name,
      customerPhone:   result.customer_phone,
      total:           result.total,
      deliveryAddress: result.delivery_address,
      status:          result.status,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
