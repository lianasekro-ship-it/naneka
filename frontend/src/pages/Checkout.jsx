/**
 * PLACEHOLDER — Checkout page
 *
 * Key flow:
 * 1. Customer enters name, phone, WhatsApp number, and drops a pin on the map.
 * 2. On pin drop, the frontend calls GET /api/v1/deliveries/zones to render
 *    the active delivery zone polygon so the customer can see coverage visually.
 * 3. On submit, POST /api/v1/orders — the backend validates the coordinates
 *    via PostGIS geofence; returns 422 if out of zone.
 * 4. On success, redirect to the Flutterwave hosted payment link.
 */

export default function Checkout() {
  // TODO:
  // - Render customer details form
  // - Embed DeliveryMap for address pin-drop + zone overlay
  // - Validate form with Zod or similar
  // - Submit order and handle 422 out-of-zone errors gracefully
  // - Redirect to Flutterwave payment on success

  return (
    <main>
      <h1>Checkout</h1>
      <p>Checkout form — coming soon.</p>
    </main>
  );
}
