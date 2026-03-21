-- Migration 005: Fulfillment Nodes — Phase 2 skeleton
--
-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PHASE 2 FEATURE — NOT ACTIVE IN MVP                           ║
-- ║  All rows MUST have is_active = FALSE until Phase 2 launch.    ║
-- ║  Do NOT expose this table via any API endpoint in Phase 1.     ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE fulfillment_nodes (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(200) NOT NULL,             -- e.g. "Kariakoo Agent"
    contact_phone     VARCHAR(20),
    address           TEXT,
    location          GEOGRAPHY(POINT, 4326),            -- Shop's GPS coordinates
    service_radius_m  INT         NOT NULL DEFAULT 2000, -- metres
    is_active         BOOLEAN     NOT NULL DEFAULT FALSE, -- LOCKED FALSE for MVP
    operating_hours   JSONB,                             -- e.g. {"mon":"08:00-18:00"}
    currency          CHAR(3)     NOT NULL DEFAULT 'TZS',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fulfillment_nodes IS
    'Phase 2 feature: physical drop-off/pickup shops. '
    'All rows must keep is_active=FALSE until Phase 2 launch. '
    'Do not expose via any API in Phase 1 MVP.';

COMMENT ON COLUMN fulfillment_nodes.is_active IS
    'Phase 2 gate — must remain FALSE in all Phase 1 environments.';

CREATE INDEX idx_fulfillment_nodes_location ON fulfillment_nodes USING GIST (location);

-- Enforce the Phase 1 guard at the DB level
CREATE OR REPLACE FUNCTION prevent_active_fulfillment_nodes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = TRUE THEN
        RAISE EXCEPTION 'fulfillment_nodes.is_active cannot be TRUE in Phase 1 MVP. '
                        'Remove this trigger when Phase 2 launches.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_fulfillment_node_active
BEFORE INSERT OR UPDATE ON fulfillment_nodes
FOR EACH ROW EXECUTE FUNCTION prevent_active_fulfillment_nodes();
