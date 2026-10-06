// Validates every published dataset against the adapters that read it.
//
//   npm run test:data
//
// No browser and no build: this loads public/data/ straight from disk and runs
// the real adapter code over all of it, so a malformed or mis-shaped file is
// caught in seconds rather than as a blank panel in the smoke test. The
// browser suites check that the wiring works on one city; this checks that
// every city is actually loadable.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { meshFromAtlas, citiesFromPublished, summariseMeasure } from '../src/data/adapters.js';
import { BANDS, CATEGORIES, MODES, measureKey } from '../src/data/fifteen.js';
import {
  checkGrid,
  citychroneHourFromLayer,
  gridFeatures,
  layerCartogram,
  layerPositions,
  mergeLayer,
} from '../src/data/grid.js';
import { createStaticProvider } from '../src/data/sources.js';
import { clearDatasetCache, loadDataset } from '../src/map/loaders.js';
import { getResolution, cellToLatLng } from 'h3-js';
import { readDataBuffer, readDataJSON, resolveDataFile } from './lib/datafile.mjs';
import { VARIANTS, buildIndex, cataloguePaths, gridId } from './lib/bundle.mjs';
import { atlasMetrics } from '../src/data/home.js';
import { normaliseCatalogue } from '../src/data/catalogue.js';
import en from '../src/i18n/en.js';
import { localeFor } from '../src/i18n/locales.js';

const DATA = path.join(process.cwd(), 'public', 'data');

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// Published files are stored gzipped, so reads go through the shared helper
// rather than fs directly — see scripts/lib/datafile.mjs.
const read = (rel) => readDataJSON(path.join(DATA, rel));
const near = (value, target, tolerance) => Math.abs(value - target) <= tolerance;

/**
 * What is wrong with a travel-time matrix, or null.
 *
 * Read from its two ends, never whole: decoding all 24 of Rome's (130 MB
 * each) took most of this suite's run. The head is the .npy header, inflated
 * just far enough to read its dtype and shape; the tail is gzip's ISIZE, the
 * decoded length mod 2³², which a truncated file does not end with. Sizes are
 * the decoded ones, never the size on disk: a compressed matrix is smaller
 * than n².
 */
function matrixProblem(file, n) {
  const found = resolveDataFile(file);
  if (!found) return 'missing';
  const fd = fs.openSync(found.path, 'r');
  try {
    const { size } = fs.fstatSync(fd);
    const head = Buffer.alloc(Math.min(size, 4096));
    fs.readSync(fd, head, 0, head.length, 0);
    let decoded = size;
    let npy = head;
    if (found.gzipped) {
      if (size < 18) return 'truncated';
      const tail = Buffer.alloc(4);
      fs.readSync(fd, tail, 0, 4, size - 4);
      decoded = tail.readUInt32LE(0);
      npy = zlib.gunzipSync(head, { finishFlush: zlib.constants.Z_SYNC_FLUSH });
    }
    if (npy.toString('latin1', 0, 6) !== '\x93NUMPY') return 'not a .npy file';
    const major = npy[6];
    const start = major >= 2 ? 12 + npy.readUInt32LE(8) : 10 + npy.readUInt16LE(8);
    const header = npy.toString('latin1', major >= 2 ? 12 : 10, start);
    if (!/'descr':\s*'\|u1'/.test(header)) return `dtype is not uint8 (${header.trim()})`;
    const shape = header.match(/'shape':\s*\((\d+),\s*(\d+)\)/);
    if (!shape || Number(shape[1]) !== n || Number(shape[2]) !== n) return `shape is not ${n}×${n} (${header.trim()})`;
    if (decoded !== (start + n * n) % 2 ** 32) return `decodes to ${decoded} bytes, not ${start + n * n}: truncated`;
    return null;
  } finally {
    fs.closeSync(fd);
  }
}
const sum = (values) => values.reduce((a, b) => a + b, 0);

const catalogue = read('index.json');
check('Catalogue parses', !!catalogue.platforms, `version ${catalogue.version}`);
const atlasById = new Map((catalogue.atlas?.cities ?? []).map((c) => [c.id, c]));

