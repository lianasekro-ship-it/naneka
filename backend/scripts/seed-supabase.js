#!/usr/bin/env node
/**
 * seed-supabase.js
 *
 * Applies all DB migrations and seeds the Supabase database with the 7
 * canonical categories, their subcategories, and 36 products from the
 * Naneka product catalogue.
 *
 * Idempotent — safe to run multiple times (uses ON CONFLICT DO NOTHING).
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres.REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres" \
 *   node scripts/seed-supabase.js
 *
 * Or set DATABASE_URL in your shell / .env and just run:
 *   node scripts/seed-supabase.js
 */

import 'dotenv/config';
import dns   from 'dns';
import pg    from 'pg';
import path  from 'path';
import fs    from 'fs';
import { fileURLToPath } from 'url';

dns.setDefaultResultOrder('ipv4first');

const { Client } = pg;
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');

// ─── Connection ───────────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌  DATABASE_URL env var is required.');
  console.error('    Set it to your Supabase Transaction pooler connection string.');
  process.exit(1);
}

function sanitize(url) {
  try { const u = new URL(url); u.searchParams.delete('pgbouncer'); return u.toString(); }
  catch { return url; }
}

const client = new Client({
  connectionString: sanitize(dbUrl),
  ssl: { rejectUnauthorized: false },
});

// ─── Catalogue data ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'electronics', name: 'Electronics',          icon: '📺', sort_order: 1,
    subs: ['TVs & Monitors','Fridges & Freezers','Home Theater','Washing Machines','Microwaves','Air Conditioners'] },
  { slug: 'clothing',    name: 'Women, Kids & Men',    icon: '👗', sort_order: 2,
    subs: ["Women's Dresses","Women's Shoes","Men's Shirts","Men's Trousers",'Kids Clothing','Kids Shoes','School Bags'] },
  { slug: 'kitchen',     name: 'Kitchen & Home',       icon: '🍳', sort_order: 3,
    subs: ['Gas Stoves','Electric Stoves','Pots & Cookware','Blenders & Mixers','Pressure Cookers','Kitchen Tools'] },
  { slug: 'watches',     name: 'Watches & Handbags',   icon: '⌚', sort_order: 4,
    subs: ["Men's Watches","Ladies' Watches",'Handbags','Wallets & Purses','Sunglasses','Belts'] },
  { slug: 'furniture',   name: 'Furniture',            icon: '🛋️', sort_order: 5,
    subs: ['Sofas & Couches','Beds & Mattresses','Dining Sets','Wardrobes','Office Chairs','Storage & Shelves'] },
  { slug: 'made-in-tz',  name: 'Made in Tanzania',     icon: '🇹🇿', sort_order: 6,
    subs: ['Handcrafted Cookware','Local Textiles','Kiondo Baskets','Artisan Woodwork','Hardware Tools','Building Materials'] },
  { slug: 'phones',      name: 'Phones & Accessories', icon: '📱', sort_order: 7,
    subs: ['Infinix Phones','Tecno Phones','Samsung','Phone Cases','Chargers & Cables','Earphones & Headsets'] },
];

