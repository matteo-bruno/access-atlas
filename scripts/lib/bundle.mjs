// The published form of a city: one shared grid, one file per layer.
//
//   public/data/cities/<city>/grid.json.gz          the H3 cells, once
//   public/data/cities/<city>/<layer>.json.gz       one layer's values
//   public/data/cities/<city>/citychrone/timesHH.npy.gz
//
// Every platform publishes on the same standard H3 grid (checked cell by cell
// on import), so a cell's polygon is not data: it follows from its index. The
// grid file therefore holds only the indices and a population per cell, and
// the browser draws the hexagons itself. Each layer file holds that layer's
// values as columns, keyed to grid positions, and is fetched only when the
// layer is opened. Nothing is stored twice.
//
// A layer file:
//
//   { "format": "atlas-layer", "version": 1, "layer": "pov", "cells": 733,
//     "idx": [...], "order": "grid",           grid position of each row, delta-encoded
//     "fields": { "population": [...], "zone": [...], ... },
//     "meta": { ... },                          per-layer facts (thresholds)
//     "cartogram": { "source": "published", "unit": 1e-5, "rings": [...] }
//              or { "source": "derived", "reference": 412 },
//     "hourly": { "hours": 24, "v": [[...], ...], "s": [[...], ...] } }
//
// Rows follow the grid (`order: "grid"`) and `idx` is delta-encoded — each
// entry is the step from the previous position — which is what lets it
// compress to almost nothing. CityChrone's travel-time matrices are stored in
// the same row order, so a layer row number indexes both.
//
// Cartograms: P.O.V. and Car Dependency publish their own, and those are not
// scaled hexagons (up to ~10 m off one on small cells), so they are kept, as
// integer vertex offsets from the cell's H3 centre in units of 1e-5° — the
// precision they were already published at. The other two publish none; the
// Atlas derives one by a stated rule (area ∝ population, full hexagon at the
// grid's median population over the layer's cells), which needs nothing
// stored but that median.
//
// A city is always rebuilt whole from what is on disk plus the layer being
// imported, and written deterministically, so importing one layer rewrites
// another layer's file only when the grid itself changed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cellToBoundary, cellToLatLng, getResolution, latLngToCell } from 'h3-js';
import { readDataBuffer, readDataJSON, resolveDataFile, writeDataFile } from './datafile.mjs';
import { countryAt } from './country.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..');
export const DATA = path.join(ROOT, 'public', 'data');

export const RESOLUTION = 9;
// A centroid this close to an H3 cell centre *is* that cell; further means the
// export is not on the grid and must not be forced onto it.
export const GRID_TOLERANCE_M = 10;

// Platform order, as the site numbers them.
export const LAYER_ORDER = ['fifteen', 'citychrone', 'cardep', 'pov'];

// Where a cell's context population comes from when several layers state
// one. P.O.V. and Car Dependency share one population model (identical cell by
// cell), 15minCity and CityChrone each use another; the first listed wins, as
// the union mesh always did.
const POPULATION_PRECEDENCE = ['cardep', 'pov', 'fifteen', 'citychrone'];

export const FIFTEEN_CATEGORIES = [
  'healthcare',
  'transport',
  'culture',
  'services',
  'restaurant',
  'physical',
  'education',
  'supplies',
  'outdoor',
];
export const FIFTEEN_MODES = ['foot', 'bicycle'];
// 15minCity's "not reachable" sentinel, kept so the ramp's tail paints it.
export const UNREACHABLE = 99999;

// Variants sit on top of their base city: published, with a city view, but no
// marker of their own on the world map.
export const VARIANTS = new Set(['paris-fua', 'munich-fua', 'rome-metro-d']);

// Decimals kept per field. Everything is published at the precision the
// platforms' own viewers show, never coarser.
export const LAYERS = {
  pov: {
    fields: { population: 0, zone: 0, proximity: 1, opportunity: 1 },
    cartogram: 'published',
  },
  cardep: {
    fields: { population: 0, cdi: 3, o_score_pt: 1, o_score_car: 1 },
    cartogram: 'published',
  },
  fifteen: {
    fields: {
      population: 0,
      ...Object.fromEntries(
        FIFTEEN_CATEGORIES.flatMap((c) => FIFTEEN_MODES.map((m) => [`${c}_${m}`, 1])),
      ),
    },
    // Only written when some cell has no category to average (see fifteen.mjs).
    optional: Object.fromEntries(FIFTEEN_MODES.map((m) => [`proximity_time_${m}`, 1])),
    cartogram: 'derived',
  },
  citychrone: {
    fields: { population: 0 },
    hourly: { v: 2, s: 0 },
    cartogram: 'derived',
  },
};

