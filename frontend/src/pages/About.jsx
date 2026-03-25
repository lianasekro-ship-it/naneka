import { NanekaLogo } from './Storefront.jsx';

const ADVANTAGES = [
  {
    icon: '🏷️',
    title: 'Kariakoo Prices, Boutique Service',
    text: 'We source directly from the most reputable wholesalers in Kariakoo, passing the cost savings directly to you.',
    color: '#B45309',
    bg: 'rgba(180,83,9,0.06)',
    border: 'rgba(180,83,9,0.18)',
  },
  {
    icon: '✅',
    title: 'Verified Quality',
    text: "Every item on Naneka undergoes a physical inspection at our Kariakoo hub before it is dispatched. We filter out the 'fake' so you only get the 'real.'",
    color: '#1A6B3C',
    bg: 'rgba(26,107,60,0.06)',
    border: 'rgba(26,107,60,0.18)',
  },
  {
    icon: '🤖',
    title: 'AI-Driven Experience',
    text: 'We are proud to be the first Tanzanian platform integrating Virtual Try-On (VTO) and AI-assisted descriptions, ensuring you know exactly what you are buying before it arrives.',
    color: '#1D4ED8',
    bg: 'rgba(29,78,216,0.06)',
    border: 'rgba(29,78,216,0.18)',
  },
  {
    icon: '🚚',
    title: 'Logistics You Can Trust',
    text: 'With our dedicated driver network and partnerships with regional bus services, we ensure your package reaches you whether you are in Tegeta or Tunduma.',
    color: '#6D28D9',
    bg: 'rgba(109,40,217,0.06)',
    border: 'rgba(109,40,217,0.18)',
  },
];

const HUB_DETAILS = [
  { icon: '📍', label: 'Hub Location', value: 'Kariakoo, Dar es Salaam, Tanzania' },
  { icon: '💬', label: 'Customer Support', value: 'Available 24/7 via WhatsApp and Phone' },
];

