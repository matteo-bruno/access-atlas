// The Atlas's statistics: every published city, on every measure, as one
// small file the Stats page (`/stats`) reads whole.
//
//   statistics/cities/<city>.json.gz     what was computed for a city, and when,
//                                        with every earlier computation kept
//                                        as its history. Not served.
//   public/data/stats/stats.json.gz      what the site shows: the current
//                                        computation of every city whose data
//                                        has not changed since, gathered by
//                                        buildIndex like the catalogue.
//
// Decisions worth knowing before changing this:
//
//   • **Computed per city, from the published files, and only when they
//     changed.** A city's statistics record the stored hash of its grid and
//     of every layer file they were computed from (`inputs`). `npm run stats`
//     recomputes a city only when one of those hashes, or STATS_VERSION, is
//     no longer what is published; everything else is kept as it is.
//   • **Out-of-date statistics are never published.** `assembleStats` (called
//     by buildIndex at the end of every import) leaves out any city whose
//     inputs no longer match its files, and lists it as `omitted`. So
//     declining to recompute after an import takes that city off the Stats
//     page rather than showing figures for data that is no longer on the
//     site. The computation itself stays in the city's history.
//   • **STATS_VERSION is the method.** Change what a figure means, or add one,
//     and bump it: every city then counts as out of date until recomputed.
//     test:data recomputes every published city and fails if the result
//     differs from the file, which is what catches a change made without the
//     bump.
//   • **Weighted by the layer's own population.** Each platform states a
//     population per cell; a layer's figures are about the residents *it*
//     counts, the same ones its own summary and markers weight by.
//   • **Thresholds are fixed, never fitted.** A share "above 5,000" means the
//     same in every city, which is the point of a share. Each list below is
//     round numbers spanning the published range, with the measurements it
//     was checked against, like the ramps' domains (src/map/ramps.js).
//   • **A country is pooled, never averaged.** Its figure is the one its
//     cities' residents give together: exact for a mean and for a share of
//     residents, which is why only those are pooled. A median, a quantile, a
//     Gini of several cities cannot be had from the cities' own, so a country
//     carries none. Variants (a metro area beside its city) are left out of
//     the pool: their residents are the city's, counted again.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDataBuffer, readDataJSON, resolveDataFile, storedVersion, writeDataFile } from './datafile.mjs';
import { layerPositions } from '../../src/data/grid.js';
import { CATEGORIES as FIFTEEN_CATEGORIES, MODES as FIFTEEN_MODES } from '../../src/data/fifteen.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const DATA = path.join(ROOT, 'public', 'data');
export const HISTORY_DIR = path.join(ROOT, 'statistics', 'cities');
export const STATS_PATH = 'stats/stats.json.gz';

// Bump whenever a figure is added, removed or computed differently.
export const STATS_VERSION = 1;

const UNREACHABLE = 99999;
const HOURS = 24;

// ── what is measured ─────────────────────────────────────────────────
//
// A measure is one value per cell. `direction` says which way is better
// ('up', 'down', or null where neither is), `side` which residents a
// threshold counts: `atLeast` (≥ t), `atMost` (≤ t) or `above` (> t).

// P.O.V. Pooled population-weighted quantiles over the 17 published cities:
// proximity p10 1,685 · p50 5,710 · p90 15,349 (max 30,738);
// opportunity p10 7,507 · p50 20,646 · p90 48,509 (max 74,880).
const POV_PROXIMITY = [1000, 2500, 5000, 10000, 20000];
const POV_OPPORTUNITY = [5000, 10000, 20000, 40000, 60000];
// The four zones again, on one pair of thresholds for every city instead of
// each city's own medians: round numbers next to the pooled weighted medians
// above. On these a zone *does* compare one city with another.
export const COMMON_ZONE_THRESHOLDS = { proximity: 5000, opportunity: 20000 };

// Car Dependency. CDI pooled p10 −0.02 · p50 0.19 · p90 0.41. Opportunities
// reachable by car p10 1,411 · p90 8,761; by public transport p10 857 ·
// p90 6,488.
const CDI = [-0.2, 0, 0.2, 0.4];
const CDI_REACH = [1000, 2500, 5000, 10000];

