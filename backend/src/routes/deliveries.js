/**
 * Deliveries routes
 *
 * POST   /api/v1/deliveries                     — Create delivery run (staff only)
 * GET    /api/v1/deliveries/zones               — Return active delivery zones as GeoJSON
 * GET    /api/v1/deliveries/:orderId            — Get live delivery position for an order
 * PATCH  /api/v1/deliveries/:deliveryId/complete — Mark delivery complete (staff only)
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createDelivery, findDeliveryByOrderId, completeDelivery } from '../models/activeDelivery.js';
import { pollAndUpdateDeliveryPosition, getDevicePosition } from '../services/logistics/traccar.js';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';

const router = Router();

// ── GET /api/v1/deliveries/zones  (public — used by checkout map) ─────────────
router.get('/zones', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('id, name, boundary')
      .eq('is_active', true);

    if (error) throw error;

    const features = (data ?? []).map(z => ({
      type:       'Feature',
      properties: { id: z.id, name: z.name },
      geometry:   z.boundary,
    }));

    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/deliveries  (staff only) ─────────────────────────────────────
router.post('/', authenticate, requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const { orderId, traccarDeviceId, driverName, driverPhone } = req.body;

    if (!orderId || !traccarDeviceId) {
      return res.status(400).json({ error: 'orderId and traccarDeviceId are required' });
    }

    const delivery = await createDelivery({ orderId, traccarDeviceId, driverName, driverPhone });
    res.status(201).json({ delivery });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/deliveries/:orderId  (customer-facing live tracking) ──────────
router.get('/:orderId', async (req, res, next) => {
  try {
    const delivery = await findDeliveryByOrderId(req.params.orderId);

    if (!delivery) {
      return res.status(404).json({ error: 'No active delivery found for this order.' });
    }

    // Try fresh Traccar position — graceful fallback if Traccar is offline
    let coords = null;
    if (delivery.traccar_device_id && env.TRACCAR_BASE_URL) {
      try {
        const pos = await getDevicePosition(delivery.traccar_device_id);
        coords = { latitude: pos.latitude, longitude: pos.longitude, speed: pos.speed };
        // Persist asynchronously — don't block the response
        pollAndUpdateDeliveryPosition(delivery.id).catch(() => {});
      } catch {
        // Traccar offline — use last stored coords if available
        if (delivery.last_lat && delivery.last_lng) {
          coords = { latitude: delivery.last_lat, longitude: delivery.last_lng, speed: 0 };
        }
      }
    } else if (delivery.last_lat && delivery.last_lng) {
      coords = { latitude: delivery.last_lat, longitude: delivery.last_lng, speed: 0 };
    }

    res.json({
      delivery: {
        id:          delivery.id,
        orderId:     delivery.order_id,
        driverName:  delivery.driver_name  ?? null,
        driverPhone: delivery.driver_phone ?? null,
        etaMinutes:  delivery.eta_minutes  ?? null,
        startedAt:   delivery.created_at,
        lastPolled:  delivery.last_polled_at ?? null,
      },
      tracking: coords
        ? { ...coords, lastPolled: delivery.last_polled_at ?? new Date().toISOString() }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/v1/deliveries/:deliveryId/complete  (staff only) ───────────────
router.patch('/:deliveryId/complete', authenticate, requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    await completeDelivery(req.params.deliveryId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
