/**
 * Order model — thin DB query layer for the orders table.
 *
 * Valid statuses: pending_payment | paid | processing | out_for_delivery | delivered | cancelled
 *
 * Spatial note: delivery_coords is GEOGRAPHY(POINT, 4326).
 *   Insert uses ST_SetSRID(ST_MakePoint($lng, $lat), 4326).
 *   ST_MakePoint takes (longitude, latitude) — X then Y.
 */

import { query } from '../config/db.js';

export async function createOrder(data) {
  const result = await query(
    `INSERT INTO orders (
       id,
       customer_name,
       customer_phone,
       customer_whatsapp,
       delivery_address,
       delivery_coords,
       delivery_zone_id,
       status,
       payment_method,
       payment_reference,
       currency,
       subtotal,
       delivery_fee,
       total,
       notes
     ) VALUES (
       $1, $2, $3, $4, $5,
       ST_SetSRID(ST_MakePoint($7, $6), 4326),
       $8, 'pending_payment', $9, $10, $11, $12, $13, $14, $15
     )
     RETURNING *`,
    [
      data.id,
      data.customerName,
      data.customerPhone,
      data.customerWhatsapp   ?? null,
      data.deliveryAddress,
      data.latitude,          // $6
      data.longitude,         // $7  — MakePoint(lng, lat)
      data.deliveryZoneId     ?? null,
      data.paymentMethod,
      data.txRef,
      data.currency           ?? 'TZS',
      data.subtotal,
      data.deliveryFee,
      data.total,
      data.notes              ?? null,
    ]
  );
  return result.rows[0];
}

export async function findOrderById(id) {
  const result = await query(
    'SELECT * FROM orders WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function findOrderByShortCode(shortCode) {
  // The short code is the first 8 hex chars of the UUID, uppercased.
  // Uses the computed expression so this works on the base schema without
  // requiring migration 006 (which adds an indexed order_number column).
  const result = await query(
    `SELECT * FROM orders WHERE UPPER(LEFT(id::text, 8)) = $1 LIMIT 1`,
    [shortCode.toUpperCase()]
  );
  return result.rows[0] ?? null;
}

export async function findOrderByTxRef(txRef) {
  const result = await query(
    'SELECT * FROM orders WHERE payment_reference = $1',
    [txRef]
  );
  return result.rows[0] ?? null;
}

export async function updateOrderStatus(id, status) {
  const result = await query(
    `UPDATE orders
     SET    status     = $1,
            updated_at = NOW()
     WHERE  id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] ?? null;
}

export async function markOrderPaid(id, flutterwaveTransactionId) {
  const result = await query(
    `UPDATE orders
     SET    status               = 'paid',
            payment_verified_at  = NOW(),
            updated_at           = NOW()
     WHERE  id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}
