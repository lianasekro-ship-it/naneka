import 'dotenv/config';
import path    from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet  from 'helmet';
import cors    from 'cors';
import morgan  from 'morgan';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import ordersRouter      from './routes/orders.js';
import paymentsRouter    from './routes/payments.js';
import deliveriesRouter  from './routes/deliveries.js';
import webhooksRouter    from './routes/webhooks.js';
import mediaRouter       from './routes/media.js';
import adminRouter       from './routes/admin.js';
import productsRouter    from './routes/products.js';
import priceCheckRouter  from './routes/priceCheck.js';
import salesRouter       from './routes/sales.js';
import exportRouter      from './routes/export.js';
import { publicSectionsRouter, adminSectionsRouter } from './routes/siteSections.js';
import authRouter          from './routes/auth.js';
import githubRouter        from './routes/github.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();

// ─── Security & Logging ──────────────────────────────────────────────────────
app.use(helmet({
  // Allow images served from /uploads to be loaded by browsers
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — allow all origins so the Codespace proxy never blocks requests.
// Note: credentials:true is omitted because wildcard origin and credentials
// are mutually exclusive in the CORS spec. JWT is sent via Authorization
// header (Bearer), not cookies, so credentials mode is not needed.
app.use(cors({ origin: '*' }));

app.use(morgan('dev'));

// ─── Static Assets ───────────────────────────────────────────────────────────
// Serve uploaded product images at /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ─── Body Parsing ────────────────────────────────────────────────────────────
// Raw body preserved on /webhooks/* for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',         authRouter);
app.use('/api/v1/github',       githubRouter);
app.use('/api/v1/orders',       ordersRouter);
app.use('/api/v1/payments',     paymentsRouter);
app.use('/api/v1/deliveries',   deliveriesRouter);
app.use('/api/v1/media',        mediaRouter);
app.use('/webhooks',            webhooksRouter);
app.use('/api/v1',              productsRouter);      // /products, /categories
app.use('/api/v1/site-sections', publicSectionsRouter);

// Admin routes — more-specific sub-paths before the general adminRouter
app.use('/api/v1/admin/sales',         salesRouter);
app.use('/api/v1/admin/export',        exportRouter);
app.use('/api/v1/admin/site-sections', adminSectionsRouter);
app.use('/api/v1/admin',               adminRouter);

app.use('/api',                priceCheckRouter);    // GET /api/price-check

// v3: VALID_STATUSES includes preparing + ready_for_pickup; ?status= filter on /orders
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'naneka-backend', v: '3' }));