// 15minCity: minutes, the same for every category and both modes, as the ramp
// is. Milan, Rome and Zurich's education on foot runs p10 5.3 · p90 22.5.
const MINUTES = [5, 10, 15, 20, 30];

// CityChrone at 08:00, pooled: velocity p10 3.39 · p90 6.31; sociality
// p10 106,978 · p90 573,112.
const VELOCITY = [3, 4, 5, 6];
const SOCIALITY = [100000, 250000, 400000, 550000];

const hh = (hour) => String(hour).padStart(2, '0');

function buildMeasures() {
  const list = [
    { id: 'pov.proximity', layer: 'pov', kind: 'score', field: 'proximity', direction: 'up', decimals: 1, side: 'atLeast', thresholds: POV_PROXIMITY },
    { id: 'pov.opportunity', layer: 'pov', kind: 'score', field: 'opportunity', direction: 'up', decimals: 1, side: 'atLeast', thresholds: POV_OPPORTUNITY },
    { id: 'pov.zonesCommon', layer: 'pov', kind: 'zones', direction: null, decimals: 1, comparability: 'cross-city', thresholds: [] },
    { id: 'pov.zonesCity', layer: 'pov', kind: 'zones', direction: null, decimals: 1, comparability: 'within-city', thresholds: [] },
    { id: 'cardep.cdi', layer: 'cardep', kind: 'index', field: 'cdi', direction: 'down', decimals: 3, signed: true, side: 'above', thresholds: CDI },
    { id: 'cardep.car', layer: 'cardep', kind: 'score', field: 'o_score_car', direction: 'up', decimals: 1, side: 'atLeast', thresholds: CDI_REACH },
    { id: 'cardep.pt', layer: 'cardep', kind: 'score', field: 'o_score_pt', direction: 'up', decimals: 1, side: 'atLeast', thresholds: CDI_REACH },
  ];
  for (const category of FIFTEEN_CATEGORIES) {
    for (const mode of FIFTEEN_MODES) {
      list.push({
        id: `fifteen.${category.key}.${mode.key}`,
        layer: 'fifteen',
        kind: 'minutes',
        field: `${category.key}_${mode.key}`,
        direction: 'down',
        decimals: 1,
        side: 'atMost',
        thresholds: MINUTES,
        sentinel: UNREACHABLE,
        facets: { category: category.key, mode: mode.key },
      });
    }
  }
  for (const [score, key, thresholds, decimals] of [
    ['velocity', 'v', VELOCITY, 2],
    ['sociality', 's', SOCIALITY, 0],
  ]) {
    for (const hour of ['day', ...Array.from({ length: HOURS }, (_, h) => h)]) {
      list.push({
        id: `citychrone.${score}.${hour === 'day' ? 'day' : hh(hour)}`,
        layer: 'citychrone',
        kind: 'score',
        hourly: key,
        direction: 'up',
        decimals,
        side: 'atLeast',
        thresholds,
        facets: { score, hour },
      });
    }
  }
  // Within one city, how two layers' measures go together: Spearman's rank
  // correlation over the inhabited cells both cover.
  const LEADS = ['pov.proximity', 'pov.opportunity', 'cardep.cdi', 'fifteen.proximity_time.foot', 'citychrone.velocity.day'];
  for (let a = 0; a < LEADS.length; a++) {
    for (let b = a + 1; b < LEADS.length; b++) {
      if (LEADS[a].split('.')[0] === LEADS[b].split('.')[0]) continue;
      list.push({
        id: `corr.${LEADS[a]}~${LEADS[b]}`,
        layer: 'cross',
        kind: 'correlation',
        pair: [LEADS[a], LEADS[b]],
        direction: null,
        decimals: 2,
        thresholds: [],
      });
    }
  }
  return list.map((m) => ({ comparability: 'cross-city', facets: {}, ...m }));
}

export const MEASURES = buildMeasures();
const MEASURE_BY_ID = new Map(MEASURES.map((m) => [m.id, m]));

// ── small numerics ───────────────────────────────────────────────────