// ── Platform lists ───────────────────────────────────────────────────
// What the world maps, search and compare view read: every row points at a
// layer file its city's atlas entry also names, every marker is a city the
// list knows, and every compare row describes the file it sits beside.
for (const [platformId, entry] of Object.entries(catalogue.platforms)) {
  const cities = entry.cities ?? [];
  const bad = [];
  const known = new Set(cities.map((c) => c.id));
  const coverage = entry.coverage ? citiesFromPublished(read(entry.coverage)) : [];
  for (const marker of coverage) if (!known.has(marker.id)) bad.push(`marker ${marker.id} has no row`);

  for (const city of cities) {
    const atlas = atlasById.get(city.id);
    if (!city.layer) bad.push(`${city.id}: row names no layer file`);
    else if (atlas?.layerData?.[platformId] !== city.layer) bad.push(`${city.id}: row and atlas entry name different files`);
    else if (!resolveDataFile(path.join(DATA, city.layer))) bad.push(`${city.id}: ${city.layer} is missing`);
  }

  if (entry.summary) {
    for (const row of read(entry.summary).cities) {
      if (!known.has(row.id)) bad.push(`summary row ${row.id} has no catalogue row`);
    }
  }
  check(
    `${platformId}: ${cities.length} rows, ${coverage.length} markers, all pointing at published layers`,
    bad.length === 0,
    bad.slice(0, 3).join(' | '),
  );
}

// ── Cities ───────────────────────────────────────────────────────────
// Each city through the same code the viewer runs: the grid becomes hexagons,
// every layer is merged in, and the figures the panel quotes are computed.
// A file the viewer could not draw fails here in seconds.
const summaries = {};
for (const [platformId, entry] of Object.entries(catalogue.platforms)) {
  summaries[platformId] = new Map(entry.summary ? read(entry.summary).cities.map((c) => [c.id, c]) : []);
}

