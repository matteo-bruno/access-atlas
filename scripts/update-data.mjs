#!/usr/bin/env node
// Import whatever in `input_data/` is new or has changed, and nothing else.
//
//   npm run update:data                     every platform
//   npm run update:data -- --15mincity      only the platforms named (--citychrone, --pov, --cdi)
//   npm run update:data -- --dry-run        list what would be imported
//   npm run update:data -- --force          re-import every file, changed or not
//   npm run update:data -- --stats          then recompute the statistics without asking
//   npm run update:data -- --no-stats       … or leave them, without asking
//
// What a city was imported from is recorded in the city's own record,
// `public/data/cities/<city>/city.json`: per layer, the export's SHA-256, its
// file name, and a fingerprint of the importer that read it. The record also
// keeps `createdAt`, the date the city was first published. An export whose
// hash matches its record is skipped, so adding a few cities touches only
// those cities; `--force` recomputes everything.
//
// Decisions worth knowing before changing this:
//
//   • **Content, not dates.** A file is new or changed when its hash is. A
//     re-download or a copy between machines resets a file's mtime without
//     changing a byte of it, and would re-import every city for nothing.
//   • **A layer that is published and has no hash on record is adopted, not
//     re-imported.** Its export's hash is recorded and nothing else changes:
//     the cities published before hashes were recorded stay exactly as they
//     are. `--force` re-imports them.
//   • **The catalogue, coverage and summaries are rebuilt once, at the end**,
//     from every city's record, not patched after each city. A run therefore
//     cannot leave the catalogue pointing at one state of a city and a world
//     map showing another, and the rebuild also repairs index files edited or
//     reverted by hand.
//   • **Hashes are recorded last.** Only after the imports, the rebuild *and*
//     `test:data` passed. An interrupted or rejected run therefore leaves the
//     export looking unimported, and the next run offers it again, rather
//     than recording as published a city that is not.
//   • **A source removed from `input_data/` does not unpublish its city.** It
//     is reported, and the record keeps it. Taking a city off the site is a
//     decision: `npm run import -- <platform> --remove <city>`.
//
//   • **The statistics are offered, not imposed.** A run that changed a city
//     leaves that city's statistics out of date, and the rebuild above takes
//     them off the Stats page. The run then asks whether to recompute them
//     (`npm run stats`); in a terminal it waits for an answer, anywhere else
//     it says how and moves on. Declining is safe: out-of-date figures are
//     never published, only missing until computed.
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
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { slugify } from './lib/slug.mjs';
import { describeHidden } from './lib/quality.mjs';
import { staleCities } from './lib/stats.mjs';
import { buildIndex, listCities, readCityRecord, recordSource } from './lib/bundle.mjs';
import * as pov from './importers/pov.mjs';
import * as cdi from './importers/cdi.mjs';
import * as fifteen from './importers/fifteen.mjs';
import * as citychrone from './importers/citychrone.mjs';

const IMPORTERS = { '15mincity': fifteen, citychrone, pov, cdi };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const INPUT = path.join(ROOT, 'input_data');

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
    layer: importer.layer,
    dir: importer.dir,
    accepts: importer.accepts,
    slug: (f) => slugify(importer.cityName(f)),
    fingerprint: [module, ...SHARED],
  };
});

// ── args ─────────────────────────────────────────────────────────────
const OPTIONS = new Set(['dry-run', 'force', 'help', 'stats', 'no-stats']);
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
  const usage = text.split('\n').slice(3, 9).map((l) => l.replace(/^\/\/ ?/, ''));
  console.log(usage.join('\n'));
  process.exit(0);
}

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

function run(script, args) {
  const res = spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  return res.status === 0;
}


function sizeOf(file) {
  const stat = fs.statSync(file);
  if (!stat.isDirectory()) return stat.size;
  return fs.readdirSync(file).reduce((sum, name) => sum + sizeOf(path.join(file, name)), 0);
}

// ── scan ─────────────────────────────────────────────────────────────
// What is on record, per city and layer, read from the cities' own records.
const records = new Map(listCities().map((id) => [id, readCityRecord(id)]));

const plan = []; // { platform, key, file, slug, sha, size, reason }
const adopt = []; // the same, for a published layer with no hash on record
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
    const slug = platform.slug(f);
    const record = records.get(slug);
    const prev = record?.sources?.[platform.layer];
    const published = Boolean(record?.platforms?.[platform.layer]);
    seen.add(`${slug}/${platform.layer}`);
    const size = sizeOf(file);
    const sha = sha256(file);
    const item = { platform, key, file, slug, sha, size };

    let reason = null;
    if (opts.has('force')) reason = prev || published ? 'forced' : 'new';
    else if (!published) reason = 'new';
    else if (!prev) adopt.push({ ...item, reason: 'adopted' });
    else if (prev.sha256 !== sha) reason = 'changed';
    else if (prev.importer !== fingerprint) stale.push(key);
    else tracked += 1;

    if (reason) plan.push({ ...item, reason });
  }

  for (const [id, record] of records) {
    const source = record.sources?.[platform.layer];
    if (source && !seen.has(`${id}/${platform.layer}`)) removed.push(source.file);
  }
}

