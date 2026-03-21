import { useSearchParams, useNavigate } from 'react-router-dom';
import { NanekaLogo } from './Storefront.jsx';

export default function PaymentResult() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const orderId   = params.get('orderId');
  // Short order number — first 8 chars of UUID, uppercased (e.g. "DB219AC5")
  const shortCode = orderId ? orderId.slice(0, 8).toUpperCase() : null;

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', background: 'var(--c-bg)', color: 'var(--c-text)',
      padding: '2rem', textAlign: 'center',
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <NanekaLogo />
      </div>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Thank You!
      </p>
      <p style={{ color: 'var(--c-text-muted)', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
        Your Naneka order has been placed successfully.
      </p>
      {shortCode && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
          background: 'var(--c-surface-2, #F5F0E8)',
          border: '1px solid var(--c-gold)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.625rem 1.125rem',
          marginBottom: '1.75rem',
        }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)' }}>Order Number</span>
          <span style={{
            fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono, monospace)', color: 'var(--c-gold)',
          }}>
            #{shortCode}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {shortCode && (
          <button
            className="btn btn-gold"
            style={{ padding: '0.75rem 2rem' }}
            onClick={() => navigate(`/orders/${shortCode}/track`)}
          >
            Track My Order
          </button>
        )}
        <button
          className="btn btn-ghost"
          style={{ padding: '0.75rem 2rem' }}
          onClick={() => navigate('/')}
        >
          ← Back to Storefront
        </button>
      </div>
    </div>
  );
}
