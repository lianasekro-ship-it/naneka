import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Storefront from './pages/Storefront.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import SalesDashboard from './pages/SalesDashboard.jsx';
import DriverApp from './pages/DriverApp.jsx';
import StudioApp from './pages/StudioApp.jsx';
import PaymentResult from './pages/PaymentResult.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import { useState } from 'react';

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
        <Route path="/"                        element={<Storefront />} />
        <Route path="/products/:id"            element={<ProductDetail />} />
        <Route path="/checkout"                element={<Checkout />} />
        <Route path="/track"                   element={<OrderTracking />} />
        <Route path="/orders/:orderId/track"   element={<OrderTracking />} />
        <Route path="/admin"                   element={<AdminDashboard />} />
        <Route path="/admin/sales"             element={<SalesDashboard />} />
        <Route path="/driver"                  element={<DriverApp />} />
        <Route path="/studio"                  element={<StudioApp />} />
        <Route path="/checkout/payment-result" element={<PaymentResult />} />
        <Route path="*"                        element={<NotFound />} />
      </Routes>
      {checkoutProduct && (
        <CheckoutModal product={checkoutProduct} onClose={() => setCheckoutProduct(null)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  );
}
