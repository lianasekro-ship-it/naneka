-- Migration 003: Orders table
-- Statuses: pending_payment → paid → processing → out_for_delivery → delivered | cancelled

CREATE TYPE order_status AS ENUM (
    'pending_payment',
    'out_for_delivery',
    'paid',
    'processing',
    'delivered',
    'cancelled'
);

CREATE TYPE payment_method AS ENUM (
    'mobile_money',
    'card',
    'cash_on_delivery'
);

CREATE TABLE orders (
    id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Customer
    customer_name        VARCHAR(200)   NOT NULL,
    customer_phone       VARCHAR(20)    NOT NULL,   -- E.164 e.g. +255712345678
    customer_whatsapp    VARCHAR(20),               -- Separate WhatsApp number if different

    -- Delivery location
    delivery_address     TEXT           NOT NULL,
    delivery_coords      GEOGRAPHY(POINT, 4326) NOT NULL,
    delivery_zone_id     UUID           REFERENCES delivery_zones(id),

    -- Status
    status               order_status   NOT NULL DEFAULT 'pending_payment',

    -- Payment
    payment_method       payment_method NOT NULL,
    payment_reference    VARCHAR(255),              -- Flutterwave tx_ref (NANEKA-{uuid}-{ts})
    payment_verified_at  TIMESTAMPTZ,

    -- Financials — multi-currency support
    currency             CHAR(3)        NOT NULL DEFAULT 'TZS',  -- ISO 4217
    subtotal             NUMERIC(14, 2) NOT NULL,
    delivery_fee         NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total                NUMERIC(14, 2) NOT NULL,

    notes                TEXT,
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status         ON orders (status);
CREATE INDEX idx_orders_customer_phone ON orders (customer_phone);
CREATE INDEX idx_orders_payment_ref    ON orders (payment_reference);
CREATE INDEX idx_orders_delivery_coords ON orders USING GIST (delivery_coords);
