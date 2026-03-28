import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { getProductById } from '../data/products.js';
import { useCart } from '../context/CartContext.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';
import { NanekaLogo } from './Storefront.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const DELIVERY_FEE = 3_500;

function formatTZS(n) { return 'TZS\u00A0' + Number(n).toLocaleString('en-TZ'); }

/* ─── WhatsApp icon ───────────────────────────────────────────────────────── */
function WAIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

/* ─── Normalise an API product record to the shape the UI expects ─────────── */
function normaliseProduct(p) {
  const price       = Number(p.price ?? 0);
  const marketPrice = p.market_price != null ? Number(p.market_price) : (p.marketPrice ?? null);
  let gallery = p.gallery ?? p.images ?? [];
  if (typeof gallery === 'string') { try { gallery = JSON.parse(gallery); } catch { gallery = []; } }
  if (!Array.isArray(gallery)) gallery = [];
  if (gallery.length === 0 && p.image_url) gallery = [p.image_url];
  let features = p.features ?? [];
  if (typeof features === 'string') { try { features = JSON.parse(features); } catch { features = []; } }
  return {
    ...p,
    price,
    marketPrice,
    stock:    p.stock_qty ?? p.stock ?? 0,
    images:   gallery,
    features: Array.isArray(features) ? features : [],
    category: p.category_slug ?? p.category ?? '',
  };
}

/* ─── Star Rating Display ─────────────────────────────────────────────────── */
function StarRating({ rating, size = '1rem' }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, letterSpacing: '0.05em' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= Math.round(rating) ? '#F5A623' : '#D1D5DB' }}>★</span>
      ))}
    </span>
  );
}

