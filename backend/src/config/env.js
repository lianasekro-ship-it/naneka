/**
 * Centralised environment variable validation.
 * The app will refuse to start if required vars are missing.
 */

// Core vars — the server cannot function without these.
const critical = [
  'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'JWT_PRIVATE_KEY_PATH', 'JWT_PUBLIC_KEY_PATH',
];

// Third-party service vars — warn in dev so the UI still loads for testing.
const services = [
  'FLUTTERWAVE_SECRET_KEY', 'FLUTTERWAVE_WEBHOOK_HASH',
  'WAHA_BASE_URL', 'WAHA_API_KEY',
  'TEXTBEE_BASE_URL', 'TEXTBEE_API_KEY', 'TEXTBEE_DEVICE_ID',
  'TRACCAR_BASE_URL', 'TRACCAR_EMAIL', 'TRACCAR_PASSWORD',
];

const missingCritical = critical.filter((key) => !process.env[key]);
if (missingCritical.length > 0) {
  console.error(`[env] Missing critical environment variables: ${missingCritical.join(', ')}`);
  process.exit(1);
}

const missingServices = services.filter((key) => !process.env[key]);
if (missingServices.length > 0) {
  const tag = process.env.NODE_ENV === 'production' ? 'ERROR' : 'WARN';
  console[tag === 'ERROR' ? 'error' : 'warn'](
    `[env] Missing service environment variables (payments/messaging/tracking will be unavailable): ${missingServices.join(', ')}`
  );
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

export const env = {
  NODE_ENV:                    process.env.NODE_ENV || 'development',
  PORT:                        parseInt(process.env.PORT || '3000', 10),
  FRONTEND_URL:                process.env.FRONTEND_URL || 'http://localhost:5173',

  // JWT
  JWT_PRIVATE_KEY_PATH:        process.env.JWT_PRIVATE_KEY_PATH,
  JWT_PUBLIC_KEY_PATH:         process.env.JWT_PUBLIC_KEY_PATH,
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