export default function About() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FAFAF7',
      fontFamily: 'var(--font-sans)',
      color: 'var(--c-text)',
    }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid var(--c-border)',
        boxShadow: '0 1px 0 rgba(212,175,55,0.12)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          padding: '0.875rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <NanekaLogo />
          <a
            href="/"
            style={{
              fontSize: '0.8125rem', fontWeight: 500,
              color: 'var(--c-text-muted)', textDecoration: 'none',
              letterSpacing: '0.04em', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-muted)')}
          >
            ← Back to Store
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #1A1A1A 0%, #111 60%, #0F0F0F 100%)',
        borderBottom: '3px solid var(--c-gold)',
        padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2.5rem, 6vw, 5rem)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative radial glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 120vw)', height: 'min(600px, 120vw)',
          background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)',
            marginBottom: '1.25rem',
          }}>
            About Naneka
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.25rem, 6vw, 4rem)',
            fontWeight: 900, color: '#FFFFFF',
            letterSpacing: '-0.03em',
            margin: '0 0 0.625rem',
            lineHeight: 1.05,
          }}>
            The Bridge to Kariakoo
          </h1>

          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1rem, 2.5vw, 1.3125rem)',
            color: 'var(--c-gold)',
            fontStyle: 'italic',
            fontWeight: 500,
            margin: '0 0 2rem',
            letterSpacing: '0.01em',
          }}>
            Welcome to the Future of Tanzanian Retail.
          </p>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap',
          }}>
            {['🇹🇿 100% Tanzanian-Owned', '📦 Kariakoo Sourced', '🤖 AI-Powered', '🚀 Founded 2025'].map(tag => (
              <span key={tag} style={{
                fontSize: '0.75rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px', padding: '0.35rem 0.875rem',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem 5rem' }}>

        {/* ── Section 1: Our Story ────────────────────────────────────────── */}
        <section style={{ marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--c-gold)',
            }}>
              01 — Our Story
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,175,55,0.4), transparent)' }} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            fontWeight: 900, color: '#1A1A1A',
            letterSpacing: '-0.02em', margin: '0 0 1.5rem',
            lineHeight: 1.15,
          }}>
            Beyond the Shopping Cart
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            <div style={{
              background: '#fff',
              border: '1px solid var(--c-border)',
              borderRadius: '12px', padding: '1.5rem',
              borderTop: '3px solid var(--c-gold)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.875rem' }}>🕌</div>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#3D3D3D', lineHeight: 1.8 }}>
                Founded in <strong style={{ color: '#1A1A1A' }}>2025</strong> and launched in{' '}
                <strong style={{ color: '#1A1A1A' }}>2026</strong>, Naneka was born out of a simple but powerful
                observation: <strong style={{ color: 'var(--c-gold)' }}>Kariakoo is the heartbeat of East African trade</strong>,
                yet the experience of shopping there can be overwhelming, time-consuming, and risky for many.
              </p>
            </div>
            <div style={{
              background: '#1A1A1A',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '12px', padding: '1.5rem',
              borderTop: '3px solid var(--c-gold)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.875rem' }}>🌉</div>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                Naneka was built to{' '}
                <strong style={{ color: 'var(--c-gold)' }}>bridge the gap</strong> between the chaotic energy
                of the physical market and the seamless convenience of modern e-commerce. We are not just a
                website; we are your{' '}
                <strong style={{ color: '#fff' }}>trusted eyes and hands</strong> in the heart of Dar es Salaam.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Mission ──────────────────────────────────────────── */}
        <section style={{ marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--c-gold)',
            }}>
              02 — Our Mission
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,175,55,0.4), transparent)' }} />
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #252525 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '16px',
            padding: 'clamp(1.75rem, 4vw, 2.5rem)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-1rem', right: '-1rem',
              fontSize: '8rem', opacity: 0.04, lineHeight: 1,
              pointerEvents: 'none', userSelect: 'none',
            }}>
              🇹🇿
            </div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)',
              marginBottom: '1rem',
            }}>
              Mission Statement
            </div>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              color: '#FFFFFF',
              fontWeight: 700,
              lineHeight: 1.6,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              To empower every Tanzanian—from the{' '}
              <span style={{ color: 'var(--c-gold)' }}>office worker in Posta</span> to the{' '}
              <span style={{ color: 'var(--c-gold)' }}>farmer in Mbeya</span>—to access high-quality
              electronics, hardware, and fashion directly from the source with{' '}
              <span style={{ borderBottom: '2px solid var(--c-gold)', paddingBottom: '1px' }}>
                100% transparency, safety, and speed
              </span>.
            </p>
          </div>
        </section>

        {/* ── Section 3: The Naneka Advantage ────────────────────────────── */}
        <section style={{ marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.75rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--c-gold)',
            }}>
              03 — The Naneka Advantage
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,175,55,0.4), transparent)' }} />
          </div>

          <p style={{
            fontSize: '1rem', color: 'var(--c-text-muted)',
            marginBottom: '1.5rem', lineHeight: 1.7,
          }}>
            Why shop with us?
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            {ADVANTAGES.map((adv, i) => (
              <div key={i} style={{
                background: adv.bg,
                border: `1px solid ${adv.border}`,
                borderRadius: '12px',
                padding: '1.375rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: '#fff',
                  border: `1px solid ${adv.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.375rem',
                }}>
                  {adv.icon}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: adv.color, lineHeight: 1.3 }}>
                  {adv.title}
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#3D3D3D', lineHeight: 1.75 }}>
                  {adv.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Our Promise ──────────────────────────────────────── */}
        <section style={{ marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--c-gold)',
            }}>
              04 — Our Promise to Tanzania
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,175,55,0.4), transparent)' }} />
          </div>

          <div style={{
            background: '#fff',
            border: '1px solid var(--c-border)',
            borderRadius: '16px',
            padding: 'clamp(1.5rem, 4vw, 2.25rem)',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '1.5rem',
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #1A1A1A, #333)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', flexShrink: 0,
            }}>
              🇹🇿
            </div>
            <div>
              <div style={{
                fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--c-gold)',
                marginBottom: '0.625rem',
              }}>
                100% Tanzanian-Owned Platform
              </div>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#3D3D3D', lineHeight: 1.85 }}>
                We believe in the <strong style={{ color: '#1A1A1A' }}>"Made in TZ" spirit</strong> and the power of
                local trade. By shopping at Naneka, you are supporting a digital ecosystem that empowers{' '}
                <strong style={{ color: '#1A1A1A' }}>local couriers</strong>,{' '}
                <strong style={{ color: '#1A1A1A' }}>small-scale wholesalers</strong>, and the growing digital
                economy of the <strong style={{ color: '#1A1A1A' }}>United Republic of Tanzania</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 5: Visit Us ─────────────────────────────────────────── */}
        <section style={{ marginBottom: 'clamp(2rem, 5vw, 3rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.75rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--c-gold)',
            }}>
              05 — Visit Us
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,175,55,0.4), transparent)' }} />
          </div>

          <p style={{
            fontSize: '0.9375rem', color: 'var(--c-text-muted)', lineHeight: 1.7,
            marginBottom: '1.25rem',
          }}>
            While we are a digital-first platform, our roots are firmly planted in the soil.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            {HUB_DETAILS.map(d => (
              <div key={d.label} style={{
                background: '#fff',
                border: '1px solid var(--c-border)',
                borderRadius: '12px',
                padding: '1.25rem 1.375rem',
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
              }}>
                <span style={{
                  fontSize: '1.5rem', flexShrink: 0,
                  width: '40px', height: '40px',
                  background: '#FAFAF7', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--c-border)',
                }}>
                  {d.icon}
                </span>
                <div>
                  <div style={{
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--c-text-muted)',
                    marginBottom: '0.25rem',
                  }}>
                    {d.label}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1A1A1A', lineHeight: 1.4 }}>
                    {d.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Closing tagline */}
          <div style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #222 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '12px',
            padding: '1.5rem 1.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem', flexWrap: 'wrap',
          }}>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              fontWeight: 700, color: '#fff',
              margin: 0, lineHeight: 1.4,
            }}>
              Naneka:{' '}
              <span style={{ color: 'var(--c-gold)' }}>Your Trusted Link to the Market.</span>
            </p>
            <a
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--c-gold)', color: '#0F0F0F',
                borderRadius: '8px', textDecoration: 'none',
                fontSize: '0.875rem', fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Start Shopping →
            </a>
          </div>
        </section>

        {/* Cross-links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
        }}>
          {[
            { label: 'Terms & Conditions', href: '/terms' },
            { label: 'Returns Policy',     href: '/returns' },
            { label: 'Privacy Policy',     href: '/privacy' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '0.875rem 1rem',
                background: '#fff', border: '1px solid var(--c-border)',
                borderRadius: '10px', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: '0.8125rem', color: '#1A1A1A', fontWeight: 600,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.color = 'var(--c-gold)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = '#1A1A1A'; }}
            >
              <span>{link.label}</span>
              <span style={{ opacity: 0.4 }}>→</span>
            </a>
          ))}
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--c-border)',
        background: '#1A1A1A',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: '1rem',
          fontWeight: 700, color: 'var(--c-gold)', marginBottom: '0.375rem',
        }}>
          Naneka
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} Naneka Platforms · Dar es Salaam, Tanzania
        </div>
      </footer>
    </div>
  );
}
