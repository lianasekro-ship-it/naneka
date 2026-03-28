/**
 * Admin Dashboard — Orders + Products + Categories
 * Route: /admin
 *
 * Orders tab      → GET /api/v1/orders          (auto-refresh 30 s)
 * Products tab    → GET /api/v1/admin/products  (with ?category= filter)
 *                   POST   /api/v1/admin/products
 *                   PATCH  /api/v1/admin/products/:id   (visibility toggle)
 *                   DELETE /api/v1/admin/products/:id
 * Categories tab  → GET    /api/v1/admin/categories
 *                   POST   /api/v1/admin/categories
 *                   DELETE /api/v1/admin/categories/:id
 *                   POST   /api/v1/admin/categories/:id/subcategories
 *                   DELETE /api/v1/admin/subcategories/:id
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { NanekaLogo } from './Storefront.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// ─── Constants ─────────────────────────────────────────────────────────────────
const REFRESH_MS = 30_000;

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_META = {
  pending_payment:  { label: 'Pending Payment',   cls: 'badge-pending'  },
  paid:             { label: 'Paid',               cls: 'badge-paid'     },
  preparing:        { label: 'Preparing',          cls: 'badge-process'  },
  ready_for_pickup: { label: 'Ready for Pickup',   cls: 'badge-paid'     },
  processing:       { label: 'Processing',         cls: 'badge-process'  },
  out_for_delivery: { label: 'Out for Delivery',   cls: 'badge-delivery' },
  delivered:        { label: 'Delivered',          cls: 'badge-done'     },
  cancelled:        { label: 'Cancelled',          cls: 'badge-cancel'   },
};

// ─── Small shared components ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, cls: 'badge-pending' };
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

function AddressTypeBadge({ address }) {
  if (!address) return null;
  const MAP = [
    { prefix: 'NAPA:',     label: 'NAPA',     bg: 'rgba(197,160,33,0.12)',  color: 'var(--c-gold)',    border: 'rgba(197,160,33,0.35)' },
    { prefix: 'Landmark:', label: 'Landmark', bg: 'rgba(8,145,178,0.10)',   color: '#0891B2',           border: 'rgba(8,145,178,0.3)'   },
    { prefix: 'GPS',       label: 'GPS',      bg: 'rgba(46,125,82,0.10)',   color: 'var(--c-success)', border: 'rgba(46,125,82,0.3)'   },
  ];
  const hit = MAP.find(m => address.startsWith(m.prefix));
  if (!hit) return null;
  return (
    <span style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: hit.bg, color: hit.color, border: `1px solid ${hit.border}`, borderRadius: '4px', padding: '0.1rem 0.4rem', marginRight: '0.375rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{hit.label}</span>
  );
}

function SheetSyncBadge({ order }) {
  const synced = order.sheets_synced ?? order.gsheet_synced ?? (order.synced_at != null) ?? false;
  return synced ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-success)', background: 'var(--c-success-light)', border: '1px solid rgba(46,125,82,0.25)', borderRadius: '999px', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>✓ Synced</span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-dim)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '999px', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>○ Pending</span>
  );
}

function StatCard({ label, value, accent, icon }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--c-border)', borderTop: `3px solid ${accent}`, borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem', flex: '1', minWidth: '130px', boxShadow: '0 2px 12px rgba(45,45,45,0.06)', position: 'relative', overflow: 'hidden' }}>
      {icon && <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.25rem', opacity: 0.18 }}>{icon}</div>}
      <div style={{ fontSize: '2rem', fontWeight: 800, color: accent, fontFamily: 'var(--font-serif)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', marginTop: '0.4rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

/* ─── Toggle Switch ───────────────────────────────────────────────────────── */
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <label
      title={checked ? 'Visible — click to hide' : 'Hidden — click to show'}
      style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', cursor: disabled ? 'default' : 'pointer', flexShrink: 0, opacity: disabled ? 0.5 : 1 }}
    >
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '999px',
        background: checked ? '#22C55E' : '#CBD5E0',
        transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: '3px',
          left: checked ? '19px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </span>
    </label>
  );
}

