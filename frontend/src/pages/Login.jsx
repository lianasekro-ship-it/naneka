import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname ?? '/admin';

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState(null);
  const [showPass,    setShowPass]    = useState(false);

  // Already logged in — send straight through
  if (!loading && user) return <Navigate to={from} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0F0F0F 0%, #1A1A1A 100%)',
      padding: '1.5rem',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#1A1A1A',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
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
            Admin Access
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent)',
          marginBottom: '2rem',
        }} />

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              required
              placeholder="you@example.com"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                width: '100%',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
              onBlur={e  => (e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                required
                placeholder="••••••••"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  padding: '0.75rem 3rem 0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
                onBlur={e  => (e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)')}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', padding: '0.25rem',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '0.625rem 0.875rem',
              fontSize: '0.8125rem',
              color: '#FCA5A5',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !email || !password}
            style={{
              marginTop: '0.5rem',
              background: submitting || !email || !password
                ? 'rgba(212,175,55,0.3)'
                : 'var(--c-gold)',
              color: submitting || !email || !password ? 'rgba(255,255,255,0.4)' : '#0F0F0F',
              border: 'none',
              borderRadius: '8px',
              padding: '0.875rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: submitting || !email || !password ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ width: '1rem', height: '1rem' }} />
                Signing in…
              </>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.2)',
        }}>
          Naneka Platform · Staff only
        </div>
      </div>
    </div>
  );
}
