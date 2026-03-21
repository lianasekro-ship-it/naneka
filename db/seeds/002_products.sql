-- 002_products.sql
-- Seed data: 5 categories, 18 subcategories, 30 realistic products (TZS prices)
-- All UUIDs are fixed so this seed is idempotent via ON CONFLICT DO NOTHING.

-- ── Categories ────────────────────────────────────────────────────────────────
INSERT INTO categories (id, name, slug, sort_order) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'Electronics',      'electronics',      1),
  ('aa000000-0000-0000-0000-000000000002', 'Phones',           'phones',           2),
  ('aa000000-0000-0000-0000-000000000003', 'Apparel',          'apparel',          3),
  ('aa000000-0000-0000-0000-000000000004', 'Furniture',        'furniture',        4),
  ('aa000000-0000-0000-0000-000000000005', 'Made in Tanzania', 'made-in-tanzania', 5)
ON CONFLICT (id) DO NOTHING;

-- ── Subcategories ─────────────────────────────────────────────────────────────
INSERT INTO subcategories (id, category_id, name, slug, sort_order) VALUES
  -- Electronics
  ('bb000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'TVs',          'tvs',          1),
  ('bb000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000001', 'Fridges',      'fridges',      2),
  ('bb000000-0000-0000-0000-000000000003', 'aa000000-0000-0000-0000-000000000001', 'Home Theater', 'home-theater', 3),
  ('bb000000-0000-0000-0000-000000000004', 'aa000000-0000-0000-0000-000000000001', 'Microwaves',   'microwaves',   4),
  -- Phones
  ('bb000000-0000-0000-0000-000000000005', 'aa000000-0000-0000-0000-000000000002', 'Smartphones',    'smartphones',    1),
  ('bb000000-0000-0000-0000-000000000006', 'aa000000-0000-0000-0000-000000000002', 'Feature Phones', 'feature-phones', 2),
  ('bb000000-0000-0000-0000-000000000007', 'aa000000-0000-0000-0000-000000000002', 'Tablets',        'tablets',        3),
  -- Apparel
  ('bb000000-0000-0000-0000-000000000008', 'aa000000-0000-0000-0000-000000000003', 'Women',    'women',    1),
  ('bb000000-0000-0000-0000-000000000009', 'aa000000-0000-0000-0000-000000000003', 'Men',      'men',      2),
  ('bb000000-0000-0000-0000-000000000010', 'aa000000-0000-0000-0000-000000000003', 'Kids',     'kids',     3),
  ('bb000000-0000-0000-0000-000000000011', 'aa000000-0000-0000-0000-000000000003', 'Watches',  'watches',  4),
  ('bb000000-0000-0000-0000-000000000012', 'aa000000-0000-0000-0000-000000000003', 'Handbags', 'handbags', 5),
  -- Furniture
  ('bb000000-0000-0000-0000-000000000013', 'aa000000-0000-0000-0000-000000000004', 'Sofas',  'sofas',  1),
  ('bb000000-0000-0000-0000-000000000014', 'aa000000-0000-0000-0000-000000000004', 'Beds',   'beds',   2),
  ('bb000000-0000-0000-0000-000000000015', 'aa000000-0000-0000-0000-000000000004', 'Office', 'office', 3),
  ('bb000000-0000-0000-0000-000000000016', 'aa000000-0000-0000-0000-000000000004', 'Dining', 'dining', 4),
  -- Made in Tanzania
  ('bb000000-0000-0000-0000-000000000017', 'aa000000-0000-0000-0000-000000000005', 'Hardware', 'hardware', 1),
  ('bb000000-0000-0000-0000-000000000018', 'aa000000-0000-0000-0000-000000000005', 'Crafts',   'crafts',   2)
ON CONFLICT (id) DO NOTHING;

-- ── Products (30) ─────────────────────────────────────────────────────────────
INSERT INTO products
  (id, name, slug, description, price, currency, brand, stock_qty, category_id, subcategory_id)
VALUES

-- ── ELECTRONICS · TVs ────────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000001',
  'Samsung 55" Crystal UHD 4K Smart TV',
  'samsung-55-crystal-uhd-4k-smart-tv',
  'Experience cinema-quality visuals with Samsung''s Crystal UHD processor delivering vibrant 4K HDR colour. Built-in Tizen OS supports Netflix, YouTube, and DSTV Now. Slim bezel design, 3× HDMI, Wi-Fi, Bluetooth, and Crystal Processor 4K for upscaling.',
  1250000, 'TZS', 'Samsung', 8,
  'aa000000-0000-0000-0000-000000000001',
  'bb000000-0000-0000-0000-000000000001'
),
(
  'cc000000-0000-0000-0000-000000000002',
  'Hisense 43" Full HD LED Smart TV',
  'hisense-43-full-hd-led-smart-tv',
  'VIDAA U6 smart platform with built-in Wi-Fi, Netflix, YouTube, and Amazon Prime. Full HD 1080p LED panel with Dolby Audio surround sound. USB media playback, HDMI × 2, slim design for small rooms and bedrooms.',
  485000, 'TZS', 'Hisense', 12,
  'aa000000-0000-0000-0000-000000000001',
  'bb000000-0000-0000-0000-000000000001'
),

