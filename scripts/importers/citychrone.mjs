// CityChrone: a zip (or folder) of the city's hourly files as the platform
// exports them, each hour's file either plain, gzipped or zipped on its own —
//
//   <City>/hexcoverHH.json(.zip)   per-cell v_score, s_score, pop (or population), coord
//   <City>/timesHH.npy(.zip)       uint8 minutes, cells × cells, row = new_id
//
// The scores of all hours go into one layer file (a few hundred kB), so the
// hour selector is a repaint. The travel-time matrices are the bulk and are
// only needed for isochrones, one origin at a time, so they are rewritten in
// the Atlas's own format (src/data/times.js): one file per hour, read one
// block of origins at a time, without the cells where nobody lives and with
// every time over two hours as one class. They are streamed, never read
// whole (lib/times.mjs), because a metro area's are gigabytes an hour.
//
// The matrices are optional. An export with hexcovers and no timesHH files
// publishes the scores, and the city's isochrones read "not available".

import zlib from 'node:zlib';
import { GRID_TOLERANCE_M, boundaryMismatchM, cellAt, weightedCentre } from '../lib/bundle.mjs';
import { checkNpy } from '../lib/times.mjs';
import { baseName, chain, fromZip, openSource, unzipOneStream } from '../lib/zip.mjs';

export const layer = 'citychrone';
export const dir = 'citychrone';
export const accepts = (name) => /\.zip$/i.test(name) || !/\.[a-z0-9]+$/i.test(name);
export const cityName = (name) => name.replace(/\.zip$/i, '');

/**
 * Every hourly member: `{ hexcover: [], times: [] }`. A hexcover is read
 * whole (`read`), unzipped where it came zipped; a matrix is only ever
 * streamed (`open`, a promise of its decoded .npy bytes).
 */
function hourlyFiles(source) {
  const found = { hexcover: [], times: [] };
  for (const file of openSource(source)) {
    const name = baseName(file.path);
    const match = name.match(/^(hexcover|times)(\d{2})(?:\.(json|geojson|npy))?(?:\.(zip|gz))?$/i);
    if (!match || (!match[3] && !match[4])) continue;
    const kind = match[1].toLowerCase();
    const hour = Number(match[2]);
    const wrapper = match[4]?.toLowerCase();
    const entry = { path: file.path };
    if (kind === 'hexcover') {
      entry.read =
        wrapper === 'zip'
          ? () => {
              const inner = fromZip(file.read(), file.path);
              if (inner.length !== 1) throw new Error(`${file.path} holds ${inner.length} files, expected one`);
              return inner[0].read();
            }
          : wrapper === 'gz'
            ? () => zlib.gunzipSync(file.read())
            : file.read;
    } else {
      entry.open =
        wrapper === 'zip'
          ? async () => (await unzipOneStream(file.stream(), file.path)).stream
          : wrapper === 'gz'
            ? async () => chain(file.stream(), zlib.createGunzip({ chunkSize: 1 << 20 }))
            : async () => file.stream();
    }
    if (found[kind][hour]) throw new Error(`two ${kind} files for hour ${match[2]}`);
    found[kind][hour] = entry;
  }
  return found;
}

/**
 * A cell's residents. Exports name the field `pop` or `population`; reading
 * only the first made a metro area's every cell empty, and its travel times
 * kept no origin.
 */
const residents = (p) => Number(p.pop ?? p.population);

/** Where the city is: its population-weighted centre in hour 00, as [lon, lat]. */
export function locate(source) {
  const [first] = hourlyFiles(source).hexcover;
  if (!first) throw new Error('no hexcoverHH files in the source');
  const features = JSON.parse(first.read().toString('utf8').replace(/^\uFEFF/, '')).features;
  // hexcover `coord` is [lat, lon].
  const cells = features.map((f) => cellAt([f.properties.coord[1], f.properties.coord[0]], first.path));
  return weightedCentre(cells, features.map((f) => residents(f.properties) || 0));
}