// ── small helpers ────────────────────────────────────────────────────
export const round = (value, decimals) => {
  if (!Number.isFinite(value)) return null;
  const m = 10 ** decimals;
  return Math.round(value * m) / m;
};
export const r1 = (v) => round(v, 1);
export const r3 = (v) => round(v, 3);
export const r5 = (v) => round(v, 5);

export function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted.length ? sorted[sorted.length >> 1] : null;
}

export function weightedMedian(values, weights) {
  const pairs = values
    .map((v, i) => [v, Math.max(0, Number(weights[i]) || 0)])
    .filter(([v]) => Number.isFinite(v))
    .sort((a, b) => a[0] - b[0]);
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  if (!pairs.length) return null;
  if (!total) return pairs[pairs.length >> 1][0];
  let acc = 0;
  for (const [v, w] of pairs) {
    acc += w;
    if (acc >= total / 2) return v;
  }
  return pairs[pairs.length - 1][0];
}

const metresBetween = ([lon1, lat1], [lon2, lat2]) =>
  Math.hypot((lon2 - lon1) * 111320 * Math.cos((lat1 * Math.PI) / 180), (lat2 - lat1) * 111320);

/** Drop the closing vertex, however many times it was written. */
export function openRing(ring) {
  let end = ring.length;
  while (end > 1 && ring[end - 1][0] === ring[0][0] && ring[end - 1][1] === ring[0][1]) end--;
  return ring.slice(0, end);
}

/** Mean of a polygon's vertices, as [lon, lat]. */
export function ringCentroid(ring) {
  const open = openRing(ring);
  let x = 0;
  let y = 0;
  for (const [px, py] of open) {
    x += px;
    y += py;
  }
  return [x / open.length, y / open.length];
}

/** The H3 cell centre, as [lon, lat]. */
export function cellCentre(h3) {
  const [lat, lon] = cellToLatLng(h3);
  return [lon, lat];
}

/**
 * The grid cell a point names, refusing one that is not on the grid.
 *
 * @param {[number, number]} lonLat
 */
export function cellAt([lon, lat], label) {
  const cell = latLngToCell(lat, lon, RESOLUTION);
  const off = metresBetween([lon, lat], cellCentre(cell));
  if (off > GRID_TOLERANCE_M) {
    throw new Error(
      `${label}: a cell centre is ${off.toFixed(1)} m from the nearest H3 r${RESOLUTION} cell centre, ` +
        'so this export is not on the standard grid',
    );
  }
  return cell;
}

/**
 * Worst distance from a polygon's vertices to its H3 cell's own boundary.
 *
 * Centroid proximity alone cannot prove the grid: an H3 cell's centre is also
 * its central child's, so an r10 mesh matches r9 centres too. The boundary
 * cannot be fooled that way.
 */
export function boundaryMismatchM(h3, ring) {
  let worst = 0;
  const open = openRing(ring);
  for (const [lat, lon] of cellToBoundary(h3)) {
    let nearest = Infinity;
    for (const vertex of open) nearest = Math.min(nearest, metresBetween([lon, lat], vertex));
    worst = Math.max(worst, nearest);
  }
  return worst;
}

/** A cartogram polygon as integer offsets from its cell's centre (1e-5°). */
export function ringOffsets(h3, ring) {
  const [cx, cy] = cellCentre(h3);
  const out = [];
  let last = null;
  for (const [x, y] of openRing(ring)) {
    const dx = Math.round((x - cx) * 1e5);
    const dy = Math.round((y - cy) * 1e5);
    // Tiny cells collapse to repeated vertices at this precision; one copy of
    // each is the same polygon.
    if (last && last[0] === dx && last[1] === dy) continue;
    out.push(dx, dy);
    last = [dx, dy];
  }
  if (out.length > 2 && out[0] === out[out.length - 2] && out[1] === out[out.length - 1]) {
    out.length -= 2;
  }
  return out;
}