-- ── ELECTRONICS · Fridges ────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000003',
  'LG 260L Double Door Frost-Free Refrigerator',
  'lg-260l-double-door-frost-free-fridge',
  'Smart Inverter Compressor reduces energy consumption by up to 46%. Frost-free technology eliminates manual defrosting. Features Door Cooling+ for even temperature, Moist Balance Crisper to keep vegetables fresh longer, and multi-air flow system.',
  1450000, 'TZS', 'LG', 5,
  'aa000000-0000-0000-0000-000000000001',
  'bb000000-0000-0000-0000-000000000002'
),
(
  'cc000000-0000-0000-0000-000000000004',
  'Ramtons 93L Single Door Mini Fridge',
  'ramtons-93l-single-door-mini-fridge',
  'Compact and energy-efficient refrigerator ideal for studio apartments, offices, and small households. Adjustable thermostat, removable glass shelves, door storage for bottles and cans, and a small freezer compartment. Rated 220–240 V / 50 Hz.',
  625000, 'TZS', 'Ramtons', 14,
  'aa000000-0000-0000-0000-000000000001',
  'bb000000-0000-0000-0000-000000000002'
),

-- ── ELECTRONICS · Home Theater ───────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000005',
  'Sony HT-S400 2.1ch Soundbar 330W',
  'sony-ht-s400-2-1ch-soundbar-330w',
  'Powerful 330-watt soundbar with a separate wireless subwoofer for deep bass. Dolby Atmos and DTS:X support, Bluetooth 5.0, HDMI ARC, and optical input. X-Balanced Speaker Unit for clear dialogue. One-cable connection to your TV.',
  380000, 'TZS', 'Sony', 7,
  'aa000000-0000-0000-0000-000000000001',
  'bb000000-0000-0000-0000-000000000003'
),

-- ── ELECTRONICS · Microwaves ─────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000006',
  'Ramtons 20L Microwave Oven',
  'ramtons-20l-microwave-oven',
  '700-watt microwave with 5 power levels, digital timer, and defrost function. 20-litre capacity fits a standard dinner plate. Interior light, child safety lock, and easy-clean interior. Compact countertop design for Tanzanian kitchens.',
  175000, 'TZS', 'Ramtons', 18,
  'aa000000-0000-0000-0000-000000000001',
  'bb000000-0000-0000-0000-000000000004'
),

-- ── PHONES · Smartphones · Samsung ──────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000007',
  'Samsung Galaxy A55 5G 8GB/128GB',
  'samsung-galaxy-a55-5g',
  '6.6" Super AMOLED 120Hz display with Gorilla Glass Victus+. Exynos 1480 octa-core processor, 50MP OIS triple camera, 5000mAh battery with 25W fast charging. IP67 water resistance. 5G ready — future-proof for Tanzania''s expanding network.',
  850000, 'TZS', 'Samsung', 15,
  'aa000000-0000-0000-0000-000000000002',
  'bb000000-0000-0000-0000-000000000005'
),
(
  'cc000000-0000-0000-0000-000000000008',
  'Samsung Galaxy S24 FE 8GB/128GB',
  'samsung-galaxy-s24-fe',
  'Fan Edition of the Galaxy S24 flagship. Exynos 2500 processor, 6.7" AMOLED 120Hz, 50MP triple camera with 3× optical zoom, Galaxy AI features, 4700mAh battery, 45W charging. Premium metal frame. Works with Samsung Pay.',
  1650000, 'TZS', 'Samsung', 6,
  'aa000000-0000-0000-0000-000000000002',
  'bb000000-0000-0000-0000-000000000005'
),