const round = (value, decimals) => {
  if (!Number.isFinite(value)) return null;
  const m = 10 ** decimals;
  return Math.round(value * m) / m;
};
const pct = (part, whole) => (whole > 0 ? round((part / whole) * 100, 1) : null);
const QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9];

/** First value whose cumulative weight reaches q of the total — the rule bundle.mjs's weightedMedian uses. */
function weightedQuantiles(sorted, total, qs) {
  const out = [];
  let acc = 0;
  let at = 0;
  for (const q of qs) {
    const target = q * total;
    while (at < sorted.length && acc + sorted[at][1] < target) {
      acc += sorted[at][1];
      at++;
    }
    out.push(sorted[Math.min(at, sorted.length - 1)][0]);
  }
  return out;
}

/** Population-weighted Gini, from the Lorenz curve. Values must be ≥ 0. */
function gini(sorted, total) {
  const mass = sorted.reduce((s, [v, w]) => s + v * w, 0);
  if (!(mass > 0)) return null;
  let area = 0;
  let cumulative = 0;
  for (const [v, w] of sorted) {
    const next = cumulative + v * w;
    area += (w / total) * ((cumulative + next) / mass);
    cumulative = next;
  }
  return 1 - area;
}

/** Population-weighted Theil T index. Values must be ≥ 0; 0·ln 0 is 0. */
function theil(sorted, total, mean) {
  if (!(mean > 0)) return null;
  let t = 0;
  for (const [v, w] of sorted) {
    if (v > 0) t += w * (v / mean) * Math.log(v / mean);
  }
  return t / total;
}

function passes(side, value, threshold) {
  if (side === 'atMost') return value <= threshold;
  if (side === 'above') return value > threshold;
  return value >= threshold;
}

/**
 * One measure's figures for one city.
 *
 * `values[i]` is row i's value, `weights[i]` its residents. Rows with no
 * residents describe nobody and carry no weight; rows with no value are not
 * counted at all. 15minCity's "not reachable" sentinel stays in the
 * quantiles and shares (it is a time longer than any threshold) but makes a
 * mean, a Gini and a Theil meaningless, so those are null wherever anyone
 * lives in such a cell.
 */
function distribution(values, weights, measure) {
  const pairs = [];
  let cells = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    cells++;
    const w = Math.max(0, Number(weights[i]) || 0);
    if (w > 0) pairs.push([v, w]);
  }
  if (!pairs.length) return null;
  pairs.sort((a, b) => a[0] - b[0]);
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  const sentinel = measure.sentinel;
  const unreachable = sentinel == null ? 0 : pairs.reduce((s, [v, w]) => s + (v >= sentinel ? w : 0), 0);
  const finite = unreachable === 0;
  const mean = finite ? pairs.reduce((s, [v, w]) => s + v * w, 0) / total : null;
  const q = weightedQuantiles(pairs, total, QUANTILES);
  const nonNegative = !measure.signed && pairs[0][0] >= 0;

  const stat = {
    cells,
    population: Math.round(total),
    mean: round(mean, measure.decimals + 1),
    q: q.map((v) => round(v, measure.decimals)),
    gini: finite && nonNegative ? round(gini(pairs, total), 3) : null,
    theil: finite && nonNegative ? round(theil(pairs, total, mean), 3) : null,
    ratio: !measure.signed && q[0] > 0 && !(sentinel != null && q[4] >= sentinel) ? round(q[4] / q[0], 2) : null,
    shares: measure.thresholds.map((t) =>
      pct(
        pairs.reduce((s, [v, w]) => s + (passes(measure.side, v, t) ? w : 0), 0),
        total,
      ),
    ),
  };
  if (sentinel != null) stat.unreachable = pct(unreachable, total);
  return stat;
}

function zoneClass(proximity, opportunity, cut) {
  if (proximity >= cut.proximity && opportunity >= cut.opportunity) return 0;
  if (proximity >= cut.proximity) return 1;
  if (opportunity >= cut.opportunity) return 2;
  return 3;
}

