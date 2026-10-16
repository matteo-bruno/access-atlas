// P.O.V.: one GeoJSON per city, `<City>.geojson` — the true hexagons in
// lon/lat, each carrying `population`, `proximity`, `opportunity` and
// `cell_type`. Any other property is ignored.
//
// The platform's own cartogram is not read: the Atlas derives every layer's
// cartogram by one rule (scripts/lib/bundle.mjs).

import { ZONE_TYPES, r1, weightedMedian } from '../lib/bundle.mjs';
import { locateCells, readCells } from './common.mjs';

export const layer = 'pov';
export const dir = 'pov';
export const accepts = (name) => /\.geojson$/i.test(name);
export const locate = locateCells;
export const cityName = (name) => name.replace(/\.geojson$/i, '');

export function parse(source) {
  const { path, cells: read, worstBoundary } = readCells(source);

  const rows = [];
  const cells = [];
  for (const { h3, properties: p } of read) {
    const zone = ZONE_TYPES.indexOf(String(p.cell_type).trim().toLowerCase());
    if (zone < 0) throw new Error(`${path}: unknown cell_type "${p.cell_type}"`);
    const proximity = Number(p.proximity);
    const opportunity = Number(p.opportunity);
    if (!Number.isFinite(proximity) || !Number.isFinite(opportunity)) {
      throw new Error(`${path}: cell ${h3} has no proximity or opportunity`);
    }
    rows.push({ population: Number(p.population) || 0, proximity, opportunity, zone });
    cells.push(h3);
  }

  // The zone thresholds are population-weighted medians; classifying against
  // them should reproduce the platform's own cell_type, cell for cell. Where
  // it does not, the export's labels are not what its own scores say, and
  // the zones published are the recomputed ones: they are the ones the
  // thresholds in the file describe, and the ones the Stats page recomputes.
  // That is said loudly, because it means the export is not the platform's.
  const weights = rows.map((r) => r.population);
  const proxCut = weightedMedian(rows.map((r) => r.proximity), weights);
  const oppCut = weightedMedian(rows.map((r) => r.opportunity), weights);
  const disagree = [];
  rows.forEach((row, i) => {
    const derived =
      row.proximity >= proxCut && row.opportunity >= oppCut
        ? 0
        : row.proximity >= proxCut
          ? 1
          : row.opportunity >= oppCut
            ? 2
            : 3;
    if (derived !== row.zone) disagree.push({ cell: cells[i], derived, labelled: row.zone, population: row.population });
    row.zone = derived;
  });

  const column = (key) => rows.map((r) => r[key]);
  return {
    rows,
    record: {
      layer,
      cells,
      fields: {
        population: column('population'),
        zone: column('zone'),
        proximity: column('proximity'),
        opportunity: column('opportunity'),
      },
      meta: { thresholds: { proximity: r1(proxCut), opportunity: r1(oppCut) } },
    },
    notes: [
      `grid ✓ r9, outlines within ${worstBoundary.toFixed(1)} m`,
      disagree.length
        ? `zones: ${rows.length - disagree.length} of ${rows.length} cells reproduce cell_type`
        : `zones ✓ ${rows.length} cells reproduce cell_type`,
    ],
    warnings: disagree.length ? [zoneWarning(disagree, rows)] : [],
  };
}

/** What a disagreement with the export's own zones looks like, in one line. */
function zoneWarning(disagree, rows) {
  const total = rows.reduce((a, r) => a + r.population, 0);
  const residents = disagree.reduce((a, d) => a + d.population, 0);
  const share = total ? ` (${((residents / total) * 100).toFixed(1)}% of residents)` : '';
  const examples = disagree
    .slice(0, 3)
    .map((d) => `${d.cell} ${ZONE_TYPES[d.labelled]} → ${ZONE_TYPES[d.derived]}`)
    .join(', ');
  return (
    `${disagree.length} of ${rows.length} cells${share} are labelled with another zone than their scores give ` +
    `at the population-weighted medians; published with the recomputed zones (${examples}${disagree.length > 3 ? ', …' : ''})`
  );
}
