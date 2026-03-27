import jwt          from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

/**
 * Middleware — verifies a Bearer token on protected routes.
 *
 * Accepts two token types:
 *   1. Supabase-issued JWT  — verified via supabase.auth.getUser() (admin/staff login)
 *   2. Custom HS256 JWT     — signed by our backend after Beem OTP verification (customers)
 *
 * Attaches the resolved user object to req.user.
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);

  // 1️⃣  Try Supabase token (admin / staff email login)
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      req.user = { ...user, role: user.user_metadata?.role };
      return next();
    }
  }

  // 2️⃣  Try our custom HS256 JWT (customer phone OTP login)
  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'], audience: 'naneka' });
      req.user = { id: payload.sub, phone: payload.phone, role: payload.role };
      return next();
    } catch {
      // fall through to 401
    }
  }

  return res.status(401).json({ error: 'Invalid or expired token' });
}

/**
 * Middleware — restricts route to specific roles.
 * Must be used after authenticate().
 * @param {...string} roles  e.g. requireRole('admin', 'staff', 'customer')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
