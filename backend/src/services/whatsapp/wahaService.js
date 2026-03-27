/**
 * wahaService.js
 *
 * Wraps the WAHA (self-hosted WhatsApp HTTP API) REST API.
 * Sends structured order notifications to the Naneka Orders WhatsApp group.
 *
 * Required env vars:
 *   WAHA_BASE_URL   — e.g. http://localhost:3001
 *   WAHA_API_KEY    — WAHA API key (set in WAHA dashboard)
 *   WAHA_SESSION    — session name (default: "default")
 *   WAHA_GROUP_ID   — WhatsApp group chat ID, e.g. "120363xxxxxxxxxx@g.us"
 *
 * To find WAHA_GROUP_ID, start the server with WAHA configured but without
 * WAHA_GROUP_ID set — a helper will log all available groups on the first
 * order notification attempt.
 */

import { env } from '../../config/env.js';

/**
 * Returns true only when all required WAHA env vars are present.
 */
function isWahaConfigured() {
  return (
    typeof env.WAHA_BASE_URL === 'string' && env.WAHA_BASE_URL.startsWith('http') &&
    typeof env.WAHA_API_KEY  === 'string' && env.WAHA_API_KEY !== 'your_waha_api_key'
  );
}

/**
 * Format a number as TZS currency string.
 */
function formatTZS(amount) {
  return `TZS ${Number(amount).toLocaleString('en-TZ')}`;
}

/**
 * Call WAHA API to list all chats and log WhatsApp Groups to help the user
 * find their WAHA_GROUP_ID.  Run this once — remove once group ID is known.
 */
export async function logAvailableGroups() {
  if (!isWahaConfigured()) {
    console.warn('[waha] Cannot list groups — WAHA_BASE_URL / WAHA_API_KEY not set.');
    return;
  }

  try {
    const url = `${env.WAHA_BASE_URL}/api/${env.WAHA_SESSION || 'default'}/chats`;
    const res = await fetch(url, {
      headers: { 'X-Api-Key': env.WAHA_API_KEY },
    });

    if (!res.ok) {
      console.warn(`[waha] listGroups: WAHA returned ${res.status} — is WAHA running and the session active?`);
      return;
    }

    const chats = await res.json();
    const groups = (Array.isArray(chats) ? chats : chats.chats ?? [])
      .filter(c => (c.id || '').endsWith('@g.us'));

    if (groups.length === 0) {
      console.warn('[waha] No WhatsApp groups found. Make sure the WAHA session is connected and the phone is in at least one group.');
      return;
    }

    console.log('\n[waha] ══════════════ WhatsApp Groups (pick one for WAHA_GROUP_ID) ══════════════');
    for (const g of groups) {
      console.log(`  Group ID : ${g.id}`);
      console.log(`  Name     : ${g.name ?? g.subject ?? '(unnamed)'}`);
      console.log('  ─────────────────────────────────────────────────────────────────────────');
    }
    console.log('[waha] Set WAHA_GROUP_ID=<id> in your .env / Vercel env vars, then restart.\n');
  } catch (err) {
    console.error('[waha] logAvailableGroups error:', err.message);
  }
}

/**
 * Send a plain-text WhatsApp message via WAHA.
 *
 * @param {string} chatId  - WAHA chat ID ("120363xxx@g.us" for a group, or "255712345678@c.us" for DM)
 * @param {string} text    - Message body (supports *bold* markdown)
 */
async function sendMessage(chatId, text) {
  const url = `${env.WAHA_BASE_URL}/api/sendText`;
  const body = {
    session: env.WAHA_SESSION || 'default',
    chatId,
    text,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  let res;
  try {
    res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key':    env.WAHA_API_KEY,
      },
      body:   JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`WAHA sendText failed [${res.status}]: ${detail}`);
  }
}

/**
 * Send a structured new-order notification to the Naneka Orders WhatsApp group.
 *
 * Prefers WAHA_GROUP_ID (group chat). Falls back to WAHA_ADMIN_PHONE (DM) so
 * existing deployments keep working while WAHA_GROUP_ID is being set up.
 *
 * Errors are caught and logged — never propagated to the caller.
 *
 * @param {object} order
 * @param {string} order.orderId
 * @param {string} order.customerName
 * @param {string} order.customerPhone
 * @param {string} order.deliveryAddress
 * @param {string} order.paymentMethod
 * @param {number} order.subtotal
 * @param {number} order.deliveryFee
 * @param {number} order.total
 * @param {string} order.currency
 * @param {string} [order.productName]
 * @param {string} [order.notes]
 */
export async function notifyAdminNewOrder(order) {
  if (!isWahaConfigured()) {
    console.warn('[waha] Skipping WhatsApp notification — WAHA not configured. Set WAHA_BASE_URL and WAHA_API_KEY.');
    return;
  }

  // ── Resolve target chat ID ─────────────────────────────────────────────────
  let targetChatId;

  if (env.WAHA_GROUP_ID && env.WAHA_GROUP_ID.trim().length > 0) {
    // Primary: send to the Naneka Orders group
    targetChatId = env.WAHA_GROUP_ID.trim();
  } else if (env.WAHA_ADMIN_PHONE && env.WAHA_ADMIN_PHONE.startsWith('+')) {
    // Legacy fallback: DM to admin phone (causes self-chat if phone === session phone)
    targetChatId = `${env.WAHA_ADMIN_PHONE.replace(/^\+/, '')}@c.us`;
    console.warn('[waha] WAHA_GROUP_ID not set — falling back to WAHA_ADMIN_PHONE DM. Set WAHA_GROUP_ID to avoid self-chat issues.');
    // Discovery helper — log available groups so the user can pick the right one
    logAvailableGroups().catch(() => {});
  } else {
    console.warn('[waha] Neither WAHA_GROUP_ID nor WAHA_ADMIN_PHONE is configured. Notification skipped.');
    return;
  }

  // ── Build message ──────────────────────────────────────────────────────────
  const orderNumber = order.orderId.slice(0, 8).toUpperCase();
  const product     = order.productName ?? 'N/A';
  const payment     = order.paymentMethod === 'whatsapp' ? 'WhatsApp (COD)'
                    : order.paymentMethod === 'mobile_money' ? 'Mobile Money'
                    : 'Card';

  const message = [
    `🛒 *New Naneka Order — #${orderNumber}*`,
    '',
    `👤 *Customer:* ${order.customerName}`,
    `📞 *Phone:* ${order.customerPhone}`,
    `📦 *Product:* ${product}`,
    `💰 *Price:* ${formatTZS(order.subtotal)}`,
    `🚚 *Delivery Fee:* ${formatTZS(order.deliveryFee)}`,
    `💵 *Total:* ${formatTZS(order.total)}`,
    `💳 *Payment:* ${payment}`,
    `📍 *Address:* ${order.deliveryAddress}`,
    order.notes ? `📝 *Notes:* ${order.notes}` : null,
    '',
    `🔗 Preparer Queue → https://naneka.co.tz/preparer`,
  ].filter(line => line !== null).join('\n');

  try {
    await sendMessage(targetChatId, message);
    console.log(`[waha] ✓ Order #${orderNumber} notification sent to ${targetChatId}.`);
  } catch (err) {
    console.error(`[waha] ✗ Failed to send WhatsApp notification for order #${orderNumber}: ${err.message}`);
  }
}