// ── paths ────────────────────────────────────────────────────────────
export const cityDir = (cityId) => `cities/${cityId}`;
export const gridPath = (cityId) => `${cityDir(cityId)}/grid.json.gz`;
export const layerPath = (cityId, layer) => `${cityDir(cityId)}/${layer}.json.gz`;
export const timesTemplate = (cityId) => `${cityDir(cityId)}/citychrone/times{hh}.npy.gz`;
export const hourPath = (template, hour) => template.replace('{hh}', String(hour).padStart(2, '0'));

const abs = (rel) => path.join(DATA, rel);

// ── reading a city back ──────────────────────────────────────────────

/**
 * Every layer published for a city, decoded to H3-keyed records.
 *
 * An absent city is an empty map. A file that is there and cannot be read
 * stops the run: rebuilding a city from what could be read would publish it
 * without the layers that could not, which is a deletion nobody asked for.
 */
export function readCity(cityId) {
  const layers = new Map();
  const gridFile = resolveDataFile(abs(gridPath(cityId)));
  if (!gridFile) return layers;

  let grid;
  try {
    grid = readDataJSON(abs(gridPath(cityId)));
  } catch (error) {
    throw new Error(`${gridPath(cityId)} exists but cannot be read (${error.message}); restore it from git`);
  }
  for (const layer of LAYER_ORDER) {
    const rel = layerPath(cityId, layer);
    if (!resolveDataFile(abs(rel))) continue;
    let file;
    try {
      file = readDataJSON(abs(rel));
    } catch (error) {
      throw new Error(`${rel} exists but cannot be read (${error.message}); restore it from git`);
    }
    layers.set(layer, decodeLayer(file, grid.cells, rel));
  }
  return layers;
}

function decodeIdx(file) {
  if (file.order !== 'grid') return file.idx;
  const out = new Array(file.idx.length);
  let at = 0;
  for (let i = 0; i < file.idx.length; i++) {
    at += file.idx[i];
    out[i] = at;
  }
  return out;
}

function decodeLayer(file, gridCells, label) {
  const idx = decodeIdx(file);
  const cells = idx.map((i) => {
    const h3 = gridCells[i];
    if (!h3) throw new Error(`${label}: row points at grid position ${i}, which does not exist`);
    return h3;
  });
  const record = {
    layer: file.layer,
    cells,
    fields: file.fields,
    meta: file.meta ?? {},
    cartogram:
      file.cartogram?.source === 'published'
        ? { source: 'published', offsets: file.cartogram.rings }
        : { source: 'derived' },
  };
  if (file.hourly) record.hourly = file.hourly;
  return record;
}

// ── writing a city ───────────────────────────────────────────────────

function encodeColumn(values, decimals) {
  return values.map((v) => round(Number(v), decimals));
}

/** Median population of a layer's populated cells: the derived cartogram's reference. */
function cartogramReference(populations) {
  const sorted = populations.map((p) => Math.max(Number(p) || 0, 0)).sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
}

function encodeLayer(record, position, gridPopulation) {
  const spec = LAYERS[record.layer];
  // Rows follow the grid, which is sorted by H3 index. That order is a
  // property of the cells alone, so a layer's rows never move when another
  // layer adds cells to the grid, and it puts neighbours next to each other,
  // which is what the travel-time matrices compress on.
  const order = record.cells.map((_, i) => i);
  order.sort((a, b) => position.get(record.cells[a]) - position.get(record.cells[b]));

  const idx = order.map((i) => position.get(record.cells[i]));
  const out = {
    format: 'atlas-layer',
    version: 1,
    layer: record.layer,
    cells: idx.length,
    order: 'grid',
    idx: idx.map((v, i) => (i ? v - idx[i - 1] : v)),
    fields: {},
  };

  for (const [name, decimals] of Object.entries({ ...spec.fields, ...(spec.optional ?? {}) })) {
    const column = record.fields[name];
    if (!column) {
      if (spec.fields[name] != null) throw new Error(`${record.layer}: missing field ${name}`);
      continue;
    }
    out.fields[name] = encodeColumn(order.map((i) => column[i]), decimals);
  }
  if (record.meta && Object.keys(record.meta).length) out.meta = record.meta;

  if (spec.hourly) {
    const { hours } = record.hourly;
    out.hourly = { hours };
    for (const [name, decimals] of Object.entries(spec.hourly)) {
      out.hourly[name] = record.hourly[name].map((row) => encodeColumn(order.map((i) => row[i]), decimals));
    }
  }

  out.cartogram =
    spec.cartogram === 'published'
      ? { source: 'published', unit: 1e-5, rings: order.map((i) => record.cartogram.offsets[i]) }
      : // The rule reads the grid's population, not the layer's own: the grid's
        // is the one every layer of the city shares, so a cell of a given
        // population is drawn the same size whichever layer is on screen —
        // and it is what keeps the rule within 25 m of the published
        // cartograms (checked by test:data). 15minCity's own population
        // model misses them by ~38 m in Milan.
        { source: 'derived', reference: cartogramReference(idx.map((i) => gridPopulation[i])) };
  return { out, order };
}

