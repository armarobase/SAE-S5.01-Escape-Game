import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, le frontend (5173) relaie l'API REST et le WebSocket vers le backend (3000).
// Le navigateur ne parle donc qu'à un seul serveur : pas de CORS à configurer.
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': BACKEND,
      '/ws': { target: BACKEND.replace(/^http/, 'ws'), ws: true },
    },
  },
});
