import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export const CATEGORIES = [
  {
    id: 'electronics', icon: '📺', label: 'Electronics',
    subs: ['TVs & Monitors', 'Fridges & Freezers', 'Home Theater', 'Washing Machines', 'Microwaves', 'Air Conditioners'],
  },
  {
    id: 'clothing', icon: '👗', label: 'Women, Kids & Men',
    subs: ["Women's Dresses", "Women's Shoes", "Men's Shirts", "Men's Trousers", 'Kids Clothing', 'Kids Shoes', 'School Bags'],
  },
  {
    id: 'kitchen', icon: '🍳', label: 'Kitchen & Home',
    subs: ['Gas Stoves', 'Electric Stoves', 'Pots & Cookware', 'Blenders & Mixers', 'Pressure Cookers', 'Kitchen Tools'],
  },
  {
    id: 'watches', icon: '⌚', label: 'Watches & Handbags',
    subs: ["Men's Watches", "Ladies' Watches", 'Handbags', 'Wallets & Purses', 'Sunglasses', 'Belts'],
  },
  {
    id: 'furniture', icon: '🛋️', label: 'Furniture',
    subs: ['Sofas & Couches', 'Beds & Mattresses', 'Dining Sets', 'Wardrobes', 'Office Chairs', 'Storage & Shelves'],
  },
  {
    id: 'made-in-tz', icon: '🇹🇿', label: 'Made in Tanzania',
    subs: ['Handcrafted Cookware', 'Local Textiles', 'Kiondo Baskets', 'Artisan Woodwork', 'Hardware Tools', 'Building Materials'],
  },
  {
    id: 'phones', icon: '📱', label: 'Phones & Accessories',
    subs: ['Infinix Phones', 'Tecno Phones', 'Samsung', 'Phone Cases', 'Chargers & Cables', 'Earphones & Headsets'],
  },
];

