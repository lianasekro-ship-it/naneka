/**
 * Geofencing & delivery zone validation service.
 *
 * Two layers of checking:
 *
 *  1. isLocationDeliverable(lat, lng)  — pure JS, zero dependencies, hardcoded polygon.
 *     Fast synchronous check used at checkout to give the customer an instant response
 *     before the DB round-trip. Returns true | false.
 *
 *  2. validateDeliveryCoords(lat, lng) — authoritative check against the `delivery_zones`
 *     table using PostGIS ST_Within. Throws HTTP 422 if the point falls outside every
 *     active zone. Used as the definitive server-side gate before an order is created.
 *
 *  3. getActiveZones()                — returns all active zones as GeoJSON for the
 *     frontend checkout map overlay.
 *
 * Delivery zone covered by the hardcoded polygon (Phase 1, Dar es Salaam):
 *   Msasani / Masaki peninsula  →  Oyster Bay  →  Upanga  →  Kariakoo  →
 *   Kivukoni / Ferry terminal   →  Kigamboni   →  Ilala   →  back north
 *
 * Coordinate system: WGS 84 (EPSG:4326) — latitude / longitude decimal degrees.
 */

import { query } from '../../config/db.js';

// ─── Public API ───────────────────────────────────────────────────────────────

// ─── Bounding box for greater Dar es Salaam ──────────────────────────────────
// Covers all wards including Masaki, Kigamboni, Mbezi Beach, Mbagala, etc.
// The tight polygon above is kept for reference and future Phase 2 sub-zones.
const DSM_BOUNDS = { latMin: -7.10, latMax: -6.55, lngMin: 39.10, lngMax: 39.60 };

/**
 * Fast synchronous check: is this coordinate within the Dar es Salaam
 * delivery area?
 *
 * Uses a broad bounding box so that all known DSM wards (Masaki, Mikocheni,
 * Kigamboni, Mbezi, etc.) are accepted. The tighter polygon above is preserved
 * for future sub-zone logic (Phase 2).
 *
 * @param {number} lat  Customer latitude  (e.g. -6.8160)
 * @param {number} lng  Customer longitude (e.g.  39.2803)
 * @returns {boolean}   true → deliverable, false → outside service area
 */
export function isLocationDeliverable(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  return (
    lat >= DSM_BOUNDS.latMin && lat <= DSM_BOUNDS.latMax &&
    lng >= DSM_BOUNDS.lngMin && lng <= DSM_BOUNDS.lngMax
  );
}

/**
 * Authoritative server-side gate: validates a coordinate pair against the
 * `delivery_zones` table using PostGIS ST_Within.
 *
 * Always call this before creating an order — it is the source of truth.
 * The hardcoded isLocationDeliverable() is a UX convenience only.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{ id: string, name: string }>}  The matched delivery zone
 * @throws {Error}  status 422 — if the point falls outside every active zone
 */
export async function validateDeliveryCoords(latitude, longitude) {
  const result = await query(
    `SELECT id, name
     FROM   delivery_zones
     WHERE  is_active = TRUE
       AND  ST_Within(
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geometry,
              boundary::geometry
            )
     LIMIT  1`,
    [latitude, longitude]   // $1 = lat, $2 = lng  (MakePoint takes lng first)
  );

  if (result.rows.length === 0) {
    const err = new Error(
      'Sorry, we don\'t deliver to your location yet. ' +
      'We currently serve central Dar es Salaam, Masaki, and Kigamboni.'
    );
    err.status = 422;
    throw err;
  }

  return result.rows[0];
}

/**
 * Returns all active delivery zones with their boundaries serialised as GeoJSON.
 * Used by the frontend to render zone polygons on the checkout map.
 *
 * @returns {Promise<Array<{ id: string, name: string, geojson: object }>>}
 */
export async function getActiveZones() {
  const result = await query(
    `SELECT id,
            name,
            ST_AsGeoJSON(boundary)::json AS geojson
     FROM   delivery_zones
     WHERE  is_active = TRUE
     ORDER  BY name`
  );

  return result.rows;
}
