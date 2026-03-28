/**
 * ProductTryOn — Virtual product visualizer
 *
 * Uses Cloudinary on-the-fly URL transformations to show the product
 * in different environments / backgrounds.
 *
 * Falls back gracefully when no Cloudinary URL is available.
 */

import { useState, useEffect } from 'react';

const CLOUD_NAME = 'dbbazeb34';

const ENVIRONMENTS = [
  { id: 'studio',  label: 'Studio',      bg: 'f5f5f0', emoji: '🏛️' },
  { id: 'gold',    label: 'Gold',        bg: 'FEF3C7', emoji: '✨' },
  { id: 'dark',    label: 'Night',       bg: '1a1a2e', emoji: '🌙' },
  { id: 'nature',  label: 'Nature',      bg: 'd4edda', emoji: '🌿' },
  { id: 'ocean',   label: 'Ocean',       bg: 'cce5ff', emoji: '🌊' },
];

/**
 * Build a Cloudinary URL that overlays the product on a solid-colour background.
 * Works with any public Cloudinary image URL.
 */
function buildEnvUrl(publicId, bgHex) {
  if (!publicId) return null;
  // Remove any existing transformations by using just the public_id
  const cleanId = publicId.replace(/\//g, ':');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/b_rgb:${bgHex},c_pad,w_600,h_600/e_background_removal/${publicId}`;
}

/**
 * Extract Cloudinary publicId from a full URL (if possible),
 * or use the raw URL directly.
 */
function resolveImageSrc(product, envBg) {
  // If product has a Cloudinary processedUrl, use it and swap background
  const processed = product?.processedUrl ?? product?.processed_url;
  if (processed && processed.includes('cloudinary.com')) {
    // Extract publicId from the URL
    const match = processed.match(/\/upload\/(?:[^/]+\/)*(.+)\.[a-z]+$/i);
    if (match) {
      const pubId = match[1];
      return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/b_rgb:${envBg},c_pad,w_600,h_600/${pubId}`;
    }
  }

  // Raw cloudinary URL — apply background color transformation
  const raw = product?.rawUrl ?? product?.image_url ?? product?.image ?? product?.images?.[0];
  if (raw && raw.includes('cloudinary.com')) {
    const match = raw.match(/\/upload\/(?:[^/]+\/)*(.+)\.[a-z]+$/i);
    if (match) {
      const pubId = match[1];
      return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/b_rgb:${envBg},c_pad,w_600,h_600/e_background_removal/${pubId}`;
    }
  }

  // Fallback — plain image with CSS background color
  return raw ?? null;
}

export default function ProductTryOn({ product, onClose }) {
  const [activeEnv, setActiveEnv] = useState(ENVIRONMENTS[0]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const [zoom,      setZoom]      = useState(false);

  // Reset on env change
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [activeEnv.id]);

  const imageSrc = resolveImageSrc(product, activeEnv.bg);
  const plainSrc = product?.image_url ?? product?.image ?? product?.images?.[0];

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C5A021', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Virtual Try-On
            </p>
            <h3 style={{ margin: '0.1rem 0 0', fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 800 }}>
              {product?.name ?? 'Product Viewer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: 'none', background: '#f5f5f5', cursor: 'pointer',
              fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Image canvas */}
        <div
          onClick={() => setZoom(z => !z)}
          style={{
            position: 'relative',
            background: `#${activeEnv.bg}`,
            aspectRatio: '1',
            overflow: 'hidden',
            cursor: zoom ? 'zoom-out' : 'zoom-in',
            transition: 'background 0.35s ease',
          }}
        >
          {/* Loading shimmer */}
          {!imgLoaded && !imgError && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(135deg, #${activeEnv.bg} 0%, #fff 50%, #${activeEnv.bg} 100%)`,
              backgroundSize: '200% 200%',
              animation: 'shimmer 1.5s infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '2rem', opacity: 0.3 }}>{activeEnv.emoji}</span>
            </div>
          )}

          {imageSrc && (
            <img
              key={`${activeEnv.id}-${imageSrc}`}
              src={imageSrc}
              alt={product?.name}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: zoom ? 'cover' : 'contain',
                padding: zoom ? 0 : '1.5rem',
                transition: 'all 0.3s ease',
                opacity: imgLoaded ? 1 : 0,
              }}
            />
          )}

          {/* Fallback on Cloudinary transform error */}
          {imgError && plainSrc && (
            <img
              src={plainSrc}
              alt={product?.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1.5rem' }}
            />
          )}

          {/* Zoom hint */}
          {imgLoaded && !imgError && (
            <div style={{
              position: 'absolute', bottom: '0.625rem', right: '0.625rem',
              background: 'rgba(0,0,0,0.45)', color: '#fff',
              fontSize: '0.65rem', padding: '0.25rem 0.5rem', borderRadius: '4px',
            }}>
              {zoom ? 'Click to fit' : 'Click to zoom'}
            </div>
          )}
        </div>

        {/* Environment selector */}
        <div style={{ padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
            Try in different environments
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {ENVIRONMENTS.map(env => (
              <button
                key={env.id}
                onClick={() => setActiveEnv(env)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  border: `2px solid ${activeEnv.id === env.id ? '#C5A021' : '#e8e8e8'}`,
                  borderRadius: '24px',
                  background: activeEnv.id === env.id ? '#FEF3C7' : '#fafafa',
                  cursor: 'pointer',
                  fontSize: '0.8125rem', fontWeight: activeEnv.id === env.id ? 700 : 400,
                  color: activeEnv.id === env.id ? '#92700A' : '#555',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: `#${env.bg}`,
                  border: '1px solid rgba(0,0,0,0.12)',
                  flexShrink: 0,
                }} />
                {env.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid #f0f0f0',
          display: 'flex', gap: '0.75rem', alignItems: 'center',
          background: '#fafafa',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.125rem' }}>Price</div>
            <div style={{ fontWeight: 800, color: '#C5A021', fontSize: '1.125rem' }}>
              TZS {Number(product?.price ?? 0).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-gold"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}
          >
            Buy Now →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
