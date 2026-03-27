/**
 * Supabase JS client — uses HTTPS REST API over port 443.
 * This avoids the IPv6-only direct Postgres host (db.*.supabase.co has no A record
 * in GitHub Codespaces) and the pooler's "Tenant or user not found" issues.
 * RLS is disabled on all tables, so the anon key can read and write freely.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseSvcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabase] SUPABASE_URL and SUPABASE_ANON_KEY must be set — orders will fall back to localStore');
}

/** Anon client — used for all standard DB queries (RLS disabled on our tables) */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : null;

/** Admin client — service-role key required for auth.admin.* operations */
export const supabaseAdmin = supabaseUrl && supabaseSvcKey
  ? createClient(supabaseUrl, supabaseSvcKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

if (!supabaseSvcKey) {
  console.warn('[supabase] SUPABASE_SERVICE_ROLE_KEY not set — phone auth user creation will fail');
}
