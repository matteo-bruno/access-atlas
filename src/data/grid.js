// ─────────────────────────────────────────────────────────────────────────
// A city's published grid and layers → the union mesh the viewer draws.
//
// On disk a city is one grid file (H3 indices and a population per cell) and
// one file per layer (columns of values keyed to grid positions); see
// scripts/lib/bundle.mjs for the format and the reasoning. The polygons are
// not stored at all: every cell is a standard H3 hexagon, so its outline is
// computed from its index here. h3-js is imported on demand, so only the city
// view pays for it.
//
// The result is the same FeatureCollection the viewer always drew — one
// feature per cell, `id` = grid position, a layer's values as properties on
// the cells it covers — so the page and its paint expressions do not know
// the storage changed. Layers are merged in as they load.
// ─────────────────────────────────────────────────────────────────────────

let h3Promise = null;
const loadH3 = () => {
  h3Promise ??= import('h3-js');
  return h3Promise;
};

const FIFTEEN_CATEGORIES = [
  'healthcare',
  'transport',
  'culture',
  'services',
  'restaurant',
  'physical',
  'education',
  'supplies',
  'outdoor',
];
const FIFTEEN_MODES = ['foot', 'bicycle'];
const UNREACHABLE = 99999;

// Which of a layer file's fields become feature properties, and under what
// name. Population is not among them: a cell's population is the grid's.
const PROPERTIES = {
  pov: ['zone', 'proximity', 'opportunity'],
  cardep: ['cdi', 'o_score_pt', 'o_score_car'],
  fifteen: FIFTEEN_CATEGORIES.flatMap((c) => FIFTEEN_MODES.map((m) => `${c}_${m}`)),
  citychrone: [],
};

/** Grid positions of a layer's rows, decoded from their delta encoding. */
export function layerPositions(file) {
  const out = new Int32Array(file.idx.length);
  if (file.order !== 'grid') {
    out.set(file.idx);
    return out;
  }
  let at = 0;
  for (let i = 0; i < file.idx.length; i++) {
    at += file.idx[i];
    out[i] = at;
  }
  return out;
}

const closedRing = (boundary) => {
  const ring = boundary.map(([lat, lon]) => [lon, lat]);
  ring.push(ring[0]);
  return ring;
};

/**
 * The grid as drawable features: every cell, its hexagon, its population.
 *
 * @param {{ cells: string[], population: number[] }} grid
 */
export async function gridFeatures(grid) {
  const { cellToBoundary } = await loadH3();
  return grid.cells.map((h3, i) => ({
    type: 'Feature',
    id: i,
    geometry: { type: 'Polygon', coordinates: [closedRing(cellToBoundary(h3))] },
    properties: { h3, population: grid.population[i] },
  }));
}

/** 15minCity's average over the nine categories, exactly as the importer rounds it. */
function modeAverage(properties, mode) {
  let sum = 0;
  let count = 0;
  for (const category of FIFTEEN_CATEGORIES) {
    const v = properties[`${category}_${mode}`];
    if (Number.isFinite(v) && v !== UNREACHABLE) {
      sum += v;
      count++;
    }
  }
  return count ? Math.round((sum / count) * 10) / 10 : null;
}

/**
 * Put a layer's values on the features that carry them.
 *
 * Returns a new array; features the layer touches are new objects, so a
 * consumer holding the previous array sees the change.
 */
export function mergeLayer(features, layer, file) {
  const positions = layerPositions(file);
  const names = PROPERTIES[layer] ?? [];
  const out = features.slice();
  for (let row = 0; row < positions.length; row++) {
    const at = positions[row];
    const feature = out[at];
    if (!feature) throw new Error(`${layer}: row ${row} points at grid position ${at}`);
    const properties = { ...feature.properties };
    for (const name of names) {
      const value = file.fields[name]?.[row];
      if (value != null) properties[name] = value;
    }
    if (layer === 'fifteen') {
      for (const mode of FIFTEEN_MODES) {
        const key = `proximity_time_${mode}`;
        const value = modeAverage(properties, mode) ?? file.fields[key]?.[row] ?? null;
        if (value != null) properties[key] = value;
      }
    }
    // CityChrone's hourly values are joined as feature-state by row number;
    // the property says which row a cell is.
    if (layer === 'citychrone') properties.cc = row;
    out[at] = { ...feature, properties };
  }
  return out;
}

/**
 * One hour of CityChrone scores, keyed by layer row — the shape the viewer's
 * feature-state join and summary read.
 */
export function citychroneHourFromLayer(file, hour) {
  const hours = file.hourly?.hours ?? 0;
  if (!hours) return null;
  const h = Math.min(Math.max(0, hour | 0), hours - 1);
  const v = file.hourly.v[h];
  const s = file.hourly.s[h];
  const pop = file.fields.population;

  const byCc = new Map();
  for (let row = 0; row < v.length; row++) byCc.set(row, { v: v[row], s: s[row] });

  const finite = v.filter(Number.isFinite);
  const sorted = [...finite].sort((a, b) => a - b);
  const pairs = v
    .map((value, i) => [value, Math.max(0, pop[i] || 0)])
    .filter(([value]) => Number.isFinite(value))
    .sort((a, b) => a[0] - b[0]);
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  let acc = 0;
  let weighted = pairs[pairs.length - 1]?.[0] ?? null;
  for (const [value, w] of pairs) {
    acc += w;
    if (acc >= total / 2) {
      weighted = value;
      break;
    }
  }

  return {
    byCc,
    cells: v.length,
    medianV: sorted.length ? Math.round(sorted[sorted.length >> 1] * 100) / 100 : null,
    weightedMedianV: weighted == null ? null : Math.round(weighted * 100) / 100,
  };
}

/**
 * A layer's cartogram, as the companion `withGeometry` swaps in: one polygon
 * per cell the layer covers, `{ i: grid position }`.
 *
 * Published cartograms are stored as vertex offsets from each cell's centre;
 * derived ones are the cell's own hexagon scaled so its area is proportional
 * to the cell's population (the grid's, shared by every layer, so a cell is
 * the same size whichever layer draws it), full size at `reference`.
 */
export async function layerCartogram(grid, file) {
  const { cellToBoundary, cellToLatLng } = await loadH3();
  const positions = layerPositions(file);
  const cartogram = file.cartogram ?? {};
  const unit = cartogram.unit ?? 1e-5;
  const reference = cartogram.reference;
  const pop = grid.population;

  const features = [];
  for (let row = 0; row < positions.length; row++) {
    const i = positions[row];
    const h3 = grid.cells[i];
    const [lat, lon] = cellToLatLng(h3);
    let ring;
    if (cartogram.source === 'published') {
      const offsets = cartogram.rings[row];
      ring = [];
      for (let k = 0; k < offsets.length; k += 2) {
        ring.push([lon + offsets[k] * unit, lat + offsets[k + 1] * unit]);
      }
      ring.push(ring[0]);
    } else {
      const scale =
        reference > 0 ? Math.sqrt(Math.min(Math.max(pop[i] || 0, 0) / reference, 1)) : 1;
      ring = closedRing(cellToBoundary(h3)).map(([x, y]) => [
        lon + (x - lon) * scale,
        lat + (y - lat) * scale,
      ]);
    }
    features.push({
      type: 'Feature',
      properties: { i },
      geometry: { type: 'Polygon', coordinates: [ring] },
    });
  }
  return { type: 'FeatureCollection', features };
}
