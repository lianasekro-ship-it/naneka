-- Migration 002: Delivery zones with PostGIS polygon boundaries

CREATE TABLE delivery_zones (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    boundary   GEOGRAPHY(POLYGON, 4326) NOT NULL,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for fast ST_Within / ST_DWithin queries at checkout
CREATE INDEX idx_delivery_zones_boundary ON delivery_zones USING GIST (boundary);
