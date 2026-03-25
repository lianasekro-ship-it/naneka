/* ─── Central Product Catalogue ─────────────────────────────────────────────── */
// Single source of truth for categories and all products.
// marketPrice = Kariakoo market average (used for Price Match Guarantee badge).

export const CATEGORIES = [
  {
    id: 'electronics', icon: '📺', label: 'Electronics',
    subs: ['TVs & Monitors', 'Fridges & Freezers', 'Home Theater', 'Washing Machines', 'Microwaves', 'Air Conditioners'],
  },
  {
    id: 'clothing', icon: '👗', label: 'Women, Kids & Men',
    subs: ["Women's Dresses", "Women's Shoes", "Men's Shirts", "Men's Trousers", 'Kids Clothing', 'Kids Shoes', 'School Bags'],
  },
  {
    id: 'kitchen', icon: '🍳', label: 'Kitchen & Home',
    subs: ['Gas Stoves', 'Electric Stoves', 'Pots & Cookware', 'Blenders & Mixers', 'Pressure Cookers', 'Kitchen Tools'],
  },
  {
    id: 'watches', icon: '⌚', label: 'Watches & Handbags',
    subs: ["Men's Watches", "Ladies' Watches", 'Handbags', 'Wallets & Purses', 'Sunglasses', 'Belts'],
  },
  {
    id: 'furniture', icon: '🛋️', label: 'Furniture',
    subs: ['Sofas & Couches', 'Beds & Mattresses', 'Dining Sets', 'Wardrobes', 'Office Chairs', 'Storage & Shelves'],
  },
  {
    id: 'made-in-tz', icon: '🇹🇿', label: 'Made in Tanzania',
    subs: ['Handcrafted Cookware', 'Local Textiles', 'Kiondo Baskets', 'Artisan Woodwork', 'Hardware Tools', 'Building Materials'],
  },
  {
    id: 'phones', icon: '📱', label: 'Phones & Accessories',
    subs: ['Infinix Phones', 'Tecno Phones', 'Samsung', 'Phone Cases', 'Chargers & Cables', 'Earphones & Headsets'],
  },
];

