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
  summariseMeasure,
  citiesFromPublished,
} from '../src/data/adapters.js';
import { BANDS, CATEGORIES, MODES, measureKey } from '../src/data/fifteen.js';

const DATA = path.join(process.cwd(), 'public', 'data');
const CDI_STOPS = [-0.1, 0.1, 0.3, 1];

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const read = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));
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

        const summary = summariseMeasure(collection, 'a_f', BANDS.f);
        if (summary.median == null) bad.push(`${city.id}: no median for a_f`);
        const shareTotal = summary.shares.reduce((a, b) => a + b, 0);
        if (!near(shareTotal, 100, 0.4)) bad.push(`${city.id}: a_f shares sum to ${shareTotal}`);
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
