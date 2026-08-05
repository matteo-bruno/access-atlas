import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static hosts that can't be told to rewrite unknown paths to index.html serve
// `404.html` instead, so shipping a copy of the shell under that name gives the
// router a chance to run and render the deep link. GitHub Pages needs this.
const spaFallback = () => {
  let outDir;
  return {
    name: 'aa-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    // Vite emits index.html from its own `generateBundle`, so the copy has to
    // wait until the whole bundle has been written out.
    closeBundle() {
      fs.copyFileSync(path.join(outDir, 'index.html'), path.join(outDir, '404.html'));
    },
  };
};

// `base` is configurable so the Atlas can also be served from a sub-path
// (e.g. https://sonycsl.example/access-atlas/) without a rebuild of the source.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), spaFallback()],
  define: {
    // Stamped into the catalogue's URL so a returning visitor cannot be served
    // a cached `index.json` from a previous deploy. The catalogue is the one
    // file that decides what is published, and it lives at a stable path, so a
    // stale copy silently mislabels published cities as unpublished — which is
    // exactly the failure this guards against. The datasets it points at are
    // free to stay cached.
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
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
