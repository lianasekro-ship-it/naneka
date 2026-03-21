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
router.post('/waha', (req, res) => {
  // TODO: Handle inbound WhatsApp message events (e.g. customer replies)
  res.status(200).json({ received: true });
});

export default router;
