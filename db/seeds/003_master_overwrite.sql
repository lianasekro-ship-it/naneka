-- =============================================================================
-- Seed 003 — Master Overwrite
-- Clears and re-seeds categories, subcategories, products, and site_sections
-- with the real Naneka retail plan.
--
-- All IDs are fixed UUIDs so this file is safe to re-run (ON CONFLICT DO NOTHING).
-- Run order: DELETE cascades handle FK constraints automatically.
-- =============================================================================

-- ─── 1. Clear in dependency order ────────────────────────────────────────────
-- site_sections has no FK to products/categories, clear independently
DELETE FROM site_sections;

-- products reference categories + subcategories
DELETE FROM products;

-- subcategories reference categories (FK); categories ON DELETE CASCADE covers them,
-- but delete explicitly so the order is readable.
DELETE FROM subcategories;
DELETE FROM categories;

-- ─── 2. Categories ───────────────────────────────────────────────────────────
-- UUIDs: a0000000-0000-0000-0000-000000000001 … 000006

INSERT INTO categories (id, name, slug, icon, sort_order, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Phones & Tablets',  'phones-tablets',    '📱', 1, TRUE),
  ('a0000000-0000-0000-0000-000000000002', 'Electronics',       'electronics',       '🔌', 2, TRUE),
  ('a0000000-0000-0000-0000-000000000003', 'Home & Office',     'home-office',       '🏠', 3, TRUE),
  ('a0000000-0000-0000-0000-000000000004', 'Fashion & Apparel', 'fashion-apparel',   '👗', 4, TRUE),
  ('a0000000-0000-0000-0000-000000000005', 'Kariakoo Hardware', 'kariakoo-hardware', '🔧', 5, TRUE),
  ('a0000000-0000-0000-0000-000000000006', 'Made in Tanzania',  'made-in-tanzania',  '🇹🇿', 6, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Subcategories ────────────────────────────────────────────────────────
-- UUIDs: b0000000-0000-0000-0000-000000000001 … 000018
-- Slugs: prefixed with parent category slug for global uniqueness.

INSERT INTO subcategories (id, category_id, name, slug, sort_order) VALUES
  -- Phones & Tablets
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Smartphones',       'phones-tablets-smartphones',        1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Tablets',           'phones-tablets-tablets',            2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Phone Accessories', 'phones-tablets-phone-accessories',  3),

  -- Electronics
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'TV & Audio',        'electronics-tv-audio',              1),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Fridges & Freezers','electronics-fridges-freezers',       2),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Home Theater',      'electronics-home-theater',          3),

  -- Home & Office
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'Stoves & Cooking',  'home-office-stoves-cooking',        1),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'Cookware & Pots',   'home-office-cookware-pots',         2),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'Beds & Mattresses', 'home-office-beds-mattresses',       3),

  -- Fashion & Apparel
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000004', 'Men''s Clothing',   'fashion-apparel-mens-clothing',     1),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000004', 'Women''s Clothing', 'fashion-apparel-womens-clothing',   2),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000004', 'Kids'' Clothing',   'fashion-apparel-kids-clothing',     3),

  -- Kariakoo Hardware
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000005', 'Hand Tools',        'kariakoo-hardware-hand-tools',      1),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000005', 'Paint & Coatings',  'kariakoo-hardware-paint-coatings',  2),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000005', 'Nails & Fasteners', 'kariakoo-hardware-nails-fasteners', 3),

  -- Made in Tanzania
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000006', 'Local Crafts',      'made-in-tanzania-local-crafts',     1),
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000006', 'Food & Beverages',  'made-in-tanzania-food-beverages',   2),
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000006', 'Textiles & Fabrics','made-in-tanzania-textiles-fabrics', 3)
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Products (30) ────────────────────────────────────────────────────────
-- UUIDs: c0000000-0000-0000-0000-000000000001 … 000030
-- Slugs are brand-name combos, lowercased and hyphenated.

INSERT INTO products
  (id, name, slug, description, price, currency, brand, stock_qty,
   category_id, subcategory_id, sku, is_active)
VALUES

