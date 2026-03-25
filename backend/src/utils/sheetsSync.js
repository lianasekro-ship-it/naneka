/**
 * sheetsSync.js
 *
 * Fire-and-forget utility that pushes order data to a Google Apps Script
 * web app using UPSERT logic:
 *   - If the orderNumber already exists in the sheet → UPDATE status + lastUpdated only
 *   - If it does not exist → INSERT a new row
 *
 * The Apps Script reads the `action: 'upsert'` field to trigger this behaviour.
 * Failures are logged but never thrown — a Sheets outage must never block an order.
 */

import axios from 'axios';
import { env } from '../config/env.js';

const SHEETS_URL = env.GOOGLE_SHEETS_URL;

/**
 * Push a newly created product to Google Sheets.
 */
export async function syncProductToSheets(product) {
  if (!SHEETS_URL) {
    console.warn('[sheetsSync] GOOGLE_SHEETS_URL not set — skipping product sync.');
    return;
  }

  const payload = {
    type:      'product',
    id:        product.id,
    name:      product.name,
    category:  product.category,
    price:     product.price,
    currency:  product.currency,
    createdAt: product.created_at,
  };

  try {
    await axios.post(SHEETS_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      maxRedirects: 5,
    });
    console.log(`[sheetsSync] ✓ Synced product "${payload.name}" (${payload.id})`);
  } catch (err) {
    console.error('[sheetsSync] ✗ Product sync failed:', err.message);
  }
}

/**
 * Upsert an order row in Google Sheets.
 *
 * Sheet columns (set up by Apps Script on first run):
 *   A: Order Number  B: Created At   C: Customer Name  D: Phone
 *   E: Total (TZS)   F: Address      G: Status         H: Last Updated
 *
 * The Apps Script searches column A for `orderNumber`.
 * Match  → updates G (status) + H (lastUpdated) in that row.
 * No match → appends a new row with all fields.
 *
 * @param {{ orderNumber, createdAt, customerName, customerPhone, total, deliveryAddress, status }} order
 */
export async function syncToSheets(order) {
  if (!SHEETS_URL) {
    console.warn('[sheetsSync] GOOGLE_SHEETS_URL not set — order sync skipped. Add it to Vercel env vars.');
    return;
  }

  const payload = {
    action:          'upsert',           // Apps Script key — determines insert vs update
    type:            'order',
    orderNumber:     order.orderNumber,
    createdAt:       order.createdAt       ?? new Date().toISOString(),
    customerName:    order.customerName,
    customerPhone:   order.customerPhone   ?? '',
    total:           order.total,
    deliveryAddress: order.deliveryAddress ?? '',
    status:          order.status,
    lastUpdated:     new Date().toISOString(),
  };

  try {
    const res = await axios.post(SHEETS_URL, payload, {
      headers:      { 'Content-Type': 'application/json' },
      timeout:      12000,
      maxRedirects: 5,      // GAS /exec redirects once before responding
    });
    console.log(`[sheetsSync] ✓ Upserted #${payload.orderNumber} → ${payload.status} (HTTP ${res.status})`);
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data ?? err.message;
    console.error(`[sheetsSync] ✗ Sync failed (HTTP ${status ?? 'network'}): ${JSON.stringify(detail).slice(0, 300)}`);
  }
}