/**
 * A travel-time matrix with rows and columns put in the layer's stored order.
 *
 * The export numbers cells in its own order; stored, row i and column j are
 * the layer's rows i and j, so the browser indexes the matrix with the same
 * row number it reads the scores with. It is also most of the saving: in H3
 * order neighbouring origins are neighbouring rows, and their travel times
 * nearly repeat, which gzip finds — 2 to 3.5 times smaller, losslessly.
 */
function permuteMatrix(npy, order) {
  const major = npy[6];
  const start = (major >= 2 ? 12 : 10) + (major >= 2 ? npy.readUInt32LE(8) : npy.readUInt16LE(8));
  const n = order.length;
  const out = Buffer.alloc(start + n * n);
  npy.copy(out, 0, 0, start);
  for (let r = 0; r < n; r++) {
    const from = start + order[r] * n;
    const to = start + r * n;
    for (let c = 0; c < n; c++) out[to + c] = npy[from + order[c]];
  }
  return out;
}

/** The context population of each grid cell, by the precedence above. */
function gridPopulation(cells, records) {
  const byCell = new Map();
  for (const layer of [...POPULATION_PRECEDENCE].reverse()) {
    const record = records.get(layer);
    if (!record) continue;
    record.cells.forEach((h3, i) => {
      const value = Number(record.fields.population[i]);
      if (Number.isFinite(value)) byCell.set(h3, Math.round(value));
    });
  }
  return cells.map((h3) => byCell.get(h3) ?? 0);
}

const stableJSON = (value) => JSON.stringify(value);

/** Write a file only when its content changed; report what happened. */
function putFile(rel, text, dryRun) {
  const file = abs(rel);
  let previous = null;
  if (resolveDataFile(file)) {
    try {
      previous = readDataBuffer(file).toString('utf8');
    } catch {
      previous = null;
    }
  }
  if (previous === text) return { rel, changed: false, raw: text.length };
  if (dryRun) return { rel, changed: true, raw: text.length, stored: null };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const size = writeDataFile(file, text);
  return { rel, changed: true, raw: size.raw, stored: size.stored };
}

/**
 * Write a city's grid and every layer file from a set of records.
 *
 * @param {Map<string, object>} records  layer id → record
 * @returns {{ grid: { cells: string[], population: number[] }, files: object[] }}
 */
export function writeCity(cityId, records, { dryRun = false } = {}) {
  const all = new Set();
  for (const record of records.values()) {
    for (const h3 of record.cells) {
      if (getResolution(h3) !== RESOLUTION) throw new Error(`${record.layer}: ${h3} is not r${RESOLUTION}`);
      all.add(h3);
    }
    if (new Set(record.cells).size !== record.cells.length) {
      throw new Error(`${cityId}/${record.layer}: two rows name the same cell`);
    }
  }
  // Sorted, so the same layers always produce the same grid.
  const cells = [...all].sort();
  const position = new Map(cells.map((h3, i) => [h3, i]));
  const population = gridPopulation(cells, records);

  const files = [];
  const grid = { format: 'atlas-grid', version: 1, resolution: RESOLUTION, cells, population };
  files.push(putFile(gridPath(cityId), stableJSON(grid), dryRun));

  const encoded = new Map();
  for (const layer of LAYER_ORDER) {
    const record = records.get(layer);
    if (!record) continue;
    const { out, order } = encodeLayer(record, position, population);
    encoded.set(layer, out);
    if (layer === 'citychrone') record.rowOrder = order;
    files.push(putFile(layerPath(cityId, layer), stableJSON(out), dryRun));
  }

  // Travel-time matrices come with a fresh CityChrone import only; otherwise
  // the ones on disk stay. They are in the layer's row order, which is H3
  // order and so does not move when another layer changes the grid.
  const times = records.get('citychrone')?.times;
  if (times) {
    const template = timesTemplate(cityId);
    const order = records.get('citychrone').rowOrder;
    times.forEach((source, hour) => {
      // A matrix may come as a reader, so only one hour is in memory at a time.
      const buffer = permuteMatrix(typeof source === 'function' ? source() : source, order);
      const rel = hourPath(template, hour);
      const file = abs(rel);
      const same =
        resolveDataFile(file) && Buffer.compare(readDataBuffer(file), buffer) === 0;
      if (same) files.push({ rel, changed: false, raw: buffer.length });
      else if (dryRun) files.push({ rel, changed: true, raw: buffer.length });
      else {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const size = writeDataFile(file, buffer);
        files.push({ rel, changed: true, raw: size.raw, stored: size.stored });
      }
    });
    // A re-import with fewer hours than the last one leaves no stale hour
    // behind for a later catalogue to point at.
    for (let hour = times.length; hour < 100; hour++) {
      const rel = hourPath(template, hour);
      if (!resolveDataFile(abs(rel))) break;
      if (!dryRun) removeDataFile(rel);
      files.push({ rel, changed: true, raw: 0 });
    }
  }

  return { grid, encoded, files };
}