let totalCells = 0;
const meshes = new Map(); // city id → the viewer's per-layer figures
for (const city of catalogue.atlas?.cities ?? []) {
  const bad = [];
  try {
    const grid = read(city.grid);
    const n = grid.cells.length;
    if (grid.population.length !== n) bad.push('grid population is not one per cell');
    if (new Set(grid.cells).size !== n) bad.push('duplicate cells in the grid');
    if (grid.cells.some((h3, i) => i && h3 <= grid.cells[i - 1])) bad.push('grid is not sorted');
    if (grid.cells.some((h3) => getResolution(h3) !== city.cell.h3Resolution)) bad.push('a cell off the stated resolution');
    if (grid.id !== gridId(grid.cells)) bad.push(`grid id ${grid.id} is not the hash of its cells`);

    let features = await gridFeatures(grid);
    const covered = new Set();
    const files = {};
    for (const layer of city.layers) {
      const file = read(city.layerData[layer]);
      files[layer] = file;
      // Rows are grid positions: a layer from another import's grid decodes
      // and draws, onto the wrong cells. Rome's 15minCity did, on GitHub.
      if (file.grid !== grid.id) bad.push(`${layer}: written against grid ${file.grid ?? '(none)'}, the city's is ${grid.id}`);
      try {
        checkGrid(grid, file, layer);
      } catch (error) {
        bad.push(error.message);
      }
      const positions = layerPositions(file);
      if (positions.length !== file.cells) bad.push(`${layer}: ${positions.length} rows, header says ${file.cells}`);
      if (positions.some((p, i) => p < 0 || p >= n || (i && p <= positions[i - 1]))) {
        bad.push(`${layer}: rows do not point at grid cells in order`);
      }
      for (const [name, column] of Object.entries(file.fields)) {
        if (column.length !== file.cells) bad.push(`${layer}: field ${name} has ${column.length} values`);
      }
      positions.forEach((p) => covered.add(p));
      features = mergeLayer(features, layer, file);
    }
    // A grid cell no layer covers is a cell nothing draws.
    if (covered.size !== n) bad.push(`${n - covered.size} grid cells belong to no layer`);

    const mesh = meshFromAtlas({ type: 'FeatureCollection', features }, city);
    // Keep the figures, not the mesh: its features are every cell's polygon
    // and every layer's values, and holding them for every city until the
    // end ran the heap out once enough cities were imported at once.
    meshes.set(city.id, { layers: mesh.layers });
    totalCells += n;
    const { layers } = mesh;
    for (const layer of city.layers) {
      if (!(layers[layer]?.cells === files[layer].cells)) {
        bad.push(`${layer}: viewer counts ${layers[layer]?.cells} cells, file has ${files[layer].cells}`);
      }
    }

    if (files.pov) {
      const total = sum(layers.pov.zoneShares);
      if (!near(total, 100, 0.4)) bad.push(`pov zone shares sum to ${total}`);
      const row = summaries.pov.get(city.id);
      if (row && row.zoneShares.join(' ') !== layers.pov.zoneShares.join(' ')) {
        bad.push(`pov shares ${layers.pov.zoneShares} vs compare row ${row.zoneShares}`);
      }
    }
    if (files.cardep) {
      const out = files.cardep.fields.cdi.filter((v) => !(v >= -1 && v <= 1));
      if (out.length) bad.push(`${out.length} cells with CDI outside [−1, +1]`);
      const row = summaries.cardep.get(city.id);
      if (layers.cardep.weightedCdi == null) bad.push('no population-weighted CDI');
      else if (row && !near(layers.cardep.weightedCdi, row.weightedCdi, 0.002)) {
        bad.push(`weighted CDI ${layers.cardep.weightedCdi} vs compare row ${row.weightedCdi}`);
      }
    }
    if (files.fifteen) {
      // Every category × mode must be present, or a selector option would
      // silently colour nothing.
      const collection = {
        type: 'FeatureCollection',
        features: features.filter((f) => Number.isFinite(f.properties.proximity_time_foot)),
      };
      const sample = collection.features[0]?.properties ?? {};
      const missing = [];
      for (const category of CATEGORIES) {
        for (const mode of MODES) {
          if (!Number.isFinite(sample[measureKey(category.key, mode.key)])) missing.push(measureKey(category.key, mode.key));
        }
      }
      if (missing.length) bad.push(`fifteen missing ${missing.join(', ')}`);
      const summary = summariseMeasure(collection, measureKey(CATEGORIES[0].key, MODES[0].key), BANDS[MODES[0].key]);
      if (summary.median == null) bad.push('fifteen has no median');
    }
    if (files.citychrone) {
      const { hours, cells } = city.hourly;
      const file = files.citychrone;
      if (file.hourly.hours !== hours || file.cells !== cells) bad.push('citychrone hours/cells disagree with the catalogue');
      for (let hour = 0; hour < hours; hour++) {
        const summary = citychroneHourFromLayer(file, hour);
        if (!Number.isFinite(summary?.weightedMedianV)) bad.push(`citychrone hour ${hour} has no usable v_score`);
        const problem = matrixProblem(path.join(DATA, city.hourly.times.replace('{hh}', String(hour).padStart(2, '0'))), cells);
        if (problem) bad.push(`times ${hour}: ${problem}`);
      }
    }

    // Each cartogram polygon's mean radius, measured from its cell's H3 centre.
    // There is no check here that a polygon sits on its cell: both kinds are
    // stored relative to the cell's centre, so the file cannot place one
    // anywhere else, and the importers already refuse an export whose
    // polygons are off the grid. Nor is the centre the mean of the vertices:
    // cells crossing an icosahedron edge of H3 carry extra vertices on one
    // side, which pulls that mean up to 28 m off the centre (Xiapu).
    const radii = {};
    for (const layer of city.layers) {
      const cartogram = await layerCartogram(grid, files[layer]);
      radii[layer] = new Map();
      for (const feature of cartogram.features) {
        const ring = feature.geometry.coordinates[0].slice(0, -1);
        const [lat, lon] = cellToLatLng(grid.cells[feature.properties.i]);
        const k = Math.cos((lat * Math.PI) / 180);
        radii[layer].set(
          feature.properties.i,
          sum(ring.map(([x, y]) => Math.hypot((x - lon) * 111320 * k, (y - lat) * 111320))) / ring.length,
        );
      }
    }

    // The derived rule (area ∝ population, full at the median inhabited cell) stands in for
    // a cartogram where a platform publishes none. Where one is published for
    // the same cells, the rule must stay close to it, or two layers of one
    // city would disagree about how big a cell of a given population is.
    // It lands at ~10–14 m on a ~200 m cell.
    for (const derived of city.layers.filter((l) => files[l].cartogram.source === 'derived')) {
      for (const published of city.layers.filter((l) => files[l].cartogram.source === 'published')) {
        let total = 0;
        let count = 0;
        for (const [i, r] of radii[derived]) {
          const theirs = radii[published].get(i);
          if (theirs == null) continue;
          total += Math.abs(r - theirs);
          count++;
        }
        if (count && total / count > 25) {
          bad.push(`${derived} cartogram rule is ${(total / count).toFixed(1)} m from ${published}'s on average`);
        }
      }
    }
  } catch (error) {
    bad.push(error.message);
  }
  check(`${city.id}: grid and ${city.layers.join(', ')} load, merge and reconcile`, bad.length === 0, bad.slice(0, 3).join(' | '));
}
console.log(`      ${totalCells.toLocaleString('en-GB')} grid cells across ${meshes.size} cities`);

