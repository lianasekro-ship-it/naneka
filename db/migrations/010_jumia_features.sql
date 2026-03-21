-- 010_jumia_features.sql
-- Adds: product_reviews table, full-text search vector on products,
--       icon column on categories for admin UI display.

-- ── Product Reviews ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_reviews (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews (product_id);

-- ── Full-Text Search vector ───────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Back-fill existing rows
UPDATE products
SET search_vector = to_tsvector('english',
  COALESCE(name, '')        || ' ' ||
  COALESCE(brand, '')       || ' ' ||
  COALESCE(description, '')
);

CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING GIN (search_vector);

-- Trigger keeps the vector in sync whenever name/brand/description changes
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '')        || ' ' ||
    COALESCE(NEW.brand, '')       || ' ' ||
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, brand, description ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- ── Category icon (emoji or short code for admin sidebar display) ─────────────
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT NULL;
