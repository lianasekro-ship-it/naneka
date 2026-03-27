import { NanekaLogo } from './Storefront.jsx';

const NON_RETURNABLE = [
  'Innerwear (Underwear, Boxers, Vests)',
  'Socks and Stockings',
  'Earrings and Body Jewelry',
  'Fragrances and Beauty Products once the seal is broken',
];

const SECTIONS = [
  {
    number: '1',
    title: "THE 7-DAY 'COOLING OFF' PERIOD",
    icon: '📅',
    content: [
      { type: 'clause', id: '1.1', text: 'In accordance with Tanzanian Consumer Law, customers have 7 calendar days from the date of delivery to initiate a return request.' },
      { type: 'clause', id: '1.2', label: 'Condition of Return', text: 'For a return to be accepted, the item must be in its ORIGINAL, UNOPENED, AND FACTORY-SEALED PACKAGING. All tags, manuals, and accessories must be intact.', highlight: true },
      { type: 'clause', id: '1.3', label: 'Rejection', text: 'If the factory seal is broken, or the item shows signs of use, wear, or damage, the return will be rejected and sent back to the customer at their expense.', warning: true },
    ],
  },
  {
    number: '2',
    title: 'CATEGORY-SPECIFIC RULES (ELECTRONICS & GADGETS)',
    icon: '📱',
    content: [
      { type: 'clause', id: '2.1', label: 'Phones, Laptops, TVs, and Smartwatches', text: "Due to the technical nature of these goods, Naneka operates an EXCHANGE ONLY policy. We do not offer cash refunds for 'change of mind' or 'wrong choice' once the product has been delivered.", highlight: true },
      { type: 'clause', id: '2.2', label: 'Technical Faults', text: "If an electronic item has a technical factory defect, it will be handled under the Manufacturer's Warranty. Naneka will facilitate the repair or replacement process as per the brand's policy." },
      { type: 'clause', id: '2.3', label: 'Dead on Arrival (DOA)', text: 'If an item fails to turn on upon delivery, you must notify Naneka within 24 hours. We will verify the fault and provide an immediate exchange.', urgent: true },
    ],
  },
  {
    number: '3',
    title: 'FASHION, APPAREL, AND HYGIENE',
    icon: '👗',
    content: [
      { type: 'clause', id: '3.1', text: 'Clothing items must be unworn and unwashed with original tags.' },
      { type: 'non-returnable' },
    ],
  },
  {
    number: '4',
    title: 'RETURN PROCESS (KARIAKOO HUB)',
    icon: '📦',
    content: [
      { type: 'clause', id: '4.1', label: 'Initiation', text: "To start a return, click the 'Request Return' button in your account or message our WhatsApp support." },
      { type: 'clause', id: '4.2', label: 'Inspection', text: 'All returned items must be brought or sent to our Kariakoo Collection Point. Our technicians will conduct a 48-hour inspection to verify the condition and authenticity of the item.' },
      { type: 'clause', id: '4.3', label: 'Shipping Costs', text: 'Unless the item was delivered wrongly or is defective, the customer is responsible for all shipping costs involved in returning the item to us.', warning: true },
    ],
  },
  {
    number: '5',
    title: 'REFUND DISBURSEMENT',
    icon: '💳',
    content: [
      { type: 'clause', id: '5.1', label: 'Approved Refunds', text: 'If a refund is approved (e.g., for out-of-stock items already paid for), it will be processed within 14 business days.' },
      { type: 'clause', id: '5.2', label: 'Method', text: 'Refunds are sent via the original payment method. If you paid via M-Pesa, the refund will be sent to the same M-Pesa number.' },
    ],
  },
  {
    number: '6',
    title: 'FINAL DECISION',
    icon: '⚖️',
    content: [
      { type: 'p', text: 'Naneka reserves the right to make the final decision on all return requests based on the physical condition of the item during inspection.' },
    ],
  },
];

function ClauseRow({ clause }) {
  const accentColor = clause.urgent
    ? '#DC2626'
    : clause.warning
      ? '#B45309'
      : clause.highlight
        ? '#1A6B3C'
        : null;

  const bgColor = clause.urgent
    ? 'rgba(220,38,38,0.04)'
    : clause.warning
      ? 'rgba(180,83,9,0.04)'
      : clause.highlight
        ? 'rgba(26,107,60,0.04)'
        : 'transparent';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3.5rem 1fr',
      gap: '0.75rem',
      padding: '0.875rem 0',
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
        {clause.text}
        {clause.urgent && (
          <span style={{
            display: 'inline-block', marginLeft: '0.5rem',
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#DC2626',
            background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: '4px', padding: '0.1rem 0.4rem', verticalAlign: 'middle',
          }}>
            24-hr window
          </span>
        )}
      </p>
    </div>
  );
}

