-- 009_enhance_products.sql
-- Adds professional product fields: SKU, feature list, image gallery,
-- cost price (for COGS), and tax rate (default 18% Tanzania VAT).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku         VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS features    JSONB        NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS gallery     JSONB        NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cost_price  NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS tax_rate    NUMERIC(5,  2) NOT NULL DEFAULT 18.00;

-- Back-fill SKU for existing seeded products using pattern NAN-{first8ofUUID}
UPDATE products
SET    sku = 'NAN-' || UPPER(LEFT(id::text, 8))
WHERE  sku IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
