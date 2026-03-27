import { useState, useCallback, useRef, useEffect, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PRODUCTS, BEST_SELLERS, NEW_ARRIVALS, BULK_DEALS, MADE_IN_TZ, CATEGORIES } from '../data/products.js';
import ProductCard from '../components/ProductCard.jsx';
import MegaSidebar from '../components/MegaSidebar.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';

/* ─── Main Page ───────────────────────────────────────────────────────────── */
// Resolves which products to show for a dynamic section.
// Priority: products already resolved by the backend API, then local catalogue fallback.
function resolveSectionProducts(section, hiddenIds) {
  const vis = (arr) => (arr ?? []).filter(p => !hiddenIds.has(String(p.id)));

  // Backend pre-resolves products into section.products — use them when available.
  if (Array.isArray(section.products) && section.products.length > 0) {
    return vis(section.products);
  }

  // Local fallback (used when API is unavailable or section has no DB products yet).
  // Also handles the algorithmic_rule.category_slug field from the backend schema.
  const rule      = section.algorithmic_rule ?? {};
  const ruleType  = section.rule_type ?? rule.rule_type ?? '';
  const ruleValue = section.rule_value ?? rule.category_slug ?? '';

  switch (ruleType) {
    case 'best_sellers': return vis(BEST_SELLERS);
    case 'new_arrivals': return vis(NEW_ARRIVALS);
    case 'made_in_tz':   return vis(MADE_IN_TZ);
    case 'bulk_deals':   return vis(BULK_DEALS);
    case 'category':
      return vis(PRODUCTS).filter(p => p.category?.toLowerCase() === ruleValue.toLowerCase());
    default:
      return vis(PRODUCTS).slice(0, 12);
  }
}

