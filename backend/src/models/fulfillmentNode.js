/**
 * FulfillmentNode model — Phase 2 skeleton. DO NOT expose via API in MVP.
 *
 * All nodes have is_active = FALSE until Phase 2 launch.
 */

import { query } from '../config/db.js';

/**
 * @throws {Error} Always — this model is not active in Phase 1 / MVP.
 */
export async function findActiveNodes() {
  throw new Error('FulfillmentNode: not available in Phase 1 MVP.');
}

/**
 * @throws {Error} Always — this model is not active in Phase 1 / MVP.
 */
export async function findNearestNode(_latitude, _longitude) {
  throw new Error('FulfillmentNode: not available in Phase 1 MVP.');
}
