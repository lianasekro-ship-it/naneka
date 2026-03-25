/**
 * Orders router — maps HTTP verbs to controller handlers.
 * All business logic lives in src/controllers/orderController.js.
 *
 * POST   /api/v1/orders              → createOrder
 * GET    /api/v1/orders              → listOrders
 * GET    /api/v1/orders/pending      → listPendingOrders   (Driver App — ready_for_pickup + out_for_delivery)
 * GET    /api/v1/orders/preparing    → listPreparerOrders  (Preparer App — pending_payment + paid + preparing)
 * GET    /api/v1/orders/:id/track    → trackOrder
 * GET    /api/v1/orders/:id          → getOrder
 * PATCH  /api/v1/orders/:id/status   → updateOrderStatus
 */

import { Router } from 'express';
import {
  listOrders,
  listPendingOrders,
  listPreparerOrders,
  createOrder,
  getOrder,
  trackOrder,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

// List & create
router.get('/',        listOrders);
router.post('/',       createOrder);

// Driver-facing: ready_for_pickup + out_for_delivery
// MUST be declared before /:id so Express doesn't treat "pending" as an ID.
router.get('/pending',   listPendingOrders);

// Preparer-facing: pending_payment + paid + preparing
router.get('/preparing', listPreparerOrders);

// Single-order endpoints
router.get('/:id/track',  trackOrder);        // before /:id
router.get('/:id',        getOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
