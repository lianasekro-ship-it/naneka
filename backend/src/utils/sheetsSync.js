/**
 * sheetsSync.js
 *
 * Pushes order data to Google Sheets via Apps Script web app.
 * UPSERT logic: find by orderNumber → update status; not found → insert new row.
 *
 * The GAS URL is hard-coded as the primary value so this never silently
 * breaks due to a missing / stale environment variable.
 */

import axios from 'axios';

// Hard-coded working GAS deployment URL — confirmed live 2026-03-26.
// env var overrides this if set (allows rotation without a redeploy).
const HARD_CODED_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbxWGkilbCG-v-iKloxmARL92Cze-z3XA13cqX_lS0aautJU5yZTkcv4Nx-R5Hs1vC-vRw/exec';

function getSheetsUrl() {
  const fromEnv = process.env.GOOGLE_SHEETS_URL;
  if (fromEnv && fromEnv.startsWith('https://')) return fromEnv;
  return HARD_CODED_SHEETS_URL;
}

/**
 * Push a newly created product to Google Sheets.
 */
export async function syncProductToSheets(product) {
  const url = getSheetsUrl();
  const payload = {
    type:      'product',
    id:        product.id        ?? '',
    name:      product.name      ?? '',
    category:  product.category  ?? '',
    price:     product.price     ?? 0,
    currency:  product.currency  ?? 'TZS',
    createdAt: product.created_at ?? new Date().toISOString(),
  };

  try {
    await axios.post(url, payload, {
      headers:      { 'Content-Type': 'application/json' },
      timeout:      12000,
      maxRedirects: 5,
    });
    console.log(`[sheetsSync] ✓ Product "${payload.name}" synced`);
  } catch (err) {
    console.error('[sheetsSync] ✗ Product sync failed:', err.message);
  }
}

/**
 * Upsert an order row in Google Sheets.
 *
 * Sheet columns:
 *   A: Order Number  B: Created At   C: Customer Name  D: Phone
 *   E: Total (TZS)   F: Address      G: Status         H: Last Updated
 *
 * @param {{ orderNumber, createdAt, customerName, customerPhone, total, deliveryAddress, status }} order
 */
export async function syncToSheets(order) {
  const url = getSheetsUrl();

  const payload = {
    action:          'upsert',
    type:            'order',
    orderNumber:     String(order.orderNumber ?? '').trim(),
    createdAt:       order.createdAt       ?? new Date().toISOString(),
    customerName:    order.customerName    ?? '',
    customerPhone:   order.customerPhone   ?? '',
    total:           order.total           ?? 0,
    deliveryAddress: order.deliveryAddress ?? '',
    status:          order.status          ?? 'unknown',
    lastUpdated:     new Date().toISOString(),
  };

  if (!payload.orderNumber) {
    console.error('[sheetsSync] ✗ orderNumber is empty — skipping sync');
    return;
  }

  console.log(`[sheetsSync] → POST ${url.slice(0, 80)}… payload=${JSON.stringify(payload)}`);

  try {
    const res = await axios.post(url, payload, {
      headers:      { 'Content-Type': 'application/json' },
      timeout:      12000,
      maxRedirects: 5,
    });

    const body    = res.data;
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    console.log(`[sheetsSync] ← GAS (HTTP ${res.status}): ${bodyStr.slice(0, 300)}`);

    if (typeof body === 'object' && body?.success === true) {
      console.log(`[sheetsSync] ✓ Upserted #${payload.orderNumber} → ${payload.status} (action=${body.action})`);
    } else {
      console.error(`[sheetsSync] ✗ GAS returned unexpected shape — is the Apps Script deployment up to date? Response: ${bodyStr.slice(0, 200)}`);
    }
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data ?? err.message;
    console.error(`[sheetsSync] ✗ Sync failed (HTTP ${status ?? 'network'}): ${JSON.stringify(detail).slice(0, 300)}`);
  }
}
