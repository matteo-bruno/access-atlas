#!/usr/bin/env node
// Import whatever in `input_data/` has changed since it was last imported,
// and nothing else.
//
//   npm run update:data                     every platform
//   npm run update:data -- --15mincity      only the platforms named (--citychrone, --pov, --cdi)
//   npm run update:data -- --dry-run        list what would be imported
//   npm run update:data -- --force          re-import every file, changed or not
//   npm run update:data -- --baseline       record the files as imported, import nothing
//
// What has been imported is recorded in `input_data/manifest.json`, one entry
// per source file: its SHA-256, and a fingerprint of the importer that read
// it. The manifest is committed; the source files are not.
//
// Three decisions worth knowing before changing this:
//
//   • **Content, not dates.** A file is new or changed when its hash is. A
//     re-download or a copy between machines resets a file's mtime without
//     changing a byte of it, and would re-import every city for nothing.
//   • **The manifest is written last.** Only after the import succeeded *and*
//     `test:data` passed. An interrupted or rejected run therefore leaves the
//     file looking unimported, and the next run offers it again, rather than
//     recording as published a city that is not.
//   • **A source removed from `input_data/` does not unpublish its city.** It
//     is reported, and the manifest keeps its entry. Taking a city off the
//     site should be a decision, not the side effect of a tidied folder.
//
// A change to the importer itself (or to the helpers it reads) is reported as
// such, and not acted on unless `--force` is given: a refactor would
// otherwise re-import every city, and a fix that should reach published data
// is something to decide on, not to have happen.
//
// A source is whatever the platform hands over: a zip, the same folder
// unpacked, or (15minCity) one GeoJSON. Its file name gives the city:
// `zurich_pov.zip`, `zurich_cdi.zip`, `Zurich.zip`, `Zurich.geojson` → `zurich`.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { slugify } from './lib/slug.mjs';
import * as pov from './importers/pov.mjs';
import * as cdi from './importers/cdi.mjs';
import * as fifteen from './importers/fifteen.mjs';
import * as citychrone from './importers/citychrone.mjs';

const IMPORTERS = { '15mincity': fifteen, citychrone, pov, cdi };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const INPUT = path.join(ROOT, 'input_data');
const MANIFEST = path.join(INPUT, 'manifest.json');

// ── platforms ────────────────────────────────────────────────────────
// One per input folder. Each changed source is imported on its own with
// `scripts/import-data.mjs <id> <source>`; `fingerprint` is every file whose
// change can change what that produces.
const SHARED = [
  'scripts/import-data.mjs',
  'scripts/lib/bundle.mjs',
  'scripts/lib/zip.mjs',
  'scripts/lib/datafile.mjs',
  'scripts/lib/country.mjs',
  'scripts/lib/countries.geojson.gz',
  'scripts/lib/slug.mjs',
  'scripts/importers/common.mjs',
];
const PLATFORMS = ['15mincity', 'citychrone', 'pov', 'cdi'].map((id) => {
  const importer = IMPORTERS[id];
  const module = `scripts/importers/${importer.layer === 'cardep' ? 'cdi' : importer.layer}.mjs`;
  return {
    id,
    dir: importer.dir,
    accepts: importer.accepts,
    slug: (f) => slugify(importer.cityName(f)),
    fingerprint: [module, ...SHARED],
  };
});

// ── args ─────────────────────────────────────────────────────────────
const OPTIONS = new Set(['dry-run', 'force', 'baseline', 'help']);
const argv = process.argv.slice(2);
const opts = new Set();
const named = [];
for (const a of argv) {
  const name = a.replace(/^-+/, '');
  if (!a.startsWith('-') || !name) fail(`unexpected argument: ${a}`);
  if (OPTIONS.has(name)) opts.add(name);
  else if (PLATFORMS.some((p) => p.id === name)) named.push(name);
  else fail(`unknown option: ${a}`);
}

if (opts.has('help')) {
  const text = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const usage = text.split('\n').slice(4, 9).map((l) => l.replace(/^\/\/ ?/, ''));
  console.log(usage.join('\n'));
  process.exit(0);
}
if (opts.has('force') && opts.has('baseline')) fail('--force and --baseline contradict each other');

const DRY_RUN = opts.has('dry-run');
const selected = named.length ? PLATFORMS.filter((p) => named.includes(p.id)) : PLATFORMS;

// ── helpers ──────────────────────────────────────────────────────────
function fail(message) {
  console.error(`update-data: ${message}`);
  process.exit(2);
}

function sha256(file) {
  // A source may be an unpacked folder: its hash covers every file's path and
  // content, so renaming or editing any one of them is a change.
  if (fs.statSync(file).isDirectory()) {
    const hash = crypto.createHash('sha256');
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir).sort()) {
        if (name.startsWith('.')) continue;
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full);
        else hash.update(`${path.relative(file, full)}\0${sha256(full)}\0`);
      }
    };
    walk(file);
    return hash.digest('hex');
  }
  // Streamed in chunks rather than read whole: exports run to tens of MB.
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.allocUnsafe(1 << 20);
  try {
    let n;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) hash.update(buf.subarray(0, n));
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function fingerprintOf(platform) {
  const hash = crypto.createHash('sha256');
  for (const rel of platform.fingerprint) {
    hash.update(rel);
    hash.update(fs.readFileSync(path.join(ROOT, rel)));
  }
  return hash.digest('hex').slice(0, 16);
}

// An absent manifest is a first run. A manifest that is there and cannot be
// read is not: treating it as empty would re-import everything and then
// overwrite the record of what had been imported.
function readManifest() {
  if (!fs.existsSync(MANIFEST)) return { version: 1, files: {} };
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    if (!m || typeof m.files !== 'object') throw new Error('no "files" object');
    return m;
  } catch (err) {
    fail(`${path.relative(ROOT, MANIFEST)} is unreadable (${err.message}); restore it from git before running again`);
  }
}

