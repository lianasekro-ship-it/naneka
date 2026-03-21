-- Migration 006: Add order_number column
-- Human-readable 8-char receipt code derived from the first 8 hex chars of the UUID.
-- Stored explicitly so it can be indexed and looked up without a computed expression.
-- Example: UUID db219ac5-... → order_number DB219AC5

ALTER TABLE orders
  ADD COLUMN order_number VARCHAR(8);

-- Back-fill existing rows
UPDATE orders
  SET order_number = UPPER(LEFT(id::text, 8));

ALTER TABLE orders
  ALTER COLUMN order_number SET NOT NULL;

CREATE UNIQUE INDEX idx_orders_order_number ON orders (order_number);
