import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', background: '#0f0f0f', color: '#f5f5f5',
          padding: '2rem', boxSizing: 'border-box',
        }}>
          <div style={{
            maxWidth: '760px', width: '100%',
            border: '1px solid rgba(255,60,60,0.4)',
            borderRadius: '8px', background: '#1a1a1a',
            padding: '2rem',
          }}>
            <div style={{ color: '#ff6b6b', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Application Error
            </div>
            <div style={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '1rem' }}>
              {this.state.error.message}
            </div>
            <pre style={{
              fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '1rem', margin: 0,
            }}>
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem', padding: '0.6rem 1.5rem',
                background: '#D4AF37', color: '#1a1a1a',
                border: 'none', borderRadius: '6px',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
