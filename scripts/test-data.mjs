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
import {
  meshFromPublished,
  meshFromPublishedCdi,
  meshFromPublishedFifteen,
  meshFromAtlas,
  citychroneHour,
  summariseMeasure,
  citiesFromPublished,
} from '../src/data/adapters.js';
import { BANDS, CATEGORIES, MODES, measureKey } from '../src/data/fifteen.js';
import { readDataJSON } from './lib/datafile.mjs';

const DATA = path.join(process.cwd(), 'public', 'data');
const CDI_STOPS = [-0.1, 0.1, 0.3, 1];

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// Published files may be stored gzipped (15minCity is), so reads go through
// the shared helper rather than fs directly — see scripts/lib/datafile.mjs.
const read = (rel) => readDataJSON(path.join(DATA, rel));
const near = (value, target, tolerance) => Math.abs(value - target) <= tolerance;

const catalogue = read('index.json');
check('Catalogue parses', !!catalogue.platforms, `version ${catalogue.version}`);

for (const [platformId, entry] of Object.entries(catalogue.platforms)) {
  const cities = entry.cities ?? [];
  if (!cities.length) {
    check(`${platformId}: no data published`, entry.coverage == null, 'coverage should be null too');
    continue;
  }

  // Coverage file exists, parses, and lists only cities the catalogue knows.
  let coverageIds = [];
  if (entry.coverage) {
    const coverage = read(entry.coverage);
    coverageIds = citiesFromPublished(coverage).map((c) => c.id);
    const known = new Set(cities.map((c) => c.id));
    check(
      `${platformId}: coverage parses and matches the catalogue`,
      coverageIds.length > 0 && coverageIds.every((id) => known.has(id)),
      `${coverageIds.length} markers`,
    );
  }

  let cells = 0;
  let bad = [];

  for (const city of cities) {
    // CityChrone publishes hourly file pairs rather than one dataset: run the
    // real adapter over every hour's hexcover and check each hour's travel
    // -time matrix is on disk and big enough for its cells² bytes.
    if (city.hourly) {
      try {
        const { hours, hexcover, times, cells: n } = city.hourly;
        for (let hour = 0; hour < hours; hour++) {
          const hh = String(hour).padStart(2, '0');
          const summary = citychroneHour(read(hexcover.replace('{hh}', hh)));
          if (summary.cells !== n) {
            bad.push(`${city.id}: hour ${hh} has ${summary.cells} cells, catalogue says ${n}`);
          }
          if (!Number.isFinite(summary.weightedMedianV)) {
            bad.push(`${city.id}: hour ${hh} has no usable v_score`);
          }
          const stat = fs.statSync(path.join(DATA, times.replace('{hh}', hh)));
          if (stat.size < n * n) bad.push(`${city.id}: times ${hh} too small for ${n}×${n}`);
        }
        cells += n;
      } catch (error) {
        bad.push(`${city.id}: ${error.message}`);
      }
      continue;
    }

    let collection;
    try {
      collection = read(city.dataset);
    } catch (error) {
      bad.push(`${city.id}: ${error.message}`);
      continue;
    }

    try {
      if (platformId === 'pov') {
        const mesh = meshFromPublished(collection, city);
        const total = mesh.stats.zoneShares.reduce((a, b) => a + b, 0);
        if (!near(total, 100, 0.4)) bad.push(`${city.id}: zone shares sum to ${total}`);
        if (mesh.stats.cellCount !== collection.features.length) {
          bad.push(`${city.id}: cell count mismatch`);
        }
        if (!mesh.scatter.length) bad.push(`${city.id}: empty scatter`);
        if (!mesh.thresholds) bad.push(`${city.id}: no thresholds`);
      } else if (platformId === 'cardep') {
        const mesh = meshFromPublishedCdi(collection, city, CDI_STOPS);
        const total = mesh.stats.zoneShares.reduce((a, b) => a + b, 0);
        if (!near(total, 100, 0.4)) bad.push(`${city.id}: bands sum to ${total}`);
        // The index is bounded by its own definition; anything outside means
        // the file is not what it claims to be.
        const out = collection.features.filter(
          (f) => !(f.properties.cdi >= -1 && f.properties.cdi <= 1),
        );
        if (out.length) bad.push(`${city.id}: ${out.length} cells with CDI outside [−1, +1]`);
        if (mesh.stats.weightedCdi == null) bad.push(`${city.id}: no population-weighted index`);
      } else if (platformId === 'fifteen') {
        const mesh = meshFromPublishedFifteen(collection, city);
        if (mesh.stats.cellCount !== collection.features.length) {
          bad.push(`${city.id}: cell count mismatch`);
        }
        // Every category × mode must be present, or a selector option would
        // silently colour nothing.
        const sample = collection.features[0].properties;
        const missing = [];
        for (const category of CATEGORIES) {
          for (const mode of MODES) {
            const key = measureKey(category.key, mode.key);
            if (!Number.isFinite(sample[key])) missing.push(key);
          }
        }
        if (missing.length) bad.push(`${city.id}: missing measures ${missing.join(', ')}`);

        const averageKey = measureKey(CATEGORIES[0].key, MODES[0].key);
        const summary = summariseMeasure(collection, averageKey, BANDS[MODES[0].key]);
        if (summary.median == null) bad.push(`${city.id}: no median for ${averageKey}`);
        const shareTotal = summary.shares.reduce((a, b) => a + b, 0);
        if (!near(shareTotal, 100, 0.4)) bad.push(`${city.id}: ${averageKey} shares sum to ${shareTotal}`);
      }
      cells += collection.features.length;
    } catch (error) {
      bad.push(`${city.id}: ${error.message}`);
    }
  }

  check(
    `${platformId}: all ${cities.length} datasets load and adapt`,
    bad.length === 0,
    bad.slice(0, 3).join(' | ') || `${cells.toLocaleString('en-GB')} cells`,
  );
}