-- ── Phones & Tablets — Smartphones (5 products) ──────────────────────────────
(
  'c0000000-0000-0000-0000-000000000001',
  'Samsung Galaxy A55 5G (128GB)',
  'samsung-galaxy-a55-5g-128gb',
  'Mid-range powerhouse with a 50MP camera, 5000mAh battery, and 5G connectivity. Ideal for Dar es Salaam urban users.',
  850000, 'TZS', 'Samsung', 25,
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'SAM-A55-5G-128', TRUE
),
(
  'c0000000-0000-0000-0000-000000000002',
  'Tecno Spark 20 Pro+ (256GB)',
  'tecno-spark-20-pro-256gb',
  'Africa''s favourite budget flagship — 108MP main camera, 6.78" AMOLED display, fast-charge 5000mAh battery.',
  380000, 'TZS', 'Tecno', 60,
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'TCN-SP20PRO-256', TRUE
),
(
  'c0000000-0000-0000-0000-000000000003',
  'Apple iPhone 15 (128GB)',
  'apple-iphone-15-128gb',
  'Dynamic Island, USB-C charging, 48MP main sensor. The phone East Africa''s professionals choose.',
  2800000, 'TZS', 'Apple', 10,
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'APL-IP15-128', TRUE
),
(
  'c0000000-0000-0000-0000-000000000004',
  'Itel P40 (64GB)',
  'itel-p40-64gb',
  'Entry-level workhorse with a huge 6000mAh battery — perfect for areas with unreliable power.',
  180000, 'TZS', 'Itel', 80,
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'ITL-P40-64', TRUE
),
(
  'c0000000-0000-0000-0000-000000000005',
  'Xiaomi Redmi 13 (128GB)',
  'xiaomi-redmi-13-128gb',
  '108MP AI camera, 90Hz display, and Helio G91 chipset. Exceptional value for money.',
  420000, 'TZS', 'Xiaomi', 40,
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'XMI-RD13-128', TRUE
),

-- ── Electronics — TV & Audio (2 products) ───────────────────────────────────
(
  'c0000000-0000-0000-0000-000000000006',
  'Samsung 43" Crystal UHD 4K Smart TV',
  'samsung-43-crystal-uhd-4k-smart-tv',
  'Vibrant 4K UHD display with Tizen OS, built-in Netflix & YouTube. Perfect centrepiece for any living room.',
  1200000, 'TZS', 'Samsung', 15,
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000004',
  'SAM-TV43-4K', TRUE
),
(
  'c0000000-0000-0000-0000-000000000007',
  'Hisense 32" HD LED Smart TV',
  'hisense-32-hd-led-smart-tv',
  'Compact, energy-efficient smart TV with VIDAA OS and built-in Wi-Fi. Great for bedrooms and small apartments.',
  550000, 'TZS', 'Hisense', 20,
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000004',
  'HIS-TV32-HD', TRUE
),

-- ── Electronics — Fridges & Freezers (2 products) ───────────────────────────
(
  'c0000000-0000-0000-0000-000000000008',
  'LG 260L Double-Door Refrigerator',
  'lg-260l-double-door-refrigerator',
  'Frost-free double-door fridge with inverter compressor for lower electricity bills. Keeps food fresh longer.',
  1450000, 'TZS', 'LG', 8,
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000005',
  'LG-FR260-DD', TRUE
),
(
  'c0000000-0000-0000-0000-000000000009',
  'Samsung 320L Bottom-Mount Fridge',
  'samsung-320l-bottom-mount-fridge',
  'Spacious family fridge with a freezer drawer at the bottom for easy access. All-Around Cooling technology.',
  1800000, 'TZS', 'Samsung', 6,
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000005',
  'SAM-FR320-BM', TRUE
),

-- ── Electronics — Home Theater (1 product) ──────────────────────────────────
(
  'c0000000-0000-0000-0000-000000000010',
  'Sony HT-S400 2.1ch Soundbar',
  'sony-ht-s400-21ch-soundbar',
  'Powerful 330W soundbar with a separate subwoofer. Bluetooth, HDMI ARC, and Sony''s S-Force Pro surround sound.',
  650000, 'TZS', 'Sony', 12,
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000006',
  'SNY-HTS400', TRUE
),

-- ── Home & Office — Stoves & Cooking (2 products) ───────────────────────────
(
  'c0000000-0000-0000-0000-000000000011',
  'Biashara 2-Burner Gas Stove (Table-top)',
  'biashara-2-burner-gas-stove',
  'Sturdy cast-iron burners, auto-ignition, and a tempered glass top. Fits standard 6kg LPG cylinder.',
  95000, 'TZS', 'Biashara', 50,
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000007',
  'BIA-GS2B-AUTO', TRUE
),
(
  'c0000000-0000-0000-0000-000000000012',
  'Lyons 4-Plate Electric Stove',
  'lyons-4-plate-electric-stove',
  'Freestanding electric cooker with 4 hotplates and a 60L oven. Ideal for homes with reliable electricity.',
  185000, 'TZS', 'Lyons', 20,
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000007',
  'LYN-ES4P-60L', TRUE
),

