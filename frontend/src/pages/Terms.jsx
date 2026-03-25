import { NanekaLogo } from './Storefront.jsx';

const SECTIONS = [
  {
    number: '1',
    title: 'BINDING AGREEMENT',
    content: [
      {
        type: 'p',
        text: "By accessing and using naneka.co.tz ('the Site'), you ('the Customer') agree to be legally bound by these Terms and Conditions. This Site is owned and operated by Naneka Platforms, a registered business in the United Republic of Tanzania.",
      },
    ],
  },
  {
    number: '2',
    title: 'ELIGIBILITY AND ACCOUNT SECURITY',
    content: [
      { type: 'clause', id: '2.1', text: 'To make a purchase, you must be 18 years of age or older or be under the supervision of a parent/guardian.' },
      { type: 'clause', id: '2.2', text: 'You are responsible for maintaining the confidentiality of your account password. Naneka shall not be held liable for any loss resulting from unauthorized access to your account due to your negligence.' },
    ],
  },
  {
    number: '3',
    title: 'PRICING AND PRODUCT AVAILABILITY',
    content: [
      { type: 'clause', id: '3.1', text: 'All prices are listed in Tanzanian Shillings (TZS) and are inclusive of applicable taxes unless stated otherwise.' },
      { type: 'clause', id: '3.2', label: 'Kariakoo Market Dynamics', text: 'Due to the fast-moving nature of the Kariakoo market, stock levels may change rapidly. If an item becomes unavailable after payment, Naneka will offer an immediate alternative or a full refund within 48 hours.' },
      { type: 'clause', id: '3.3', label: 'Pricing Errors', text: 'In the event of a manifest technical error where a product is listed at an incorrect price (e.g., TZS 1,000 instead of TZS 100,000), Naneka reserves the right to cancel the order as per the Electronic Transactions Act (Cap 442).' },
    ],
  },
  {
    number: '4',
    title: 'PAYMENT TERMS',
    content: [
      { type: 'clause', id: '4.1', text: 'We accept M-Pesa, Tigo Pesa, Airtel Money, and authorized Credit/Debit cards via Flutterwave.' },
      { type: 'clause', id: '4.2', label: 'Cash on Delivery (CoD)', text: "CoD is available for selected locations in Dar es Salaam only. For 'Mikoani' orders, full payment must be cleared before dispatch." },
      { type: 'clause', id: '4.3', text: "Payment is only deemed 'Received' once a valid Network Transaction ID is verified by our system." },
    ],
  },
  {
    number: '5',
    title: 'DELIVERY AND RISK OF LOSS',
    content: [
      { type: 'clause', id: '5.1', label: 'Dar es Salaam', text: 'Delivery is typically within 3–24 hours.' },
      { type: 'clause', id: '5.2', label: 'Upcountry (Mikoani)', text: "We facilitate delivery via reputable bus services or couriers. Naneka's responsibility ends once the goods are safely handed over to the third-party carrier and a tracking/dispatch receipt is issued to the customer." },
      { type: 'clause', id: '5.3', label: 'Inspection', text: 'Customers are advised to inspect the package for physical damage before signing the delivery note.' },
    ],
  },
  {
    number: '6',
    title: 'INTELLECTUAL PROPERTY',
    content: [
      { type: 'p', text: 'All content on this site, including logos, designs, and AI-generated images, is the property of Naneka. Unauthorized reproduction is strictly prohibited under the Copyright and Neighboring Rights Act.' },
    ],
  },
  {
    number: '7',
    title: 'LIMITATION OF LIABILITY',
    content: [
      { type: 'p', text: 'Naneka shall not be liable for any indirect, incidental, or consequential damages arising from the use of products purchased on our platform, beyond the purchase price of the item.' },
    ],
  },
  {
    number: '8',
    title: 'GOVERNING LAW',
    content: [
      { type: 'p', text: 'These terms are governed by the laws of the United Republic of Tanzania. Any disputes shall be subject to the exclusive jurisdiction of the courts in Dar es Salaam.' },
    ],
  },
];

