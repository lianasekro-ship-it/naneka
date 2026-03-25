/**
 * Supabase JS client — uses HTTPS REST API over port 443.
 * This avoids the IPv6-only direct Postgres host (db.*.supabase.co has no A record
 * in GitHub Codespaces) and the pooler's "Tenant or user not found" issues.
 * RLS is disabled on all tables, so the anon key can read and write freely.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[supabase] SUPABASE_URL and SUPABASE_ANON_KEY must be set — orders will fall back to localStore');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;
