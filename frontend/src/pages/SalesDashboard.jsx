/**
 * Sales Dashboard — /admin/sales
 *
 * Summary cards: Revenue, COGS, Margin, Tax
 * SVG line/area chart: daily / weekly / monthly
 * Top products table
 * Data export: customers CSV, inventory CSV, sales report CSV (with date range)
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { NanekaLogo } from './Storefront.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return Math.round(n).toLocaleString();
}

function fmtFull(n) {
  return Math.round(n).toLocaleString();
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const GOLD     = '#C5A021';
const GOLD_A15 = 'rgba(197,160,33,0.15)';
const TH = {
  padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700,
  color: 'var(--c-text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase',
  background: '#FAFAFA', borderBottom: '2px solid var(--c-border)', whiteSpace: 'nowrap',
};
const TD = {
  padding: '0.8rem 1rem', borderBottom: '1px solid var(--c-border)',
  verticalAlign: 'middle', fontSize: '0.875rem',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, icon, note }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--c-border)',
      borderTop: `3px solid ${accent}`, borderRadius: 'var(--radius)',
      padding: '1.25rem 1.5rem', flex: '1', minWidth: '160px',
      boxShadow: '0 2px 12px rgba(45,45,45,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: accent, fontFamily: 'var(--font-serif)', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--c-text-muted)', marginTop: '0.4rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
          {sub && <div style={{ fontSize: '0.7rem', color: 'var(--c-text-dim)', marginTop: '0.2rem' }}>{sub}</div>}
        </div>
        {icon && <span style={{ fontSize: '1.5rem', opacity: 0.2 }}>{icon}</span>}
      </div>
      {note && <div style={{ marginTop: '0.625rem', fontSize: '0.68rem', color: 'var(--c-text-dim)', borderTop: '1px solid var(--c-border)', paddingTop: '0.5rem' }}>{note}</div>}
    </div>
  );
}

// ─── SVG Chart ───────────────────────────────────────────────────────────────

function RevenueChart({ points, period }) {
  const W = 800;
  const H = 200;
  const PAD = { top: 20, right: 16, bottom: 44, left: 64 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  if (!points || points.length === 0) return null;

  const maxRev = Math.max(...points.map(p => p.revenue), 1);
  // Nice ceiling
  const mag    = Math.pow(10, Math.floor(Math.log10(maxRev)));
  const ceil   = Math.ceil(maxRev / mag) * mag;

  const x = (i) => PAD.left + (i / (points.length - 1)) * chartW;
  const y = (v) => PAD.top  + chartH - (v / ceil) * chartH;

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.revenue)}`).join(' ');
  const areaD = `${lineD} L${x(points.length-1)},${PAD.top+chartH} L${x(0)},${PAD.top+chartH} Z`;

  // Y gridlines
  const gridCount = 4;
  const grids = Array.from({ length: gridCount + 1 }, (_, i) => (ceil / gridCount) * i);

  // X labels: show every nth to avoid overlap
  const step = points.length <= 8 ? 1 : points.length <= 14 ? 2 : Math.ceil(points.length / 7);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      aria-label={`Revenue chart — ${period}`}
    >
      <defs>
        <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={GOLD} stopOpacity="0.25" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {grids.map(v => (
        <g key={v}>
          <line
            x1={PAD.left} y1={y(v)} x2={PAD.left + chartW} y2={y(v)}
            stroke="var(--c-border)" strokeWidth="1" strokeDasharray="3 4"
          />
          <text
            x={PAD.left - 8} y={y(v) + 4}
            textAnchor="end" fontSize="10" fill="var(--c-text-dim)" fontFamily="var(--font-sans)"
          >
            {fmt(v)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaD} fill="url(#rev-fill)" />

      {/* Line */}
      <path d={lineD} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.revenue)} r="4"
          fill={p.revenue > 0 ? '#fff' : 'transparent'}
          stroke={p.revenue > 0 ? GOLD : 'transparent'} strokeWidth="2"
        >
          <title>{p.label}: TZS {fmtFull(p.revenue)} ({p.orders} orders)</title>
        </circle>
      ))}

      {/* X axis labels */}
      {points.map((p, i) => {
        if (i % step !== 0 && i !== points.length - 1) return null;
        return (
          <text
            key={i}
            x={x(i)} y={H - 6}
            textAnchor="middle" fontSize="10" fill="var(--c-text-dim)" fontFamily="var(--font-sans)"
          >
            {p.label}
          </text>
        );
      })}

      {/* X axis line */}
      <line
        x1={PAD.left} y1={PAD.top + chartH}
        x2={PAD.left + chartW} y2={PAD.top + chartH}
        stroke="var(--c-border)" strokeWidth="1"
      />
    </svg>
  );
}

