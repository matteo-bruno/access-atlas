// P.O.V.: one GeoJSON per city, `<City>.geojson` — the true hexagons in
// lon/lat, each carrying `population`, `proximity`, `opportunity` and
// `cell_type`. Any other property is ignored.
//
// The platform's own cartogram is not read: the Atlas derives every layer's
// cartogram by one rule (scripts/lib/bundle.mjs).

import { ZONE_TYPES, r1, weightedMedian } from '../lib/bundle.mjs';
import { readCells } from './common.mjs';

export const layer = 'pov';
export const dir = 'pov';
export const accepts = (name) => /\.geojson$/i.test(name);
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
  // them must reproduce the platform's own cell_type, cell for cell.
  const weights = rows.map((r) => r.population);
  const proxCut = weightedMedian(rows.map((r) => r.proximity), weights);
  const oppCut = weightedMedian(rows.map((r) => r.opportunity), weights);
  rows.forEach((row, i) => {
    const derived =
      row.proximity >= proxCut && row.opportunity >= oppCut
        ? 0
        : row.proximity >= proxCut
          ? 1
          : row.opportunity >= oppCut
            ? 2
            : 3;
    if (derived !== row.zone) {
      throw new Error(`cell ${cells[i]} classifies as zone ${derived} but is labelled ${row.zone}`);
    }
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
    notes: [`grid ✓ r9, outlines within ${worstBoundary.toFixed(1)} m`, `zones ✓ ${rows.length} cells reproduce cell_type`],
  };
}
