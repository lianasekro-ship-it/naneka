/**
 * Beem Africa SMS gateway
 * Docs: https://apigw.beemafrica.com
 * Auth: HTTP Basic — base64(api_key:secret_key)
 */
import axios from 'axios';

const BEEM_BASE = 'https://apigw.beemafrica.com';

/**
 * Send a single SMS via Beem.
 * @param {string} to      E.164 phone number, e.g. '+255712345678'
 * @param {string} message Text to send (max 160 chars for a single segment)
 */
export async function sendSms(to, message) {
  const apiKey    = process.env.BEEM_API_KEY;
  const apiSecret = process.env.BEEM_API_SECRET;
  const senderId  = process.env.BEEM_SENDER_ID || 'NANEKA';

  if (!apiKey || !apiSecret) {
    throw new Error('[beem] BEEM_API_KEY and BEEM_API_SECRET must be set');
  }

  // Beem expects digits only — strip leading +
  const destAddr = to.replace(/^\+/, '');

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const { data } = await axios.post(
    `${BEEM_BASE}/v1/send`,
    {
      source_addr: senderId,
      encoding:    0,
      message,
      recipients: [{ recipient_id: 1, dest_addr: destAddr }],
    },
    {
      headers: {
        Authorization:  `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    },
  );

  return data;
}