-- ── PHONES · Smartphones · Apple ────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000009',
  'Apple iPhone 15 128GB',
  'apple-iphone-15-128gb',
  'A16 Bionic chip — the fastest chip ever in a smartphone. 6.1" Super Retina XDR OLED, Dynamic Island, 48MP main camera with 2× telephoto quality zoom, USB-C charging, Emergency SOS via satellite, and Crash Detection. Available in Pink, Black, Blue, Yellow, Green.',
  2450000, 'TZS', 'Apple', 4,
  'aa000000-0000-0000-0000-000000000002',
  'bb000000-0000-0000-0000-000000000005'
),
(
  'cc000000-0000-0000-0000-000000000010',
  'Apple iPhone 14 128GB',
  'apple-iphone-14-128gb',
  'A15 Bionic chip with 5-core GPU, 6.1" Super Retina XDR, Action Mode video stabilisation, 12MP dual-camera system with Photonic Engine, Crash Detection, and Emergency SOS. iOS 17 ready. Dual eSIM + nano-SIM for two numbers.',
  1850000, 'TZS', 'Apple', 7,
  'aa000000-0000-0000-0000-000000000002',
  'bb000000-0000-0000-0000-000000000005'
),

-- ── PHONES · Smartphones · Tecno ────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000011',
  'Tecno Spark 20 Pro 8GB/256GB',
  'tecno-spark-20-pro',
  '6.78" FHD+ AMOLED 120Hz display, Helio G99 processor, 108MP main camera with night shooting, 5000mAh battery with 18W charging. Android 14 out of the box with TECNO HiOS 13. Side-mounted fingerprint sensor. Excellent for social media creators.',
  320000, 'TZS', 'Tecno', 22,
  'aa000000-0000-0000-0000-000000000002',
  'bb000000-0000-0000-0000-000000000005'
),

-- ── PHONES · Smartphones · Infinix ──────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000012',
  'Infinix Hot 40 Pro 8GB/256GB',
  'infinix-hot-40-pro',
  '6.78" FHD+ IPS LCD, Helio G99 Ultra, 108MP AI triple camera, 5000mAh + 33W fast charging, 90Hz refresh rate. Android 13 with XOS 13. NFC-enabled for contactless payments. Dual SIM + expandable storage up to 1TB.',
  290000, 'TZS', 'Infinix', 28,
  'aa000000-0000-0000-0000-000000000002',
  'bb000000-0000-0000-0000-000000000005'
),

-- ── PHONES · Feature Phones ──────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000013',
  'Tecno T301 Dual SIM Feature Phone',
  'tecno-t301-dual-sim-feature-phone',
  'Reliable dual-SIM phone with long battery life — up to 10 days standby. Built-in FM radio, flashlight, and Swahili menu support. 1000mAh battery, Bluetooth, loud speaker. Ideal for elders and primary school children. Charger included.',
  28000, 'TZS', 'Tecno', 40,
  'aa000000-0000-0000-0000-000000000002',
  'bb000000-0000-0000-0000-000000000006'
),

-- ── PHONES · Tablets ─────────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000014',
  'Samsung Galaxy Tab A9+ 11" Wi-Fi 64GB',
  'samsung-galaxy-tab-a9-plus',
  '11" WUXGA+ LCD at 90Hz, Snapdragon 695 5G processor, 7040mAh battery, quad speakers tuned by Dolby Atmos. Android 13 with Samsung DeX desktop mode. 13MP rear camera, 5MP front. Perfect for students, remote workers, and entertainment.',
  680000, 'TZS', 'Samsung', 9,
  'aa000000-0000-0000-0000-000000000002',
  'bb000000-0000-0000-0000-000000000007'
),

-- ── APPAREL · Women ──────────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000015',
  'Kitenge Ankara Maxi Dress',
  'kitenge-ankara-maxi-dress',
  'Handcrafted from premium West African Ankara cotton in bold, vibrant East African prints. Floor-length A-line silhouette with a fitted bodice, cap sleeves, and side zip. Available in sizes XS–3XL. Machine washable. A celebration of African fashion.',
  45000, 'TZS', 'Naneka Style', 30,
  'aa000000-0000-0000-0000-000000000003',
  'bb000000-0000-0000-0000-000000000008'
),
(
  'cc000000-0000-0000-0000-000000000016',
  'African Print Peplum Blouse',
  'african-print-peplum-blouse',
  'Elegant peplum blouse in authentic Kanga print fabric. V-neck, three-quarter sleeves, and a flattering peplum hem. Pairs with jeans, skirts, or office trousers. Sizes S–XXL. 100% cotton. Hand wash recommended. Perfect for office and casual wear.',
  28000, 'TZS', 'Naneka Style', 45,
  'aa000000-0000-0000-0000-000000000003',
  'bb000000-0000-0000-0000-000000000008'
),

