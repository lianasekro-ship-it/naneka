/**
 * Cloudinary Service — Naneka product image pipeline
 *
 * Env vars required:
 *   CLOUDINARY_CLOUD_NAME     Your Cloudinary cloud name
 *   CLOUDINARY_API_KEY        Cloudinary API key
 *   CLOUDINARY_API_SECRET     Cloudinary API secret
 *   CLOUDINARY_LOGO_PUBLIC_ID Public-ID of the Naneka logo asset (default: naneka_logo)
 */

import { v2 as cloudinary } from 'cloudinary';

// ─── Config validation ────────────────────────────────────────────────────────

const PLACEHOLDERS = new Set([
  '', 'your_cloud_name', 'your_api_key', 'your_api_secret',
  'your_cloudinary_cloud_name', 'your_cloudinary_api_key', 'your_cloudinary_api_secret',
]);

function assertCloudinaryConfig() {
  const missing = [];
  if (PLACEHOLDERS.has(process.env.CLOUDINARY_CLOUD_NAME ?? ''))
    missing.push('CLOUDINARY_CLOUD_NAME');
  if (PLACEHOLDERS.has(process.env.CLOUDINARY_API_KEY ?? ''))
    missing.push('CLOUDINARY_API_KEY');
  if (PLACEHOLDERS.has(process.env.CLOUDINARY_API_SECRET ?? ''))
    missing.push('CLOUDINARY_API_SECRET');

  if (missing.length) {
    const list = missing.join(', ');
    throw new Error(
      `[cloudinaryService] Missing or placeholder env var(s): ${list}. ` +
      `Open backend/.env and replace the placeholder value(s) with your real Cloudinary credentials ` +
      `from cloudinary.com → Settings → API Keys.`
    );
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ─── Error unwrapping ─────────────────────────────────────────────────────────
// Cloudinary SDK throws plain objects like { error: { message: '...' } }
// rather than proper Error instances. Normalise them here.

function toError(raw) {
  if (raw instanceof Error) return raw;
  const msg =
    raw?.error?.message ??
    raw?.message ??
    (typeof raw === 'string' ? raw : JSON.stringify(raw));
  const err = new Error(`[Cloudinary] ${msg}`);
  err.cloudinaryRaw = raw;
  return err;
}

// ─── uploadAndProcess ─────────────────────────────────────────────────────────

/**
 * Upload an image buffer and return raw + processed Cloudinary URLs.
 * The processed URL applies bg removal + Naneka logo overlay on-the-fly.
 *
 * @param {Buffer} buffer   Raw image bytes
 * @param {string} mimetype MIME type (e.g. 'image/jpeg')
 * @returns {{ rawUrl: string, processedUrl: string, publicId: string }}
 */
export async function uploadAndProcess(buffer, mimetype = 'image/jpeg') {
  assertCloudinaryConfig();

  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;

  let uploadResult;
  try {
    uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder:        'naneka/products',
      resource_type: 'image',
    });
  } catch (raw) {
    throw toError(raw);
  }

  const logoId = process.env.CLOUDINARY_LOGO_PUBLIC_ID ?? 'naneka_logo';

  const processedUrl = cloudinary.url(uploadResult.public_id, {
    transformation: [
      { effect: 'background_removal' },
      {
        overlay: logoId,
        width:   '0.20',
        flags:   'relative',
        gravity: 'south_east',
        x:       15,
        y:       15,
        opacity: 85,
      },
    ],
    secure: true,
  });

  return {
    publicId:     uploadResult.public_id,
    rawUrl:       uploadResult.secure_url,
    processedUrl,
  };
}

// ─── uploadRaw ────────────────────────────────────────────────────────────────

/**
 * Upload a raw image buffer to Cloudinary with no transformations.
 * Used by Admin Dashboard gallery / category image uploads.
 *
 * @param {Buffer} buffer   Raw image bytes
 * @param {string} mimetype MIME type (e.g. 'image/jpeg')
 * @returns {{ url: string, publicId: string }}
 */
export async function uploadRaw(buffer, mimetype = 'image/jpeg') {
  assertCloudinaryConfig();

  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;

  let result;
  try {
    result = await cloudinary.uploader.upload(dataUri, {
      folder:        'naneka/products',
      resource_type: 'image',
    });
  } catch (raw) {
    throw toError(raw);
  }

  return { url: result.secure_url, publicId: result.public_id };
}
