#!/usr/bin/env node
// Compute the statistics the Stats page shows, for every city whose data
// changed since they were last computed, and nothing else.
//
//   npm run stats                       cities that are new or out of date
//   npm run stats -- --status           list them, compute nothing
//   npm run stats -- --city rome,milan  only these (when out of date)
//   npm run stats -- --force            recompute every city
//
// What is computed, and why it is computed this way, is at the top of
// scripts/lib/stats.mjs. In short: a city's figures record the stored hash of
// every file they came from; a city is recomputed only when one of those
// hashes, or STATS_VERSION, changed; the computation it replaces goes into
// the city's history (statistics/cities/<city>.json.gz), which is kept and
// never served. The published file is then rebuilt by buildIndex, with the
// catalogue, from every city that is up to date. It does not run test:data:
// update:data has just run it on the data these figures come from, and
// test:data recomputes every city's statistics itself the next time it runs.
//
// It says how many cities the Stats page hides by default for data too thin
// to compare (scripts/lib/quality.mjs).
//
// `npm run update:data` offers to run this whenever it changed a city.

import { buildIndex, listCities, readCityRecord } from './lib/bundle.mjs';
import { STATS_VERSION, computeCityStats, readCityStats, staleness, writeCityStats } from './lib/stats.mjs';
import { describeHidden } from './lib/quality.mjs';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};

const only = arg('city') ? new Set(arg('city').split(',').map((s) => s.trim()).filter(Boolean)) : null;
const records = listCities()
  .map(readCityRecord)
  .filter((r) => !only || only.has(r.id));
if (only) {
  const unknown = [...only].filter((id) => !records.some((r) => r.id === id));
  if (unknown.length) {
    console.error(`not published: ${unknown.join(', ')}`);
    process.exit(1);
  }
}

const REASONS = {
  missing: 'never computed',
  data: 'its data changed',
  method: `computed by an earlier method (now v${STATS_VERSION})`,
  forced: 'forced',
};

const plan = [];
let current = 0;
for (const record of records) {
  const reason = flag('force') ? 'forced' : staleness(readCityStats(record.id)?.current, record.atlas);
  if (reason) plan.push({ record, reason });
  else current++;
}

console.log(`stats: ${plan.length} to compute, ${current} up to date${flag('status') ? ' (status only)' : ''}`);
for (const { record, reason } of plan) console.log(`  ${record.id.padEnd(16)} ${REASONS[reason]}`);
if (flag('status')) process.exit(0);

for (const { record } of plan) {
  const started = Date.now();
  const entry = computeCityStats(record.atlas);
  writeCityStats(record.id, entry);
  console.log(
    `  ✓ ${record.id}: ${Object.keys(entry.measures).length} measures over ${record.atlas.layers.join(', ')} · ` +
      `${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
}

const report = buildIndex();
const changed = report.files.filter((f) => f?.changed);
console.log(
  `\nstatistics: ${report.stats.cities} cities, ${describeHidden(report.stats.hidden)} by default` +
    (report.stats.omitted.length ? `, ${report.stats.omitted.length} left out (${report.stats.omitted.map((o) => o.id).join(', ')})` : '') +
    (changed.length ? ` · rewritten: ${changed.map((f) => f.rel).join(', ')}` : ' · unchanged'),
);
