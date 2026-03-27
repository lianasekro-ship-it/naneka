-- 013_products_sku_upsert.sql
--
-- PURPOSE
-- -------
-- Confirms the products table is fully ready for SKU-based upsert from
-- the GitHub catalog import route (POST /api/v1/admin/github/products/import).
--
-- This migration is IDEMPOTENT — safe to run on any environment, including
-- one that already has the table. It adds nothing that is already present.
--
-- CURRENT SCHEMA (verified 2026-03-27 on Supabase project qeuwnzzvzcvfxtwqemri)
-- -------------------------------------------------------------------------------
-- Column         Type              Constraint / Default
-- id             uuid              PK, gen_random_uuid()
-- name           varchar(255)      NOT NULL
-- slug           varchar           NOT NULL, UNIQUE
-- description    text
-- price          numeric(14,2)     NOT NULL, CHECK >= 0
-- currency       char(3)           DEFAULT 'TZS'
-- brand          varchar
-- image_url      text
-- stock_qty      integer           DEFAULT 0
-- is_active      boolean           DEFAULT true
-- category_id    uuid              NOT NULL → categories(id)
-- subcategory_id uuid              NOT NULL → subcategories(id)
-- sku            varchar(100)      UNIQUE   ← upsert key for GitHub import
-- features       jsonb             DEFAULT '[]'
-- gallery        jsonb             DEFAULT '[]'
-- cost_price     numeric(14,2)
-- tax_rate       numeric(5,2)      DEFAULT 18.00 (Tanzania VAT)
-- search_vector  tsvector          maintained by trigger (full-text search)
-- created_at     timestamptz       DEFAULT now()
-- updated_at     timestamptz       DEFAULT now()

-- ── Ensure UNIQUE constraint on SKU exists (upsert key for catalog import) ────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'products'
      AND schemaname = 'public'
      AND indexname  = 'products_sku_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);
    RAISE NOTICE 'Added UNIQUE constraint on products.sku';
  ELSE
    RAISE NOTICE 'products.sku UNIQUE constraint already exists — skipping';
  END IF;
END $$;

-- ── Ensure supporting index on SKU for fast lookup ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);

-- ── Auto-update updated_at on every row change ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_products_updated_at'
      AND tgrelid = 'products'::regclass
  ) THEN
    CREATE TRIGGER trg_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    RAISE NOTICE 'Created updated_at trigger on products';
  ELSE
    RAISE NOTICE 'updated_at trigger already exists — skipping';
  END IF;
END $$;
