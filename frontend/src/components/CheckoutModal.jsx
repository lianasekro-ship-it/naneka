import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const DELIVERY_FEE = 3_500;
const CURRENCY     = 'TZS';

// ─── Geofence regions ─────────────────────────────────────────────────────────
const ZONES = {
  dar_es_salaam: { latMin: -7.10, latMax: -6.55, lngMin: 39.10, lngMax: 39.60 },
  nairobi:       { latMin: -1.45, latMax: -1.10, lngMin: 36.60, lngMax: 37.10 },
  arusha:        { latMin: -3.55, latMax: -3.20, lngMin: 36.45, lngMax: 36.95 },
  mombasa:       { latMin: -4.15, latMax: -3.95, lngMin: 39.55, lngMax: 39.75 },
};
const DSM_CENTRE = { lat: -6.8161, lng: 39.2803 };

function detectCity(lat, lng) {
  for (const [city, b] of Object.entries(ZONES)) {
    if (lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax) return city;
  }
  return null;
}
function applyGeofence(lat, lng, setCoords, setDetectedCity, setLocState) {
  setCoords({ lat, lng });
  const city = detectCity(lat, lng);
  setDetectedCity(city);
  if (city === 'dar_es_salaam') setLocState('in_zone');
  else if (city)                setLocState('expanding_soon');
  else                          setLocState('out_of_zone');
}

// ─── DSM ward / NAPA list ─────────────────────────────────────────────────────
const DSM_WARDS = [
  { code: '16106', ward: 'Makuburi',     district: 'Kinondoni', lat: -6.7924, lng: 39.2555, neighbourhoods: ['Kibangu', 'Makoka', 'Kajima', 'Mwongozo'] },
  { code: '11101', ward: 'Posta (CBD)',  district: 'Ilala',     lat: -6.8161, lng: 39.2803, neighbourhoods: [] },
  { code: '11102', ward: 'Upanga',       district: 'Ilala',     lat: -6.8090, lng: 39.2870, neighbourhoods: [] },
  { code: '11103', ward: 'Kisutu',       district: 'Ilala',     lat: -6.8175, lng: 39.2850, neighbourhoods: [] },
  { code: '11104', ward: 'Kariakoo',     district: 'Ilala',     lat: -6.8194, lng: 39.2740, neighbourhoods: [] },
  { code: '11105', ward: 'Ilala',        district: 'Ilala',     lat: -6.8230, lng: 39.2650, neighbourhoods: [] },
  { code: '11106', ward: 'Buguruni',     district: 'Ilala',     lat: -6.8370, lng: 39.2540, neighbourhoods: [] },
  { code: '11107', ward: 'Vingunguti',   district: 'Ilala',     lat: -6.8450, lng: 39.2490, neighbourhoods: [] },
  { code: '14101', ward: 'Kinondoni',    district: 'Kinondoni', lat: -6.7800, lng: 39.2600, neighbourhoods: [] },
  { code: '14102', ward: 'Magomeni',     district: 'Kinondoni', lat: -6.7960, lng: 39.2500, neighbourhoods: [] },
  { code: '14103', ward: 'Makurumla',    district: 'Kinondoni', lat: -6.7850, lng: 39.2450, neighbourhoods: [] },
  { code: '14104', ward: 'Mwananyamala', district: 'Kinondoni', lat: -6.7780, lng: 39.2480, neighbourhoods: [] },
  { code: '14105', ward: 'Sinza',        district: 'Kinondoni', lat: -6.7720, lng: 39.2370, neighbourhoods: [] },
  { code: '14106', ward: 'Kijitonyama',  district: 'Kinondoni', lat: -6.7660, lng: 39.2430, neighbourhoods: [] },
  { code: '14107', ward: 'Msasani',      district: 'Kinondoni', lat: -6.7540, lng: 39.2820, neighbourhoods: [] },
  { code: '14108', ward: 'Mikocheni',    district: 'Kinondoni', lat: -6.7620, lng: 39.2680, neighbourhoods: [] },
  { code: '14109', ward: 'Kawe',         district: 'Kinondoni', lat: -6.7380, lng: 39.2580, neighbourhoods: [] },
  { code: '14110', ward: 'Mbezi Beach',  district: 'Kinondoni', lat: -6.7240, lng: 39.2280, neighbourhoods: [] },
  { code: '14111', ward: 'Masaki',       district: 'Kinondoni', lat: -6.7530, lng: 39.2940, neighbourhoods: [] },
  { code: '14112', ward: 'Mwenge',       district: 'Kinondoni', lat: -6.7700, lng: 39.2530, neighbourhoods: [] },
  { code: '14113', ward: 'Oysterbay',    district: 'Kinondoni', lat: -6.7590, lng: 39.2910, neighbourhoods: [] },
  { code: '12101', ward: 'Temeke',       district: 'Temeke',    lat: -6.8630, lng: 39.2750, neighbourhoods: [] },
  { code: '12102', ward: 'Mbagala',      district: 'Temeke',    lat: -6.8840, lng: 39.2540, neighbourhoods: [] },
  { code: '12103', ward: 'Tandika',      district: 'Temeke',    lat: -6.8700, lng: 39.2620, neighbourhoods: [] },
  { code: '12104', ward: 'Mtoni',        district: 'Temeke',    lat: -6.8560, lng: 39.2830, neighbourhoods: [] },
  { code: '17101', ward: 'Kigamboni',    district: 'Kigamboni', lat: -6.8420, lng: 39.3140, neighbourhoods: [] },
  { code: '17102', ward: 'Kibada',       district: 'Kigamboni', lat: -6.8540, lng: 39.3200, neighbourhoods: [] },
];