-- ── APPAREL · Men ────────────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000017',
  'Men''s Linen Safari Shirt',
  'mens-linen-safari-shirt',
  '100% premium linen safari shirt with chest pockets and roll-up sleeve tabs. Breathable and sweat-wicking — ideal for Dar es Salaam''s coastal heat. Button-down collar, relaxed fit. Available in Sand, Ivory, Sky Blue, and Olive. Sizes S–3XL.',
  38000, 'TZS', 'Naneka Style', 35,
  'aa000000-0000-0000-0000-000000000003',
  'bb000000-0000-0000-0000-000000000009'
),
(
  'cc000000-0000-0000-0000-000000000018',
  'Men''s Traditional Kanzu (Formal)',
  'mens-traditional-kanzu',
  'Classic white formal Kanzu made from fine Egyptian cotton with a smooth, wrinkle-resistant finish. Traditional collar, full-length cut, inner placket. Standard and embroidered collar options. Sizes 38–56. A wardrobe essential for Eid, weddings, and formal events.',
  55000, 'TZS', 'Naneka Style', 20,
  'aa000000-0000-0000-0000-000000000003',
  'bb000000-0000-0000-0000-000000000009'
),

-- ── APPAREL · Kids ───────────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000019',
  'Boys School Uniform Set (3-Piece)',
  'boys-school-uniform-set-3-piece',
  'Durable 3-piece school uniform set: white short-sleeve shirt, khaki shorts with elastic waist, and a clip-on tie. Poly-cotton blend resists fading after multiple washes. Reinforced stitching at knees and elbows. Ages 4–14. Government-approved colours.',
  22000, 'TZS', 'Naneka Style', 50,
  'aa000000-0000-0000-0000-000000000003',
  'bb000000-0000-0000-0000-000000000010'
),

-- ── APPAREL · Watches ────────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000020',
  'Casio G-Shock GA-100 Watch',
  'casio-g-shock-ga-100',
  'Iconic G-Shock with 200-metre water resistance, shock-resistant structure, and world time across 29 cities. Stopwatch, countdown timer, 5 alarms, and LED backlight. Resin band, mineral glass. Ideal for field work, sports, and everyday East African adventures.',
  135000, 'TZS', 'Casio', 12,
  'aa000000-0000-0000-0000-000000000003',
  'bb000000-0000-0000-0000-000000000011'
),

-- ── APPAREL · Handbags ───────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000021',
  'Women''s Braided Leather Tote Bag',
  'womens-braided-leather-tote-bag',
  'Handcrafted from full-grain cowhide leather by Tanzanian artisans. Large main compartment fits a 15" laptop, inner zip pocket, two slip pockets. Braided top handles and detachable long strap. Available in Tan, Black, and Cognac. Comes with a branded dust bag.',
  85000, 'TZS', 'Naneka Style', 18,
  'aa000000-0000-0000-0000-000000000003',
  'bb000000-0000-0000-0000-000000000012'
),

-- ── FURNITURE · Sofas ────────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000022',
  '3-Seater L-Shape Sofa Set (Grey)',
  '3-seater-l-shape-sofa-set-grey',
  'Contemporary L-shaped sectional in premium grey woven fabric with solid hardwood frame. High-density foam cushions retain shape. Removable washable covers. Dimensions: 270 × 180 cm. Includes 4 throw cushions. 5-year frame warranty. Delivery in Dar es Salaam only.',
  950000, 'TZS', 'Naneka Furnishings', 4,
  'aa000000-0000-0000-0000-000000000004',
  'bb000000-0000-0000-0000-000000000013'
),
(
  'cc000000-0000-0000-0000-000000000023',
  '2-Seater Accent Loveseat (Teal)',
  '2-seater-accent-loveseat-teal',
  'Mid-century modern loveseat in teal velvet with solid beech wood legs in a natural finish. Button-tufted backrest, high-resilience foam seat, and piped trim detailing. W130 × D80 × H85 cm. Ideal for small apartments and reading corners.',
  520000, 'TZS', 'Naneka Furnishings', 6,
  'aa000000-0000-0000-0000-000000000004',
  'bb000000-0000-0000-0000-000000000013'
),