// ── figures a catalogue row carries ──────────────────────────────────

/** Population-weighted centre of a set of cells, as [lon, lat]. */
export function weightedCentre(cells, populations) {
  let sx = 0;
  let sy = 0;
  let sw = 0;
  const centres = cells.map(cellCentre);
  centres.forEach(([x, y], i) => {
    const w = Math.max(Number(populations[i]) || 0, 0);
    sx += x * w;
    sy += y * w;
    sw += w;
  });
  if (!sw) {
    const n = centres.length || 1;
    return [r5(centres.reduce((s, c) => s + c[0], 0) / n), r5(centres.reduce((s, c) => s + c[1], 0) / n)];
  }
  return [r5(sx / sw), r5(sy / sw)];
}

/** Opening zoom for a set of cells: the city with a margin, 8.5–12. */
export function zoomFor(cells) {
  const centres = cells.map(cellCentre);
  const lons = centres.map((c) => c[0]);
  const lats = centres.map((c) => c[1]);
  const spanLon = (Math.max(...lons) - Math.min(...lons)) * Math.cos((lats[0] * Math.PI) / 180);
  const spanLat = Math.max(...lats) - Math.min(...lats);
  const span = Math.max(spanLon, spanLat, 0.01);
  return Math.round(Math.min(12, Math.max(8.5, Math.log2(360 / span) - 1.2)) * 10) / 10;
}

/** Median centre-to-vertex distance of the grid's hexagons, in metres. */
export function cellRadius(cells) {
  const step = Math.max(1, Math.floor(cells.length / 400));
  const radii = [];
  for (let i = 0; i < cells.length; i += step) {
    const centre = cellCentre(cells[i]);
    const ring = cellToBoundary(cells[i]).map(([lat, lon]) => [lon, lat]);
    radii.push(ring.reduce((s, v) => s + metresBetween(centre, v), 0) / ring.length);
  }
  return Math.round(median(radii));
}

// ── the catalogue ────────────────────────────────────────────────────

const CATALOGUE = 'index.json';

export function readCatalogue() {
  const file = abs(CATALOGUE);
  if (!fs.existsSync(file)) return { version: 2, platforms: {}, atlas: { cities: [] } };
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`public/data/index.json cannot be read (${error.message}); restore it from git`);
  }
}

export function writeCatalogue(catalogue, { dryRun = false } = {}) {
  if (dryRun) return;
  const tmp = `${abs(CATALOGUE)}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(catalogue, null, 2)}\n`);
  fs.renameSync(tmp, abs(CATALOGUE));
}

/** Every place the catalogue already describes this city, for its editorial fields. */
function knownMeta(catalogue, cityId) {
  const entries = [
    ...(catalogue.atlas?.cities ?? []),
    ...Object.values(catalogue.platforms ?? {}).flatMap((p) => p.cities ?? []),
  ].filter((c) => c.id === cityId);
  const pick = (key) => entries.map((e) => e[key]).find((v) => typeof v === 'string' && v);
  return {
    name: pick('name'),
    nameIt: pick('nameIt'),
    region: pick('region'),
    regionIt: pick('regionIt'),
    country: pick('country'),
  };
}