function NonReturnableBlock() {
  return (
    <div style={{ padding: '0.875rem 0 0.25rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3.5rem 1fr',
        gap: '0.75rem',
        paddingBottom: '0.875rem',
        borderBottom: '1px solid #F0EDE6',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-gold)', paddingTop: '0.125rem' }}>
          3.2
        </span>
        <div>
          <p style={{ margin: '0 0 0.875rem', fontSize: '0.9375rem', color: '#3D3D3D', lineHeight: 1.75 }}>
            <strong style={{ color: '#DC2626', fontWeight: 700 }}>Non-Returnable Items: </strong>
            For hygiene and health reasons, we <strong>CANNOT</strong> accept returns or exchanges on:
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {NON_RETURNABLE.map((item, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                background: 'rgba(220,38,38,0.04)',
                border: '1px solid rgba(220,38,38,0.15)',
                borderRadius: '8px',
                fontSize: '0.875rem', color: '#3D3D3D', lineHeight: 1.6,
              }}>
                <span style={{ color: '#DC2626', fontWeight: 700, flexShrink: 0, marginTop: '0.05rem' }}>✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Returns() {
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
          Customer Protection · Naneka Platforms
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 900, color: '#FFFFFF',
          letterSpacing: '-0.02em', margin: '0 0 0.75rem',
          lineHeight: 1.1,
        }}>
          Returns &amp; Refunds Policy
        </h1>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: '999px', padding: '0.35rem 1rem',
          fontSize: '0.8rem', color: 'var(--c-gold)', fontWeight: 700,
          letterSpacing: '0.04em', marginBottom: '0.875rem',
        }}>
          ✦ Naneka 7-Day Guarantee
        </div>
        <p style={{
          fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)',
          margin: 0, letterSpacing: '0.02em', display: 'block',
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
          borderLeft: '4px solid var(--c-gold)',
          borderRadius: '0 8px 8px 0',
          padding: '1rem 1.25rem',
          marginBottom: '2.5rem',
          fontSize: '0.9375rem',
          color: '#3D3D3D',
          lineHeight: 1.8,
        }}>
          At Naneka, we strive to provide the best Kariakoo shopping experience. However, to keep our prices low and
          protect our high-value inventory, we operate under a <strong style={{ color: '#1A1A1A' }}>strict and fair Return Policy</strong>.
        </div>

        {/* Quick-reference badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.875rem',
          marginBottom: '2.5rem',
        }}>
          {[
            { icon: '📅', label: '7-Day Window',       sub: 'From delivery date',       color: '#1A6B3C', bg: 'rgba(26,107,60,0.06)',  border: 'rgba(26,107,60,0.2)' },
            { icon: '🔒', label: 'Sealed Packaging',   sub: 'Required for all returns',  color: '#B45309', bg: 'rgba(180,83,9,0.06)',   border: 'rgba(180,83,9,0.2)'  },
            { icon: '🔄', label: 'Exchange Only',      sub: 'Electronics policy',        color: '#1D4ED8', bg: 'rgba(29,78,216,0.06)',  border: 'rgba(29,78,216,0.2)' },
            { icon: '⏰', label: '14 Business Days',   sub: 'Refund processing time',    color: '#6D28D9', bg: 'rgba(109,40,217,0.06)', border: 'rgba(109,40,217,0.2)'},
          ].map(b => (
            <div key={b.label} style={{
              background: b.bg,
              border: `1px solid ${b.border}`,
              borderRadius: '10px',
              padding: '0.875rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
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
                  background: '#1A1A1A',
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
                    fontWeight: 800,
                    color: '#1A1A1A',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                  }}>
                    {section.title}
                  </h2>
                </div>
              </div>

              {/* Section body */}
              <div style={{ padding: '0.25rem 1.5rem 1rem' }}>
                {section.content.map((item, i) => {
                  if (item.type === 'non-returnable') return <NonReturnableBlock key={i} />;
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

        {/* CTA — WhatsApp contact */}
        <div style={{
          marginTop: '2.5rem',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #252525 100%)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '12px',
          padding: '1.75rem 1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '1rem',
        }}>
          <div style={{ fontSize: '1.75rem' }}>💬</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '1.0625rem',
              fontWeight: 800, color: '#fff', marginBottom: '0.375rem',
            }}>
              Need to initiate a return?
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Contact our support team on WhatsApp — available 7 days a week.
            </div>
          </div>
          <a
            href={`https://wa.me/${import.meta.env.VITE_WA_BUSINESS_NUMBER || '255713610774'}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              background: '#25D366', color: '#fff',
              borderRadius: '8px', textDecoration: 'none',
              fontSize: '0.875rem', fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            WhatsApp Support →
          </a>
        </div>

        {/* Related policy link */}
        <div style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          background: '#fff',
          border: '1px solid var(--c-border)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
          fontSize: '0.875rem',
        }}>
          <span style={{ color: 'var(--c-text-muted)' }}>Also read our full legal agreement:</span>
          <a
            href="/terms"
            style={{
              color: 'var(--c-gold)', fontWeight: 700, textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Terms &amp; Conditions →
          </a>
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
