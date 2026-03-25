/**
 * Naneka Studio — Image Processing + AI Product Cataloguer
 * Route: /studio
 *
 * Two distinct workflows:
 *  1. "Process Image"         — existing pipeline (bg removal / watermark via backend Sharp)
 *  2. "Process with Naneka AI" — Cloudinary bg removal + logo overlay, then Gemini extracts
 *                                product_name, description_en, description_sw.  Auto-fills form.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { forwardRef } from 'react';
import api from '../lib/api.js';
import { NanekaLogo } from './Storefront.jsx';

// ─── Constants ─────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_MB    = 20;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

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

function triggerDownload(src, originalName) {
  const ext      = originalName?.split('.').pop() ?? 'png';
  const filename = `naneka-studio-${Date.now()}.${ext}`;
  const a        = document.createElement('a');
  a.href         = src;
  a.download     = filename;
  a.click();
}

// ─── StudioApp ─────────────────────────────────────────────────────────────────
export default function StudioApp() {
  // ── Shared file state ──────────────────────────────────────────────────────
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState(null);

  // ── Classic pipeline state ─────────────────────────────────────────────────
  const [phase,    setPhase]    = useState('idle');   // idle|selected|processing|done|error
  const [result,   setResult]   = useState(null);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState(null);
  const [removeBg, setRemoveBg] = useState(false);
  const [addLogo,  setAddLogo]  = useState(false);

  // ── AI pipeline state ──────────────────────────────────────────────────────
  // aiPhase: idle | uploading | cleaning | thinking | done | error
  const [aiPhase,   setAiPhase]   = useState('idle');
  const [aiResult,  setAiResult]  = useState(null);   // { processedUrl, product_name, … }
  const [aiError,   setAiError]   = useState(null);
  const [aiProgress, setAiProgress] = useState(0);    // upload % for AI flow

  // ── Form (auto-filled by AI) ───────────────────────────────────────────────
  const [productName,   setProductName]   = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionSw, setDescriptionSw] = useState('');
  const [copiedField,   setCopiedField]   = useState(null); // which field was just copied

  const inputRef = useRef(null);
  const dropRef  = useRef(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  // ── File handling ──────────────────────────────────────────────────────────
  function acceptFile(f) {
    const err = validateFile(f);
    if (err) { setFileError(err); return; }
    setFileError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    // Reset both pipelines
    setResult(null); setProgress(0); setError(null); setPhase('selected');
    setAiResult(null); setAiError(null); setAiPhase('idle');
    setProductName(''); setDescriptionEn(''); setDescriptionSw('');
  }

  function handleInputChange(e) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = '';
  }

  const handleDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e) => {
    if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleReset() {
    setFile(null); setPreview(null);
    setResult(null); setProgress(0); setError(null); setPhase('idle');
    setAiResult(null); setAiError(null); setAiPhase('idle'); setAiProgress(0);
    setProductName(''); setDescriptionEn(''); setDescriptionSw('');
    setFileError(null);
  }

  // ── Classic process ────────────────────────────────────────────────────────
  async function handleProcess() {
    if (!file) return;
    setPhase('processing'); setProgress(0); setError(null);

    const body = new FormData();
    body.append('image',     file);
    body.append('removeBg',  String(removeBg));
    body.append('watermark', String(addLogo));

    try {
      const { data } = await api.post('/api/v1/media/process', body, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setResult(URL.createObjectURL(data));
      setPhase('done');
    } catch (err) {
      let msg = err.message ?? 'Processing failed.';
      if (err.response?.data instanceof Blob) {
        try { const j = JSON.parse(await err.response.data.text()); msg = j.error?.message ?? j.message ?? msg; }
        catch { /* not JSON */ }
      } else {
        const raw = err.response?.data?.message ?? err.response?.data?.error ?? msg;
        msg = typeof raw === 'string' ? raw : (raw?.message ?? JSON.stringify(raw));
      }
      setError(String(msg)); setPhase('error');
    }
  }

  // ── AI process ─────────────────────────────────────────────────────────────
  async function handleAiProcess() {
    if (!file) return;
    setAiPhase('uploading'); setAiProgress(0); setAiError(null); setAiResult(null);

    const body = new FormData();
    body.append('image', file);

    try {
      // Phase 1: upload → Cloudinary applies bg removal + logo
      setAiPhase('cleaning');
      const { data } = await api.post('/api/v1/media/ai-process', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setAiProgress(pct);
            // Once upload is done, switch to "thinking" phase for Gemini
            if (pct === 100) setAiPhase('thinking');
          }
        },
      });

      // Phase 2 complete: auto-fill form
      setAiResult(data);
      setProductName(data.product_name   ?? '');
      setDescriptionEn(data.description_en ?? '');
      setDescriptionSw(data.description_sw ?? '');
      setAiPhase('done');
    } catch (err) {
      const raw = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? 'AI processing failed.';
      setAiError(typeof raw === 'string' ? raw : JSON.stringify(raw));
      setAiPhase('error');
    }
  }

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    });
  }

  const hasFile    = !!file;
  const canProcess = hasFile && (phase === 'selected' || phase === 'error' || phase === 'done');
  const canAi      = hasFile && aiPhase !== 'uploading' && aiPhase !== 'cleaning' && aiPhase !== 'thinking';
  const aiWorking  = aiPhase === 'uploading' || aiPhase === 'cleaning' || aiPhase === 'thinking';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', fontFamily: 'var(--font-sans)', color: 'var(--c-text)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="page-header__inner container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NanekaLogo size="sm" />
            <div style={{ width: '1px', height: '24px', background: 'var(--c-border)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', letterSpacing: '0.04em' }}>
              Studio
            </span>
          </div>
          <a href="/" className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}>
            ← Storefront
          </a>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
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
            Upload a Kariakoo product photo. Remove the background, overlay your logo, and let Gemini AI write the catalogue copy — in English and Swahili.
          </p>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '740px', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 2.5rem) 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* File error */}
        {fileError && (
          <div role="alert" style={{ background: 'var(--c-error-light)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', color: 'var(--c-error)', fontSize: '0.875rem' }}>
            ⚠ {fileError}
          </div>
        )}

        {/* ── Drop zone ──────────────────────────────────────────────── */}
        <DropZone
          ref={dropRef}
          dragging={dragging}
          preview={preview}
          file={file}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onBrowse={() => inputRef.current?.click()}
          onClear={handleReset}
        />

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          aria-label="Upload image"
        />

        {/* ════════════════════════════════════════════════════════════
            SECTION A — Process with Naneka AI
           ════════════════════════════════════════════════════════════ */}
        {hasFile && (
          <div style={{
            background: 'linear-gradient(135deg, #FFFEF9 0%, #FDF7E8 100%)',
            border: '1.5px solid rgba(197,160,33,0.35)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(197,160,33,0.10)',
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(197,160,33,0.2)',
              background: 'rgba(197,160,33,0.06)',
              display: 'flex', alignItems: 'center', gap: '0.625rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--c-text)' }}>
                  Process with Naneka AI
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', marginTop: '0.1rem' }}>
                  Cloudinary removes the background + adds logo · Gemini writes the copy
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {/* AI error */}
              {aiPhase === 'error' && aiError && (
                <div role="alert" style={{
                  background: 'var(--c-error-light)', border: '1px solid var(--c-error)',
                  borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
                  color: 'var(--c-error)', fontSize: '0.875rem', marginBottom: '1rem',
                  display: 'flex', gap: '0.5rem',
                }}>
                  <span>⚠</span> <span>{aiError}</span>
                </div>
              )}

              {/* ── AI Working spinner ── */}
              {aiWorking && <AiSpinner phase={aiPhase} progress={aiProgress} />}

              {/* ── Trigger button ── */}
              {!aiWorking && aiPhase !== 'done' && (
                <button
                  className="btn btn-gold btn-full"
                  onClick={handleAiProcess}
                  disabled={!canAi}
                  style={{ padding: '1rem', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <span style={{ fontSize: '1.1rem' }}>✦</span>
                  Process with Naneka AI
                </button>
              )}

              {/* ── AI Done: processed image + auto-filled form ── */}
              {aiPhase === 'done' && aiResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Success bar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    background: 'var(--c-success-light)', border: '1px solid rgba(46,125,82,0.25)',
                    borderRadius: 'var(--radius-sm)', padding: '0.625rem 1rem',
                    color: 'var(--c-success)', fontSize: '0.875rem', fontWeight: 600,
                  }}>
                    <span>✓</span>
                    <span>AI processing complete — form auto-filled below</span>
                  </div>

                  {/* Processed image */}
                  <div style={{
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    border: '1px solid rgba(197,160,33,0.3)',
                    boxShadow: 'var(--shadow-gold)',
                  }}>
                    <div style={{
                      padding: '0.5rem 0.875rem',
                      fontSize: '0.75rem', fontWeight: 700,
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      color: 'var(--c-gold)',
                      background: 'rgba(197,160,33,0.06)',
                      borderBottom: '1px solid rgba(197,160,33,0.2)',
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                    }}>
                      <span>✦</span> Cleaned by Cloudinary
                    </div>
                    <div style={{
                      background: 'repeating-conic-gradient(#F0EDE6 0% 25%, #FAF9F5 0% 50%) 0 0 / 20px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      minHeight: '200px',
                    }}>
                      <img
                        src={aiResult.processedUrl}
                        alt="AI processed"
                        style={{ width: '100%', maxHeight: '340px', objectFit: 'contain', display: 'block' }}
                        onContextMenu={e => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Auto-filled product form */}
                  <div style={{
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📋</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        Product Info — Auto-Filled by Gemini
                      </span>
                    </div>

                    <div style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <FormField
                        label="Product Name"
                        lang="EN"
                        value={productName}
                        onChange={setProductName}
                        copied={copiedField === 'name'}
                        onCopy={() => copyToClipboard(productName, 'name')}
                        singleLine
                      />
                      <FormField
                        label="Description"
                        lang="EN"
                        value={descriptionEn}
                        onChange={setDescriptionEn}
                        copied={copiedField === 'desc_en'}
                        onCopy={() => copyToClipboard(descriptionEn, 'desc_en')}
                      />
                      <FormField
                        label="Maelezo"
                        lang="SW"
                        value={descriptionSw}
                        onChange={setDescriptionSw}
                        copied={copiedField === 'desc_sw'}
                        onCopy={() => copyToClipboard(descriptionSw, 'desc_sw')}
                      />
                    </div>
                  </div>

                  {/* Action row */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-gold"
                      onClick={() => triggerDownload(aiResult.processedUrl, file?.name)}
                      style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', flex: '2', minWidth: '180px' }}
                    >
                      ↓ Download Cleaned Image
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => { setAiPhase('idle'); setAiResult(null); }}
                      style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', flex: '1', minWidth: '120px' }}
                    >
                      ↺ Re-run AI
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            SECTION B — Classic pipeline (bg removal / watermark)
           ════════════════════════════════════════════════════════════ */}
        {hasFile && (
          <details style={{
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}>
            <summary style={{
              padding: '0.875rem 1.125rem',
              cursor: 'pointer',
              fontSize: '0.8125rem', fontWeight: 700,
              color: 'var(--c-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
              userSelect: 'none',
              listStyle: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>⚙️  Classic Processing (Sharp / remove.bg)</span>
              <span style={{ fontSize: '0.7rem' }}>▼</span>
            </summary>

            <div style={{ padding: '0 1.125rem 1.125rem' }}>
              {/* Classic error */}
              {error && (
                <div role="alert" style={{
                  background: 'var(--c-error-light)', border: '1px solid var(--c-error)',
                  borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
                  color: 'var(--c-error)', fontSize: '0.875rem', marginBottom: '1rem',
                  display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                }}>
                  <span>⚠</span> <span>{error}</span>
                </div>
              )}

              <ProcessingOptions removeBg={removeBg} onRemoveBg={setRemoveBg} addLogo={addLogo} onAddLogo={setAddLogo} />

              {canProcess && phase !== 'processing' && (
                <button
                  className="btn btn-gold btn-full"
                  onClick={handleProcess}
                  style={{ marginTop: '1rem', padding: '0.875rem', fontSize: '0.9rem' }}
                >
                  ✦ Process Image
                </button>
              )}

              {phase === 'processing' && <ProcessingState progress={progress} />}

              {phase === 'done' && result && (
                <div style={{ marginTop: '1rem' }}>
                  <ResultPanel before={preview} after={result} fileName={file?.name} onReset={() => { setPhase('selected'); setResult(null); }} />
                </div>
              )}
            </div>
          </details>
        )}

      </main>
    </div>
  );
}

// ─── DropZone ─────────────────────────────────────────────────────────────────
const DropZone = forwardRef(function DropZone(
  { dragging, preview, file, onDragOver, onDragLeave, onDrop, onBrowse, onClear }, ref
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
        border:         `2px dashed ${dragging ? 'var(--c-gold)' : hasFile ? 'transparent' : 'var(--c-border)'}`,
        borderRadius:   'var(--radius-lg)',
        background:     dragging ? 'rgba(197,160,33,0.06)' : hasFile ? 'var(--c-surface)' : 'var(--c-surface-2)',
        boxShadow:      hasFile ? 'var(--shadow-md)' : dragging ? 'var(--shadow-gold)' : 'none',
        transition:     'border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s',
        transform:      dragging ? 'scale(1.01)' : 'none',
        cursor:         hasFile ? 'default' : 'pointer',
        overflow:       'hidden',
        minHeight:      hasFile ? 'auto' : '200px',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        textAlign:      'center',
        padding:        hasFile ? 0 : '2rem 1.5rem',
        position:       'relative',
      }}
    >
      {!hasFile ? (
        <>
          <div style={{
            width: '56px', height: '56px',
            background: 'rgba(197,160,33,0.10)',
            border: '1.5px solid rgba(197,160,33,0.25)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', marginBottom: '1rem',
          }}>
            {dragging ? '✦' : '↑'}
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.35rem' }}>
            {dragging ? 'Drop your image here' : 'Drag & drop your product photo'}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', marginBottom: '1rem' }}>
            or tap to browse your gallery
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['JPG', 'PNG', 'WebP'].map(f => (
              <span key={f} style={{
                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em',
                color: 'var(--c-text-muted)', background: 'var(--c-surface-3)',
                padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid var(--c-border)',
              }}>{f}</span>
            ))}
          </div>
        </>
      ) : (
        <>
          <img
            src={preview}
            alt="Selected"
            style={{
              width: '100%', maxHeight: '320px', objectFit: 'contain', display: 'block',
              background: 'repeating-conic-gradient(#F0EDE6 0% 25%, #FAF9F5 0% 50%) 0 0 / 20px 20px',
            }}
          />
          <div style={{
            width: '100%', padding: '0.75rem 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)', gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🖼️</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{readableSize(file.size)}</div>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={e => { e.stopPropagation(); onClear(); }} style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', flexShrink: 0 }}>
              ✕ Change
            </button>
          </div>
        </>
      )}
    </div>
  );
});

// ─── AiSpinner ─────────────────────────────────────────────────────────────────
function AiSpinner({ phase, progress }) {
  const messages = {
    uploading: { icon: '⬆', title: 'Uploading image…',                  sub: `${progress}% transferred` },
    cleaning:  { icon: '✂',  title: 'Cloudinary is removing background…', sub: 'AI is cleaning the image — hang tight' },
    thinking:  { icon: '🧠', title: 'Gemini is thinking…',               sub: 'Extracting product name and descriptions' },
  };

  const { icon, title, sub } = messages[phase] ?? messages.thinking;

  return (
    <div style={{
      padding: '2rem 1.5rem',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
    }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      `}</style>

      {/* Dual-ring spinner */}
      <div style={{ position: 'relative', width: '56px', height: '56px', marginBottom: '0.25rem' }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: '3px solid rgba(197,160,33,0.15)',
          borderTopColor: 'var(--c-gold)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '8px',
          border: '2px solid rgba(197,160,33,0.10)',
          borderTopColor: 'rgba(197,160,33,0.5)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem',
          animation: 'pulse 1.8s ease-in-out infinite',
        }}>
          {icon}
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--c-text)', margin: 0 }}>
        {title}
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', margin: 0 }}>{sub}</p>

      {/* Phase step indicators */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
        {[
          { key: 'uploading', label: 'Upload' },
          { key: 'cleaning',  label: 'Clean' },
          { key: 'thinking',  label: 'AI Write' },
        ].map(({ key, label }, i, arr) => {
          const phases = ['uploading', 'cleaning', 'thinking'];
          const done   = phases.indexOf(phase) > phases.indexOf(key);
          const active = phase === key;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.7rem', fontWeight: 600,
                color: active ? 'var(--c-gold)' : done ? 'var(--c-success)' : 'var(--c-text-dim)',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: active ? 'var(--c-gold)' : done ? 'var(--c-success)' : 'var(--c-border)',
                  animation: active ? 'pulse 1s ease-in-out infinite' : 'none',
                  flexShrink: 0,
                }} />
                {label}
              </div>
              {i < arr.length - 1 && (
                <div style={{ width: '20px', height: '1px', background: 'var(--c-border)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar (upload phase only) */}
      {phase === 'uploading' && progress > 0 && (
        <div style={{ width: '100%', maxWidth: '280px', background: 'var(--c-surface-3)', borderRadius: '999px', height: '4px', overflow: 'hidden', marginTop: '0.25rem' }}>
          <div style={{
            height: '100%',
            width: `${Math.max(progress, 6)}%`,
            background: 'linear-gradient(90deg, var(--c-gold-dark), var(--c-gold))',
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Indeterminate shimmer (cleaning / thinking phases) */}
      {(phase === 'cleaning' || phase === 'thinking') && (
        <div style={{ width: '100%', maxWidth: '280px', background: 'var(--c-surface-3)', borderRadius: '999px', height: '4px', overflow: 'hidden', position: 'relative', marginTop: '0.25rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--c-gold-dark), var(--c-gold))', opacity: 0.3 }} />
          <div style={{ position: 'absolute', inset: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(197,160,33,0.9), transparent)', animation: 'shimmer 1.4s ease-in-out infinite' }} />
        </div>
      )}
    </div>
  );
}

// ─── FormField ─────────────────────────────────────────────────────────────────
function FormField({ label, lang, value, onChange, copied, onCopy, singleLine = false }) {
  const langColors = { EN: { bg: 'rgba(59,130,246,0.08)', text: '#2563EB', border: 'rgba(59,130,246,0.2)' }, SW: { bg: 'rgba(34,197,94,0.08)', text: '#16A34A', border: 'rgba(34,197,94,0.2)' } };
  const lc = langColors[lang] ?? langColors.EN;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text)' }}>{label}</label>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
            padding: '0.1rem 0.45rem', borderRadius: '999px',
            background: lc.bg, color: lc.text, border: `1px solid ${lc.border}`,
          }}>{lang}</span>
        </div>
        <button
          onClick={onCopy}
          style={{
            background: copied ? 'var(--c-success-light)' : 'var(--c-surface-2)',
            border: `1px solid ${copied ? 'rgba(46,125,82,0.3)' : 'var(--c-border)'}`,
            borderRadius: 'var(--radius-sm)',
            color: copied ? 'var(--c-success)' : 'var(--c-text-muted)',
            fontSize: '0.75rem', fontWeight: 600,
            padding: '0.25rem 0.625rem', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      {singleLine ? (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', padding: '0.625rem 0.75rem',
            border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--c-surface)', color: 'var(--c-text)',
            fontSize: '0.9375rem', fontWeight: 600,
            fontFamily: 'var(--font-sans)', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          style={{
            width: '100%', padding: '0.625rem 0.75rem',
            border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--c-surface)', color: 'var(--c-text)',
            fontSize: '0.875rem', lineHeight: 1.6,
            fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
}

// ─── ProcessingOptions ─────────────────────────────────────────────────────────
function ProcessingOptions({ removeBg, onRemoveBg, addLogo, onAddLogo }) {
  return (
    <div style={{ marginTop: '0.75rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      <ToggleOption icon="✂️" label="Remove Background" description="Strip the background via remove.bg." checked={removeBg} onChange={onRemoveBg} bordered />
      <ToggleOption icon="🏷️" label="Add Logo"           description="Overlay the Naneka watermark."       checked={addLogo}  onChange={onAddLogo} />
    </div>
  );
}

function ToggleOption({ icon, label, description, checked, onChange, bordered }) {
  const id = `opt-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <label htmlFor={id} style={{
      display: 'flex', alignItems: 'flex-start', gap: '1rem',
      padding: '0.875rem 1rem',
      borderBottom: bordered ? '1px solid var(--c-border)' : 'none',
      cursor: 'pointer',
      background: checked ? 'rgba(197,160,33,0.04)' : 'transparent',
    }}>
      <span style={{ fontSize: '1.2rem', marginTop: '1px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--c-text)', marginBottom: '0.15rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', lineHeight: 1.5 }}>{description}</div>
      </div>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
        <div style={{ width: '40px', height: '22px', background: checked ? 'var(--c-gold)' : '#DDD9CC', borderRadius: '999px', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ position: 'absolute', top: '3px', left: checked ? '19px' : '3px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </div>
      </div>
    </label>
  );
}

// ─── ProcessingState ───────────────────────────────────────────────────────────
function ProcessingState({ progress }) {
  const uploading = progress < 100;
  return (
    <div style={{ marginTop: '1rem', padding: '1.5rem', textAlign: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
      {!uploading ? (
        <div style={{ width: '40px', height: '40px', margin: '0 auto 0.875rem', border: '3px solid rgba(197,160,33,0.2)', borderTopColor: 'var(--c-gold)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      ) : (
        <div style={{ fontSize: '2rem', marginBottom: '0.875rem' }}>⚙️</div>
      )}
      <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--c-text)', marginBottom: '0.25rem' }}>
        {uploading ? 'Uploading image…' : 'AI is processing your image…'}
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-muted)', marginBottom: '1rem' }}>
        {uploading ? `${progress}% uploaded` : 'Hang tight — this can take a few seconds'}
      </p>
      <div style={{ background: 'var(--c-surface-3)', borderRadius: '999px', height: '5px', overflow: 'hidden', maxWidth: '260px', margin: '0 auto', position: 'relative' }}>
        {uploading ? (
          <div style={{ height: '100%', width: `${Math.max(progress, 8)}%`, background: 'linear-gradient(90deg, var(--c-gold-dark), var(--c-gold))', borderRadius: '999px', transition: 'width 0.3s ease' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--c-gold-dark), var(--c-gold))', opacity: 0.35 }} />
            <div style={{ position: 'absolute', inset: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(197,160,33,0.9), transparent)', animation: 'shimmer 1.4s ease-in-out infinite' }} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── ResultPanel ───────────────────────────────────────────────────────────────
function ResultPanel({ before, after, fileName, onReset }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'var(--c-success-light)', border: '1px solid rgba(46,125,82,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 1rem', color: 'var(--c-success)', fontSize: '0.875rem', fontWeight: 600 }}>
        <span>✓</span><span>Image processed successfully</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.875rem' }}>
        <ImagePanel label="Before" src={before} />
        <ImagePanel label="After"  src={after}  accent />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-gold" onClick={() => triggerDownload(after, fileName)} style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', flex: 2, minWidth: '180px' }}>↓ Download Result</button>
        <button className="btn btn-ghost" onClick={onReset} style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', flex: 1, minWidth: '110px' }}>↺ Retry</button>
      </div>
    </div>
  );
}

function ImagePanel({ label, src, accent }) {
  return (
    <div style={{ background: 'var(--c-surface)', border: `1px solid ${accent ? 'rgba(197,160,33,0.4)' : 'var(--c-border)'}`, borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: accent ? 'var(--shadow-gold)' : 'var(--shadow-sm)' }}>
      <div style={{ padding: '0.45rem 0.875rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: accent ? 'var(--c-gold)' : 'var(--c-text-muted)', background: accent ? 'rgba(197,160,33,0.06)' : 'var(--c-surface-2)', borderBottom: `1px solid ${accent ? 'rgba(197,160,33,0.25)' : 'var(--c-border)'}`, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        {accent && <span>✦</span>}{label}
      </div>
      <div style={{ background: 'repeating-conic-gradient(#F0EDE6 0% 25%, #FAF9F5 0% 50%) 0 0 / 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
        <img src={src} alt={label} style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }} onContextMenu={e => e.stopPropagation()} />
      </div>
    </div>
  );
}