function ClauseRow({ clause }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3.5rem 1fr',
      gap: '0.75rem',
      padding: '0.875rem 0',
      borderBottom: '1px solid #F0EDE6',
    }}>
      <span style={{
        fontSize: '0.75rem', fontWeight: 700,
        color: 'var(--c-gold)', letterSpacing: '0.04em',
        paddingTop: '0.1rem', flexShrink: 0,
      }}>
        {clause.id}
      </span>
      <p style={{ margin: 0, fontSize: '0.9375rem', color: '#3D3D3D', lineHeight: 1.75 }}>
        {clause.label && (
          <strong style={{ color: '#1A1A1A', fontWeight: 700 }}>{clause.label}: </strong>
        )}
        {clause.text}
      </p>
    </div>
  );
}

export default function Terms() {
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
              letterSpacing: '0.04em',
              transition: 'color 0.15s',
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
        background: 'linear-gradient(135deg, #1A1A1A 0%, #252525 100%)',
        borderBottom: '3px solid var(--c-gold)',
        padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)',
          marginBottom: '0.75rem',
        }}>
          Legal · Naneka Platforms
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 900, color: '#FFFFFF',
          letterSpacing: '-0.02em', margin: '0 0 0.75rem',
          lineHeight: 1.1,
        }}>
          Terms &amp; Conditions
        </h1>
        <p style={{
          fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)',
          margin: 0, letterSpacing: '0.02em',
        }}>
          General Sales Agreement · Last Updated: <strong style={{ color: 'rgba(255,255,255,0.65)' }}>March 24, 2026</strong>
        </p>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 3.5rem) 1.5rem 5rem' }}>

        {/* Preamble notice */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--c-border)',
          borderLeft: '4px solid var(--c-gold)',
          borderRadius: '0 8px 8px 0',
          padding: '1rem 1.25rem',
          marginBottom: '2.5rem',
          fontSize: '0.875rem',
          color: 'var(--c-text-muted)',
          lineHeight: 1.7,
        }}>
          Please read these Terms and Conditions carefully before using the Naneka platform.
          By placing an order, you confirm that you have read, understood, and agreed to these terms in full.
        </div>

        {/* Table of contents */}
        <nav style={{
          background: '#fff',
          border: '1px solid var(--c-border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '3rem',
        }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'var(--c-gold)',
            marginBottom: '1rem',
          }}>
            Contents
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {SECTIONS.map(s => (
              <li key={s.number} style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-gold)', minWidth: '1.25rem' }}>
                  {s.number}.
                </span>
                <a
                  href={`#section-${s.number}`}
                  style={{
                    fontSize: '0.9rem', color: 'var(--c-text-muted)',
                    textDecoration: 'none', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-muted)')}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
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
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.125rem 1.5rem',
                background: '#FAFAF7',
                borderBottom: '1px solid var(--c-border)',
              }}>
                <span style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--c-gold)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 800, flexShrink: 0,
                }}>
                  {section.number}
                </span>
                <h2 style={{
                  margin: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
                  fontWeight: 800,
                  color: '#1A1A1A',
                  letterSpacing: '0.01em',
                }}>
                  {section.title}
                </h2>
              </div>

              {/* Section body */}
              <div style={{ padding: '0.25rem 1.5rem 1rem' }}>
                {section.content.map((item, i) =>
                  item.type === 'p' ? (
                    <p key={i} style={{
                      margin: '1rem 0 0.5rem',
                      fontSize: '0.9375rem',
                      color: '#3D3D3D',
                      lineHeight: 1.8,
                    }}>
                      {item.text}
                    </p>
                  ) : (
                    <ClauseRow key={item.id} clause={item} />
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: '3rem',
          padding: '1.25rem 1.5rem',
          background: '#fff',
          border: '1px solid var(--c-border)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'flex-start', gap: '1rem',
          fontSize: '0.85rem', color: 'var(--c-text-muted)', lineHeight: 1.7,
        }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🇹🇿</span>
          <div>
            These Terms &amp; Conditions are governed by the laws of the <strong style={{ color: '#1A1A1A' }}>United Republic of Tanzania</strong>.
            For questions, contact us via WhatsApp or email before placing your order.
            Naneka Platforms reserves the right to update these terms at any time — the "Last Updated" date above reflects the most recent revision.
          </div>
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
