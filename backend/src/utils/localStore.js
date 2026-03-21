/**
 * localStore.js
 *
 * A lightweight JSON file store for orders.
 * Acts as the PRIMARY data source so the admin panel and driver app
 * work even when PostgreSQL is unavailable (e.g. Codespaces dev).
 *
 * File location: naneka-platform/backend/data/orders.json
 *
 * All functions are async so they can be transparently swapped for
 * DB calls later. Writes use a write-then-rename strategy to prevent
 * corruption if the process is killed mid-write.
 */

import fs   from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'orders.json');
const TMP_FILE   = STORE_FILE + '.tmp';

// Statuses the driver needs to act on
const PENDING_STATUSES = new Set([
  'pending_payment',
  'paid',
  'processing',
  'out_for_delivery',
]);

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists — fine
  }
}

async function read() {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.orders) ? parsed.orders : [];
  } catch {
    // file missing or corrupt — start fresh
    return [];
  }
}

async function write(orders) {
  await ensureDataDir();
  const json = JSON.stringify({ orders }, null, 2);
  await fs.writeFile(TMP_FILE, json, 'utf8');
  await fs.rename(TMP_FILE, STORE_FILE);   // atomic on POSIX
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return all orders, newest first.
 */
export async function readOrders() {
  const orders = await read();
  return orders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Return only orders a driver needs to act on (excludes delivered / cancelled).
 */
export async function readPendingOrders() {
  const orders = await readOrders();
  return orders.filter(o => PENDING_STATUSES.has(o.status));
}

/**
 * Look up a single order by UUID.
 * @param {string} id
 * @returns {object|null}
 */
export async function getOrderById(id) {
  const orders = await read();
  return orders.find(o => o.id === id) ?? null;
}

/**
 * Look up a single order by 8-char short code (first 8 hex chars of UUID).
 * @param {string} code  e.g. "DB219AC5"
 * @returns {object|null}
 */
export async function getOrderByShortCode(code) {
  const orders = await read();
  return orders.find(o => o.id.slice(0, 8).toUpperCase() === code.toUpperCase()) ?? null;
}

/**
 * Insert or replace an order (matched by id).
 * @param {object} order  Full order object
 */
export async function saveOrder(order) {
  const orders = await read();
  const idx    = orders.findIndex(o => o.id === order.id);
  if (idx >= 0) {
    orders[idx] = order;
  } else {
    orders.push(order);
  }
  await write(orders);
  return order;
}

/**
 * Update specific fields on an existing order.
 * @param {string} id
 * @param {object} updates  Partial order fields to merge
 * @returns {object|null}  Updated order, or null if not found
 */
export async function updateOrder(id, updates) {
  const orders = await read();
  const idx    = orders.findIndex(o => o.id === id);
  if (idx < 0) return null;

  orders[idx] = {
    ...orders[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await write(orders);
  return orders[idx];
}

/**
 * Delete an order by id.
 * @param {string} id
 * @returns {boolean}
 */
export async function deleteOrder(id) {
  const orders  = await read();
  const before  = orders.length;
  const filtered = orders.filter(o => o.id !== id);
  if (filtered.length === before) return false;
  await write(filtered);
  return true;
}
