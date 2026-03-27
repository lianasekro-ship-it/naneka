import { Router }  from 'express';
import crypto       from 'crypto';
import jwt          from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { sendSms }  from '../services/messaging/beem.js';

const router         = Router();
const OTP_TTL_MIN    = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT     = 3;              // max OTPs per window

/** SHA-256 hash of the 6-digit code — never store plain text */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/** Cryptographically random 6-digit string */
function generateOtp() {
  // random 3-byte int → 0–16777215; modulo gives uniform distribution over 0–999999
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

/** Normalise E.164: strip spaces/dashes, ensure leading + */
function normalisePhone(raw) {
  const digits = raw.replace(/[\s\-().]/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}

// ─── POST /api/v1/auth/send-otp ──────────────────────────────────────────────
router.post('/send-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'phone is required' });
    }

    const e164 = normalisePhone(phone);

    // Rate-limit: max RATE_LIMIT codes per phone per 10 min window
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', e164)
      .gte('created_at', windowStart);

    if (count >= RATE_LIMIT) {
      return res.status(429).json({
        error: 'Too many codes requested. Please wait a few minutes and try again.',
      });
    }

    const code      = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000).toISOString();

    const { error: dbErr } = await supabase.from('otp_codes').insert({
      phone:      e164,
      code_hash:  hashCode(code),
      expires_at: expiresAt,
    });
    if (dbErr) throw dbErr;

    // Send SMS — non-fatal: if the SMS gateway is unreachable the OTP is still
    // stored in the DB so the user can retrieve it via support / Vercel logs.
    try {
      await sendSms(
        e164,
        `Your Naneka verification code is ${code}. Valid for ${OTP_TTL_MIN} minutes. Do not share this code.`,
      );
    } catch (smsErr) {
      // Log the code so it is visible in Vercel function logs during debugging.
      // REMOVE this log line once a reliable SMS gateway is confirmed working.
      console.error(`[auth] SMS delivery failed for ${e164}: ${smsErr.message}`);
      console.warn(`[auth] OTP for ${e164} (check logs only — not for production): ${code}`);
    }

    // Purge stale rows opportunistically (best-effort, don't fail on error)
    supabase.rpc('purge_old_otps').catch(() => {});

    res.json({ message: 'Code sent' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/auth/verify-otp ────────────────────────────────────────────
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'phone and code are required' });
    }

    const e164 = normalisePhone(phone);
    const now  = new Date().toISOString();

    // Find the most-recent valid, unused OTP for this phone
    const { data: rows, error: fetchErr } = await supabase
      .from('otp_codes')
      .select('id, code_hash')
      .eq('phone', e164)
      .eq('used', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr) throw fetchErr;
    if (!rows?.length) {
      return res.status(401).json({ error: 'Code expired or not found. Request a new one.' });
    }

    if (rows[0].code_hash !== hashCode(String(code).trim())) {
      return res.status(401).json({ error: 'Incorrect code.' });
    }

    // Consume the OTP (one-time use)
    await supabase.from('otp_codes').update({ used: true }).eq('id', rows[0].id);

    // ── Find or create Supabase user ─────────────────────────────────────────
    let userId;

    const { data: profile } = await supabase
      .from('phone_profiles')
      .select('user_id')
      .eq('phone', e164)
      .single();

    if (profile) {
      userId = profile.user_id;
    } else {
      // First login — try to create a Supabase Auth user.
      // If SUPABASE_SERVICE_ROLE_KEY is absent, fall back to a local UUID so
      // the JWT can still be issued and the customer can proceed.
      if (supabaseAdmin) {
        const { data: { user: created }, error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            phone:         e164,
            phone_confirm: true,
            user_metadata: { role: 'customer' },
          });
        if (createErr) throw createErr;
        userId = created.id;
      } else {
        console.warn('[auth] SUPABASE_SERVICE_ROLE_KEY not set — using local UUID for new user');
        userId = crypto.randomUUID();
      }

      await supabase.from('phone_profiles').insert({
        phone:   e164,
        user_id: userId,
      });
    }

    // ── Issue a signed JWT ────────────────────────────────────────────────────
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    const accessToken = jwt.sign(
      { sub: userId, phone: e164, role: 'customer', aud: 'naneka' },
      secret,
      { algorithm: 'HS256', expiresIn: '7d' },
    );

    res.json({
      access_token: accessToken,
      user: { id: userId, phone: e164, role: 'customer' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
