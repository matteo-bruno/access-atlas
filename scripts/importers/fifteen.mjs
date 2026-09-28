// 15minCity: one GeoJSON per city in the harmonised full-name schema —
// `<category>_<mode>` minutes (`education_foot`, …), `population`, and
// optionally `centroid_lon` / `centroid_lat`. Pipeline debris (`snapped_id`,
// `closest_waypoint`, …) is dropped.
//
// `proximity_time_<mode>` is not taken from the file: some exports store it in
// seconds. It is the mean of the nine categories, and since that is exactly
// derivable it is not stored either — the browser computes it. Only a cell
// with no category to average keeps the file's own figure.

import {
  FIFTEEN_CATEGORIES,
  FIFTEEN_MODES,
  UNREACHABLE,
  GRID_TOLERANCE_M,
  boundaryMismatchM,
  cellAt,
  r1,
  ringCentroid,
} from '../lib/bundle.mjs';
import { openSource } from '../lib/zip.mjs';
import { parseJSON } from './common.mjs';

export const layer = 'fifteen';
export const dir = '15mincity';
export const accepts = (name) => /\.geojson$/i.test(name);
export const cityName = (name) => name.replace(/\.geojson$/i, '').replace(/[_-]15mincity$/i, '');

/** The mean of a cell's category minutes for one mode, as the site computes it. */
export function modeAverage(properties, mode) {
  const values = FIFTEEN_CATEGORIES.map((c) => properties[`${c}_${mode}`]).filter(
    (v) => Number.isFinite(v) && v !== UNREACHABLE,
  );
  return values.length ? r1(values.reduce((s, v) => s + v, 0) / values.length) : null;
}

export function parse(source) {
  const [file] = openSource(source);
  const collection = parseJSON(file);
  if (collection.type !== 'FeatureCollection') throw new Error(`${file.path}: not a FeatureCollection`);

  const cells = [];
  const rows = [];
  const fields = { population: [] };
  for (const c of FIFTEEN_CATEGORIES) for (const m of FIFTEEN_MODES) fields[`${c}_${m}`] = [];
  const fallback = Object.fromEntries(FIFTEEN_MODES.map((m) => [`proximity_time_${m}`, []]));
  let needsFallback = false;
  let worstBoundary = 0;

  for (const feature of collection.features) {
    const p = feature.properties ?? {};
    const ring = feature.geometry.coordinates[0];
    const centre =
      Number.isFinite(Number(p.centroid_lon)) && Number.isFinite(Number(p.centroid_lat))
        ? [Number(p.centroid_lon), Number(p.centroid_lat)]
        : ringCentroid(ring);
    const h3 = cellAt(centre, file.path);
    // A centre matches r9 whether the mesh is r9 or finer; the outline does not.
    const off = boundaryMismatchM(h3, ring);
    if (off > GRID_TOLERANCE_M) {
      throw new Error(`${file.path}: a cell is ${off.toFixed(1)} m from its H3 r9 outline — not on the standard grid`);
    }
    worstBoundary = Math.max(worstBoundary, off);
    cells.push(h3);

    const values = {};
    fields.population.push(Math.round(Number(p.population) || 0));
    for (const c of FIFTEEN_CATEGORIES) {
      for (const m of FIFTEEN_MODES) {
        const key = `${c}_${m}`;
        const v = Number(p[key]);
        values[key] = Number.isFinite(v) ? (v === UNREACHABLE ? UNREACHABLE : r1(v)) : null;
        fields[key].push(values[key]);
      }
    }
    for (const m of FIFTEEN_MODES) {
      const key = `proximity_time_${m}`;
      const own = modeAverage(values, m);
      if (own == null && Number.isFinite(Number(p[key]))) {
        fallback[key].push(r1(Number(p[key])));
        needsFallback = true;
      } else fallback[key].push(null);
      values[key] = own ?? fallback[key][fallback[key].length - 1];
    }
    rows.push({ population: fields.population.at(-1), walk: values.proximity_time_foot });
  }

  if (needsFallback) Object.assign(fields, fallback);
  return {
    rows,
    record: { layer, cells, fields, meta: {}, cartogram: { source: 'derived' } },
    notes: [`grid ✓ r9, outlines within ${worstBoundary.toFixed(1)} m`],
  };
}
