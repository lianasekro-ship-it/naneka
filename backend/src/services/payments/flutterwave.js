/**
 * Flutterwave v3 payment service.
 *
 * Handles:
 *  - Payment initiation (mobile money + cards)
 *  - Transaction verification
 *  - Webhook signature validation
 *  - tx_ref generation and matching
 *
 * tx_ref convention: `${NANEKA}-{orderId}-{Date.now()}`
 *   - Stored on orders.payment_reference at checkout.
 *   - Used as the lookup key when a Mobile Money callback arrives at
 *     POST /webhooks/flutterwave.  Never reuse a tx_ref.
 *
 * East African mobile money support:
 *   Tanzania — M-Pesa (Vodacom), Tigo Pesa, Airtel Money  → mobilemoneytanzania
 *   Kenya    — M-Pesa (Safaricom)                         → mobilemoneykenya
 *   Uganda   — MTN Mobile Money, Airtel Money             → mobilemoneyuganda
 *   Rwanda   — MTN Mobile Money, Airtel Money             → mobilemoneyrwanda
 */

import { createHash, timingSafeEqual } from 'crypto';
import axios from 'axios';
import { env } from '../../config/env.js';
import { findOrderByTxRef, markOrderPaid } from '../../models/order.js';
import { sendOrderConfirmation } from '../messaging/whatsapp.js';
import { sendOrderConfirmationSms } from '../messaging/sms.js';

const BASE_URL = 'https://api.flutterwave.com/v3';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Maps ISO 4217 currency codes to Flutterwave's mobile money payment option keys.
 * Falls back to a generic 'mobilemoney' option if currency is not in this map.
 */
const CURRENCY_TO_PAYMENT_OPTIONS = {
  TZS: 'mobilemoneytanzania,card',
  KES: 'mobilemoneykenya,card',
  UGX: 'mobilemoneyuganda,card',
  RWF: 'mobilemoneyrwanda,card',
  GHS: 'mobilemoneyghana,card',
  ZMW: 'mobilemoneyzambia,card',
};

/**
 * Generates a unique, deterministic tx_ref for an order.
 * Pattern: NANEKA-{orderId}-{timestampMs}
 * @param {string} orderId  UUID of the order
 * @returns {string}
 */
export function generateTxRef(orderId) {
  return `${env.FLUTTERWAVE_TX_REF_PREFIX}-${orderId}-${Date.now()}`;
}

/**
 * Initiates a Mobile Money or card payment via Flutterwave.
 * Returns a hosted payment link — redirect the customer to this URL.
 *
 * @param {{
 *   orderId: string,
 *   amount: number,
 *   currency: string,
 *   customerName: string,
 *   customerPhone: string,
 *   customerEmail: string,
 *   txRef: string,
 *   redirectUrl: string,
 * }} params
 * @returns {Promise<{ paymentLink: string, txRef: string }>}
 */
export async function initiatePayment(params) {
  const {
    orderId,
    amount,
    currency,
    customerName,
    customerPhone,
    customerEmail,
    txRef,
    redirectUrl,
  } = params;

  const paymentOptions = CURRENCY_TO_PAYMENT_OPTIONS[currency] ?? 'mobilemoney,card';

  const payload = {
    tx_ref: txRef,
    amount,
    currency,
    redirect_url: redirectUrl,
    payment_options: paymentOptions,
    customer: {
      email: customerEmail,
      phonenumber: customerPhone,
      name: customerName,
    },
    customizations: {
      title: 'Naneka',
      description: `Payment for order ${orderId}`,
      logo: env.FRONTEND_URL + '/logo.png',
    },
    meta: {
      order_id: orderId,
    },
  };

  const response = await client.post('/payments', payload);

  if (response.data?.status !== 'success' || !response.data?.data?.link) {
    const message = response.data?.message ?? 'Unexpected response from Flutterwave';
    throw new Error(`[flutterwave] initiatePayment failed: ${message}`);
  }

  return {
    paymentLink: response.data.data.link,
    txRef,
  };
}

