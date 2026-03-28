/**
 * Africa's Talking SMS gateway
 *
 * Replaces Beem Africa (DNS-unresolvable from Vercel).
 * Africa's Talking REST API works reliably from all serverless hosts.
 *
 * Docs: https://developers.africastalking.com/docs/sms/sending
 *
 * Required env vars:
 *   AT_API_KEY    — Africa's Talking API key (from africastalking.com dashboard)
 *   AT_USERNAME   — Africa's Talking username (use "sandbox" for testing)
 *   AT_SENDER_ID  — Short code / sender name (optional, e.g. "NANEKA")
 */

const PLACEHOLDERS = new Set(['', 'your_at_api_key', 'your_at_username']);

function assertConfig() {
  const missing = [];
  if (PLACEHOLDERS.has(process.env.AT_API_KEY   ?? '')) missing.push('AT_API_KEY');
  if (PLACEHOLDERS.has(process.env.AT_USERNAME   ?? '')) missing.push('AT_USERNAME');
  if (missing.length) {
    throw new Error(
      `[africastalking] Missing env var(s): ${missing.join(', ')}. ` +
      'Get your key at africastalking.com → Settings → API Key.'
    );
  }
}

/**
 * Send a single SMS via Africa's Talking.
 *
 * @param {string} to      E.164 phone number, e.g. '+255712345678'
 * @param {string} message Text body (max 160 chars for a single segment)
 */
export async function sendSms(to, message) {
  assertConfig();

  const apiKey   = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;
  const senderId = process.env.AT_SENDER_ID ?? '';

  // Sandbox and production use different base URLs
  const baseUrl = username === 'sandbox'
    ? 'https://api.sandbox.africastalking.com'
    : 'https://api.africastalking.com';

  const params = new URLSearchParams({ username, to, message });
  if (senderId) params.set('from', senderId);

  const res = await fetch(`${baseUrl}/version1/messaging`, {
    method:  'POST',
    headers: {
      'apiKey':       apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept':       'application/json',
    },
    body: params.toString(),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`[africastalking] HTTP ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  }

  // Verify delivery status in response
  const recipients = body?.SMSMessageData?.Recipients ?? [];
  const failed = recipients.filter(r => r.statusCode !== 101);
  if (failed.length > 0 && recipients.length > 0) {
    const f = failed[0];
    throw new Error(`[africastalking] Delivery failed for ${f.number}: ${f.status} (code ${f.statusCode})`);
  }

  console.log(`[africastalking] ✓ SMS sent to ${to} — ${body?.SMSMessageData?.Message ?? 'OK'}`);
  return body;
}
