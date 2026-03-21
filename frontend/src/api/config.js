/**
 * Returns the API base URL appropriate for the current environment.
 *
 * Always returns an empty string so that all /api/* requests are handled by
 * the Vite dev-server proxy (see vite.config.js). The proxy forwards them to
 * http://localhost:3000 from inside the container, which works in both local
 * dev and GitHub Codespaces without needing port 3000 to be separately
 * forwarded or publicly accessible.
 */
export function getApiBaseUrl() {
  return '';
}
