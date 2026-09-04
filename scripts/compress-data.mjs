#!/usr/bin/env node
// Convert a platform's published files to gzip-on-disk, and repoint the
// catalogue at them.
//
// The Atlas is served from a machine where the size of the data tree is the
// binding constraint, so a platform can keep only the compressed copy of each
// file: `milan.geojson` becomes `milan.geojson.gz` and the catalogue names the
// `.gz`. Everything that reads published data goes through
// `scripts/lib/datafile.mjs`, and the dev, preview and production servers send
// these with `Content-Encoding: gzip`, so nothing downstream changes.
//
// Usage:
//   npm run compress:data -- --platform fifteen
//   npm run compress:data -- --all
//   npm run compress:data -- --platform cardep --dry-run
//   npm run compress:data -- --platform fifteen --decompress   # back out
//
// Idempotent: a platform already stored gzipped is reported and skipped.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, 'public/data');
const CATALOGUE = path.join(DATA, 'index.json');

function arg(name, fallback) {
  const flag = `--${name}`;
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

const DRY_RUN = has('dry-run');
const DECOMPRESS = has('decompress');
const ALL = has('all');
const PLATFORM = arg('platform');

// Every catalogue field that names a file, so repointing cannot miss one.
// `hourly.hexcover` / `hourly.times` are `{hh}` templates and are rewritten
// the same way — the suffix moves, the template does not.
const PATH_FIELDS = ['dataset', 'geoDataset', 'cartogramDataset'];

function mapPath(p) {
  if (typeof p !== 'string') return p;
  if (DECOMPRESS) return p.endsWith('.gz') ? p.slice(0, -3) : p;
  return p.endsWith('.gz') ? p : `${p}.gz`;
}

/** Rewrite every file reference under one platform's catalogue entry. */
function repoint(entry) {
  if (typeof entry.coverage === 'string') entry.coverage = mapPath(entry.coverage);
  if (typeof entry.summary === 'string') entry.summary = mapPath(entry.summary);
  for (const city of entry.cities ?? []) {
    for (const field of PATH_FIELDS) {
      if (typeof city[field] === 'string') city[field] = mapPath(city[field]);
    }
    if (city.cartograms && typeof city.cartograms === 'object') {
      for (const [k, v] of Object.entries(city.cartograms)) city.cartograms[k] = mapPath(v);
    }
    for (const scenario of city.scenarios ?? []) {
      if (typeof scenario.dataset === 'string') scenario.dataset = mapPath(scenario.dataset);
    }
    if (city.hourly) {
      for (const k of ['hexcover', 'times']) {
        if (typeof city.hourly[k] === 'string') city.hourly[k] = mapPath(city.hourly[k]);
      }
    }
  }
}

/** Every file the platform's directory holds, compressed or not. */
function filesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) out.push(...filesIn(full));
    else out.push(full);
  }
  return out;
}

function convert(file) {
  const isGz = file.endsWith('.gz');
  if (DECOMPRESS) {
    if (!isGz) return null;
    const plain = file.slice(0, -3);
    const buf = zlib.gunzipSync(fs.readFileSync(file));
    if (!DRY_RUN) {
      fs.writeFileSync(plain, buf);
      fs.rmSync(file);
    }
    return { before: fs.existsSync(file) ? fs.statSync(file).size : 0, after: buf.length };
  }
  if (isGz) return null; // already done
  const raw = fs.readFileSync(file);
  const gz = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION });
  if (!DRY_RUN) {
    fs.writeFileSync(`${file}.gz`, gz);
    fs.rmSync(file);
  }
  return { before: raw.length, after: gz.length };
}

function main() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));
  const names = ALL ? Object.keys(catalogue.platforms ?? {}) : PLATFORM ? [PLATFORM] : [];

  if (!names.length) {
    console.error('name a platform with --platform <id>, or --all');
    console.error(`available: ${Object.keys(catalogue.platforms ?? {}).join(', ')}`);
    process.exit(1);
  }

  const verb = DECOMPRESS ? 'decompressing' : 'compressing';
  console.log(`${verb} ${names.join(', ')}${DRY_RUN ? ' (dry run)' : ''}\n`);

  let before = 0;
  let after = 0;
  let count = 0;

  for (const name of names) {
    const entry = catalogue.platforms?.[name];
    if (!entry) {
      console.error(`  ${name}: not in the catalogue — skipped`);
      process.exitCode = 1;
      continue;
    }

    let platformBefore = 0;
    let platformAfter = 0;
    let converted = 0;
    for (const file of filesIn(path.join(DATA, name))) {
      const result = convert(file);
      if (!result) continue;
      platformBefore += result.before;
      platformAfter += result.after;
      converted++;
    }

    repoint(entry);
    before += platformBefore;
    after += platformAfter;
    count += converted;

    const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
    console.log(
      converted
        ? `  ${name.padEnd(12)} ${String(converted).padStart(3)} files  ${mb(platformBefore).padStart(9)} → ${mb(platformAfter).padStart(9)}`
        : `  ${name.padEnd(12)} nothing to do`,
    );
  }

  // The atlas section names files too, and its cities live outside
  // `platforms`, so it is repointed whenever its own directory was touched.
  if (catalogue.atlas?.cities && (ALL || names.includes('atlas'))) {
    repoint(catalogue.atlas);
  }

  if (!DRY_RUN) fs.writeFileSync(CATALOGUE, `${JSON.stringify(catalogue, null, 2)}\n`);

  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (count) {
    const pct = before ? Math.round((1 - after / before) * 100) : 0;
    console.log(
      `\n${count} files  ${mb(before)} → ${mb(after)}` +
        (DECOMPRESS ? '' : ` (${pct}% of the data tree recovered)`),
    );
  }
  console.log(
    DRY_RUN ? 'dry run — nothing written' : 'run `npm run test:data` to validate.',
  );
}

main();
