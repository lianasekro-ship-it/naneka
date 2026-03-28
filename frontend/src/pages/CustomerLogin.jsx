import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const inputStyle = (hasError) => ({
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  color: '#fff',
  fontSize: '0.9375rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
});

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

export default function CustomerLogin() {
  const { user, loading, sendOtp, verifyOtp } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname ?? '/';

  const [step,       setStep]       = useState('phone'); // 'phone' | 'otp'
  const [phone,      setPhone]      = useState('');
  const [otp,        setOtp]        = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  if (!loading && user) return <Navigate to={from} replace />;

  async function handleSendOtp(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Normalise: if user types without +, prepend +255 (Tanzania default)
      const normalised = phone.startsWith('+') ? phone : `+255${phone.replace(/^0/, '')}`;
      await sendOtp(normalised);
      setPhone(normalised);
      setStep('otp');
    } catch (err) {
      setError(err.message ?? 'Could not send code. Check the number and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(phone, otp.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Invalid code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const card = {
    width: '100%',
    maxWidth: '400px',
    background: '#1A1A1A',
    border: '1px solid rgba(212,175,55,0.15)',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0F0F0F 0%, #1A1A1A 100%)',
      padding: '1.5rem',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={card}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.875rem',
            fontWeight: 900,
            color: 'var(--c-gold)',
            letterSpacing: '-0.02em',
            marginBottom: '0.25rem',
          }}>
            Naneka
          </div>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            {step === 'phone' ? 'Sign In' : 'Enter Code'}
          </div>
        </div>

        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent)',
          marginBottom: '2rem',
        }} />

        {/* ── Step 1: Phone number ── */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={labelStyle}>Mobile Number</label>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(null); }}
                required
                placeholder="+255 712 345 678"
                style={inputStyle(!!error)}
                onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
                onBlur={e  => (e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)')}
              />
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                Include country code, e.g. +255 for Tanzania
              </span>
            </div>

            {error && <ErrorBox message={error} />}

            <SubmitButton disabled={submitting || !phone.trim()} loading={submitting}>
              Send Code →
            </SubmitButton>
          </form>
        )}

        {/* ── Step 2: OTP code ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              We sent a 6-digit code to <strong style={{ color: '#fff' }}>{phone}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={labelStyle}>Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(null); }}
                required
                placeholder="123456"
                style={{ ...inputStyle(!!error), letterSpacing: '0.3em', fontSize: '1.25rem', textAlign: 'center' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
                onBlur={e  => (e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)')}
                autoFocus
              />
            </div>

            {error && <ErrorBox message={error} />}

            <SubmitButton disabled={submitting || otp.length < 6} loading={submitting}>
              Verify &amp; Sign In →
            </SubmitButton>

            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem',
                textAlign: 'center', padding: '0.25rem',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              Wrong number? Go back
            </button>
          </form>
        )}

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.2)',
        }}>
          Naneka Platform · Customer Access
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '8px',
      padding: '0.625rem 0.875rem',
      fontSize: '0.8125rem',
      color: '#FCA5A5',
    }}>
      {message}
    </div>
  );
}

function SubmitButton({ children, disabled, loading }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        marginTop: '0.5rem',
        background: disabled ? 'rgba(212,175,55,0.3)' : 'var(--c-gold)',
        color: disabled ? 'rgba(255,255,255,0.4)' : '#0F0F0F',
        border: 'none',
        borderRadius: '8px',
        padding: '0.875rem',
        fontSize: '0.875rem',
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: '100%',
      }}
    >
      {loading ? (
        <>
          <span className="spinner" style={{ width: '1rem', height: '1rem' }} />
          Please wait…
        </>
      ) : children}
    </button>
  );
}