// ─── CSV export (orders) ───────────────────────────────────────────────────────
function escapeCell(v) {
  if (v == null) return '""';
  return `"${String(v).replace(/"/g, '""')}"`;
}
function downloadCSV(orders) {
  const headers = ['Order ID', 'Customer Name', 'Phone Number', 'Amount', 'Currency', 'Status', 'Address Type', 'Delivery Address', 'Sheet Sync', 'Date'];
  const rows = orders.map(o => {
    const addrType = o.delivery_address?.startsWith('NAPA:') ? 'NAPA' : o.delivery_address?.startsWith('Landmark:') ? 'Landmark' : o.delivery_address?.startsWith('GPS') ? 'GPS Pin' : 'Other';
    const synced = (o.sheets_synced ?? o.gsheet_synced ?? (o.synced_at != null)) ? 'Yes' : 'No';
    return [o.id, o.customer_name, o.customer_phone, o.total, o.currency, STATUS_META[o.status]?.label ?? o.status, addrType, o.delivery_address, synced, new Date(o.created_at).toLocaleDateString('en-GB')];
  });
  const csv  = [headers, ...rows].map(r => r.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `naneka-orders-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── CSV export (products) ─────────────────────────────────────────────────────
function downloadProductsCSV(products) {
  const headers = ['Product ID', 'Name', 'SKU', 'Brand', 'Category', 'Price (TZS)', 'Cost Price', 'Stock', 'Visible', 'Added'];
  const rows = products.map(p => [
    p.id, p.name, p.sku ?? '', p.brand ?? '', p.category_slug ?? p.category ?? '',
    p.price, p.cost_price ?? '', p.stock_qty ?? p.stock ?? '',
    (p.is_visible ?? true) ? 'Yes' : 'No',
    new Date(p.created_at ?? Date.now()).toLocaleDateString('en-GB'),
  ]);
  const csv  = [headers, ...rows].map(r => r.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `naneka-products-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Shared table styles ───────────────────────────────────────────────────────
const TH = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--c-text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', background: '#FAFAFA', borderBottom: '2px solid var(--c-border)', whiteSpace: 'nowrap' };
const TD = { padding: '0.875rem 1rem', borderBottom: '1px solid var(--c-border)', verticalAlign: 'middle', fontSize: '0.875rem' };

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS TAB
// ══════════════════════════════════════════════════════════════════════════════

const EMPTY_PRO_FORM = {
  name: '', sku: '', brand: '', price: '', costPrice: '', stockQty: '0',
  taxRate: '18', description: '', description_sw: '', categorySlug: '', subcategorySlug: '',
  features: [''], gallery: [''],
};

function FieldLabel({ children }) {
  return (
    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>
      {children}
    </label>
  );
}

function FieldInput({ style, ...props }) {
  return (
    <input {...props}
      style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', ...style }}
    />
  );
}

// ─── AI Photo Upload ──────────────────────────────────────────────────────────
// Drop or pick a product photo → Cloudinary removes background + adds watermark
// → Gemini extracts product name and EN/SW descriptions automatically.
function AiPhotoUpload({ onResult }) {
  const [state,    setState]   = useState('idle'); // idle | uploading | done | error
  const [preview,  setPreview] = useState(null);
  const [result,   setResult]  = useState(null);
  const [errMsg,   setErrMsg]  = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  async function processFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setState('uploading');
    setErrMsg(null);
    setPreview(URL.createObjectURL(file));

    const fd = new FormData();
    fd.append('image', file);

    try {
      const { data } = await api.post('/api/v1/media/ai-process', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setResult(data);
      setState('done');
      onResult(data);
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Upload failed';
      setErrMsg(msg);
      setState('error');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function reset() {
    setState('idle');
    setPreview(null);
    setResult(null);
    setErrMsg(null);
  }

  return (
    <div style={{
      border: `2px dashed ${dragOver ? '#C5A021' : state === 'done' ? '#22C55E' : state === 'error' ? 'var(--c-error)' : 'rgba(197,160,33,0.35)'}`,
      borderRadius: 'var(--radius-lg)',
      background: dragOver ? 'rgba(197,160,33,0.04)' : state === 'done' ? 'rgba(34,197,94,0.04)' : '#FAFAF8',
      padding: '1.25rem',
      transition: 'all 0.2s',
    }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#C5A021,#92700A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>✨</div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-text)' }}>AI Photo Upload</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)' }}>Upload a product photo → auto bg removal, watermark, AI name &amp; descriptions (EN + SW)</div>
        </div>
        {state !== 'idle' && (
          <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer', fontSize: '1.125rem', lineHeight: 1, padding: '0.25rem' }}>×</button>
        )}
      </div>

      {/* Idle state — drop zone */}
      {state === 'idle' && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📸</div>
          <p style={{ margin: '0 0 0.875rem', fontSize: '0.8125rem', color: 'var(--c-text-muted)' }}>
            Drag &amp; drop a product photo here, or
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn btn-gold"
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.8125rem' }}
          >
            Choose Photo
          </button>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.68rem', color: 'var(--c-text-dim)' }}>
            JPEG · PNG · WebP · max 20 MB
          </p>
        </div>
      )}

      {/* Uploading state */}
      {state === 'uploading' && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {preview && (
            <img src={preview} alt="preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, opacity: 0.7 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="spinner" style={{ width: '1rem', height: '1rem', color: '#C5A021' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Processing with AI…</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
              <div>⏳ Removing background…</div>
              <div>🏷️ Adding Naneka watermark…</div>
              <div>🤖 Extracting name &amp; descriptions…</div>
            </div>
          </div>
        </div>
      )}

      {/* Done state */}
      {state === 'done' && result && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {/* Processed image */}
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <img
              src={result.processedUrl ?? result.rawUrl}
              alt="Processed"
              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #22C55E' }}
            />
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#22C55E', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>
          </div>

          {/* AI Results */}
          <div style={{ flex: 1, fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#22C55E', fontWeight: 700, fontSize: '0.875rem' }}>✓ Form filled automatically</span>
              {!result.gemini_available && (
                <span style={{ fontSize: '0.65rem', background: '#FEF3C7', color: '#92700A', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>AI descriptions unavailable — fill manually</span>
              )}
            </div>
            {result.product_name && (
              <div style={{ color: 'var(--c-text-muted)' }}>📦 <strong>{result.product_name}</strong></div>
            )}
            {result.description_en && (
              <div style={{ color: 'var(--c-text-muted)', marginTop: '0.2rem' }}>🇬🇧 {result.description_en.slice(0, 80)}…</div>
            )}
            {result.description_sw && (
              <div style={{ color: 'var(--c-text-muted)', marginTop: '0.2rem' }}>🇹🇿 {result.description_sw.slice(0, 80)}…</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{ flexShrink: 0, padding: '0.4rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer', color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}
          >
            Replace
          </button>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-error)', marginBottom: '0.25rem' }}>Processing failed</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{errMsg}</div>
          </div>
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{ flexShrink: 0, padding: '0.4rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function GalleryImageRow({ value, onChange, onRemove, index }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/api/v1/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.url ?? data.file_url ?? data.path ?? '');
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? 'Unknown error';
      console.error(`[AdminDashboard] Gallery upload failed — HTTP ${status ?? 'Network Error'}:`, msg, err);
      setUploadErr(`Upload failed (${status ?? 'Network Error'}): ${msg}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const removeStyle = { flexShrink: 0, width: 28, height: 28, borderRadius: '6px', border: '1px solid var(--c-border)', background: 'var(--c-error-light)', color: 'var(--c-error)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ flexShrink: 0, padding: '0.55rem 0.875rem', fontSize: '0.78rem', fontWeight: 700, border: '1px solid rgba(197,160,33,0.4)', borderRadius: 'var(--radius-sm)', background: 'rgba(197,160,33,0.06)', color: 'var(--c-gold)', cursor: uploading ? 'default' : 'pointer', whiteSpace: 'nowrap', opacity: uploading ? 0.65 : 1 }}>
          {uploading ? 'Uploading…' : '📁 Upload'}
        </button>
        <FieldInput type="url" placeholder={`Or paste image URL ${index + 1}`} value={value} onChange={e => onChange(e.target.value)} />
        {onRemove && <button type="button" style={removeStyle} onClick={onRemove}>×</button>}
        {value && <img src={value} alt="" style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--c-border)', flexShrink: 0 }} />}
      </div>
      {uploadErr && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--c-error)' }}>{uploadErr}</p>}
    </div>
  );
}

function ProAddForm({ categories, onSaved }) {
  const [form,       setForm]       = useState(EMPTY_PRO_FORM);
  const [formErr,    setFormErr]    = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [open,       setOpen]       = useState(true);

  // Called by AiPhotoUpload when Cloudinary + Gemini processing completes
  function handleAiResult(data) {
    setForm(f => ({
      ...f,
      name:         data.product_name   || f.name,
      description:  data.description_en || f.description,
      description_sw: data.description_sw || f.description_sw,
      gallery:      data.processedUrl
                      ? [data.processedUrl, ...f.gallery.filter(g => g && g !== '')]
                      : f.gallery,
    }));
  }

  const selectedCat = categories.find(c => c.slug === form.categorySlug);
  const subcats     = selectedCat?.subcategories ?? [];

  function set(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === 'categorySlug') next.subcategorySlug = '';
      return next;
    });
  }

  function autoSku() {
    if (!form.name) return;
    const base = form.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 12);
    set('sku', `NAN-${base}`);
  }

  function setFeature(i, val) { setForm(f => { const a = [...f.features]; a[i] = val; return { ...f, features: a }; }); }
  function addFeature()        { setForm(f => ({ ...f, features: [...f.features, ''] })); }
  function removeFeature(i)    { setForm(f => ({ ...f, features: f.features.filter((_, j) => j !== i) })); }

  function setGallery(i, val) { setForm(f => { const a = [...f.gallery]; a[i] = val; return { ...f, gallery: a }; }); }
  function addGallery()        { setForm(f => ({ ...f, gallery: [...f.gallery, ''] })); }
  function removeGallery(i)    { setForm(f => ({ ...f, gallery: f.gallery.filter((_, j) => j !== i) })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormErr(null);
    if (!form.name.trim())        return setFormErr('Product name is required.');
    if (!form.categorySlug)       return setFormErr('Select a category.');
    if (!form.subcategorySlug)    return setFormErr('Select a subcategory.');
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) return setFormErr('Enter a valid price.');
    setSubmitting(true);
    try {
      await api.post('/api/v1/admin/products', {
        name: form.name.trim(), sku: form.sku.trim() || undefined, brand: form.brand.trim() || undefined,
        price, costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        stockQty: parseInt(form.stockQty, 10) || 0, taxRate: parseFloat(form.taxRate) || 18,
        description:    form.description.trim()    || undefined,
        description_sw: form.description_sw.trim() || undefined,
        categorySlug: form.categorySlug, subcategorySlug: form.subcategorySlug,
        features: form.features.map(f => f.trim()).filter(Boolean),
        gallery: form.gallery.map(g => g.trim()).filter(Boolean),
      });
      setForm(EMPTY_PRO_FORM);
      onSaved();
    } catch (err) {
      setFormErr(err.response?.data?.error?.message ?? 'Failed to add product.');
    } finally {
      setSubmitting(false);
    }
  }

  const listItemStyle = { display: 'flex', gap: '0.5rem', alignItems: 'center' };
  const removeBtn = { flexShrink: 0, width: 28, height: 28, borderRadius: '6px', border: '1px solid var(--c-border)', background: 'var(--c-error-light)', color: 'var(--c-error)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 };
  const addRowBtn = { padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, border: '1px dashed var(--c-border)', borderRadius: '6px', background: 'transparent', color: 'var(--c-text-muted)', cursor: 'pointer' };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 20px rgba(45,45,45,0.07)', overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '1.25rem 1.5rem', borderBottom: open ? '1px solid var(--c-border)' : 'none', background: 'linear-gradient(90deg,#FFFFFF,rgba(197,160,33,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: 'none', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(197,160,33,0.08)', border: '1px solid rgba(197,160,33,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>＋</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Add New Product</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Full product details — SKU, description, features, gallery</p>
          </div>
        </div>
        <span style={{ fontSize: '1.25rem', color: 'var(--c-text-dim)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>⌄</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* AI Photo Upload — top of form */}
          <AiPhotoUpload onResult={handleAiResult} />

          {/* Row 1: Name + SKU + Brand */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.875rem', alignItems: 'flex-end' }}>
            <div>
              <FieldLabel>Product Name *</FieldLabel>
              <FieldInput type="text" placeholder="e.g. Samsung Galaxy A55 5G" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 200 }}>
              <FieldLabel>SKU</FieldLabel>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <FieldInput type="text" placeholder="NAN-XXX" value={form.sku} onChange={e => set('sku', e.target.value)} style={{ flex: 1 }} />
                <button type="button" onClick={autoSku} style={{ flexShrink: 0, padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '1px solid var(--c-border)', background: 'rgba(197,160,33,0.07)', color: 'var(--c-gold)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Auto</button>
              </div>
            </div>
            <div>
              <FieldLabel>Brand</FieldLabel>
              <FieldInput type="text" placeholder="e.g. Samsung" value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
          </div>

          {/* Row 2: Category + Subcategory */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <FieldLabel>Category *</FieldLabel>
              <select value={form.categorySlug} onChange={e => set('categorySlug', e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', background: '#fff', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}>
                <option value="">— Select category —</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Subcategory *</FieldLabel>
              <select value={form.subcategorySlug} onChange={e => set('subcategorySlug', e.target.value)} disabled={!form.categorySlug}
                style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', background: '#fff', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', opacity: form.categorySlug ? 1 : 0.5 }}>
                <option value="">— Select subcategory —</option>
                {subcats.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Price + Cost + Stock + Tax */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.875rem' }}>
            <div><FieldLabel>Price (TZS) *</FieldLabel><FieldInput type="number" min="0" step="any" placeholder="e.g. 850000" value={form.price} onChange={e => set('price', e.target.value)} /></div>
            <div><FieldLabel>Cost Price (TZS)</FieldLabel><FieldInput type="number" min="0" step="any" placeholder="e.g. 510000" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} /></div>
            <div><FieldLabel>Stock Qty</FieldLabel><FieldInput type="number" min="0" step="1" value={form.stockQty} onChange={e => set('stockQty', e.target.value)} /></div>
            <div><FieldLabel>Tax Rate (%)</FieldLabel><FieldInput type="number" min="0" step="0.01" value={form.taxRate} onChange={e => set('taxRate', e.target.value)} /></div>
          </div>

          {/* Row 4: Descriptions (EN + SW) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <FieldLabel>🇬🇧 Description (English)</FieldLabel>
              <textarea rows={4} placeholder="Full product description in English…" value={form.description} onChange={e => set('description', e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.55 }} />
            </div>
            <div>
              <FieldLabel>🇹🇿 Maelezo (Kiswahili)</FieldLabel>
              <textarea rows={4} placeholder="Maelezo kamili ya bidhaa kwa Kiswahili…" value={form.description_sw} onChange={e => set('description_sw', e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.55 }} />
            </div>
          </div>

          {/* Row 5: Features */}
          <div>
            <FieldLabel>Key Features</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {form.features.map((f, i) => (
                <div key={i} style={listItemStyle}>
                  <FieldInput type="text" placeholder={`Feature ${i + 1}`} value={f} onChange={e => setFeature(i, e.target.value)} />
                  {form.features.length > 1 && <button type="button" style={removeBtn} onClick={() => removeFeature(i)}>×</button>}
                </div>
              ))}
              <button type="button" style={addRowBtn} onClick={addFeature}>+ Add Feature</button>
            </div>
          </div>

          {/* Row 6: Image Gallery */}
          <div>
            <FieldLabel>Image Gallery</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {form.gallery.map((g, i) => (
                <GalleryImageRow
                  key={i}
                  index={i}
                  value={g}
                  onChange={val => setGallery(i, val)}
                  onRemove={form.gallery.length > 1 ? () => removeGallery(i) : null}
                />
              ))}
              <button type="button" style={addRowBtn} onClick={addGallery}>+ Add Image</button>
            </div>
          </div>

          {formErr && <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--c-error)', background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>{formErr}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setForm(EMPTY_PRO_FORM); setFormErr(null); }}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--c-border)', background: 'transparent', cursor: 'pointer', color: 'var(--c-text-muted)' }}>Reset</button>
            <button type="submit" className="btn btn-gold" disabled={submitting} style={{ padding: '0.625rem 1.75rem', fontSize: '0.875rem' }}>
              {submitting ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ProductsPanel({ refreshKey = 0 }) {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [filterCat,   setFilterCat]   = useState('All');
  const [deletingId,  setDeletingId]  = useState(null);
  const [togglingId,  setTogglingId]  = useState(null);
  // Local visibility overrides: { [productId]: boolean }
  const [visMap,      setVisMap]      = useState({});

  const fetchProducts = useCallback(async (cat = filterCat) => {
    setLoading(true);
    setError(null);
    try {
      const params = cat !== 'All' ? `?category=${encodeURIComponent(cat)}` : '';
      const { data } = await api.get(`/api/v1/admin/products${params}`);
      const prods = data.products ?? [];
      setProducts(prods);
      // Seed visibility map from API data
      const init = {};
      prods.forEach(p => { init[p.id] = p.is_visible ?? true; });
      setVisMap(init);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? err.message ?? 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [filterCat]);

  useEffect(() => {
    api.get('/api/v1/admin/categories')
      .then(({ data }) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(filterCat); }, [filterCat, refreshKey]); // eslint-disable-line

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleVisibility(product) {
    const newVal = !(visMap[product.id] ?? true);
    setTogglingId(product.id);
    // Optimistic update
    setVisMap(m => ({ ...m, [product.id]: newVal }));
    try {
      await api.patch(`/api/v1/admin/products/${product.id}`, { is_visible: newVal });
    } catch (err) {
      // Revert on error
      setVisMap(m => ({ ...m, [product.id]: !newVal }));
      alert(err.response?.data?.error?.message ?? 'Failed to update visibility.');
    } finally {
      setTogglingId(null);
    }
  }

  const btnSm = { fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, lineHeight: 1.4 };
  const catNames = categories.map(c => c.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <ProAddForm categories={categories} onSaved={() => fetchProducts(filterCat)} />

      <div style={{ background: '#FFFFFF', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 20px rgba(45,45,45,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: 'linear-gradient(90deg,#FFFFFF,rgba(197,160,33,0.03))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(197,160,33,0.08)', border: '1px solid rgba(197,160,33,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📦</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Product Catalogue</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{products.length} product{products.length !== 1 ? 's' : ''} {filterCat !== 'All' ? `in ${filterCat}` : 'across all categories'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['All', ...catNames].map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                style={{ ...btnSm, background: filterCat === cat ? 'var(--c-gold)' : 'transparent', color: filterCat === cat ? '#fff' : 'var(--c-text-muted)', border: filterCat === cat ? 'none' : '1px solid var(--c-border)' }}>
                {cat}
              </button>
            ))}
            {products.length > 0 && (
              <button
                onClick={() => downloadProductsCSV(products)}
                style={{ ...btnSm, background: '#1A1A1A', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                ⬇ Export CSV
              </button>
            )}
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-muted)' }}><span className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--c-gold)' }} /><p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading products…</p></div>}
        {!loading && error && <div style={{ margin: '1rem 1.5rem', background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', color: 'var(--c-error)', fontSize: '0.875rem' }}><strong>Error:</strong> {error}</div>}
        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--c-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', color: 'var(--c-text)', marginBottom: '0.375rem' }}>No products yet</p>
            <p style={{ fontSize: '0.875rem' }}>Use the form above to add your first product.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['Name', 'SKU', 'Category', 'Price (TZS)', 'Stock', 'Visible', 'Added', 'Actions'].map(h => (
                    <th key={h} style={{ ...TH, textAlign: ['Price (TZS)', 'Stock'].includes(h) ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const isVisible = visMap[p.id] ?? true;
                  return (
                    <tr key={p.id}
                      style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA', transition: 'background 0.12s', opacity: isVisible ? 1 : 0.55 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(197,160,33,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#FFFFFF' : '#FAFAFA')}
                    >
                      <td style={{ ...TD, fontWeight: 600, maxWidth: 200 }}>{p.name}</td>
                      <td style={{ ...TD, fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--c-text-muted)' }}>{p.sku ?? '—'}</td>
                      <td style={TD}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, background: 'rgba(197,160,33,0.08)', color: 'var(--c-gold)', border: '1px solid rgba(197,160,33,0.25)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>{p.category_name}</span>
                        {p.subcategory_name && <span style={{ fontSize: '0.72rem', color: 'var(--c-text-muted)', marginLeft: 4 }}>{p.subcategory_name}</span>}
                      </td>
                      <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: 'var(--c-gold)' }}>{Number(p.price).toLocaleString()}</td>
                      <td style={{ ...TD, textAlign: 'right' }}>{p.stock_qty ?? 0}</td>
                      <td style={{ ...TD }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ToggleSwitch
                            checked={isVisible}
                            onChange={() => handleToggleVisibility(p)}
                            disabled={togglingId === p.id}
                          />
                          <span style={{ fontSize: '0.72rem', color: isVisible ? 'var(--c-success)' : 'var(--c-text-dim)', fontWeight: 600 }}>
                            {togglingId === p.id ? '…' : isVisible ? 'Shown' : 'Hidden'}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...TD, color: 'var(--c-text-muted)', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {new Date(p.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleDelete(p.id, p.name)} disabled={deletingId === p.id}
                          style={{ ...btnSm, background: 'var(--c-error-light)', color: 'var(--c-error)', border: '1px solid var(--c-error)' }}>
                          {deletingId === p.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORIES TAB
// ══════════════════════════════════════════════════════════════════════════════
function CategoriesPanel() {
  const [categories,    setCategories]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  // Box A — create top-level category
  const [mainName,      setMainName]      = useState('');
  const [addingMain,    setAddingMain]    = useState(false);
  // Box B — create subcategory
  const [subParentId,   setSubParentId]   = useState('');
  const [subName,       setSubName]       = useState('');
  const [addingSubTop,  setAddingSubTop]  = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  // Per-category inline subcategory expand (tree view)
  const [expandedCat,   setExpandedCat]   = useState(null);
  const [newSubName,    setNewSubName]    = useState('');
  const [addingSub,     setAddingSub]     = useState(false);
  const [deletingSubId, setDeletingSubId] = useState(null);
  // Per-category edit name
  const [editingId,     setEditingId]     = useState(null);
  const [editName,      setEditName]      = useState('');
  const [savingEdit,    setSavingEdit]    = useState(false);
  // Per-category visibility toggle
  const [togglingId,    setTogglingId]    = useState(null);
  // Per-category image upload
  const [uploadingId,   setUploadingId]   = useState(null);
  const imgInputRef                       = useRef({});

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/v1/admin/categories');
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? err.message ?? 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function slugify(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleAddMainCategory(e) {
    e.preventDefault();
    const name = mainName.trim();
    if (!name) return;
    setAddingMain(true);
    try {
      await api.post('/api/v1/admin/categories', { name, slug: slugify(name) });
      setMainName('');
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Failed to add category.');
    } finally {
      setAddingMain(false);
    }
  }

  async function handleAddSubcategoryFromTop(e) {
    e.preventDefault();
    const name = subName.trim();
    if (!subParentId || !name) return;
    setAddingSubTop(true);
    try {
      await api.post(`/api/v1/admin/categories/${subParentId}/subcategories`, { name, slug: slugify(name) });
      setSubName('');
      setSubParentId('');
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Failed to add subcategory.');
    } finally {
      setAddingSubTop(false);
    }
  }

  async function handleDeleteCategory(id, name) {
    if (!window.confirm(`Delete category "${name}"? All subcategories will also be removed.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/admin/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAddSubcategory(catId) {
    const name = newSubName.trim();
    if (!name) return;
    setAddingSub(true);
    try {
      await api.post(`/api/v1/admin/categories/${catId}/subcategories`, { name, slug: slugify(name) });
      setNewSubName('');
      setExpandedCat(null);
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Failed to add subcategory.');
    } finally {
      setAddingSub(false);
    }
  }

  async function handleDeleteSubcategory(subId, name) {
    if (!window.confirm(`Delete subcategory "${name}"?`)) return;
    setDeletingSubId(subId);
    try {
      await api.delete(`/api/v1/admin/subcategories/${subId}`);
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Delete failed.');
    } finally {
      setDeletingSubId(null);
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setExpandedCat(null);
  }

  async function handleSaveEdit(catId) {
    const name = editName.trim();
    if (!name) return;
    setSavingEdit(true);
    try {
      await api.patch(`/api/v1/admin/categories/${catId}`, { name });
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, name } : c));
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Failed to save name.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleActive(cat) {
    setTogglingId(cat.id);
    const newActive = !(cat.is_active ?? true);
    try {
      await api.patch(`/api/v1/admin/categories/${cat.id}`, { is_active: newActive });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newActive } : c));
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Failed to update visibility.');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleUploadCategoryImage(catId, file) {
    if (!file) return;
    setUploadingId(catId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/api/v1/media/upload', fd);
      const url = data.url ?? data.imageUrl ?? data.image_url;
      if (url) {
        await api.patch(`/api/v1/admin/categories/${catId}`, { image_url: url });
        setCategories(prev => prev.map(c => c.id === catId ? { ...c, image_url: url } : c));
      }
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message ?? err.response?.data?.error?.message ?? err.message ?? 'Unknown error';
      console.error(`[AdminDashboard] Category upload failed — HTTP ${status ?? 'Network Error'}:`, msg, err);
      alert(`Image upload failed (${status ?? 'Network Error'}): ${msg}`);
    } finally {
      setUploadingId(null);
    }
  }

  const inputStyle = { padding: '0.6rem 0.875rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)', flex: 1, boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Two-box create forms — side by side */}
      {(() => {
        const box  = { background: '#FFFFFF', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 20px rgba(45,45,45,0.07)', overflow: 'hidden', flex: 1 };
        const hdr  = { padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--c-border)', background: 'linear-gradient(90deg,#FFFFFF,rgba(197,160,33,0.03))', display: 'flex', alignItems: 'center', gap: '0.5rem' };
        const lbl  = { fontSize: '0.68rem', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' };
        const inp  = { ...inputStyle, padding: '0.55rem 0.75rem', fontSize: '0.8125rem' };
        return (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

            {/* Box A: Create Main Category */}
            <div style={box}>
              <div style={hdr}>
                <span>🏷️</span>
                <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Create Main Category</h2>
              </div>
              <form onSubmit={handleAddMainCategory} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div>
                  <label style={lbl}>Name *</label>
                  <input type="text" placeholder="e.g. Beauty & Wellness" value={mainName} onChange={e => setMainName(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Slug (auto)</label>
                  <input readOnly value={slugify(mainName)} style={{ ...inp, background: '#FAFAF7', color: 'var(--c-text-dim)', fontFamily: 'monospace' }} />
                </div>
                <button type="submit" className="btn btn-gold" disabled={addingMain || !mainName.trim()} style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem' }}>
                  {addingMain ? 'Adding…' : '+ Add Category'}
                </button>
              </form>
            </div>

            {/* Box B: Create Subcategory */}
            <div style={box}>
              <div style={hdr}>
                <span>└</span>
                <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Create Subcategory</h2>
              </div>
              <form onSubmit={handleAddSubcategoryFromTop} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div>
                  <label style={lbl}>Parent Category *</label>
                  <select value={subParentId} onChange={e => setSubParentId(e.target.value)} style={{ ...inp, background: '#fff' }}>
                    <option value="">— Select parent —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Subcategory Name *</label>
                  <input type="text" placeholder="e.g. Face Creams" value={subName} onChange={e => setSubName(e.target.value)} style={inp} disabled={!subParentId} />
                </div>
                <button type="submit" className="btn btn-gold" disabled={addingSubTop || !subParentId || !subName.trim()} style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem' }}>
                  {addingSubTop ? 'Adding…' : '+ Add Subcategory'}
                </button>
              </form>
            </div>

          </div>
        );
      })()}

      {/* Category list */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 20px rgba(45,45,45,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', background: 'linear-gradient(90deg,#FFFFFF,rgba(197,160,33,0.03))' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Category Tree ({categories.length})</h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Manage top-level categories and their subcategories</p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-muted)' }}>
            <span className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--c-gold)' }} />
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading categories…</p>
          </div>
        )}
        {!loading && error && (
          <div style={{ margin: '1rem 1.5rem', background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', color: 'var(--c-error)', fontSize: '0.875rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {!loading && !error && categories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--c-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏷️</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', color: 'var(--c-text)', marginBottom: '0.375rem' }}>No categories yet</p>
            <p style={{ fontSize: '0.875rem' }}>Use the form above to add your first category.</p>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map((cat, ci) => {
              const subs = cat.subcategories ?? [];
              const isExpanded = expandedCat === cat.id;
              return (
                <div key={cat.id} style={{ borderBottom: ci < categories.length - 1 ? '1px solid var(--c-border)' : 'none' }}>

                  {/* ── Category row ── */}
                  <div style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: isExpanded ? '#FAFAF7' : 'transparent', flexWrap: 'wrap' }}>
                    {/* Category image / emoji thumb */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #FBF8EE, #F5EFD6)', border: '1px solid rgba(197,160,33,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative' }}
                      title="Click to upload category image"
                      onClick={() => imgInputRef.current[cat.id]?.click()}
                    >
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.1rem' }}>🏷️</span>
                      )}
                      {uploadingId === cat.id && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>…</div>
                      )}
                      <input
                        type="file" accept="image/*"
                        ref={el => { imgInputRef.current[cat.id] = el; }}
                        style={{ display: 'none' }}
                        onChange={e => { handleUploadCategoryImage(cat.id, e.target.files?.[0]); e.target.value = ''; }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Inline name edit */}
                      {editingId === cat.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                            autoFocus
                            style={{ padding: '0.3rem 0.5rem', border: '1.5px solid var(--c-gold)', borderRadius: '5px', fontSize: '0.875rem', fontWeight: 600, outline: 'none', flex: 1 }}
                          />
                          <button onClick={() => handleSaveEdit(cat.id)} disabled={savingEdit || !editName.trim()}
                            style={{ fontSize: '0.68rem', padding: '0.3rem 0.6rem', borderRadius: '5px', border: 'none', background: 'var(--c-gold)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                            {savingEdit ? '…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            style={{ fontSize: '0.68rem', padding: '0.3rem 0.6rem', borderRadius: '5px', border: '1px solid var(--c-border)', background: 'transparent', color: 'var(--c-text-muted)', cursor: 'pointer' }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: (cat.is_active ?? true) ? 'var(--c-text)' : 'var(--c-text-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {cat.name}
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, background: 'rgba(197,160,33,0.08)', color: 'var(--c-gold)', border: '1px solid rgba(197,160,33,0.25)', borderRadius: '4px', padding: '0.1rem 0.35rem' }}>
                            {subs.length} sub{subs.length !== 1 ? 's' : ''}
                          </span>
                          {!(cat.is_active ?? true) && (
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(150,150,150,0.12)', color: 'var(--c-text-dim)', border: '1px solid #ddd', borderRadius: '4px', padding: '0.1rem 0.35rem' }}>
                              Hidden
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--c-text-dim)', marginTop: '0.1rem', background: '#F5F2E8', display: 'inline-block', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{cat.slug}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Active toggle */}
                      <ToggleSwitch
                        checked={cat.is_active ?? true}
                        disabled={togglingId === cat.id}
                        onChange={() => handleToggleActive(cat)}
                      />
                      {/* Edit name */}
                      {editingId !== cat.id && (
                        <button
                          onClick={() => startEdit(cat)}
                          style={{ fontSize: '0.68rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--c-border)', background: 'transparent', color: 'var(--c-text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                          ✏️
                        </button>
                      )}
                      {/* Add sub */}
                      <button
                        onClick={() => { setExpandedCat(isExpanded ? null : cat.id); setNewSubName(''); setEditingId(null); }}
                        style={{ fontSize: '0.68rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: `1px solid ${isExpanded ? 'rgba(197,160,33,0.5)' : 'rgba(197,160,33,0.35)'}`, background: isExpanded ? 'rgba(197,160,33,0.1)' : 'rgba(197,160,33,0.05)', color: 'var(--c-gold)', cursor: 'pointer', fontWeight: 700 }}>
                        {isExpanded ? '✕' : '+ Sub'}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        disabled={deletingId === cat.id}
                        style={{ fontSize: '0.68rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--c-error)', background: 'var(--c-error-light)', color: 'var(--c-error)', cursor: 'pointer', fontWeight: 700 }}>
                        {deletingId === cat.id ? '…' : 'Del'}
                      </button>
                    </div>
                  </div>

                  {/* ── Subcategory tree rows ── */}
                  {subs.length > 0 && (
                    <div style={{ background: '#FAFAF9', borderTop: '1px dashed #EEEBE2' }}>
                      {subs.map((sub, si) => (
                        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 1.5rem 0.55rem 3.25rem', borderBottom: si < subs.length - 1 ? '1px dashed #EEEBE2' : 'none' }}>
                          <span style={{ color: '#C4B99A', fontSize: '0.875rem', flexShrink: 0, lineHeight: 1 }}>└</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--c-text)' }}>{sub.name}</span>
                            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--c-text-dim)', marginLeft: '0.5rem', background: '#EFECE3', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{sub.slug}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                            disabled={deletingSubId === sub.id}
                            style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid var(--c-error)', background: 'var(--c-error-light)', color: 'var(--c-error)', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>
                            {deletingSubId === sub.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Add subcategory inline form ── */}
                  {isExpanded && (
                    <div style={{ padding: '0.875rem 1.5rem', background: '#F5F2E8', borderTop: '1px solid rgba(197,160,33,0.2)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--c-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>
                          New subcategory under "{cat.name}"
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Face Creams"
                          value={newSubName}
                          onChange={e => setNewSubName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(cat.id); } }}
                          style={{ ...inputStyle, background: '#fff' }}
                          autoFocus
                        />
                        {newSubName.trim() && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--c-text-dim)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                            Slug: {slugify(newSubName)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddSubcategory(cat.id)}
                        disabled={addingSub || !newSubName.trim()}
                        className="btn btn-gold"
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.8125rem', flexShrink: 0 }}>
                        {addingSub ? 'Adding…' : 'Add Sub'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTIONS TAB  (Manage Site Sections / Storefront carousels)
// ══════════════════════════════════════════════════════════════════════════════
const RULE_TYPES = [
  { value: 'category',   label: 'Category', needsValue: true,  valuePlaceholder: 'e.g. electronics',    valueLabel: 'Category Slug' },
  { value: 'brand',      label: 'Brand',    needsValue: true,  valuePlaceholder: 'e.g. Samsung',         valueLabel: 'Brand Name'    },
  { value: 'price',      label: 'Price',    needsValue: true,  valuePlaceholder: 'e.g. 0-50000 (TZS)',  valueLabel: 'Price Range'   },
  { value: 'bulk_deals', label: 'Bulk Buy', needsValue: false, valuePlaceholder: '',                     valueLabel: ''              },
];

const EMPTY_SECTION_FORM = { title: '', rule_type: 'best_sellers', rule_value: '', sort_order: '' };

function SectionsPanel() {
  const [sections,    setSections]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [form,        setForm]        = useState(EMPTY_SECTION_FORM);
  const [saving,      setSaving]      = useState(false);
  const [formErr,     setFormErr]     = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [togglingId,  setTogglingId]  = useState(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/v1/admin/site-sections');
      setSections(data.sections ?? []);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? err.message ?? 'Failed to load sections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleAdd(e) {
    e.preventDefault();
    setFormErr(null);
    if (!form.title.trim()) return setFormErr('Section title is required.');
    const rule = RULE_TYPES.find(r => r.value === form.rule_type);
    if (rule?.needsValue && !form.rule_value.trim()) return setFormErr(`${rule.valueLabel} is required for this rule type.`);
    setSaving(true);
    try {
      await api.post('/api/v1/admin/site-sections', {
        title:      form.title.trim(),
        rule_type:  form.rule_type,
        rule_value: form.rule_value.trim() || null,
        sort_order: form.sort_order ? parseInt(form.sort_order, 10) : undefined,
        is_active:  true,
      });
      setForm(EMPTY_SECTION_FORM);
      await fetchSections();
    } catch (err) {
      setFormErr(err.response?.data?.error?.message ?? 'Failed to save section.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete section "${title}"?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/admin/site-sections/${id}`);
      setSections(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(section) {
    const newVal = !section.is_active;
    setTogglingId(section.id);
    setSections(prev => prev.map(s => s.id === section.id ? { ...s, is_active: newVal } : s));
    try {
      await api.patch(`/api/v1/admin/site-sections/${section.id}`, { is_active: newVal });
    } catch (err) {
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, is_active: !newVal } : s));
      alert(err.response?.data?.error?.message ?? 'Update failed.');
    } finally {
      setTogglingId(null);
    }
  }

  const selectedRule = RULE_TYPES.find(r => r.value === form.rule_type) ?? RULE_TYPES[0];
  const needsValue   = selectedRule.needsValue;
  const inputSt = { padding: '0.6rem 0.875rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)', width: '100%', boxSizing: 'border-box' };
  const labelSt = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Add form */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 20px rgba(45,45,45,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', background: 'linear-gradient(90deg,#FFFFFF,rgba(197,160,33,0.03))', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(197,160,33,0.08)', border: '1px solid rgba(197,160,33,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📋</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Add Site Section</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Each active section renders a product carousel on the storefront homepage</p>
          </div>
        </div>
        <form onSubmit={handleAdd} style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: needsValue ? '2fr 1fr 1fr auto' : '2fr 1fr auto', gap: '0.625rem', alignItems: 'flex-end' }}>
            <div>
              <label style={labelSt}>Section Title *</label>
              <input type="text" placeholder="e.g. Top Picks This Week" value={form.title} onChange={e => setField('title', e.target.value)} style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Rule Type *</label>
              <select value={form.rule_type} onChange={e => { setField('rule_type', e.target.value); setField('rule_value', ''); }} style={{ ...inputSt }}>
                {RULE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {needsValue && (
              <div>
                <label style={labelSt}>{selectedRule.valueLabel} *</label>
                <input type="text" placeholder={selectedRule.valuePlaceholder} value={form.rule_value} onChange={e => setField('rule_value', e.target.value)} style={inputSt} />
              </div>
            )}
            <button type="submit" className="btn btn-gold" disabled={saving} style={{ padding: '0.625rem 1.25rem', fontSize: '0.8125rem', alignSelf: 'flex-end' }}>
              {saving ? '…' : '+ Add'}
            </button>
          </div>
          {formErr && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--c-error)' }}>{formErr}</p>}
        </form>
      </div>

      {/* Section list */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 20px rgba(45,45,45,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', background: 'linear-gradient(90deg,#FFFFFF,rgba(197,160,33,0.03))' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Active Sections ({sections.filter(s => s.is_active).length}/{sections.length})</h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Toggle visibility — only active sections appear on the storefront</p>
        </div>
        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-muted)' }}><span className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--c-gold)' }} /><p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading sections…</p></div>}
        {!loading && error && <div style={{ margin: '1rem 1.5rem', background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', color: 'var(--c-error)', fontSize: '0.875rem' }}><strong>Error:</strong> {error}</div>}
        {!loading && !error && sections.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--c-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', color: 'var(--c-text)', marginBottom: '0.375rem' }}>No sections yet</p>
            <p style={{ fontSize: '0.875rem' }}>Add your first section above to start customising the storefront.</p>
          </div>
        )}
        {!loading && sections.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>{['#', 'Title', 'Rule', 'Value', 'Active', 'Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {sections.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA', opacity: s.is_active ? 1 : 0.55 }}>
                    <td style={{ ...TD, color: 'var(--c-text-dim)', fontSize: '0.78rem', fontWeight: 600 }}>{s.sort_order ?? i + 1}</td>
                    <td style={{ ...TD, fontWeight: 700 }}>{s.title}</td>
                    <td style={TD}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, background: 'rgba(197,160,33,0.08)', color: 'var(--c-gold)', border: '1px solid rgba(197,160,33,0.25)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>
                        {RULE_TYPES.find(r => r.value === s.rule_type)?.label ?? s.rule_type}
                      </span>
                    </td>
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--c-text-muted)' }}>{s.rule_value ?? '—'}</td>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ToggleSwitch checked={s.is_active} onChange={() => handleToggleActive(s)} disabled={togglingId === s.id} />
                        <span style={{ fontSize: '0.72rem', color: s.is_active ? 'var(--c-success)' : 'var(--c-text-dim)', fontWeight: 600 }}>{togglingId === s.id ? '…' : s.is_active ? 'On' : 'Off'}</span>
                      </div>
                    </td>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleDelete(s.id, s.title)} disabled={deletingId === s.id}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid var(--c-error)', background: 'var(--c-error-light)', color: 'var(--c-error)', cursor: 'pointer', fontWeight: 600 }}>
                        {deletingId === s.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ORDERS TAB
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// PREPARER PANEL
// ══════════════════════════════════════════════════════════════════════════════

function PreparerPanel({ refreshKey = 0 }) {
  const [orders,      setOrders]     = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [busy,        setBusy]        = useState({});
  const [actionErr,   setActionErr]   = useState({});
  const [token,       setToken]       = useState(() => localStorage.getItem('naneka_driver_token') ?? '');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      // Use the stable ?status= filter on the main list endpoint — avoids route-matching
      // issues where /preparing could be mis-matched as /:id on older deployments.
      const { data } = await api.get('/api/v1/orders?status=pending_payment,paid,preparing&limit=200');
      setOrders(data.orders ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? err.message ?? 'Imeshindwa kupakia oda.');
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { if (refreshKey > 0) fetchOrders(true); }, [refreshKey]); // eslint-disable-line
  useEffect(() => {
    const id = setInterval(() => fetchOrders(), REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchOrders]);

  async function advanceStatus(orderId, nextStatus) {
    setBusy(b => ({ ...b, [orderId]: true }));
    setActionErr(e => ({ ...e, [orderId]: null }));
    try {
      await api.patch(`/api/v1/orders/${orderId}/status`, { status: nextStatus }, { headers: authHeaders });
      // Remove from list if no longer in preparer statuses
      if (!['pending_payment', 'paid', 'preparing'].includes(nextStatus)) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      }
    } catch (err) {
      const msg = err.response?.status === 401 || err.response?.status === 403
        ? 'Not authorised. Paste your staff JWT token above.'
        : (err.response?.data?.error?.message ?? err.response?.data?.message ?? err.message ?? 'Update failed. Try again.');
      setActionErr(e => ({ ...e, [orderId]: msg }));
    } finally {
      setBusy(b => ({ ...b, [orderId]: false }));
    }
  }

  const pending    = orders.filter(o => o.status === 'pending_payment' || o.status === 'paid');
  const inProgress = orders.filter(o => o.status === 'preparing');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <StatCard label="New Orders"   value={pending.length}    accent="#B7770D"          icon="🔔" />
        <StatCard label="Preparing"    value={inProgress.length} accent="var(--c-gold)"    icon="👨‍🍳" />
        <StatCard label="Total Active" value={orders.length}     accent="var(--c-success)"  icon="📋" />
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 20px rgba(45,45,45,0.07)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', background: 'linear-gradient(90deg,#FFFFFF,rgba(197,160,33,0.03))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(197,160,33,0.08)', border: '1px solid rgba(197,160,33,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👨‍🍳</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Preparer Queue</h2>
              {lastUpdated && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Updated {lastUpdated.toLocaleTimeString()}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-dim)' }}>
              Token: <input
                value={token}
                onChange={e => { setToken(e.target.value); localStorage.setItem('naneka_driver_token', e.target.value); }}
                placeholder="Paste staff JWT…"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', fontFamily: 'monospace', border: '1px solid var(--c-border)', borderRadius: '4px', width: '160px' }}
              />
            </div>
            <button className="btn btn-ghost" onClick={() => fetchOrders(true)} disabled={refreshing} style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>
              {refreshing ? <><span className="spinner" /> Refreshing…</> : '⟳ Refresh'}
            </button>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-muted)' }}><span className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--c-gold)' }} /></div>}
        {!loading && error && <div style={{ margin: '1rem 1.5rem', background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', color: 'var(--c-error)', fontSize: '0.875rem' }}><strong>Error:</strong> {error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--c-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', color: 'var(--c-text)', marginBottom: '0.375rem' }}>Hakuna oda mpya kwa sasa</p>
            <p style={{ fontSize: '0.875rem' }}>Oda mpya zitaonekana hapa mara zinapopokelewa.</p>
          </div>
        )}

        {/* Order cards */}
        {!loading && orders.length > 0 && (
          <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {orders.map(order => {
              const isBusy = busy[order.id];
              const err    = actionErr[order.id];
              const isPending  = order.status === 'pending_payment' || order.status === 'paid';
              const isPreparing = order.status === 'preparing';
              const items  = order.items ?? [];

              return (
                <div key={order.id} style={{
                  background: '#FFFFFF', border: '1px solid var(--c-border)',
                  borderLeft: `3px solid ${isPreparing ? 'var(--c-gold)' : '#B7770D'}`,
                  borderRadius: 'var(--radius)', boxShadow: '0 2px 8px rgba(45,45,45,0.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '1rem 1.125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--c-text-dim)', background: '#F5F5F5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                        <StatusBadge status={order.status} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--c-text-dim)' }}>{new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.15rem' }}>{order.customer_name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)' }}>{order.customer_phone}</div>
                      {order.delivery_address && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', marginTop: '0.25rem' }}>📍 {order.delivery_address}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: '1rem', color: 'var(--c-gold)' }}>
                        TZS {Number(order.total).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  {items.length > 0 && (
                    <div style={{ margin: '0 1.125rem 0.875rem', background: '#F9F7F2', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--c-text-muted)', marginBottom: '0.375rem' }}>Order Items</div>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', paddingBottom: i < items.length - 1 ? '0.25rem' : 0 }}>
                          <span style={{ fontWeight: 600 }}>{item.qty}× {item.name}</span>
                          <span style={{ color: 'var(--c-text-muted)', fontSize: '0.8rem' }}>TZS {Number(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div style={{ margin: '0 1.125rem 0.875rem', background: 'rgba(197,160,33,0.05)', border: '1px solid rgba(197,160,33,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: 'var(--c-text)' }}>
                      <strong>Notes:</strong> {order.notes}
                    </div>
                  )}

                  {/* Error */}
                  {err && (
                    <div style={{ margin: '0 1.125rem 0.75rem', padding: '0.5rem 0.75rem', background: 'var(--c-error-light)', color: 'var(--c-error)', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)' }}>{err}</div>
                  )}

                  {/* Action buttons */}
                  <div style={{ padding: '0 1.125rem 1rem', display: 'flex', gap: '0.625rem' }}>
                    {isPending && (
                      <button
                        className="btn btn-gold"
                        disabled={isBusy}
                        onClick={() => advanceStatus(order.id, 'preparing')}
                        style={{ flex: 1, fontSize: '0.9rem', padding: '0.65rem 1rem', fontWeight: 700, background: '#1a1a1a', color: 'var(--c-gold)', border: '2px solid var(--c-gold)' }}
                      >
                        {isBusy ? <><span className="spinner" /> Updating…</> : '👨‍🍳 Accept — Start Preparing'}
                      </button>
                    )}
                    {isPreparing && (
                      <button
                        className="btn btn-gold"
                        disabled={isBusy}
                        onClick={() => advanceStatus(order.id, 'ready_for_pickup')}
                        style={{ flex: 1, fontSize: '0.9rem', padding: '0.65rem 1rem', fontWeight: 700 }}
                      >
                        {isBusy ? <><span className="spinner" /> Updating…</> : '✅ Ready for Pickup'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersPanel({ refreshKey = 0 }) {
  const [orders,      setOrders]      = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);

  const fetchOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const { data } = await api.get('/api/v1/orders?limit=200');
      setOrders(data.orders ?? []);
      setPagination(data.pagination);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? err.message ?? 'Failed to load orders.');
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { if (refreshKey > 0) fetchOrders(true); }, [refreshKey]); // eslint-disable-line
  useEffect(() => {
    const id = setInterval(() => fetchOrders(), REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const stats = {
    total:   orders.length,
    pending: orders.filter(o => o.status === 'pending_payment').length,
    paid:    orders.filter(o => ['paid', 'processing'].includes(o.status)).length,
    transit: orders.filter(o => o.status === 'out_for_delivery').length,
    done:    orders.filter(o => o.status === 'delivered').length,
    synced:  orders.filter(o => o.sheets_synced ?? o.gsheet_synced ?? o.synced_at).length,
  };
  const revenue = orders
    .filter(o => !['cancelled', 'pending_payment'].includes(o.status))
    .reduce((s, o) => s + parseFloat(o.total ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <StatCard label="Total Orders"      value={stats.total}   accent="var(--c-text-muted)" icon="📋" />
        <StatCard label="Pending Payment"   value={stats.pending} accent="#B7770D"              icon="⏳" />
        <StatCard label="Paid / Processing" value={stats.paid}    accent="#1D4ED8"              icon="✓" />
        <StatCard label="Out for Delivery"  value={stats.transit} accent="#0891B2"              icon="🚚" />
        <StatCard label="Delivered"         value={stats.done}    accent="var(--c-success)"     icon="📦" />
        <StatCard label="Sheet Synced"      value={stats.synced}  accent="var(--c-gold)"        icon="📊" />
        <StatCard
          label="Revenue (TZS)"
          value={revenue >= 1_000_000 ? `${(revenue/1_000_000).toFixed(1)}M` : revenue >= 1_000 ? `${(revenue/1_000).toFixed(0)}K` : revenue.toLocaleString()}
          accent="var(--c-gold)" icon="💰"
        />
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 20px rgba(45,45,45,0.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', background: 'linear-gradient(90deg,#FFFFFF,rgba(197,160,33,0.03))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(197,160,33,0.08)', border: '1px solid rgba(197,160,33,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📋</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Live Orders</h2>
              {pagination && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Showing {orders.length} of {pagination.total} orders</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-text-dim)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button className="btn btn-ghost" onClick={() => fetchOrders(true)} disabled={refreshing} style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>
              {refreshing ? <><span className="spinner" /> Refreshing…</> : '⟳ Refresh'}
            </button>
            <button className="btn btn-gold" onClick={() => downloadCSV(orders)} disabled={orders.length === 0} style={{ fontSize: '0.8125rem', padding: '0.625rem 1.125rem' }}>
              ↓ Export to Excel (CSV)
            </button>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-muted)' }}><span className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--c-gold)' }} /><p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading orders…</p></div>}
        {!loading && error && <div style={{ margin: '1rem 1.5rem', background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', color: 'var(--c-error)', fontSize: '0.875rem' }}><strong>Error:</strong> {error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--c-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', color: 'var(--c-text)', marginBottom: '0.375rem' }}>No orders yet</p>
            <p style={{ fontSize: '0.875rem' }}>New orders will appear here automatically.</p>
          </div>
        )}
        {!loading && orders.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>{['#', 'Customer', 'Phone', 'Amount', 'Status', 'Address', 'Sheet Sync', 'Date'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id}
                    style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(197,160,33,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#FFFFFF' : '#FAFAFA')}
                  >
                    <td style={{ ...TD, color: 'var(--c-text-dim)', fontSize: '0.7rem', fontFamily: 'monospace' }}>{o.id.slice(0,8).toUpperCase()}</td>
                    <td style={{ ...TD, fontWeight: 600 }}>{o.customer_name}</td>
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: '0.8125rem' }}>{o.customer_phone}</td>
                    <td style={{ ...TD, fontWeight: 700, textAlign: 'right', color: 'var(--c-gold)', whiteSpace: 'nowrap' }}>
                      {Number(o.total).toLocaleString()}
                      <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', marginLeft: '3px', fontWeight: 400 }}>{o.currency}</span>
                    </td>
                    <td style={TD}><StatusBadge status={o.status} /></td>
                    <td style={{ ...TD, maxWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <AddressTypeBadge address={o.delivery_address} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--c-text-muted)', maxWidth: '200px', display: 'inline-block' }}>
                          {o.delivery_address?.replace(/^(NAPA:|Landmark:|GPS Pin:)\s*/i, '')}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}><SheetSyncBadge order={o} /></td>
                    <td style={{ ...TD, color: 'var(--c-text-muted)', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                      {new Date(o.created_at).toLocaleDateString('en-GB')}
                      <br />
                      <span style={{ fontSize: '0.7rem', color: 'var(--c-text-dim)' }}>{new Date(o.created_at).toLocaleTimeString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BACKEND STATUS INDICATOR
// ══════════════════════════════════════════════════════════════════════════════
function BackendStatus() {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      await api.get('/health', { timeout: 4000 });
      setStatus('online');
    } catch {
      setStatus('offline');
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => { check(); }, [check]);
  useEffect(() => {
    const id = setInterval(check, REFRESH_MS);
    return () => clearInterval(id);
  }, [check]);

  const DOT_COLOR = { checking: '#F59E0B', online: '#22C55E', offline: '#EF4444' };
  const LABEL     = { checking: 'Checking…', online: 'Backend Online', offline: 'Backend Offline' };

  return (
    <button onClick={check} title={lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : 'Click to check'}
      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, background: status === 'offline' ? 'rgba(239,68,68,0.08)' : 'var(--c-surface-2)', color: status === 'offline' ? '#EF4444' : 'var(--c-text-muted)', border: `1px solid ${status === 'offline' ? 'rgba(239,68,68,0.3)' : 'var(--c-border)'}`, borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s' }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: DOT_COLOR[status], boxShadow: status === 'online' ? '0 0 0 2px rgba(34,197,94,0.2)' : undefined, flexShrink: 0 }} />
      {LABEL[status]}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard({ defaultTab = 'orders' }) {
  const { signOut } = useAuth();
  const navigate    = useNavigate();

  const [activeTab,    setActiveTab]    = useState(defaultTab);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  function handleRefresh() {
    setRefreshKey(k => k + 1);
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  }

  const TAB_STYLE = (active) => ({
    padding: '0.5rem 1.125rem', fontSize: '0.8125rem', fontWeight: 700,
    borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
    background: active ? 'var(--c-gold)' : 'transparent',
    color:      active ? '#fff'          : 'var(--c-text-muted)',
    boxShadow:  active ? '0 2px 8px rgba(197,160,33,0.3)' : 'none',
  });

  const TAB_DESCRIPTIONS = {
    orders:    'Live Orders · Auto-refresh 30 s',
    preparer:  'Preparer Queue · Accept & prepare orders for pickup',
    products:  'Product Catalogue · Full Pro-Add form',
    categories:'Categories · Add & remove categories',
    sections:  'Site Sections · Dynamic storefront carousels',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', fontFamily: 'var(--font-sans)', color: 'var(--c-text)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid var(--c-border)', boxShadow: '0 1px 0 rgba(197,160,33,0.15), 0 2px 12px rgba(45,45,45,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <NanekaLogo size="sm" />
            <div style={{ width: '1px', height: '28px', background: 'var(--c-border)' }} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-text)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Admin Dashboard
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(197,160,33,0.1)', color: 'var(--c-gold)', border: '1px solid rgba(197,160,33,0.3)', borderRadius: '4px', padding: '0.1rem 0.45rem' }}>Master Blueprint</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>
                {TAB_DESCRIPTIONS[activeTab]}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <BackendStatus />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.125rem', fontSize: '0.8125rem', fontWeight: 700, background: isRefreshing ? 'rgba(197,160,33,0.08)' : 'var(--c-gold)', color: isRefreshing ? 'var(--c-gold)' : '#000', border: isRefreshing ? '1px solid rgba(197,160,33,0.4)' : 'none', borderRadius: '8px', cursor: isRefreshing ? 'default' : 'pointer', transition: 'all 0.15s', boxShadow: isRefreshing ? 'none' : '0 2px 8px rgba(197,160,33,0.3)' }}
            >
              <span style={{ display: 'inline-block', transition: 'transform 0.6s', transform: isRefreshing ? 'rotate(360deg)' : 'none' }}>⟳</span>
              {isRefreshing ? 'Refreshing…' : 'Refresh Data'}
            </button>

            {/* Tab toggle */}
            <div style={{ display: 'flex', gap: '0.375rem', background: 'var(--c-surface-2)', borderRadius: '8px', padding: '0.25rem', border: '1px solid var(--c-border)' }}>
              <button style={TAB_STYLE(activeTab === 'orders')}     onClick={() => setActiveTab('orders')}>📋 Orders</button>
              <button style={TAB_STYLE(activeTab === 'preparer')}   onClick={() => setActiveTab('preparer')}>👨‍🍳 Preparer</button>
              <button style={TAB_STYLE(activeTab === 'products')}   onClick={() => setActiveTab('products')}>📦 Products</button>
              <button style={TAB_STYLE(activeTab === 'categories')} onClick={() => setActiveTab('categories')}>🏷️ Categories</button>
              <button style={TAB_STYLE(activeTab === 'sections')}   onClick={() => setActiveTab('sections')}>📐 Sections</button>
            </div>
            <a href="/admin/sales" className="btn btn-gold" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>📊 Sales</a>
            <a href="/" className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>← Storefront</a>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600,
                background: 'transparent',
                color: 'var(--c-text-muted)',
                border: '1px solid var(--c-border)',
                borderRadius: '8px', cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#EF4444';
                e.currentTarget.style.color       = '#EF4444';
                e.currentTarget.style.background  = 'rgba(239,68,68,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--c-border)';
                e.currentTarget.style.color       = 'var(--c-text-muted)';
                e.currentTarget.style.background  = 'transparent';
              }}
            >
              ⎋ Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: 'clamp(1.5rem,3vw,2rem) clamp(1rem,3vw,2rem)' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.01em', margin: 0 }}>
            {activeTab === 'orders' ? 'Order Command Centre' : activeTab === 'preparer' ? 'Preparer Queue' : activeTab === 'products' ? 'Product Control' : activeTab === 'categories' ? 'Manage Categories' : 'Manage Site Sections'}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', marginTop: '0.25rem' }}>
            {activeTab === 'orders'
              ? 'Real-time order overview with Google Sheet sync status'
              : activeTab === 'preparer'
              ? 'Accept new orders, start preparing, and mark them ready for driver pickup.'
              : activeTab === 'products'
              ? 'Full product management — SKU, deep categories, features, gallery, visibility.'
              : activeTab === 'categories'
              ? 'Add, rename, and remove categories & subcategories without touching code.'
              : 'Define storefront homepage carousels — each section maps to a product rule.'}
          </p>
        </div>

        {activeTab === 'orders'     && <OrdersPanel     refreshKey={refreshKey} />}
        {activeTab === 'preparer'   && <PreparerPanel   refreshKey={refreshKey} />}
        {activeTab === 'products'   && <ProductsPanel   refreshKey={refreshKey} />}
        {activeTab === 'categories' && <CategoriesPanel />}
        {activeTab === 'sections'   && <SectionsPanel />}
      </main>
    </div>
  );
}
