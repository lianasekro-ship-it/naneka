import { useSearchParams, useNavigate } from 'react-router-dom';
import { NanekaLogo } from './Storefront.jsx';

function WAIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

const WA_BUSINESS_NUMBER = import.meta.env.VITE_WA_BUSINESS_NUMBER || '255713610774';

export default function OrderConfirmed() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const orderId   = params.get('orderId');
  const shortCode = orderId ? orderId.slice(0, 8).toUpperCase() : null;
  const custName  = params.get('name')  ?? '';
  const total     = params.get('total') ?? '';

  const waText = [
    `Hi Naneka 👋`,
    ``,
    `I'd like to confirm my order:`,
    ``,
    shortCode ? `Order ID: #${shortCode}` : null,
    custName  ? `Name: ${custName}` : null,
    total     ? `Total: TZS ${Number(total).toLocaleString()}` : null,
    ``,
    `Please confirm availability and arrange delivery. Thank you!`,
  ].filter(l => l !== null).join('\n');

  const waLink = `https://wa.me/${WA_BUSINESS_NUMBER}?text=${encodeURIComponent(waText)}`;

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', background: 'var(--c-bg)', color: 'var(--c-text)',
      padding: '2rem', textAlign: 'center',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '2.5rem' }}>
        <NanekaLogo />
      </div>

      {/* WhatsApp success icon */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(37,211,102,0.1)', border: '2px solid #25D366',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#25D366', marginBottom: '1.5rem',
      }}>
        <WAIcon />
      </div>

      {/* Heading */}
      <h1 style={{
        fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        fontWeight: 900, color: 'var(--c-text)', margin: '0 0 0.5rem',
      }}>
        Order Sent!
      </h1>

      <p style={{ color: 'var(--c-text-muted)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '420px', margin: '0 0 1.75rem' }}>
        Your order has been sent to our team on WhatsApp. We'll contact you shortly to confirm availability, arrange delivery, and collect payment.
      </p>

      {/* Order number badge */}
      {shortCode && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
          background: 'var(--c-surface-2, #F5F0E8)',
          border: '1px solid var(--c-gold)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.625rem 1.25rem',
          marginBottom: '2rem',
        }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)' }}>Order Reference</span>
          <span style={{
            fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono, monospace)', color: 'var(--c-gold)',
          }}>
            #{shortCode}
          </span>
        </div>
      )}

      {/* What happens next */}
      <div style={{
        background: '#fff', border: '1px solid var(--c-border)',
        borderRadius: 'var(--radius)', padding: '1.375rem 1.5rem',
        maxWidth: '400px', width: '100%', marginBottom: '2rem',
        textAlign: 'left',
      }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          What happens next
        </div>
        {[
          ['📲', 'Our team receives your order on WhatsApp instantly'],
          ['✅', 'We confirm stock and call or message you back'],
          ['🚚', 'Your order is packed and dispatched same day'],
          ['💵', 'Pay cash or mobile money on delivery'],
        ].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.125rem', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--c-text-muted)', lineHeight: 1.55 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Primary CTA: open WhatsApp with pre-filled order details */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{
            padding: '0.75rem 2rem',
            background: '#25D366', color: '#fff', border: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontWeight: 700, borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
          }}
        >
          <WAIcon size={18} /> Complete Order on WhatsApp
        </a>

        {shortCode && (
          <button
            className="btn btn-ghost"
            style={{ padding: '0.75rem 1.5rem' }}
            onClick={() => navigate(`/orders/${shortCode}/track`)}
          >
            Track My Order
          </button>
        )}
        <button
          className="btn btn-ghost"
          style={{ padding: '0.75rem 1.5rem' }}
          onClick={() => navigate('/')}
        >
          ← Back to Store
        </button>
      </div>
    </div>
  );
}