// ─── WAHA Rescue Route ────────────────────────────────────────────────────────
// Registered directly here (not via adminRouter) so it works even if admin.js
// fails to import. Returns an HTML page — just open in a browser, no keys needed.
// Remove once WAHA_GROUP_ID is set in Vercel.
app.get('/api/v1/admin/rescue-id', async (_req, res) => {
  const base    = process.env.WAHA_BASE_URL  || '';
  const key     = process.env.WAHA_API_KEY   || '';
  const session = process.env.WAHA_SESSION   || 'default';
  const groupId = process.env.WAHA_GROUP_ID  || '';
  const kp      = key ? `${key.slice(0, 6)}…${key.slice(-4)}` : '(not set)';

  const css = `body{font-family:-apple-system,sans-serif;max-width:640px;margin:40px auto;
    padding:0 20px;background:#f8fafc;color:#1e293b}
    .card{background:#fff;border-radius:10px;padding:20px 24px;margin:14px 0;
    box-shadow:0 1px 4px rgba(0,0,0,.08)}
    .ok{border-left:4px solid #22c55e}.err{border-left:4px solid #ef4444}
    .warn{border-left:4px solid #f59e0b}.info{border-left:4px solid #3b82f6}
    .id{font:700 1.3em monospace;color:#15803d;background:#f0fdf4;padding:12px;
    border-radius:8px;word-break:break-all;display:block;margin:10px 0}
    code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace}
    ol{line-height:2}`;

  const env_status = [
    `<tr><td style="color:#64748b;padding:6px 10px;width:190px">WAHA_BASE_URL</td><td style="padding:6px 10px">${base  || '<span style="color:#ef4444">✗ NOT SET</span>'}</td></tr>`,
    `<tr><td style="color:#64748b;padding:6px 10px">WAHA_API_KEY</td><td style="padding:6px 10px">${key   ? `<span style="color:#22c55e">✓</span> ${kp}` : '<span style="color:#ef4444">✗ NOT SET</span>'}</td></tr>`,
    `<tr><td style="color:#64748b;padding:6px 10px">WAHA_SESSION</td><td style="padding:6px 10px">${session}</td></tr>`,
    `<tr><td style="color:#64748b;padding:6px 10px">WAHA_GROUP_ID</td><td style="padding:6px 10px">${groupId || '<span style="color:#ef4444">✗ NOT SET — this is what you need</span>'}</td></tr>`,
  ].join('');

  const wrap = (title, body) =>
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Naneka Rescue — ${title}</title><style>${css}</style></head>
    <body><h1>🔍 Naneka Rescue</h1>
    <div class="card info"><h3 style="margin:0 0 8px">Server environment</h3>
    <table style="width:100%;border-collapse:collapse">${env_status}</table></div>
    ${body}</body></html>`;

  // ── Already done ───────────────────────────────────────────────────────────
  if (groupId) {
    return res.send(wrap('Already set', `
      <div class="card ok"><h2>✅ WAHA_GROUP_ID is already configured!</h2>
      <span class="id">${groupId}</span>
      <p>WhatsApp group notifications are enabled. You're done.</p></div>`));
  }

  // ── Missing env vars ───────────────────────────────────────────────────────
  if (!base || !key) {
    return res.send(wrap('Not configured', `
      <div class="card err"><h2>❌ WAHA env vars not set on Vercel</h2>
      <p>Add these in <strong>Vercel → Project → Settings → Environment Variables</strong>:</p>
      <ul>${!base ? '<li><code>WAHA_BASE_URL</code> — public URL of your WAHA server (NOT localhost)</li>' : ''}
      ${!key ? '<li><code>WAHA_API_KEY</code> — your WAHA API key</li>' : ''}</ul>
      <p>Then redeploy and open this page again.</p></div>
      <div class="card warn"><h2>⚠️ localhost won't work from Vercel</h2>
      <p>If WAHA runs on your machine, expose it with <a href="https://ngrok.com">ngrok</a>:
      <code>ngrok http 3001</code> → copy the <code>https://…ngrok.io</code> URL → set as
      <code>WAHA_BASE_URL</code> in Vercel.</p></div>`));
  }

  // ── Detect localhost — will never reach from Vercel ───────────────────────
  const isLocal = /localhost|127\.0\.0\.1/.test(base);
  if (isLocal) {
    return res.send(wrap('localhost detected', `
      <div class="card err"><h2>🔌 WAHA_BASE_URL is set to <code>${base}</code></h2>
      <p>Vercel runs in the cloud — <code>localhost</code> on Vercel is Vercel's own machine,
      not yours. The backend can never reach your WAHA this way.</p></div>
      <div class="card warn"><h2>Fix — 2 options</h2>
      <h3>Option A (easiest): Use the WAHA webhook instead</h3>
      <ol>
        <li>Open your WAHA dashboard at <code>http://localhost:3001</code></li>
        <li>Go to <strong>Settings → Webhooks</strong></li>
        <li>Add webhook URL: <code>${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://your-backend.vercel.app'}/webhooks/waha</code></li>
        <li>Send any message to your <em>Naneka Orders</em> WhatsApp group</li>
        <li>Open <strong>Vercel → Functions → Logs</strong> — look for <code>[waha] GROUP ID :</code></li>
      </ol>
      <h3>Option B: Expose WAHA publicly</h3>
      <ol>
        <li>Run <code>ngrok http 3001</code> on your machine</li>
        <li>Copy the <code>https://…ngrok.io</code> URL</li>
        <li>Set <code>WAHA_BASE_URL=https://…ngrok.io</code> in Vercel → Redeploy</li>
        <li>Open this page again</li>
      </ol></div>`));
  }

  // ── Try WAHA ───────────────────────────────────────────────────────────────
  let wahaRes;
  try {
    wahaRes = await fetch(`${base}/api/${session}/chats`, {
      headers: { 'X-Api-Key': key },
      signal:  AbortSignal.timeout(10_000),
    });
  } catch (err) {
    return res.send(wrap('Unreachable', `
      <div class="card err"><h2>🔌 Cannot reach WAHA at <code>${base}</code></h2>
      <p>Error: <code>${err.message}</code></p>
      <p>Check that WAHA is running and the URL is publicly accessible.</p></div>`));
  }

  if (wahaRes.status === 401) {
    return res.send(wrap('401 Key mismatch', `
      <div class="card err"><h2>🔑 401 Unauthorized — API key mismatch</h2>
      <p>This server is sending key: <code>${kp}</code> (full value: <code>${key}</code>)</p>
      <p>WAHA is rejecting it. Choose one fix:</p>
      <h3>Option A — Make WAHA accept this key</h3>
      <ol>
        <li>Open WAHA dashboard at <code>${base}</code></li>
        <li>Go to <strong>Settings → API Key</strong></li>
        <li>Set it to: <code>${key}</code></li>
        <li>Restart WAHA, then refresh this page</li>
      </ol>
      <h3>Option B — Update Vercel to match WAHA's key</h3>
      <ol>
        <li>Find the API key in your WAHA dashboard</li>
        <li>Set <code>WAHA_API_KEY=&lt;that key&gt;</code> in Vercel → Redeploy</li>
      </ol></div>`));
  }

  if (!wahaRes.ok) {
    const detail = await wahaRes.text().catch(() => '');
    return res.send(wrap(`WAHA error ${wahaRes.status}`, `
      <div class="card err"><h2>❌ WAHA returned HTTP ${wahaRes.status}</h2>
      <p>${detail || 'No detail returned.'}</p></div>`));
  }

  const payload = await wahaRes.json();
  const all     = Array.isArray(payload) ? payload : (payload.chats ?? []);
  const groups  = all.filter(c => (c.id || '').endsWith('@g.us'))
                     .map(g => ({ id: g.id, name: g.name ?? g.subject ?? '(unnamed)' }));
  const target  = groups.find(g => /naneka|order/i.test(g.name));

  const cards = groups.map(g => `
    <div class="card ${target && g.id === target.id ? 'ok' : ''}">
      <strong>${g.name}</strong><span class="id">${g.id}</span>
    </div>`).join('');

  if (target) {
    return res.send(wrap('Found!', `
      <div class="card ok"><h2>✅ "${target.name}" found</h2>
      <p>Add this as <code>WAHA_GROUP_ID</code> in Vercel → Redeploy:</p>
      <span class="id">${target.id}</span></div>
      <h3>All groups (${groups.length})</h3>${cards}`));
  }

  return res.send(wrap('Pick a group', `
    <div class="card warn"><h2>⚠️ Could not auto-detect "Naneka Orders"</h2>
    <p>Pick the right group below and copy its ID into <code>WAHA_GROUP_ID</code> in Vercel:</p></div>
    ${cards || '<div class="card err"><p>No WhatsApp groups found. Is the phone in a group?</p></div>'}`));
});

// ─── WAHA QR proxy — always serves the freshest QR from WAHA ─────────────────
// Open in browser to scan: GET /qr
app.get('/qr', async (_req, res) => {
  try {
    const wahaUrl = `${process.env.WAHA_BASE_URL || 'http://localhost:3001'}/api/default/auth/qr`;
    const r = await fetch(wahaUrl, { headers: { 'X-Api-Key': process.env.WAHA_API_KEY || '' } });
    if (!r.ok) {
      return res.status(503).send(`WAHA returned ${r.status}. Is the session started?`);
    }
    const buf = await r.arrayBuffer();
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-store');
    res.set('Refresh', '20'); // browser auto-refreshes every 20 s
    return res.send(Buffer.from(buf));
  } catch (e) {
    return res.status(503).send('WAHA unreachable: ' + e.message);
  }
});

app.get('/', (_req, res) => res.json({
  service:  'naneka-backend',
  status:   'ok',
  version:  '1.0.0',
  docs:     '/api/v1',
}));

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// Vercel runs the file as a module and calls the exported handler directly.
// process.env.VERCEL is set automatically on all Vercel deployments.
if (!process.env.VERCEL) {
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Naneka backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

export default app;
