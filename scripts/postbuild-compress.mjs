#!/usr/bin/env node
// Pre-compress the built site so static hosts that support it can serve the
// gzipped file directly, saving CPU and, on hosts that only auto-gzip small
// files, saving bytes on the wire for the ones this site cares about most
// (the platform datasets under `/data/`).
//
// What it does:
//   • Walks `dist/` (or --dir).
//   • For every text-ish file above --min bytes (default 4 KB), writes a
//     `<file>.gz` companion using Node's built-in zlib at max compression.
//   • Leaves the original file in place — the `.gz` is a companion.
//
// How to serve them:
//   • nginx:      `gzip_static on;` picks up the `.gz` automatically.
//   • Apache:     the `mod_deflate` / `mod_negotiation` config below.
//   • Caddy:      `encode gzip` uses them (Caddy prefers precompressed).
//   • GitHub Pages: does its own on-the-fly gzip; the `.gz` files it
//     deploys are harmless but unused.
//
// The script is deliberately tiny: no npm dependency, standard zlib only.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

function arg(name, fallback) {
  const flag = `--${name}`;
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return fallback;
}

const DIR = path.resolve(ROOT, arg('dir', 'dist'));
const MIN = Number(arg('min', 4 * 1024));

// Extensions worth compressing. Binary formats (png, jpg, woff2, mp4) are
// already compressed and get worse if re-gzipped.
const COMPRESSIBLE = new Set([
  '.html', '.htm',
  '.js', '.mjs', '.cjs',
  '.css',
  '.svg',
  '.json', '.geojson', '.topojson',
  '.txt', '.md',
  '.map', '.xml', '.webmanifest',
]);

function* walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) yield* walk(full);
    else yield { path: full, size: stat.size };
  }
}

function main() {
  if (!fs.existsSync(DIR)) {
    console.error(`compress: nothing to do, ${DIR} does not exist`);
    process.exit(0);
  }

  let files = 0;
  let rawTotal = 0;
  let gzTotal = 0;
  const skipped = [];

  for (const { path: full, size } of walk(DIR)) {
    if (full.endsWith('.gz')) continue;
    const ext = path.extname(full).toLowerCase();
    if (!COMPRESSIBLE.has(ext)) continue;
    if (size < MIN) {
      skipped.push({ full, size });
      continue;
    }
    const raw = fs.readFileSync(full);
    const gz = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION });
    // Only keep the companion if it is actually smaller — a few JSON files
    // with lots of unique keys can grow when zipped at short lengths.
    if (gz.length >= raw.length) continue;
    fs.writeFileSync(`${full}.gz`, gz);
    files++;
    rawTotal += raw.length;
    gzTotal += gz.length;
  }

  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  const ratio = rawTotal ? Math.round((1 - gzTotal / rawTotal) * 100) : 0;
  console.log(
    `compress: ${files} file${files === 1 ? '' : 's'} pre-gzipped in ${path.relative(ROOT, DIR)} — ${mb(rawTotal)} → ${mb(gzTotal)} (${ratio}% saving)`,
  );
}

main();
