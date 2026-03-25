/**
 * sheetsSync.js
 *
 * Fire-and-forget utility that pushes order data to a Google Apps Script
 * web app, which appends a row to the connected Google Sheet.
 *
 * Failures are logged but never thrown — a Sheets outage must never
 * block or fail an order.
 */

import axios from 'axios';
import { env } from '../config/env.js';

const SHEETS_URL = env.GOOGLE_SHEETS_URL;

/**
 * Push a newly created product to Google Sheets.
 * Columns sent — must match the Apps Script appendRow order for the Products sheet:
 *   A: id   B: name   C: category   D: price   E: currency   F: createdAt
 *
 * @param {{ id: string, name: string, category: string, price: number, currency: string, created_at: string }} product
 */
export async function syncProductToSheets(product) {
  const payload = {
    type:      'product',
    id:        product.id,
    name:      product.name,
    category:  product.category,
    price:     product.price,
    currency:  product.currency,
    createdAt: product.created_at,
  };

  if (!SHEETS_URL) {
    console.warn('[sheetsSync] GOOGLE_SHEETS_URL is not set — skipping product sync.');
    return;
  }

  try {
    await axios.post(SHEETS_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000,
    });
    console.log(`[sheetsSync] Synced product "${payload.name}" (${payload.id}) to Google Sheets.`);
  } catch (err) {
    console.error('[sheetsSync] Failed to sync product to Google Sheets:', err.message);
  }
}

/**
 * Push an order to Google Sheets.
 * Columns sent — must match the Apps Script appendRow order for the Orders sheet:
 *   A: orderNumber     B: createdAt       C: customerName
 *   D: total           E: deliveryAddress F: status
 *
 * @param {{ orderNumber: string, createdAt: string, customerName: string, total: number, deliveryAddress: string, status: string }} order
 */
export async function syncToSheets(order) {
  const payload = {
    type:            'order',              // Apps Script uses this to route to the Orders sheet
    orderNumber:     order.orderNumber,
    createdAt:       order.createdAt,
    customerName:    order.customerName,
    customerPhone:   order.customerPhone  ?? null,
    total:           order.total,
    deliveryAddress: order.deliveryAddress ?? null,
    status:          order.status,
  };

  if (!SHEETS_URL) {
    console.warn('[sheetsSync] GOOGLE_SHEETS_URL is not set in environment — order sync skipped. Set GOOGLE_SHEETS_URL in Vercel env vars.');
    return;
  }

  try {
    const res = await axios.post(SHEETS_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      maxRedirects: 5, // Google Apps Script exec endpoints redirect once
    });
    console.log(`[sheetsSync] ✓ Synced order ${payload.orderNumber} (status: ${payload.status}) — HTTP ${res.status}`);
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data ?? err.message;
    console.error(`[sheetsSync] ✗ Order sync failed (HTTP ${status ?? 'network'}): ${JSON.stringify(detail).slice(0, 200)}`);
  }
}