-- ── FURNITURE · Beds ─────────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000024',
  'Queen Size Solid Mahogany Bed Frame',
  'queen-size-solid-mahogany-bed-frame',
  'Handcrafted from locally sourced Tanzanian mahogany. Slatted base with centre support — no box spring needed. Sanded and lacquered finish. W160 × L200 cm (fits standard queen mattress). Headboard with carved motif. Assembled free within Dar es Salaam.',
  750000, 'TZS', 'Naneka Furnishings', 5,
  'aa000000-0000-0000-0000-000000000004',
  'bb000000-0000-0000-0000-000000000014'
),
(
  'cc000000-0000-0000-0000-000000000025',
  'King Size Bed Frame with Under-Bed Storage',
  'king-size-bed-frame-with-storage',
  'Solid pine king bed with four large hydraulic-lift under-bed storage drawers. Ottoman lift system, W180 × L200 cm platform. Upholstered headboard in charcoal grey. Supports up to 400 kg. Built-in USB charging ports on bedside rails. Flat-pack delivery.',
  1100000, 'TZS', 'Naneka Furnishings', 3,
  'aa000000-0000-0000-0000-000000000004',
  'bb000000-0000-0000-0000-000000000014'
),

-- ── FURNITURE · Office ───────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000026',
  'High-Back Executive Leather Office Chair',
  'high-back-executive-leather-office-chair',
  'PU leather high-back ergonomic chair with adjustable lumbar support, headrest, and armrests. Pneumatic seat-height adjustment (44–53 cm), 360° swivel, heavy-duty 5-star chrome base with casters for hard and carpeted floors. Max load: 150 kg.',
  285000, 'TZS', 'Naneka Furnishings', 10,
  'aa000000-0000-0000-0000-000000000004',
  'bb000000-0000-0000-0000-000000000015'
),
(
  'cc000000-0000-0000-0000-000000000027',
  'L-Shaped Computer Desk 160 cm',
  'l-shaped-computer-desk-160cm',
  'Space-saving L-shape desk with a 160 cm main surface and 90 cm return. Includes a monitor shelf, CPU stand, and two cable management grommets. MDF top with a scratch-resistant melamine finish. Steel legs adjust from 71–75 cm. Home office and SME ready.',
  420000, 'TZS', 'Naneka Furnishings', 7,
  'aa000000-0000-0000-0000-000000000004',
  'bb000000-0000-0000-0000-000000000015'
),

-- ── FURNITURE · Dining ───────────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000028',
  '6-Seater Solid Wood Dining Table Set',
  '6-seater-solid-wood-dining-table-set',
  'Rectangular dining table (180 × 90 cm) in solid Mninga wood with a honey-oak finish, plus six padded dining chairs with ladder backs. Hand-jointed mortise-and-tenon construction. Heat-resistant lacquer top. Seats 6 comfortably. Delivery and assembly included in Dar.',
  1250000, 'TZS', 'Naneka Furnishings', 3,
  'aa000000-0000-0000-0000-000000000004',
  'bb000000-0000-0000-0000-000000000016'
),

-- ── MADE IN TANZANIA · Hardware ──────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000029',
  'Mkaa Jiko — Ceramic Charcoal Stove',
  'mkaa-jiko-ceramic-charcoal-stove',
  'Traditional Kenyan-style ceramic liner jiko handmade by Tanzanian potters in Morogoro. The ceramic lining reduces charcoal consumption by up to 40% compared to metal jikos. Diameter 25 cm, height 30 cm. Supports pots up to 40 cm. Buy local, save fuel, support artisans.',
  18500, 'TZS', 'Jiko Masters TZ', 100,
  'aa000000-0000-0000-0000-000000000005',
  'bb000000-0000-0000-0000-000000000017'
),

-- ── MADE IN TANZANIA · Crafts ────────────────────────────────────────────────
(
  'cc000000-0000-0000-0000-000000000030',
  'Handwoven Sisal Market Basket (Kikapu)',
  'handwoven-sisal-market-basket-kikapu',
  'Authentic kikapu woven by women artisans in Kilimanjaro using natural sisal fibre. Each basket is unique with hand-dyed geometric patterns in earth tones. Diameter 45 cm, depth 35 cm, load capacity 10 kg. Reusable, biodegradable, and plastic-free. Fair-trade certified.',
  32000, 'TZS', 'Kilimanjaro Crafts', 65,
  'aa000000-0000-0000-0000-000000000005',
  'bb000000-0000-0000-0000-000000000018'
)

ON CONFLICT (id) DO NOTHING;
