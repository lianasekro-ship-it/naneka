/**
 * Image Processor — Naneka product photo pipeline.
 *
 * Pipeline (each step is individually optional):
 *   1. Remove background  → SAFE MODE: skipped until cloud API key is set (returns original buffer)
 *   2. Resize to square   → cover-crop to target size, flatten to white bg
 *   3. Add watermark      → NANEKA gold logo composited bottom-right
 *   4. Encode             → JPEG @ 90 quality  OR  WebP @ 85 quality
 *
 * "Premium Square" defaults: 1000 × 1000 px, JPEG 90, white background.
 * This matches standard e-commerce catalogue requirements (Jumia, Kilimall etc.)
 *
 * Dependencies: sharp (image processing) — no external API calls.
 * Background removal is delegated to backgroundRemoval.js (separate concern).
 */

import sharp from 'sharp';
import path  from 'path';
import fs    from 'fs';
import { removeBackground } from './backgroundRemoval.js';

// ─── Watermark generator ──────────────────────────────────────────────────────

/**
 * Generates the NANEKA gold watermark as an SVG Buffer.
 * Scaled proportionally to the output image size.
 *
 * @param {number} imageSize  Output image dimension (px)
 * @returns {Buffer}  SVG buffer ready for Sharp composite
 */
function buildWatermarkSvg(imageSize) {
  const w       = Math.round(imageSize * 0.20);   // 20 % of image width
  const h       = Math.round(w * 0.30);
  const font    = Math.round(h * 0.52);
  const spacing = Math.round(font * 0.18);
  const rx      = Math.round(h * 0.25);

  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <!-- semi-transparent dark pill -->
      <rect width="${w}" height="${h}" rx="${rx}" fill="rgba(0,0,0,0.52)"/>
      <!-- gold brand name -->
      <text
        x="${w / 2}" y="${h * 0.70}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${font}"
        font-weight="700"
        fill="#C8951A"
        text-anchor="middle"
        letter-spacing="${spacing}"
      >NANEKA</text>
    </svg>`
  );
}

// ─── Core pipeline ────────────────────────────────────────────────────────────

/**
 * @typedef {object} ProcessOptions
 * @property {boolean} [removeBg=false]        Call remove.bg before resizing
 * @property {boolean} [watermark=true]        Overlay the NANEKA logo
 * @property {number}  [size=1000]             Output square dimension (px)
 * @property {'jpeg'|'webp'} [format='jpeg']   Output encoding
 * @property {number}  [quality]               Override default quality (jpeg=90, webp=85)
 * @property {{ r,g,b }} [bgColor]             Background fill after transparency flatten
 */

/**
 * Processes a raw product image buffer through the full pipeline.
 * Returns the finished image buffer plus a metadata summary.
 *
 * @param {Buffer}        inputBuffer
 * @param {ProcessOptions} opts
 * @returns {Promise<{
 *   buffer:          Buffer,
 *   format:          string,
 *   size:            number,
 *   widthPx:         number,
 *   heightPx:        number,
 *   originalBytes:   number,
 *   processedBytes:  number,
 *   steps:           string[],
 *   creditsCharged:  number,
 * }>}
 */
export async function processImageBuffer(inputBuffer, opts = {}) {
  // Validate the buffer is a recognisable image before feeding it to Sharp.
  // Sharp will throw an opaque VipsError on corrupt / non-image data.
  if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length < 8) {
    throw Object.assign(new Error('Invalid image data: buffer is empty or too small.'), { statusCode: 400 });
  }
  try {
    await sharp(inputBuffer).metadata();
  } catch {
    throw Object.assign(new Error('Invalid or corrupt image file. Please upload a valid JPEG, PNG, or WebP.'), { statusCode: 400 });
  }

  const {
    removeBg  = false,
    watermark = true,
    size      = 1000,
    bgColor   = { r: 255, g: 255, b: 255 },  // white
  } = opts;
  // When removing the background the caller almost always wants a transparent PNG.
  // Default to 'png' if removeBg is set and no explicit format was requested.
  const format  = opts.format ?? (removeBg ? 'png' : 'jpeg');
  const quality = opts.quality ?? (format === 'webp' ? 85 : 90);

  const steps          = [];
  let   creditsCharged = 0;
  let   workBuffer     = inputBuffer;
  let   safeMode       = false;
  let   safeModeReason = null;

  // ── Step 1: Background removal ───────────────────────────────────────────
  if (removeBg) {
    const result = await removeBackground(workBuffer);
    creditsCharged = result.creditsCharged;
    workBuffer     = result.buffer;
    if (result.skipped) {
      safeMode       = true;
      safeModeReason = result.message ?? 'disabled';
      steps.push(`bg_removal_skipped(${safeModeReason})`);
    } else {
      steps.push('bg_removal');
    }
  }

  // ── Step 2: Resize to Premium Square ────────────────────────────────────
  let image = sharp(workBuffer)
    .resize(size, size, {
      fit:                'cover',
      position:           'centre',
      withoutEnlargement: false,          // always fill the square
    });

  // Only flatten transparency when bg removal was NOT requested.
  // If we removed the background we must keep the alpha channel intact —
  // flattening here would undo the removal by filling with bgColor.
  if (!removeBg) {
    image = image.flatten({ background: bgColor });
  }

  steps.push(`resize_${size}x${size}`);

  // ── Step 3: Watermark ────────────────────────────────────────────────────
  if (watermark) {
    const margin = Math.round(size * 0.025);          // 2.5 % margin from edge
    const wmSvg  = buildWatermarkSvg(size);
    const wmMeta = await sharp(wmSvg).metadata();
    const wmW    = wmMeta.width  ?? Math.round(size * 0.20);
    const wmH    = wmMeta.height ?? Math.round(wmW * 0.30);

    image = image.composite([{
      input:  wmSvg,
      left:   size - wmW - margin,
      top:    size - wmH - margin,
      blend:  'over',
    }]);
    steps.push('watermark');
  }

  // ── Step 4: Encode ───────────────────────────────────────────────────────
  let outputBuffer;
  if (format === 'png') {
    // PNG preserves the alpha channel produced by background removal.
    outputBuffer = await image.png({ compressionLevel: 8 }).toBuffer();
  } else if (format === 'webp') {
    outputBuffer = await image.webp({ quality }).toBuffer();
  } else {
    try {
      outputBuffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
    } catch {
      // mozjpeg is not available on all Sharp builds — fall back to standard encoder.
      console.warn('[media/processor] mozjpeg unavailable, falling back to standard JPEG encoder.');
      outputBuffer = await image.jpeg({ quality }).toBuffer();
    }
  }
  steps.push(`encode_${format}_q${quality}`);

  const meta = await sharp(outputBuffer).metadata();

  return {
    buffer:         outputBuffer,
    format,
    size,
    widthPx:        meta.width,
    heightPx:       meta.height,
    originalBytes:  inputBuffer.length,
    processedBytes: outputBuffer.length,
    steps,
    creditsCharged,
    safeMode,
    ...(safeMode && { safeModeReason }),
  };
}

// ─── File-based helpers (used by bulk script & route) ────────────────────────

/**
 * Processes a single image file on disk and writes the result to outputPath.
 *
 * @param {string}        inputPath   Absolute path to the source image
 * @param {string}        outputPath  Absolute path for the processed output
 * @param {ProcessOptions} opts
 * @returns {Promise<object>}  processImageBuffer result metadata
 */
export async function processFile(inputPath, outputPath, opts = {}) {
  const inputBuffer = fs.readFileSync(inputPath);
  const result      = await processImageBuffer(inputBuffer, opts);

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result.buffer);

  return result;
}

/**
 * Determines the output filename for a processed image.
 * "raw_photo.jpg" + format "webp" → "raw_photo.processed.webp"
 *
 * @param {string} original  Original filename (basename)
 * @param {string} format    Target format ('jpeg' | 'webp')
 * @returns {string}
 */
export function buildOutputFilename(original, format = 'jpeg') {
  const ext  = format === 'webp' ? '.webp' : format === 'png' ? '.png' : '.jpg';
  const base = path.basename(original, path.extname(original));
  return `${base}.processed${ext}`;
}
