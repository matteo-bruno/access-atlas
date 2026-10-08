// 15minCity: one GeoJSON per city in the harmonised full-name schema —
// `<category>_<mode>` minutes (`education_foot`, …), `population`, and
// optionally `centroid_lon` / `centroid_lat`. Pipeline debris (`snapped_id`,
// `closest_waypoint`, …) is dropped.
//
// `proximity_time_<mode>` is not taken from the file: some exports store it in
// seconds. It is the mean of the nine categories, and since that is exactly
// derivable it is not stored either — the browser computes it. Only a cell
// with no category to average keeps the file's own figure.

import { FIFTEEN_CATEGORIES, FIFTEEN_MODES, UNREACHABLE, r1 } from '../lib/bundle.mjs';
import { readCells } from './common.mjs';

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
  const { cells: read, worstBoundary } = readCells(source);

  const cells = [];
  const rows = [];
  const fields = { population: [] };
  for (const c of FIFTEEN_CATEGORIES) for (const m of FIFTEEN_MODES) fields[`${c}_${m}`] = [];
  const fallback = Object.fromEntries(FIFTEEN_MODES.map((m) => [`proximity_time_${m}`, []]));
  let needsFallback = false;

  for (const { h3, properties: p } of read) {
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
    record: { layer, cells, fields, meta: {} },
    notes: [`grid ✓ r9, outlines within ${worstBoundary.toFixed(1)} m`],
  };
}
