/* ─── Central Product Catalogue ─────────────────────────────────────────────── */
// Single source of truth for all products.
// marketPrice = Kariakoo market average (used for Price Match Guarantee badge).

export const PRODUCTS = [

  /* ── Kitchen: Gas Stoves ─────────────────────────────────────────────────── */
  {
    id: 'gas-stove-2-burner',
    name: 'Gas Stove 2-Burner',
    description: 'Cast-iron supports, enamel finish, compatible with all LPG cylinders. The top seller in Kariakoo for three years running.',
    longDescription: 'A household staple across Kariakoo and beyond. Delivers reliable, even heat on both burners simultaneously. The enamel-coated body wipes clean with a damp cloth. Cast iron pan supports keep your heaviest sufurias steady. Ships with a standard LPG hose and regulator.',
    price: 85_000, marketPrice: 105_000, stock: 24,
    brand: 'Ramtons', category: 'kitchen', subcategory: 'Gas Stoves',
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/stove2a/800/600', 'https://picsum.photos/seed/stove2b/800/600', 'https://picsum.photos/seed/stove2c/800/600'],
    specs: ['2 burners', 'Manual ignition', 'Cast iron pan supports', 'Enamel body finish', 'LPG / PNG compatible'],
  },
  {
    id: 'gas-stove-4-burner',
    name: 'Gas Stove 4-Burner Premium',
    description: 'Professional-grade cooktop with auto-ignition, stainless steel surface, and a safety valve on every burner.',
    longDescription: 'Designed for serious cooks and catering professionals. Auto-ignition on all four burners, a stainless steel surface that resists corrosion, and a fail-safe gas valve that cuts flow if any flame is accidentally extinguished. Ideal for restaurants and mama ntilie operations.',
    price: 195_000, marketPrice: 240_000, stock: 8,
    brand: 'Ramtons', category: 'kitchen', subcategory: 'Gas Stoves',
    badge: 'Signature', madeInTanzania: false,
    images: ['https://picsum.photos/seed/stove4a/800/600', 'https://picsum.photos/seed/stove4b/800/600', 'https://picsum.photos/seed/stove4c/800/600'],
    specs: ['4 burners', 'Auto-ignition', 'Stainless steel surface', 'Tempered glass lid', 'Safety flame-failure valve'],
  },
  {
    id: 'electric-coil-stove',
    name: 'Electric Coil Stove 2-Plate',
    description: 'Heavy-duty spiral coils heat in under 60 seconds. 1500W, adjustable temperature, compact countertop.',
    longDescription: 'Perfect for homes on stable TANESCO supply. The spiral coils maintain consistent temperature across the full cooking surface. Dial selector gives five heat settings from gentle simmer to full rolling boil.',
    price: 65_000, marketPrice: 82_000, stock: 15,
    brand: 'Von', category: 'kitchen', subcategory: 'Electric Stoves',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/elstovea/800/600', 'https://picsum.photos/seed/elstoveb/800/600'],
    specs: ['2 heating plates', '1500W total power', '5-position heat dial', 'Coil element', 'Compact countertop design'],
  },
  {
    id: 'biomass-rocket-stove',
    name: 'Biomass Rocket Stove',
    description: 'Burns wood, charcoal, or biomass pellets with 40% less fuel. Off-grid and catering ready.',
    longDescription: 'The rocket design channels combustion gases upward through an insulated combustion chamber, dramatically increasing efficiency compared to a three-stone fire or open charcoal jiko. Produces 60% less smoke. No electricity required.',
    price: 45_000, marketPrice: 60_000, stock: 22, emoji: '🔥',
    brand: 'EcoFire TZ', category: 'kitchen', subcategory: 'Electric Stoves',
    madeInTanzania: false,
    images: ['https://picsum.photos/seed/rocketa/800/600', 'https://picsum.photos/seed/rocketb/800/600'],
    specs: ['Multi-fuel: wood / charcoal / pellets', '40% less fuel', '60% less smoke', 'No electricity required', 'Portable (8kg)'],
  },

  /* ── Kitchen: Pots & Cookware ─────────────────────────────────────────────── */
  {
    id: 'nonstick-pot-set',
    name: 'Non-Stick Pot Set (3 pcs)',
    description: 'Granite-coated PFOA-free pots — 2L, 3L, 5L. Tempered glass lids, silicone handles.',
    longDescription: 'The granite mineral coating creates a naturally non-stick surface requiring minimal oil. Heat-proof silicone handles stay cool even on a high flame. Suitable for all cooktops including induction. Dishwasher safe.',
    price: 78_000, marketPrice: 98_000, stock: 19,
    brand: 'Tefal', category: 'kitchen', subcategory: 'Pots & Cookware',
    badge: 'Best Seller', madeInTanzania: false,
    images: ['https://picsum.photos/seed/potset1/800/600', 'https://picsum.photos/seed/potset2/800/600', 'https://picsum.photos/seed/potset3/800/600'],
    specs: ['Sizes: 2L, 3L, 5L', 'Granite non-stick coating', 'PFOA-free', 'Tempered glass lids', 'Induction compatible'],
  },
  {
    id: 'sufuria-set-5',
    name: 'Aluminum Sufuria Set (5 pcs)',
    description: 'Polished thick-gauge aluminum in 8", 10", 12", 14", 16". The Kariakoo household classic.',
    longDescription: 'Made using thick-gauge aluminium that heats quickly and evenly. These sufurias last decades — the same ones your grandmother used. Used in homes and mama ntilie restaurants across Dar es Salaam. Lightweight yet robust.',
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
    longDescription: 'Stop waiting hours for maharagwe and nyama to soften. The Kiam 6L cooks beef stew in 25 minutes and kidney beans in 20. Three independent safety mechanisms prevent over-pressurization. The locking indicator shows when it is safe to open.',
    price: 55_000, marketPrice: 72_000, stock: 11,
    brand: 'Kiam', category: 'kitchen', subcategory: 'Pressure Cookers',
    badge: 'Limited', madeInTanzania: false,
    images: ['https://picsum.photos/seed/presskia/800/600', 'https://picsum.photos/seed/presskib/800/600'],
    specs: ['6L capacity', 'Stainless steel body', '3 safety valves', 'Locking pressure indicator', 'All stove types'],
  },

  /* ── Kitchen: Blenders ────────────────────────────────────────────────────── */
  {
    id: 'electric-blender-2l',
    name: 'Electric Blender 2L',
    description: '1000W motor, stainless steel blades, 5-speed + pulse. Crushes ice effortlessly.',
    longDescription: 'Blend, chop, and crush with professional power. The stainless steel blade assembly handles frozen fruit, ice, and raw vegetables without strain. The 2L BPA-free jar is dishwasher safe. 5-year motor warranty.',
    price: 65_000, marketPrice: 82_000, stock: 20,
    brand: 'Ramtons', category: 'kitchen', subcategory: 'Blenders & Mixers',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/blendera/800/600', 'https://picsum.photos/seed/blenderb/800/600'],
    specs: ['1000W motor', '2L BPA-free jar', 'Stainless steel blades', '5 speeds + pulse', 'Dishwasher-safe jar'],
  },

  /* ── Kitchen: Made in Tanzania ────────────────────────────────────────────── */
  {
    id: 'wooden-mortar-pestle',
    name: 'Handcarved Mortar & Pestle',
    description: 'Solid mango wood, carved by Dar es Salaam craftsmen. Food-safe, 16cm diameter.',
    longDescription: 'Crushed spices release their essential oils far better than electric grinders. Carved from food-safe mango wood by Kariakoo-based craftsmen who have practised this trade for generations. Smooth interior, perfect for pilipili, bizari, and cardamom. Every piece is unique.',
    price: 28_000, marketPrice: 38_000, stock: 9, emoji: '🪵',
    brand: 'Kariakoo Crafts', category: 'kitchen', subcategory: 'Kitchen Tools',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/mortara/800/600', 'https://picsum.photos/seed/mortarb/800/600'],
    specs: ['Solid mango wood', 'Food-safe finish', 'Approx. 16cm diameter', 'Includes pestle', 'Handcarved in DSM'],
  },
  {
    id: 'mama-ntilie-spice-set',
    name: "Mama Ntilie Spice Set",
    description: '7 essential Tanzanian spices in airtight tins: pilipili, bizari, cumin, turmeric, ginger, coriander, cardamom.',
    longDescription: 'Sourced directly from spice farmers in Zanzibar and Kilimanjaro. Each tin is hand-packed, labelled in Swahili and English, and airtight sealed. The seven spices at the heart of Swahili coastal cooking.',
    price: 22_000, marketPrice: 30_000, stock: 22, emoji: '🫙',
    brand: 'Zanzibar Spice Co.', category: 'kitchen', subcategory: 'Spices',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/spicea/800/600', 'https://picsum.photos/seed/spiceb/800/600'],
    specs: ['7 spices included', 'Zanzibar origin', 'Airtight tins', 'Swahili & English labels', 'No preservatives added'],
  },

  /* ── Electricals ──────────────────────────────────────────────────────────── */
  {
    id: 'led-bulb-10pack',
    name: 'LED Bulb Set (10-Pack)',
    description: '9W warm-white, E27 base, 900 lumen, 25,000-hour lifespan. Cut your bill by 60%.',
    longDescription: 'Replace your old fluorescents and cut your TANESCO electricity bill by up to 60%. Each 9W LED produces the same brightness as a 60W incandescent. The E27 base fits standard Tanzanian sockets. 25,000-hour rated lifespan — that\'s over 17 years of 4-hour daily use.',
    price: 28_000, marketPrice: 38_000, stock: 45,
    brand: 'Tecno', category: 'electricals', subcategory: 'Light Bulbs',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/ledbulba/800/600', 'https://picsum.photos/seed/ledbulbb/800/600'],
    specs: ['9W per bulb (10 included)', '900 lumen output', 'E27 standard base', 'Warm white 3000K', '25,000 hour lifespan'],
  },
  {
    id: 'extension-cord-5m',
    name: 'Heavy-Duty Extension 5m',
    description: '4-socket, surge protection, child-safety shutters. 13A rated, earthed plug.',
    longDescription: 'Built to handle Tanzania\'s power surges. The integrated surge protector absorbs voltage spikes up to 1000 joules. Child-safety shutters prevent finger contact with live pins. The 5-metre cable uses 3-core copper wire rated for continuous 13A load.',
    price: 18_500, marketPrice: 26_000, stock: 38,
    brand: 'Hotpoint', category: 'electricals', subcategory: 'Extension Cords',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/extcorda/800/600', 'https://picsum.photos/seed/extcordb/800/600'],
    specs: ['4 sockets', '5-metre cable', '13A continuous rating', 'Surge protection (1000J)', 'Child-safety shutters'],
  },

  /* ── Safety Gear ──────────────────────────────────────────────────────────── */
  {
    id: 'safety-helmet-hard',
    name: 'Safety Helmet (Class E)',
    description: 'EN 397 certified, ratchet suspension, ventilated shell. Fits 52–62cm heads.',
    longDescription: 'Meets EN 397 and ANSI Z89.1 Class E standards for electrical protection up to 20,000V. The ratchet suspension distributes weight evenly and adjusts in seconds. Ventilation slots prevent overheating during long site shifts.',
    price: 22_000, marketPrice: 32_000, stock: 56,
    brand: 'Scanfrost', category: 'safety', subcategory: 'Head Protection',
    badge: 'New', madeInTanzania: false,
    images: ['https://picsum.photos/seed/helmeta/800/600', 'https://picsum.photos/seed/helmetb/800/600'],
    specs: ['EN 397 certified', 'Class E (20kV protection)', 'Ratchet suspension', 'Ventilated shell', 'Fits 52–62cm'],
  },

  /* ── Home Decor: Made in Tanzania ─────────────────────────────────────────── */
  {
    id: 'kiondo-basket',
    name: 'Kariakoo Kiondo Basket',
    description: 'Handwoven sisal kiondo from Kilimanjaro artisans. Natural dyes, no plastic.',
    longDescription: 'Each kiondo is handwoven by skilled artisans from the Kilimanjaro region using locally sourced sisal fibres and natural plant-based dyes. No two baskets are identical. Perfect as a shopping basket, fruit bowl, or home decor piece. A living tradition — buy one, support a family.',
    price: 35_000, marketPrice: 48_000, stock: 14, emoji: '🧺',
    brand: 'Kilimanjaro Crafts', category: 'decor', subcategory: 'Handcrafts',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/kiondoa/800/600', 'https://picsum.photos/seed/kiondob/800/600', 'https://picsum.photos/seed/kiondoc/800/600'],
    specs: ['Handwoven sisal', 'Natural plant dyes', 'Kilimanjaro origin', 'Approx. 35cm diameter', 'Supports local artisans'],
  },
  {
    id: 'batik-table-runner',
    name: 'Batik Print Table Runner',
    description: 'Hand-stamped wax-resist batik, 40cm×200cm. Tinga-tinga wildlife motifs. Machine washable.',
    longDescription: 'Made using the traditional wax-resist batik method practised on the Tanzanian coast for centuries. The tinga-tinga animal motifs — giraffe, elephant, and zebra — are stamped by hand and the fabric dye-bathed three times for vibrant, lasting colour. Machine washable at 30°C.',
    price: 18_500, marketPrice: 28_000, stock: 17, emoji: '🎨',
    brand: 'Dar Textiles', category: 'decor', subcategory: 'Textiles',
    badge: 'Made in TZ', madeInTanzania: true,
    images: ['https://picsum.photos/seed/batixa/800/600', 'https://picsum.photos/seed/batixb/800/600'],
    specs: ['40cm × 200cm', 'Wax-resist batik', 'Cotton fabric', 'Hand-stamped motifs', 'Machine washable 30°C'],
  },

  /* ── Bulk Deals ───────────────────────────────────────────────────────────── */
  {
    id: 'bulk-stoves-5x', name: 'Gas Stove 2-Burner × 5',
    description: 'Wholesale pack for restaurants, caterers, or resellers. 5 units + 6-month warranty + bulk delivery.',
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
  {
    id: 'bulk-gloves-20pr', name: 'Safety Gloves × 20 Pairs',
    description: 'Anti-cut, heat-resistant work gloves. Nitrile palm, breathable back. Min. 20 pairs.',
    price: 95_000, marketPrice: 120_000, stock: 10, emoji: '🧤',
    brand: 'Scanfrost', category: 'safety', subcategory: 'Hand Protection',
    badge: 'Bulk Deal', madeInTanzania: false,
    bulkQty: 20, bulkSaving: 25_000,
    images: ['https://picsum.photos/seed/bulkglv/800/600'],
    specs: ['20 pairs', 'Nitrile palm coating', 'Anti-cut rated Level B', 'Sizes M / L / XL', 'Wholesale invoice'],
  },
];

/* ─── Convenience exports ─────────────────────────────────────────────────── */
export const getProductById = (id) => PRODUCTS.find(p => p.id === id) ?? null;

export const BEST_SELLERS = PRODUCTS.filter(p =>
  ['gas-stove-2-burner', 'nonstick-pot-set', 'sufuria-set-5', 'pressure-cooker-6l'].includes(p.id));

export const NEW_ARRIVALS = PRODUCTS.filter(p =>
  ['electric-blender-2l', 'led-bulb-10pack', 'extension-cord-5m', 'safety-helmet-hard'].includes(p.id));

export const BULK_DEALS = PRODUCTS.filter(p =>
  ['bulk-stoves-5x', 'bulk-sufuria-10x', 'bulk-gloves-20pr'].includes(p.id));

export const MADE_IN_TZ = PRODUCTS.filter(p => p.madeInTanzania);