function coverageCountry(cityId) {
  for (const platform of LAYER_ORDER) {
    const file = abs(`${platform}/coverage.geojson.gz`);
    if (!resolveDataFile(file)) continue;
    const marker = readDataJSON(file).features.find((f) => f.properties?.id === cityId);
    if (marker?.properties?.country) return marker.properties.country;
  }
  return null;
}

/**
 * A city's name and place. What the catalogue already says wins — names are
 * editorial, and some were written by hand — and anything missing is derived
 * from the city's own centre (scripts/lib/country.mjs). `overrides` are the
 * command-line flags, for when the derivation is wrong.
 */
export function cityMeta(catalogue, cityId, centre, overrides = {}) {
  const known = knownMeta(catalogue, cityId);
  let country = overrides.country ?? known.country ?? coverageCountry(cityId);
  let region = overrides.region ?? known.region;
  let regionIt = overrides.regionIt ?? known.regionIt;
  let place = null;
  if (!country || !region) {
    // A null answer is kept as a place with no country, so the caller can say
    // nothing was found rather than say nothing at all.
    place = countryAt(centre[0], centre[1]) ?? { iso: null, exact: false };
    country = country ?? place.iso ?? null;
    region = region ?? place.name ?? null;
    regionIt = regionIt ?? place.nameIt ?? region;
  }
  const name = overrides.name ?? known.name ?? titleCase(cityId);
  return {
    meta: {
      name,
      nameIt: overrides.nameIt ?? known.nameIt ?? name,
      region: region ?? undefined,
      regionIt: regionIt ?? region ?? undefined,
      country: country ?? undefined,
    },
    derived: place,
  };
}

const PLATFORM_KEYS = { pov: ['summary'], cardep: ['summary'], fifteen: [], citychrone: [] };

