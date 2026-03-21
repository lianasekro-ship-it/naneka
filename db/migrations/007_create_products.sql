-- 007_create_products.sql
-- Product catalogue for Phase 1 MVP.
-- Categories: Stoves, Pots, Accessories

CREATE TYPE product_category AS ENUM ('Stoves', 'Pots', 'Accessories');

CREATE TABLE products (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255)      NOT NULL,
  price        NUMERIC(14, 2)    NOT NULL CHECK (price >= 0),
  currency     CHAR(3)           NOT NULL DEFAULT 'TZS',
  category     product_category  NOT NULL,
  image_url    TEXT,
  description  TEXT,
  is_active    BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category  ON products (category);
CREATE INDEX idx_products_is_active ON products (is_active);
