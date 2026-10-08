// Car Dependency Index: one GeoJSON per city, `<City>.geojson` — the true
// hexagons in lon/lat, each carrying `population`, `o_score_pt`,
// `o_score_car` and `CDI` (or `cdi`). Any other property is ignored.
//
// Cells with no CDI (no one reachable either way) are not published, as the
// upstream viewer does not draw them. The platform's own cartogram is not
// read: the Atlas derives every layer's cartogram by one rule
// (scripts/lib/bundle.mjs).

import { readCells } from './common.mjs';

export const layer = 'cardep';
export const dir = 'cdi';
export const accepts = (name) => /\.geojson$/i.test(name);
export const cityName = (name) => name.replace(/\.geojson$/i, '').replace(/[_-](cdi|cardep)$/i, '');

export function parse(source) {
  const { path, cells: read, worstBoundary } = readCells(source);

  const rows = [];
  const cells = [];
  let skipped = 0;
  for (const { h3, properties: p } of read) {
    const cdi = Number(p.CDI ?? p.cdi);
    if (!Number.isFinite(cdi)) {
      skipped++;
      continue;
    }
    if (cdi < -1 || cdi > 1) throw new Error(`${path}: CDI ${cdi} outside [−1, +1]`);
    rows.push({
      population: Number(p.population) || 0,
      cdi,
      pt: Number(p.o_score_pt),
      car: Number(p.o_score_car),
    });
    cells.push(h3);
  }

  const column = (key) => rows.map((r) => r[key]);
  return {
    rows,
    record: {
      layer,
      cells,
      fields: {
        population: column('population'),
        cdi: column('cdi'),
        o_score_pt: column('pt'),
        o_score_car: column('car'),
      },
      meta: {},
    },
    notes: [
      `grid ✓ r9, outlines within ${worstBoundary.toFixed(1)} m`,
      ...(skipped ? [`${skipped} cells without a CDI left out`] : []),
    ],
  };
}
