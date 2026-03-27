import { supabase } from '../config/supabase.js';

/**
 * Middleware — verifies a Supabase Bearer token on protected routes.
 * Attaches the Supabase user object to req.user.
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  next();
}

/**
 * Middleware — restricts route to specific roles.
 * Must be used after authenticate().
 * Role is read from user_metadata.role (set via Supabase dashboard or admin API).
 * @param {...string} roles  e.g. requireRole('admin', 'staff')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.user_metadata?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