// ── The provider ─────────────────────────────────────────────────────
// The catalogue is fetched once and shared by every consumer on the page, and
// two things about that sharing are worth pinning here rather than
// discovering in a browser.
//
// A consumer that goes away must not take the catalogue with it: the fetch is
// deliberately not bound to any one caller's signal, because React remounts
// every effect in development, and binding it meant the first request was
// aborted on every page load. And a failed fetch must not be remembered, or
// one bad moment answers "nothing is published" for the rest of the session.
// Either way the app draws seed cities: a plausible map of the wrong data,
// which no browser check catches because it renders perfectly.
{
  const body = readDataBuffer(path.join(DATA, 'index.json'));
  const requests = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, { signal } = {}) => {
    requests.push(String(url));
    // Slow enough that the caller below aborts while it is still in flight,
    // which is the case that used to poison the memo.
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
    return new Response(body);
  };

  try {
    const provider = createStaticProvider();
    const leaving = new AbortController();
    const first = provider.catalogue({ signal: leaving.signal }).then(
      () => 'resolved',
      (error) => error.name,
    );
    leaving.abort();
    const firstOutcome = await first;
    // The failure this guards against is the *next* caller inheriting the
    // memoised rejection, so catch it rather than letting it end the suite.
    let second = null;
    let inherited = null;
    try {
      second = await provider.catalogue();
    } catch (error) {
      inherited = error.name;
    }
    const platformCount = Object.keys(second?.platforms ?? {}).length;
    check(
      'the catalogue outlives a caller that goes away mid-fetch',
      platformCount > 0,
      inherited
        ? `next caller inherited the first one's ${inherited}`
        : `caller saw ${firstOutcome}, next caller got ${platformCount} platforms in ${requests.length} request(s)`,
    );

    // A failure is not memoised either: the next caller tries again rather
    // than inheriting the empty catalogue forever.
    const failing = createStaticProvider();
    globalThis.fetch = async () => {
      requests.push('failed');
      throw new Error('offline');
    };
    const empty = await failing.catalogue();
    globalThis.fetch = async () => new Response(body);
    const recovered = await failing.catalogue();
    check(
      'a failed catalogue fetch is retried, not remembered',
      Object.keys(empty.platforms ?? {}).length === 0 &&
        Object.keys(recovered.platforms ?? {}).length > 0,
      `${Object.keys(recovered.platforms ?? {}).length} platforms on the retry`,
    );
  } finally {
    globalThis.fetch = realFetch;
  }
}

// Datasets are cached by URL and therefore shared the same way, with one
// extra edge: the cache can hand out an in-flight promise before a rejection
// has cleared the entry, so an aborted fetch was inherited by the very next
// caller. The abort also has to keep its name — wrapped in a DatasetError it
// reads as a broken file, and a caller meaning to ignore its own cancellation
// draws the seed mesh instead.
{
  const body = readDataBuffer(path.join(DATA, catalogue.platforms.pov.coverage));
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, { signal } = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
    return new Response(body);
  };

  try {
    clearDatasetCache();
    const url = '/data/pov/coverage.geojson';
    const leaving = new AbortController();
    const first = loadDataset({ url }, { signal: leaving.signal }).then(
      () => 'resolved',
      (error) => error.name,
    );
    leaving.abort();
    const firstOutcome = await first;

    let second = null;
    let inherited = null;
    try {
      second = await loadDataset({ url });
    } catch (error) {
      inherited = error.name;
    }
    check(
      'a dataset outlives a caller that goes away mid-fetch',
      firstOutcome === 'AbortError' && second?.features?.length > 0,
      inherited
        ? `next caller inherited ${inherited}`
        : `caller saw ${firstOutcome}, next caller got ${second?.features?.length ?? 0} features`,
    );
    clearDatasetCache();
  } finally {
    globalThis.fetch = realFetch;
  }
}

// The site counts cities and cells from the catalogue rather than from
// numbers written in the code, so the catalogue's own counts have to be
// right: every platform row's `cells` is its layer file's, and a variant is
// flagged as one exactly when it is one.
{
  const bad = [];
  for (const [platformId, entry] of Object.entries(catalogue.platforms)) {
    for (const row of entry.cities ?? []) {
      const cells = row.layer ? read(row.layer).cells : null;
      if (row.cells !== cells) bad.push(`${platformId}/${row.id} says ${row.cells} cells, file has ${cells}`);
    }
  }
  for (const city of atlasById.values()) {
    if (Boolean(city.variant) !== VARIANTS.has(city.id)) bad.push(`${city.id}: variant flag is wrong`);
  }
  const metrics = Object.fromEntries(atlasMetrics(normaliseCatalogue(catalogue)).map((m) => [m.key, m.value]));
  check('The catalogue\'s own counts match the files', bad.length === 0, bad.slice(0, 3).join(' | ') || JSON.stringify(metrics));
}