function zoneShares(zones, weights) {
  const byZone = [0, 0, 0, 0];
  let total = 0;
  for (let i = 0; i < zones.length; i++) {
    const w = Math.max(0, Number(weights[i]) || 0);
    if (!(w > 0) || !(zones[i] >= 0 && zones[i] <= 3)) continue;
    byZone[zones[i]] += w;
    total += w;
  }
  if (!total) return null;
  return { cells: zones.length, population: Math.round(total), shares: byZone.map((p) => pct(p, total)) };
}

/** Average ranks, ties sharing the mean of the ranks they span. */
function ranks(values) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(values.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const rank = (i + j) / 2;
    for (let k = i; k <= j; k++) out[order[k][1]] = rank;
    i = j + 1;
  }
  return out;
}

function spearman(xs, ys) {
  if (xs.length < 3) return null;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const n = rx.length;
  const mx = rx.reduce((a, b) => a + b, 0) / n;
  const my = ry.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (rx[i] - mx) * (ry[i] - my);
    sxx += (rx[i] - mx) ** 2;
    syy += (ry[i] - my) ** 2;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}

// ── one city ─────────────────────────────────────────────────────────

const abs = (rel) => path.join(DATA, rel);

/** What a city's statistics are computed from: its grid and layer files, by stored hash. */
export function cityInputs(atlas) {
  const rels = [atlas.grid, ...atlas.layers.map((l) => atlas.layerData[l])].filter(Boolean).sort();
  return Object.fromEntries(rels.map((rel) => [rel, storedVersion(abs(rel))]));
}

/** 15minCity's average over the nine categories, exactly as the viewer takes it (src/data/grid.js). */
function fifteenAverage(file, mode, row) {
  let sum = 0;
  let count = 0;
  for (const category of FIFTEEN_CATEGORIES) {
    if (category.key === 'proximity_time') continue;
    const v = file.fields[`${category.key}_${mode}`]?.[row];
    if (Number.isFinite(v) && v !== UNREACHABLE) {
      sum += v;
      count++;
    }
  }
  if (count) return Math.round((sum / count) * 10) / 10;
  const stored = file.fields[`proximity_time_${mode}`]?.[row];
  return Number.isFinite(stored) ? stored : null;
}

/** A measure's value for every row of its layer file. */
function columnOf(measure, file) {
  if (measure.layer === 'fifteen' && measure.facets.category === 'proximity_time') {
    return Array.from({ length: file.cells }, (_, row) => fifteenAverage(file, measure.facets.mode, row));
  }
  if (measure.hourly) {
    const hours = file.hourly?.[measure.hourly];
    if (!hours) return null;
    if (measure.facets.hour !== 'day') return hours[measure.facets.hour] ?? null;
    // The day: each cell's mean over the hours that have a value.
    return Array.from({ length: file.cells }, (_, row) => {
      let sum = 0;
      let count = 0;
      for (const hour of hours) {
        const v = hour?.[row];
        if (Number.isFinite(v)) {
          sum += v;
          count++;
        }
      }
      return count ? sum / count : null;
    });
  }
  return file.fields[measure.field] ?? null;
}

/**
 * Every figure for one city, from its published files.
 *
 * @param {object} atlas  the city's atlas entry (record.atlas)
 */
