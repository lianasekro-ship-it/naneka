import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import { CartProvider }  from './context/CartContext.jsx';
import { AuthProvider }  from './context/AuthContext.jsx';
import ProtectedRoute    from './components/ProtectedRoute.jsx';
import CartDrawer        from './components/CartDrawer.jsx';
import CheckoutModal     from './components/CheckoutModal.jsx';

import Storefront        from './pages/Storefront.jsx';
import ProductDetail     from './pages/ProductDetail.jsx';
import CategoryPage      from './pages/CategoryPage.jsx';
import Checkout          from './pages/Checkout.jsx';
import OrderTracking     from './pages/OrderTracking.jsx';
import PaymentResult     from './pages/PaymentResult.jsx';
import OrderConfirmed    from './pages/OrderConfirmed.jsx';
import Login             from './pages/Login.jsx';
import CustomerLogin     from './pages/CustomerLogin.jsx';
import Terms             from './pages/Terms.jsx';
import Returns           from './pages/Returns.jsx';
import Privacy           from './pages/Privacy.jsx';
import About             from './pages/About.jsx';
import AdminDashboard    from './pages/AdminDashboard.jsx';
import SalesDashboard    from './pages/SalesDashboard.jsx';
import DriverApp         from './pages/DriverApp.jsx';
import StudioApp         from './pages/StudioApp.jsx';

function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', background: 'var(--c-bg)', color: 'var(--c-text)',
      padding: '2rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Page Not Found
      </p>
      <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <a href="/" className="btn btn-gold" style={{ padding: '0.75rem 2rem' }}>← Back to Storefront</a>
    </div>
  );
}

/* CartDrawer needs a checkout handler — we thread the modal through here */
function AppShell() {
  const [checkoutProduct, setCheckoutProduct] = useState(null);

  return (
    <>
      <CartDrawer onCheckout={setCheckoutProduct} />
      <Routes>
        {/* ── Public routes ─────────────────────────────────────────── */}
        <Route path="/"                        element={<Storefront />} />
        <Route path="/products/:id"            element={<ProductDetail />} />
        <Route path="/category/:slug"          element={<CategoryPage />} />
        <Route path="/checkout"                element={<Checkout />} />
        <Route path="/checkout/payment-result" element={<PaymentResult />} />
        <Route path="/order-confirmed"         element={<OrderConfirmed />} />
        <Route path="/track"                   element={<OrderTracking />} />
        <Route path="/orders/:orderId/track"   element={<OrderTracking />} />
        <Route path="/login"                   element={<Login />} />
        <Route path="/sign-in"                 element={<CustomerLogin />} />
        <Route path="/terms"                   element={<Terms />} />
        <Route path="/returns"                 element={<Returns />} />
        <Route path="/privacy"                 element={<Privacy />} />
        <Route path="/about"                   element={<About />} />

        {/* ── Protected routes (require Supabase auth) ─────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/sales" element={
          <ProtectedRoute><SalesDashboard /></ProtectedRoute>
        } />
        <Route path="/preparer" element={
          <ProtectedRoute><AdminDashboard defaultTab="preparer" /></ProtectedRoute>
        } />
        <Route path="/driver" element={
          <ProtectedRoute><DriverApp /></ProtectedRoute>
        } />
        <Route path="/studio" element={
          <ProtectedRoute><StudioApp /></ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {checkoutProduct && (
        <CheckoutModal product={checkoutProduct} onClose={() => setCheckoutProduct(null)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </AuthProvider>
  );
}
