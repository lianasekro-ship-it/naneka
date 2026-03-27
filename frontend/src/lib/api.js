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

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  'https://naneka-backend.vercel.app';

const api = axios.create({
  baseURL: BACKEND_URL,
  // 60 s — generous enough for Cloudinary upload + bg-removal + Gemini analysis
  // running in parallel (~20–40 s on average).
  timeout: 60000,
});

// Attach whichever auth token is available on every request.
// Phone-OTP customers use a custom JWT stored in localStorage.
// Admin/staff use a Supabase session token (handled separately via supabase-js).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('naneka_phone_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Surface the backend's human-readable error message instead of Axios's generic
// "Request failed with status code XXX". The backend returns two shapes:
//   { error: "string message" }            (explicit route errors)
//   { error: { message: "string" } }       (global errorHandler)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const d = err.response?.data;
    const backendMsg =
      (typeof d?.error === 'string'         ? d.error         : null) ??
      (typeof d?.error?.message === 'string' ? d.error.message : null) ??
      (typeof d?.message === 'string'        ? d.message       : null);
    if (backendMsg) err.message = backendMsg;
    return Promise.reject(err);
  },
);

export default api;
