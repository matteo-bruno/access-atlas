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

/**
 * Refuse a layer written against another grid.
 *
 * A layer's rows are only grid positions, so a layer file paired with any
 * other grid still decodes and still draws — every value on someone else's
 * cell. The importer stamps the grid's id on each layer it writes; files
 * from before the stamp carry none and are let through.
 */
export function checkGrid(grid, file, layer) {
  if (file?.grid && grid?.id && file.grid !== grid.id) {
    throw new Error(`${layer ?? file.layer}: written against grid ${file.grid}, but the city's grid is ${grid.id}`);
  }
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

/**
 * The property a scenario's value is merged under: `metro-d:cdi`. The
 * baseline keeps the plain name, so every paint expression written for a
 * layer reads the baseline, and the scenario, or the difference, is the same
 * expression on another key.
 */
export const scenarioKey = (scenario, name) => (scenario ? `${scenario}:${name}` : name);

/**
 * A function that builds a feature's properties in one object literal: the
 * keys it already has, then the layer's. One builder per set of keys, made
 * once.
 *
 * Why not copy the object and add the layer's values one by one: an object
 * grown past a couple of dozen properties that way drops into V8's slow
 * dictionary mode, and on a metro area of 120,000 cells that was a second of
 * the page's load in the merge alone, and more again in everything that read
 * the features afterwards (the summary, the map's copy of them). An object
 * literal keeps its fast shape: 50 ms for the same merge.
 */
const builders = new Map();
function builderFor(baseKeys, addKeys) {
  const signature = `${baseKeys.join('\u0000')}\u0001${addKeys.join('\u0000')}`;
  let build = builders.get(signature);
  if (build) return build;
  const own = new Set(addKeys);
  const kept = baseKeys.filter((k) => !own.has(k));
  try {
    // Keys are written as JSON strings, so no key can be read as code.
    const body = [
      ...kept.map((k) => `${JSON.stringify(k)}: b[${JSON.stringify(k)}]`),
      ...addKeys.map((k, i) => `${JSON.stringify(k)}: v[${i}]`),
    ].join(',');
    // eslint-disable-next-line no-new-func
    build = new Function('b', 'v', `return {${body}};`);
  } catch {
    // A page whose content security policy forbids it: the slow way, same result.
    build = (b, v) => {
      const out = {};
      for (const k of kept) out[k] = b[k];
      addKeys.forEach((k, i) => {
        out[k] = v[i];
      });
      return out;
    };
  }
  builders.set(signature, build);
  return build;
}

/**
 * Put a layer's values on the features that carry them; with `scenario`, a
 * scenario's values, under `scenarioKey` names.
 *
 * Returns a new array; features the layer touches are new objects, so a
 * consumer holding the previous array sees the change. A cell gets a key
 * only where it has a value, so `['has', key]` in a paint expression still
 * means "this cell carries the measure".
 */
export function mergeLayer(features, layer, file, { scenario = null } = {}) {
  const positions = layerPositions(file);
  const names = PROPERTIES[layer] ?? [];
  const columns = names.map((name) => file.fields[name]);
  const keys = names.map((name) => scenarioKey(scenario, name));
  const fifteen = layer === 'fifteen';
  const averageKeys = fifteen ? FIFTEEN_MODES.map((mode) => scenarioKey(scenario, `proximity_time_${mode}`)) : [];
  const averageFallback = fifteen ? FIFTEEN_MODES.map((mode) => file.fields[`proximity_time_${mode}`]) : [];
  const categoryAt = fifteen
    ? FIFTEEN_MODES.map((mode) => FIFTEEN_CATEGORIES.map((c) => names.indexOf(`${c}_${mode}`)))
    : [];
  const withCc = layer === 'citychrone' && !scenario;

  const out = features.slice();
  // The keys a cell gets, and the builder for them, change only when the
  // cell's existing keys or its missing values do: a handful of shapes.
  let lastBase = null;
  let lastMask = -1;
  let lastBaseSig = '';
  let build = null;
  const present = [];
  const values = [];
  for (let row = 0; row < positions.length; row++) {
    const at = positions[row];
    const feature = out[at];
    if (!feature) throw new Error(`${layer}: row ${row} points at grid position ${at}`);
    const base = feature.properties;

    present.length = 0;
    values.length = 0;
    let mask = 0;
    for (let k = 0; k < names.length; k++) {
      const value = columns[k]?.[row];
      if (value != null) {
        present.push(keys[k]);
        values.push(value);
        mask |= 1 << (k % 30);
      }
    }
    for (let m = 0; m < averageKeys.length; m++) {
      // 15minCity's average over the nine categories, exactly as the importer rounds it.
      let sum = 0;
      let count = 0;
      for (const k of categoryAt[m]) {
        const v = columns[k]?.[row];
        if (Number.isFinite(v) && v !== UNREACHABLE) {
          sum += v;
          count++;
        }
      }
      const value = count ? Math.round((sum / count) * 10) / 10 : averageFallback[m]?.[row] ?? null;
      if (value != null) {
        present.push(averageKeys[m]);
        values.push(value);
        mask |= 1 << (30 - m);
      }
    }
    if (withCc) {
      present.push('cc');
      values.push(row);
    }

    const baseKeys = Object.keys(base);
    const baseSig = baseKeys.length === (lastBase?.length ?? -1) && baseKeys.every((k, i) => k === lastBase[i]) ? lastBaseSig : baseKeys.join('\u0000');
    if (!build || mask !== lastMask || baseSig !== lastBaseSig) {
      build = builderFor(baseKeys, present.slice());
      lastMask = mask;
      lastBaseSig = baseSig;
    }
    lastBase = baseKeys;
    out[at] = { type: 'Feature', id: feature.id, geometry: feature.geometry, properties: build(base, values) };
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
 * The Atlas derives every layer's: the cell's own hexagon scaled so its area
 * is proportional to the cell's population (the grid's, shared by every
 * layer, so a cell is the same size whichever layer draws it), full size at
 * `reference`.
 */
export async function layerCartogram(grid, file) {
  checkGrid(grid, file);
  const { cellToBoundary, cellToLatLng } = await loadH3();
  const positions = layerPositions(file);
  const reference = file.cartogram?.reference;
  const pop = grid.population;

  const features = [];
  for (let row = 0; row < positions.length; row++) {
    const i = positions[row];
    const h3 = grid.cells[i];
    const [lat, lon] = cellToLatLng(h3);
    const scale = reference > 0 ? Math.sqrt(Math.min(Math.max(pop[i] || 0, 0) / reference, 1)) : 1;
    const ring = closedRing(cellToBoundary(h3)).map(([x, y]) => [lon + (x - lon) * scale, lat + (y - lat) * scale]);
    features.push({
      type: 'Feature',
      properties: { i },
      geometry: { type: 'Polygon', coordinates: [ring] },
    });
  }
  return { type: 'FeatureCollection', features };
}
