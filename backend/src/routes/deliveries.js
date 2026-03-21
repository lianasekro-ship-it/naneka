/**
 * Deliveries routes
 *
 * POST /api/v1/deliveries              — Create delivery run (staff only)
 * GET  /api/v1/deliveries/:orderId     — Get live delivery position for an order
 * GET  /api/v1/deliveries/zones        — Return active delivery zones as GeoJSON
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/deliveries/zones  (public — used by checkout map)
router.get('/zones', async (req, res, next) => {
  try {
    // TODO: getActiveZones() → return GeoJSON array
    res.status(501).json({ message: 'GET /deliveries/zones — not implemented' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/deliveries  (staff only)
router.post('/', authenticate, requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    // TODO: createDelivery({ orderId, traccarDeviceId, driverName, driverPhone })
    res.status(501).json({ message: 'POST /deliveries — not implemented' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/deliveries/:orderId  (customer-facing live tracking)
router.get('/:orderId', async (req, res, next) => {
  try {
    // TODO:
    // 1. findDeliveryByOrderId(req.params.orderId)
    // 2. Return last_known_coords (as [lng, lat]) + last_polled_at + eta_minutes
    res.status(501).json({ message: 'GET /deliveries/:orderId — not implemented' });
  } catch (err) {
    next(err);
  }
});

export default router;