/* ─── Shared list of categories (desktop + mobile drawer) ───────────────── */
function CategoryList({ onNavigate, defaultExpanded = 'kitchen' }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={{ padding: '0.5rem 0 2rem' }}>
      <div style={{
        padding: '0 1rem 0.75rem',
        fontSize: '0.6rem', fontWeight: 800, color: 'var(--c-gold)',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        borderBottom: '1px solid var(--c-border)', marginBottom: '0.25rem',
      }}>
        All Categories
      </div>

      {CATEGORIES.map(cat => (
        <div key={cat.id}>
          <button
            onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.625rem 1rem', border: 'none',
              background: expanded === cat.id ? 'rgba(212,175,55,0.07)' : 'transparent',
              cursor: 'pointer', transition: 'background 0.15s',
              borderLeft: `3px solid ${expanded === cat.id ? 'var(--c-gold)' : 'transparent'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{cat.icon}</span>
              <span style={{
                fontSize: '0.8125rem', fontWeight: expanded === cat.id ? 700 : 500,
                color: expanded === cat.id ? 'var(--c-text)' : 'var(--c-text-muted)',
                textAlign: 'left',
              }}>
                {cat.label}
              </span>
            </div>
            <span style={{
              fontSize: '0.5rem', color: 'var(--c-text-dim)',
              transform: expanded === cat.id ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s', flexShrink: 0,
            }}>▶</span>
          </button>

          {expanded === cat.id && (
            <div style={{ paddingBottom: '0.25rem', background: '#FAFAF7' }}>
              {cat.subs.map(sub => (
                <button
                  key={sub}
                  onClick={() => onNavigate?.(cat.id, sub)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '0.4rem 1rem 0.4rem 2.75rem',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: '0.775rem', color: 'var(--c-text-muted)',
                    fontFamily: 'var(--font-sans)', transition: 'color 0.15s, background 0.15s',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-gold)'; e.currentTarget.style.background = 'rgba(212,175,55,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--c-text-dim)', flexShrink: 0 }} />
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Made in TZ promo block */}
      <div style={{ margin: '1.25rem 0.875rem 0', background: '#1A1A1A', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🇹🇿</div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
          Made in Tanzania
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
          Support local artisans &amp; brands
        </div>
        <button
          onClick={() => onNavigate?.('made-in-tz')}
          style={{
            marginTop: '0.75rem', width: '100%',
            padding: '0.45rem 0', background: 'var(--c-gold)', border: 'none',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            fontSize: '0.7rem', fontWeight: 700, color: '#1A1A1A', letterSpacing: '0.06em',
            textTransform: 'uppercase', fontFamily: 'var(--font-sans)',
          }}
        >
          Shop Local →
        </button>
      </div>
    </div>
  );
}

/* ─── Mobile bottom drawer ───────────────────────────────────────────────── */
function MobileDrawer({ open, onClose, onNavigate }) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 490, animation: 'fadeIn 0.2s ease' }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '78dvh', zIndex: 491,
        background: '#fff', borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
        overflow: 'hidden',
      }}>
        {/* Handle + header */}
        <div style={{ padding: '0.75rem 1.25rem 0.5rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E0DDD5', margin: '0 auto 0.75rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--c-text)' }}>
              Browse Categories
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem', color: 'var(--c-text-muted)', padding: '0.25rem 0.375rem' }}
            >
              ✕
            </button>
          </div>
        </div>
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          <CategoryList onNavigate={(cat, sub) => { onNavigate?.(cat, sub); onClose(); }} />
        </div>
      </div>
    </>
  );
}

/* ─── Mobile bottom nav bar ──────────────────────────────────────────────── */
// categoriesOpen — boolean passed from MegaSidebar so the tab reflects drawer state
export function MobileBottomNav({ onOpenCategories, categoriesOpen = false }) {
  const { count, drawerOpen: cartOpen, setDrawerOpen } = useCart();
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  // Active rules:
  //  • Home       → user is on "/" and neither overlay is open
  //  • Categories → category drawer is open
  //  • Cart       → cart drawer is open
  const homeActive = pathname === '/' && !categoriesOpen && !cartOpen;
  const catActive  = categoriesOpen;
  const cartActive = cartOpen;

  // Shared tab button style — active tab gets the brand gold top-border + gold text
  function tabStyle(isActive) {
    return {
      flex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '0.2rem',
      padding: '0.625rem 0.5rem',
      border: 'none', background: 'none', cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.62rem', fontWeight: isActive ? 700 : 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      color: isActive ? 'var(--c-gold)' : 'var(--c-text-muted)',
      borderTop: `2px solid ${isActive ? 'var(--c-gold)' : 'transparent'}`,
      transition: 'color 0.15s, border-color 0.15s',
    };
  }

  return (
    <nav className="mobile-bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 480,
      background: '#fff', borderTop: '1px solid var(--c-border)',
      display: 'none', /* shown via CSS media query on ≤900px */
      alignItems: 'stretch', justifyContent: 'space-around',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.09)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>

      {/* ── Home ── */}
      <button onClick={() => navigate('/')} style={tabStyle(homeActive)} aria-label="Home">
        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>🏠</span>
        Home
      </button>

      {/* ── Categories ── */}
      <button onClick={onOpenCategories} style={tabStyle(catActive)} aria-label="Categories">
        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>☰</span>
        Categories
      </button>

      {/* ── Cart ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        style={{ ...tabStyle(cartActive), position: 'relative' }}
        aria-label="Cart"
      >
        <span style={{ fontSize: '1.3rem', lineHeight: 1, position: 'relative' }}>
          🛒
          {count > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-6px',
              background: 'var(--c-gold)', color: '#fff',
              fontSize: '0.55rem', fontWeight: 700,
              width: '16px', height: '16px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {count > 9 ? '9+' : count}
            </span>
          )}
        </span>
        Cart
      </button>

    </nav>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */
// Accepts optional drawerOpen / onOpenDrawer / onCloseDrawer so a parent can
// control the mobile category drawer (e.g. to wire up an external hamburger).
// Falls back to internal state when those props are not provided.
export default function MegaSidebar({ onNavigate, drawerOpen, onOpenDrawer, onCloseDrawer }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const mobileOpen   = drawerOpen   !== undefined ? drawerOpen   : internalOpen;
  const openDrawer   = onOpenDrawer  ?? (() => setInternalOpen(true));
  const closeDrawer  = onCloseDrawer ?? (() => setInternalOpen(false));

  return (
    <>
      {/* Desktop sticky sidebar — hidden via .mega-sidebar CSS at ≤900px */}
      <aside className="mega-sidebar" style={{
        width: '220px', flexShrink: 0,
        borderRight: '1px solid var(--c-border)',
        background: '#fff',
        position: 'sticky',
        top: '152px',
        height: 'calc(100vh - 152px)',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#E8E4D8 transparent',
      }}>
        <CategoryList onNavigate={onNavigate} />
      </aside>

      {/* Mobile bottom bar — shown via .mobile-bottom-nav CSS at ≤900px */}
      <MobileBottomNav onOpenCategories={openDrawer} categoriesOpen={mobileOpen} />

      {/* Mobile slide-up drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={closeDrawer}
        onNavigate={onNavigate}
      />
    </>
  );
}
