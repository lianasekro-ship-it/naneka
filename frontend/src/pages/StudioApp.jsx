/**
 * Naneka Studio — Image Processing
 * Route: /studio
 *
 * Upload an image → select options → POST /api/v1/media/process
 * → show Before / After with a Download button.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { NanekaLogo } from './Storefront.jsx';
// ─── Constants ─────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_MB     = 20;
const MAX_FILE_BYTES  = MAX_FILE_MB * 1024 * 1024;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function readableSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Unsupported file type. Please use JPG, PNG, or WebP.';
  if (file.size > MAX_FILE_BYTES)          return `File too large. Maximum size is ${MAX_FILE_MB} MB.`;
  return null;
}

// Resolve whatever the API returns into a displayable URL.
// Handles: { processedUrl }, { resultUrl }, { result }, { url }, raw base64 strings.
function resolveResultUrl(data) {
  if (!data) return null;
  if (typeof data === 'string') return data; // raw URL or base64
  return data.processedUrl ?? data.resultUrl ?? data.result ?? data.url ?? null;
}

function triggerDownload(src, originalName) {
  const ext      = originalName?.split('.').pop() ?? 'png';
  const filename = `naneka-studio-${Date.now()}.${ext}`;

  // If it's already a data URL or same-origin URL, download directly
  const a    = document.createElement('a');
  a.href     = src;
  a.download = filename;
  a.click();
}

// ─── StudioApp ────────────────────────────────────────────────────────────────
export default function StudioApp() {
  // State machine: idle | selected | processing | done | error
  const [phase,    setPhase]    = useState('idle');
  const [file,     setFile]     = useState(null);     // File object
  const [preview,  setPreview]  = useState(null);     // Object URL for before image
  const [result,   setResult]   = useState(null);     // Processed image URL
  const [progress, setProgress] = useState(0);        // 0–100 upload progress
  const [error,    setError]    = useState(null);

  // Options
  const [removeBg,  setRemoveBg]  = useState(false);
  const [addLogo,   setAddLogo]   = useState(false);

  // Drag state
  const [dragging, setDragging] = useState(false);

  const inputRef  = useRef(null);
  const dropRef   = useRef(null);

  // Revoke preview URL when file changes to avoid memory leaks
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  // ── File selection ─────────────────────────────────────────────────────────
  function acceptFile(f) {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setProgress(0);
    setPhase('selected');
  }

  function handleInputChange(e) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = '';
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Process ────────────────────────────────────────────────────────────────
  async function handleProcess() {
    if (!file) return;
    setPhase('processing');
    setProgress(0);
    setError(null);

    // Field names must match what the backend's multer / route expects:
    //   image      → upload.single('image')
    //   removeBg   → req.body.removeBg
    //   watermark  → req.body.watermark
    const body = new FormData();
    body.append('image',     file);
    body.append('removeBg',  String(removeBg));
    body.append('watermark', String(addLogo));

    try {
      // responseType: 'blob' is required — the backend returns raw binary image data,
      // not a JSON payload with a URL.
      const { data } = await axios.post('/api/v1/media/process', body, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      // Convert the binary blob into a local object URL the <img> can display.
      const url = URL.createObjectURL(data);
      setResult(url);
      setPhase('done');
    } catch (err) {
      // When responseType is 'blob', error bodies also arrive as Blobs — parse them.
      let msg = err.message ?? 'Processing failed. Please try again.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          msg = json.error?.message ?? json.message ?? msg;
        } catch { /* blob wasn't JSON — keep the original message */ }
      } else {
        const raw = err.response?.data?.message ?? err.response?.data?.error ?? msg;
        msg = typeof raw === 'string' ? raw : (raw?.message ?? JSON.stringify(raw) ?? msg);
      }
      setError(String(msg));
      setPhase('error');
    }
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(0);
    setError(null);
    setPhase('idle');
  }

  // Keeps the current file selected — only clears the error so the user can
  // adjust options and retry without re-uploading the image.
  function handleRetry() {
    setError(null);
    setProgress(0);
    setPhase('selected');
  }

  const canProcess = phase === 'selected' || phase === 'error';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', fontFamily: 'var(--font-sans)', color: 'var(--c-text)' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="page-header__inner container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NanekaLogo size="sm" />
            <div style={{ width: '1px', height: '24px', background: 'var(--c-border)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', letterSpacing: '0.04em' }}>
              Studio
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a href="/" className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}>
              ← Storefront
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #FFFEF9 0%, #FDF8EC 100%)',
        borderBottom: '1px solid rgba(197,160,33,0.15)',
        padding: 'clamp(2.5rem, 5vw, 3.5rem) 1.5rem',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(197,160,33,0.08)', border: '1px solid rgba(197,160,33,0.3)',
            borderRadius: '999px', padding: '0.25rem 0.875rem', marginBottom: '1.25rem',
          }}>
            <span style={{ fontSize: '0.9rem' }}>✦</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              AI Image Processing
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.875rem, 5vw, 2.75rem)', fontWeight: 900, color: 'var(--c-text)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '0.875rem' }}>
            Naneka Studio
          </h1>
          <div className="gold-divider" style={{ margin: '0 auto 0.875rem' }} />
          <p style={{ fontSize: '1rem', color: 'var(--c-text-muted)', lineHeight: 1.65, fontWeight: 300 }}>
            Upload a product photo, remove the background, or add your logo — then download the result instantly.
          </p>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 2.5rem) 1.25rem' }}>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {error && (
          <div role="alert" style={{
            background: 'var(--c-error-light)', border: '1px solid var(--c-error)',
            borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem',
            color: 'var(--c-error)', fontSize: '0.875rem', lineHeight: 1.5,
            marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{String(error)}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <button
                className="btn"
                onClick={handleRetry}
                style={{
                  background: 'var(--c-error)', color: '#fff', border: 'none',
                  fontSize: '0.8125rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
                }}
              >
                ↺ Try Again
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleReset}
                style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem', color: 'var(--c-error)', borderColor: 'var(--c-error)' }}
              >
                ✕ Change Image
              </button>
            </div>
          </div>
        )}

        {/* ── Drop zone ────────────────────────────────────────────────── */}
        {phase !== 'done' && (
          <DropZone
            ref={dropRef}
            dragging={dragging}
            preview={preview}
            file={file}
            phase={phase}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onBrowse={() => inputRef.current?.click()}
            onClear={handleReset}
          />
        )}

        {/* Hidden file input — accept=image/* + capture for mobile gallery/camera */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          aria-label="Upload image"
        />

        {/* ── Options ──────────────────────────────────────────────────── */}
        {(phase === 'selected' || phase === 'error') && (
          <ProcessingOptions
            removeBg={removeBg}  onRemoveBg={setRemoveBg}
            addLogo={addLogo}    onAddLogo={setAddLogo}
          />
        )}

        {/* ── Process button ────────────────────────────────────────────── */}
        {canProcess && (
          <button
            className="btn btn-gold btn-full"
            onClick={handleProcess}
            style={{ marginTop: '1rem', padding: '1rem', fontSize: '0.9375rem' }}
          >
            ✦ Process Image
          </button>
        )}

        {/* ── Progress ─────────────────────────────────────────────────── */}
        {phase === 'processing' && (
          <ProcessingState progress={progress} />
        )}

        {/* ── Before / After result ─────────────────────────────────────── */}
        {phase === 'done' && (
          <ResultPanel
            before={preview}
            after={result}
            fileName={file?.name}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

/* ─── DropZone ───────────────────────────────────────────────────────────────── */
import { forwardRef } from 'react';

const DropZone = forwardRef(function DropZone(
  { dragging, preview, file, phase, onDragOver, onDragLeave, onDrop, onBrowse, onClear },
  ref
) {
  const hasFile = !!file;

  return (
    <div
      ref={ref}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={!hasFile ? onBrowse : undefined}
      role={!hasFile ? 'button' : undefined}
      tabIndex={!hasFile ? 0 : undefined}
      onKeyDown={!hasFile ? (e => { if (e.key === 'Enter' || e.key === ' ') onBrowse(); }) : undefined}
      aria-label={!hasFile ? 'Upload image' : undefined}
      style={{
        border:        `2px dashed ${dragging ? 'var(--c-gold)' : hasFile ? 'transparent' : 'var(--c-border)'}`,
        borderRadius:  'var(--radius-lg)',
        background:    dragging
          ? 'rgba(197,160,33,0.06)'
          : hasFile ? 'var(--c-surface)' : 'var(--c-surface-2)',
        boxShadow:     hasFile ? 'var(--shadow-md)' : dragging ? 'var(--shadow-gold)' : 'none',
        transition:    'border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s',
        transform:     dragging ? 'scale(1.01)' : 'none',
        cursor:        hasFile ? 'default' : 'pointer',
        overflow:      'hidden',
        minHeight:     hasFile ? 'auto' : '220px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        justifyContent:'center',
        textAlign:     'center',
        padding:       hasFile ? 0 : '2.5rem 1.5rem',
        position:      'relative',
      }}
    >
      {!hasFile ? (
        // Empty state
        <>
          <div style={{
            width: '64px', height: '64px',
            background: 'rgba(197,160,33,0.10)',
            border: '1.5px solid rgba(197,160,33,0.25)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', marginBottom: '1.25rem',
            transition: 'background 0.2s',
          }}>
            {dragging ? '✦' : '↑'}
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.4rem' }}>
            {dragging ? 'Drop your image here' : 'Drag & drop your image'}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--c-text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            or tap to browse your gallery
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['JPG', 'PNG', 'WebP'].map(f => (
              <span key={f} style={{
                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em',
                color: 'var(--c-text-muted)', background: 'var(--c-surface-3)',
                padding: '0.2rem 0.6rem', borderRadius: '999px',
                border: '1px solid var(--c-border)',
              }}>{f}</span>
            ))}
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em',
              color: 'var(--c-text-dim)', padding: '0.2rem 0.6rem',
            }}>up to {MAX_FILE_MB} MB</span>
          </div>
        </>
      ) : (
        // File selected — show large preview
        <>
          <img
            src={preview}
            alt="Selected"
            style={{
              width: '100%',
              maxHeight: '360px',
              objectFit: 'contain',
              display: 'block',
              background: 'repeating-conic-gradient(#F0EDE6 0% 25%, #FAF9F5 0% 50%) 0 0 / 20px 20px',
            }}
          />
          {/* File info bar */}
          <div style={{
            width: '100%',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--c-border)',
            background: 'var(--c-surface)',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🖼️</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{readableSize(file.size)}</div>
              </div>
            </div>
            <button
              className="btn btn-ghost"
              onClick={e => { e.stopPropagation(); onClear(); }}
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', flexShrink: 0 }}
            >
              ✕ Change
            </button>
          </div>
        </>
      )}
    </div>
  );
});

/* ─── ProcessingOptions ──────────────────────────────────────────────────────── */
function ProcessingOptions({ removeBg, onRemoveBg, addLogo, onAddLogo }) {
  return (
    <div style={{
      marginTop: '1rem',
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xs)',
    }}>
      <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Processing Options
        </span>
      </div>
      <ToggleOption
        icon="✂️"
        label="Remove Background"
        description="Strip the background, leaving a transparent PNG — ideal for product shots."
        checked={removeBg}
        onChange={onRemoveBg}
        bordered
      />
      <ToggleOption
        icon="🏷️"
        label="Add Logo"
        description="Overlay the Naneka watermark on the processed image."
        checked={addLogo}
        onChange={onAddLogo}
      />
    </div>
  );
}