export const PRODUCTS = [

  /* ── Electronics: TVs ────────────────────────────────────────────────────── */
  {
    id: 'samsung-55-uhd-tv',
    name: 'Samsung 55" UHD Smart TV',
    description: '4K UHD, HDR10+, built-in Netflix & YouTube, 3 HDMI ports. The living room centrepiece.',
    longDescription: 'Crystal-clear 4K UHD resolution with Samsung\'s HDR10+ dynamic tone-mapping. Built-in Wi-Fi, pre-installed Netflix, YouTube, and Prime Video. Voice control via Bixby. 3 HDMI + 2 USB. 2-year local warranty.',
    price: 1_200_000, marketPrice: 1_450_000, stock: 5,
    brand: 'Samsung', category: 'electronics', subcategory: 'TVs & Monitors',
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/samtv55a/800/600', 'https://picsum.photos/seed/samtv55b/800/600'],
    specs: ['55" 4K UHD', 'HDR10+', 'Smart TV (Tizen)', '3× HDMI / 2× USB', 'Wi-Fi + Bluetooth'],
  },
  {
    id: 'lg-32-full-hd-tv',
    name: 'LG 32" Full HD TV',
    description: 'Full HD 1080p LED, 2 HDMI, USB media player, energy-saving mode. Great for bedrooms.',
    longDescription: 'Crisp Full HD picture with LG\'s IPS panel for wide viewing angles. Two HDMI inputs and a USB port for playing movies directly from a flash drive. Auto energy-saving mode cuts consumption by up to 30%.',
    price: 480_000, marketPrice: 560_000, stock: 12,
    brand: 'LG', category: 'electronics', subcategory: 'TVs & Monitors',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/lgtv32a/800/600', 'https://picsum.photos/seed/lgtv32b/800/600'],
    specs: ['32" Full HD 1080p', 'IPS LED panel', '2× HDMI / 1× USB', 'Energy-saving mode', 'VESA wall-mount ready'],
  },

  /* ── Electronics: Fridges ─────────────────────────────────────────────────── */
  {
    id: 'lg-260l-fridge',
    name: 'LG 260L Double-Door Fridge',
    description: 'Frost-free, No-Look Door cooling tech, A+ energy rated. Keeps your food fresh longer.',
    longDescription: 'LG\'s Linear Compressor runs quieter and more efficiently than standard compressors — 20-year warranty on the motor. The No-Look Cooling feature maintains temperature even when you open the door. Frost-free operation means no manual defrosting. Perfect for a family of 4–6.',
    price: 1_450_000, marketPrice: 1_700_000, stock: 4,
    brand: 'LG', category: 'electronics', subcategory: 'Fridges & Freezers',
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/lgfridge1/800/600', 'https://picsum.photos/seed/lgfridge2/800/600'],
    specs: ['260L total capacity', 'Frost-free', 'A+ energy rating', 'Linear Compressor', 'No-Look Door Cooling'],
  },
  {
    id: 'ramtons-bar-fridge-60l',
    name: 'Ramtons Bar Fridge 60L',
    description: 'Compact single-door, 60L, adjustable shelves, ideal for offices, dorm rooms, small kitchens.',
    longDescription: 'Slim profile fits under any counter. Adjustable glass shelf and a full-width chiller tray. Door storage for bottles and cans. Low noise compressor. Suitable for 220–240V / 50Hz power supply.',
    price: 265_000, marketPrice: 320_000, stock: 9,
    brand: 'Ramtons', category: 'electronics', subcategory: 'Fridges & Freezers',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/barfridge1/800/600', 'https://picsum.photos/seed/barfridge2/800/600'],
    specs: ['60L capacity', 'Single door', 'Adjustable glass shelf', 'Low-noise compressor', '220–240V compatible'],
  },

  /* ── Electronics: Washing Machines ───────────────────────────────────────── */
  {
    id: 'samsung-7kg-washer',
    name: 'Samsung 7kg Front-Load Washer',
    description: '15 wash programs, 1200 RPM spin, Eco Bubble tech. Gentle on clothes, tough on stains.',
    longDescription: 'Eco Bubble technology creates foam before the wash cycle, penetrating fabric quickly and washing at lower temperatures without sacrificing cleaning power. Saves up to 70% energy vs top-loaders. Digital Inverter motor is quieter, more durable, and energy efficient.',
    price: 1_100_000, marketPrice: 1_300_000, stock: 3,
    brand: 'Samsung', category: 'electronics', subcategory: 'Washing Machines',
    badge: 'Signature', madeInTanzania: false,
    images: ['https://picsum.photos/seed/samwash1/800/600', 'https://picsum.photos/seed/samwash2/800/600'],
    specs: ['7kg load capacity', 'Front-load', '1200 RPM spin', 'Eco Bubble tech', '15 wash programs'],
  },

  /* ── Clothing: Women ──────────────────────────────────────────────────────── */
  {
    id: 'ankara-maxi-dress',
    name: 'Ankara Maxi Dress',
    description: 'Vibrant wax-print Ankara fabric, A-line cut, sizes S–XL. Handmade in Dar es Salaam.',
    longDescription: 'Crafted from premium Dutch wax-print Ankara fabric by local tailors in Kariakoo. The A-line silhouette flatters all body types. Fully lined, concealed side zip. Hand-wash recommended to preserve colour.',
    price: 65_000, marketPrice: 85_000, stock: 22,
    brand: 'Kariakoo Fashion', category: 'clothing', subcategory: "Women's Dresses",
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/ankdress1/800/600', 'https://picsum.photos/seed/ankdress2/800/600'],
    specs: ['Wax-print Ankara', 'A-line cut, fully lined', 'Sizes S / M / L / XL', 'Concealed side zip', 'Handmade in Dar es Salaam'],
  },
  {
    id: 'ladies-office-blouse',
    name: "Ladies' Office Blouse",
    description: 'Chiffon, flutter sleeves, V-neck, sizes XS–2XL. Professional and comfortable.',
    longDescription: 'Lightweight chiffon blouse perfect for the office or smart-casual events. Flutter sleeves drape elegantly. V-neck with a small front tuck. Machine washable at 30°C on gentle cycle.',
    price: 38_000, marketPrice: 52_000, stock: 30,
    brand: 'Nairobi Wear', category: 'clothing', subcategory: "Women's Dresses",
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/offblouse1/800/600', 'https://picsum.photos/seed/offblouse2/800/600'],
    specs: ['Chiffon fabric', 'V-neck, flutter sleeves', 'Sizes XS–2XL', 'Machine washable 30°C', 'Wrinkle-resistant'],
  },

  /* ── Clothing: Kids ───────────────────────────────────────────────────────── */
  {
    id: 'school-uniform-set',
    name: 'School Uniform Set (Age 5–12)',
    description: 'White shirt + khaki trousers/skirt. Stain-resistant cotton blend, machine washable.',
    longDescription: 'The school-approved standard uniform set worn across government primary schools in Tanzania. Stain-resistant cotton-polyester blend holds its shape wash after wash. Reinforced knee areas for active play.',
    price: 35_000, marketPrice: 48_000, stock: 45,
    brand: 'School Gear TZ', category: 'clothing', subcategory: 'Kids Clothing',
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/uniform1/800/600', 'https://picsum.photos/seed/uniform2/800/600'],
    specs: ['White shirt + khaki trousers/skirt', 'Cotton-polyester blend', 'Stain-resistant', 'Ages 5 / 7 / 9 / 11 / 12', 'Machine washable'],
  },
  {
    id: 'kids-canvas-shoes',
    name: "Kids' Canvas School Shoes",
    description: 'Black canvas, rubber sole, velcro strap. Sizes 28–36. Durable for daily school wear.',
    longDescription: 'Sturdy black canvas uppers with a thick rubber sole that grips both classroom tiles and the schoolyard. Velcro strap for quick on/off. Reinforced toe cap protects from scuffs.',
    price: 22_000, marketPrice: 30_000, stock: 60,
    brand: 'Bata', category: 'clothing', subcategory: 'Kids Shoes',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/kidsshoe1/800/600', 'https://picsum.photos/seed/kidsshoe2/800/600'],
    specs: ['Black canvas upper', 'Rubber sole', 'Velcro strap', 'Sizes 28–36', 'Reinforced toe cap'],
  },
  {
    id: 'school-bag-primary',
    name: 'Primary School Backpack',
    description: 'Water-resistant 20L, padded back, 2 compartments + pencil case pocket. Ages 5–12.',
    longDescription: 'Bright, cheerful design with enough capacity for textbooks, a lunchbox, and a water bottle. Water-resistant 600D polyester shell. Padded back panel and adjustable shoulder straps reduce fatigue during the long walk to school.',
    price: 28_000, marketPrice: 38_000, stock: 35,
    brand: 'Hifadhi Bags', category: 'clothing', subcategory: 'School Bags',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/schoolbag1/800/600', 'https://picsum.photos/seed/schoolbag2/800/600'],
    specs: ['20L capacity', 'Water-resistant 600D polyester', '2 main compartments', 'Pencil case pocket', 'Ages 5–12'],
  },

  /* ── Clothing: Men ────────────────────────────────────────────────────────── */
  {
    id: 'mens-kanzu',
    name: "Men's Kanzu (White)",
    description: 'Premium white cotton kanzu, sizes S–3XL. Essential for Friday prayers and formal occasions.',
    longDescription: 'Woven from 100% Egyptian cotton for a crisp, clean drape. Pre-washed to minimise shrinkage. The standard white kanzu worn across the Tanzanian coast for religious and formal occasions. Sizes S through 3XL.',
    price: 45_000, marketPrice: 60_000, stock: 25,
    brand: 'Zanzibari Threads', category: 'clothing', subcategory: "Men's Shirts",
    badge: 'Best Seller', madeInTanzania: true,
    images: ['https://picsum.photos/seed/kanzu1/800/600', 'https://picsum.photos/seed/kanzu2/800/600'],
    specs: ['100% Egyptian cotton', 'Pre-washed', 'Sizes S / M / L / XL / 2XL / 3XL', 'Machine washable', 'Made in Zanzibar'],
  },

  /* ── Kitchen ──────────────────────────────────────────────────────────────── */
  {
    id: 'gas-stove-2-burner',
    name: 'Gas Stove 2-Burner',
    description: 'Cast-iron supports, enamel finish, compatible with all LPG cylinders. Top seller in Kariakoo.',
    longDescription: 'A household staple across Kariakoo and beyond. Delivers reliable, even heat on both burners simultaneously. The enamel-coated body wipes clean with a damp cloth. Cast iron pan supports keep your heaviest sufurias steady. Ships with a standard LPG hose and regulator.',
    price: 85_000, marketPrice: 105_000, stock: 24,
    brand: 'Ramtons', category: 'kitchen', subcategory: 'Gas Stoves',
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/stove2a/800/600', 'https://picsum.photos/seed/stove2b/800/600'],
    specs: ['2 burners', 'Manual ignition', 'Cast iron pan supports', 'Enamel body finish', 'LPG / PNG compatible'],
  },
  {
    id: 'gas-stove-4-burner',
    name: 'Gas Stove 4-Burner Premium',
    description: 'Auto-ignition, stainless steel surface, safety flame-failure valve on every burner.',
    longDescription: 'Designed for serious cooks and catering professionals. Auto-ignition on all four burners, a stainless steel surface that resists corrosion, and a fail-safe gas valve that cuts flow if any flame is accidentally extinguished.',
    price: 195_000, marketPrice: 240_000, stock: 8,
    brand: 'Ramtons', category: 'kitchen', subcategory: 'Gas Stoves',
    badge: 'Signature', madeInTanzania: false,
    images: ['https://picsum.photos/seed/stove4a/800/600', 'https://picsum.photos/seed/stove4b/800/600'],
    specs: ['4 burners', 'Auto-ignition', 'Stainless steel surface', 'Tempered glass lid', 'Safety flame-failure valve'],
  },
  {
    id: 'nonstick-pot-set',
    name: 'Non-Stick Pot Set (3 pcs)',
    description: 'Granite-coated PFOA-free pots — 2L, 3L, 5L. Tempered glass lids, silicone handles.',
    longDescription: 'The granite mineral coating creates a naturally non-stick surface requiring minimal oil. Heat-proof silicone handles stay cool even on a high flame. Suitable for all cooktops including induction.',
    price: 78_000, marketPrice: 98_000, stock: 19,
    brand: 'Tefal', category: 'kitchen', subcategory: 'Pots & Cookware',
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/potset1/800/600', 'https://picsum.photos/seed/potset2/800/600'],
    specs: ['Sizes: 2L, 3L, 5L', 'Granite non-stick coating', 'PFOA-free', 'Tempered glass lids', 'Induction compatible'],
  },
  {
    id: 'sufuria-set-5',
    name: 'Aluminum Sufuria Set (5 pcs)',
    description: 'Polished thick-gauge aluminum in 8", 10", 12", 14", 16". The Kariakoo household classic.',
    longDescription: 'Made using thick-gauge aluminium that heats quickly and evenly. These sufurias last decades. Used in homes and mama ntilie restaurants across Dar es Salaam. Lightweight yet robust.',
    price: 42_000, marketPrice: 55_000, stock: 31, emoji: '🍲',
    brand: 'Kariakoo Metals', category: 'kitchen', subcategory: 'Pots & Cookware',
    badge: 'New', madeInTanzania: true,
    images: ['https://picsum.photos/seed/sufuria1/800/600', 'https://picsum.photos/seed/sufuria2/800/600'],
    specs: ['Sizes: 8", 10", 12", 14", 16"', 'Thick-gauge aluminum', 'Polished finish', 'Lightweight', 'Dishwasher safe'],
  },
  {
    id: 'pressure-cooker-6l',
    name: 'Pressure Cooker 6L',
    description: 'Stainless steel, cooks beans 70% faster. Three independent safety mechanisms.',
    longDescription: 'Stop waiting hours for maharagwe and nyama to soften. The Kiam 6L cooks beef stew in 25 minutes and kidney beans in 20. Three independent safety mechanisms prevent over-pressurization.',
    price: 55_000, marketPrice: 72_000, stock: 11,
    brand: 'Kiam', category: 'kitchen', subcategory: 'Pressure Cookers',
    badge: 'Limited', madeInTanzania: false,
    images: ['https://picsum.photos/seed/presskia/800/600', 'https://picsum.photos/seed/presskib/800/600'],
    specs: ['6L capacity', 'Stainless steel body', '3 safety valves', 'Locking pressure indicator', 'All stove types'],
  },
  {
    id: 'electric-blender-2l',
    name: 'Electric Blender 2L',
    description: '1000W motor, stainless steel blades, 5-speed + pulse. Crushes ice effortlessly.',
    longDescription: 'Blend, chop, and crush with professional power. The stainless steel blade assembly handles frozen fruit, ice, and raw vegetables without strain. The 2L BPA-free jar is dishwasher safe.',
    price: 65_000, marketPrice: 82_000, stock: 20,
    brand: 'Ramtons', category: 'kitchen', subcategory: 'Blenders & Mixers',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/blendera/800/600', 'https://picsum.photos/seed/blenderb/800/600'],
    specs: ['1000W motor', '2L BPA-free jar', 'Stainless steel blades', '5 speeds + pulse', 'Dishwasher-safe jar'],
  },

  /* ── Watches ──────────────────────────────────────────────────────────────── */
  {
    id: 'michael-kors-ladies-watch',
    name: "Michael Kors Ladies' Watch",
    description: 'Rose gold-tone, crystal-set bezel, 38mm case, leather strap. Imported with authentication card.',
    longDescription: 'A timeless piece from Michael Kors — rose gold-tone stainless steel case with a crystal-set bezel. Leather strap with deployment clasp. Water resistant to 50m. Includes original box and authentication card.',
    price: 450_000, marketPrice: 580_000, stock: 6,
    brand: 'Michael Kors', category: 'watches', subcategory: "Ladies' Watches",
    badge: 'Signature', madeInTanzania: false,
    images: ['https://picsum.photos/seed/mkwatch1/800/600', 'https://picsum.photos/seed/mkwatch2/800/600'],
    specs: ['38mm rose gold-tone case', 'Crystal-set bezel', 'Leather strap', 'Water resistant 50m', 'Includes auth card'],
  },
  {
    id: 'casio-mens-watch',
    name: "Casio Men's Classic Watch",
    description: 'Stainless steel, mineral glass, 50m water resistant. The reliable everyday timepiece.',
    longDescription: 'Casio\'s classic analogue watch — shock-resistant mineral glass crystal, stainless steel case and bracelet, and 50m water resistance for rain and washing. Battery life: approx. 3 years.',
    price: 85_000, marketPrice: 110_000, stock: 18,
    brand: 'Casio', category: 'watches', subcategory: "Men's Watches",
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/casio1/800/600', 'https://picsum.photos/seed/casio2/800/600'],
    specs: ['40mm stainless steel case', 'Mineral glass crystal', '50m water resistant', 'Stainless bracelet', '~3 year battery'],
  },
  {
    id: 'mens-leather-wallet',
    name: "Men's Genuine Leather Wallet",
    description: 'Full-grain leather, 8 card slots, RFID-blocking. Slim bifold design.',
    longDescription: 'Crafted from full-grain cowhide leather that develops a rich patina with age. RFID-blocking inner lining protects your bank cards. 8 card slots + 2 bill compartments. Slim enough to sit comfortably in a front pocket.',
    price: 25_000, marketPrice: 38_000, stock: 40,
    brand: 'LeatherCraft TZ', category: 'watches', subcategory: 'Wallets & Purses',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/wallet1/800/600', 'https://picsum.photos/seed/wallet2/800/600'],
    specs: ['Full-grain cowhide leather', '8 card slots', 'RFID-blocking lining', 'Slim bifold', 'Handcrafted in DSM'],
  },
  {
    id: 'ladies-handbag-black',
    name: "Ladies' Tote Handbag (Black)",
    description: 'PU leather, gold-tone hardware, inner zip pocket + phone pocket. Office & weekend ready.',
    longDescription: 'Spacious structured tote in jet black PU leather with a polished gold-tone zip and hardware. Interior has a full-length zip divider, a phone pocket, and a pen holder. Padded top handles + detachable shoulder strap.',
    price: 68_000, marketPrice: 90_000, stock: 15,
    brand: 'Nairobi Style', category: 'watches', subcategory: 'Handbags',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/handbag1/800/600', 'https://picsum.photos/seed/handbag2/800/600'],
    specs: ['PU leather', 'Gold-tone hardware', 'Inner zip + phone pocket', 'Detachable shoulder strap', 'Approx. 35×28×12cm'],
  },

  /* ── Furniture ────────────────────────────────────────────────────────────── */
  {
    id: 'orthopedic-mattress-6x6',
    name: 'Orthopedic Mattress 6×6',
    description: 'High-density foam, orthopedic support, anti-bacterial cover. 6×6 (Queen). 10-year warranty.',
    longDescription: 'The Comfort Plus range features a multi-zone high-density foam core that distributes body weight evenly, reducing pressure on the lower back. The quilted top layer adds surface softness. Certified anti-bacterial cover. 10-year manufacturer warranty.',
    price: 380_000, marketPrice: 460_000, stock: 7,
    brand: 'Comfort Plus TZ', category: 'furniture', subcategory: 'Beds & Mattresses',
    badge: 'Best Seller', madeInTanzania: true,
    images: ['https://picsum.photos/seed/mattress1/800/600', 'https://picsum.photos/seed/mattress2/800/600'],
    specs: ['6×6 Queen size', 'High-density orthopedic foam', 'Anti-bacterial cover', 'Quilted top layer', '10-year warranty'],
  },
  {
    id: 'ergonomic-office-chair',
    name: 'Ergonomic Office Chair',
    description: 'Mesh back, lumbar support, adjustable height & armrests, 360° swivel. Supports up to 120kg.',
    longDescription: 'Breathable mesh back prevents heat build-up during long work sessions. Adjustable lumbar support positions to your spine\'s natural curve. Height-adjustable padded armrests. Smooth-rolling wheels suitable for both hard floors and carpet.',
    price: 280_000, marketPrice: 350_000, stock: 10,
    brand: 'OfficePro', category: 'furniture', subcategory: 'Office Chairs',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/offchair1/800/600', 'https://picsum.photos/seed/offchair2/800/600'],
    specs: ['Mesh back', 'Adjustable lumbar support', 'Height-adjustable armrests', '360° swivel', 'Up to 120kg load'],
  },
  {
    id: 'l-shaped-sofa',
    name: 'L-Shaped Fabric Sofa',
    description: '5-seater L-shape, high-density foam cushions, choice of grey or beige fabric.',
    longDescription: 'The Oslo L-shaped sofa seats 5 comfortably. High-density foam seat cushions with removable, washable covers. Solid hardwood frame construction. Available in light grey and beige. Free delivery + assembly in Dar es Salaam.',
    price: 850_000, marketPrice: 1_050_000, stock: 3,
    brand: 'Casa Dar', category: 'furniture', subcategory: 'Sofas & Couches',
    badge: 'Signature', madeInTanzania: true,
    images: ['https://picsum.photos/seed/sofa1/800/600', 'https://picsum.photos/seed/sofa2/800/600'],
    specs: ['5-seater L-shape', 'High-density foam', 'Removable/washable covers', 'Solid hardwood frame', 'Grey or Beige'],
  },
  {
    id: 'dining-set-6-seater',
    name: 'Dining Table & 6 Chairs',
    description: 'Solid mahogany dining set, 180cm table, 6 padded chairs. Handcrafted in Tanzania.',
    longDescription: 'Heirloom-quality solid Tanzanian mahogany dining table with six matching padded chairs. Mortise-and-tenon joinery for lifelong durability. Table extends from 180cm to 240cm with the included leaf. Chairs have removable seat cushions.',
    price: 1_350_000, marketPrice: 1_700_000, stock: 2,
    brand: 'Kariakoo Furniture', category: 'furniture', subcategory: 'Dining Sets',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/dining1/800/600', 'https://picsum.photos/seed/dining2/800/600'],
    specs: ['Solid Tanzanian mahogany', '180–240cm extendable table', '6 padded chairs', 'Mortise & tenon joints', 'Handcrafted in DSM'],
  },

  /* ── Made in Tanzania ─────────────────────────────────────────────────────── */
  {
    id: 'kiondo-basket',
    name: 'Kariakoo Kiondo Basket',
    description: 'Handwoven sisal kiondo from Kilimanjaro artisans. Natural dyes, no plastic.',
    longDescription: 'Each kiondo is handwoven by skilled artisans from the Kilimanjaro region using locally sourced sisal fibres and natural plant-based dyes. No two baskets are identical. Perfect as a shopping basket, fruit bowl, or home decor piece.',
    price: 45_000, marketPrice: 62_000, stock: 14, emoji: '🧺',
    brand: 'Kilimanjaro Crafts', category: 'made-in-tz', subcategory: 'Kiondo Baskets',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/kiondoa/800/600', 'https://picsum.photos/seed/kiondob/800/600'],
    specs: ['Handwoven sisal', 'Natural plant dyes', 'Kilimanjaro origin', 'Approx. 35cm diameter', 'Supports local artisans'],
  },
  {
    id: 'kilimanjaro-coffee-250g',
    name: 'Kilimanjaro Arabica Coffee 250g',
    description: 'Single-origin Arabica, medium roast, whole bean or ground. Grown at 1,500m elevation.',
    longDescription: 'Grown in the volcanic soils of the Kilimanjaro slopes at 1,500m. The high altitude and cool nights produce beans with a bright acidity, medium body, and notes of dark chocolate and dried fruit. Roasted in Arusha and packed within 48 hours.',
    price: 28_000, marketPrice: 38_000, stock: 50, emoji: '☕',
    brand: 'Kili Coffee Co.', category: 'made-in-tz', subcategory: 'Handcrafted Cookware',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/coffee1/800/600', 'https://picsum.photos/seed/coffee2/800/600'],
    specs: ['Single-origin Arabica', '250g', 'Medium roast', 'Whole bean or ground', 'Grown at 1,500m elevation'],
  },
  {
    id: 'wooden-mortar-pestle',
    name: 'Handcarved Mortar & Pestle',
    description: 'Solid mango wood, carved by Dar es Salaam craftsmen. Food-safe, 16cm diameter.',
    longDescription: 'Crushed spices release their essential oils far better than electric grinders. Carved from food-safe mango wood by Kariakoo-based craftsmen who have practised this trade for generations.',
    price: 28_000, marketPrice: 38_000, stock: 9, emoji: '🪵',
    brand: 'Kariakoo Crafts', category: 'made-in-tz', subcategory: 'Artisan Woodwork',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/mortara/800/600', 'https://picsum.photos/seed/mortarb/800/600'],
    specs: ['Solid mango wood', 'Food-safe finish', 'Approx. 16cm diameter', 'Includes pestle', 'Handcarved in DSM'],
  },
  {
    id: 'batik-table-runner',
    name: 'Batik Print Table Runner',
    description: 'Hand-stamped wax-resist batik, 40cm×200cm. Tinga-tinga wildlife motifs. Machine washable.',
    longDescription: 'Made using the traditional wax-resist batik method practised on the Tanzanian coast for centuries. The tinga-tinga animal motifs are stamped by hand and dye-bathed three times for vibrant, lasting colour.',
    price: 18_500, marketPrice: 28_000, stock: 17, emoji: '🎨',
    brand: 'Dar Textiles', category: 'made-in-tz', subcategory: 'Local Textiles',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/batixa/800/600', 'https://picsum.photos/seed/batixb/800/600'],
    specs: ['40cm × 200cm', 'Wax-resist batik', 'Cotton fabric', 'Hand-stamped motifs', 'Machine washable 30°C'],
  },

  /* ── Phones ───────────────────────────────────────────────────────────────── */
  {
    id: 'samsung-galaxy-a55',
    name: 'Samsung Galaxy A55 5G',
    description: '6.6" AMOLED, 50MP triple camera, 5000mAh, 256GB, 5G. 2-year Samsung warranty.',
    longDescription: 'The Galaxy A55 brings flagship-level features to the mid-range. 6.6" Super AMOLED 120Hz display, a 50MP main + 12MP ultra-wide + 5MP macro camera array, and a massive 5000mAh battery. 5G ready for Tanzania\'s expanding network. 8GB RAM + 256GB storage.',
    price: 850_000, marketPrice: 980_000, stock: 8,
    brand: 'Samsung', category: 'phones', subcategory: 'Samsung',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/sama55a/800/600', 'https://picsum.photos/seed/sama55b/800/600'],
    specs: ['6.6" Super AMOLED 120Hz', '50MP + 12MP + 5MP cameras', '5000mAh battery', '8GB RAM / 256GB storage', '5G'],
  },
  {
    id: 'tecno-camon-30',
    name: 'Tecno Camon 30',
    description: '6.78" AMOLED, 50MP AI camera, 5000mAh, 128GB. Best camera phone under 600k TZS.',
    longDescription: 'Tecno\'s Camon series is legendary for camera quality at an accessible price. The Camon 30 packs a 50MP AI-enhanced main sensor with OIS, a 6.78" 144Hz AMOLED screen, and a 5000mAh battery that easily lasts two days.',
    price: 550_000, marketPrice: 650_000, stock: 15,
    brand: 'Tecno', category: 'phones', subcategory: 'Tecno Phones',
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/camon30a/800/600', 'https://picsum.photos/seed/camon30b/800/600'],
    specs: ['6.78" AMOLED 144Hz', '50MP AI camera (OIS)', '5000mAh battery', '8GB RAM / 128GB storage', 'Android 14'],
  },
  {
    id: 'infinix-hot-40',
    name: 'Infinix Hot 40',
    description: '6.78" LCD, 50MP camera, 5000mAh, 128GB. The most affordable smartphone with good specs.',
    longDescription: 'Infinix Hot 40 offers an impressive spec sheet at an unbeatable price. 50MP main camera, large 6.78" HD+ display, 5000mAh battery with 18W fast charging, and 8GB extended RAM for smooth multitasking.',
    price: 320_000, marketPrice: 390_000, stock: 25,
    brand: 'Infinix', category: 'phones', subcategory: 'Infinix Phones',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/infhot40a/800/600', 'https://picsum.photos/seed/infhot40b/800/600'],
    specs: ['6.78" HD+ display', '50MP main camera', '5000mAh + 18W fast charge', '8GB RAM / 128GB', 'Android 13'],
  },
  {
    id: 'usb-c-charger-65w',
    name: '65W USB-C Fast Charger',
    description: 'GaN technology, dual USB-C + USB-A, charges phone + laptop simultaneously. Global voltage.',
    longDescription: 'GaN (Gallium Nitride) technology makes this charger 40% smaller than standard 65W chargers. Dual USB-C PD ports (65W + 20W) and one USB-A QC 3.0 port. Smart power distribution automatically allocates wattage where needed. Works on 100–240V.',
    price: 45_000, marketPrice: 62_000, stock: 30,
    brand: 'Anker', category: 'phones', subcategory: 'Chargers & Cables',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/charger65a/800/600', 'https://picsum.photos/seed/charger65b/800/600'],
    specs: ['65W total output', 'GaN technology', '2× USB-C PD + 1× USB-A', 'Smart power distribution', '100–240V input'],
  },
  {
    id: 'wireless-earbuds',
    name: 'Wireless Earbuds (TWS)',
    description: 'Active noise cancellation, 30hr battery (buds+case), IPX5 waterproof, Bluetooth 5.3.',
    longDescription: 'Hybrid ANC uses both feedforward and feedback microphones to cancel up to 35dB of ambient noise. Transparency mode for situational awareness. 6hr playtime per charge + 24hr in the case. Touches controls on each earbud.',
    price: 95_000, marketPrice: 130_000, stock: 20,
    brand: 'QCY', category: 'phones', subcategory: 'Earphones & Headsets',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/earbuds1/800/600', 'https://picsum.photos/seed/earbuds2/800/600'],
    specs: ['Hybrid ANC (35dB)', '6hr + 24hr case battery', 'IPX5 waterproof', 'Bluetooth 5.3', 'Touch controls'],
  },

  /* ── Bulk Deals ───────────────────────────────────────────────────────────── */
  {
    id: 'bulk-stoves-5x', name: 'Gas Stove 2-Burner × 5',
    description: 'Wholesale pack for restaurants, caterers, or resellers. 5 units + 6-month warranty.',
    price: 375_000, marketPrice: 525_000, stock: 6, emoji: '🔥',
    brand: 'Ramtons', category: 'kitchen', subcategory: 'Gas Stoves',
    badge: 'Bulk Deal', madeInTanzania: false,
    bulkQty: 5, bulkSaving: 50_000,
    images: ['https://picsum.photos/seed/bulkstv/800/600'],
    specs: ['5 units', '6-month warranty', 'Wholesale invoice provided', 'Bulk delivery included'],
  },
  {
    id: 'bulk-sufuria-10x', name: 'Sufuria Set × 10 Wholesale',
    description: '10 complete aluminum sufuria sets. Best price-per-unit in Dar. Ideal for resellers.',
    price: 380_000, marketPrice: 550_000, stock: 4, emoji: '🍲',
    brand: 'Kariakoo Metals', category: 'kitchen', subcategory: 'Pots & Cookware',
    badge: 'Bulk Deal', madeInTanzania: true,
    bulkQty: 10, bulkSaving: 40_000,
    images: ['https://picsum.photos/seed/bulksuf/800/600'],
    specs: ['10 complete sets (50 sufurias)', 'Mixed sizes 8"–16"', 'Wholesale invoice', 'Free delivery'],
  },
];

