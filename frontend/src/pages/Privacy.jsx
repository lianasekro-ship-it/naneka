import { NanekaLogo } from './Storefront.jsx';

const YOUR_RIGHTS = [
  {
    right: 'Access',
    icon: '📋',
    text: 'Request a copy of the personal data we hold about you.',
    color: '#1D4ED8',
    bg: 'rgba(29,78,216,0.06)',
    border: 'rgba(29,78,216,0.18)',
  },
  {
    right: 'Correction',
    icon: '✏️',
    text: 'Request that we correct any inaccurate or incomplete information.',
    color: '#B45309',
    bg: 'rgba(180,83,9,0.06)',
    border: 'rgba(180,83,9,0.18)',
  },
  {
    right: 'Deletion',
    icon: '🗑️',
    text: "Request the permanent deletion of your account and associated data ('Right to be Forgotten').",
    color: '#DC2626',
    bg: 'rgba(220,38,38,0.06)',
    border: 'rgba(220,38,38,0.18)',
  },
  {
    right: 'Withdrawal of Consent',
    icon: '🔕',
    text: 'Withdraw your consent for marketing communications at any time.',
    color: '#1A6B3C',
    bg: 'rgba(26,107,60,0.06)',
    border: 'rgba(26,107,60,0.18)',
  },
];

const SECTIONS = [
  {
    number: '1',
    title: 'DATA WE COLLECT',
    icon: '📁',
    content: [
      { type: 'clause', id: '1.1', label: 'Personal Identification Information', text: 'We collect your name, phone number, and email address when you create an account or place an order.' },
      { type: 'clause', id: '1.2', label: 'Delivery Information', text: 'We collect your physical address and location details to ensure accurate delivery of your purchases.' },
      { type: 'clause', id: '1.3', label: 'Technical Data', text: 'We automatically collect your IP address and browser type to improve Site security and user experience.' },
      { type: 'clause', id: '1.4', label: 'Payment Data', text: 'We do not store your full credit card or mobile money PINs. All payments are processed through secure, PCI-compliant partners (e.g., Flutterwave/Network Providers).', safe: true },
    ],
  },
  {
    number: '2',
    title: 'PURPOSE OF DATA PROCESSING',
    icon: '⚙️',
    content: [
      { type: 'clause', id: '2.1', text: 'To process, fulfill, and deliver your orders from our Kariakoo hub to your doorstep.' },
      { type: 'clause', id: '2.2', text: 'To communicate order updates, shipping status, and support queries via SMS or WhatsApp.' },
      { type: 'clause', id: '2.3', text: 'To prevent fraudulent transactions and maintain the security of the Naneka platform.' },
      { type: 'clause', id: '2.4', text: 'To comply with legal obligations under the Electronic Transactions Act (Cap 442).' },
    ],
  },
  {
    number: '3',
    title: 'DATA SHARING AND DISCLOSURE',
    icon: '🔗',
    content: [
      { type: 'clause', id: '3.1', label: 'Delivery Partners', text: 'We only share your name, phone number, and address with our verified Boda/Courier partners for the sole purpose of delivery.' },
      { type: 'clause', id: '3.2', label: 'No Sale of Data', text: 'Naneka NEVER sells, rents, or trades your personal data to third-party marketing companies.', strong: true },
      { type: 'clause', id: '3.3', label: 'Legal Requirements', text: 'We may disclose your information if required by law or by the Data Protection Commission of Tanzania.' },
    ],
  },
  {
    number: '4',
    title: 'DATA SECURITY',
    icon: '🔒',
    content: [
      { type: 'clause', id: '4.1', text: 'We implement industry-standard encryption (SSL/TLS) to protect your data during transmission.', safe: true },
      { type: 'clause', id: '4.2', text: 'While we take every precaution, no method of transmission over the internet is 100% secure. We encourage users to use strong passwords and avoid sharing account details.' },
    ],
  },
  {
    number: '5',
    title: 'YOUR RIGHTS (PDPA 2022)',
    icon: '⚖️',
    content: [{ type: 'rights' }],
  },
  {
    number: '6',
    title: 'COOKIES AND TRACKING',
    icon: '🍪',
    content: [
      { type: 'clause', id: '6.1', text: "Naneka uses 'cookies' to keep you logged in and to remember the items in your shopping cart." },
      { type: 'clause', id: '6.2', text: 'You can disable cookies in your browser settings, but some features of the Site may not function properly.' },
    ],
  },
  {
    number: '7',
    title: 'CHANGES TO THIS POLICY',
    icon: '📢',
    content: [
      { type: 'p', text: 'Naneka reserves the right to update this Privacy Policy to reflect changes in our practices or the law. We will notify users of significant changes via the email or phone number provided.' },
    ],
  },
  {
    number: '8',
    title: 'CONTACT US',
    icon: '✉️',
    content: [
      { type: 'p', text: "If you have any questions regarding your data privacy, please contact our Data Protection Officer via the 'Contact Us' section on naneka.co.tz." },
    ],
  },
];

