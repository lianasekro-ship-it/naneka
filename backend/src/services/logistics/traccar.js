/**
 * Traccar GPS tracking service.
 *
 * Polls the self-hosted Traccar server for the live position of the
 * delivery vehicle via the Traccar REST API.
 *
 * Security: Traccar credentials never leave the server. The browser only
 * receives coordinates that have been stored in active_deliveries.last_known_coords
 * via pollAndUpdateDeliveryPosition().
 *
 * Traccar REST API used:
 *   GET /api/positions?deviceId={id}
 *   Auth: HTTP Basic (TRACCAR_EMAIL / TRACCAR_PASSWORD)
 *   Returns: array of the most recent position fix per device
 *
 * Environment variables:
 *   TRACCAR_BASE_URL          — e.g. http://your-traccar-host:8082
 *   TRACCAR_EMAIL             — Traccar admin account email
 *   TRACCAR_PASSWORD          — Traccar admin account password
 *   TRACCAR_VEHICLE_DEVICE_ID — Traccar numeric device ID for the Phase 1 vehicle
 */

import axios from 'axios';
import { env } from '../../config/env.js';
import { updatePosition } from '../../models/activeDelivery.js';

const client = axios.create({
  baseURL: env.TRACCAR_BASE_URL,
  auth: {
    username: env.TRACCAR_EMAIL,
    password: env.TRACCAR_PASSWORD,
  },
  timeout: 8_000,
});

// ─── Core position fetch ──────────────────────────────────────────────────────

/**
 * Fetches the current GPS position of a specific Traccar device.
 *
 * Traccar's GET /api/positions returns the latest fix for each requested
 * device. We always take positions[0] — the most recent entry.
 *
 * @param {string|number} deviceId  Traccar device ID
 * @returns {Promise<{
 *   latitude:  number,
 *   longitude: number,
 *   speed:     number,   // km/h
 *   course:    number,   // degrees, 0–360
 *   altitude:  number,   // metres
 *   fixTime:   string,   // ISO 8601 — when the GPS fix was captured
 *   serverTime: string,  // ISO 8601 — when Traccar received the fix
 * }>}
 * @throws {Error} If Traccar returns no position for the device
 */
export async function getDevicePosition(deviceId) {
  const response = await client.get('/api/positions', {
    params: { deviceId: String(deviceId) },
  });

  const positions = response.data;

  if (!Array.isArray(positions) || positions.length === 0) {
    throw new Error(
      `[traccar] No position data returned for device ${deviceId}. ` +
      'Check that the device is registered and has reported at least once.'
    );
  }

  const p = positions[0];

  return {
    latitude:   p.latitude,
    longitude:  p.longitude,
    speed:      p.speed ?? 0,
    course:     p.course ?? 0,
    altitude:   p.altitude ?? 0,
    fixTime:    p.fixTime,
    serverTime: p.serverTime,
  };
}

/**
 * Convenience wrapper: fetches the live position of the Phase 1 delivery
 * vehicle using TRACCAR_VEHICLE_DEVICE_ID from env.
 *
 * @returns {Promise<{
 *   latitude:  number,
 *   longitude: number,
 *   speed:     number,
 *   course:    number,
 *   altitude:  number,
 *   fixTime:   string,
 *   serverTime: string,
 * }>}
 */
export async function getVehiclePosition() {
  return getDevicePosition(env.TRACCAR_VEHICLE_DEVICE_ID);
}

// ─── Poll-and-persist ─────────────────────────────────────────────────────────

/**
 * Fetches the vehicle's current GPS position from Traccar and persists it to
 * active_deliveries.last_known_coords so the frontend can poll the DB
 * instead of Traccar directly.
 *
 * Intended to be called on a periodic interval (e.g. every 30 s via a cron
 * job or setInterval in the delivery route handler).
 *
 * DB write uses PostGIS ST_MakePoint — see activeDelivery.updatePosition().
 *
 * @param {string} deliveryId  UUID of the active_deliveries row to update
 * @returns {Promise<{ latitude: number, longitude: number, speed: number }>}
 *          The freshly fetched coordinates (useful for logging / response)
 */
export async function pollAndUpdateDeliveryPosition(deliveryId) {
  const position = await getVehiclePosition();

  await updatePosition(deliveryId, position.latitude, position.longitude);

  return {
    latitude:  position.latitude,
    longitude: position.longitude,
    speed:     position.speed,
  };
}