// Each product has category_slug and subcategory_name so we can join to IDs after insert.
const PRODUCTS = [
  /* Electronics */
  { slug:'samsung-55-uhd-tv',      name:'Samsung 55" UHD Smart TV',          category:'electronics', subcategory:'TVs & Monitors',      price:1_200_000, market_price:1_450_000, stock:5,  brand:'Samsung',   description:'4K UHD, HDR10+, built-in Netflix & YouTube, 3 HDMI ports. The living room centrepiece.', specs:['55" 4K UHD','HDR10+','Smart TV (Tizen)','3× HDMI / 2× USB','Wi-Fi + Bluetooth'], gallery:['https://picsum.photos/seed/samtv55a/800/600','https://picsum.photos/seed/samtv55b/800/600'] },
  { slug:'lg-32-full-hd-tv',       name:'LG 32" Full HD TV',                 category:'electronics', subcategory:'TVs & Monitors',      price:480_000,   market_price:560_000,   stock:12, brand:'LG',        description:'Full HD 1080p LED, 2 HDMI, USB media player, energy-saving mode.', specs:['32" Full HD','IPS LED','2× HDMI','Energy-saving'], gallery:['https://picsum.photos/seed/lgtv32a/800/600'] },
  { slug:'lg-260l-fridge',         name:'LG 260L Double-Door Fridge',        category:'electronics', subcategory:'Fridges & Freezers',  price:1_450_000, market_price:1_700_000, stock:4,  brand:'LG',        description:'Frost-free, No-Look Door cooling tech, A+ energy rated. Keeps your food fresh longer.', specs:['260L','Frost-free','A+ energy','Linear Compressor'], gallery:['https://picsum.photos/seed/lgfridge1/800/600'] },
  { slug:'ramtons-bar-fridge-60l', name:'Ramtons Bar Fridge 60L',            category:'electronics', subcategory:'Fridges & Freezers',  price:265_000,   market_price:320_000,   stock:9,  brand:'Ramtons',   description:'Compact single-door, 60L, adjustable shelves. Ideal for offices and small kitchens.', specs:['60L','Single door','Low-noise compressor'], gallery:['https://picsum.photos/seed/barfridge1/800/600'] },
  { slug:'samsung-7kg-washer',     name:'Samsung 7kg Front-Load Washer',     category:'electronics', subcategory:'Washing Machines',    price:1_100_000, market_price:1_300_000, stock:3,  brand:'Samsung',   description:'15 wash programs, 1200 RPM spin, Eco Bubble tech. Gentle on clothes, tough on stains.', specs:['7kg','1200 RPM','Eco Bubble','15 programs'], gallery:['https://picsum.photos/seed/samwash1/800/600'] },

  /* Clothing */
  { slug:'ankara-maxi-dress',      name:'Ankara Maxi Dress',                 category:'clothing',    subcategory:"Women's Dresses",     price:65_000,    market_price:85_000,    stock:22, brand:'Kariakoo Fashion', description:'Vibrant wax-print Ankara fabric, A-line cut, sizes S–XL. Handmade in Dar es Salaam.', specs:['Wax-print Ankara','A-line cut','Sizes S–XL','Handmade DSM'], gallery:['https://picsum.photos/seed/ankdress1/800/600'] },
  { slug:'ladies-office-blouse',   name:"Ladies' Office Blouse",             category:'clothing',    subcategory:"Women's Dresses",     price:38_000,    market_price:52_000,    stock:30, brand:'Nairobi Wear',    description:'Chiffon, flutter sleeves, V-neck, sizes XS–2XL. Professional and comfortable.', specs:['Chiffon','V-neck','Sizes XS–2XL','Machine washable'], gallery:['https://picsum.photos/seed/offblouse1/800/600'] },
  { slug:'school-uniform-set',     name:'School Uniform Set (Age 5–12)',     category:'clothing',    subcategory:'Kids Clothing',       price:35_000,    market_price:48_000,    stock:45, brand:'School Gear TZ',  description:'White shirt + khaki trousers/skirt. Stain-resistant cotton blend, machine washable.', specs:['Cotton-polyester','Stain-resistant','Ages 5–12','Machine washable'], gallery:['https://picsum.photos/seed/uniform1/800/600'] },
  { slug:'kids-canvas-shoes',      name:"Kids' Canvas School Shoes",        category:'clothing',    subcategory:'Kids Shoes',          price:22_000,    market_price:30_000,    stock:60, brand:'Bata',            description:'Black canvas, rubber sole, velcro strap. Sizes 28–36. Durable for daily school wear.', specs:['Black canvas','Rubber sole','Velcro strap','Sizes 28–36'], gallery:['https://picsum.photos/seed/kidsshoe1/800/600'] },
  { slug:'school-bag-primary',     name:'Primary School Backpack',           category:'clothing',    subcategory:'School Bags',         price:28_000,    market_price:38_000,    stock:35, brand:'Hifadhi Bags',    description:'Water-resistant 20L, padded back, 2 compartments + pencil case pocket. Ages 5–12.', specs:['20L','Water-resistant','Padded back','Ages 5–12'], gallery:['https://picsum.photos/seed/schoolbag1/800/600'] },
  { slug:'mens-kanzu',             name:"Men's Kanzu (White)",               category:'clothing',    subcategory:"Men's Shirts",        price:45_000,    market_price:60_000,    stock:25, brand:'Zanzibari Threads', description:'Premium white cotton kanzu, sizes S–3XL. Essential for Friday prayers and formal occasions.', specs:['100% Egyptian cotton','Pre-washed','Sizes S–3XL','Made in Zanzibar'], gallery:['https://picsum.photos/seed/kanzu1/800/600'] },

  /* Kitchen */
  { slug:'gas-stove-2-burner',     name:'Gas Stove 2-Burner',               category:'kitchen',     subcategory:'Gas Stoves',          price:85_000,    market_price:105_000,   stock:24, brand:'Ramtons',   description:'Cast-iron supports, enamel finish, compatible with all LPG cylinders. Top seller in Kariakoo.', specs:['2 burners','Manual ignition','Cast iron supports','LPG compatible'], gallery:['https://picsum.photos/seed/stove2a/800/600'] },
  { slug:'gas-stove-4-burner',     name:'Gas Stove 4-Burner Premium',       category:'kitchen',     subcategory:'Gas Stoves',          price:195_000,   market_price:240_000,   stock:8,  brand:'Ramtons',   description:'Auto-ignition, stainless steel surface, safety flame-failure valve on every burner.', specs:['4 burners','Auto-ignition','Stainless steel','Safety valve'], gallery:['https://picsum.photos/seed/stove4a/800/600'] },
  { slug:'nonstick-pot-set',       name:'Non-Stick Pot Set (3 pcs)',         category:'kitchen',     subcategory:'Pots & Cookware',     price:78_000,    market_price:98_000,    stock:19, brand:'Tefal',     description:'Granite-coated PFOA-free pots — 2L, 3L, 5L. Tempered glass lids, silicone handles.', specs:['Sizes 2L/3L/5L','Granite non-stick','PFOA-free','Induction compatible'], gallery:['https://picsum.photos/seed/potset1/800/600'] },
  { slug:'sufuria-set-5',          name:'Aluminum Sufuria Set (5 pcs)',      category:'kitchen',     subcategory:'Pots & Cookware',     price:42_000,    market_price:55_000,    stock:31, brand:'Kariakoo Metals', description:'Polished thick-gauge aluminum in 8", 10", 12", 14", 16". The Kariakoo household classic.', specs:['Sizes 8–16"','Thick-gauge aluminium','Lightweight','Dishwasher safe'], gallery:['https://picsum.photos/seed/sufuria1/800/600'] },
  { slug:'pressure-cooker-6l',     name:'Pressure Cooker 6L',               category:'kitchen',     subcategory:'Pressure Cookers',    price:55_000,    market_price:72_000,    stock:11, brand:'Kiam',      description:'Stainless steel, cooks beans 70% faster. Three independent safety mechanisms.', specs:['6L','Stainless steel','3 safety valves','All stove types'], gallery:['https://picsum.photos/seed/presskia/800/600'] },
  { slug:'electric-blender-2l',   name:'Electric Blender 2L',              category:'kitchen',     subcategory:'Blenders & Mixers',   price:65_000,    market_price:82_000,    stock:20, brand:'Ramtons',   description:'1000W motor, stainless steel blades, 5-speed + pulse. Crushes ice effortlessly.', specs:['1000W','2L BPA-free jar','Stainless blades','5 speeds + pulse'], gallery:['https://picsum.photos/seed/blendera/800/600'] },

  /* Watches & Handbags */
  { slug:'michael-kors-ladies-watch', name:"Michael Kors Ladies' Watch",   category:'watches',     subcategory:"Ladies' Watches",     price:450_000,   market_price:580_000,   stock:6,  brand:'Michael Kors', description:'Rose gold-tone, crystal-set bezel, 38mm case, leather strap. Includes authentication card.', specs:['38mm rose gold','Crystal bezel','Leather strap','Water resistant 50m'], gallery:['https://picsum.photos/seed/mkwatch1/800/600'] },
  { slug:'casio-mens-watch',       name:"Casio Men's Classic Watch",        category:'watches',     subcategory:"Men's Watches",       price:85_000,    market_price:110_000,   stock:18, brand:'Casio',     description:'Stainless steel, mineral glass, 50m water resistant. The reliable everyday timepiece.', specs:['40mm stainless','Mineral glass','50m water resistant','~3 year battery'], gallery:['https://picsum.photos/seed/casio1/800/600'] },
  { slug:'mens-leather-wallet',    name:"Men's Genuine Leather Wallet",     category:'watches',     subcategory:'Wallets & Purses',    price:25_000,    market_price:38_000,    stock:40, brand:'LeatherCraft TZ', description:'Full-grain leather, 8 card slots, RFID-blocking. Slim bifold design.', specs:['Full-grain leather','8 card slots','RFID-blocking','Handcrafted DSM'], gallery:['https://picsum.photos/seed/wallet1/800/600'] },
  { slug:'ladies-handbag-black',   name:"Ladies' Tote Handbag (Black)",     category:'watches',     subcategory:'Handbags',            price:68_000,    market_price:90_000,    stock:15, brand:'Nairobi Style', description:'PU leather, gold-tone hardware, inner zip pocket + phone pocket. Office & weekend ready.', specs:['PU leather','Gold hardware','Inner zip + phone pocket','Detachable strap'], gallery:['https://picsum.photos/seed/handbag1/800/600'] },

  /* Furniture */
  { slug:'orthopedic-mattress-6x6', name:'Orthopedic Mattress 6×6',        category:'furniture',   subcategory:'Beds & Mattresses',   price:380_000,   market_price:460_000,   stock:7,  brand:'Comfort Plus TZ', description:'High-density foam, orthopedic support, anti-bacterial cover. 6×6 (Queen). 10-year warranty.', specs:['6×6 Queen','High-density foam','Anti-bacterial cover','10-year warranty'], gallery:['https://picsum.photos/seed/mattress1/800/600'] },
  { slug:'ergonomic-office-chair', name:'Ergonomic Office Chair',           category:'furniture',   subcategory:'Office Chairs',       price:280_000,   market_price:350_000,   stock:10, brand:'OfficePro',       description:'Mesh back, lumbar support, adjustable height & armrests, 360° swivel. Supports up to 120kg.', specs:['Mesh back','Lumbar support','360° swivel','Up to 120kg'], gallery:['https://picsum.photos/seed/offchair1/800/600'] },
  { slug:'l-shaped-sofa',          name:'L-Shaped Fabric Sofa',             category:'furniture',   subcategory:'Sofas & Couches',     price:850_000,   market_price:1_050_000, stock:3,  brand:'Casa Dar',        description:'5-seater L-shape, high-density foam cushions, choice of grey or beige fabric.', specs:['5-seater L-shape','High-density foam','Removable covers','Grey or Beige'], gallery:['https://picsum.photos/seed/sofa1/800/600'] },
  { slug:'dining-set-6-seater',    name:'Dining Table & 6 Chairs',          category:'furniture',   subcategory:'Dining Sets',         price:1_350_000, market_price:1_700_000, stock:2,  brand:'Kariakoo Furniture', description:'Solid mahogany dining set, 180cm table, 6 padded chairs. Handcrafted in Tanzania.', specs:['Solid mahogany','180–240cm extendable','6 padded chairs','Handcrafted DSM'], gallery:['https://picsum.photos/seed/dining1/800/600'] },

  /* Made in Tanzania */
  { slug:'kiondo-basket',          name:'Kariakoo Kiondo Basket',            category:'made-in-tz',  subcategory:'Kiondo Baskets',      price:45_000,    market_price:62_000,    stock:14, brand:'Kilimanjaro Crafts', description:'Handwoven sisal kiondo from Kilimanjaro artisans. Natural dyes, no plastic.', specs:['Handwoven sisal','Natural dyes','Kilimanjaro origin','~35cm diameter'], gallery:['https://picsum.photos/seed/kiondoa/800/600'] },
  { slug:'kilimanjaro-coffee-250g', name:'Kilimanjaro Arabica Coffee 250g', category:'made-in-tz',  subcategory:'Handcrafted Cookware',price:28_000,    market_price:38_000,    stock:50, brand:'Kili Coffee Co.',  description:'Single-origin Arabica, medium roast, whole bean or ground. Grown at 1,500m elevation.', specs:['Single-origin Arabica','250g','Medium roast','Grown at 1500m'], gallery:['https://picsum.photos/seed/coffee1/800/600'] },
  { slug:'wooden-mortar-pestle',   name:'Handcarved Mortar & Pestle',       category:'made-in-tz',  subcategory:'Artisan Woodwork',    price:28_000,    market_price:38_000,    stock:9,  brand:'Kariakoo Crafts',  description:'Solid mango wood, carved by Dar es Salaam craftsmen. Food-safe, 16cm diameter.', specs:['Solid mango wood','Food-safe finish','~16cm diameter','Handcarved DSM'], gallery:['https://picsum.photos/seed/mortara/800/600'] },
  { slug:'batik-table-runner',     name:'Batik Print Table Runner',          category:'made-in-tz',  subcategory:'Local Textiles',      price:18_500,    market_price:28_000,    stock:17, brand:'Dar Textiles',     description:'Hand-stamped wax-resist batik, 40cm×200cm. Tinga-tinga wildlife motifs. Machine washable.', specs:['40×200cm','Wax-resist batik','Cotton fabric','Machine washable 30°C'], gallery:['https://picsum.photos/seed/batixa/800/600'] },

  /* Phones */
  { slug:'samsung-galaxy-a55',     name:'Samsung Galaxy A55 5G',            category:'phones',      subcategory:'Samsung',             price:850_000,   market_price:980_000,   stock:8,  brand:'Samsung', description:'6.6" AMOLED, 50MP triple camera, 5000mAh, 256GB, 5G. 2-year Samsung warranty.', specs:['6.6" AMOLED 120Hz','50MP+12MP+5MP cameras','5000mAh','8GB/256GB','5G'], gallery:['https://picsum.photos/seed/sama55a/800/600'] },
  { slug:'tecno-camon-30',         name:'Tecno Camon 30',                    category:'phones',      subcategory:'Tecno Phones',        price:550_000,   market_price:650_000,   stock:15, brand:'Tecno',   description:'6.78" AMOLED, 50MP AI camera, 5000mAh, 128GB. Best camera phone under 600k TZS.', specs:['6.78" AMOLED 144Hz','50MP AI (OIS)','5000mAh','8GB/128GB','Android 14'], gallery:['https://picsum.photos/seed/camon30a/800/600'] },
  { slug:'infinix-hot-40',         name:'Infinix Hot 40',                    category:'phones',      subcategory:'Infinix Phones',      price:320_000,   market_price:390_000,   stock:25, brand:'Infinix', description:'6.78" LCD, 50MP camera, 5000mAh, 128GB. The most affordable smartphone with good specs.', specs:['6.78" HD+','50MP camera','5000mAh + 18W fast charge','8GB/128GB'], gallery:['https://picsum.photos/seed/infhot40a/800/600'] },
  { slug:'usb-c-charger-65w',      name:'65W USB-C Fast Charger',            category:'phones',      subcategory:'Chargers & Cables',   price:45_000,    market_price:62_000,    stock:30, brand:'Anker',   description:'GaN technology, dual USB-C + USB-A, charges phone + laptop simultaneously.', specs:['65W GaN','2× USB-C PD','1× USB-A QC 3.0','100–240V input'], gallery:['https://picsum.photos/seed/charger65a/800/600'] },
  { slug:'wireless-earbuds',       name:'Wireless Earbuds (TWS)',            category:'phones',      subcategory:'Earphones & Headsets',price:95_000,    market_price:130_000,   stock:20, brand:'QCY',     description:'Active noise cancellation, 30hr battery (buds+case), IPX5 waterproof, Bluetooth 5.3.', specs:['Hybrid ANC 35dB','6hr + 24hr case','IPX5','Bluetooth 5.3'], gallery:['https://picsum.photos/seed/earbuds1/800/600'] },
];

