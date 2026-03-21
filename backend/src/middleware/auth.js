import fs from 'fs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Keys are loaded once at startup.
// Wrapped in try/catch so a missing key file does not crash the server
// during local development before keys have been generated.
let publicKey = null;
try {
  if (env.JWT_PUBLIC_KEY_PATH) {
    publicKey = fs.readFileSync(env.JWT_PUBLIC_KEY_PATH);
  }
} catch (err) {
  console.warn(`[auth] Could not load JWT public key from "${env.JWT_PUBLIC_KEY_PATH}": ${err.message}`);
  console.warn('[auth] Auth is running in OPEN mode — all requests are permitted. Generate keys before going live.');
}

/**
 * Middleware — verifies Bearer JWT on protected routes.
 * Attaches decoded payload to req.user.
 * NOTE: Currently a pass-through (no enforcement) until JWT is fully configured.
 */
export function authenticate(req, res, next) {
  // TODO: Implement Bearer token extraction and RS256 verification
  // 1. Extract token from Authorization header
  // 2. jwt.verify(token, publicKey, { algorithms: ['RS256'] })
  // 3. Attach decoded payload to req.user
  // 4. Call next() or return 401
  next();
}

/**
 * Middleware — restricts route to specific roles.
 * Must be used after authenticate().
 * @param {...string} roles  e.g. requireRole('admin', 'staff')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    // TODO: Check req.user.role against allowed roles
    // Return 403 if not permitted
    next();
  };
}

/**
 * Generates a signed JWT access token.
 * @param {{ id: string, role: string }} payload
 */
export function signAccessToken(payload) {
  // TODO: Load private key and sign with RS256
  // jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: env.JWT_EXPIRES_IN })
  throw new Error('signAccessToken: not implemented');
}

/**
 * Generates a refresh token.
 * Refresh tokens are stored server-side (DB or Redis) to allow rotation and revocation.
 * @param {string} userId
 */
export function signRefreshToken(userId) {
  // TODO: Implement refresh token generation and persistence
  throw new Error('signRefreshToken: not implemented');
}