// ── Alternative geometry ─────────────────────────────────────────────
// A city can publish its cells twice: the values sit on one geometry and a
// companion file carries the other, joined by the index it states. Nothing
// downstream can tell that the geometries have drifted apart — a cartogram
// cell and its hexagon share a centroid, so a mismatch would draw a plausible
// map of the wrong cells. Check the join here instead: same count, same
// index per row, and each companion polygon centred on the cell it replaces.
const centre = (geometry) => {
  let ring = geometry.coordinates[0];
  let end = ring.length;
  while (end > 1 && ring[end - 1][0] === ring[0][0] && ring[end - 1][1] === ring[0][1]) end--;
  ring = ring.slice(0, end);
  let x = 0;
  let y = 0;
  for (const [px, py] of ring) {
    x += px;
    y += py;
  }
  return [x / ring.length, y / ring.length];
};
const metresApart = (a, b) => {
  const dLon = (a[0] - b[0]) * 111320 * Math.cos((a[1] * Math.PI) / 180);
  const dLat = (a[1] - b[1]) * 111320;
  return Math.hypot(dLon, dLat);
};

// Every companion the catalogue declares, as [label, values, companion].
const companions = [];
for (const [platformId, entry] of Object.entries(catalogue.platforms)) {
  for (const city of entry.cities ?? []) {
    if (city.geoDataset) {
      companions.push([`${platformId}/${city.id} geographic`, city.dataset, city.geoDataset]);
    }
  }
}
for (const city of catalogue.atlas?.cities ?? []) {
  for (const [platformId, file] of Object.entries(city.cartograms ?? {})) {
    companions.push([`atlas/${city.id} ${platformId} cartogram`, city.dataset, file]);
  }
}

{
  const bad = [];
  for (const [label, valuesPath, companionPath] of companions) {
    const values = read(valuesPath).features;
    const companion = read(companionPath).features;
    // A cartogram companion covers only the cells its platform measures; a
    // geographic one covers every cell. Either way each row must name its
    // index, and that index must exist.
    if (companion.length > values.length) {
      bad.push(`${label}: ${companion.length} companion cells vs ${values.length} values`);
      continue;
    }
    let worst = 0;
    for (const feature of companion) {
      const i = feature.properties?.i;
      if (!Number.isInteger(i) || i < 0 || i >= values.length) {
        bad.push(`${label}: companion row points at index ${i}`);
        break;
      }
      worst = Math.max(worst, metresApart(centre(feature.geometry), centre(values[i].geometry)));
    }
    // Both geometries describe the same cell, so they share a centre. The
    // cartogram scales each cell about its own centroid, which is what makes
    // this comparison meaningful rather than approximate.
    if (worst > 10) bad.push(`${label}: geometries up to ${worst.toFixed(1)} m apart`);
  }
  check(
    'alternative geometries join to the cells they replace',
    bad.length === 0,
    bad.length ? bad.slice(0, 3).join(' | ') : `${companions.length} companion files`,
  );
}