export default function Storefront() {
  const { add, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [recentlyViewed,   setRecentlyViewed]   = useState([]);
  const [toast,            setToast]            = useState(null);
  const [dynamicSections,  setDynamicSections]  = useState(null); // null → use static fallback
  const [hiddenIds,        setHiddenIds]        = useState(new Set());
  const [apiProducts,      setApiProducts]      = useState(null);  // null = loading, [] = empty
  // Shared state for the mobile category drawer — controlled here so that
  // both the SiteHeader hamburger and the MobileBottomNav Categories button
  // open the exact same drawer.
  const [mobileCatOpen, setMobileCatOpen] = useState(false);

  // Fetch active sections and product visibility from API (silently falls back if unavailable)
  useEffect(() => {
    api.get('/api/v1/site-sections')
      .then(({ data }) => { if (data.sections?.length) setDynamicSections(data.sections); })
      .catch(() => {});

    api.get('/api/v1/products?limit=500')
      .then(({ data }) => {
        const raw = data.products ?? [];
        // Build hidden-id set for visibility filtering
        const hidden = new Set(raw.filter(p => p.is_visible === false).map(p => String(p.id)));
        setHiddenIds(hidden);
        // Normalize API fields → what ProductCard expects
        const normalized = raw
          .filter(p => p.is_active !== false)
          .map(p => ({
            ...p,
            // ProductCard reads product.images?.[0] or product.image
            images: p.gallery?.length ? p.gallery : (p.image_url ? [p.image_url] : []),
            // ProductCard reads product.stock for stock indicator
            stock: p.stock_qty ?? 0,
          }));
        setApiProducts(normalized);
      })
      .catch(() => { setApiProducts([]); });
  }, []);

  const trackViewed = useCallback((product) => {
    setRecentlyViewed(prev => [product, ...prev.filter(p => p.id !== product.id)].slice(0, 8));
  }, []);

  const addToCart = useCallback((product) => {
    add(product);
    trackViewed(product);
    setToast(product.name);
    setTimeout(() => setToast(null), 2500);
    setDrawerOpen(true);
  }, [add, trackViewed, setDrawerOpen]);

  const buyNow = useCallback((product) => {
    if (!user) {
      navigate('/sign-in', { state: { from: { pathname: '/' } } });
      return;
    }
    trackViewed(product);
    setSelectedProduct(product);
  }, [user, navigate, trackViewed]);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleSidebarNav(catId, sub) {
    const url = sub
      ? `/category/${catId}?sub=${encodeURIComponent(sub)}`
      : `/category/${catId}`;
    navigate(url);
  }

  const cardProps = { onBuyNow: buyNow, onAddToCart: addToCart };
  const vis = (arr) => (arr ?? []).filter(p => !hiddenIds.has(String(p.id)));

  return (
    <>
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <TopUtilityBar />
        <SiteHeader onOpenCategories={() => setMobileCatOpen(true)} />
        <CategoryMegaBar />

        {/* Sidebar + content wrapper */}
        <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
          <MegaSidebar
            onNavigate={handleSidebarNav}
            drawerOpen={mobileCatOpen}
            onOpenDrawer={() => setMobileCatOpen(true)}
            onCloseDrawer={() => setMobileCatOpen(false)}
          />

          {/* Extra bottom padding keeps the last row of cards above the fixed bottom nav */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
            <HeroSection onShopNow={() => scrollTo('best-sellers')} onBulk={() => scrollTo('bulk-deals')} />

            {/* Dynamic sections from API, or static fallback.
                ShopByCategorySection is interleaved after the 1st carousel.
                BrandScrollerSection is interleaved after the 2nd carousel. */}
            {dynamicSections ? (
              dynamicSections.map((section, i) => {
                const products = resolveSectionProducts(section, hiddenIds);
                if (!products.length) return null;
                let carousel;
                if (section.rule_type === 'made_in_tz') {
                  carousel = <MadeInTanzaniaSection id={`section-${section.id}`} products={products} {...cardProps} />;
                } else if (section.rule_type === 'bulk_deals') {
                  carousel = <BulkDealsCarousel id={`section-${section.id}`} products={products} {...cardProps} />;
                } else {
                  carousel = (
                    <ProductCarousel
                      id={`section-${section.id}`}
                      title={section.title}
                      products={products}
                      bg={i % 2 === 1 ? '#F8F6F0' : undefined}
                      {...cardProps}
                    />
                  );
                }
                return (
                  <Fragment key={section.id}>
                    {i === 1 && <ShopByCategorySection />}
                    {i === 2 && <BrandScrollerSection />}
                    {carousel}
                  </Fragment>
                );
              })
            ) : (
              <>
                <ProductCarousel id="best-sellers" eyebrow="Kariakoo Market Picks" title="Best Sellers" titleAccent="This Week" products={vis(BEST_SELLERS)} {...cardProps} />
                <ShopByCategorySection />
                <ProductCarousel id="new-arrivals" eyebrow="Just Landed" title="New" titleAccent="Arrivals" products={vis(NEW_ARRIVALS)} bg="#F8F6F0" {...cardProps} />
                <BrandScrollerSection />
                <MadeInTanzaniaSection id="made-in-tz" products={vis(MADE_IN_TZ)} {...cardProps} />
                <BulkDealsCarousel id="bulk-deals" products={vis(BULK_DEALS)} {...cardProps} />
              </>
            )}

            {recentlyViewed.length > 0 && (
              <ProductCarousel id="recently-viewed" eyebrow="Your History" title="Recently" titleAccent="Viewed" products={recentlyViewed} bg="#F8F6F0" {...cardProps} />
            )}

            <AllProductsGrid
              products={apiProducts}
              loading={apiProducts === null}
              {...cardProps}
            />

            <TrustSection />
          </div>
        </div>

        <SiteFooter />
      </div>

      {/* Add-to-cart toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: '#1A1A1A', color: '#fff', borderRadius: 'var(--radius)',
          padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)', zIndex: 300,
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          animation: 'fadeIn 0.2s ease', border: '1px solid rgba(212,175,55,0.25)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: 'var(--c-gold)' }}>✓</span>
          Added to cart: <strong>{toast}</strong>
        </div>
      )}

      {selectedProduct && (
        <CheckoutModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  );
}

/* ─── Top Utility Bar ─────────────────────────────────────────────────────── */
function TopUtilityBar() {
  return (
    <div style={{ background: '#1A1A1A', borderBottom: '1px solid rgba(212,175,55,0.12)', padding: '0.4rem 1.5rem' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
        <span>
          <span style={{ color: 'var(--c-gold)', marginRight: '0.375rem' }}>📍</span>
          Delivering to: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Dar es Salaam</strong>
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[['/track', 'Track Order']].map(([h, l]) => (
            <a key={l} href={h} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Live Search Bar ──────────────────────────────────────────────────────── */
function LiveSearchBar() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const [busy,    setBusy]    = useState(false);
  const containerRef          = useRef(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/v1/products/search?q=${encodeURIComponent(query.trim())}&limit=8`);
        setResults(data.products ?? data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={containerRef} style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--c-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#FAFAF7' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search stoves, pots, tools, electricals…"
          style={{ flex: 1, padding: '0.625rem 1rem', border: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--c-text)', outline: 'none' }}
        />
        <div style={{ padding: '0.625rem 1rem', background: 'var(--c-gold)', display: 'flex', alignItems: 'center', color: '#fff', fontSize: '0.9rem', minWidth: '40px', justifyContent: 'center' }}>
          {busy ? <span style={{ display: 'inline-block', animation: 'spin 0.6s linear infinite' }}>⟳</span> : '🔍'}
        </div>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--c-border)',
          borderRadius: 'var(--radius)', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          zIndex: 500, overflow: 'hidden',
        }}>
          {results.map((p, i) => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 1rem',
                borderBottom: i < results.length - 1 ? '1px solid var(--c-border)' : 'none',
                textDecoration: 'none', color: 'var(--c-text)',
                background: 'transparent', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF7')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {(p.image_url ?? p.images?.[0]) ? (
                <img src={p.image_url ?? p.images?.[0]} alt="" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#F5F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  {p.emoji ?? '📦'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)', marginTop: '0.1rem' }}>{p.category_name ?? p.category}</div>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--c-gold)', flexShrink: 0 }}>
                TZS {Number(p.price).toLocaleString('en-TZ')}
              </div>
            </Link>
          ))}
          <div style={{ padding: '0.6rem 1rem', background: '#FAFAF7', borderTop: '1px solid var(--c-border)', textAlign: 'center' }}>
            <a href={`/?q=${encodeURIComponent(query)}`} style={{ fontSize: '0.78rem', color: 'var(--c-gold)', fontWeight: 600, textDecoration: 'none' }}>
              See all results for "{query}" →
            </a>
          </div>
        </div>
      )}
      {open && results.length === 0 && !busy && query.trim().length >= 1 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--c-border)',
          borderRadius: 'var(--radius)', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          zIndex: 500, padding: '1rem', textAlign: 'center',
          fontSize: '0.85rem', color: 'var(--c-text-muted)',
        }}>
          No products found for "{query}"
        </div>
      )}
    </div>
  );
}

/* ─── Main Header ─────────────────────────────────────────────────────────── */
function SiteHeader({ onOpenCategories }) {
  const { count, setDrawerOpen } = useCart();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="page-header" style={{ borderBottom: '1px solid var(--c-border)' }}>
      {/* ── Single compact row: Hamburger | Logo | Search | Cart ── */}
      <div className="flex items-center gap-2 px-3 py-2 md:px-6 md:py-3 md:gap-4 max-w-[1140px] mx-auto w-full">

        {/* Hamburger — mobile only, calls the shared state lifted to Storefront */}
        <button
          className="flex md:hidden flex-col justify-center items-center gap-[5px] p-1.5 rounded shrink-0"
          aria-label="Menu"
          onClick={onOpenCategories}
        >
          <span className="block w-5 h-[2px] bg-[#1A1A1A]" />
          <span className="block w-5 h-[2px] bg-[#1A1A1A]" />
          <span className="block w-5 h-[2px] bg-[#1A1A1A]" />
        </button>

        {/* Logo — always visible */}
        <div className="shrink-0">
          <NanekaLogo />
        </div>

        {/* Search — full width on md+, collapsed icon on mobile */}
        <div className="hidden md:flex flex-1">
          <LiveSearchBar />
        </div>
        <button
          className="flex md:hidden items-center justify-center p-1.5 shrink-0"
          aria-label="Search"
          onClick={() => setMobileSearchOpen(v => !v)}
        >
          <span className="text-xl">🔍</span>
        </button>

        {/* Cart — always visible */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative flex flex-col items-center gap-0.5 p-1 shrink-0"
          aria-label="Cart"
        >
          <span className="text-2xl leading-none">🛒</span>
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white"
              style={{ background: 'var(--c-gold)', fontSize: '0.6rem' }}>
              {count > 9 ? '9+' : count}
            </span>
          )}
          <span className="text-[10px] font-semibold tracking-wide hidden md:block" style={{ color: 'var(--c-text-muted)' }}>Cart</span>
        </button>
      </div>

      {/* Mobile search row — slides in below the main bar */}
      {mobileSearchOpen && (
        <div className="flex md:hidden px-3 pb-2">
          <LiveSearchBar />
        </div>
      )}
    </header>
  );
}

/* ─── Category Mega Bar ───────────────────────────────────────────────────── */
function CategoryMegaBar() {
  const navigate = useNavigate();
  const cats = [
    { icon: '📺', label: 'Electronics',          slug: 'electronics'  },
    { icon: '👗', label: 'Women, Kids & Men',    slug: 'clothing'     },
    { icon: '🍳', label: 'Kitchen & Home',       slug: 'kitchen'      },
    { icon: '⌚', label: 'Watches & Bags',       slug: 'watches'      },
    { icon: '🛋️', label: 'Furniture',            slug: 'furniture'    },
    { icon: '🇹🇿', label: 'Made in Tanzania',    slug: 'made-in-tz'   },
    { icon: '📱', label: 'Phones & Accessories', slug: 'phones'       },
  ];
  return (
    <nav style={{ background: '#fff', borderBottom: '2px solid #F0EDE5', overflowX: 'auto', scrollbarWidth: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 'max-content', margin: '0 auto', maxWidth: '1140px', padding: '0 1.5rem' }}>
        {cats.map(({ icon, label, slug }) => (
          <button key={slug} onClick={() => navigate(`/category/${slug}`)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 1.25rem', border: 'none', borderBottom: '2px solid transparent',
            background: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
            color: 'var(--c-text-muted)', letterSpacing: '0.02em', whiteSpace: 'nowrap',
            transition: 'color 0.15s, border-color 0.15s', marginBottom: '-2px',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-gold)'; e.currentTarget.style.borderBottomColor = 'var(--c-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-text-muted)'; e.currentTarget.style.borderBottomColor = 'transparent'; }}
          >
            <span style={{ fontSize: '1rem' }}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
function HeroSection({ onShopNow, onBulk }) {
  return (
    <section style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #242424 55%, #1A1A1A 100%)', padding: 'clamp(4rem, 9vw, 7rem) 2rem', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: '-140px', right: '-80px', width: '520px', height: '520px', background: 'radial-gradient(circle, rgba(212,175,55,0.13) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(212,175,55,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.035) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2.5rem', alignItems: 'center', maxWidth: '900px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '999px', padding: '0.3rem 0.875rem', marginBottom: '1.75rem', background: 'rgba(212,175,55,0.07)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c-gold)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Kariakoo's #1 Online Store · Now Delivering</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: '1.25rem', maxWidth: '540px' }}>
            Everything for Your<br /><span style={{ color: 'var(--c-gold)' }}>Kitchen &amp; Beyond.</span>
          </h1>
          <div style={{ width: '52px', height: '2px', background: 'linear-gradient(90deg, var(--c-gold), transparent)', marginBottom: '1.5rem' }} />
          <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', color: 'rgba(255,255,255,0.6)', maxWidth: '420px', lineHeight: 1.75, fontWeight: 300, marginBottom: '2rem' }}>
            Stoves, pots, tools, electricals &amp; safety gear — Kariakoo quality, same-day delivery.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-gold" onClick={onShopNow} style={{ padding: '0.875rem 2.25rem' }}>Shop Best Sellers</button>
            <button onClick={onBulk} style={{ padding: '0.875rem 2.25rem', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 'var(--radius-sm)', background: 'transparent', color: '#fff', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.color = 'var(--c-gold)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff'; }}>
              Bulk Buy Deals
            </button>
          </div>
        </div>

        {/* Stats panel */}
        <div className="hero-stats" style={{ display: 'flex', flexDirection: 'column', gap: '0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: '160px' }}>
          {[['500+', 'Orders'], ['4.9 ★', 'Rating'], ['TZS 3,500', 'Delivery'], ['< 4 hrs', 'Avg Time']].map(([v, l], i, arr) => (
            <div key={l} style={{ textAlign: 'center', padding: '1rem 1.375rem', borderBottom: i < arr.length - 1 ? '1px solid rgba(212,175,55,0.1)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-gold)' }}>{v}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Compact Product Card (for carousels) ───────────────────────────────── */
function CompactProductCard({ product, onBuyNow, onAddToCart }) {
  const navigate             = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  // Support both API (image_url) and local mock (images[]) field shapes
  const imgSrc                = product.image_url ?? product.images?.[0];
  const price                 = Number(product.price ?? 0);
  const marketPrice           = product.market_price != null ? Number(product.market_price) : (product.marketPrice ?? null);
  const stockQty              = product.stock_qty ?? product.stock;
  const showImg               = imgSrc && !imgErr;

  return (
    <article
      onClick={() => navigate(`/products/${product.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '190px', flexShrink: 0, background: '#fff',
        borderRadius: 'var(--radius)',
        border: `1px solid ${hovered ? 'var(--c-border-hover)' : 'var(--c-border)'}`,
        overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        boxShadow: hovered ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Image */}
      <div style={{ height: '148px', background: showImg ? '#F5F2E8' : 'linear-gradient(145deg,#FBF8EE,#F5EFD6)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {showImg ? (
          <img src={imgSrc} alt={product.name} onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s', transform: hovered ? 'scale(1.07)' : 'scale(1)' }} />
        ) : (
          <span style={{ fontSize: '3rem', lineHeight: 1 }}>{product.emoji ?? '📦'}</span>
        )}
        {showImg && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,26,0.28) 0%, transparent 50%)', pointerEvents: 'none' }} />}
        {product.badge && (
          <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: product.madeInTanzania ? '#1B5E20' : 'var(--c-gold)', color: '#fff', fontSize: '0.55rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em', zIndex: 1 }}>
            {product.badge}
          </span>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(26,26,26,0.72)', padding: '0.4rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 600, color: 'var(--c-gold)', letterSpacing: '0.06em', textTransform: 'uppercase', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          View Details →
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0.75rem 0.875rem 0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {product.brand && (
          <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--c-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {product.brand}
          </div>
        )}
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.name}
        </div>
        <div style={{ marginTop: '0.35rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-gold)' }}>
            TZS {price.toLocaleString('en-TZ')}
          </div>
          {marketPrice != null && marketPrice > price && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--c-text-dim)', textDecoration: 'line-through' }}>
                TZS {marketPrice.toLocaleString('en-TZ')}
              </span>
              <span style={{ fontSize: '0.6rem', color: '#4ADE80', fontWeight: 700 }}>
                -{Math.round(((marketPrice - price) / marketPrice) * 100)}%
              </span>
            </div>
          )}
        </div>
        {stockQty !== undefined && stockQty !== null && (
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: stockQty > 10 ? 'var(--c-success)' : stockQty > 0 ? 'var(--c-warning)' : 'var(--c-error)', marginBottom: '0.25rem' }}>
            {stockQty > 10 ? '✓ In Stock' : stockQty > 0 ? `⚠ ${stockQty} left` : '✕ Out of Stock'}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.375rem', marginTop: 'auto' }}>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart?.(product); }}
            style={{ flex: 1, padding: '0.45rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', border: '1.5px solid var(--c-border-hover)', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--c-text)', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1A1A1A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.borderColor = 'var(--c-border-hover)'; }}
          >
            🛒 Cart
          </button>
          <button
            className="btn btn-gold"
            onClick={e => { e.stopPropagation(); onBuyNow?.(product); }}
            style={{ padding: '0.45rem 0.65rem', fontSize: '0.65rem', flexShrink: 0 }}
          >
            Buy
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Arrow Button ────────────────────────────────────────────────────────── */
function CarouselArrow({ dir, onClick, inv }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={dir === -1 ? 'Scroll left' : 'Scroll right'}
      style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${inv ? 'rgba(212,175,55,0.4)' : 'var(--c-border)'}`,
        background: hov ? (inv ? 'rgba(212,175,55,0.18)' : '#F5F2E8') : 'transparent',
        color: inv ? 'var(--c-gold)' : 'var(--c-text)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', transition: 'all 0.15s',
      }}
    >
      {dir === -1 ? '‹' : '›'}
    </button>
  );
}

/* ─── Product Carousel Row ────────────────────────────────────────────────── */
function ProductCarousel({ id, eyebrow, title, titleAccent, products, onBuyNow, onAddToCart, bg }) {
  const scrollRef = useRef(null);
  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 620, behavior: 'smooth' });
  }
  return (
    <section id={id} style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0 clamp(2.5rem, 5vw, 4rem) 2rem', background: bg ?? '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingRight: '2rem', marginBottom: '1.5rem' }}>
        <RowHeader eyebrow={eyebrow} title={title} titleAccent={titleAccent} />
        <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.75rem' }}>
          <CarouselArrow dir={-1} onClick={() => scroll(-1)} />
          <CarouselArrow dir={1}  onClick={() => scroll(1)} />
        </div>
      </div>
      <div
        ref={scrollRef}
        style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingRight: '2rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {(products ?? []).map(p => <CompactProductCard key={p.id} product={p} onBuyNow={onBuyNow} onAddToCart={onAddToCart} />)}
      </div>
    </section>
  );
}

/* ─── Category emoji lookup ───────────────────────────────────────────────── */
const CAT_EMOJI_MAP = {
  electronics: '📺', phone: '📱', mobile: '📱', fashion: '👗', cloth: '👗',
  kitchen: '🍳', cook: '🍳', watch: '⌚', furniture: '🛋️', sofa: '🛋️',
  tanzania: '🇹🇿', 'made-in': '🇹🇿', beauty: '💄', cosmetic: '💄',
  bag: '🎒', luggage: '🎒', toy: '🧸', kid: '🧸', sport: '⚽', fitness: '⚽',
  tool: '🔧', hardware: '🔧', electric: '🔌', appliance: '🔌',
};
function catEmoji(name = '', slug = '') {
  const key = (slug + ' ' + name).toLowerCase();
  for (const [k, v] of Object.entries(CAT_EMOJI_MAP)) {
    if (key.includes(k)) return v;
  }
  return '🏷️';
}
function catSection(slug = '') {
  if (slug.includes('made') || slug.includes('tz')) return 'made-in-tz';
  if (slug.includes('bulk') || slug.includes('furniture')) return 'bulk-deals';
  if (slug.includes('new') || slug.includes('electron') || slug.includes('phone')) return 'new-arrivals';
  return 'best-sellers';
}

/* ─── Shop by Category (horizontal icon slider) ──────────────────────────── */
function ShopByCategorySection() {
  const navigate  = useNavigate();
  const scrollRef = useRef(null);
  const [cats, setCats] = useState([]);

  // Build local fallback from the static CATEGORIES array
  function buildLocalCats() {
    return CATEGORIES.map(c => ({ icon: c.icon, imageUrl: null, label: c.label, slug: c.id }));
  }

  useEffect(() => {
    api.get('/api/v1/categories/tree')
      .then(({ data }) => {
        const raw = data.categories ?? data;
        if (Array.isArray(raw) && raw.length > 0) {
          setCats(raw.map(c => ({
            icon:     catEmoji(c.name, c.slug),
            imageUrl: c.image_url ?? c.imageUrl ?? null,
            label:    c.name,
            slug:     c.slug,
          })));
        } else {
          setCats(buildLocalCats());
        }
      })
      .catch(() => setCats(buildLocalCats()));
  }, []);

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });
  }

  // Immediately render local cats while API loads (no more "wait and hide")
  const displayCats = cats.length > 0 ? cats : buildLocalCats();

  return (
    <section id="categories" style={{ padding: '1.5rem 0 1.5rem 2rem', background: '#fff', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '2rem', marginBottom: '1rem' }}>
        <RowHeader eyebrow="Browse Everything" title="Shop by" titleAccent="Category" />
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <CarouselArrow dir={-1} onClick={() => scroll(-1)} />
          <CarouselArrow dir={1}  onClick={() => scroll(1)}  />
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingRight: '2rem', paddingBottom: '0.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {displayCats.map(cat => (
          <button key={cat.slug ?? cat.label} onClick={() => navigate(`/category/${cat.slug}`)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'transform 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #FBF8EE 0%, #F5EFD6 100%)', border: '2px solid rgba(212,175,55,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.625rem', boxShadow: '0 2px 10px rgba(212,175,55,0.10)', transition: 'border-color 0.18s, box-shadow 0.18s', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(212,175,55,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.22)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(212,175,55,0.10)'; }}>
              {cat.imageUrl
                ? <img src={cat.imageUrl} alt={cat.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : cat.icon}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--c-text)', textAlign: 'center', maxWidth: '68px', lineHeight: 1.25 }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── Made in Tanzania Section (carousel) ────────────────────────────────── */
function MadeInTanzaniaSection({ id, products, onBuyNow, onAddToCart }) {
  const scrollRef = useRef(null);
  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 620, behavior: 'smooth' });
  }
  return (
    <section id={id} style={{ background: 'linear-gradient(160deg, #0D3B17 0%, #1B5E20 60%, #0D3B17 100%)', padding: '1.5rem 0 1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '2rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🇹🇿</span>
          <div>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F5C518', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>Proudly Tanzanian</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.1rem, 2.5vw, 1.375rem)', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Made in <span style={{ color: '#F5C518' }}>Tanzania</span>
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <CarouselArrow dir={-1} onClick={() => scroll(-1)} inv />
          <CarouselArrow dir={1}  onClick={() => scroll(1)}  inv />
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingRight: '2rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(products ?? []).map(p => <CompactProductCard key={p.id} product={p} onBuyNow={onBuyNow} onAddToCart={onAddToCart} />)}
      </div>
    </section>
  );
}

/* ─── Brand Logo Scroller (live from API) ─────────────────────────────────── */
function BrandScrollerSection() {
  const [brands, setBrands] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/api/v1/brands')
      .then(({ data }) => {
        const raw = data.brands ?? data ?? [];
        if (Array.isArray(raw)) setBrands(raw);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Don't render until API responded, and don't render if empty
  if (!loaded || brands.length === 0) return null;

  return (
    <section style={{ background: '#F8F6F0', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)', padding: '2rem 0', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem', padding: '0 1.5rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Top Brands</p>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.015em', margin: 0 }}>
          Shop by <span style={{ color: 'var(--c-gold)' }}>Brand</span>
        </h3>
      </div>
      <div style={{ display: 'flex', overflow: 'hidden' }}>
        <div className="brand-scroller-track" style={{ display: 'flex', gap: '1.5rem', animation: 'scroll-brands 28s linear infinite', width: 'max-content', padding: '0 1rem' }}>
          {[...brands, ...brands].map((b, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: '72px', cursor: 'pointer', opacity: 0.75, transition: 'opacity 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ width: '56px', height: '56px', background: '#fff', borderRadius: '12px', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                {(b.logo_url ?? b.logoUrl)
                  ? <img src={b.logo_url ?? b.logoUrl} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                  : (b.emoji ?? '🏷️')}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--c-text-muted)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Bulk Buy Deals Carousel ─────────────────────────────────────────────── */
function BulkDealsCarousel({ id, products, onBuyNow, onAddToCart }) {
  const scrollRef = useRef(null);
  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 620, behavior: 'smooth' });
  }
  return (
    <section id={id} style={{ padding: 'clamp(3rem, 6vw, 5rem) 0 clamp(3rem, 6vw, 5rem) 2rem', background: '#1A1A1A' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingRight: '2rem', marginBottom: '2rem' }}>
        <RowHeader eyebrow="Wholesale Prices" title="Bulk Buy" titleAccent="Deals" inv />
        <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.75rem' }}>
          <CarouselArrow dir={-1} onClick={() => scroll(-1)} inv />
          <CarouselArrow dir={1}  onClick={() => scroll(1)}  inv />
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingRight: '2rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(products ?? []).map(p => <BulkDealCard key={p.id} product={p} onBuyNow={onBuyNow} onAddToCart={onAddToCart} />)}
      </div>
    </section>
  );
}

function BulkDealCard({ product, onBuyNow, onAddToCart }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '280px', flexShrink: 0, background: hov ? '#222' : '#1F1F1F', border: `1px solid ${hov ? 'rgba(212,175,55,0.45)' : 'rgba(212,175,55,0.18)'}`, borderRadius: 'var(--radius-lg)', padding: '1.75rem', transition: 'all 0.2s', transform: hov ? 'translateY(-3px)' : 'none' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.875rem' }}>{product.emoji ?? '📦'}</div>
      <span style={{ display: 'inline-block', background: 'var(--c-gold)', color: '#1A1A1A', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '999px', marginBottom: '0.75rem' }}>{product.badge}</span>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: '0.625rem' }}>{product.name}</h3>
      <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '1.25rem' }}>{product.description}</p>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-gold)' }}>TZS&nbsp;{(product.price ?? 0).toLocaleString('en-TZ')}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem' }}>Save TZS&nbsp;{(product.bulkSaving ?? 0).toLocaleString('en-TZ')} · {product.bulkQty} units</div>
      </div>
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <button className="btn btn-gold" onClick={() => onBuyNow(product)} style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem' }}>Order Now</button>
        <button onClick={() => onAddToCart(product)}
          style={{ padding: '0.65rem 1rem', border: '1.5px solid rgba(212,175,55,0.35)', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--c-gold)', cursor: 'pointer', fontSize: '1rem', transition: 'border-color 0.18s, background 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'; e.currentTarget.style.background = 'transparent'; }}
          title="Add to cart">🛒</button>
      </div>
    </div>
  );
}

/* ─── Skeleton Card ───────────────────────────────────────────────────────── */
function ProductCardSkeleton() {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius)',
      border: '1px solid var(--c-border)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      animation: 'skeletonPulse 1.4s ease-in-out infinite',
    }}>
      <div style={{ height: '185px', background: '#F0EDE4' }} />
      <div style={{ padding: '1rem 1.125rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ height: '10px', width: '38%', background: '#EAE6DA', borderRadius: '4px' }} />
        <div style={{ height: '16px', width: '78%', background: '#EAE6DA', borderRadius: '4px' }} />
        <div style={{ height: '11px', width: '100%', background: '#EAE6DA', borderRadius: '4px' }} />
        <div style={{ height: '11px', width: '60%', background: '#EAE6DA', borderRadius: '4px' }} />
        <div style={{ height: '20px', width: '52%', background: '#EAE6DA', borderRadius: '4px', marginTop: '0.4rem' }} />
        <div style={{ height: '36px', width: '100%', background: '#EAE6DA', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }} />
      </div>
    </div>
  );
}

/* ─── All Products Grid ────────────────────────────────────────────────────── */
function AllProductsGrid({ products, loading, onBuyNow, onAddToCart }) {
  const skeletons = Array.from({ length: 8 });
  return (
    <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 2rem', background: '#FAFAF7', borderTop: '1px solid var(--c-border)' }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        <RowHeader eyebrow="Bidhaa Zetu" title="Bidhaa" titleAccent="Zote" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}>
          {loading
            ? skeletons.map((_, i) => <ProductCardSkeleton key={i} />)
            : (products ?? []).map(p => (
                <ProductCard key={p.id} product={p} onBuyNow={onBuyNow} onAddToCart={onAddToCart} />
              ))
          }
        </div>
        {!loading && (products ?? []).length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--c-text-muted)', padding: '3rem 0', fontSize: '0.9rem' }}>
            Hakuna bidhaa kwa sasa. Rudi baadaye.
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── Trust Strip ─────────────────────────────────────────────────────────── */
function TrustSection() {
  const items = [
    { icon: '📍', title: 'Dar es Salaam',     body: 'Kariakoo · Masaki · Kinondoni · Kigamboni' },
    { icon: '⚡', title: 'Same-Day Delivery',  body: 'Order by 2 PM, delivered today'            },
    { icon: '🔒', title: 'Secure Payments',    body: 'M-Pesa · Tigo Pesa · Airtel · Card'        },
    { icon: '📦', title: 'Live GPS Tracking',  body: 'Watch your order arrive in real time'       },
  ];
  return (
    <section style={{ background: '#F8F6F0', borderTop: '1px solid var(--c-border)', padding: 'clamp(2.5rem, 5vw, 4rem) 2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', maxWidth: '1140px', margin: '0 auto' }}>
        {items.map(item => (
          <div key={item.title} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.875rem', marginBottom: '0.625rem' }}>{item.icon}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--c-text)', marginBottom: '0.3rem' }}>{item.title}</div>
            <div style={{ color: 'var(--c-text-muted)', fontSize: '0.8125rem', lineHeight: 1.55 }}>{item.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function SiteFooter() {
  const cats = ['Kitchen Appliances', 'Hardware & Tools', 'Home Decor', 'Electricals', 'Safety Gear'];
  return (
    <footer style={{ background: '#0F0F0F', borderTop: '1px solid rgba(212,175,55,0.12)', padding: 'clamp(2.5rem, 5vw, 4rem) 2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '3rem', marginBottom: '2.5rem', maxWidth: '1140px', margin: '0 auto 2.5rem' }}>
        <div>
          <NanekaLogo size="sm" inv style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8375rem', maxWidth: '200px', lineHeight: 1.7 }}>
            Kariakoo's premium online store. Quality products, same-day delivery.
          </p>
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Shop Categories</div>
          {cats.map(c => <div key={c} style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-gold)')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>{c}</div>)}
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Company Info</div>
          {[
            ['/about',   'About Us'],
            ['/terms',   'Terms & Conditions'],
            ['/returns', 'Returns Policy'],
            ['/privacy', 'Privacy Policy'],
            ['/track',   'Track My Order'],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{ display: 'block', fontSize: '0.84rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-gold)')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>{label}</a>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', maxWidth: '1140px', margin: '0 auto' }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>© {new Date().getFullYear()} Naneka Ltd · Dar es Salaam, Tanzania · All rights reserved</p>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Secured by Flutterwave · Powered by PostGIS</p>
      </div>
    </footer>
  );
}

/* ─── Row Header (shared) ─────────────────────────────────────────────────── */
function RowHeader({ eyebrow, title, titleAccent, inv, center }) {
  return (
    <div style={{ marginBottom: center ? '1.25rem' : 0, textAlign: center ? 'center' : undefined }}>
      {eyebrow && <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{eyebrow}</p>}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.1rem, 2.5vw, 1.375rem)', fontWeight: 800, color: inv ? '#fff' : 'var(--c-text)', letterSpacing: '-0.02em' }}>
        {title}{titleAccent && <> <span style={{ color: 'var(--c-gold)' }}>{titleAccent}</span></>}
      </h2>
      <div style={{ width: '32px', height: '2px', background: 'linear-gradient(90deg, var(--c-gold), transparent)', margin: center ? '0.5rem auto 0' : '0.5rem 0 0' }} />
    </div>
  );
}

/* ─── Shared NanekaLogo ───────────────────────────────────────────────────── */
export function NanekaLogo({ size = 'md', inv = false, style: extraStyle }) {
  return (
    <a href="/" className={`naneka-logo${inv ? ' naneka-logo--inv' : ''} naneka-logo--${size}`} style={extraStyle}>
      <div className="naneka-logo__ring"><span className="naneka-logo__initial">N</span></div>
      <span className="naneka-logo__wordmark">NANEKA</span>
    </a>
  );
}