/**
 * Verifies a transaction by its Flutterwave transaction ID.
 * Called after a redirect or webhook to confirm payment status.
 *
 * @param {string|number} transactionId  Flutterwave's numeric transaction ID
 * @returns {Promise<{
 *   status: string,
 *   txRef: string,
 *   amount: number,
 *   currency: string,
 *   paymentType: string,
 * }>}
 */
export async function verifyTransaction(transactionId) {
  const response = await client.get(`/transactions/${transactionId}/verify`);

  if (response.data?.status !== 'success') {
    const message = response.data?.message ?? 'Unexpected response from Flutterwave';
    throw new Error(`[flutterwave] verifyTransaction failed: ${message}`);
  }

  const data = response.data.data;

  return {
    status: data.status,           // 'successful' | 'failed' | 'pending'
    txRef: data.tx_ref,
    amount: data.amount,
    currency: data.currency,
    paymentType: data.payment_type, // e.g. 'mobilemoney_tanzania', 'card'
  };
}

/**
 * Validates the webhook signature from Flutterwave using a constant-time comparison
 * to prevent timing-based attacks.
 *
 * @param {string} receivedHash  Value of the `verif-hash` request header
 * @returns {boolean}
 */
export function validateWebhookSignature(receivedHash) {
  if (!receivedHash) return false;

  const expected = env.FLUTTERWAVE_WEBHOOK_HASH;

  try {
    const a = Buffer.from(receivedHash, 'utf8');
    const b = Buffer.from(expected, 'utf8');

    // timingSafeEqual requires equal-length buffers; lengths differ → invalid
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Looks up an order by tx_ref, verifies the transaction with Flutterwave,
 * marks it as paid, then notifies the customer via WhatsApp (with SMS fallback).
 *
 * Called from the webhook handler after signature and event-type checks pass.
 *
 * @param {string} txRef
 * @param {string} flutterwaveTransactionId  Flutterwave numeric transaction ID (as string)
 * @returns {Promise<void>}
 */
export async function reconcileByTxRef(txRef, flutterwaveTransactionId) {
  // 1. Find the order
  const order = await findOrderByTxRef(txRef);
  if (!order) {
    throw new Error(`[flutterwave] reconcileByTxRef: no order found for tx_ref=${txRef}`);
  }

  // Guard: skip if already paid (idempotency — Flutterwave may retry webhooks)
  if (order.status === 'paid') {
    return;
  }

  // 2. Verify the transaction directly with Flutterwave
  const verification = await verifyTransaction(flutterwaveTransactionId);

  if (verification.status !== 'successful') {
    throw new Error(
      `[flutterwave] reconcileByTxRef: transaction ${flutterwaveTransactionId} ` +
      `status is "${verification.status}", not "successful"`
    );
  }

  // 3. Sanity-check amount and currency to prevent partial-payment fraud
  const expectedAmount = parseFloat(order.total);
  const receivedAmount = parseFloat(verification.amount);

  if (verification.currency !== order.currency) {
    throw new Error(
      `[flutterwave] reconcileByTxRef: currency mismatch — ` +
      `expected ${order.currency}, got ${verification.currency}`
    );
  }

  if (receivedAmount < expectedAmount) {
    throw new Error(
      `[flutterwave] reconcileByTxRef: amount mismatch — ` +
      `expected ${expectedAmount}, received ${receivedAmount}`
    );
  }

  // 4. Mark order as paid
  await markOrderPaid(order.id, flutterwaveTransactionId);

  // 5. Notify customer — WhatsApp first, SMS as fallback
  const notificationPayload = {
    phone: order.customer_whatsapp ?? order.customer_phone,
    orderId: order.id,
    total: String(order.total),
    currency: order.currency,
  };

  try {
    await sendOrderConfirmation(notificationPayload);
  } catch (whatsappErr) {
    console.warn(
      '[flutterwave] WhatsApp notification failed, falling back to SMS:',
      whatsappErr.message
    );
    try {
      await sendOrderConfirmationSms({
        ...notificationPayload,
        phone: order.customer_phone,
      });
    } catch (smsErr) {
      // Log but do not throw — payment reconciliation succeeded; notification failure
      // is non-critical and can be retried separately.
      console.error('[flutterwave] SMS fallback also failed:', smsErr.message);
    }
  }
}
