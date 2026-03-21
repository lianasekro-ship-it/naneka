# Naneka Platform — Architecture Reference

## Overview
Naneka is a headless, API-first e-commerce platform tailored for the East African market.
It is built as a monorepo containing a Node.js/Express backend, a React frontend, and a
PostgreSQL database with PostGIS enabled for spatial queries.

---

## Business Phases

| Phase | Description                          | Status     |
|-------|--------------------------------------|------------|
| 1     | Delivery-only, single in-house vehicle | **Active MVP** |
| 2     | Fulfillment Nodes (physical drop-off shops) | Skeleton only — `is_active = FALSE` |

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Backend     | Node.js 20 + Express 5            |
| Frontend    | React 18 + Vite                   |
| Database    | PostgreSQL 16 + PostGIS 3         |
| Auth        | JWT (JSON Web Tokens) — RS256     |
| Payments    | Flutterwave (mobile money + cards)|
| WhatsApp    | WAHA — self-hosted WhatsApp HTTP API |
| SMS         | Textbee — self-hosted Android gateway |
| GPS/Tracking| Traccar — self-hosted GPS server  |
| Geofencing  | PostGIS `ST_Within` / `ST_DWithin`|

---

## Auth Strategy
- **JWT (RS256)** — private key signs tokens; public key verifies.
- Chosen over sessions to support the future mobile app without shared session state.
- Tokens include: `sub` (user id), `role`, `iat`, `exp`.
- Refresh token rotation is handled in `src/middleware/auth.js`.

---

## Currency
- All monetary values stored as `NUMERIC(14, 2)`.
- A `currency` column (ISO 4217, e.g. `TZS`, `KES`, `USD`) is present on every
  monetary table.
- **Default currency: TZS (Tanzanian Shilling).**
- Conversion rates are NOT stored in the DB — apply at the presentation layer if needed.

---

## Service Modules

### `src/services/payments/flutterwave.js`
- Wraps the Flutterwave v3 REST API.
- **`tx_ref` logic**: Every order generates a deterministic `tx_ref` using the pattern
  `NANEKA-{orderId}-{timestampMs}`. This reference is stored on the `orders` table and
  is the primary key used to match inbound Mobile Money payment callbacks
  (`/webhooks/flutterwave`). Never reuse a `tx_ref`.
- Handles: charge initiation, transaction verification (`GET /v3/transactions/{id}/verify`),
  and webhook signature validation (`verif-hash` header check).

### `src/services/messaging/whatsapp.js`
- Wraps WAHA (self-hosted) REST API.
- Used for automated order status update messages.
- Phone numbers must be in E.164 format (e.g. `+255712345678`).

### `src/services/messaging/sms.js`
- Wraps Textbee self-hosted Android SMS gateway REST API.
- Fallback channel when WhatsApp is unavailable or undelivered.

### `src/services/logistics/traccar.js`
- Wraps Traccar REST API to poll live GPS position of the delivery vehicle.
- Credentials never leave the server — the browser only receives polled coordinates
  stored in `active_deliveries.last_known_coords`.

### `src/services/geo/geofence.js`
- Uses PostGIS `ST_Within(customer_point, zone_boundary)` to validate delivery coordinates
  at checkout.
- If the customer's coordinates fall outside all active `delivery_zones`, the checkout
  endpoint returns HTTP 422 with a user-friendly out-of-zone error.

---

## Database Conventions
- Primary keys: `UUID` (`gen_random_uuid()`).
- Timestamps: `TIMESTAMPTZ` — always UTC.
- Spatial columns: `GEOGRAPHY(type, 4326)` — WGS 84.
- Migrations live in `db/migrations/` and are numbered sequentially.
- Seeds live in `db/seeds/`.

---

## Key Tables (summary)

| Table                | Purpose                                              | MVP Active |
|----------------------|------------------------------------------------------|------------|
| `delivery_zones`     | PostGIS polygons defining valid delivery areas       | Yes        |
| `orders`             | Core order record, includes delivery coords + payment| Yes        |
| `active_deliveries`  | Live delivery run, linked to Traccar device          | Yes        |
| `fulfillment_nodes`  | Phase 2 drop-off shops — `is_active = FALSE`         | **No**     |

---

## Environment Variables
See `.env.example` for the full list. Never commit `.env`.

---

## Folder Structure
```
naneka-platform/
├── CLAUDE.md
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── config/          # db.js, env.js
│       ├── routes/          # orders, payments, deliveries, webhooks
│       ├── services/
│       │   ├── payments/    # flutterwave.js
│       │   ├── messaging/   # whatsapp.js, sms.js
│       │   ├── logistics/   # traccar.js
│       │   └── geo/         # geofence.js
│       ├── models/          # order.js, activeDelivery.js, fulfillmentNode.js
│       └── middleware/      # auth.js, errorHandler.js
├── frontend/
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/           # Storefront, Checkout, OrderTracking
│       └── components/      # DeliveryMap
└── db/
    ├── migrations/          # 001–005 SQL files
    └── seeds/               # dar_es_salaam_zone.sql
```