/* ─── Convenience exports ─────────────────────────────────────────────────── */
export const getProductById = (id) => PRODUCTS.find(p => p.id === id) ?? null;

export const getCategoryBySlug = (slug) => CATEGORIES.find(c => c.id === slug) ?? null;

export const getProductsByCategory = (categoryId, subcategory = null) => {
  let results = PRODUCTS.filter(p => p.category === categoryId);
  if (subcategory) results = results.filter(p => p.subcategory === subcategory);
  return results;
};

export const BEST_SELLERS = PRODUCTS.filter(p =>
  ['gas-stove-2-burner', 'nonstick-pot-set', 'samsung-55-uhd-tv', 'lg-260l-fridge', 'tecno-camon-30', 'school-uniform-set'].includes(p.id));

export const NEW_ARRIVALS = PRODUCTS.filter(p =>
  ['samsung-galaxy-a55', 'infinix-hot-40', 'lg-32-full-hd-tv', 'ergonomic-office-chair', 'wireless-earbuds', 'usb-c-charger-65w'].includes(p.id));

export const BULK_DEALS = PRODUCTS.filter(p =>
  ['bulk-stoves-5x', 'bulk-sufuria-10x'].includes(p.id));

export const MADE_IN_TZ = PRODUCTS.filter(p => p.madeInTanzania);