-- ── Home & Office — Cookware & Pots (2 products) ─────────────────────────────
(
  'c0000000-0000-0000-0000-000000000013',
  'Tofaa Non-Stick Pot Set (5-Piece)',
  'tofaa-non-stick-pot-set-5-piece',
  'Granite-coated non-stick pots in 5 sizes (16–24cm). PFOA-free, compatible with gas and electric cookers.',
  120000, 'TZS', 'Tofaa', 35,
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000008',
  'TFA-POT5-GRNIT', TRUE
),
(
  'c0000000-0000-0000-0000-000000000014',
  'Jiko ya Mkaa Charcoal Stove (Large)',
  'jiko-ya-mkaa-charcoal-stove-large',
  'Traditional Kenyan jiko — highly fuel-efficient, ceramic-lined, reduces charcoal consumption by up to 50%.',
  38000, 'TZS', 'Local Craft', 100,
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000007',
  'LOC-JIKO-LRG', TRUE
),

-- ── Home & Office — Beds & Mattresses (2 products) ───────────────────────────
(
  'c0000000-0000-0000-0000-000000000015',
  'Simba Spring Bed + Mattress 5×6',
  'simba-spring-bed-mattress-5x6',
  'Complete bed set: steel spring base and 10" orthopedic mattress. Standard Tanzanian 5×6ft double size.',
  450000, 'TZS', 'Simba', 10,
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000009',
  'SMB-BED56-SPR', TRUE
),
(
  'c0000000-0000-0000-0000-000000000016',
  'Ergonomic Office Chair (Mesh Back)',
  'ergonomic-office-chair-mesh-back',
  'Adjustable lumbar support, armrests, and seat height. Breathable mesh back keeps you cool during long work days.',
  280000, 'TZS', 'OfficePro', 18,
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000009',
  'OFP-CHAIR-MESH', TRUE
),

-- ── Fashion & Apparel — Men's Clothing (2 products) ─────────────────────────
(
  'c0000000-0000-0000-0000-000000000017',
  'Men''s Linen Dress Shirt (White, L)',
  'mens-linen-dress-shirt-white-l',
  'Lightweight 100% linen — the ideal tropical office shirt. Breathable, wrinkle-resistant, available in S–XXL.',
  45000, 'TZS', 'Kanzu Collection', 60,
  'a0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000010',
  'KNZ-SHIRT-WH-L', TRUE
),
(
  'c0000000-0000-0000-0000-000000000018',
  'Men''s Leather Oxford Shoes (Size 42)',
  'mens-leather-oxford-shoes-42',
  'Genuine leather upper, rubber sole. Smart formal shoe handcrafted in Kariakoo — built to last.',
  95000, 'TZS', 'Bora Shoes', 25,
  'a0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000010',
  'BRS-OXF-42', TRUE
),

-- ── Fashion & Apparel — Women's Clothing (2 products) ────────────────────────
(
  'c0000000-0000-0000-0000-000000000019',
  'Women''s Ankara Midi Dress',
  'womens-ankara-midi-dress',
  'Bold African print, flared midi length, concealed zip at the back. Machine washable cotton blend.',
  65000, 'TZS', 'Swahili Stitch', 40,
  'a0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000011',
  'SWS-ANKARA-MIDI', TRUE
),
(
  'c0000000-0000-0000-0000-000000000020',
  'Women''s Block-Heel Sandals (Size 38)',
  'womens-block-heel-sandals-38',
  'Comfortable 5cm block heel, adjustable ankle strap. Faux leather upper, available in black and tan.',
  55000, 'TZS', 'Bora Shoes', 30,
  'a0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000011',
  'BRS-HEEL-38', TRUE
),

-- ── Fashion & Apparel — Kids' Clothing (1 product) ───────────────────────────
(
  'c0000000-0000-0000-0000-000000000021',
  'Kids'' School Uniform Set (Age 8–10)',
  'kids-school-uniform-set-age-8-10',
  'White shirt + navy shorts/skirt + grey socks. Durable poly-cotton blend that survives the school run.',
  35000, 'TZS', 'SchoolReady', 80,
  'a0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000012',
  'SCH-UNIF-8-10', TRUE
),