function upsertRow(list, row) {
  const next = list.filter((c) => c.id !== row.id);
  next.push(row);
  return next.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Point the catalogue at a city's files: its atlas entry, and one row per
 * layer on the platform lists that the world maps, search and compare view
 * read. `rows` carries each layer's extra fields (thresholds, hourly).
 */
export function updateCatalogue(catalogue, cityId, { grid, encoded, meta, rows }) {
  const layers = LAYER_ORDER.filter((l) => encoded.has(l));
  const atlasEntry = {
    id: cityId,
    ...meta,
    ...(VARIANTS.has(cityId) ? { variant: true } : {}),
    center: weightedCentre(grid.cells, grid.population),
    zoom: zoomFor(grid.cells),
    population: Math.round(grid.population.reduce((a, b) => a + b, 0)),
    grid: gridPath(cityId),
    cell: { h3Resolution: RESOLUTION, cellRadiusM: cellRadius(grid.cells) },
    layers,
    layerData: Object.fromEntries(layers.map((l) => [l, layerPath(cityId, l)])),
    cartogramSources: Object.fromEntries(layers.map((l) => [l, encoded.get(l).cartogram.source])),
  };
  if (encoded.has('citychrone')) {
    atlasEntry.hourly = {
      hours: encoded.get('citychrone').hourly.hours,
      cells: encoded.get('citychrone').cells,
      times: timesTemplate(cityId),
    };
  }

  catalogue.version = 2;
  catalogue.atlas = catalogue.atlas ?? { cities: [] };
  catalogue.atlas.cities = upsertRow(catalogue.atlas.cities ?? [], atlasEntry);
  catalogue.platforms = catalogue.platforms ?? {};

  for (const layer of layers) {
    const record = encoded.get(layer);
    const cells = decodeIdx(record).map((i) => grid.cells[i]);
    const pops = record.fields.population;
    const platform = catalogue.platforms[layer] ?? { coverage: `${layer}/coverage.geojson.gz`, cities: [] };
    platform.coverage = platform.coverage ?? `${layer}/coverage.geojson.gz`;
    for (const key of PLATFORM_KEYS[layer]) platform[key] = platform[key] ?? `${layer}/${key}.json.gz`;
    const row = {
      id: cityId,
      ...meta,
      center: weightedCentre(cells, pops),
      zoom: zoomFor(cells),
      population: Math.round(pops.reduce((a, b) => a + (Number(b) || 0), 0)),
      cells: record.cells,
      layer: layerPath(cityId, layer),
      cell: atlasEntry.cell,
      ...(rows?.[layer] ?? {}),
    };
    if (layer === 'pov' && record.meta?.thresholds) row.thresholds = record.meta.thresholds;
    if (layer === 'citychrone') row.hourly = atlasEntry.hourly;
    platform.cities = upsertRow(platform.cities ?? [], row);
    catalogue.platforms[layer] = platform;
  }
  return atlasEntry;
}

// ── coverage markers and compare-view rows ───────────────────────────

function readCollection(rel) {
  const file = abs(rel);
  if (!resolveDataFile(file)) return { type: 'FeatureCollection', features: [] };
  try {
    return readDataJSON(file);
  } catch (error) {
    throw new Error(`${rel} exists but cannot be read (${error.message}); restore it from git`);
  }
}

/** Put one city's marker on a platform's world map, or take it off. */
export function upsertCoverage(catalogue, layer, cityId, marker, { dryRun = false } = {}) {
  const rel = catalogue.platforms[layer].coverage;
  const collection = readCollection(rel);
  const features = collection.features.filter((f) => f.properties?.id !== cityId);
  if (marker) features.push(marker);
  features.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
  return putFile(rel, JSON.stringify({ type: 'FeatureCollection', features }), dryRun);
}

/** One city's row in a platform's compare-view summary. */
export function upsertSummary(catalogue, layer, row, { dryRun = false } = {}) {
  const rel = catalogue.platforms[layer].summary;
  if (!rel) return null;
  const file = abs(rel);
  let summary = { platform: layer, cities: [] };
  if (resolveDataFile(file)) {
    try {
      summary = readDataJSON(file);
    } catch (error) {
      throw new Error(`${rel} exists but cannot be read (${error.message}); restore it from git`);
    }
  }
  summary.cities = upsertRow(summary.cities ?? [], row);
  return putFile(rel, JSON.stringify(summary), dryRun);
}

// ── per-layer figures, from a layer's own rows ───────────────────────
// Computed at import from the values as published (before rounding), the
// same way the platform pages and the upstream viewers compute them.

export const ZONE_TYPES = ['inclusion', 'spatial isolation', 'social isolation', 'total isolation'];

function populationCdf(rows, value, from, to, steps = 20) {
  const total = rows.reduce((sum, row) => sum + row.population, 0);
  if (!total) return null;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const edge = from + ((to - from) * i) / steps;
    let below = 0;
    for (const row of rows) if (value(row) <= edge) below += row.population;
    points.push([r3(edge), r3(below / total)]);
  }
  return points;
}

/**
 * Coverage marker and summary row for a layer.
 *
 * @param {string} layer
 * @param {object[]} rows    one per cell: `population` plus the layer's values
 * @param {object} context   `{ id, name, country, centre, extra }`
 */
