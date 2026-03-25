/**
 * Order model — thin data-access layer for the orders table.
 *
 * Uses @supabase/supabase-js (HTTPS REST) instead of a direct pg connection so
 * it works from GitHub Codespaces where the direct Supabase host is IPv6-only.
 *
 * Valid statuses: pending_payment | paid | processing | out_for_delivery | delivered | cancelled
 */

import { supabase } from '../config/supabase.js';

function throwIfError(error, context) {
  if (error) {
    throw new Error(`[order.js] ${context}: ${error.message} (code: ${error.code})`);
  }
}

export async function createOrder(data) {
  const { data: row, error } = await supabase
    .from('orders')
    .insert({
      id:                data.id,
      order_number:      data.id.slice(0, 8).toUpperCase(),
      customer_name:     data.customerName,
      customer_phone:    data.customerPhone,
      customer_whatsapp: data.customerWhatsapp   ?? null,
      delivery_address:  data.deliveryAddress,
      // PostgREST accepts EWKT for geography columns
      delivery_coords:   `SRID=4326;POINT(${data.longitude} ${data.latitude})`,
      delivery_zone_id:  data.deliveryZoneId     ?? null,
      status:            'pending_payment',
      payment_method:    data.paymentMethod,
      payment_reference: data.txRef              ?? null,
      currency:          data.currency           ?? 'TZS',
      subtotal:          data.subtotal,
      delivery_fee:      data.deliveryFee,
      total:             data.total,
      notes:             data.notes              ?? null,
    })
    .select()
    .single();

  throwIfError(error, 'createOrder');
  return row;
}

export async function findOrderById(id) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  throwIfError(error, 'findOrderById');
  return data ?? null;
}

export async function findOrderByShortCode(shortCode) {
  const code = shortCode.toUpperCase();

  // Primary: query pre-computed order_number column (set on every new order).
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', code)
    .maybeSingle();

  throwIfError(error, 'findOrderByShortCode');
  if (data) return data;

  // Fallback: scan recent orders for any with NULL order_number and match by id prefix.
  // This handles orders created before order_number was being written.
  const { data: rows, error: err2 } = await supabase
    .from('orders')
    .select('*')
    .is('order_number', null)
    .order('created_at', { ascending: false })
    .limit(500);

  throwIfError(err2, 'findOrderByShortCode (fallback)');
  return rows?.find(r => r.id.toUpperCase().startsWith(code)) ?? null;
}

export async function findOrderByTxRef(txRef) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_reference', txRef)
    .maybeSingle();

  throwIfError(error, 'findOrderByTxRef');
  return data ?? null;
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  throwIfError(error, 'updateOrderStatus');
  return data ?? null;
}

/**
 * List all orders, newest first, with pagination.
 * Returns { rows, total } to match the previous pg shape.
 */
export async function listOrders({ limit = 100, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  throwIfError(error, 'listOrders');
  return { rows: data ?? [], total: count ?? 0 };
}

export async function markOrderPaid(id, _flutterwaveTransactionId) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      status:              'paid',
      payment_verified_at: new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  throwIfError(error, 'markOrderPaid');
  return data ?? null;
}