// The atlas (combined viewer) union meshes: every cell must reconcile with
// the per-platform files it was built from — same counts, same shares — so a
// stale union cannot quietly disagree with the platform pages.
for (const city of catalogue.atlas?.cities ?? []) {
  const bad = [];
  try {
    const mesh = meshFromAtlas(read(city.dataset), city);
    const { layers } = mesh;

    const povCity = catalogue.platforms.pov?.cities.find((c) => c.id === city.id);
    if (povCity) {
      const pov = meshFromPublished(read(povCity.dataset), povCity);
      if (layers.pov.cells !== pov.stats.cellCount) {
        bad.push(`pov covers ${layers.pov.cells} union cells vs ${pov.stats.cellCount} published`);
      }
      if (layers.pov.zoneShares.join(' ') !== pov.stats.zoneShares.join(' ')) {
        bad.push(`pov zone shares diverge: ${layers.pov.zoneShares} vs ${pov.stats.zoneShares}`);
      }
    }

    const cdiCity = catalogue.platforms.cardep?.cities.find((c) => c.id === city.id);
    if (cdiCity) {
      const cdi = meshFromPublishedCdi(read(cdiCity.dataset), cdiCity, CDI_STOPS);
      if (layers.cardep.cells !== cdi.stats.cellCount) {
        bad.push(`cardep covers ${layers.cardep.cells} union cells vs ${cdi.stats.cellCount} published`);
      }
      if (layers.cardep.weightedCdi !== cdi.stats.weightedCdi) {
        bad.push(`weighted CDI diverges: ${layers.cardep.weightedCdi} vs ${cdi.stats.weightedCdi}`);
      }
    }

    const fifteenCity = catalogue.platforms.fifteen?.cities.find((c) => c.id === city.id);
    if (fifteenCity) {
      const fifteen = read(fifteenCity.dataset);
      if (layers.fifteen.cells !== fifteen.features.length) {
        bad.push(`fifteen covers ${layers.fifteen.cells} union cells vs ${fifteen.features.length} published`);
      }
    }

    const ccCity = catalogue.platforms.citychrone?.cities.find((c) => c.id === city.id);
    if (ccCity?.hourly && layers.citychrone.cells !== ccCity.hourly.cells) {
      bad.push(`citychrone covers ${layers.citychrone.cells} union cells vs ${ccCity.hourly.cells} hourly`);
    }

    // Every declared layer must actually have cells, and vice versa.
    for (const layer of city.layers ?? []) {
      if (!(layers[layer]?.cells > 0)) bad.push(`declared layer ${layer} has no cells`);
    }

    const h3Set = new Set(read(city.dataset).features.map((f) => f.properties.h3));
    if (h3Set.size !== mesh.stats.cellCount) bad.push('duplicate h3 indices in the union mesh');
  } catch (error) {
    bad.push(error.message);
  }
  check(
    `atlas: ${city.id} union mesh reconciles with the platform files`,
    bad.length === 0,
    bad.slice(0, 3).join(' | '),
  );
}

// Rome is the city quoted throughout the site; pin its published figures so a
// bad rebuild cannot quietly change what the copy claims.
{
  const rome = catalogue.platforms.pov?.cities.find((c) => c.id === 'rome');
  if (rome) {
    const mesh = meshFromPublished(read(rome.dataset), rome);
    check(
      'Rome P.O.V. matches the figures the site quotes',
      mesh.stats.cellCount === 8089 &&
        mesh.stats.zoneShares.join(' ') === '12.9 2.7 1.4 83',
      `${mesh.stats.cellCount} cells · ${mesh.stats.zoneShares.join(' / ')}`,
    );
  }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll data checks passed');
process.exit(failures ? 1 : 0);