export function describeLayer(layer, rows, { id, name, country, centre, thresholds, hourly }) {
  const population = Math.round(rows.reduce((s, r) => s + r.population, 0));
  const marker = (properties) =>
    VARIANTS.has(id)
      ? null
      : {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: centre },
          properties: { id, name, country, isStudy: true, ...properties },
        };

  if (layer === 'pov') {
    const counts = [0, 0, 0, 0];
    const popByZone = [0, 0, 0, 0];
    for (const row of rows) {
      counts[row.zone]++;
      popByZone[row.zone] += row.population;
    }
    const sortedProx = rows.map((r) => r.proximity).sort((a, b) => a - b);
    const sortedOpp = rows.map((r) => r.opportunity).sort((a, b) => a - b);
    return {
      // City-level zone: the zone most residents live in — by cell count,
      // isolated cells (large, thinly populated) would win almost everywhere.
      marker: marker({
        zone: popByZone.indexOf(Math.max(...popByZone)),
        population,
        inclusionShare: r1((counts[0] / rows.length) * 100),
      }),
      summary: {
        id,
        cells: rows.length,
        population,
        medianProximity: r1(sortedProx[sortedProx.length >> 1]),
        medianOpportunity: r1(sortedOpp[sortedOpp.length >> 1]),
        weightedProximity: population
          ? r1(rows.reduce((s, r) => s + r.proximity * r.population, 0) / population)
          : null,
        weightedOpportunity: population
          ? r1(rows.reduce((s, r) => s + r.opportunity * r.population, 0) / population)
          : null,
        zoneShares: counts.map((c) => r1((c / rows.length) * 100)),
        zonePopulationShares: population ? popByZone.map((p) => r1((p / population) * 100)) : null,
        thresholds,
      },
    };
  }

  if (layer === 'cardep') {
    const cdi = population
      ? r3(rows.reduce((s, r) => s + r.cdi * r.population, 0) / population)
      : r3(rows.reduce((s, r) => s + r.cdi, 0) / (rows.length || 1));
    const sortedCdi = rows.map((r) => r.cdi).sort((a, b) => a - b);
    return {
      marker: marker({ cdi, population }),
      summary: {
        id,
        cells: rows.length,
        population,
        medianCdi: r3(sortedCdi[sortedCdi.length >> 1]),
        weightedCdi: cdi,
        // ±0.05 around zero is what the upstream viewer calls balanced.
        ptShare: r1((rows.filter((r) => r.cdi < -0.05).length / rows.length) * 100),
        carShare: r1((rows.filter((r) => r.cdi > 0.05).length / rows.length) * 100),
        weightedByCar: population ? r1(rows.reduce((s, r) => s + r.car * r.population, 0) / population) : null,
        weightedByTransit: population ? r1(rows.reduce((s, r) => s + r.pt * r.population, 0) / population) : null,
        cdf: populationCdf(rows, (r) => r.cdi, -1, 1),
      },
    };
  }

  if (layer === 'fifteen') {
    return {
      marker: marker({
        proximityMinutes: r1(weightedMedian(rows.map((r) => r.walk), rows.map((r) => r.population))),
        population,
      }),
      summary: null,
    };
  }

  // CityChrone: the population-weighted median velocity at the morning peak,
  // the figure the upstream landing map summarises a city with.
  const hour = Math.min(COVERAGE_HOUR, hourly.hours - 1);
  return {
    marker: marker({
      velocityScore: round(
        weightedMedian(hourly.v[hour], rows.map((r) => r.population)),
        2,
      ),
      population,
    }),
    summary: null,
  };
}

export const COVERAGE_HOUR = 8;

/** Remove a published file (and its plain twin), for clearing out old layouts. */
export function removeDataFile(rel) {
  for (const candidate of [abs(rel), abs(rel).replace(/\.gz$/, '')]) {
    if (fs.existsSync(candidate)) fs.rmSync(candidate);
  }
}

// ── one import, end to end ───────────────────────────────────────────

/**
 * Publish one layer of one city: rebuild the city with it, point the
 * catalogue at the result, and update the platform's marker and summary row.
 *
 * @param {object} input
 * @param {string} input.cityId
 * @param {object} input.record    the layer, H3-keyed (see LAYERS)
 * @param {object[]} input.rows    per-cell values as published, for the figures
 * @param {object} [input.figures] `{ marker, summary }` to publish as given
 *                                 instead of computing them (migration only)
 * @param {object} [input.overrides] name / place flags
 */
export function publishLayer({ cityId, record, rows, figures, overrides = {}, dryRun = false }) {
  const catalogue = readCatalogue();
  const records = readCity(cityId);
  const replaced = records.has(record.layer);
  records.set(record.layer, record);

  const { grid, encoded, files } = writeCity(cityId, records, { dryRun });
  const centre = weightedCentre(grid.cells, grid.population);
  const { meta, derived } = cityMeta(catalogue, cityId, centre, overrides);
  updateCatalogue(catalogue, cityId, { grid, encoded, meta });

  const row = catalogue.platforms[record.layer].cities.find((c) => c.id === cityId);
  const described =
    figures ??
    describeLayer(record.layer, rows, {
      id: cityId,
      name: meta.name,
      country: meta.country,
      centre: row.center,
      thresholds: record.meta?.thresholds,
      hourly: record.hourly,
    });
  files.push(upsertCoverage(catalogue, record.layer, cityId, described.marker, { dryRun }));
  if (described.summary) files.push(upsertSummary(catalogue, record.layer, described.summary, { dryRun }));
  writeCatalogue(catalogue, { dryRun });

  return {
    cityId,
    layer: record.layer,
    replaced,
    cells: record.cells.length,
    gridCells: grid.cells.length,
    layers: [...encoded.keys()],
    meta,
    derived,
    files,
  };
}
