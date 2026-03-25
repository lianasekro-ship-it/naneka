/**
 * Webhook receivers — raw body is preserved by server.js for signature verification.
 *
 * POST /webhooks/flutterwave  — Flutterwave payment callback (Mobile Money & cards)
 * POST /webhooks/waha         — WAHA inbound WhatsApp message events (future use)
 */

import { Router } from 'express';
import { validateWebhookSignature, reconcileByTxRef } from '../services/payments/flutterwave.js';

const router = Router();

// POST /webhooks/flutterwave
router.post('/flutterwave', (req, res, next) => {
  try {
    // IMPORTANT: req.body is a raw Buffer here (see server.js)
    const receivedHash = req.headers['verif-hash'];

    // 1. Validate signature — reject immediately if invalid
    if (!validateWebhookSignature(receivedHash)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(req.body.toString());

    // 2. Only process successful charge events
    if (payload.event !== 'charge.completed' || payload.data?.status !== 'successful') {
      return res.status(200).json({ received: true });
    }

    // 3. Reconcile — find order by tx_ref, mark paid, notify customer
    // Fire-and-forget: respond 200 immediately, process async
    const { tx_ref, id: flutterwaveTxId } = payload.data;
    reconcileByTxRef(tx_ref, String(flutterwaveTxId)).catch((err) => {
      console.error('[webhook/flutterwave] reconcileByTxRef failed:', err.message);
    });

    return res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

// POST /webhooks/waha
// WAHA posts events here. We log any group IDs we see so the operator can
// find their WAHA_GROUP_ID without needing to query the WAHA API directly.
router.post('/waha', (req, res) => {
  try {
    // req.body is a raw Buffer here because of the express.raw() middleware on /webhooks
    const body = req.body instanceof Buffer
      ? JSON.parse(req.body.toString())
      : (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);

    // WAHA can wrap the payload under different keys depending on version
    const from = body?.payload?.from ?? body?.from ?? body?.chatId ?? '';

    if (from.endsWith('@g.us')) {
      const name = body?.payload?.chat?.name
        ?? body?.payload?.name
        ?? body?.chat?.name
        ?? '(unnamed)';
      console.log('[waha] ══════════════ GROUP MESSAGE RECEIVED ══════════════');
      console.log(`[waha]  GROUP ID   : ${from}   ← set this as WAHA_GROUP_ID`);
      console.log(`[waha]  Group Name : ${name}`);
      console.log('[waha] ════════════════════════════════════════════════════');
    }
  } catch (_) {
    // Never let logging crash the webhook response
  }

  res.status(200).json({ received: true });
});

export default router;
