/**
 * Axios instance for all API calls.
 *
 * Dev (Codespace / local) — VITE_API_URL is blank (.env.local overrides .env),
 *   so baseURL is '' and the Vite dev-server proxy forwards /api/* to
 *   http://localhost:3000 (see vite.config.js).
 *
 * Production (Vercel) — VITE_API_URL is set in Vercel dashboard env vars to
 *   https://naneka-backend.vercel.app so every call is fully qualified.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  // 60 s — generous enough for Cloudinary upload + bg-removal + Gemini analysis
  // running in parallel (~20–40 s on average).
  timeout: 60000,
});

export default api;