function ClauseRow({ clause }) {
  const isStrong = clause.strong;
  const isSafe   = clause.safe;

  const accentColor = isStrong ? '#1A6B3C' : isSafe ? '#1D4ED8' : null;
  const bgColor     = isStrong ? 'rgba(26,107,60,0.05)' : isSafe ? 'rgba(29,78,216,0.04)' : 'transparent';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3.5rem 1fr',
      gap: '0.75rem',
      borderBottom: '1px solid #F0EDE6',
      background: bgColor,
      margin: bgColor !== 'transparent' ? '0 -1.5rem' : undefined,
      padding: bgColor !== 'transparent' ? '0.875rem 1.5rem' : '0.875rem 0',
    }}>
      <span style={{
        fontSize: '0.75rem', fontWeight: 700,
        color: accentColor ?? 'var(--c-gold)',
        letterSpacing: '0.04em',
        paddingTop: '0.125rem', flexShrink: 0,
      }}>
        {clause.id}
      </span>
      <p style={{ margin: 0, fontSize: '0.9375rem', color: '#3D3D3D', lineHeight: 1.75 }}>
        {clause.label && (
          <strong style={{ color: accentColor ?? '#1A1A1A', fontWeight: 700 }}>
            {clause.label}:{' '}
          </strong>
        )}
        {isStrong
          ? clause.text.split('NEVER').map((part, i) =>
              i === 0 ? part : <span key={i}><strong style={{ color: '#1A6B3C' }}>NEVER</strong>{part}</span>
            )
          : clause.text
        }
        {isSafe && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            marginLeft: '0.5rem',
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: '#1D4ED8',
            background: 'rgba(29,78,216,0.1)', border: '1px solid rgba(29,78,216,0.2)',
            borderRadius: '4px', padding: '0.1rem 0.4rem', verticalAlign: 'middle',
          }}>
            PCI Compliant
          </span>
        )}
      </p>
    </div>
  );
}

function RightsGrid() {
  return (
    <div style={{ padding: '1rem 0 0.5rem' }}>
      <p style={{
        fontSize: '0.9375rem', color: '#3D3D3D', lineHeight: 1.75,
        margin: '0 0 1.25rem',
      }}>
        Under the <strong style={{ color: '#1A1A1A' }}>Personal Data Protection Act (2022)</strong>, you have the right to:
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.875rem',
      }}>
        {YOUR_RIGHTS.map(r => (
          <div key={r.right} style={{
            background: r.bg,
            border: `1px solid ${r.border}`,
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{r.icon}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: r.color, letterSpacing: '0.04em' }}>
                {r.right}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8375rem', color: '#555', lineHeight: 1.65 }}>
              {r.text}
            </p>
          </div>
        ))}
      </div>
      <p style={{
        margin: '1.25rem 0 0',
        fontSize: '0.8375rem', color: 'var(--c-text-muted)', lineHeight: 1.7,
        padding: '0.75rem 1rem',
        background: '#F5F2E8',
        borderRadius: '8px',
        border: '1px solid var(--c-border)',
      }}>
        To exercise any of these rights, contact our Data Protection Officer via the Contact Us page or WhatsApp. Requests are handled within <strong style={{ color: '#1A1A1A' }}>30 days</strong> in accordance with the PDPA (2022).
      </p>
    </div>
  );
}