// ─── Export section ───────────────────────────────────────────────────────────

function ExportSection() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  function download(url) {
    const a = document.createElement('a');
    a.href = url;
    a.click();
  }

  function downloadSales() {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to)   params.set('to',   to);
    download(`/api/v1/admin/export/sales${params.toString() ? '?' + params : ''}`);
  }

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.625rem 1.125rem', fontSize: '0.8125rem', fontWeight: 700,
    borderRadius: '8px', cursor: 'pointer', border: `1px solid ${GOLD_A15}`,
    background: GOLD_A15, color: GOLD, transition: 'all 0.15s',
  };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 2px 20px rgba(45,45,45,0.07)' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', background: `linear-gradient(90deg,#fff,${GOLD_A15})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: GOLD_A15, border: `1px solid rgba(197,160,33,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>↓</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Download Data</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Export as CSV — opens in Excel or Google Sheets</p>
          </div>
        </div>
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Row 1: Quick exports */}
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
          <button style={btnStyle} onClick={() => download('/api/v1/admin/export/customers')}>
            <span>👥</span> Customer Contact List
          </button>
          <button style={btnStyle} onClick={() => download('/api/v1/admin/export/inventory')}>
            <span>📦</span> Full SKU / Inventory List
          </button>
        </div>

        {/* Row 2: Sales report with date range */}
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--c-border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--c-border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)' }} />
          </div>
          <button style={{ ...btnStyle, background: GOLD, color: '#000', border: 'none', boxShadow: '0 2px 8px rgba(197,160,33,0.3)' }} onClick={downloadSales}>
            <span>📊</span> Download Sales Report
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--c-text-dim)' }}>Leave dates empty to download all-time sales report.</p>
      </div>
    </div>
  );
}

// ─── Top Products table ───────────────────────────────────────────────────────