// ─── Migration runner ─────────────────────────────────────────────────────────
async function runMigrations() {
  console.log('\n📋 Running migrations…');

  // Ensure a migrations tracking table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await client.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    );
    if (rows.length > 0) {
      console.log(`   ↩  ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      console.log(`   ✅ ${file}`);
    } catch (err) {
      // Some migrations use IF NOT EXISTS — treat duplicate-object errors as ok
      if (err.code === '42P07' || err.code === '42710' || err.message.includes('already exists')) {
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [file]
        );
        console.log(`   ⚠️  ${file} (object already exists — skipped)`);
      } else {
        console.error(`   ❌ ${file} FAILED: ${err.message}`);
        throw err;
      }
    }
  }
  console.log('   Migrations done.\n');
}

// ─── Category seeding ─────────────────────────────────────────────────────────
async function seedCategories() {
  console.log('📂 Seeding categories…');
  const catIdMap = {}; // slug → uuid

  for (const cat of CATEGORIES) {
    const { rows } = await client.query(
      `INSERT INTO categories (name, slug, sort_order, icon, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, icon = EXCLUDED.icon
       RETURNING id`,
      [cat.name, cat.slug, cat.sort_order, cat.icon]
    );
    catIdMap[cat.slug] = rows[0].id;
    console.log(`   ✅ ${cat.name} → ${rows[0].id}`);
  }
  return catIdMap;
}

// ─── Subcategory seeding ──────────────────────────────────────────────────────
async function seedSubcategories(catIdMap) {
  console.log('\n📁 Seeding subcategories…');
  const subIdMap = {}; // "cat_slug/sub_name" → uuid

  for (const cat of CATEGORIES) {
    const categoryId = catIdMap[cat.slug];
    for (let i = 0; i < cat.subs.length; i++) {
      const subName = cat.subs[i];
      const slug    = `${cat.slug}-${subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      const { rows } = await client.query(
        `INSERT INTO subcategories (name, slug, category_id, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE
           SET name = EXCLUDED.name
         RETURNING id`,
        [subName, slug, categoryId, i + 1]
      );
      subIdMap[`${cat.slug}/${subName}`] = rows[0].id;
    }
    console.log(`   ✅ ${cat.subs.length} subcategories for ${cat.name}`);
  }
  return subIdMap;
}

// ─── Product seeding ──────────────────────────────────────────────────────────
async function seedProducts(catIdMap, subIdMap) {
  console.log('\n📦 Seeding products…');
  let ok = 0, skipped = 0;

  for (const p of PRODUCTS) {
    const categoryId    = catIdMap[p.category];
    const subcategoryId = subIdMap[`${p.category}/${p.subcategory}`];

    if (!categoryId) {
      console.warn(`   ⚠️  Unknown category "${p.category}" for product "${p.name}" — skipped`);
      skipped++;
      continue;
    }
    if (!subcategoryId) {
      console.warn(`   ⚠️  Unknown subcategory "${p.subcategory}" in "${p.category}" for "${p.name}" — skipped`);
      skipped++;
      continue;
    }

    const sku = `NAN-${p.slug.toUpperCase().slice(0, 12)}`;

    try {
      await client.query(
        `INSERT INTO products
           (name, slug, description, price, currency, brand,
            image_url, gallery, stock_qty, is_active, sku, features,
            cost_price, tax_rate, category_id, subcategory_id)
         VALUES ($1,$2,$3,$4,'TZS',$5,$6,$7,$8,TRUE,$9,$10,$11,18.00,$12,$13)
         ON CONFLICT (slug) DO UPDATE
           SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty,
               gallery = EXCLUDED.gallery, brand = EXCLUDED.brand`,
        [
          p.name,
          p.slug,
          p.description,
          p.price,
          p.brand ?? null,
          p.gallery?.[0] ?? null,                         // image_url (first gallery item)
          JSON.stringify(p.gallery ?? []),                // gallery JSONB
          p.stock ?? 0,
          sku,
          JSON.stringify(p.specs ?? []),                  // features JSONB
          p.market_price ? p.price * 0.65 : null,        // rough cost_price estimate
          categoryId,
          subcategoryId,
        ]
      );
      ok++;
    } catch (err) {
      console.warn(`   ⚠️  Product "${p.name}" failed: ${err.message}`);
      skipped++;
    }
  }

  console.log(`   ✅ Products done — ${ok} upserted, ${skipped} skipped.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase.\n');

    await runMigrations();

    const catIdMap = await seedCategories();
    const subIdMap = await seedSubcategories(catIdMap);
    await seedProducts(catIdMap, subIdMap);

    console.log('\n🚀 Seeding complete! Your Supabase database is ready.');
    console.log('   The Naneka storefront will now serve live data from Supabase.');
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
