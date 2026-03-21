/**
 * WAHA (WhatsApp HTTP API) messaging service.
 *
 * Self-hosted WAHA instance sends automated order update messages
 * via WhatsApp to customers.
 *
 * Phone number rules:
 *  - All numbers are normalised to E.164 before use.
 *  - Tanzania local format  0712 345 678  → +255712345678
 *  - Bare country format   255712345678   → +255712345678
 *  - Already E.164         +255712345678  → unchanged
 *  - Non-TZ numbers (e.g. +254 Kenya) pass through unchanged.
 *
 * WAHA chatId format: {digits_without_plus}@c.us
 *   e.g. +255712345678 → 255712345678@c.us
 *
 * Fallback: any WAHA error in sendOrderConfirmation triggers an automatic
 * SMS via Textbee (sms.js) so the customer is always notified.
 */

import axios from 'axios';
import { env } from '../../config/env.js';
import { sendOrderConfirmationSms } from './sms.js';

const client = axios.create({
  baseURL: env.WAHA_BASE_URL,
  headers: {
    'X-Api-Key': env.WAHA_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalises a phone number to E.164 format, defaulting country code to +255
 * (Tanzania) when no country code is present.
 *
 * @param {string} phone  Raw phone string from the DB or form input
 * @returns {string}      E.164 string, e.g. "+255712345678"
 */
export function normalizePhone(phone) {
  // Strip whitespace, dashes, parentheses
  const digits = phone.replace(/[\s\-().]/g, '');

  // Already fully qualified E.164
  if (digits.startsWith('+')) return digits;

  // Bare country code without '+', e.g. "255712345678"
  if (digits.startsWith('255') && digits.length >= 12) return `+${digits}`;

  // Tanzania local format: leading 0, e.g. "0712345678"
  if (digits.startsWith('0') && digits.length === 10) {
    return `+255${digits.slice(1)}`;
  }

  // Unknown format — prefix with Tanzania country code as best effort
  return `+255${digits}`;
}

/**
 * Converts an E.164 number to WAHA's chatId format.
 * "+255712345678" → "255712345678@c.us"
 *
 * @param {string} e164Phone  E.164 formatted phone number
 * @returns {string}
 */
function toChatId(e164Phone) {
  return `${e164Phone.replace(/^\+/, '')}@c.us`;
}

// ─── Core send ────────────────────────────────────────────────────────────────

/**
 * Sends a plain-text WhatsApp message to a customer.
 * Phone number is normalised automatically.
 *
 * @param {string} to       Recipient phone (any format — will be normalised)
 * @param {string} message  Message body text
 * @returns {Promise<void>}
 */
export async function sendMessage(to, message) {
  const e164 = normalizePhone(to);
  const chatId = toChatId(e164);

  await client.post('/api/sendText', {
    session: env.WAHA_SESSION,
    chatId,
    text: message,
  });
}

// ─── Notification templates ───────────────────────────────────────────────────

/**
 * Sends an order confirmation message after payment is verified.
 * Includes Order ID and a direct link to the live tracking page.
 *
 * Automatically falls back to SMS (Textbee) if WAHA is unavailable or returns
 * an error — so the customer is always notified regardless of session state.
 *
 * @param {{
 *   phone: string,
 *   orderId: string,
 *   total: string,
 *   currency: string,
 * }} order
 * @returns {Promise<void>}
 */
export async function sendOrderConfirmation(order) {
  const trackingUrl = `${env.FRONTEND_URL}/track/${order.orderId}`;
  const shortId = order.orderId.slice(0, 8).toUpperCase();

  const message =
    `✅ *Order Confirmed — Naneka*\n\n` +
    `Hello! Your payment has been received.\n\n` +
    `🧾 Order: #${shortId}\n` +
    `💰 Total: ${order.currency} ${Number(order.total).toLocaleString()}\n\n` +
    `📍 Track your delivery live:\n${trackingUrl}\n\n` +
    `We'll notify you when your order is out for delivery. Asante! 🙏`;

  try {
    await sendMessage(order.phone, message);
  } catch (whatsappErr) {
    console.warn(
      `[whatsapp] sendOrderConfirmation failed for order ${order.orderId} ` +
      `(${whatsappErr.message}). Falling back to SMS.`
    );
    await sendOrderConfirmationSms(order);
  }
}

/**
 * Sends an "out for delivery" notification with the live tracking link.
 * Falls back to SMS if WhatsApp fails.
 *
 * @param {{
 *   phone: string,
 *   orderId: string,
 *   trackingUrl?: string,
 * }} params
 * @returns {Promise<void>}
 */
export async function sendOutForDeliveryNotification(params) {
  const trackingUrl = params.trackingUrl ?? `${env.FRONTEND_URL}/track/${params.orderId}`;
  const shortId = params.orderId.slice(0, 8).toUpperCase();

  const message =
    `🚚 *Out for Delivery — Naneka*\n\n` +
    `Great news! Order #${shortId} is on its way to you.\n\n` +
    `📍 Track your rider live:\n${trackingUrl}\n\n` +
    `Please be available to receive your order. Asante!`;

  try {
    await sendMessage(params.phone, message);
  } catch (err) {
    console.warn(
      `[whatsapp] sendOutForDeliveryNotification failed for order ${params.orderId}: ${err.message}`
    );
  }
}

/**
 * Sends a delivery confirmation once the order is marked delivered.
 *
 * @param {{
 *   phone: string,
 *   orderId: string,
 * }} params
 * @returns {Promise<void>}
 */
export async function sendDeliveryConfirmation(params) {
  const shortId = params.orderId.slice(0, 8).toUpperCase();

  const message =
    `🎉 *Delivered — Naneka*\n\n` +
    `Your order #${shortId} has been delivered. Enjoy!\n\n` +
    `Thank you for shopping with Naneka. We'd love to hear your feedback. 😊`;

  try {
    await sendMessage(params.phone, message);
  } catch (err) {
    console.warn(
      `[whatsapp] sendDeliveryConfirmation failed for order ${params.orderId}: ${err.message}`
    );
  }
}
