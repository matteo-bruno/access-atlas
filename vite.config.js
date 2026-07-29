import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is configurable so the Atlas can also be served from a sub-path
// (e.g. https://sonycsl.example/access-atlas/) without a rebuild of the source.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  // MapLibre spawns its worker with `{ type: 'module' }`, so Vite must emit
  // workers as ES modules rather than the default IIFE.
  worker: { format: 'es' },
  build: {
    // maplibre-gl is large and only the map routes need it; keeping it in its
    // own chunk means the FAQ/Contact pages don't pay for it.
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl'],
        },
      },
    },
  },
});