export default function Privacy() {
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
          maxWidth: '860px', margin: '0 auto',
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

      {/* ── Hero band ────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderBottom: '3px solid var(--c-gold)',
        padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)',
          marginBottom: '0.75rem',
        }}>
          Data Protection · Naneka Platforms
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 900, color: '#FFFFFF',
          letterSpacing: '-0.02em', margin: '0 0 0.875rem',
          lineHeight: 1.1,
        }}>
          Privacy Policy
        </h1>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.3)',
          borderRadius: '999px', padding: '0.35rem 1rem',
          fontSize: '0.8rem', color: '#93C5FD', fontWeight: 700,
          letterSpacing: '0.04em', marginBottom: '0.875rem',
        }}>
          🇹🇿 Compliant with PDPA (2022) — United Republic of Tanzania
        </div>
        <p style={{
          fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)',
          margin: 0, letterSpacing: '0.02em',
        }}>
          Last Updated: <strong style={{ color: 'rgba(255,255,255,0.65)' }}>March 24, 2026</strong>
        </p>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 3.5rem) 1.5rem 5rem' }}>

        {/* Preamble */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--c-border)',
          borderLeft: '4px solid #1D4ED8',
          borderRadius: '0 8px 8px 0',
          padding: '1rem 1.25rem',
          marginBottom: '2.5rem',
          fontSize: '0.9375rem',
          color: '#3D3D3D',
          lineHeight: 1.8,
        }}>
          At Naneka (<strong style={{ color: '#1A1A1A' }}>'we', 'us', or 'our'</strong>), we are committed to protecting your personal data
          and your privacy. This Privacy Policy explains how we collect, use, and protect your information in accordance
          with the <strong style={{ color: '#1D4ED8' }}>Personal Data Protection Act (2022)</strong> of the United Republic of Tanzania.
        </div>

        {/* Key principles strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.875rem',
          marginBottom: '2.5rem',
        }}>
          {[
            { icon: '🚫', label: 'No Data Sales',     sub: 'We never sell your data',      color: '#DC2626', bg: 'rgba(220,38,38,0.06)',  border: 'rgba(220,38,38,0.2)'  },
            { icon: '🔐', label: 'SSL Encrypted',     sub: 'All traffic is secured',        color: '#1D4ED8', bg: 'rgba(29,78,216,0.06)',  border: 'rgba(29,78,216,0.2)'  },
            { icon: '🏦', label: 'PCI Compliant',     sub: 'No card data stored',           color: '#1A6B3C', bg: 'rgba(26,107,60,0.06)',  border: 'rgba(26,107,60,0.2)'  },
            { icon: '⚖️', label: 'PDPA 2022',         sub: 'Tanzania data law compliant',   color: '#6D28D9', bg: 'rgba(109,40,217,0.06)', border: 'rgba(109,40,217,0.2)' },
          ].map(b => (
            <div key={b.label} style={{
              background: b.bg, border: `1px solid ${b.border}`,
              borderRadius: '10px', padding: '0.875rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '0.3rem',
            }}>
              <span style={{ fontSize: '1.375rem' }}>{b.icon}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: b.color }}>{b.label}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{b.sub}</span>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {SECTIONS.map(section => (
            <section
              key={section.number}
              id={`section-${section.number}`}
              style={{
                background: '#fff',
                border: '1px solid var(--c-border)',
                borderRadius: '12px',
                overflow: 'hidden',
                scrollMarginTop: '80px',
              }}
            >
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '1.125rem 1.5rem',
                background: '#FAFAF7',
                borderBottom: '1px solid var(--c-border)',
              }}>
                <span style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: '#0F172A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.125rem', flexShrink: 0,
                }}>
                  {section.icon}
                </span>
                <div>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--c-gold)',
                    marginBottom: '0.15rem',
                  }}>
                    Section {section.number}
                  </div>
                  <h2 style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(0.9rem, 2vw, 1.0625rem)',
                    fontWeight: 800, color: '#1A1A1A',
                    letterSpacing: '0.01em', lineHeight: 1.2,
                  }}>
                    {section.title}
                  </h2>
                </div>
              </div>

              {/* Section body */}
              <div style={{ padding: '0.25rem 1.5rem 1rem' }}>
                {section.content.map((item, i) => {
                  if (item.type === 'rights') return <RightsGrid key={i} />;
                  if (item.type === 'p') return (
                    <p key={i} style={{
                      margin: '1rem 0 0.5rem',
                      fontSize: '0.9375rem', color: '#3D3D3D', lineHeight: 1.8,
                    }}>
                      {item.text}
                    </p>
                  );
                  return <ClauseRow key={item.id} clause={item} />;
                })}
              </div>
            </section>
          ))}
        </div>

        {/* DPO contact CTA */}
        <div style={{
          marginTop: '2.5rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid rgba(147,197,253,0.15)',
          borderRadius: '12px',
          padding: '1.75rem 1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '1rem',
        }}>
          <div style={{ fontSize: '1.75rem' }}>🛡️</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '1.0625rem',
              fontWeight: 800, color: '#fff', marginBottom: '0.375rem',
            }}>
              Questions about your data?
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Contact our Data Protection Officer — we respond within 30 days as required by PDPA (2022).
            </div>
          </div>
          <a
            href="https://naneka.co.tz/#contact"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              background: 'var(--c-gold)', color: '#0F172A',
              borderRadius: '8px', textDecoration: 'none',
              fontSize: '0.875rem', fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Contact Data Protection Officer →
          </a>
        </div>

        {/* Cross-links to other legal pages */}
        <div style={{
          marginTop: '1.25rem',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem',
        }}>
          {[
            { label: 'Terms & Conditions', href: '/terms' },
            { label: 'Returns & Refunds Policy', href: '/returns' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '1rem 1.25rem',
                background: '#fff', border: '1px solid var(--c-border)',
                borderRadius: '10px', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: '0.875rem', color: '#1A1A1A', fontWeight: 600,
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
        background: '#0F172A',
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