-- ── Kariakoo Hardware — Hand Tools (3 products) ──────────────────────────────
(
  'c0000000-0000-0000-0000-000000000022',
  'Stanley FatMax 16oz Claw Hammer',
  'stanley-fatmax-16oz-claw-hammer',
  'Anti-vibe handle absorbs 70% of shock. Forged steel head, magnetic nail starter. The go-to hammer in Kariakoo.',
  28000, 'TZS', 'Stanley', 100,
  'a0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000013',
  'STN-HAMMER-16', TRUE
),
(
  'c0000000-0000-0000-0000-000000000023',
  'DeWalt 18V Cordless Drill + 13-Piece Bit Set',
  'dewalt-18v-cordless-drill-13-piece-bit-set',
  '60Nm torque, 2-speed gearbox, LED work light, 2×2Ah Li-Ion batteries included. Used by Dar contractors.',
  185000, 'TZS', 'DeWalt', 12,
  'a0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000013',
  'DWL-DRILL-18V', TRUE
),
(
  'c0000000-0000-0000-0000-000000000024',
  'Jua Kali Combination Spanner Set (8-Piece)',
  'jua-kali-combination-spanner-set-8-piece',
  'Drop-forged chrome-vanadium steel, 8–19mm. The trusted locally-sourced set for mechanics and artisans.',
  35000, 'TZS', 'Jua Kali Tools', 60,
  'a0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000013',
  'JKT-SPAN-8PC', TRUE
),

-- ── Kariakoo Hardware — Paint & Coatings (1 product) ─────────────────────────
(
  'c0000000-0000-0000-0000-000000000025',
  'Sadolin Superdec Exterior Paint (4L, White)',
  'sadolin-superdec-exterior-paint-4l-white',
  'High-build, weather-resistant exterior paint. Resistant to tropical rain and UV. Coverage: ~40m² per coat.',
  52000, 'TZS', 'Sadolin', 45,
  'a0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000014',
  'SDL-EXT-4L-WHT', TRUE
),

-- ── Kariakoo Hardware — Nails & Fasteners (1 product) ────────────────────────
(
  'c0000000-0000-0000-0000-000000000026',
  'Common Wire Nails Assorted Pack (2kg)',
  'common-wire-nails-assorted-pack-2kg',
  'Galvanised wire nails in assorted sizes (1"–3"). 2kg bag — enough for a standard carpentry project.',
  8500, 'TZS', 'Kariakoo Fasteners', 200,
  'a0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000015',
  'KFT-NAIL-2KG', TRUE
),

-- ── Made in Tanzania — Local Crafts (2 products) ─────────────────────────────
(
  'c0000000-0000-0000-0000-000000000027',
  'Tingatinga Art Canvas (A3, Original)',
  'tingatinga-art-canvas-a3-original',
  'Hand-painted Tingatinga original on canvas — vibrant wildlife scenes by Dar es Salaam artisans. Each unique.',
  75000, 'TZS', 'Tingatinga Arts', 20,
  'a0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000016',
  'TNG-ART-A3', TRUE
),
(
  'c0000000-0000-0000-0000-000000000028',
  'Maasai Beaded Bracelet Set (3-Piece)',
  'maasai-beaded-bracelet-set-3-piece',
  'Hand-beaded in red, blue, and white — traditional Maasai patterns. Perfect gift, adjustable fit.',
  12000, 'TZS', 'Maasai Craft', 150,
  'a0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000016',
  'MSI-BEAD-3PC', TRUE
),

-- ── Made in Tanzania — Food & Beverages (2 products) ─────────────────────────
(
  'c0000000-0000-0000-0000-000000000029',
  'Zanzibar Spice Mix Set (6 Jars)',
  'zanzibar-spice-mix-set-6-jars',
  'Cloves, cardamom, cinnamon, cumin, turmeric, and pilau masala — sourced directly from Zanzibar spice farms.',
  22000, 'TZS', 'Zanzibar Spices', 80,
  'a0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000017',
  'ZNZ-SPICE-6JAR', TRUE
),
(
  'c0000000-0000-0000-0000-000000000030',
  'Tanzanian Arabica Coffee Beans (500g)',
  'tanzanian-arabica-coffee-beans-500g',
  'Single-origin Kilimanjaro AA beans, medium roast. Bright acidity, notes of blackcurrant and citrus.',
  28000, 'TZS', 'Kibo Coffee', 60,
  'a0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000017',
  'KBO-COFFEE-500G', TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ─── 5. Site Sections (7 named sections) ─────────────────────────────────────

INSERT INTO site_sections (title, algorithmic_rule, position, is_active) VALUES
  (
    'Hero Banner',
    '{}',
    1,
    TRUE
  ),
  (
    'Shop by Category',
    '{}',
    2,
    TRUE
  ),
  (
    'Featured Phones',
    '{"category_slug": "phones-tablets", "limit": 8}',
    3,
    TRUE
  ),
  (
    'Shop by Brand',
    '{}',
    4,
    TRUE
  ),
  (
    'Hot Deals',
    '{"limit": 8}',
    5,
    TRUE
  ),
  (
    'Our Services',
    '{}',
    6,
    TRUE
  ),
  (
    'Made in Tanzania',
    '{"category_slug": "made-in-tanzania", "limit": 8}',
    7,
    TRUE
  );
