import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DELIVERY_FEE     = 3_500;
const NANEKA_WHATSAPP  = import.meta.env.VITE_WA_BUSINESS_NUMBER || '255713610774';

function formatTZS(n) { return 'TZS\u00A0' + Number(n).toLocaleString('en-TZ'); }
function buildWAUrl(name, price) {
  return `https://wa.me/${NANEKA_WHATSAPP}?text=${encodeURIComponent(`Hi Naneka, I want to buy ${name} for ${formatTZS(price)}. Is it available?`)}`;
}

function WAIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function ProductCard({ product, onBuyNow, onAddToCart, inv }) {
  const navigate             = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  const showImage             = product.images?.[0] && !imgErr;
  const imgSrc                = product.images?.[0] ?? product.image;
  const showImg               = (imgSrc) && !imgErr;

  const cardBg    = inv ? '#1A2E1A' : '#fff';
  const textCol   = inv ? '#fff'    : 'var(--c-text)';
  const mutedCol  = inv ? 'rgba(255,255,255,0.55)' : 'var(--c-text-muted)';
  const borderCol = inv
    ? (hovered ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.18)')
    : (hovered ? 'var(--c-border-hover)' : 'var(--c-border)');

  function goToDetail(e) {
    e.stopPropagation();
    navigate(`/products/${product.id}`);
  }

  return (
    <article
      onClick={goToDetail}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg, borderRadius: 'var(--radius)',
        border: `1px solid ${borderCol}`, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        boxShadow: hovered ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        cursor: 'pointer',
      }}
    >
      {/* ── Image area ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative', overflow: 'hidden', minHeight: '185px', cursor: 'pointer',
          background: showImg ? '#F5F2E8' : (inv ? '#162816' : 'linear-gradient(145deg, #FBF8EE 0%, #F5EFD6 100%)'),
          borderBottom: `1px solid ${borderCol}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {showImg ? (
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '185px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
          />
        ) : (
          <span style={{ fontSize: '3.75rem', lineHeight: 1 }}>{product.emoji ?? '📦'}</span>
        )}

        {showImg && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,26,0.32) 0%, transparent 55%)', pointerEvents: 'none' }} />}

        {/* Badge top-right */}
        {product.badge && (
          <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: product.madeInTanzania ? '#1B5E20' : 'var(--c-gold)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.09em', zIndex: 1 }}>
            {product.madeInTanzania ? '🇹🇿 ' : ''}{product.badge}
          </span>
        )}

        {/* WhatsApp icon top-left (shows on hover) */}
        <a
          href={buildWAUrl(product.name, product.price)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title="Order via WhatsApp"
          style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            width: '32px', height: '32px', borderRadius: '50%', background: '#25D366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'scale(1)' : 'scale(0.7)',
            transition: 'opacity 0.2s, transform 0.2s', textDecoration: 'none',
          }}
        >
          <WAIcon />
        </a>

        {/* Quick-view overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(26,26,26,0.75)', padding: '0.5rem',
          textAlign: 'center', fontSize: '0.72rem', fontWeight: 600,
          color: 'var(--c-gold)', letterSpacing: '0.06em', textTransform: 'uppercase',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
        }}>
          View Details →
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '1rem 1.125rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>

        {/* Brand */}
        {product.brand && (
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: inv ? 'rgba(255,255,255,0.4)' : 'var(--c-text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {product.brand}
          </span>
        )}

        {/* Name */}
        <h3
          style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: textCol, lineHeight: 1.3, margin: 0 }}
        >
          {product.name}
        </h3>

        <p style={{ fontSize: '0.82rem', color: mutedCol, lineHeight: 1.55, flex: 1 }}>
          {product.description}
        </p>

        {/* Price + market price */}
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '-0.01em' }}>
            {formatTZS(product.price)}
          </div>
          {product.marketPrice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: inv ? 'rgba(255,255,255,0.3)' : 'var(--c-text-dim)', textDecoration: 'line-through' }}>{formatTZS(product.marketPrice)}</span>
              <span style={{ fontSize: '0.65rem', color: '#4ADE80', fontWeight: 700 }}>
                Save {Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)}%
              </span>
            </div>
          )}
          <div style={{ fontSize: '0.72rem', color: inv ? 'rgba(255,255,255,0.3)' : 'var(--c-text-dim)', marginTop: '0.1rem' }}>
            + {formatTZS(DELIVERY_FEE)} delivery
          </div>
        </div>

        {/* Stock indicator */}
        {product.stock !== undefined && (
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: product.stock > 10 ? (inv ? '#4ADE80' : 'var(--c-success)') : product.stock > 0 ? 'var(--c-warning)' : 'var(--c-error)' }}>
            {product.stock > 10 ? `✓ In Stock` : product.stock > 0 ? `⚠ Only ${product.stock} left` : '✕ Out of Stock'}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart?.(product); }}
            style={{
              flex: 1, padding: '0.6rem 0.75rem',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              fontFamily: 'var(--font-sans)',
              border: `1.5px solid ${inv ? 'rgba(255,255,255,0.2)' : 'var(--c-border-hover)'}`,
              borderRadius: 'var(--radius-sm)',
              background: 'transparent', color: inv ? '#fff' : 'var(--c-text)',
              cursor: 'pointer', transition: 'background 0.18s, border-color 0.18s, color 0.18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = inv ? 'rgba(255,255,255,0.2)' : 'var(--c-border-hover)'; e.currentTarget.style.color = inv ? '#fff' : 'var(--c-text)'; }}
          >
            🛒 Add to Cart
          </button>
          <button
            className="btn btn-gold"
            onClick={e => { e.stopPropagation(); onBuyNow(product); }}
            style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', flexShrink: 0 }}
          >
            Buy Now
          </button>
        </div>

        {/* WhatsApp text link */}
        <a
          href={buildWAUrl(product.name, product.price)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            marginTop: '0.375rem', padding: '0.45rem',
            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase',
            fontFamily: 'var(--font-sans)', border: '1px solid #25D36640',
            borderRadius: 'var(--radius-sm)', background: 'transparent', color: '#128C3E',
            textDecoration: 'none', transition: 'background 0.18s, border-color 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#25D36615'; e.currentTarget.style.borderColor = '#25D366'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#25D36640'; }}
        >
          <WAIcon /> Order via WhatsApp
        </a>
      </div>
    </article>
  );
}
