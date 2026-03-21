/**
 * Payments routes
 *
 * GET /api/v1/payments/verify/:transactionId — Called after Flutterwave redirect
 *                                               to verify a completed payment
 */

import { Router } from 'express';

const router = Router();

// GET /api/v1/payments/verify/:transactionId
router.get('/verify/:transactionId', async (req, res, next) => {
  try {
    // TODO:
    // 1. verifyTransaction(req.params.transactionId)
    // 2. Lookup order by tx_ref from verification response
    // 3. markOrderPaid(orderId)
    // 4. Trigger WhatsApp order confirmation
    // 5. Return updated order to client
    res.status(501).json({ message: 'GET /payments/verify — not implemented' });
  } catch (err) {
    next(err);
  }
});

export default router;
