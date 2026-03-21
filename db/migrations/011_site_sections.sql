-- 011_site_sections.sql
-- Adds the site_sections table for admin-managed storefront sections.
-- Each section has an algorithmic_rule (JSONB) that drives product filtering
-- on the public storefront (e.g. {"category_slug":"phones","limit":10}).

CREATE TABLE IF NOT EXISTS site_sections (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(200) NOT NULL,
  algorithmic_rule JSONB        NOT NULL DEFAULT '{}',
  position         SMALLINT     NOT NULL DEFAULT 0,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_sections_position  ON site_sections (position);
CREATE INDEX IF NOT EXISTS idx_site_sections_is_active ON site_sections (is_active);

-- Seed two example sections so the admin panel is not empty on first load
INSERT INTO site_sections (title, algorithmic_rule, position) VALUES
  ('Featured Phones',   '{"category_slug": "phones",       "limit": 8}', 0),
  ('Hot Deals',         '{"max_price": 200000,              "limit": 8}', 1)
ON CONFLICT DO NOTHING;
