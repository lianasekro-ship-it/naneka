/**
 * Centralised environment variable validation.
 * The app will refuse to start if required vars are missing.
 */

// ── Database: accept either DATABASE_URL or individual DB_* vars ─────────────
let _dbUrl = process.env.DATABASE_URL;
if (_dbUrl && !process.env.DB_HOST) {
  // Parse DATABASE_URL → individual vars so the rest of the code is unchanged.
  // Format: postgresql://user:password@host:port/dbname
  try {
    const u = new URL(_dbUrl);
    process.env.DB_HOST     = u.hostname;
    process.env.DB_PORT     = u.port || '5432';
    process.env.DB_NAME     = u.pathname.replace(/^\//, '');
    process.env.DB_USER     = u.username;
    process.env.DB_PASSWORD = decodeURIComponent(u.password);
  } catch (e) {
    console.error('[env] DATABASE_URL is set but could not be parsed:', e.message);
    process.exit(1);
  }
}

// ── JWT: accept inline key content (Vercel) or file paths (local) ────────────
// Vercel: set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY to the PEM content directly.
// Local:  set JWT_PRIVATE_KEY_PATH and JWT_PUBLIC_KEY_PATH as before.
// NOTE: JWT auth middleware is not yet enforced (stub pass-through), so missing
// keys are a warning here. Upgrade to process.exit(1) once auth is live.
const _hasInlineJwt = process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY;
const _hasPathJwt   = process.env.JWT_PRIVATE_KEY_PATH && process.env.JWT_PUBLIC_KEY_PATH;
if (!_hasInlineJwt && !_hasPathJwt) {
  console.warn('[env] JWT keys not configured. Set JWT_PRIVATE_KEY + JWT_PUBLIC_KEY (inline PEM) or JWT_PRIVATE_KEY_PATH + JWT_PUBLIC_KEY_PATH. Auth will be unenforced until keys are present.');
}

// ── DB critical check ─────────────────────────────────────────────────────────
const missingDb = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  .filter((key) => !process.env[key]);
if (missingDb.length > 0) {
  console.error(`[env] Missing critical environment variables: ${missingDb.join(', ')}. Set DATABASE_URL or individual DB_* vars.`);
  process.exit(1);
}

// ── Flutterwave: required in production for payments ─────────────────────────
const missingPayments = ['FLUTTERWAVE_SECRET_KEY', 'FLUTTERWAVE_WEBHOOK_HASH']
  .filter((key) => !process.env[key]);
if (missingPayments.length > 0) {
  const msg = `[env] Missing payment variables (Flutterwave will be unavailable): ${missingPayments.join(', ')}`;
  process.env.NODE_ENV === 'production' ? console.error(msg) : console.warn(msg);
}

// ── Self-hosted services: WARN only — these run on your local network ─────────
// WAHA, Textbee, and Traccar are not reachable from cloud deployments.
// Features that use them will return 503 gracefully if unconfigured.
const missingSelfHosted = [
  'WAHA_BASE_URL', 'WAHA_API_KEY',
  'TEXTBEE_BASE_URL', 'TEXTBEE_API_KEY', 'TEXTBEE_DEVICE_ID',
  'TRACCAR_BASE_URL', 'TRACCAR_EMAIL', 'TRACCAR_PASSWORD',
].filter((key) => !process.env[key]);
if (missingSelfHosted.length > 0) {
  console.warn(`[env] Self-hosted services not configured (WhatsApp/SMS/GPS unavailable): ${missingSelfHosted.join(', ')}`);
}

export const env = {
  NODE_ENV:                    process.env.NODE_ENV || 'development',
  PORT:                        parseInt(process.env.PORT || '3000', 10),
  FRONTEND_URL:                process.env.FRONTEND_URL || 'http://localhost:5173',

  // JWT — inline content takes priority over file paths
  JWT_PRIVATE_KEY:             process.env.JWT_PRIVATE_KEY  || null,
  JWT_PUBLIC_KEY:              process.env.JWT_PUBLIC_KEY   || null,
  JWT_PRIVATE_KEY_PATH:        process.env.JWT_PRIVATE_KEY_PATH || null,
  JWT_PUBLIC_KEY_PATH:         process.env.JWT_PUBLIC_KEY_PATH  || null,
  JWT_EXPIRES_IN:              process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN:      process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Database
  DB_HOST:                     process.env.DB_HOST,
  DB_PORT:                     parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME:                     process.env.DB_NAME,
  DB_USER:                     process.env.DB_USER,
  DB_PASSWORD:                 process.env.DB_PASSWORD,

  // Flutterwave
  FLUTTERWAVE_PUBLIC_KEY:      process.env.FLUTTERWAVE_PUBLIC_KEY,
  FLUTTERWAVE_SECRET_KEY:      process.env.FLUTTERWAVE_SECRET_KEY,
  FLUTTERWAVE_WEBHOOK_HASH:    process.env.FLUTTERWAVE_WEBHOOK_HASH,
  FLUTTERWAVE_TX_REF_PREFIX:   process.env.FLUTTERWAVE_TX_REF_PREFIX || 'NANEKA',

  // WAHA
  WAHA_BASE_URL:               process.env.WAHA_BASE_URL,
  WAHA_API_KEY:                process.env.WAHA_API_KEY,
  WAHA_SESSION:                process.env.WAHA_SESSION || 'default',
  WAHA_GROUP_ID:               process.env.WAHA_GROUP_ID || '',       // e.g. "120363xxxxxxxxxx@g.us"
  WAHA_ADMIN_PHONE:            process.env.WAHA_ADMIN_PHONE || '',    // legacy fallback

  // Textbee
  TEXTBEE_BASE_URL:            process.env.TEXTBEE_BASE_URL,
  TEXTBEE_API_KEY:             process.env.TEXTBEE_API_KEY,
  TEXTBEE_DEVICE_ID:           process.env.TEXTBEE_DEVICE_ID,

  // Traccar
  TRACCAR_BASE_URL:            process.env.TRACCAR_BASE_URL,
  TRACCAR_EMAIL:               process.env.TRACCAR_EMAIL,
  TRACCAR_PASSWORD:            process.env.TRACCAR_PASSWORD,
  TRACCAR_VEHICLE_DEVICE_ID:   process.env.TRACCAR_VEHICLE_DEVICE_ID || '1',

  // Google Sheets
  GOOGLE_SHEETS_URL:           process.env.GOOGLE_SHEETS_URL || '',

  // Currency
  DEFAULT_CURRENCY:            process.env.DEFAULT_CURRENCY || 'TZS',

  // Media Processing
  REMOVE_BG_API_KEY:           process.env.REMOVE_BG_API_KEY || '',
};