function TopProductsTable({ products }) {
  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--c-text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
        <p style={{ fontSize: '0.875rem' }}>No products available. Add products to see them here.</p>
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            {['#', 'Product', 'SKU', 'Category', 'Price (TZS)', 'Cost (TZS)', 'Stock', 'Est. Margin'].map(h => (
              <th key={h} style={{ ...TH, textAlign: ['Price (TZS)', 'Cost (TZS)', 'Stock', 'Est. Margin'].includes(h) ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const marginPct = p.cost_price
              ? (((p.price - p.cost_price) / p.price) * 100).toFixed(0)
              : '~40';
            return (
              <tr key={p.id}
                style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(197,160,33,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA')}
              >
                <td style={{ ...TD, color: 'var(--c-text-dim)', fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}</td>
                <td style={{ ...TD, fontWeight: 600, maxWidth: 220 }}>{p.name}</td>
                <td style={{ ...TD, fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--c-text-muted)' }}>{p.sku ?? '—'}</td>
                <td style={TD}>
                  {p.category && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, background: GOLD_A15, color: GOLD, border: `1px solid rgba(197,160,33,0.25)`, borderRadius: 4, padding: '0.1rem 0.4rem' }}>{p.category}</span>
                  )}
                  {p.subcategory && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--c-text-muted)', marginLeft: 4 }}>{p.subcategory}</span>
                  )}
                </td>
                <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: GOLD }}>{Number(p.price).toLocaleString()}</td>
                <td style={{ ...TD, textAlign: 'right', color: 'var(--c-text-muted)' }}>{p.cost_price ? Number(p.cost_price).toLocaleString() : '—'}</td>
                <td style={{ ...TD, textAlign: 'right' }}>{p.stock_qty ?? 0}</td>
                <td style={{ ...TD, textAlign: 'right' }}>
                  <span style={{ fontWeight: 600, color: parseInt(marginPct) >= 30 ? 'var(--c-success)' : 'var(--c-text)' }}>
                    {marginPct}%{!p.cost_price && <span style={{ fontSize: '0.65rem', color: 'var(--c-text-dim)' }}> est.</span>}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function SalesDashboard() {
  const [summary,   setSummary]   = useState(null);
  const [chart,     setChart]     = useState(null);
  const [topProd,   setTopProd]   = useState([]);
  const [period,    setPeriod]    = useState('daily');
  const [loading,   setLoading]   = useState(true);
  const [chartLoad, setChartLoad] = useState(false);
  const [error,     setError]     = useState(null);

  // Load summary + initial chart in parallel
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      axios.get('/api/v1/admin/sales/summary'),
      axios.get(`/api/v1/admin/sales/chart?period=${period}`),
      axios.get('/api/v1/admin/sales/top-products'),
    ])
      .then(([s, c, t]) => {
        setSummary(s.data);
        setChart(c.data);
        setTopProd(t.data.top_products ?? []);
      })
      .catch(err => setError(err.response?.data?.error?.message ?? err.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadChart = useCallback(async (p) => {
    setChartLoad(true);
    try {
      const { data } = await axios.get(`/api/v1/admin/sales/chart?period=${p}`);
      setChart(data);
    } catch { /* keep old data */ }
    finally { setChartLoad(false); }
  }, []);

  function changePeriod(p) {
    setPeriod(p);
    loadChart(p);
  }

  const periodBtn = (p, label) => ({
    padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 700,
    borderRadius: 6, border: 'none', cursor: 'pointer',
    background: period === p ? GOLD     : 'transparent',
    color:      period === p ? '#000'   : 'var(--c-text-muted)',
    boxShadow:  period === p ? '0 2px 8px rgba(197,160,33,0.28)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', fontFamily: 'var(--font-sans)', color: 'var(--c-text)' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--c-border)', boxShadow: '0 1px 0 rgba(197,160,33,0.15), 0 2px 12px rgba(45,45,45,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <NanekaLogo size="sm" />
            <div style={{ width: 1, height: 28, background: 'var(--c-border)' }} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Sales Dashboard
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: GOLD_A15, color: GOLD, border: `1px solid rgba(197,160,33,0.3)`, borderRadius: 4, padding: '0.1rem 0.45rem' }}>Analytics</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Revenue · COGS · Margin · Tax · Exports</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="/admin" className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>← Admin</a>
            <a href="/"      className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>← Storefront</a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(1.5rem,3vw,2rem) clamp(1rem,3vw,2rem)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Revenue & Sales Analytics</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', marginTop: '0.25rem' }}>
            All figures in TZS. Tax calculated at 18% VAT (inclusive). COGS estimated at 60% of ex-VAT revenue.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--c-text-muted)' }}>
            <span className="spinner" style={{ width: '1.75rem', height: '1.75rem', color: GOLD }} />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Loading sales data…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', color: 'var(--c-error)', fontSize: '0.875rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && summary && (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <StatCard
                label="Total Revenue (incl. VAT)"
                value={`TZS ${fmt(summary.revenue)}`}
                sub={`Today: TZS ${fmt(summary.today_revenue)} · Week: TZS ${fmt(summary.week_revenue)}`}
                accent={GOLD} icon="💰"
              />
              <StatCard
                label="Revenue excl. VAT"
                value={`TZS ${fmt(summary.revenue_ex_vat)}`}
                sub={`${summary.paid_orders} paid orders of ${summary.total_orders} total`}
                accent="#1D4ED8" icon="📈"
              />
              <StatCard
                label={`Est. COGS (60% ex-VAT)`}
                value={`TZS ${fmt(summary.cogs)}`}
                accent="#B45309" icon="🏭"
                note={summary.cogs_note}
              />
              <StatCard
                label={`Gross Margin (${summary.margin_pct}%)`}
                value={`TZS ${fmt(summary.margin)}`}
                accent="var(--c-success)" icon="📊"
              />
              <StatCard
                label={`VAT Collected (${summary.tax_rate}%)`}
                value={`TZS ${fmt(summary.tax)}`}
                sub="Tanzania VAT — 18% inclusive"
                accent="#7C3AED" icon="🧾"
              />
            </div>

            {/* Revenue Chart */}
            <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 2px 20px rgba(45,45,45,0.07)' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', background: `linear-gradient(90deg,#fff,${GOLD_A15})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: GOLD_A15, border: `1px solid rgba(197,160,33,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📉</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Revenue Over Time</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>
                      {period === 'daily' ? 'Last 14 days' : period === 'weekly' ? 'Last 12 weeks' : 'Last 12 months'} · TZS
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', background: 'var(--c-surface-2)', borderRadius: 8, padding: '0.25rem', border: '1px solid var(--c-border)' }}>
                  {[['daily','Daily'],['weekly','Weekly'],['monthly','Monthly']].map(([p, l]) => (
                    <button key={p} style={periodBtn(p, l)} onClick={() => changePeriod(p)}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '1.5rem', position: 'relative' }}>
                {chartLoad && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 2 }}>
                    <span className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: GOLD }} />
                  </div>
                )}
                {chart?.points?.length > 0 ? (
                  <RevenueChart points={chart.points} period={period} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>No revenue data yet for this period.</div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 2px 20px rgba(45,45,45,0.07)' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', background: `linear-gradient(90deg,#fff,${GOLD_A15})` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: GOLD_A15, border: `1px solid rgba(197,160,33,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🏆</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Top Products by Revenue Potential</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Ranked by price · Order-item tracking coming in v2</p>
                  </div>
                </div>
              </div>
              <TopProductsTable products={topProd} />
            </div>

            {/* Export */}
            <ExportSection />
          </>
        )}
      </main>
    </div>
  );
}
