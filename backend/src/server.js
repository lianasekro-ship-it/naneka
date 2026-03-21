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

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'naneka-backend' }));

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Naneka backend running on port ${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
