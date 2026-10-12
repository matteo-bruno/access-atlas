// Small pieces every importer needs.

import { GRID_TOLERANCE_M, boundaryMismatchM, cellAt, ringCentroid, weightedCentre } from '../lib/bundle.mjs';
import { openSource } from '../lib/zip.mjs';

/** A source file's JSON, BOM and all. */
export function parseJSON(file) {
  const text = file.read().toString('utf8').replace(/^﻿/, '');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${file.path} is not valid JSON (${error.message})`);
  }
}

/**
 * One city's layer as P.O.V., Car Dependency and 15minCity all hand it over:
 * one GeoJSON FeatureCollection in lon/lat, one feature per H3 r9 cell, drawn
 * as the cell's own hexagon, the platform's values as its properties.
 *
 * Every cell is proved to be on the grid, not assumed to be: its centre within
 * 10 m of an r9 cell centre and its outline within 10 m of that cell's own
 * boundary (a centre alone matches r9 whether the mesh is r9 or finer). The
 * centre is the file's `centroid_lon` / `centroid_lat` when it states them,
 * else the mean of the vertices, which sits up to 28 m off near an edge of
 * H3's icosahedron (see CLAUDE.md).
 *
 * @returns {{ path: string, cells: { h3: string, properties: object }[], worstBoundary: number }}
 */
export function readCells(source) {
  const files = openSource(source);
  if (files.length !== 1) throw new Error(`${source}: expected one GeoJSON file, found ${files.length}`);
  const [file] = files;
  const collection = parseJSON(file);
  if (collection.type !== 'FeatureCollection') throw new Error(`${file.path}: not a FeatureCollection`);
  const crs = String(collection.crs?.properties?.name ?? '');
  if (crs && !/4326|CRS84/i.test(crs)) throw new Error(`${file.path}: unsupported CRS ${crs}, expected lon/lat (EPSG:4326)`);

  const cells = [];
  let worstBoundary = 0;
  for (const feature of collection.features) {
    const p = feature.properties ?? {};
    const ring = feature.geometry?.coordinates?.[0];
    if (feature.geometry?.type !== 'Polygon' || !ring) throw new Error(`${file.path}: a feature is not a Polygon`);
    if (Math.abs(ring[0][0]) > 180 || Math.abs(ring[0][1]) > 90) {
      throw new Error(`${file.path}: coordinates are not lon/lat (EPSG:4326)`);
    }
    const centre =
      Number.isFinite(Number(p.centroid_lon)) && Number.isFinite(Number(p.centroid_lat))
        ? [Number(p.centroid_lon), Number(p.centroid_lat)]
        : ringCentroid(ring);
    const h3 = cellAt(centre, file.path);
    const off = boundaryMismatchM(h3, ring);
    if (off > GRID_TOLERANCE_M) {
      throw new Error(`${file.path}: a cell is ${off.toFixed(1)} m from its H3 r9 outline — not on the standard grid`);
    }
    worstBoundary = Math.max(worstBoundary, off);
    cells.push({ h3, properties: p });
  }
  return { path: file.path, cells, worstBoundary };
}

/**
 * Where a GeoJSON source's city is: its population-weighted centre, as
 * [lon, lat], the point the importer takes its country from. update-data
 * asks it only to tell apart two cities whose names make the same id.
 */
export function locateCells(source) {
  const { cells } = readCells(source);
  return weightedCentre(
    cells.map((c) => c.h3),
    cells.map((c) => Number(c.properties.population) || 0),
  );
}