// The catalogue, the coverage files and the compare summaries are derived
// from the cities' records (cities/<id>/city.json) by buildIndex. Rebuilding
// them must change nothing: a difference means one of them was edited, or
// half-committed, without the others — the state in which the world map and
// the catalogue disagree about what is published.
{
  const report = buildIndex({ dryRun: true });
  const drifted = report.files.filter((f) => f?.changed).map((f) => f.rel);
  check(
    'Catalogue, coverage and summaries are exactly what the city records give',
    drifted.length === 0,
    drifted.length ? `would change: ${drifted.join(', ')} — run \`npm run import -- --index\`` : `${report.cities} records`,
  );
}

// Every file the catalogue names is listed with its content hash, and the
// hash is the file's: the site fetches each file as `<path>?v=<hash>`, so a
// stale hash is a stale cache.
{
  const bad = [];
  const paths = cataloguePaths(catalogue);
  for (const rel of paths) {
    const listed = catalogue.files?.[rel];
    const found = resolveDataFile(path.join(DATA, rel));
    if (!listed) bad.push(`${rel} has no hash`);
    else if (!found) bad.push(`${rel} is missing`);
    else {
      const actual = crypto.createHash('sha256').update(fs.readFileSync(found.path)).digest('hex').slice(0, 12);
      if (actual !== listed) bad.push(`${rel} is ${actual}, catalogue says ${listed}`);
    }
  }
  check(`Every published file is listed under its content hash`, bad.length === 0, bad.slice(0, 3).join(' | ') || `${paths.length} files`);
}

// Rome is the city quoted throughout the site; pin its published figures so a
// bad rebuild cannot quietly change what the copy claims.
{
  const rome = meshes.get('rome');
  if (rome) {
    check(
      'Rome P.O.V. matches the figures the site quotes',
      rome.layers.pov.cells === 8089 && rome.layers.pov.zoneShares.join(' ') === '12.9 2.7 1.4 83',
      `${rome.layers.pov.cells} cells · ${rome.layers.pov.zoneShares.join(' / ')}`,
    );
  }
}

// Every dictionary has the shape of the English one: the same keys, the same
// list lengths, and a string wherever English has one. A missing key falls
// back to English without a sound in a built site, and a placeholder lost in
// translation prints the bare "{count}".
{
  const keys = (node, prefix = '') =>
    Object.entries(node).flatMap(([k, v]) => {
      const path = `${prefix}${k}`;
      if (Array.isArray(v)) return [`${path}[${v.length}]`, ...keys(Object.assign({}, v), `${path}.`)];
      if (v && typeof v === 'object') return keys(v, `${path}.`);
      return [`${path}:${typeof v}${typeof v === 'string' ? (v.match(/\{\w+\}/g) ?? []).sort().join('') : ''}`];
    });
  const english = new Set(keys(en));
  // Every dictionary beside en.js, so a new language is checked without
  // being listed here.
  const dir = path.join(process.cwd(), 'src', 'i18n');
  const codes = fs
    .readdirSync(dir)
    .filter((f) => /^[a-z]{2}\.js$/.test(f) && f !== 'en.js')
    .map((f) => f.slice(0, 2));
  for (const code of codes) {
    const dict = (await import(path.join(dir, `${code}.js`))).default;
    const theirs = new Set(keys(dict));
    const missing = [...english].filter((k) => !theirs.has(k));
    const extra = [...theirs].filter((k) => !english.has(k));
    // Dates formatted outside React use locales.js; it must agree with the
    // dictionary, or a page's figures and its dates come out in two locales.
    if (localeFor(code) !== dict.meta.locale) missing.push(`locales.js says ${localeFor(code)}, meta.locale ${dict.meta.locale}`);
    check(
      `${code} dictionary matches the English shape and placeholders`,
      !missing.length && !extra.length,
      [...missing.map((k) => `missing ${k}`), ...extra.map((k) => `extra ${k}`)].slice(0, 4).join(' | '),
    );
  }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll data checks passed');
process.exit(failures ? 1 : 0);
