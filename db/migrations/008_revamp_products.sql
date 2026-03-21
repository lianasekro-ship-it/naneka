-- 008_revamp_products.sql
-- Replaces the flat product_category ENUM + products table
-- with a proper two-level hierarchy: categories → subcategories → products.
--
-- Adds: slug (for deep links), brand, stock_qty columns on products.

-- ── Drop Phase-1 schema ───────────────────────────────────────────────────────
DROP TABLE  IF EXISTS products       CASCADE;
DROP TYPE   IF EXISTS product_category;

-- ── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  sort_order SMALLINT     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Subcategories ─────────────────────────────────────────────────────────────
CREATE TABLE subcategories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID         NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  sort_order  SMALLINT     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, name)
);

CREATE INDEX idx_subcategories_category ON subcategories (category_id);

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255)   NOT NULL,
  slug             VARCHAR(320)   NOT NULL UNIQUE,
  description      TEXT,
  price            NUMERIC(14, 2) NOT NULL CHECK (price >= 0),
  currency         CHAR(3)        NOT NULL DEFAULT 'TZS',
  brand            VARCHAR(100),
  image_url        TEXT,
  stock_qty        INTEGER        NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
  category_id      UUID           NOT NULL REFERENCES categories    (id),
  subcategory_id   UUID           NOT NULL REFERENCES subcategories (id),
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category    ON products (category_id);
CREATE INDEX idx_products_subcategory ON products (subcategory_id);
CREATE INDEX idx_products_slug        ON products (slug);
CREATE INDEX idx_products_brand       ON products (brand);
CREATE INDEX idx_products_is_active   ON products (is_active);
