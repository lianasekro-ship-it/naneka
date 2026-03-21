/**
 * PLACEHOLDER — DeliveryMap component
 *
 * Used in two contexts:
 *  1. Checkout — customer drops a pin; zone boundary overlay shows coverage.
 *  2. OrderTracking — displays live vehicle position polled from Traccar via the backend.
 *
 * Recommended library: Leaflet (react-leaflet) with OpenStreetMap tiles.
 * No Google Maps API key required — important for cost management.
 */

/**
 * @param {{
 *   coordinates: { lat: number, lng: number } | null,  // Vehicle or pin position
 *   zoneGeoJson?: object,                               // Active delivery zone polygon
 *   onPinDrop?: (lat: number, lng: number) => void,    // Checkout: called when pin is dropped
 * }} props
 */
export default function DeliveryMap({ coordinates, zoneGeoJson, onPinDrop }) {
  // TODO:
  // - Initialise Leaflet map centred on Dar es Salaam (-6.8160, 39.2803)
  // - Render zoneGeoJson as a semi-transparent polygon overlay
  // - If coordinates provided, place a vehicle/pin marker
  // - If onPinDrop provided, enable click-to-place-pin mode

  return (
    <div style={{ width: '100%', height: '400px', background: '#e8e8e8' }}>
      <p style={{ padding: '1rem' }}>Map component — coming soon.</p>
    </div>
  );
}
