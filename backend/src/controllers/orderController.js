/**
 * orderController.js
 *
 * All order business logic lives here.
 * The route file (routes/orders.js) is a thin mapping of HTTP verbs → these handlers.
 *
 * Data flow for every write:
 *   1. Save to data/orders.json  ← PRIMARY (always succeeds, no DB required)
 *   2. Save to PostgreSQL        ← SECONDARY (fire-and-forget; failure is logged, not thrown)
 *   3. Sync to Google Sheets     ← TERTIARY (fire-and-forget; always after local save)
 *
 * Data flow for every read:
 *   1. Read from data/orders.json (fast, offline-capable)
 */

import { randomUUID } from 'crypto';
import { z }          from 'zod';

import { env }         from '../config/env.js';
import { createError } from '../middleware/errorHandler.js';

import { isLocationDeliverable, validateDeliveryCoords } from '../services/geo/geofence.js';
import { generateTxRef, initiatePayment }                from '../services/payments/flutterwave.js';
import { pollAndUpdateDeliveryPosition }                 from '../services/logistics/traccar.js';

import {
  createOrder          as dbCreateOrder,
  findOrderById        as dbFindById,
  findOrderByShortCode as dbFindByCode,
  updateOrderStatus    as dbUpdateStatus,
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
  paymentMethod:    z.enum(['mobile_money', 'card']),
  subtotal:         z.number().positive(),
  deliveryFee:      z.number().min(0),
  total:            z.number().positive(),
  currency:         z.string().length(3).default('TZS'),
  notes:            z.string().max(500).optional(),
  deliveryZoneId:   z.string().uuid().optional(),
});

const VALID_STATUSES = [
  'pending_payment', 'paid', 'processing', 'out_for_delivery', 'delivered', 'cancelled',
];

const UUID_RE     = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_NO_RE = /^[0-9a-f]{8}$/i;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolve a full UUID or 8-char order code to an order object.
 * Checks localStore first (fast, no DB round-trip needed).
 */
async function resolveOrder(idOrCode) {
  if (UUID_RE.test(idOrCode)) {
    const local = await localGetById(idOrCode);
    if (local) return local;
    return dbFindById(idOrCode).catch(() => null);
  }
  if (ORDER_NO_RE.test(idOrCode)) {
    const local = await localGetByCode(idOrCode);
    if (local) return local;
    return dbFindByCode(idOrCode).catch(() => null);
  }
  return null;
}

// ─── GET /api/v1/orders ───────────────────────────────────────────────────────
/**
 * List all orders (admin view). Reads from localStore — no DB required.
 */