export function computeCityStats(atlas) {
  const grid = readDataJSON(abs(atlas.grid));
  const gridTotal = grid.population.reduce((s, p) => s + (Number(p) || 0), 0);
  const files = {};
  for (const layer of atlas.layers) files[layer] = readDataJSON(abs(atlas.layerData[layer]));

  const layers = {};
  const measures = {};
  const byGrid = new Map(); // measure id → Map(grid position → value), for the correlations

  for (const layer of atlas.layers) {
    const file = files[layer];
    const positions = layerPositions(file);
    const weights = file.fields.population;
    let covered = 0;
    let empty = 0;
    for (let row = 0; row < positions.length; row++) {
      covered += Number(grid.population[positions[row]]) || 0;
      if (!(Number(weights[row]) > 0)) empty++;
    }
    layers[layer] = {
      cells: file.cells,
      population: Math.round(weights.reduce((s, p) => s + (Number(p) || 0), 0)),
      // The share of the city's residents (the grid's, every layer together)
      // who live in cells this layer covers: how much of the city it is about.
      coverage: pct(covered, gridTotal),
      // The share of its cells where it counts nobody.
      empty: pct(empty, file.cells),
    };

    for (const measure of MEASURES.filter((m) => m.layer === layer)) {
      if (measure.kind === 'zones') {
        const zones =
          measure.id === 'pov.zonesCity'
            ? file.fields.zone
            : file.fields.proximity.map((p, i) => zoneClass(p, file.fields.opportunity[i], COMMON_ZONE_THRESHOLDS));
        const stat = zoneShares(zones, weights);
        if (stat) measures[measure.id] = stat;
        continue;
      }
      const values = columnOf(measure, file);
      if (!values) continue;
      const stat = distribution(values, weights, measure);
      if (!stat) continue;
      measures[measure.id] = stat;
      const at = new Map();
      for (let row = 0; row < positions.length; row++) {
        const v = values[row];
        if (Number.isFinite(v) && v !== UNREACHABLE) at.set(positions[row], v);
      }
      byGrid.set(measure.id, at);
    }
  }

  for (const measure of MEASURES.filter((m) => m.kind === 'correlation')) {
    const [a, b] = measure.pair.map((id) => byGrid.get(id));
    if (!a || !b) continue;
    const xs = [];
    const ys = [];
    for (const [position, x] of a) {
      if (!(Number(grid.population[position]) > 0) || !b.has(position)) continue;
      xs.push(x);
      ys.push(b.get(position));
    }
    const value = spearman(xs, ys);
    if (value != null) measures[measure.id] = { cells: xs.length, value: round(value, measure.decimals) };
  }

  return {
    method: STATS_VERSION,
    computedAt: new Date().toISOString(),
    inputs: cityInputs(atlas),
    population: Math.round(gridTotal),
    layers,
    measures,
  };
}

// ── the record of a city's computations ──────────────────────────────

const historyPath = (cityId) => path.join(HISTORY_DIR, `${cityId}.json.gz`);

/** A city's computations, or null when none was ever made. A file that cannot be read stops the run. */
export function readCityStats(cityId) {
  const file = historyPath(cityId);
  if (!resolveDataFile(file)) return null;
  try {
    const record = JSON.parse(readDataBuffer(file).toString('utf8'));
    if (record?.format !== 'atlas-city-stats' || record.id !== cityId) throw new Error('not this city\'s statistics');
    return record;
  } catch (error) {
    throw new Error(`${path.relative(ROOT, file)} exists but cannot be read (${error.message}); restore it from git`);
  }
}

/** Replace a city's current computation, keeping the one before it in its history. */
export function writeCityStats(cityId, entry) {
  const previous = readCityStats(cityId);
  const history = [...(previous?.history ?? [])];
  if (previous?.current) history.push(previous.current);
  const record = { format: 'atlas-city-stats', version: 1, id: cityId, current: entry, history };
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
  writeDataFile(historyPath(cityId), JSON.stringify(record));
  return record;
}

const sameInputs = (a, b) => {
  const ka = Object.keys(a ?? {});
  const kb = Object.keys(b ?? {});
  return ka.length === kb.length && ka.every((k) => a[k] != null && a[k] === b[k]);
};

/** Why a computation does not describe what is published, or null when it does. */
export function staleness(entry, atlas) {
  if (!entry) return 'missing';
  if (entry.method !== STATS_VERSION) return 'method';
  if (!sameInputs(entry.inputs, cityInputs(atlas))) return 'data';
  return null;
}

/** Every published city whose statistics are missing or out of date, with the reason. */
export function staleCities(records) {
  return records
    .map((record) => ({ id: record.id, reason: staleness(readCityStats(record.id)?.current, record.atlas) }))
    .filter((c) => c.reason);
}

// ── what the site reads ──────────────────────────────────────────────

