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

// Serve the `.gz` companions `scripts/postbuild-compress.mjs` writes.
//
// Vite's preview server is plain sirv: it serves `milan.geojson` as 8.5 MB
// whether or not a `milan.geojson.gz` sits beside it and whether or not the
// client asked for gzip. That made the whole pre-compression step invisible
// locally — the files were on disk, nothing read them, and `npm run preview`
// looked exactly like a build with no compression at all.
//
// This is what nginx's `gzip_static on` does, in about fifteen lines: if the
// client accepts gzip and a `.gz` companion exists, send that instead with
// `Content-Encoding: gzip`. It applies to preview only — in dev the files are
// served from `public/` and no companions have been built.
//
// Content-Type has to be set here: the response path ends in `.gz`, so the
// type would otherwise be sniffed as gzip rather than the JSON it decodes to.
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.txt': 'text/plain',
  '.map': 'application/json',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

const servePrecompressed = () => ({
  name: 'aa-serve-precompressed',
  apply: 'serve',
  configurePreviewServer(server) {
    const outDir = path.resolve(server.config.root, server.config.build.outDir);
    const base = server.config.base || '/';

    server.middlewares.use((req, res, next) => {
      if (!req.headers['accept-encoding']?.includes('gzip')) return next();

      const url = (req.url ?? '').split('?')[0].split('#')[0];
      // Strip the deploy base so a sub-path build resolves inside outDir.
      const rel = decodeURIComponent(
        url.startsWith(base) ? url.slice(base.length) : url.replace(/^\//, ''),
      );
      // Never let a crafted path climb out of the build directory.
      const file = path.resolve(outDir, rel);
      if (file !== outDir && !file.startsWith(outDir + path.sep)) return next();

      const gz = `${file}.gz`;
      if (!fs.existsSync(gz) || !fs.statSync(gz).isFile()) return next();

      const type = TYPES[path.extname(file).toLowerCase()];
      if (type) res.setHeader('Content-Type', type);
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Length', fs.statSync(gz).size);
      // Same bytes under two encodings: caches must key on the header.
      res.setHeader('Vary', 'Accept-Encoding');
      fs.createReadStream(gz).pipe(res);
    });
  },
});

// `base` is configurable so the Atlas can also be served from a sub-path
// (e.g. https://sonycsl.example/access-atlas/) without a rebuild of the source.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), spaFallback(), servePrecompressed()],
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
