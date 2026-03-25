import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps a route that requires authentication.
 * - Shows a spinner while the session is being resolved.
 * - Redirects to /login (with the original path saved) if unauthenticated.
 * - Renders children when authenticated.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0F0F0F',
      }}>
        <span className="spinner" style={{ width: '2rem', height: '2rem', color: 'var(--c-gold)' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
