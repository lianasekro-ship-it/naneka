#!/usr/bin/env node
/**
 * Naneka Bulk Photo Processor
 *
 * Converts a folder of raw product photos into storefront-ready images:
 *   • Resize to Premium Square (default 1000 × 1000 px)
 *   • NANEKA gold watermark (bottom-right)
 *   • Optional background removal via remove.bg
 *   • JPEG or WebP output
 *
 * Usage:
 *   node scripts/bulk-process.js --input ./raw-photos --output ./processed
 *   node scripts/bulk-process.js --input ./raw-photos --output ./processed --removeBg --format webp
 *   node scripts/bulk-process.js --input ./raw-photos --output ./processed --size 800 --quality 85
 *
 * Options:
 *   --input    <dir>        Source folder (required)
 *   --output   <dir>        Destination folder (required)
 *   --removeBg              Strip background via remove.bg (needs REMOVE_BG_API_KEY)
 *   --noWatermark           Skip the NANEKA logo overlay
 *   --format   jpeg|webp    Output encoding    (default: jpeg)
 *   --size     <px>         Square dimension   (default: 1000)
 *   --quality  <1-100>      Encode quality     (default: 90 jpeg / 85 webp)
 *   --concurrency <n>       Parallel jobs      (default: 3)
 */

import 'dotenv/config';
import path from 'path';
import fs   from 'fs';
import { fileURLToPath } from 'url';
import { processFile, buildOutputFilename } from '../src/services/media/imageProcessor.js';

// ─── Resolve script directory so relative paths work from anywhere ────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Arg parser ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--removeBg')     { args.removeBg    = true;             continue; }
    if (a === '--noWatermark')  { args.watermark   = false;            continue; }
    if (a === '--input')        { args.input       = argv[++i];        continue; }
    if (a === '--output')       { args.output      = argv[++i];        continue; }
    if (a === '--format')       { args.format      = argv[++i];        continue; }
    if (a === '--size')         { args.size        = parseInt(argv[++i], 10); continue; }
    if (a === '--quality')      { args.quality     = parseInt(argv[++i], 10); continue; }
    if (a === '--concurrency')  { args.concurrency = parseInt(argv[++i], 10); continue; }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.input || !args.output) {
  console.error('\nUsage: node scripts/bulk-process.js --input <dir> --output <dir> [options]\n');
  process.exit(1);
}

const INPUT_DIR   = path.resolve(args.input);
const OUTPUT_DIR  = path.resolve(args.output);

if (!fs.existsSync(INPUT_DIR)) {
  console.error(`Input directory not found: ${INPUT_DIR}`);
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Supported extensions ─────────────────────────────────────────────────────
const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif']);

const imageFiles = fs.readdirSync(INPUT_DIR)
  .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
  .sort();

if (imageFiles.length === 0) {
  console.log(`No images found in ${INPUT_DIR}`);
  process.exit(0);
}

// ─── Processing options ───────────────────────────────────────────────────────
const opts = {
  removeBg:  args.removeBg  ?? false,
  watermark: args.watermark ?? true,
  format:    args.format    ?? 'jpeg',
  size:      args.size      ?? 1000,
  quality:   args.quality,
};

const CONCURRENCY = args.concurrency ?? 3;

// ─── UI helpers ───────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

function kb(bytes) { return `${(bytes / 1024).toFixed(1)} KB`; }
function pct(a, b) { return `${(((b - a) / a) * 100).toFixed(1)}%`; }

// ─── Main ─────────────────────────────────────────────────────────────────────
async function processBatch(files) {
  const total   = files.length;
  let   success = 0;
  let   failed  = 0;
  let   totalCredits = 0;

  console.log(`\n${BOLD}Naneka Bulk Photo Processor${RESET}`);
  console.log('─'.repeat(52));
  console.log(`  Input:       ${INPUT_DIR}`);
  console.log(`  Output:      ${OUTPUT_DIR}`);
  console.log(`  Images:      ${total}`);
  console.log(`  Size:        ${opts.size} × ${opts.size} px`);
  console.log(`  Format:      ${opts.format.toUpperCase()} q${opts.quality ?? (opts.format === 'webp' ? 85 : 90)}`);
  console.log(`  Watermark:   ${opts.watermark ? 'yes' : 'no'}`);
  console.log(`  Remove bg:   ${opts.removeBg  ? `${YELLOW}yes (credits will be charged)${RESET}` : 'no'}`);
  console.log(`  Concurrency: ${CONCURRENCY} parallel jobs`);
  console.log('─'.repeat(52) + '\n');

  // ── Process in batches of CONCURRENCY ────────────────────────────────────
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (filename) => {
      const inputPath    = path.join(INPUT_DIR, filename);
      const outputName   = buildOutputFilename(filename, opts.format);
      const outputPath   = path.join(OUTPUT_DIR, outputName);
      const num          = i + batch.indexOf(filename) + 1;
      const prefix       = `  [${String(num).padStart(String(total).length)}/${total}]`;

      try {
        const result = await processFile(inputPath, outputPath, opts);
        totalCredits += result.creditsCharged ?? 0;
        success++;

        const savings = pct(result.originalBytes, result.processedBytes);
        const sign    = result.processedBytes < result.originalBytes ? GREEN : YELLOW;
        console.log(
          `${GREEN}✓${RESET} ${prefix} ${CYAN}${filename}${RESET}` +
          ` → ${outputName}` +
          `  ${kb(result.originalBytes)} → ${sign}${kb(result.processedBytes)}${RESET}` +
          ` (${savings})`
        );
      } catch (err) {
        failed++;
        console.log(`${RED}✗${RESET} ${prefix} ${filename}  ${RED}${err.message}${RESET}`);
      }
    }));
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(52));
  console.log(`${BOLD}Done.${RESET}`);
  console.log(`  ${GREEN}Succeeded: ${success}${RESET}`);
  if (failed > 0) console.log(`  ${RED}Failed:    ${failed}${RESET}`);
  if (totalCredits > 0) console.log(`  ${YELLOW}remove.bg credits used: ${totalCredits}${RESET}`);
  console.log(`  Output saved to: ${OUTPUT_DIR}\n`);
}

processBatch(imageFiles).catch((err) => {
  console.error(`${RED}Fatal error:${RESET}`, err.message);
  process.exit(1);
});
