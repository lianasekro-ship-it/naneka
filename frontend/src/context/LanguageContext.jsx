/**
 * LanguageContext — Swahili / English toggle
 *
 * Persists preference to localStorage under 'naneka_lang'.
 * Default: 'sw' (Swahili — primary market language).
 *
 * Usage:
 *   const { lang, setLang, t } = useLanguage();
 *   t('buyNow')  →  'Nunua Sasa' or 'Buy Now'
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { translations } from '../lib/translations.js';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'naneka_lang';
const SUPPORTED   = ['sw', 'en'];

function getSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(saved) ? saved : 'sw';
  } catch {
    return 'sw';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLang);

  const setLang = useCallback((l) => {
    if (!SUPPORTED.includes(l)) return;
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    setLangState(l);
  }, []);

  const t = useCallback((key, fallback) => {
    return translations[lang]?.[key]
      ?? translations['en']?.[key]
      ?? fallback
      ?? key;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(lang === 'sw' ? 'en' : 'sw');
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

/**
 * Language toggle button — drop-in anywhere in the header.
 */
export function LanguageToggle({ style = {} }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      onClick={toggleLang}
      title={lang === 'sw' ? 'Switch to English' : 'Badili kwa Kiswahili'}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '0.375rem',
        padding:        '0.375rem 0.75rem',
        border:         '1.5px solid var(--c-gold, #C5A021)',
        borderRadius:   '20px',
        background:     'transparent',
        cursor:         'pointer',
        fontSize:       '0.75rem',
        fontWeight:     700,
        color:          'var(--c-gold, #C5A021)',
        letterSpacing:  '0.04em',
        transition:     'all 0.15s',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--c-gold, #C5A021)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--c-gold, #C5A021)';
      }}
    >
      <span style={{ fontSize: '0.875rem' }}>{lang === 'sw' ? '🇹🇿' : '🇬🇧'}</span>
      <span>{lang === 'sw' ? 'SW' : 'EN'}</span>
      <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>▾</span>
    </button>
  );
}