function writeManifest(manifest) {
  const sorted = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
  const tmp = `${MANIFEST}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify({ ...manifest, files: sorted }, null, 2)}\n`);
  fs.renameSync(tmp, MANIFEST);
}

function run(script, args) {
  const res = spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  return res.status === 0;
}

const rel = (p) => path.relative(ROOT, p);

function sizeOf(file) {
  const stat = fs.statSync(file);
  if (!stat.isDirectory()) return stat.size;
  return fs.readdirSync(file).reduce((sum, name) => sum + sizeOf(path.join(file, name)), 0);
}

// ── scan ─────────────────────────────────────────────────────────────
const manifest = readManifest();
const plan = []; // { platform, key, file, slug, sha, size, reason }
const removed = [];
const stale = [];
let tracked = 0;

for (const platform of selected) {
  const dir = path.join(INPUT, platform.dir);
  const fingerprint = fingerprintOf(platform);
  platform.currentFingerprint = fingerprint;

  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => !f.startsWith('.') && platform.accepts(f)).sort()
    : [];
  const seen = new Set();

  // Two files mapping to one slug would each overwrite the other's city,
  // and which one ends up published would depend on the order of a loop.
  const bySlug = new Map();
  for (const f of files) {
    const s = platform.slug(f);
    if (bySlug.has(s)) fail(`${platform.dir}/${bySlug.get(s)} and ${platform.dir}/${f} are both city "${s}"; rename one`);
    bySlug.set(s, f);
  }

  for (const f of files) {
    const key = `${platform.dir}/${f}`;
    const file = path.join(dir, f);
    const size = sizeOf(file);
    const sha = sha256(file);
    const prev = manifest.files[key];
    seen.add(key);

    let reason = null;
    if (!prev) reason = 'new';
    else if (prev.sha256 !== sha) reason = 'changed';
    else if (opts.has('force')) reason = 'forced';
    else if (prev.importer !== fingerprint) stale.push(key);

    if (reason) plan.push({ platform, key, file, slug: platform.slug(f), sha, size, reason });
    else if (prev.importer === fingerprint) tracked += 1;
  }

  for (const key of Object.keys(manifest.files)) {
    if (key.startsWith(`${platform.dir}/`) && !seen.has(key)) removed.push(key);
  }
}

// ── report ───────────────────────────────────────────────────────────
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(
  `update-data: ${selected.map((p) => p.id).join(', ')}: ` +
    `${plan.length} to import, ${tracked} up to date` +
    (stale.length ? `, ${stale.length} from an older importer` : '') +
    (DRY_RUN ? ' (dry run)' : ''),
);
for (const item of plan) {
  console.log(`  ${item.reason.padEnd(8)} ${item.key}  → ${item.slug}  (${mb(item.size)})`);
}
for (const key of removed) {
  console.log(`  missing  ${key}  no longer in input_data/, its city stays published`);
}
if (stale.length) {
  console.log(
    `  ${stale.length} file(s) were imported by an earlier version of the importer; ` +
      'run with --force to re-import them',
  );
}

if (!plan.length) {
  console.log('nothing to import.');
  process.exit(0);
}
if (DRY_RUN) process.exit(0);

// ── baseline: record without importing ──────────────────────────────
// For a tree whose published data already came from these files: without it
// the first run would re-import every city just to learn that it had.
if (opts.has('baseline')) {
  const now = new Date().toISOString();
  for (const item of plan) {
    manifest.files[item.key] = {
      sha256: item.sha,
      size: item.size,
      importer: item.platform.currentFingerprint,
      importedAt: now,
      baseline: true,
    };
  }
  writeManifest(manifest);
  console.log(`recorded ${plan.length} file(s) in ${rel(MANIFEST)} without importing them.`);
  process.exit(0);
}

// ── import ───────────────────────────────────────────────────────────
// One importer process per city, so a failure is attributed to the file that
// caused it: the importer carries on past a failed city and reports it only
// through its exit code, which for a batch would not say which one.
const done = [];
const failed = [];
for (const item of plan) {
  console.log(`\n── ${item.platform.id}: ${item.slug} (${item.reason})`);
  if (run('scripts/import-data.mjs', [item.platform.id, item.file])) done.push(item);
  else failed.push(item);
}

if (!done.length) {
  console.error(`\nevery import failed (${failed.map((i) => i.key).join(', ')}); manifest unchanged.`);
  process.exit(1);
}

// ── validate, then record ────────────────────────────────────────────
console.log('\n── test:data');
if (!run('scripts/test-data.mjs', [])) {
  console.error(
    '\ntest:data failed on the imported data, so the manifest is unchanged and the next run will offer ' +
      'the same files again.\nInspect with `git status public/data`. If the import is at fault, ' +
      '`git checkout -- public/data` puts back the files it changed; the ones it created show as untracked.',
  );
  process.exit(1);
}

const now = new Date().toISOString();
for (const item of done) {
  manifest.files[item.key] = {
    sha256: item.sha,
    size: item.size,
    importer: item.platform.currentFingerprint,
    importedAt: now,
  };
}
writeManifest(manifest);

console.log(`\nimported ${done.length} file(s); ${rel(MANIFEST)} updated.`);
if (failed.length) {
  console.error(`${failed.length} failed and stay pending: ${failed.map((i) => i.key).join(', ')}`);
  process.exit(1);
}
console.log('next: review `git status`, commit public/data and the manifest, then scripts/deploy.sh.');