export async function parse(source) {
  const { hexcover, times } = hourlyFiles(source);
  const hours = hexcover.length;
  if (!hours) throw new Error('no hexcoverHH files in the source');
  for (let h = 0; h < hours; h++) {
    if (!hexcover[h]) throw new Error(`hexcover for hour ${String(h).padStart(2, '0')} is missing`);
  }
  // No matrices at all is a city without isochrones; some of them is an
  // export that went wrong, and is refused rather than published with gaps.
  const withTimes = times.some(Boolean);
  if (withTimes) {
    for (let h = 0; h < hours; h++) {
      if (!times[h]) throw new Error(`times for hour ${String(h).padStart(2, '0')} is missing`);
    }
    if (times.length !== hours) throw new Error(`${times.length} times files for ${hours} hexcover files`);
  }

  const covers = hexcover.map((f) => {
    const text = f.read().toString('utf8').replace(/^﻿/, '');
    return JSON.parse(text).features;
  });

  // Rows are read in CityChrone's own `new_id` order, which is also the
  // matrices' row order; the writer re-orders both together.
  const reference = covers[0];
  const n = reference.length;
  const byId = new Array(n);
  for (const feature of reference) {
    const id = feature.properties.new_id;
    if (!Number.isInteger(id) || id < 0 || id >= n || byId[id]) {
      throw new Error(`${hexcover[0].path}: new_id ${id} is not a unique index below ${n}`);
    }
    byId[id] = feature;
  }

  const cells = byId.map((feature) => {
    // hexcover `coord` is [lat, lon], the one published file on that order.
    const [lat, lon] = feature.properties.coord;
    const h3 = cellAt([lon, lat], hexcover[0].path);
    const off = boundaryMismatchM(h3, feature.geometry.coordinates[0]);
    if (off > GRID_TOLERANCE_M) {
      throw new Error(`${hexcover[0].path}: a cell is ${off.toFixed(1)} m from its H3 r9 outline`);
    }
    return h3;
  });
  const rawPopulation = byId.map((f) => residents(f.properties));
  const population = rawPopulation.map((p) => Math.round(p || 0));

  const v = [];
  const s = [];
  covers.forEach((features, hour) => {
    if (features.length !== n) {
      throw new Error(`${hexcover[hour].path} has ${features.length} cells, hour 00 has ${n}`);
    }
    const vh = new Array(n);
    const sh = new Array(n);
    for (const feature of features) {
      const p = feature.properties;
      const ref = byId[p.new_id]?.properties;
      if (!ref || ref.coord[0] !== p.coord[0] || ref.coord[1] !== p.coord[1]) {
        throw new Error(`${hexcover[hour].path}: new_id ${p.new_id} is not the cell it is in hour 00`);
      }
      vh[p.new_id] = Number(p.v_score);
      sh[p.new_id] = Number(p.s_score);
    }
    v.push(vh);
    s.push(sh);
  });

  // A matrix is n² bytes an hour, so here only its header is read: the
  // writer streams each one once, in the export's row order, and checks its
  // length as it goes (lib/times.mjs).
  for (const file of times.filter(Boolean)) await checkNpy(file.open, n, file.path);

  const notes = [`${n} cells × ${hours} hours, order stable across hours`];
  if (!withTimes) notes.push('no timesHH files: published without isochrones');

  // Residents decide which travel times are kept and weight every figure
  // about the city (its marker, its statistics). An export whose `pop` says
  // nobody lives anywhere imports without error and shows nothing, so it is
  // said loudly, with what it looks like.
  const warnings = [];
  const inhabited = population.filter((p) => p > 0).length;
  const missing = rawPopulation.filter((p) => !Number.isFinite(p)).length;
  const roundedAway = rawPopulation.filter((p, i) => p > 0 && population[i] === 0).length;
  if (!inhabited) {
    const max = Math.max(0, ...rawPopulation.filter(Number.isFinite));
    warnings.push(
      `hexcover \`pop\` / \`population\` gives no cell a resident (${missing ? `${missing} of ${n} cells have none` : `largest value ${max}`}). ` +
        (withTimes ? 'Travel times are kept for every cell, ' : '') +
        'and every figure weighted by residents (the world-map marker, the statistics) has nothing to weigh: ' +
        'check the export\'s population field.',
    );
  } else if (roundedAway > n / 10) {
    warnings.push(
      `${roundedAway} of ${n} cells have a \`pop\` / \`population\` under 0.5, published as 0 residents` +
        (withTimes ? ', and their travel times are left out' : '') +
        ': check the export\'s population field is a headcount.',
    );
  }
  if (withTimes) notes.push(`travel times kept for ${inhabited || n} of ${n} cells (${inhabited ? 'the inhabited ones' : 'all of them'})`);

  return {
    rows: population.map((p) => ({ population: p })),
    record: {
      layer,
      cells,
      fields: { population },
      meta: {},
      hourly: { hours, v, s },
      // [] says "this import has no matrices", which takes any published
      // ones off; a record read back from disk has no `times` at all, and
      // keeps them.
      times: withTimes ? times.map((file) => ({ label: file.path, open: file.open })) : [],
    },
    notes,
    warnings,
  };
}
