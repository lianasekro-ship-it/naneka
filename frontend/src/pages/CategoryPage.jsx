import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { CATEGORIES, getCategoryBySlug, getProductsByCategory } from '../data/products.js';
import ProductCard from '../components/ProductCard.jsx';
import MegaSidebar from '../components/MegaSidebar.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';
import { NanekaLogo } from './Storefront.jsx';

function formatTZS(n) {
  return 'TZS\u00A0' + Number(n).toLocaleString('en-TZ');
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { add, setDrawerOpen } = useCart();

  const activeSub = searchParams.get('sub') ?? null;
  const category  = getCategoryBySlug(slug);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mobileCatOpen,   setMobileCatOpen]   = useState(false);
  const [toast,           setToast]           = useState(null);

  // If category doesn't exist, redirect to home
  useEffect(() => {
    if (!category) navigate('/', { replace: true });
  }, [category, navigate]);

  if (!category) return null;

  const allProducts = getProductsByCategory(slug);
  const products    = activeSub
    ? allProducts.filter(p => p.subcategory === activeSub)
    : allProducts;

  function handleAddToCart(product) {
    add(product);
    setToast(product.name);
    setTimeout(() => setToast(null), 2500);
    setDrawerOpen(true);
  }

  function handleBuyNow(product) {
    setSelectedProduct(product);
  }

  function handleSubClick(sub) {
    if (sub === activeSub) {
      setSearchParams({});
    } else {
      setSearchParams({ sub });
    }
  }

  function handleSidebarNav(catId, sub) {
    const url = sub
      ? `/category/${catId}?sub=${encodeURIComponent(sub)}`
      : `/category/${catId}`;
    navigate(url);
  }

  return (
    <>
      {/* Cart Drawer */}
      <CartDrawer onCheckout={setSelectedProduct} />

      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header className="page-header" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem', maxWidth: '1140px', margin: '0 auto', width: '100%' }}>
            <button
              className="flex md:hidden"
              onClick={() => setMobileCatOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'none' }}
              aria-label="Menu"
            >
              <span style={{ display: 'block', fontSize: '1.25rem' }}>☰</span>
            </button>
            <NanekaLogo />
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--c-text-muted)', flex: 1 }}>
              <Link to="/" style={{ color: 'var(--c-text-muted)', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--c-gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-muted)'}
              >Home</Link>
              <span style={{ opacity: 0.4 }}>›</span>
              <span style={{ color: 'var(--c-text)', fontWeight: 600 }}>{category.label}</span>
              {activeSub && (
                <>
                  <span style={{ opacity: 0.4 }}>›</span>
                  <span style={{ color: 'var(--c-gold)', fontWeight: 600 }}>{activeSub}</span>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Subcategory pills */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--c-border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', maxWidth: '1140px', margin: '0 auto', minWidth: 'max-content' }}>
            <button
              onClick={() => setSearchParams({})}
              style={{
                padding: '0.35rem 0.875rem', borderRadius: '999px', border: 'none',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-sans)',
                background: !activeSub ? 'var(--c-gold)' : 'var(--c-surface-2)',
                color: !activeSub ? '#fff' : 'var(--c-text-muted)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              All
            </button>
            {category.subs.map(sub => (
              <button
                key={sub}
                onClick={() => handleSubClick(sub)}
                style={{
                  padding: '0.35rem 0.875rem', borderRadius: '999px', border: 'none',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-sans)',
                  background: activeSub === sub ? 'var(--c-gold)' : 'var(--c-surface-2)',
                  color: activeSub === sub ? '#fff' : 'var(--c-text-muted)',
                  whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s',
                }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar + grid */}
        <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
          <MegaSidebar
            onNavigate={handleSidebarNav}
            drawerOpen={mobileCatOpen}
            onOpenDrawer={() => setMobileCatOpen(true)}
            onCloseDrawer={() => setMobileCatOpen(false)}
          />

          <main style={{ flex: 1, minWidth: 0, padding: '1.5rem', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
            {/* Section heading */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--c-text)', margin: 0 }}>
                {category.icon} {activeSub ?? category.label}
              </h1>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-muted)' }}>
                {products.length} product{products.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Product grid */}
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--c-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', color: 'var(--c-text)', marginBottom: '0.375rem', fontWeight: 700 }}>
                  No products yet
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  We're adding {activeSub ?? category.label} products soon. Browse other categories in the meantime.
                </p>
                <button onClick={() => navigate('/')} className="btn btn-gold" style={{ padding: '0.75rem 2rem' }}>
                  Back to Storefront
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.25rem',
              }}>
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onBuyNow={handleBuyNow}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 'calc(90px + env(safe-area-inset-bottom))', left: '50%',
          transform: 'translateX(-50%)', background: '#1A1A1A', color: '#fff',
          padding: '0.625rem 1.25rem', borderRadius: 'var(--radius)', fontSize: '0.875rem',
          fontWeight: 600, zIndex: 600, whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)',
          animation: 'fadeIn 0.2s ease',
        }}>
          ✓ Added to cart
        </div>
      )}

      {/* Checkout modal */}
      {selectedProduct && (
        <CheckoutModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  );
}