/* ─── Product Detail Page ─────────────────────────────────────────────────── */
export default function ProductDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { add, count, setDrawerOpen } = useCart();
  const { lang }     = useLanguage();

  const [product,        setProduct]        = useState(() => getProductById(id) ?? null);
  const [apiLoading,     setApiLoading]     = useState(true);
  const [reviews,        setReviews]        = useState(null);   // null = loading
  const [similarProducts,setSimilarProducts]= useState([]);

  const [selectedImg,    setSelectedImg]    = useState(0);
  const [qty,            setQty]            = useState(1);
  const [addedFeedback,  setAddedFeedback]  = useState(false);
  const [checkoutMode,   setCheckoutMode]   = useState(null); // null | 'checkout' | 'whatsapp'

  // Fetch product
  useEffect(() => {
    setApiLoading(true);
    api.get(`/api/v1/products/${id}`)
      .then(({ data }) => {
        const raw = data.product ?? data;
        setProduct(normaliseProduct(raw));
      })
      .catch(() => {})
      .finally(() => setApiLoading(false));
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    setReviews(null);
    api.get(`/api/v1/products/${id}/reviews`)
      .then(({ data }) => setReviews(data.reviews ?? data ?? []))
      .catch(() => setReviews([]));
  }, [id]);

  // Fetch similar products
  useEffect(() => {
    setSimilarProducts([]);
    api.get(`/api/v1/products/${id}/similar`)
      .then(({ data }) => {
        const raw = data.products ?? data ?? [];
        setSimilarProducts(Array.isArray(raw) ? raw.map(normaliseProduct) : []);
      })
      .catch(() => {});
  }, [id]);

  if (!product && apiLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--c-text-muted)' }}>
        <span className="spinner" style={{ width: '2rem', height: '2rem', color: 'var(--c-gold)' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Product Not Found</h1>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>This product doesn't exist or may have been removed.</p>
        <button className="btn btn-gold" onClick={() => navigate('/')} style={{ padding: '0.875rem 2.5rem' }}>← Back to Store</button>
      </div>
    );
  }

  const images    = product.images ?? [];
  const savingAmt = product.marketPrice ? product.marketPrice - product.price : 0;
  const savingPct = product.marketPrice ? Math.round((savingAmt / product.marketPrice) * 100) : 0;
  const stockOk   = product.stock > 0;

  // Derive star summary from live reviews
  const reviewCount = reviews?.length ?? 0;
  const avgRating   = reviewCount > 0
    ? reviews.reduce((s, r) => s + Number(r.rating ?? 0), 0) / reviewCount
    : 0;

  function handleAddToCart() {
    add(product, qty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
    setDrawerOpen(true);
  }

  function StockBadge() {
    if (product.stock > 20) return <span style={{ color: 'var(--c-success)', fontWeight: 600, fontSize: '0.875rem' }}>✓ In Stock ({product.stock} units)</span>;
    if (product.stock > 0)  return <span style={{ color: 'var(--c-warning)', fontWeight: 600, fontSize: '0.875rem' }}>⚠ Low Stock — only {product.stock} left</span>;
    return <span style={{ color: 'var(--c-error)', fontWeight: 600, fontSize: '0.875rem' }}>✕ Out of Stock</span>;
  }

  return (
    <>
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>

        {/* ── Mini header ─────────────────────────────────────────────────── */}
        <header style={{ background: '#fff', borderBottom: '1px solid var(--c-border)', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-xs)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.5rem', gap: '1.5rem' }}>
            <NanekaLogo />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <a href="/" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-muted)')}>
                ← Store
              </a>
              <button
                onClick={() => setDrawerOpen(true)}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', padding: '0.25rem 0.5rem' }}
              >
                <span style={{ fontSize: '1.375rem' }}>🛒</span>
                {count > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--c-gold)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
                <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--c-text-muted)', letterSpacing: '0.04em' }}>Cart</span>
              </button>
            </div>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          {/* ── Breadcrumb ──────────────────────────────────────────────── */}
          <div className="container" style={{ padding: '0.875rem 1.5rem', fontSize: '0.8125rem', color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            {[['Home', '/'], ['Store', '/']].map(([l, h]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <a href={h} style={{ color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-muted)')}>
                  {l}
                </a>
                <span>›</span>
              </span>
            ))}
            <span style={{ textTransform: 'capitalize' }}>{product.subcategory}</span>
            <span>›</span>
            <span style={{ color: 'var(--c-text)', fontWeight: 500 }}>{product.name}</span>
          </div>

          {/* ── Two-column desktop layout ────────────────────────────────── */}
          <div className="container" style={{ padding: '0 1.5rem 4rem' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">

              {/* ── LEFT: Sticky image gallery ──────────────────────────── */}
              <div className="lg:sticky lg:top-[88px]">
                <div style={{
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  background: '#F5F2E8', aspectRatio: '4/3',
                  marginBottom: '0.875rem',
                  border: '1px solid var(--c-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {images[selectedImg] ? (
                    <img
                      src={images[selectedImg]}
                      alt={`${product.name} — view ${selectedImg + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '6rem', lineHeight: 1 }}>{product.emoji ?? '📦'}</span>
                  )}
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImg(i)}
                        style={{
                          width: '76px', height: '76px',
                          borderRadius: 'var(--radius-sm)', overflow: 'hidden', padding: 0,
                          border: `2px solid ${selectedImg === i ? 'var(--c-gold)' : 'var(--c-border)'}`,
                          background: '#F5F2E8', cursor: 'pointer', flexShrink: 0,
                          transition: 'border-color 0.18s',
                        }}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Scrolling details column ─────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem', minWidth: 0 }}>

                {/* Brand + badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {product.brand}
                  </span>
                  {product.badge && (
                    <span style={{ background: 'var(--c-gold)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                      {product.badge}
                    </span>
                  )}
                  {product.madeInTanzania && (
                    <span style={{ background: '#1B5E20', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      🇹🇿 Made in Tanzania
                    </span>
                  )}
                </div>

                {/* Name */}
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, color: 'var(--c-text)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0 }}>
                  {product.name}
                </h1>

                {/* Stars — derived from live reviews */}
                {reviewCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StarRating rating={avgRating} size="1rem" />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)' }}>
                      {avgRating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* ── Price block ──────────────────────────────────────────── */}
                <div style={{ background: '#FAFAF7', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', padding: '1.375rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div>
                    <div style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--c-gold)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {formatTZS(product.price)}
                    </div>
                    {product.marketPrice && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--c-text-muted)', textDecoration: 'line-through' }}>
                          {formatTZS(product.marketPrice)}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2E7D52', background: 'rgba(46,125,82,0.1)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                          Save {savingPct}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price Match Guarantee */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1A1A1A 0%, #252525 100%)',
                    borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem',
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    border: '1px solid rgba(212,175,55,0.2)',
                    overflow: 'hidden',
                  }}>
                    <span style={{ fontSize: '1.375rem', flexShrink: 0 }}>🏷️</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        Price Match Guarantee
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
                        Kariakoo market avg:{' '}
                        <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{formatTZS(product.marketPrice)}</span>
                        {' '}→ Naneka:{' '}
                        <strong style={{ color: 'var(--c-gold)' }}>{formatTZS(product.price)}</strong>
                        {' '}· You save{' '}
                        <strong style={{ color: '#4ADE80' }}>{formatTZS(savingAmt)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Delivery note */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8375rem', color: 'var(--c-text-muted)' }}>
                    <span style={{ color: 'var(--c-success)', fontSize: '1rem' }}>✓</span>
                    <span>Flat delivery fee <strong style={{ color: 'var(--c-text)' }}>{formatTZS(DELIVERY_FEE)}</strong> · Same-day Dar es Salaam</span>
                  </div>
                </div>

                {/* Stock status */}
                <StockBadge />

                {/* ── Qty + Add to Cart ─────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--c-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '42px', height: '50px', border: 'none', background: '#F5F2E8', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--c-text)', fontFamily: 'var(--font-sans)', transition: 'background 0.15s' }}>−</button>
                    <span style={{ padding: '0 1.125rem', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--c-text)', minWidth: '48px', textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} disabled={!stockOk} style={{ width: '42px', height: '50px', border: 'none', background: '#F5F2E8', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--c-text)', fontFamily: 'var(--font-sans)', transition: 'background 0.15s' }}>+</button>
                  </div>
                  <button onClick={handleAddToCart} disabled={!stockOk} className="btn btn-charcoal"
                    style={{ flex: 1, padding: '0.875rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {addedFeedback ? '✓ Added to Cart!' : '🛒 Add to Cart'}
                  </button>
                </div>

                {/* Buy Now */}
                <button onClick={() => setCheckoutMode('checkout')} disabled={!stockOk} className="btn btn-gold btn-full"
                  style={{ padding: '0.95rem', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
                  Buy Now — {formatTZS(product.price + DELIVERY_FEE)} total →
                </button>

                {/* Order via WhatsApp */}
                <button
                  onClick={() => setCheckoutMode('whatsapp')}
                  disabled={!stockOk}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '0.8rem', border: '1.5px solid #25D366', borderRadius: 'var(--radius-sm)', background: 'transparent', color: '#128C3E', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'background 0.18s, color 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#128C3E'; }}
                >
                  <WAIcon /> Order via WhatsApp
                </button>

                {/* ── Specs ─────────────────────────────────────────────── */}
                {product.specs?.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '1.375rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Specifications</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {product.specs.map((spec, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--c-text-muted)' }}>
                          <span style={{ color: 'var(--c-gold)', flexShrink: 0, marginTop: '1px' }}>✓</span>
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Long description ──────────────────────────────────── */}
                {(() => {
                  const descSw = product.description_sw;
                  const descEn = product.longDescription ?? product.description;
                  const body   = (lang === 'sw' && descSw) ? descSw : descEn;
                  return body ? (
                    <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '1.375rem' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>
                        {lang === 'sw' ? 'Kuhusu Bidhaa Hii' : 'About This Product'}
                      </div>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-muted)', lineHeight: 1.8, margin: 0 }}>{body}</p>
                    </div>
                  ) : null;
                })()}

                {/* ── Reviews ───────────────────────────────────────────── */}
                <ReviewsSection reviews={reviews} avgRating={avgRating} />

                {/* ── Similar Products ──────────────────────────────────── */}
                {similarProducts.length > 0 && (
                  <SimilarProductsSlider products={similarProducts} />
                )}

              </div>{/* end right column */}
            </div>{/* end two-col grid */}
          </div>
        </main>
      </div>

      {checkoutMode && (
        <CheckoutModal product={product} mode={checkoutMode} onClose={() => setCheckoutMode(null)} />
      )}
    </>
  );
}

/* ─── Reviews Section ─────────────────────────────────────────────────────── */
function ReviewsSection({ reviews, avgRating }) {
  const [showAll, setShowAll] = useState(false);

  // Loading state
  if (reviews === null) {
    return (
      <div style={{ borderTop: '2px solid var(--c-border)', paddingTop: '2rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Customer Reviews</div>
        <div style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>Loading reviews…</div>
      </div>
    );
  }

  const reviewCount = reviews.length;

  return (
    <div style={{ borderTop: '2px solid var(--c-border)', paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Customer Reviews</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-text)', margin: 0 }}>
            Ratings &amp; Reviews
          </h2>
        </div>
        <button
          className="btn btn-gold"
          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
          onClick={() => alert('Review form coming soon.')}
        >
          ✏️ Write a Review
        </button>
      </div>

      {/* Empty state */}
      {reviewCount === 0 && (
        <div style={{ background: '#FAFAF7', border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--c-text)', margin: '0 0 0.35rem' }}>No reviews yet</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', margin: 0 }}>Be the first to review this product!</p>
        </div>
      )}

      {/* Summary + breakdown */}
      {reviewCount > 0 && (() => {
        const breakdown = [5, 4, 3, 2, 1].map(stars => {
          const cnt = reviews.filter(r => Math.round(Number(r.rating)) === stars).length;
          return { stars, count: cnt, pct: Math.round((cnt / reviewCount) * 100) };
        });
        const displayed = showAll ? reviews : reviews.slice(0, 3);

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'center', background: '#FAFAF7', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', padding: '1.375rem', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center', paddingRight: '1.5rem', borderRight: '1px solid var(--c-border)' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 900, color: 'var(--c-gold)', lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
                <StarRating rating={avgRating} size="1.1rem" />
                <div style={{ fontSize: '0.72rem', color: 'var(--c-text-muted)', marginTop: '0.35rem' }}>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {breakdown.map(({ stars, count, pct }) => (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--c-text-muted)', minWidth: '30px', whiteSpace: 'nowrap' }}>{stars} ★</span>
                    <div style={{ flex: 1, height: '7px', background: '#E5E0D5', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--c-gold)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--c-text-muted)', minWidth: '20px', textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayed.map((review, i) => (
                <div key={review.id ?? i} style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', padding: '1.125rem', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--c-gold), #B8830A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                        {(review.name ?? review.reviewer_name ?? 'A').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--c-text)' }}>{review.name ?? review.reviewer_name ?? 'Anonymous'}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--c-text-muted)', marginTop: '0.1rem' }}>
                          <span style={{ background: 'rgba(46,125,82,0.08)', color: 'var(--c-success)', border: '1px solid rgba(46,125,82,0.2)', borderRadius: '4px', padding: '0.05rem 0.3rem', fontSize: '0.62rem', fontWeight: 700, marginRight: '0.35rem' }}>✓ Verified</span>
                          {review.date ?? review.created_at?.split('T')[0] ?? ''}
                        </div>
                      </div>
                    </div>
                    <StarRating rating={Number(review.rating)} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--c-text-muted)', lineHeight: 1.7, margin: '0 0 0.625rem' }}>{review.text ?? review.body ?? review.comment ?? ''}</p>
                  {review.helpful != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--c-text-dim)' }}>Helpful?</span>
                      <button style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.5rem', border: '1px solid var(--c-border)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--c-text-muted)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.color = 'var(--c-gold)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}>
                        👍 {review.helpful}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {reviews.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button
                  onClick={() => setShowAll(v => !v)}
                  style={{ padding: '0.65rem 1.75rem', fontSize: '0.8125rem', fontWeight: 600, border: '1.5px solid var(--c-border)', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--c-text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.color = 'var(--c-gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
                >
                  {showAll ? 'Show fewer ↑' : `Show all ${reviews.length} reviews ↓`}
                </button>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

/* ─── Similar Products Slider ─────────────────────────────────────────────── */
function SimilarProductsSlider({ products }) {
  const scrollRef = useRef(null);
  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 580, behavior: 'smooth' });
  }
  return (
    <div style={{ borderTop: '2px solid var(--c-border)', paddingTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.25rem', margin: '0 0 0.25rem' }}>More Like This</p>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 800, color: 'var(--c-text)', margin: 0 }}>
            Similar <span style={{ color: 'var(--c-gold)' }}>Products</span>
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <SliderArrow dir={-1} onClick={() => scroll(-1)} />
          <SliderArrow dir={1}  onClick={() => scroll(1)} />
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: '0.875rem', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {products.map(p => (
          <SimilarProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function SliderArrow({ dir, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      aria-label={dir === -1 ? 'Scroll left' : 'Scroll right'}
      style={{ width: '30px', height: '30px', borderRadius: '50%', border: `1.5px solid ${hov ? 'var(--c-gold)' : 'var(--c-border)'}`, background: hov ? 'rgba(212,175,55,0.08)' : 'transparent', color: hov ? 'var(--c-gold)' : 'var(--c-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.15s' }}>
      {dir === -1 ? '‹' : '›'}
    </button>
  );
}

function SimilarProductCard({ product }) {
  const navigate             = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  const imgSrc                = product.images?.[0];
  const showImg               = imgSrc && !imgErr;

  return (
    <div onClick={() => navigate(`/products/${product.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: '160px', flexShrink: 0, background: '#fff', borderRadius: 'var(--radius)', border: `1px solid ${hovered ? 'var(--c-border-hover)' : 'var(--c-border)'}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: hovered ? 'var(--shadow-gold)' : 'var(--shadow-sm)', transform: hovered ? 'translateY(-3px)' : 'none' }}
    >
      <div style={{ height: '120px', background: showImg ? '#F5F2E8' : 'linear-gradient(145deg,#FBF8EE,#F5EFD6)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {showImg ? (
          <img src={imgSrc} alt={product.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
        ) : (
          <span style={{ fontSize: '2.5rem' }}>{product.emoji ?? '📦'}</span>
        )}
      </div>
      <div style={{ padding: '0.625rem 0.75rem 0.875rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '0.375rem' }}>
          {product.name}
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-gold)' }}>
          TZS {product.price.toLocaleString('en-TZ')}
        </div>
        {product.marketPrice && (
          <div style={{ fontSize: '0.62rem', color: '#4ADE80', fontWeight: 700 }}>
            Save {Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}
