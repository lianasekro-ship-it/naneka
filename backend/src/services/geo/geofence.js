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

// ─── Hardcoded delivery zone polygon ─────────────────────────────────────────
//
// Vertices trace the Phase 1 delivery area clockwise from the north tip of
// the Msasani peninsula, sweeping south through Kariakoo, then across to
// Kigamboni and back.
//
// Each entry: [latitude, longitude]
// Drawn to match the 10 km radius seed in db/seeds/dar_es_salaam_zone.sql.
// Replace with a QGIS-exported polygon before expanding coverage.

const DAR_ES_SALAAM_ZONE = [
  [-6.748,  39.245],  // 1 — Msasani peninsula, north tip
  [-6.758,  39.285],  // 2 — Masaki east / Oyster Bay north
  [-6.790,  39.300],  // 3 — Oyster Bay south / Upanga coastline
  [-6.815,  39.300],  // 4 — Kivukoni / ferry terminal (north shore)
  [-6.845,  39.320],  // 5 — Kigamboni north
  [-6.895,  39.325],  // 6 — Kigamboni south
  [-6.895,  39.252],  // 7 — South-west corner (Ilala / Buguruni)
  [-6.848,  39.248],  // 8 — Kariakoo south-west
  [-6.810,  39.248],  // 9 — Kariakoo north-west
  [-6.762,  39.248],  // 10 — Msasani peninsula, south-west
];

// ─── Pure-JS ray-casting ──────────────────────────────────────────────────────

/**
 * Ray-casting algorithm — determines whether a point lies inside a polygon.
 * Fires a horizontal ray east from (lat, lng) and counts edge crossings.
 * An odd count means the point is inside.
 *
 * Works correctly for convex and simple concave polygons.
 * Not intended for polygons that span the ±180° antimeridian.
 *
 * @param {number}   lat      Point latitude
 * @param {number}   lng      Point longitude
 * @param {number[][]} polygon  Array of [lat, lng] vertices (open or closed ring)
 * @returns {boolean}
 */
function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];

    // Check whether the ray from (lat, lng) eastward crosses this edge
    const crosses =
      latI > lat !== latJ > lat &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;

    if (crosses) inside = !inside;
  }

  return inside;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fast synchronous check: is this coordinate within the Dar es Salaam
 * delivery zone?
 *
 * Uses the hardcoded polygon — no DB call, no async, no dependencies.
 * Safe to call on every keystroke of a coordinate input if needed.
 *
 * @param {number} lat  Customer latitude  (e.g. -6.8160)
 * @param {number} lng  Customer longitude (e.g.  39.2803)
 * @returns {boolean}   true → deliverable, false → outside service area
 */
export function isLocationDeliverable(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  return isPointInPolygon(lat, lng, DAR_ES_SALAAM_ZONE);
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
