/**
 * Orders router — maps HTTP verbs to controller handlers.
 * All business logic lives in src/controllers/orderController.js.
 *
 * POST   /api/v1/orders              → createOrder
 * GET    /api/v1/orders              → listOrders
 * GET    /api/v1/orders/pending      → listPendingOrders   (Driver App)
 * GET    /api/v1/orders/:id/track    → trackOrder
 * GET    /api/v1/orders/:id          → getOrder
 * PATCH  /api/v1/orders/:id/status   → updateOrderStatus
 */

import { Router } from 'express';
import {
  listOrders,
  listPendingOrders,
  createOrder,
  getOrder,
  trackOrder,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

// List & create
router.get('/',        listOrders);
router.post('/',       createOrder);

// Driver-facing: actionable orders only
// MUST be declared before /:id so Express doesn't treat "pending" as an ID.
router.get('/pending', listPendingOrders);

// Single-order endpoints
router.get('/:id/track',  trackOrder);        // before /:id
router.get('/:id',        getOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
