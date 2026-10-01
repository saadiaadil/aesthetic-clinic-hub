import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // Pre-bundle lazily imported deps so the first visit to a route never triggers a dev reload.
    include: [
      'react',
      'react-dom/client',
      'react-router',
      'framer-motion',
      'lucide-react',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
      'zustand',
      'zustand/middleware',
      'tailwind-merge',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        // Long-term cacheable vendor chunks (matched by path so sub-entries such as react-dom/client are included).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|react-router|scheduler|cookie|set-cookie-parser)\//.test(id)) return 'react';
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
          if (/node_modules\/(react-hook-form|@hookform|zod)\//.test(id)) return 'forms';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    // Phase 5: proxy REST calls to the Express API during development.
    // proxy: { '/api': 'http://localhost:5000' },
  },
});