// ── report ───────────────────────────────────────────────────────────
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(
  `update-data: ${selected.map((p) => p.id).join(', ')}: ` +
    `${plan.length} to import, ${tracked} up to date` +
    (adopt.length ? `, ${adopt.length} already published` : '') +
    (stale.length ? `, ${stale.length} from an older importer` : '') +
    (DRY_RUN ? ' (dry run)' : ''),
);
for (const item of plan) {
  console.log(`  ${item.reason.padEnd(8)} ${item.key}  → ${item.slug}  (${mb(item.size)})`);
}
for (const item of adopt) {
  console.log(`  adopted  ${item.key}  → ${item.slug}  already published; hash recorded, not re-imported (--force to)`);
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

// ── record ───────────────────────────────────────────────────────────
function record(items, now) {
  for (const item of items) {
    recordSource(item.slug, item.platform.layer, {
      file: item.key,
      sha256: item.sha,
      size: item.size,
      importer: item.platform.currentFingerprint,
      // An adopted layer was published from this export before hashes were
      // recorded; when it was imported is not known, only when it was adopted.
      ...(item.reason === 'adopted' ? { adoptedAt: now } : { importedAt: now }),
    });
  }
}

if (DRY_RUN) process.exit(0);

// The catalogue is rebuilt even when nothing is imported: it is derived from
// the cities' records, so this is what puts back an index or a coverage file
// that drifted from them (edited by hand, reverted, half-committed).
function reindex() {
  const report = buildIndex();
  const changed = report.files.filter((f) => f?.changed);
  console.log(
    `catalogue: ${report.cities} cities on ${report.platforms.length} platforms, ` +
      (changed.length ? `${changed.length} file(s) rewritten: ${changed.map((f) => f.rel).join(', ')}` : 'unchanged'),
  );
  console.log(`world maps: ${describeHidden(report.hidden)} for thin data`);
  return changed.length;
}

// The statistics of every city whose data changed are out of date, and the
// rebuild has already left them off the Stats page. Offer to recompute them.
async function offerStats() {
  const stale = staleCities(listCities().map(readCityRecord));
  if (!stale.length) return true;
  console.log(
    `\n── statistics\n${stale.length} cit${stale.length === 1 ? 'y has' : 'ies have'} no up-to-date statistics ` +
      `(${stale.map((c) => c.id).join(', ')}) and ${stale.length === 1 ? 'is' : 'are'} not on the Stats page until computed.`,
  );
  let yes;
  if (opts.has('stats')) yes = true;
  else if (opts.has('no-stats')) yes = false;
  else if (process.stdin.isTTY && process.stdout.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question('Compute them now? [Y/n] ')).trim().toLowerCase();
    rl.close();
    yes = answer === '' || answer.startsWith('y') || answer.startsWith('s');
  } else {
    console.log('Not a terminal, so not asking: `npm run stats` computes them, or pass --stats.');
    return true;
  }
  if (!yes) {
    console.log('Left as they are: `npm run stats` computes them whenever you like.');
    return true;
  }
  return run('scripts/build-stats.mjs', []);
}

if (!plan.length) {
  // Adopting changes no published file, so it needs no test:data.
  if (adopt.length) {
    record(adopt, new Date().toISOString());
    console.log(`recorded ${adopt.length} hash(es) for layers already published.`);
  }
  const changed = reindex();
  if (!changed && !adopt.length) console.log('nothing to import.');
  else if (changed) {
    console.log('\n── test:data');
    if (!run('scripts/test-data.mjs', [])) process.exit(1);
  }
  process.exit((await offerStats()) ? 0 : 1);
}

// ── import ───────────────────────────────────────────────────────────
// One importer process per city, so a failure is attributed to the file that
// caused it: the importer carries on past a failed city and reports it only
// through its exit code, which for a batch would not say which one. Each
// writes its city only; the catalogue is rebuilt once, below.
const done = [];
const failed = [];
for (const item of plan) {
  console.log(`\n── ${item.platform.id}: ${item.slug} (${item.reason})`);
  if (run('scripts/import-data.mjs', [item.platform.id, item.file, '--no-index'])) done.push(item);
  else failed.push(item);
}

console.log('\n── catalogue');
reindex();

if (!done.length) {
  console.error(`\nevery import failed (${failed.map((i) => i.key).join(', ')}); no hash recorded.`);
  process.exit(1);
}

// ── validate, then record ────────────────────────────────────────────
console.log('\n── test:data');
if (!run('scripts/test-data.mjs', [])) {
  console.error(
    '\ntest:data failed on the imported data, so no hash was recorded and the next run will offer ' +
      'the same files again.\nInspect with `git status public/data`. If the import is at fault, ' +
      '`git checkout -- public/data` puts back the files it changed; the ones it created show as untracked.',
  );
  process.exit(1);
}

record([...done, ...adopt], new Date().toISOString());
console.log(`\nimported ${done.length} file(s); their hashes are recorded in each city's city.json.`);
const statsOk = await offerStats();
if (failed.length) {
  console.error(`${failed.length} failed and stay pending: ${failed.map((i) => i.key).join(', ')}`);
  process.exit(1);
}
if (!statsOk) process.exit(1);
console.log(
  'next: commit **all** of public/data and statistics/ (`git add -A public/data statistics`: an import rewrites files that were\n' +
    'already there, and committing only the new ones publishes layers against a grid that is not in the\n' +
    'commit), then scripts/deploy.sh.',
);
