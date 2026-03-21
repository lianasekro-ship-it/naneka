/**
 * Textbee SMS gateway service.
 *
 * Self-hosted Textbee Android gateway sends SMS notifications.
 * Used as a fallback when WhatsApp delivery fails or the WAHA session is down.
 *
 * All phone numbers must be E.164 format: +255712345678
 * Use normalizePhone() from whatsapp.js if the number needs normalising first.
 *
 * Textbee REST API:
 *   POST /api/v1/gateway/devices/:deviceId/send-sms
 *   Body: { recipients: ["+255..."], message: "..." }
 */

import axios from 'axios';
import { env } from '../../config/env.js';

const client = axios.create({
  baseURL: env.TEXTBEE_BASE_URL,
  headers: {
    'x-api-key': env.TEXTBEE_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

// ─── Core send ────────────────────────────────────────────────────────────────

/**
 * Sends an SMS via the Textbee Android gateway.
 *
 * @param {string} to       Recipient phone in E.164 format (+255712345678)
 * @param {string} message  SMS body — keep under 160 chars for a single segment
 * @returns {Promise<void>}
 */
export async function sendSms(to, message) {
  await client.post(
    `/api/v1/gateway/devices/${env.TEXTBEE_DEVICE_ID}/send-sms`,
    { recipients: [to], message }
  );
}

// ─── Notification templates ───────────────────────────────────────────────────

/**
 * Sends a concise order confirmation SMS after payment is verified.
 * Kept under 160 characters to avoid multi-part SMS charges.
 *
 * @param {{
 *   phone: string,
 *   orderId: string,
 *   total: string,
 *   currency: string,
 * }} order
 * @returns {Promise<void>}
 */
export async function sendOrderConfirmationSms(order) {
  const shortId = order.orderId.slice(0, 8).toUpperCase();
  const trackingUrl = `${env.FRONTEND_URL}/track/${order.orderId}`;

  // Single SMS segment target: ≤160 chars
  const message =
    `Naneka: Order #${shortId} confirmed. ` +
    `${order.currency} ${Number(order.total).toLocaleString()}. ` +
    `Track: ${trackingUrl}`;

  await sendSms(order.phone, message);
}
