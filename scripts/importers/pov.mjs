// P.O.V.: a zip (or folder) holding the city's two GeoJSON files as the
// platform exports them —
//
//   <city>.geojson             true hexagons, lon/lat
//   <city>_cartogram.geojson   the population-scaled cartogram, EPSG:3857
//
// both carrying `hexagon_id`, `population`, `proximity`, `opportunity` and
// `cell_type`. The hexagons give each cell its H3 index exactly; the
// cartogram is kept as the platform drew it.

import {
  ZONE_TYPES,
  boundaryMismatchM,
  cellAt,
  cellCentre,
  r1,
  ringCentroid,
  ringOffsets,
  weightedMedian,
  GRID_TOLERANCE_M,
} from '../lib/bundle.mjs';
import { baseName, openSource } from '../lib/zip.mjs';
import { parseJSON, toLonLat, metresApart } from './common.mjs';

export const layer = 'pov';
export const dir = 'pov';
export const accepts = (name) => /\.zip$/i.test(name) || !/\.[a-z0-9]+$/i.test(name);
export const cityName = (name) => name.replace(/\.zip$/i, '').replace(/[_-]pov$/i, '');

export function parse(source) {
  const files = openSource(source).filter((f) => /\.geojson$/i.test(f.path));
  const cartogramFile = files.find((f) => /_cartogram\.geojson$/i.test(baseName(f.path)));
  if (!cartogramFile) throw new Error('no *_cartogram.geojson in the source');
  const geoFile = files.find((f) => f !== cartogramFile);

  const cartogram = parseJSON(cartogramFile);
  const unproject = toLonLat(cartogram, cartogramFile.path);
  const geo = geoFile ? parseJSON(geoFile) : null;

  // The true hexagons name the cell exactly. Without them the cartogram's own
  // centroid does, since it scales each cell about its centre (≤ 5 m off).
  const cellById = new Map();
  if (geo) {
    for (const feature of geo.features) {
      const ring = feature.geometry.coordinates[0];
      const h3 = cellAt(ringCentroid(ring), geoFile.path);
      const off = boundaryMismatchM(h3, ring);
      if (off > GRID_TOLERANCE_M) {
        throw new Error(`${geoFile.path}: a hexagon is ${off.toFixed(1)} m from its H3 cell's outline`);
      }
      cellById.set(feature.properties.hexagon_id, h3);
    }
  }

  const rows = [];
  const cells = [];
  const offsets = [];
  for (const feature of cartogram.features) {
    const p = feature.properties;
    const ring = feature.geometry.coordinates[0].map(unproject);
    const centre = ringCentroid(ring);
    const h3 = geo ? cellById.get(p.hexagon_id) : cellAt(centre, cartogramFile.path);
    if (!h3) throw new Error(`${cartogramFile.path}: hexagon_id ${p.hexagon_id} is not in ${geoFile.path}`);
    const off = metresApart(centre, cellCentre(h3));
    if (off > GRID_TOLERANCE_M) {
      throw new Error(`${cartogramFile.path}: hexagon_id ${p.hexagon_id} is drawn ${off.toFixed(1)} m from its cell`);
    }
    const zone = ZONE_TYPES.indexOf(String(p.cell_type).trim().toLowerCase());
    if (zone < 0) throw new Error(`${cartogramFile.path}: unknown cell_type "${p.cell_type}"`);
    rows.push({
      population: Number(p.population) || 0,
      proximity: Number(p.proximity),
      opportunity: Number(p.opportunity),
      zone,
    });
    cells.push(h3);
    offsets.push(ringOffsets(h3, ring));
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
      cartogram: { source: 'published', offsets },
    },
    notes: [`zones ✓ ${rows.length} cells reproduce cell_type`, geo ? 'hexagons ✓ on the H3 grid' : 'no hexagon file, cells from cartogram centres'],
  };
}