function composeDeliveryAddress(tab, form, coords) {
  const instr  = form.deliveryInstructions.trim();
  const suffix = instr ? ` | ${instr}` : '';
  if (tab === 'napa') {
    const ward  = DSM_WARDS.find(w => w.code === form.napaWard);
    const wStr  = ward ? `${ward.ward} ${ward.code}` : form.napaWard;
    const parts = [
      form.napaPlot.trim() ? `Plot ${form.napaPlot.trim()}` : null,
      form.napaHood  || null,
      wStr,
      'Dar es Salaam, Tanzania',
    ].filter(Boolean);
    return `NAPA: ${parts.join(', ')}${suffix}`;
  }
  if (tab === 'landmark') {
    const parts = [
      form.streetName.trim() || null,
      form.landmark.trim()   ? `near ${form.landmark.trim()}` : null,
    ].filter(Boolean);
    const base = parts.length ? parts.join(', ') : 'Dar es Salaam';
    return `Landmark: ${base}${suffix}`;
  }
  if (coords) return `GPS Pin: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}${suffix}`;
  return `GPS Pin${suffix}`;
}

function fallbackCoords(tab, form) {
  if (tab === 'napa') {
    const ward = DSM_WARDS.find(w => w.code === form.napaWard);
    return ward ? { lat: ward.lat, lng: ward.lng } : DSM_CENTRE;
  }
  return DSM_CENTRE;
}

function formatTZS(n) {
  return 'TZS\u00A0' + Number(n).toLocaleString('en-TZ');
}

const PAYMENT_METHODS = [
  { value: 'mobile_money', label: 'Mobile Money',    sub: 'M-Pesa · Tigo Pesa · Airtel',     icon: '📱' },
  { value: 'card',         label: 'Debit / Credit',  sub: 'Visa · Mastercard · Flutterwave', icon: '💳' },
];

const EMPTY_FORM = {
  customerName: '', customerPhone: '', customerEmail: '', orderNotes: '',
  deliveryInstructions: '',
  napaPlot: '', napaHood: '', napaWard: '16106',
  streetName: '', landmark: '',
  paymentMethod: 'mobile_money',
};

/* ─── Step Indicator ─────────────────────────────────────────────────────────── */
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: 'Contact'  },
    { n: 2, label: 'Delivery' },
    { n: 3, label: 'Payment'  },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)' }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
          {/* Circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
              background: current > s.n ? 'var(--c-gold)' : current === s.n ? '#1A1A1A' : 'transparent',
              color: current > s.n ? '#fff' : current === s.n ? 'var(--c-gold)' : 'var(--c-text-dim)',
              border: current === s.n ? '2px solid var(--c-gold)' : current > s.n ? '2px solid var(--c-gold)' : '2px solid var(--c-border)',
              transition: 'all 0.25s',
            }}>
              {current > s.n ? '✓' : s.n}
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: current >= s.n ? 'var(--c-gold)' : 'var(--c-text-dim)',
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          </div>
          {/* Connector */}
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: '2px', margin: '-0.9rem 0.5rem 0',
              background: current > s.n ? 'var(--c-gold)' : 'var(--c-border)',
              transition: 'background 0.3s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── CheckoutModal ────────────────────────────────────────────────────────── */
