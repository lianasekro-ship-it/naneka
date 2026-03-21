/**
 * ActiveDelivery model — query layer for the active_deliveries table.
 *
 * Phase 1: single vehicle. One row per in-progress delivery.
 */

import { query } from '../config/db.js';

/**
 * Creates an active delivery record when dispatch begins.
 * @param {{
 *   orderId: string,
 *   traccarDeviceId: string,
 *   driverName?: string,
 *   driverPhone?: string,
 * }} data
 * @returns {Promise<object>}
 */
export async function createDelivery(data) {
  // TODO: INSERT INTO active_deliveries (...) VALUES (...) RETURNING *
  throw new Error('createDelivery: not implemented');
}

/**
 * Finds the active delivery for a given order.
 * @param {string} orderId
 */
export async function findDeliveryByOrderId(orderId) {
  // TODO: SELECT * FROM active_deliveries WHERE order_id = $1
  throw new Error('findDeliveryByOrderId: not implemented');
}

/**
 * Updates the last known GPS coordinates from Traccar poll.
 * @param {string} deliveryId  UUID
 * @param {number} latitude
 * @param {number} longitude
 */
export async function updatePosition(deliveryId, latitude, longitude) {
  // TODO:
  // UPDATE active_deliveries
  // SET last_known_coords = ST_SetSRID(ST_MakePoint($2, $3), 4326),
  //     last_polled_at = NOW()
  // WHERE id = $1
  throw new Error('updatePosition: not implemented');
}

/**
 * Marks a delivery as completed.
 * @param {string} deliveryId UUID
 */
export async function completeDelivery(deliveryId) {
  // TODO: UPDATE active_deliveries SET completed_at = NOW() WHERE id = $1
  throw new Error('completeDelivery: not implemented');
}