/** A measure as the published file describes it: everything but how it is read. */
function describeMeasure(m) {
  const out = {
    id: m.id,
    layer: m.layer,
    kind: m.kind,
    direction: m.direction,
    comparability: m.comparability,
    decimals: m.decimals,
    facets: m.facets,
  };
  if (m.thresholds.length) {
    out.thresholds = m.thresholds;
    out.side = m.side;
  }
  if (m.signed) out.signed = true;
  if (m.sentinel != null) out.sentinel = m.sentinel;
  if (m.pair) out.pair = m.pair;
  if (m.id === 'pov.zonesCommon') out.zoneThresholds = COMMON_ZONE_THRESHOLDS;
  return out;
}

/**
 * The residents of several cities taken together. Exact for what it
 * returns: a mean and a share of residents are what the pooled cells would
 * give, because each city's figure is already a population-weighted one.
 */
function pool(stats) {
  const present = stats.filter((s) => s && s.population > 0);
  if (!present.length) return null;
  const total = present.reduce((s, x) => s + x.population, 0);
  const weighted = (get) => {
    let sum = 0;
    for (const s of present) {
      const v = get(s);
      if (v == null) return null;
      sum += v * s.population;
    }
    return sum / total;
  };
  const out = { cities: present.length, population: total };
  const first = present[0];
  if ('mean' in first) out.mean = weighted((s) => s.mean);
  if (first.shares) out.shares = first.shares.map((_, i) => round(weighted((s) => s.shares[i]), 1));
  if ('unreachable' in first) out.unreachable = round(weighted((s) => s.unreachable), 1);
  if (out.mean != null) out.mean = round(out.mean, 3);
  return out;
}

/**
 * The published statistics, from every city's current computation. Cities
 * whose computation no longer matches their files are listed in `omitted`
 * and nothing else. Null when no city has statistics to publish.
 *
 * @param {object[]} records  every city's record (cities/<city>/city.json)
 */
export function assembleStats(records) {
  const cities = [];
  const omitted = [];
  for (const record of records) {
    const entry = readCityStats(record.id)?.current;
    const reason = staleness(entry, record.atlas);
    if (reason) {
      omitted.push({ id: record.id, reason });
      continue;
    }
    cities.push({ record, entry });
  }
  if (!cities.length) return null;

  const measures = MEASURES.filter((m) => cities.some((c) => c.entry.measures[m.id]));
  const values = Object.fromEntries(measures.map((m) => [m.id, cities.map((c) => c.entry.measures[m.id] ?? null)]));

  const countries = new Map();
  for (const { record } of cities) {
    const meta = record.meta ?? {};
    if (!meta.country || record.atlas.variant) continue;
    if (!countries.has(meta.country)) {
      countries.set(meta.country, { iso: meta.country, name: meta.region ?? meta.country, nameIt: meta.regionIt ?? meta.region ?? meta.country, cities: [] });
    }
    countries.get(meta.country).cities.push(record.id);
  }
  const countryList = [...countries.values()].sort((a, b) => a.iso.localeCompare(b.iso));
  for (const country of countryList) {
    const members = new Set(country.cities);
    country.values = {};
    for (const m of measures) {
      // Medians, quantiles, inequality and correlations do not pool.
      if (m.kind === 'correlation') continue;
      const pooled = pool(cities.map((c, i) => (members.has(c.record.id) ? values[m.id][i] : null)));
      if (pooled) country.values[m.id] = pooled;
    }
  }

  const published = {
    format: 'atlas-stats',
    version: STATS_VERSION,
    measures: measures.map(describeMeasure),
    quantiles: QUANTILES,
    cities: cities.map(({ record, entry }) => ({
      id: record.id,
      name: record.meta?.name ?? record.id,
      nameIt: record.meta?.nameIt ?? record.meta?.name ?? record.id,
      country: record.meta?.country ?? null,
      region: record.meta?.region ?? null,
      regionIt: record.meta?.regionIt ?? null,
      ...(record.atlas.variant ? { variant: true } : {}),
      center: record.atlas.center,
      population: entry.population,
      layers: entry.layers,
      computedAt: entry.computedAt,
    })),
    values,
    countries: countryList,
    omitted,
  };
  return { text: JSON.stringify(published), cities: cities.length, omitted };
}

export const measureById = (id) => MEASURE_BY_ID.get(id) ?? null;