function ToggleOption({ icon, label, description, checked, onChange, bordered }) {
  const id = `opt-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <label htmlFor={id} style={{
      display: 'flex', alignItems: 'flex-start', gap: '1rem',
      padding: '1rem 1.125rem',
      borderBottom: bordered ? '1px solid var(--c-border)' : 'none',
      cursor: 'pointer',
      transition: 'background 0.15s',
      background: checked ? 'rgba(197,160,33,0.04)' : 'transparent',
    }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'var(--c-surface-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = checked ? 'rgba(197,160,33,0.04)' : 'transparent'; }}
    >
      <span style={{ fontSize: '1.25rem', marginTop: '1px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--c-text)', marginBottom: '0.2rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
      {/* Toggle switch */}
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          style={{ display: 'none' }} aria-checked={checked} />
        <div style={{
          width: '44px', height: '24px',
          background: checked ? 'var(--c-gold)' : '#DDD9CC',
          borderRadius: '999px',
          position: 'relative',
          transition: 'background 0.2s',
          boxShadow: checked ? '0 2px 8px rgba(197,160,33,0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            position: 'absolute',
            top: '3px', left: checked ? '23px' : '3px',
            width: '18px', height: '18px',
            background: '#fff',
            borderRadius: '50%',
            transition: 'left 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>
    </label>
  );
}

/* ─── ProcessingState ────────────────────────────────────────────────────────── */
function ProcessingState({ progress }) {
  // Once upload is done (100%), the server runs bg-removal / watermarking.
  // We switch to an indeterminate shimmer so the UI never looks frozen.
  const uploading = progress < 100;

  const messages = [
    'Uploading image…',
    'Analysing pixels…',
    'Applying AI processing…',
    'Finalising result…',
  ];
  const msgIdx = uploading
    ? Math.min(Math.floor(progress / 34), 1)
    : 2;

  return (
    <div style={{
      marginTop: '1rem',
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 'var(--radius)',
      padding: '2rem 1.5rem',
      textAlign: 'center',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Spinner shown during server-side processing */}
      {!uploading ? (
        <div style={{
          width: '48px', height: '48px', margin: '0 auto 1rem',
          border: '3px solid rgba(197,160,33,0.2)',
          borderTopColor: 'var(--c-gold)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
      ) : (
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚙️</div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}
      </style>

      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.375rem' }}>
        {messages[msgIdx]}
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', marginBottom: '1.25rem' }}>
        {uploading ? 'This may take a moment for large files' : 'AI is working on your image — hang tight…'}
      </p>

      {/* Determinate bar while uploading; shimmer bar while server processes */}
      <div style={{ background: 'var(--c-surface-3)', borderRadius: '999px', height: '6px', overflow: 'hidden', maxWidth: '320px', margin: '0 auto', position: 'relative' }}>
        {uploading ? (
          <div style={{
            height: '100%',
            width: `${Math.max(progress, 8)}%`,
            background: 'linear-gradient(90deg, var(--c-gold-dark), var(--c-gold))',
            borderRadius: '999px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 8px rgba(197,160,33,0.4)',
          }} />
        ) : (
          // Indeterminate shimmer — background removal can take 5–15 s
          <>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, var(--c-gold-dark), var(--c-gold))',
              opacity: 0.35,
            }} />
            <div style={{
              position: 'absolute', inset: 0, width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(197,160,33,0.9), transparent)',
              animation: 'shimmer 1.4s ease-in-out infinite',
            }} />
          </>
        )}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--c-text-dim)', marginTop: '0.5rem' }}>
        {uploading ? `${progress}% uploaded` : 'Processing on server…'}
      </p>
    </div>
  );
}

/* ─── ResultPanel ────────────────────────────────────────────────────────────── */
function ResultPanel({ before, after, fileName, onReset }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Success note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        background: 'var(--c-success-light)', border: '1px solid rgba(46,125,82,0.25)',
        borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
        color: 'var(--c-success)', fontSize: '0.875rem', fontWeight: 600,
      }}>
        <span>✓</span>
        <span>Image processed successfully</span>
      </div>

      {/* Before / After grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '1rem',
      }}>
        <ImagePanel label="Before" src={before} />
        <ImagePanel label="After"  src={after} accent />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-gold btn-full"
          onClick={() => triggerDownload(after, fileName)}
          style={{ padding: '0.9rem', fontSize: '0.9375rem', flex: '2', minWidth: '200px' }}
        >
          ↓ Download Result
        </button>
        <button
          className="btn btn-ghost"
          onClick={onReset}
          style={{ padding: '0.9rem 1.25rem', fontSize: '0.875rem', flex: '1', minWidth: '120px' }}
        >
          ↺ New Image
        </button>
      </div>

      {/* Mobile share hint */}
      <p style={{ textAlign: 'center', fontSize: '0.78125rem', color: 'var(--c-text-dim)', lineHeight: 1.5 }}>
        On mobile: long-press the After image to save directly to your gallery
      </p>
    </div>
  );
}

function ImagePanel({ label, src, accent }) {
  return (
    <div style={{
      background: 'var(--c-surface)',
      border:     `1px solid ${accent ? 'rgba(197,160,33,0.4)' : 'var(--c-border)'}`,
      borderRadius: 'var(--radius)',
      overflow:   'hidden',
      boxShadow:  accent ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
    }}>
      {/* Label */}
      <div style={{
        padding:     '0.5rem 0.875rem',
        fontSize:    '0.75rem',
        fontWeight:  700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color:       accent ? 'var(--c-gold)' : 'var(--c-text-muted)',
        background:  accent ? 'rgba(197,160,33,0.06)' : 'var(--c-surface-2)',
        borderBottom:`1px solid ${accent ? 'rgba(197,160,33,0.25)' : 'var(--c-border)'}`,
        display:     'flex',
        alignItems:  'center',
        gap:         '0.375rem',
      }}>
        {accent && <span>✦</span>}
        {label}
      </div>
      {/* Image */}
      <div style={{
        background: 'repeating-conic-gradient(#F0EDE6 0% 25%, #FAF9F5 0% 50%) 0 0 / 20px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '220px',
      }}>
        <img
          src={src}
          alt={label}
          style={{
            width: '100%',
            maxHeight: '320px',
            objectFit: 'contain',
            display: 'block',
          }}
          // Allow long-press save on mobile
          onContextMenu={e => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
