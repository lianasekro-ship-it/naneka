/**
 * Driver App — Pending Deliveries
 * Route: /driver
 *
 * Simplified view: shows all actionable orders with a prominent "Complete" button.
 * PATCH /api/v1/orders/:id/status requires a staff JWT — set via the token button.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { NanekaLogo } from './Storefront.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Statuses a driver needs to act on (preparer marks ready_for_pickup before driver sees it)
const PENDING_STATUSES   = ['ready_for_pickup', 'out_for_delivery'];
const COMPLETED_STATUSES = ['delivered'];

const STATUS_META = {
  ready_for_pickup: { label: 'Ready for Pickup', cls: 'badge-paid'     },
  out_for_delivery: { label: 'En Route',          cls: 'badge-delivery' },
  delivered:        { label: 'Delivered',         cls: 'badge-done'     },
  cancelled:        { label: 'Cancelled',         cls: 'badge-cancel'   },
};

// Maps each actionable status → the next status and button label
const STATUS_ACTIONS = {
  ready_for_pickup: { next: 'out_for_delivery', label: 'Start Delivery'    },
  out_for_delivery: { next: 'delivered',        label: 'Complete Delivery' },
};

function formatTZS(n) { return 'TZS\u00A0' + Number(n).toLocaleString('en-TZ'); }

function openMap(address) {
  const q = encodeURIComponent(address ?? 'Dar es Salaam, Tanzania');
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
}

const REFRESH_MS = 20_000;

export default function DriverApp() {
  const { signOut } = useAuth();
  const navigate    = useNavigate();

  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastSync,   setLastSync]   = useState(null);
  const [busy,       setBusy]       = useState({});
  const [actionErr,  setActionErr]  = useState({});
  const [showDone,   setShowDone]   = useState(false);

  const [token, setToken] = useState(() => localStorage.getItem('naneka_driver_token') ?? '');
  const [showToken, setShowToken] = useState(false);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      // Use ?status= filter on the main list endpoint — avoids route mis-match on older deployments
      const { data } = await api.get('/api/v1/orders?status=ready_for_pickup,out_for_delivery&limit=200', { headers: authHeaders });
      setOrders(data.orders ?? []);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err.response?.status === 401 || err.response?.status === 403 ? 'auth' : (err.message ?? 'Failed to load.'));
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    const id = setInterval(fetchOrders, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchOrders]);

  async function advanceStatus(orderId, nextStatus) {
    setBusy(b => ({ ...b, [orderId]: true }));
    setActionErr(e => ({ ...e, [orderId]: null }));
    try {
      await api.patch(
        `/api/v1/orders/${orderId}/status`,
        { status: nextStatus },
        { headers: authHeaders }
      );
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    } catch (err) {
      const msg = err.response?.status === 401 || err.response?.status === 403
        ? 'Not authorised. Check your token.'
        : (err.response?.data?.error?.message ?? err.response?.data?.message ?? err.message ?? 'Update failed. Try again.');
      setActionErr(e => ({ ...e, [orderId]: msg }));
    } finally {
      setBusy(b => ({ ...b, [orderId]: false }));
    }
  }

  function saveToken(t) {
    setToken(t);
    localStorage.setItem('naneka_driver_token', t);
    setShowToken(false);
    setError(null);
    setLoading(true);
  }

  // /pending only returns actionable statuses — all orders here are "pending".
  // Completed orders (delivered) are not returned by that endpoint, so we
  // derive the completed list from any orders that have been advanced to
  // 'delivered' during this session (status updated via advanceStatus).
  const pending   = orders.filter(o => PENDING_STATUSES.includes(o.status));
  const completed = orders.filter(o => COMPLETED_STATUSES.includes(o.status));

  return (
    <div style={{ minHeight: '100dvh', background: '#F8F8F8', fontFamily: 'var(--font-sans)', color: 'var(--c-text)' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{
        background: '#FFFFFF', borderBottom: '1px solid var(--c-border)',
        boxShadow: '0 1px 0 rgba(197,160,33,0.15), 0 2px 8px rgba(45,45,45,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <NanekaLogo size="sm" />
            <div style={{ width: '1px', height: '22px', background: 'var(--c-border)' }} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-text)' }}>Driver Portal</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)' }}>
                {pending.length} pending · {completed.length} done
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {lastSync && (
              <span style={{ fontSize: '0.7rem', color: 'var(--c-text-dim)' }}>
                {lastSync.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              className="btn btn-gold"
              onClick={() => fetchOrders(true)}
              disabled={refreshing || loading}
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', fontWeight: 700 }}
            >
              {refreshing ? <><span className="spinner" style={{ width: '0.75rem', height: '0.75rem' }} /></> : '⟳ Refresh'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowToken(t => !t)}
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>
              🔑 Token
            </button>
            <button
              onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
              style={{
                minWidth: '44px', minHeight: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                padding: '0.4rem 0.875rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: 'transparent',
                color: '#EF4444',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; }}
            >
              ⎋ Logout
            </button>
          </div>
        </div>

        {showToken && <TokenInput current={token} onSave={saveToken} onCancel={() => setShowToken(false)} />}
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.25rem' }}>

        {/* ── Auth error ─────────────────────────────────────────────────── */}
        {error === 'auth' && (
          <div style={{ background: 'var(--c-warning-light)', border: '1px solid var(--c-warning)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--c-warning)' }}>
            <strong>Authentication required.</strong> Tap <strong>🔑 Token</strong> above to enter your staff JWT.
          </div>
        )}
        {error && error !== 'auth' && (
          <div style={{ background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--c-error)' }}>
            {error}
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-muted)' }}>
            <span className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--c-gold)' }} />
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Fetching orders…</p>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {!loading && error !== 'auth' && pending.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '3.5rem 1rem',
            background: '#FFFFFF', border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 12px rgba(45,45,45,0.05)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--c-text)', marginBottom: '0.375rem', fontWeight: 700 }}>
              All Delivered!
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--c-text-muted)' }}>No pending orders. Great work today.</p>
          </div>
        )}

        {/* ── Pending order cards ─────────────────────────────────────────── */}
        {!loading && pending.map(order => (
          <PendingCard
            key={order.id}
            order={order}
            busy={busy[order.id]}
            error={actionErr[order.id]}
            onAdvance={(nextStatus) => advanceStatus(order.id, nextStatus)}
          />
        ))}

        {/* ── Completed section (collapsible) ────────────────────────────── */}
        {!loading && completed.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => setShowDone(s => !s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', padding: '0.5rem 0',
                cursor: 'pointer', color: 'var(--c-text-muted)', fontSize: '0.8125rem', fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}
            >
              <span>Completed ({completed.length})</span>
              <span>{showDone ? '▲' : '▼'}</span>
            </button>
            {showDone && completed.map(order => (
              <div key={order.id} style={{
                background: '#FFFFFF', border: '1px solid var(--c-border)',
                borderRadius: 'var(--radius)', padding: '0.875rem 1rem',
                marginTop: '0.625rem', opacity: 0.65,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--c-text-dim)', background: 'var(--c-surface-2)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="badge badge-done">Delivered</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{order.customer_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)' }}>{order.customer_phone}</div>
                </div>
                <div style={{ color: 'var(--c-success)', fontWeight: 700, fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>
                  ✓
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── PendingCard ─────────────────────────────────────────────────────────────── */
function PendingCard({ order, busy, error, onAdvance }) {
  const [expanded, setExpanded] = useState(false);
  const meta   = STATUS_META[order.status]   ?? { label: order.status,   cls: 'badge-pending' };
  const action = STATUS_ACTIONS[order.status] ?? null;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid var(--c-border)',
      borderLeft: '3px solid var(--c-gold)',
      borderRadius: 'var(--radius)',
      marginBottom: '0.875rem',
      boxShadow: '0 2px 12px rgba(45,45,45,0.07)',
      overflow: 'hidden',
    }}>
      {/* Top row */}
      <div style={{ padding: '1rem 1.125rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--c-text-dim)', background: '#F5F5F5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={`badge ${meta.cls}`}>{meta.label}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--c-text)' }}>
            {order.customer_name}
          </div>
          <a
            href={`tel:${order.customer_phone}`}
            style={{ fontSize: '0.875rem', color: 'var(--c-gold)', fontWeight: 600, display: 'inline-block', marginTop: '0.1rem', textDecoration: 'none' }}
          >
            {order.customer_phone}
          </a>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: '1.0625rem', color: 'var(--c-gold)', whiteSpace: 'nowrap' }}>
            {formatTZS(order.total)}
          </div>
        </div>
      </div>

      {/* Address */}
      <div style={{
        margin: '0 1.125rem 0.875rem',
        background: '#F9F7F2',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.625rem 0.875rem',
        fontSize: '0.875rem',
        color: 'var(--c-text)',
        lineHeight: 1.55,
      }}>
        📍 {order.delivery_address}
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: '0 1.125rem 0.75rem', padding: '0.5rem 0.75rem', background: 'var(--c-error-light)', color: 'var(--c-error)', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '0 1.125rem 1rem', display: 'flex', gap: '0.625rem' }}>
        <button
          className="btn btn-ghost"
          onClick={() => openMap(order.delivery_address)}
          style={{ fontSize: '0.8125rem', padding: '0.65rem 0.875rem' }}
          aria-label="Open in Maps"
        >
          🗺️ Maps
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setExpanded(e => !e)}
          style={{ fontSize: '0.8125rem', padding: '0.65rem 0.875rem' }}
        >
          {expanded ? '▲ Less' : '▼ Details'}
        </button>
        {action && (
          <button
            className="btn btn-gold"
            disabled={busy}
            onClick={() => onAdvance(action.next)}
            style={{
              flex: 1, fontSize: '0.9rem', padding: '0.65rem 1rem', fontWeight: 700,
              background: action.next === 'delivered' ? 'var(--c-gold)' :
                          action.next === 'out_for_delivery' ? '#1a1a1a' : 'var(--c-gold)',
              color: action.next === 'out_for_delivery' ? 'var(--c-gold)' : '#000',
              border: action.next === 'out_for_delivery' ? '2px solid var(--c-gold)' : 'none',
            }}
          >
            {busy ? <><span className="spinner" /> Updating…</> : `✓ ${action.label}`}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--c-border)', background: '#FAFAFA',
          padding: '0.875rem 1.125rem',
          fontSize: '0.8125rem', color: 'var(--c-text-muted)',
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
        }}>
          <div><strong>Ordered:</strong> {new Date(order.created_at).toLocaleString('en-GB')}</div>
          {order.order_notes && <div><strong>Notes:</strong> {order.order_notes}</div>}
          {order.payment_reference && (
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              <strong>Ref:</strong> {order.payment_reference}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── TokenInput ─────────────────────────────────────────────────────────────── */
function TokenInput({ current, onSave, onCancel }) {
  const [val, setVal] = useState(current);
  return (
    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--c-border)', background: 'var(--c-surface-2)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <input
        className="form-input"
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Paste your staff JWT token…"
        style={{ flex: 1, minWidth: '200px', fontSize: '0.8125rem', fontFamily: 'monospace' }}
        autoFocus
      />
      <button className="btn btn-gold"  onClick={() => onSave(val)} style={{ fontSize: '0.8125rem', padding: '0.6rem 1rem' }}>Save</button>
      <button className="btn btn-ghost" onClick={onCancel}          style={{ fontSize: '0.8125rem', padding: '0.6rem 0.875rem' }}>Cancel</button>
    </div>
  );
}
