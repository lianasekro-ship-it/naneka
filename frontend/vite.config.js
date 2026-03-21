import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow Codespaces/GitHub preview hostnames to access the dev server
    // without triggering Vite's host check ("Blocked request" warning).
    allowedHosts: 'all',
    // Serve index.html for all non-asset paths so React Router handles deep links
    // (e.g. /orders/:id/track on a hard reload won't 404 through the proxy).
    historyApiFallback: true,
    proxy: {
      // Forward all /api/* requests to the Express backend during development.
      // This avoids CORS issues without needing to change browser fetch URLs.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Surface a clear JSON error instead of a raw proxy connection error
        // when the backend is not running.
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[vite-proxy] Backend not reachable:', err.message);
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { message: 'Backend server is not running. Start it with: cd backend && npm run dev' },
              }));
            }
          });
        },
      },
    },
  },
});