export default function CheckoutModal({ product, onClose }) {
  const [step,         setStep]         = useState(1);
  const [addressTab,   setAddressTab]   = useState('napa');
  const [locState,     setLocState]     = useState('locating');
  const [detectedCity, setDetectedCity] = useState(null);
  const [coords,       setCoords]       = useState(null);
  const [manualQuery,  setManualQuery]  = useState('');
  const [geocoding,    setGeocoding]    = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [errors,       setErrors]       = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setLocState('error'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) =>
        applyGeofence(latitude, longitude, setCoords, setDetectedCity, setLocState),
      (err) => setLocState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { timeout: 12_000, enableHighAccuracy: true }
    );
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(f => {
      const next = { ...f, [name]: value };
      if (name === 'napaWard') next.napaHood = '';
      return next;
    });
    setErrors(er => ({ ...er, [name]: undefined }));
    setSubmitError(null);
  }, []);

  async function handleManualSearch(e) {
    e.preventDefault();
    const q = manualQuery.trim();
    if (!q) return;
    setGeocoding(true); setGeocodeError(null);
    try {
      const params = new URLSearchParams({ q: `${q}, Dar es Salaam, Tanzania`, format: 'json', limit: '1', countrycodes: 'tz', addressdetails: '0' });
      const res    = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) throw new Error('Geocoding service unavailable.');
      const results = await res.json();
      if (!results.length) { setGeocodeError(`Couldn't find "${q}". Try e.g. "Mwenge", "Kariakoo", "Masaki".`); return; }
      const { lat, lon } = results[0];
      applyGeofence(parseFloat(lat), parseFloat(lon), setCoords, setDetectedCity, setLocState);
    } catch (err) {
      setGeocodeError(err.message ?? 'Location lookup failed.');
    } finally {
      setGeocoding(false);
    }
  }

  // ── Per-step validation ──────────────────────────────────────────────────────
  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.customerName.trim() || form.customerName.trim().length < 2) e.customerName = 'Full name required (at least 2 characters)';
      if (!form.customerPhone.trim() || form.customerPhone.trim().length < 7) e.customerPhone = 'Valid phone number required';
      if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) e.customerEmail = 'Enter a valid email address';
    }
    if (s === 2) {
      if (addressTab === 'napa') {
        if (!form.napaPlot.trim()) e.napaPlot = 'House / plot number is required';
        if (!form.napaWard) e.napaWard = 'Please select a postcode';
        const ward = DSM_WARDS.find(w => w.code === form.napaWard);
        if (ward?.neighbourhoods.length && !form.napaHood) e.napaHood = 'Please select a neighbourhood';
      } else if (addressTab === 'landmark') {
        if (!form.streetName.trim() && !form.landmark.trim()) e.streetName = 'Enter a street name or a nearby landmark';
      } else if (addressTab === 'gps_pin') {
        if (!coords) e.gpsPin = 'GPS location required.';
      }
    }
    return e;
  }

  function nextStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = { ...validateStep(1), ...validateStep(2) };
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true); setSubmitError(null);

    const resolvedCoords = coords ?? (addressTab !== 'gps_pin' ? fallbackCoords(addressTab, form) : null);
    if (!resolvedCoords) {
      setErrors({ gpsPin: 'Could not resolve your location.' });
      setSubmitting(false); return;
    }

    const deliveryAddress = composeDeliveryAddress(addressTab, form, resolvedCoords);
    const subtotal = product.price;
    const total    = subtotal + DELIVERY_FEE;

    try {
      const { data } = await axios.post('/api/v1/orders', {
        customerName:  form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        deliveryAddress,
        latitude:      resolvedCoords.lat,
        longitude:     resolvedCoords.lng,
        paymentMethod: form.paymentMethod,
        subtotal, deliveryFee: DELIVERY_FEE, total, currency: CURRENCY,
        notes: form.orderNotes.trim() || undefined,
      });
      const redirectUrl = new URL(data.paymentLink);
      window.location.href = window.location.origin + redirectUrl.pathname + redirectUrl.search;
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Something went wrong. Please try again.';
      if (typeof data === 'string' && data.length) msg = data;
      else if (data) { const c = data.message ?? data.error ?? data.detail; msg = typeof c === 'string' ? c : JSON.stringify(c) ?? msg; }
      else if (typeof err?.message === 'string') msg = err.message;
      setSubmitError(String(msg));
      setSubmitting(false);
    }
  }

  const subtotal = product?.price ?? 0;
  const total    = subtotal + DELIVERY_FEE;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-label="Complete your order"
        style={{ maxWidth: '560px' }}>
        <div className="modal-handle" />

        {/* ── Modal header ───────────────────────────────────────────────── */}
        <div style={{ padding: '1.25rem 1.5rem 0', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.875rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.3 }}>
                {product?.emoji && <>{product.emoji}&ensp;</>}{product?.name}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', marginTop: '0.2rem' }}>
                {formatTZS(subtotal)} + {formatTZS(DELIVERY_FEE)} delivery = <strong style={{ color: 'var(--c-gold)' }}>{formatTZS(total)}</strong>
              </div>
            </div>
            <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* ── Step indicator ─────────────────────────────────────────────── */}
        <StepIndicator current={step} />

        <div className="modal-body">

          {/* ══════════════════ STEP 1: CONTACT ══════════════════════════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <StepLabel icon="👤" title="Your Contact Details" sub="We'll send order updates to your WhatsApp" />

              <Field label="Full Name" required error={errors.customerName}>
                <input className={`form-input${errors.customerName ? ' error' : ''}`}
                  name="customerName" value={form.customerName} onChange={handleChange}
                  placeholder="e.g. Amina Juma" autoComplete="name" autoFocus />
              </Field>

              <Field label="Phone Number" required error={errors.customerPhone}
                hint="WhatsApp number preferred — order updates sent here">
                <input className={`form-input${errors.customerPhone ? ' error' : ''}`}
                  name="customerPhone" value={form.customerPhone} onChange={handleChange}
                  placeholder="+255 712 345 678" type="tel" autoComplete="tel" />
              </Field>

              <Field label="Email Address (Optional)" error={errors.customerEmail}
                hint="For your order receipt">
                <input className={`form-input${errors.customerEmail ? ' error' : ''}`}
                  name="customerEmail" value={form.customerEmail} onChange={handleChange}
                  placeholder="amina@example.com" type="email" autoComplete="email" />
              </Field>

              <Field label="Order Notes (Optional)" hint='e.g. "Please call before arriving"'>
                <input className="form-input" name="orderNotes" value={form.orderNotes}
                  onChange={handleChange} placeholder="Any special instructions for your order" />
              </Field>

              <StepNavBar onNext={nextStep} step={step} />
            </div>
          )}

          {/* ══════════════════ STEP 2: DELIVERY ═════════════════════════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <StepLabel icon="📍" title="Delivery Address" sub="Choose how you'd like to specify your location" />

              <AddressTypeTabs active={addressTab} onChange={(tab) => { setAddressTab(tab); setErrors({}); }} />

              <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {addressTab === 'napa'     && <NapaFields     form={form} errors={errors} onChange={handleChange} />}
                {addressTab === 'landmark' && <LandmarkFields form={form} errors={errors} onChange={handleChange} />}
                {addressTab === 'gps_pin'  && (
                  <GpsPinStatus
                    locState={locState} city={detectedCity} coords={coords}
                    gpsError={errors.gpsPin}
                    manualQuery={manualQuery}
                    onManualQueryChange={v => { setManualQuery(v); setGeocodeError(null); }}
                    onManualSearch={handleManualSearch}
                    geocoding={geocoding} geocodeError={geocodeError}
                  />
                )}
                <DeliveryInstructionsField form={form} onChange={handleChange} />
              </div>

              <AddressPreview tab={addressTab} form={form} coords={coords} />

              <StepNavBar onBack={() => setStep(1)} onNext={nextStep} step={step} />
            </div>
          )}

          {/* ══════════════════ STEP 3: PAYMENT ══════════════════════════ */}
          {step === 3 && (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <StepLabel icon="💳" title="Payment Method" sub="Select how you'd like to pay" />

              {/* Payment method cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {PAYMENT_METHODS.map(m => {
                  const active = form.paymentMethod === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => handleChange({ target: { name: 'paymentMethod', value: m.value } })}
                      style={{
                        padding: '1rem', textAlign: 'left',
                        border: `2px solid ${active ? 'var(--c-gold)' : 'var(--c-border)'}`,
                        borderRadius: 'var(--radius)',
                        background: active ? 'rgba(212,175,55,0.06)' : '#fff',
                        cursor: 'pointer', transition: 'border-color 0.18s, background 0.18s',
                        position: 'relative',
                      }}
                    >
                      {active && (
                        <span style={{
                          position: 'absolute', top: '0.5rem', right: '0.5rem',
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: 'var(--c-gold)', color: '#fff',
                          fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700,
                        }}>✓</span>
                      )}
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{m.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--c-text)', marginBottom: '0.2rem' }}>{m.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--c-text-dim)' }}>{m.sub}</div>
                    </button>
                  );
                })}
              </div>

              {/* Order summary */}
              <div style={{
                background: '#1A1A1A',
                borderRadius: 'var(--radius)',
                padding: '1.25rem 1.375rem',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Order Summary
                </div>
                <DarkSummaryRow label={product?.name} value={formatTZS(subtotal)} />
                <DarkSummaryRow label="Delivery fee" value={formatTZS(DELIVERY_FEE)} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '0.75rem', paddingTop: '0.875rem' }}>
                  <DarkSummaryRow label="Total" value={formatTZS(total)} bold />
                </div>

                {/* Customer + address recap */}
                <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <RecapRow icon="👤" text={form.customerName} />
                  <RecapRow icon="📞" text={form.customerPhone} />
                  <RecapRow icon="📍" text={composeDeliveryAddress(addressTab, form, coords)} />
                </div>
              </div>

              {submitError && (
                <div role="alert" style={{
                  background: 'rgba(192,57,43,0.06)', border: '1px solid var(--c-error)',
                  borderLeft: '3px solid var(--c-gold)', borderRadius: 'var(--radius-sm)',
                  padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem',
                  alignItems: 'flex-start', fontSize: '0.875rem', lineHeight: 1.55,
                }}>
                  <span style={{ flexShrink: 0, color: 'var(--c-gold)' }}>⚠</span>
                  <span style={{ color: 'var(--c-error)' }}>{String(submitError)}</span>
                </div>
              )}

              <button type="submit" className="btn btn-gold btn-full" disabled={submitting}
                style={{ padding: '1rem', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
                {submitting
                  ? <><span className="spinner" /> Processing…</>
                  : <>Pay {formatTZS(total)} →</>
                }
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => setStep(2)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.8125rem', color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem',
                }}>
                  ← Back
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--c-text-dim)', letterSpacing: '0.02em' }}>
                  Secured by Flutterwave · Data protected
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step Label ─────────────────────────────────────────────────────────────── */
function StepLabel({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
        background: 'rgba(212,175,55,0.1)', border: '1.5px solid rgba(212,175,55,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1rem', color: 'var(--c-text)' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', marginTop: '0.1rem' }}>{sub}</div>
      </div>
    </div>
  );
}

/* ─── Step Nav Bar ───────────────────────────────────────────────────────────── */
function StepNavBar({ onBack, onNext, step }) {
  return (
    <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.375rem' }}>
      {onBack && (
        <button type="button" onClick={onBack} className="btn btn-ghost" style={{ flex: '0 0 auto', padding: '0.75rem 1.5rem' }}>
          ← Back
        </button>
      )}
      <button type="button" onClick={onNext} className="btn btn-charcoal" style={{ flex: 1, padding: '0.85rem', letterSpacing: '0.04em' }}>
        Continue →
      </button>
    </div>
  );
}

/* ─── AddressTypeTabs ─────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'napa',     icon: '🏷️', label: 'NAPA Address'     },
  { id: 'landmark', icon: '🗺️', label: 'Landmark / Street' },
  { id: 'gps_pin',  icon: '📍', label: 'GPS Pin'           },
];

function AddressTypeTabs({ active, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        Address Type
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', padding: '4px', gap: '4px' }} role="tablist">
        {TABS.map(tab => {
          const isActive = active === tab.id;
          return (
            <button key={tab.id} role="tab" aria-selected={isActive} type="button" onClick={() => onChange(tab.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.2rem', padding: '0.6rem 0.25rem', borderRadius: '7px',
              fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.3, textAlign: 'center',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
              background: isActive ? '#1A1A1A' : 'transparent',
              color:      isActive ? 'var(--c-gold)' : 'var(--c-text-muted)',
              boxShadow:  isActive ? '0 2px 8px rgba(26,26,26,0.2)' : 'none',
              border:     isActive ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── NapaFields ─────────────────────────────────────────────────────────────── */
function NapaFields({ form, errors, onChange }) {
  const selectedWard = DSM_WARDS.find(w => w.code === form.napaWard);
  const hasHoods     = selectedWard?.neighbourhoods?.length > 0;
  const districts    = [...new Set(DSM_WARDS.map(w => w.district))];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--c-gold)' }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>🏠</span>
        <span><strong>NAPA helps us find your blue house plate faster!</strong></span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
        <Field label="House / Plot No." required error={errors.napaPlot}>
          <input className={`form-input${errors.napaPlot ? ' error' : ''}`} name="napaPlot" value={form.napaPlot} onChange={onChange} placeholder="e.g. 15A, 204" autoComplete="off" />
        </Field>
        <Field label="Postcode / Ward" required error={errors.napaWard}>
          <select className={`form-select${errors.napaWard ? ' error' : ''}`} name="napaWard" value={form.napaWard} onChange={onChange}>
            {districts.map(d => (
              <optgroup key={d} label={`${d} District`}>
                {DSM_WARDS.filter(w => w.district === d).map(w => (
                  <option key={w.code} value={w.code}>{w.ward} — {w.code}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      </div>
      {hasHoods && (
        <Field label="Neighbourhood" required error={errors.napaHood}>
          <select className={`form-select${errors.napaHood ? ' error' : ''}`} name="napaHood" value={form.napaHood} onChange={onChange}>
            <option value="">— Select neighbourhood —</option>
            {selectedWard.neighbourhoods.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </Field>
      )}
    </>
  );
}

/* ─── LandmarkFields ─────────────────────────────────────────────────────────── */
function LandmarkFields({ form, errors, onChange }) {
  return (
    <>
      <Field label="Street Name" error={errors.streetName} hint="At least one of Street or Landmark is required">
        <input className={`form-input${errors.streetName ? ' error' : ''}`} name="streetName" value={form.streetName} onChange={onChange} placeholder="e.g. Morogoro Rd, Ali Hassan Mwinyi Rd" />
      </Field>
      <Field label="Famous Landmark Nearby">
        <input className="form-input" name="landmark" value={form.landmark} onChange={onChange} placeholder="e.g. Ubungo Bus Terminal, Makumbusho Village Museum" />
      </Field>
    </>
  );
}

/* ─── DeliveryInstructionsField ──────────────────────────────────────────────── */
function DeliveryInstructionsField({ form, onChange }) {
  return (
    <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '0.75rem' }}>
      <Field label="Delivery Instructions" hint='e.g. "Gonga geti jeupe", "Piga simu ukifika"'>
        <textarea className="form-input" name="deliveryInstructions" value={form.deliveryInstructions}
          onChange={onChange} placeholder={'e.g. Gonga geti jeupe\nKaribu mlangoni — tatu ya kushoto'}
          rows={2} style={{ resize: 'vertical', minHeight: '60px', lineHeight: 1.5 }} />
      </Field>
    </div>
  );
}

/* ─── GpsPinStatus ───────────────────────────────────────────────────────────── */
function GpsPinStatus({ locState, city, coords, gpsError, manualQuery, onManualQueryChange, onManualSearch, geocoding, geocodeError }) {
  const CITY_LABELS = { nairobi: 'Nairobi', arusha: 'Arusha', mombasa: 'Mombasa' };
  const base = { borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.875rem', lineHeight: 1.55, display: 'flex', alignItems: 'flex-start', gap: '0.75rem', border: '1px solid' };
  return (
    <>
      {locState === 'locating' && (
        <div style={{ ...base, background: 'rgba(212,175,55,0.06)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}>
          <span className="spinner" style={{ marginTop: '2px', color: 'var(--c-gold)' }} />
          <span>Acquiring your GPS location…</span>
        </div>
      )}
      {locState === 'in_zone' && coords && (
        <div style={{ ...base, background: 'var(--c-success-light)', borderColor: 'rgba(76,175,122,0.3)', color: 'var(--c-success)' }}>
          <span style={{ flexShrink: 0, marginTop: '1px' }}>✓</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.1rem' }}>GPS pin confirmed</strong>
            <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · within delivery zone</span>
          </div>
        </div>
      )}
      {locState === 'expanding_soon' && (
        <div style={{ ...base, background: 'rgba(212,175,55,0.07)', borderColor: 'rgba(212,175,55,0.3)', color: 'var(--c-gold)' }}>
          <span style={{ flexShrink: 0, marginTop: '1px' }}>✦</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>We are expanding soon!</strong>
            Naneka is not yet in {CITY_LABELS[city] ?? 'your city'}. Follow <strong>@NanekaDelivers</strong> to be first.
          </div>
        </div>
      )}
      {locState === 'out_of_zone' && (
        <div style={{ ...base, background: 'var(--c-error-light)', borderColor: 'rgba(224,82,82,0.3)', color: '#E08080' }}>
          <span style={{ flexShrink: 0, marginTop: '1px' }}>✕</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--c-error)' }}>Outside delivery zone</strong>
            We serve central Dar es Salaam, Masaki, and Kigamboni.
          </div>
        </div>
      )}
      {(locState === 'denied' || locState === 'error') && (
        <>
          <div style={{ ...base, background: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.25)', color: 'var(--c-text-muted)' }}>
            <span style={{ flexShrink: 0, marginTop: '1px', color: 'var(--c-gold)' }}>⊘</span>
            <span>
              <strong style={{ color: 'var(--c-text)' }}>{locState === 'denied' ? 'GPS access was denied.' : 'GPS unavailable.'}</strong>
              {' '}Search for your neighbourhood below.
            </span>
          </div>
          <ManualLocationSearch query={manualQuery} onQueryChange={onManualQueryChange} onSearch={onManualSearch} geocoding={geocoding} error={geocodeError} />
        </>
      )}
      {gpsError && <span className="form-hint" style={{ color: 'var(--c-error)' }} role="alert">{gpsError}</span>}
    </>
  );
}

/* ─── AddressPreview ─────────────────────────────────────────────────────────── */
function AddressPreview({ tab, form, coords }) {
  const hasNapa     = tab === 'napa'     && form.napaPlot.trim() && form.napaWard;
  const hasLandmark = tab === 'landmark' && (form.streetName.trim() || form.landmark.trim());
  const hasGps      = tab === 'gps_pin'  && coords;
  if (!hasNapa && !hasLandmark && !hasGps) return null;
  const preview = composeDeliveryAddress(tab, form, coords);
  return (
    <div style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
      <span style={{ color: 'var(--c-gold)', flexShrink: 0, marginTop: '2px' }}>✓</span>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--c-gold)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Saved to delivery records</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--c-text)', fontFamily: 'var(--font-serif)', lineHeight: 1.45, wordBreak: 'break-word' }}>{preview}</div>
      </div>
    </div>
  );
}

/* ─── ManualLocationSearch ───────────────────────────────────────────────────── */
function ManualLocationSearch({ query, onQueryChange, onSearch, geocoding, error }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <form onSubmit={onSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input ref={inputRef} className="form-input" value={query} onChange={e => onQueryChange(e.target.value)}
          placeholder="e.g. Posta, Mwenge, Masaki, Kariakoo" style={{ flex: 1, minWidth: 0 }}
          disabled={geocoding} aria-label="Neighbourhood or area name" />
        <button type="submit" className="btn btn-gold" disabled={geocoding || !query.trim()}
          style={{ flexShrink: 0, padding: '0 1rem', fontSize: '0.8125rem' }}>
          {geocoding ? <><span className="spinner" /> Checking…</> : 'Use Location'}
        </button>
      </div>
      {error && <div role="alert" style={{ fontSize: '0.8125rem', color: 'var(--c-error)', lineHeight: 1.5 }}>{error}</div>}
    </form>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────────────────────── */
function Field({ label, required, error, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span className="required"> *</span>}</label>
      {children}
      {hint  && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-hint" style={{ color: 'var(--c-error)' }} role="alert">{error}</span>}
    </div>
  );
}

function DarkSummaryRow({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: bold ? 0 : '0.375rem', fontSize: bold ? '1rem' : '0.875rem', fontWeight: bold ? 700 : 400, color: bold ? '#fff' : 'rgba(255,255,255,0.5)' }}>
      <span>{label}</span>
      <span style={{ color: bold ? 'var(--c-gold)' : undefined }}>{value}</span>
    </div>
  );
}

function RecapRow({ icon, text }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ wordBreak: 'break-word' }}>{text}</span>
    </div>
  );
}
