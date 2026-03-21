-- Migration 012: Add is_active and image_url to categories
-- Allows toggling category visibility in the storefront and storing category banner images.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS image_url  TEXT;
