/**
 * Returns the API base URL appropriate for the current environment.
 *
 * Production: VITE_API_URL is set in .env.production → https://naneka-backend.vercel.app
 * Dev/Codespace: VITE_API_URL is blank → Vite proxy forwards /api/* to localhost:3000
 */
export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || '';
}
