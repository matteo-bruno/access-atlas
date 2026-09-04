import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
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

// Two cases, and they are not the same thing:
//
//   1. A request for `x.geojson` where only `x.geojson.gz` was built. This is
//      the build artefact case — the plain file exists in `public/`, and
//      postbuild-compress wrote a companion next to it in `dist/`. nginx calls
//      this `gzip_static on`.
//
//   2. A request for `x.geojson.gz`, which is what the catalogue now names for
//      15minCity: the *only* copy on disk is compressed, to keep the served
//      tree small. Here the `.gz` is the resource, not an optimisation of it,
//      and the response has to carry the type of what it decodes to
//      (application/geo+json) rather than the type of the container.
//
// Both end up sending the same bytes with `Content-Encoding: gzip`. A client
// that did not offer gzip is decompressed for, rather than refused — rare, but
// a static host would do the same and it keeps the file readable by anything.
function sendMaybeGzipped(res, gzPath, decodedName, acceptsGzip, next) {
  const type = TYPES[path.extname(decodedName).toLowerCase()];
  if (type) res.setHeader('Content-Type', type);
  // One URL, two representations: a shared cache has to key on the header or
  // it will hand gzip bytes to a client that cannot decode them.
  res.setHeader('Vary', 'Accept-Encoding');

  if (acceptsGzip) {
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Length', fs.statSync(gzPath).size);
    fs.createReadStream(gzPath).pipe(res);
    return;
  }

  zlib.gunzip(fs.readFileSync(gzPath), (err, buf) => {
    if (err) return next(err);
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  });
}

const precompressedMiddleware = (roots, base) => (req, res, next) => {
  const url = (req.url ?? '').split('?')[0].split('#')[0];
  // Strip the deploy base so a sub-path build still resolves inside the root.
  const rel = decodeURIComponent(
    url.startsWith(base) ? url.slice(base.length) : url.replace(/^\//, ''),
  );
  if (!rel) return next();

  const acceptsGzip = (req.headers['accept-encoding'] ?? '').includes('gzip');

  for (const root of roots) {
    // Never let a crafted path climb out of the directory being served.
    const file = path.resolve(root, rel);
    if (file !== root && !file.startsWith(root + path.sep)) continue;

    // Case 2: the URL already names the compressed file.
    if (rel.endsWith('.gz') && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return sendMaybeGzipped(res, file, file.slice(0, -3), acceptsGzip, next);
    }

    // Case 1: a companion sits beside the plain file. Only worth doing when
    // the client asked — otherwise let the static handler send the original.
    const gz = `${file}.gz`;
    if (acceptsGzip && fs.existsSync(gz) && fs.statSync(gz).isFile()) {
      return sendMaybeGzipped(res, gz, file, true, next);
    }
  }

  return next();
};

// Vite's own servers do neither case on their own: preview is plain sirv, and
// dev serves `public/` straight through, so a `.gz` in the catalogue would
// reach the browser as undecodable bytes with no Content-Encoding on it. This
// makes both behave like the production server will.
const servePrecompressed = () => ({
  name: 'aa-serve-precompressed',
  apply: 'serve',
  configureServer(server) {
    const roots = [server.config.publicDir].filter(Boolean);
    server.middlewares.use(precompressedMiddleware(roots, server.config.base || '/'));
  },
  configurePreviewServer(server) {
    const outDir = path.resolve(server.config.root, server.config.build.outDir);
    server.middlewares.use(precompressedMiddleware([outDir], server.config.base || '/'));
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
