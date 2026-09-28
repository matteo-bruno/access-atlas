// Car Dependency Index: a zip (or folder) holding the city's folder as the
// CDI repository publishes it —
//
//   <city>/cartogram.geojson   values and the population-scaled cartogram
//   <city>/hexes.geojson       the true hexagons (any `hexes*.geojson`)
//   <city>/cdi.csv             the same values again, ignored
//
// Cells with no CDI (no one reachable either way) are not published, as the
// upstream viewer does not draw them.

import {
  boundaryMismatchM,
  cellAt,
  cellCentre,
  ringCentroid,
  ringOffsets,
  GRID_TOLERANCE_M,
} from '../lib/bundle.mjs';
import { baseName, openSource } from '../lib/zip.mjs';
import { metresApart, parseJSON, toLonLat } from './common.mjs';

export const layer = 'cardep';
export const dir = 'cdi';
export const accepts = (name) => /\.zip$/i.test(name) || !/\.[a-z0-9]+$/i.test(name);
export const cityName = (name) => name.replace(/\.zip$/i, '').replace(/[_-](cdi|cardep)$/i, '');

export function parse(source) {
  const files = openSource(source);
  const cartogramFile = files.find((f) => baseName(f.path).toLowerCase() === 'cartogram.geojson');
  if (!cartogramFile) throw new Error('no cartogram.geojson in the source');
  const hexesFile = files.find((f) => /^hexes.*\.geojson$/i.test(baseName(f.path)));

  const cartogram = parseJSON(cartogramFile);
  const unproject = toLonLat(cartogram, cartogramFile.path);

  // CDI publishes the true hexagons beside the cartogram, so the cell can be
  // read off them rather than inferred, and checked against the grid.
  const cellById = new Map();
  if (hexesFile) {
    const hexes = parseJSON(hexesFile);
    const toDeg = toLonLat(hexes, hexesFile.path);
    for (const feature of hexes.features) {
      const ring = feature.geometry.coordinates[0].map(toDeg);
      const h3 = cellAt(ringCentroid(ring), hexesFile.path);
      const off = boundaryMismatchM(h3, ring);
      if (off > GRID_TOLERANCE_M) {
        throw new Error(`${hexesFile.path}: a hexagon is ${off.toFixed(1)} m from its H3 cell's outline`);
      }
      cellById.set(feature.properties.id, h3);
    }
  }

  const rows = [];
  const cells = [];
  const offsets = [];
  let skipped = 0;
  for (const feature of cartogram.features) {
    const p = feature.properties;
    const cdi = Number(p.CDI ?? p.cdi);
    if (!Number.isFinite(cdi)) {
      skipped++;
      continue;
    }
    if (cdi < -1 || cdi > 1) throw new Error(`${cartogramFile.path}: CDI ${cdi} outside [−1, +1]`);
    const ring = feature.geometry.coordinates[0].map(unproject);
    const centre = ringCentroid(ring);
    const h3 = cellById.get(p.id) ?? cellAt(centre, cartogramFile.path);
    const off = metresApart(centre, cellCentre(h3));
    if (off > GRID_TOLERANCE_M) {
      throw new Error(`${cartogramFile.path}: cell ${p.id} is drawn ${off.toFixed(1)} m from its hexagon`);
    }
    rows.push({
      population: Number(p.population) || 0,
      cdi,
      pt: Number(p.o_score_pt),
      car: Number(p.o_score_car),
    });
    cells.push(h3);
    offsets.push(ringOffsets(h3, ring));
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
      cartogram: { source: 'published', offsets },
    },
    notes: [
      hexesFile ? `hexagons ✓ ${cellById.size} on the H3 grid` : 'no hexes.geojson, cells from cartogram centres',
      ...(skipped ? [`${skipped} cells without a CDI left out`] : []),
    ],
  };
}
