/**
 * Media Processing API
 *
 * POST /api/v1/media/process
 *   Accepts a raw product image, runs the full pipeline (optional bg removal,
 *   resize to Premium Square, NANEKA watermark), and returns the processed file.
 *
 *   Request  — multipart/form-data
 *     image      (file, required)   Raw product photo — JPEG / PNG / WebP
 *     removeBg   (field, optional)  'true' to strip background via remove.bg
 *     watermark  (field, optional)  'false' to skip watermark (default: true)
 *     format     (field, optional)  'jpeg' | 'webp'  (default: 'jpeg')
 *     size       (field, optional)  Output square px  (default: 1000)
 *
 *   Response — binary image with headers:
 *     Content-Type:        image/jpeg  OR  image/webp
 *     Content-Disposition: attachment; filename="<name>.processed.jpg"
 *     X-Processing-Steps:  comma-separated list of applied steps
 *     X-Credits-Charged:   remove.bg credits used (0 if bg removal skipped)
 *     X-Original-Bytes:    input file size
 *     X-Processed-Bytes:   output file size
 *
 * GET /api/v1/media/processed/:filename
 *   Serves a previously processed file from uploads/processed/.
 */

import path    from 'path';
import fs      from 'fs';
import { Router }   from 'express';
import multer  from 'multer';
import { fileURLToPath } from 'url';

import { processImageBuffer, buildOutputFilename } from '../services/media/imageProcessor.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// ─── Upload directory setup ───────────────────────────────────────────────────

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR  = path.resolve(__dirname, '../../uploads/raw');
const OUTPUT_DIR  = path.resolve(__dirname, '../../uploads/processed');

[UPLOAD_DIR, OUTPUT_DIR].forEach((d) => fs.mkdirSync(d, { recursive: true }));

// ─── Multer config ────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/tiff']);
const MAX_SIZE_MB  = 20;

const upload = multer({
  storage: multer.memoryStorage(),          // keep file in memory; no temp disk writes
  limits:  { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(createError(415, `Unsupported image type: ${file.mimetype}. Use JPEG, PNG, or WebP.`));
    }
  },
});

// ─── POST /api/v1/media/process ──────────────────────────────────────────────

router.post('/process', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No image uploaded. Send the file in a "image" form field.'));
    }

    // ── Parse options from form fields ────────────────────────────────────
    const removeBg  = req.body.removeBg  === 'true';
    const watermark = req.body.watermark !== 'false';           // default true
    console.log(`[media/route] Processing image — removeBg=${removeBg}, watermark=${watermark}, format=${req.body.format ?? 'jpeg'}, size=${req.body.size ?? 1000}`);
    const format    = ['webp', 'jpeg', 'png'].includes(req.body.format)
                        ? req.body.format
                        : undefined;   // let processImageBuffer choose (png when removeBg)
    const size      = Math.min(4000, Math.max(200,
                        parseInt(req.body.size ?? '1000', 10)
                      ));
    const quality   = req.body.quality
                        ? Math.min(100, Math.max(1, parseInt(req.body.quality, 10)))
                        : undefined;

    // ── Run pipeline ──────────────────────────────────────────────────────
    const result = await processImageBuffer(req.file.buffer, {
      removeBg,
      watermark,
      format,
      size,
      quality,
    });

    // ── Optionally persist to disk for later retrieval ─────────────────
    const outputFilename = buildOutputFilename(req.file.originalname, result.format);
    const outputPath     = path.join(OUTPUT_DIR, outputFilename);
    fs.writeFileSync(outputPath, result.buffer);

    // ── Stream processed image back to caller ────────────────────────────
    const resolvedFormat = result.format;
    const contentType = resolvedFormat === 'webp' ? 'image/webp'
                      : resolvedFormat === 'png'  ? 'image/png'
                      : 'image/jpeg';

    res.set({
      'Content-Type':         contentType,
      'Content-Disposition':  `attachment; filename="${outputFilename}"`,
      'Content-Length':       result.buffer.length,
      'X-Processing-Steps':   result.steps.join(','),
      'X-Credits-Charged':    String(result.creditsCharged),
      'X-Original-Bytes':     String(result.originalBytes),
      'X-Processed-Bytes':    String(result.processedBytes),
      'X-Output-Filename':    outputFilename,
    });

    return res.status(200).send(result.buffer);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/media/processed/:filename ────────────────────────────────────

router.get('/processed/:filename', (req, res, next) => {
  try {
    // Sanitise filename — prevent directory traversal
    const safe = path.basename(req.params.filename);
    const file = path.join(OUTPUT_DIR, safe);

    if (!fs.existsSync(file)) {
      return next(createError(404, `Processed file not found: ${safe}`));
    }

    const ext         = path.extname(safe).toLowerCase();
    const contentType = ext === '.webp' ? 'image/webp' : 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.sendFile(file);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/media/processed (list) ─────────────────────────────────────

router.get('/processed', (_req, res, next) => {
  try {
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter((f) => /\.(jpg|jpeg|webp|png)$/i.test(f))
      .map((f) => {
        const stat = fs.statSync(path.join(OUTPUT_DIR, f));
        return {
          filename:     f,
          url:          `/api/v1/media/processed/${f}`,
          sizeBytes:    stat.size,
          processedAt:  stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.processedAt.localeCompare(a.processedAt));

    res.json({ count: files.length, files });
  } catch (err) {
    next(err);
  }
});

export default router;
