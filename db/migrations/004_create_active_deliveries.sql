-- Migration 004: Active deliveries
-- Phase 1: single in-house vehicle. One row per in-progress delivery run.

CREATE TABLE active_deliveries (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,

    -- Traccar integration
    traccar_device_id   VARCHAR(100) NOT NULL,      -- Device ID in Traccar instance
    last_known_coords   GEOGRAPHY(POINT, 4326),     -- Updated by Traccar poll job
    last_polled_at      TIMESTAMPTZ,

    -- Driver info
    driver_name         VARCHAR(200),
    driver_phone        VARCHAR(20),

    -- ETA
    eta_minutes         INT,

    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,

    CONSTRAINT one_active_delivery_per_order UNIQUE (order_id)
);

CREATE INDEX idx_active_deliveries_order_id ON active_deliveries (order_id);
