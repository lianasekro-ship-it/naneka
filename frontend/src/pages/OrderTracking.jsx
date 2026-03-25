/**
 * Order Tracking — customer-facing
 *
 * /track              → shows an order-ID lookup form
 * /orders/:id/track   → polls GET /api/v1/orders/:id and GET /api/v1/orders/:id/track
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { NanekaLogo } from './Storefront.jsx';

// ─── Always returns a plain string from any axios/fetch error ─────────────────
function safeMsg(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  const data = err?.response?.data;
  if (typeof data === 'string' && data.length) return data;
  if (data) {
    const candidate = data.message ?? data.error ?? data.detail;
    if (typeof candidate === 'string') return candidate;
    if (candidate && typeof candidate === 'object') {
      return candidate.message ?? JSON.stringify(candidate);
    }
  }
  return typeof err.message === 'string' ? err.message : fallback;
}

const STATUS_META = {
  pending_payment:  { label: 'Awaiting Payment', icon: '⏳', color: '#B7770D',  bg: '#FEF3C7' },
  paid:             { label: 'Payment Confirmed', icon: '✓',  color: '#1D4ED8',  bg: '#DBEAFE' },
  processing:       { label: 'Preparing Order',   icon: '📦', color: '#6D28D9',  bg: '#EDE9FE' },
  out_for_delivery: { label: 'Out for Delivery',  icon: '🚚', color: '#0891B2',  bg: '#CFFAFE' },
  delivered:        { label: 'Delivered',          icon: '🎉', color: '#065F46',  bg: '#D1FAE5' },
  cancelled:        { label: 'Cancelled',          icon: '✕',  color: '#991B1B',  bg: '#FEE2E2' },
};

const POLL_MS = 30_000;

// ─── Gold & Red error box ──────────────────────────────────────────────────────
function ApiErrorBox({ message, onRetry }) {
  return (
    <div role="alert" style={{
      background: 'rgba(192,57,43,0.06)',
      border: '1px solid var(--c-error)',
      borderLeft: '3px solid var(--c-gold)',
      borderRadius: 'var(--radius-sm)',
      padding: '1rem 1.125rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1rem', flexShrink: 0, color: 'var(--c-gold)' }}>⚠</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--c-error)', lineHeight: 1.55 }}>
          {String(message)}
        </span>
      </div>
      {onRetry && (
        <button
          className="btn"
          onClick={onRetry}
          style={{
            alignSelf: 'flex-start',
            background: 'var(--c-error)', color: '#fff', border: 'none',
            fontSize: '0.8125rem', padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)',
          }}
        >
          ↺ Try Again
        </button>
      )}
    </div>
  );
}

// ─── OrderTracking ─────────────────────────────────────────────────────────────
export default function OrderTracking() {
  const { orderId: routeOrderId } = useParams();
  const navigate = useNavigate();

  // Lookup form state (used when no orderId in URL)
  const [inputId,   setInputId]   = useState('');
  const [inputErr,  setInputErr]  = useState('');

  // Tracking state
  const [order,     setOrder]     = useState(null);
  const [tracking,  setTracking]  = useState(null);  // live GPS data (may be null)
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);   // always a string
  const [lastPoll,  setLastPoll]  = useState(null);

  const orderId = routeOrderId ?? null;

  // ── Fetch order + live tracking ─────────────────────────────────────────────
  const fetchAll = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Order details (status, address, customer)
      const { data: orderData } = await api.get(`/api/v1/orders/${id}`);
      setOrder(orderData);

      // 2. Live tracking (only meaningful when out_for_delivery / processing)
      //    Ignore 404/503 — it just means no active delivery yet
      try {
        const { data: trackData } = await api.get(`/api/v1/orders/${id}/track`);
        setTracking(trackData.tracking ?? null);
      } catch {
        setTracking(null);
      }

      setLastPoll(new Date());
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setError(`Order "${id}" was not found. Please check your Order ID and try again.`);
      } else {
        setError(safeMsg(err));
      }
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    if (!orderId) return;
    fetchAll(orderId);
    const id = setInterval(() => fetchAll(orderId), POLL_MS);
    return () => clearInterval(id);
  }, [orderId, fetchAll]);

  // ── Lookup form submit ──────────────────────────────────────────────────────
  function handleLookup(e) {
    e.preventDefault();
    // Strip leading '#', trim whitespace, uppercase for short codes
    const trimmed = inputId.trim().replace(/^#/, '').toUpperCase();
    if (!trimmed) { setInputErr('Please enter your Order ID.'); return; }
    if (trimmed.length < 8) { setInputErr('Order IDs are at least 8 characters long.'); return; }
    setInputErr('');
    navigate(`/orders/${trimmed}/track`);
  }

  const meta = order ? (STATUS_META[order.status] ?? { label: order.status, icon: '•', color: 'var(--c-text-muted)', bg: 'var(--c-surface-2)' }) : null;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', fontFamily: 'var(--font-sans)', color: 'var(--c-text)' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="page-header__inner container">
          <NanekaLogo />
          <a href="/" className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>
            ← Shop
          </a>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #FFFFFF 0%, #FDF8EC 100%)',
        borderBottom: '1px solid rgba(197,160,33,0.15)',
        padding: 'clamp(2rem, 5vw, 3rem) 1.5rem',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: '540px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Live Order Status
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.625rem, 4vw, 2.25rem)', fontWeight: 900, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Track Your Order
          </h1>
          <div className="gold-divider" style={{ margin: '0 auto' }} />
        </div>
      </div>

      <main style={{ maxWidth: '580px', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 2.5rem) 1.25rem' }}>

        {/* ── Lookup form (shown when no orderId in URL) ──────────────────── */}
        {!orderId && (
          <div style={{
            background: '#FFFFFF', border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-lg)', padding: '1.75rem',
            boxShadow: '0 2px 16px rgba(45,45,45,0.07)',
          }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--c-text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Enter the Order ID from your confirmation message to see live status.
            </p>
            <form onSubmit={handleLookup} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Order ID</label>
                <input
                  className={`form-input${inputErr ? ' error' : ''}`}
                  value={inputId}
                  onChange={e => { setInputId(e.target.value); setInputErr(''); }}
                  placeholder="e.g. DB219AC5 or full Order ID"
                  autoFocus
                  spellCheck={false}
                />
                {inputErr && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--c-error)' }}>{inputErr}</span>
                )}
              </div>
              <button type="submit" className="btn btn-gold" style={{ padding: '0.8rem', fontSize: '0.875rem' }}>
                Track Order →
              </button>
            </form>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {orderId && loading && !order && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-muted)' }}>
            <span className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--c-gold)' }} />
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Looking up your order…</p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div style={{ marginBottom: '1.25rem' }}>
            <ApiErrorBox message={error} onRetry={orderId ? () => fetchAll(orderId) : null} />
            {orderId && (
              <div style={{ marginTop: '0.875rem', textAlign: 'center' }}>
                <a href="/track" style={{ fontSize: '0.875rem', color: 'var(--c-gold)', fontWeight: 600 }}>
                  ← Try a different Order ID
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Order card ──────────────────────────────────────────────────── */}
        {order && meta && (
          <div style={{
            background: '#FFFFFF', border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            boxShadow: '0 2px 20px rgba(45,45,45,0.07)',
          }}>

            {/* Status banner */}
            <div style={{
              background: meta.bg, borderBottom: `1px solid ${meta.color}22`,
              padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.875rem',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#fff', border: `2px solid ${meta.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.375rem', flexShrink: 0,
              }}>
                {meta.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: meta.color, marginBottom: '0.15rem' }}>
                  Order Status
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: '1.125rem', color: meta.color }}>
                  {meta.label}
                </div>
              </div>
              {lastPoll && (
                <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--c-text-dim)', textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                  Live · {lastPoll.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Order details */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

              <DetailRow label="Order ID">
                <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--c-text-muted)' }}>
                  {order.id}
                </span>
              </DetailRow>

              {order.customer_name && (
                <DetailRow label="Name">
                  <span style={{ fontWeight: 600 }}>{String(order.customer_name)}</span>
                </DetailRow>
              )}

              {order.delivery_address && (
                <DetailRow label="Delivery Address">
                  <span style={{ color: 'var(--c-text-muted)', lineHeight: 1.5, fontSize: '0.875rem' }}>
                    {String(order.delivery_address)}
                  </span>
                </DetailRow>
              )}

              {order.total != null && (
                <DetailRow label="Total">
                  <span style={{ fontWeight: 700, color: 'var(--c-gold)' }}>
                    TZS&nbsp;{Number(order.total).toLocaleString()}
                  </span>
                </DetailRow>
              )}

              {order.created_at && (
                <DetailRow label="Placed">
                  <span style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>
                    {new Date(order.created_at).toLocaleString('en-GB')}
                  </span>
                </DetailRow>
              )}
            </div>

            {/* Live tracking block (only when delivery is active) */}
            {tracking && (
              <div style={{
                borderTop: '1px solid var(--c-border)',
                padding: '1.125rem 1.5rem',
                background: 'rgba(8,145,178,0.04)',
              }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0891B2', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  🚚 Live Tracking
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tracking.driver?.name && (
                    <DetailRow label="Driver">
                      <span style={{ fontWeight: 600 }}>{String(tracking.driver.name)}</span>
                    </DetailRow>
                  )}
                  {tracking.driver?.phone && (
                    <DetailRow label="Driver Phone">
                      <a href={`tel:${tracking.driver.phone}`} style={{ color: 'var(--c-gold)', fontWeight: 600 }}>
                        {String(tracking.driver.phone)}
                      </a>
                    </DetailRow>
                  )}
                  {tracking.etaMinutes != null && (
                    <DetailRow label="ETA">
                      <span style={{ fontWeight: 700, color: '#0891B2' }}>~{tracking.etaMinutes} min</span>
                    </DetailRow>
                  )}
                  {tracking.latitude != null && tracking.longitude != null && (
                    <DetailRow label="Last Known Position">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${tracking.latitude},${tracking.longitude}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--c-gold)', fontWeight: 600, fontSize: '0.875rem' }}
                      >
                        View on Maps →
                      </a>
                    </DetailRow>
                  )}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div style={{
              borderTop: '1px solid var(--c-border)',
              padding: '1rem 1.5rem',
              display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
              background: '#FAFAFA',
            }}>
              {loading
                ? <span style={{ fontSize: '0.8rem', color: 'var(--c-text-dim)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span className="spinner" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--c-gold)' }} />
                    Refreshing…
                  </span>
                : <button className="btn btn-ghost" onClick={() => fetchAll(orderId)}
                    style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>
                    ⟳ Refresh
                  </button>
              }
              <a href="/track" style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', marginLeft: 'auto' }}>
                Track a different order
              </a>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

/* ─── DetailRow ─────────────────────────────────────────────────────────────── */
function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.875rem' }}>
      <span style={{ minWidth: '130px', flexShrink: 0, fontWeight: 600, color: 'var(--c-text-muted)', fontSize: '0.8125rem' }}>
        {label}
      </span>
      <span style={{ flex: 1, wordBreak: 'break-word' }}>{children}</span>
    </div>
  );
}
