// CityChrone: a zip (or folder) of the city's hourly files as the platform
// exports them, each hour's file either plain or zipped on its own —
//
//   <City>/hexcoverHH.json(.zip)   per-cell v_score, s_score, pop, coord
//   <City>/timesHH.npy(.zip)       uint8 minutes, cells × cells, row = new_id
//
// The scores of all hours go into one layer file (a few hundred kB), so the
// hour selector is a repaint. The travel-time matrices are the bulk and are
// only needed for isochrones, so they stay one file per hour, fetched on
// demand — with rows and columns put in grid order, which is lossless and
// makes them 2–3.5 times smaller (see permuteMatrix in lib/bundle.mjs).

import zlib from 'node:zlib';
import { GRID_TOLERANCE_M, boundaryMismatchM, cellAt } from '../lib/bundle.mjs';
import { baseName, fromZip, openSource } from '../lib/zip.mjs';

export const layer = 'citychrone';
export const dir = 'citychrone';
export const accepts = (name) => /\.zip$/i.test(name) || !/\.[a-z0-9]+$/i.test(name);
export const cityName = (name) => name.replace(/\.zip$/i, '');

/** Every hourly member, unzipped where it came zipped: `{ hexcover: [], times: [] }`. */
function hourlyFiles(source) {
  const found = { hexcover: [], times: [] };
  for (const file of openSource(source)) {
    const name = baseName(file.path);
    const match = name.match(/^(hexcover|times)(\d{2})\.(json|npy|zip)(\.gz)?$/i);
    if (!match) continue;
    const kind = match[1].toLowerCase();
    const hour = Number(match[2]);
    const read =
      match[3].toLowerCase() === 'zip'
        ? () => {
            const inner = fromZip(file.read(), file.path);
            if (inner.length !== 1) throw new Error(`${file.path} holds ${inner.length} files, expected one`);
            return inner[0].read();
          }
        : match[4]
          ? () => zlib.gunzipSync(file.read())
          : file.read;
    if (found[kind][hour]) throw new Error(`two ${kind} files for hour ${match[2]}`);
    found[kind][hour] = { path: file.path, read };
  }
  return found;
}

/** Header check for a .npy matrix: uint8, C order, n × n. */
function checkNpy(buffer, n, label) {
  if (buffer[0] !== 0x93 || buffer.subarray(1, 6).toString('latin1') !== 'NUMPY') {
    throw new Error(`${label} is not a .npy file`);
  }
  const major = buffer[6];
  const headerLength = major >= 2 ? buffer.readUInt32LE(8) : buffer.readUInt16LE(8);
  const start = major >= 2 ? 12 : 10;
  const header = buffer.subarray(start, start + headerLength).toString('latin1');
  if (!/'descr':\s*'\|u1'/.test(header)) throw new Error(`${label}: not uint8 (${header.trim()})`);
  if (/'fortran_order':\s*True/.test(header)) throw new Error(`${label}: Fortran order is not supported`);
  const shape = header.match(/'shape':\s*\((\d+),\s*(\d+)\)/);
  if (!shape || Number(shape[1]) !== n || Number(shape[2]) !== n) {
    throw new Error(`${label}: shape ${shape ? `${shape[1]}×${shape[2]}` : 'unknown'}, expected ${n}×${n}`);
  }
  if (buffer.length - start - headerLength < n * n) throw new Error(`${label} is truncated`);
}

export function parse(source) {
  const { hexcover, times } = hourlyFiles(source);
  const hours = hexcover.length;
  if (!hours) throw new Error('no hexcoverHH files in the source');
  for (let h = 0; h < hours; h++) {
    if (!hexcover[h]) throw new Error(`hexcover for hour ${String(h).padStart(2, '0')} is missing`);
    if (!times[h]) throw new Error(`times for hour ${String(h).padStart(2, '0')} is missing`);
  }
  if (times.length !== hours) throw new Error(`${times.length} times files for ${hours} hexcover files`);

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
  const population = byId.map((f) => Math.round(Number(f.properties.pop) || 0));

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

  // Each matrix is n² bytes and a large city's 24 do not fit in memory at
  // once, so they are checked here one at a time, and handed on as readers
  // the writer calls hour by hour. That decodes each twice, which is the
  // price of failing before any file is written rather than halfway through.
  const matrices = times.map((file) => {
    checkNpy(file.read(), n, file.path);
    return () => {
      const buffer = file.read();
      checkNpy(buffer, n, file.path);
      return buffer;
    };
  });

  return {
    rows: population.map((p) => ({ population: p })),
    record: {
      layer,
      cells,
      fields: { population },
      meta: {},
      hourly: { hours, v, s },
      times: matrices,
    },
    notes: [`${n} cells × ${hours} hours, order stable across hours`],
  };
}