export async function listOrders(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? '1',   10));
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '100', 10)));
    const offset = (page - 1) * limit;

    const all    = await readOrders();        // newest-first from localStore
    const sliced = all.slice(offset, offset + limit);

    return res.status(200).json({
      orders:     sliced,
      pagination: { page, limit, total: all.length, pages: Math.ceil(all.length / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/v1/orders/pending ───────────────────────────────────────────────
/**
 * Orders the driver needs to act on. Only returns actionable statuses:
 * pending_payment, paid, processing, out_for_delivery.
 */
export async function listPendingOrders(req, res, next) {
  try {
    const orders = await readPendingOrders();
    return res.status(200).json({ orders, total: orders.length });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/v1/orders ──────────────────────────────────────────────────────
/**
 * Create a new order.
 * Step 1: Save to localStore (ALWAYS succeeds — this is the primary record).
 * Step 2: Try DB write (fire-and-forget — DB down must not fail the customer).
 * Step 3: Generate payment link.
 * Step 4: Sync to Google Sheets (fire-and-forget).
 */
export async function createOrder(req, res, next) {
  try {
    // 1. Validate input
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(400, parsed.error.issues.map(i => i.message).join('; ')));
    }
    const body = parsed.data;

    // 2a. Fast synchronous geofence pre-check (no DB required)
    if (!isLocationDeliverable(body.latitude, body.longitude)) {
      return next(createError(422,
        "Sorry, we don't deliver to your area yet. " +
        'We currently serve central Dar es Salaam, Masaki, and Kigamboni.'
      ));
    }

    // 2b. Authoritative PostGIS zone check — skip gracefully if DB is down
    let zone = null;
    try {
      zone = await validateDeliveryCoords(body.latitude, body.longitude);
    } catch {
      console.warn('[orders] PostGIS zone check skipped — DB unavailable, using sync pre-check only.');
    }

    // 3. Build the order object
    const orderId = randomUUID();
    const txRef   = generateTxRef(orderId);
    const now     = new Date().toISOString();

    const order = {
      id:                  orderId,
      customer_name:       body.customerName,
      customer_phone:      body.customerPhone,
      customer_email:      body.customerEmail      ?? null,
      customer_whatsapp:   body.customerWhatsapp   ?? null,
      delivery_address:    body.deliveryAddress,
      delivery_zone_id:    body.deliveryZoneId ?? zone?.id ?? null,
      status:              'pending_payment',
      payment_method:      body.paymentMethod,
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

    // 4. ── PRIMARY WRITE — save to local JSON file ────────────────────────────
    await saveOrder(order);
    console.log(`[orders] ✓ Saved order ${orderId} to local store (data/orders.json)`);

    // 5. ── SECONDARY WRITE — PostgreSQL (fire-and-forget) ────────────────────
    dbCreateOrder({
      id:               orderId,
      customerName:     body.customerName,
      customerPhone:    body.customerPhone,
      customerEmail:    body.customerEmail,
      customerWhatsapp: body.customerWhatsapp,
      deliveryAddress:  body.deliveryAddress,
      latitude:         body.latitude,
      longitude:        body.longitude,
      deliveryZoneId:   body.deliveryZoneId ?? zone?.id,
      paymentMethod:    body.paymentMethod,
      subtotal:         body.subtotal,
      deliveryFee:      body.deliveryFee,
      total:            body.total,
      currency:         body.currency,
      notes:            body.notes,
      txRef,
    }).then(() => {
      console.log(`[orders] ✓ Order ${orderId} also written to PostgreSQL.`);
    }).catch(err => {
      console.warn(`[orders] ⚠ DB write skipped for order ${orderId} (local store is the record): ${err.message}`);
    });

    // 6. Generate payment link
    let paymentLink;
    if (env.NODE_ENV === 'development') {
      paymentLink = `${env.FRONTEND_URL}/checkout/payment-result?orderId=${orderId}&dev=true`;
      console.log(`[orders] [dev] Flutterwave skipped — dummy link for order ${orderId}`);
    } else {
      const redirect = `${env.FRONTEND_URL}/checkout/payment-result?orderId=${orderId}`;
      ({ paymentLink } = await initiatePayment({
        orderId,
        amount:        body.total,
        currency:      body.currency,
        customerName:  body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail ?? `${orderId}@orders.naneka.co.tz`,
        txRef,
        redirectUrl:   redirect,
      }));
    }

    // 7. ── TERTIARY WRITE — Google Sheets (fire-and-forget) ──────────────────
    syncToSheets({
      orderNumber:     orderId.slice(0, 8).toUpperCase(),
      createdAt:       order.created_at,
      customerName:    order.customer_name,
      total:           order.total,
      deliveryAddress: order.delivery_address,
      status:          order.status,
    });

    return res.status(201).json({
      orderId,
      txRef,
      paymentLink,
      currency: order.currency,
      total:    order.total,
      status:   order.status,
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
/**
 * Advance an order to a new status.
 * Updates localStore immediately; attempts DB update as fire-and-forget.
 * Re-syncs to Google Sheets when status becomes 'paid'.
 */
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`));
    }

    // Primary update in localStore
    const updated = await localUpdate(req.params.id, { status });
    if (!updated) return next(createError(404, 'Order not found.'));

    // Secondary update in DB (fire-and-forget)
    dbUpdateStatus(req.params.id, status).catch(err => {
      console.warn(`[orders] ⚠ DB status update skipped for ${req.params.id}: ${err.message}`);
    });

    // Re-sync to Sheets when order is marked paid
    if (status === 'paid') {
      syncToSheets({
        orderNumber:     updated.id.slice(0, 8).toUpperCase(),
        createdAt:       updated.created_at,
        customerName:    updated.customer_name,
        total:           updated.total,
        deliveryAddress: updated.delivery_address,
        status:          updated.status,
      });
    }

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}
