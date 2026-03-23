import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

const DELIVERY_FEE = 3_500;

function formatTZS(n) {
  return 'TZS\u00A0' + Number(n).toLocaleString('en-TZ');
}

export default function CartDrawer({ onCheckout }) {
  const { items, remove, updateQty, total, drawerOpen, setDrawerOpen } = useCart();
  if (!drawerOpen) return null;

  const grandTotal = total + (items.length > 0 ? DELIVERY_FEE : 0);

  return (
    <>
      {/* Backdrop — above the bottom nav (480) so the drawer feels modal */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(26,26,26,0.6)',
          zIndex: 500, animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(440px, 100vw)',
        background: '#fff', zIndex: 501,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 50px rgba(0,0,0,0.25)',
        animation: 'slideInRight 0.28s cubic-bezier(0.32,0.72,0,1)',
      }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          background: '#1A1A1A',
          borderBottom: '2px solid var(--c-gold)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>
              Shopping Cart
            </div>
            {items.length > 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--c-gold)', marginTop: '0.15rem' }}>
                {items.reduce((s, i) => s + i.qty, 0)} item{items.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''} · {formatTZS(total)} subtotal
              </div>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'rgba(255,255,255,0.65)', padding: '0.25rem' }}
          >
            ✕
          </button>
        </div>

        {/* ── Items list ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--c-text-dim)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
              <div style={{ fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.375rem', fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>
                Your cart is empty
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>
                Browse our store and add items to get started
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn btn-gold"
                style={{ padding: '0.75rem 2rem' }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(({ product, qty }) => (
              <CartItem
                key={product.id}
                product={product}
                qty={qty}
                onRemove={() => remove(product.id)}
                onQtyChange={(q) => updateQty(product.id, q)}
                onBuy={() => { setDrawerOpen(false); onCheckout?.(product); }}
              />
            ))
          )}
        </div>

        {/* ── Footer / Summary ──────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--c-border)', background: '#FAFAF7' }}>
            {/* Line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.875rem' }}>
              <PriceLine label="Subtotal" value={formatTZS(total)} />
              <PriceLine label="Delivery fee" value={formatTZS(DELIVERY_FEE)} />
            </div>

            {/* Grand total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              paddingTop: '0.875rem', borderTop: '2px solid var(--c-gold)',
              marginBottom: '1.25rem',
              fontSize: '1.125rem', fontWeight: 800, color: 'var(--c-text)',
            }}>
              <span>Total</span>
              <span style={{ color: 'var(--c-gold)', fontFamily: 'var(--font-serif)' }}>{formatTZS(grandTotal)}</span>
            </div>

            {/* CTA */}
            <button
              className="btn btn-gold btn-full"
              onClick={() => { setDrawerOpen(false); onCheckout?.(items[0].product); }}
              style={{ padding: '1rem', fontSize: '0.9rem', letterSpacing: '0.04em', marginBottom: '0.625rem' }}
            >
              Proceed to Checkout →
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--c-text-dim)' }}>
              Multi-item checkout · Secured by Flutterwave
            </p>

            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                width: '100%', marginTop: '0.5rem', padding: '0.6rem',
                background: 'none', border: '1px solid var(--c-border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontSize: '0.8125rem', color: 'var(--c-text-muted)', fontFamily: 'var(--font-sans)',
              }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Cart item row ───────────────────────────────────────────────────────── */
function CartItem({ product, qty, onRemove, onQtyChange, onBuy }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = product.images?.[0] && !imgErr;

  return (
    <div style={{
      display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
      padding: '0.875rem', background: '#fff',
      borderRadius: 'var(--radius-sm)', border: '1px solid var(--c-border)',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: '64px', height: '64px', borderRadius: 'var(--radius-sm)',
        background: '#F5F2E8', display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
      }}>
        {showImg
          ? <img src={product.images[0]} alt={product.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '2rem' }}>{product.emoji ?? '📦'}</span>
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--c-text)', lineHeight: 1.3, marginBottom: '0.2rem' }}>
          {product.name}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--c-gold)', fontWeight: 700, marginBottom: '0.5rem' }}>
          {formatTZS(product.price * qty)}
          {qty > 1 && <span style={{ color: 'var(--c-text-dim)', fontWeight: 400 }}> × {qty}</span>}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Qty stepper */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              onClick={() => onQtyChange(qty - 1)}
              style={{ width: '28px', height: '28px', border: 'none', background: '#F5F2E8', cursor: 'pointer', fontSize: '1rem', color: 'var(--c-text)', fontFamily: 'var(--font-sans)' }}
            >−</button>
            <span style={{ padding: '0 0.625rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-text)', minWidth: '32px', textAlign: 'center' }}>{qty}</span>
            <button
              onClick={() => onQtyChange(qty + 1)}
              style={{ width: '28px', height: '28px', border: 'none', background: '#F5F2E8', cursor: 'pointer', fontSize: '1rem', color: 'var(--c-text)', fontFamily: 'var(--font-sans)' }}
            >+</button>
          </div>

          <button onClick={onBuy} className="btn btn-gold" style={{ padding: '0.3rem 0.75rem', fontSize: '0.7rem' }}>
            Buy Now
          </button>
          <button
            onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--c-text-dim)', padding: 0, fontFamily: 'var(--font-sans)', textDecoration: 'underline' }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceLine({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--c-text-muted)' }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
