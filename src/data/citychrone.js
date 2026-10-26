// CityChrone: hourly public-transport scores and isochrones on the H3 grid.
//
// Each published hour carries two per-cell scores (see the platform paper,
// doi:10.1098/rsos.190979): the *velocity score*, how fast public transport
// moves you outward from a cell (a km/h-like figure), and the *sociality
// score*, a weighted count of the people reachable — a score, not a
// headcount. The travel times behind the isochrone view are whole minutes;
// the viewer shows everything over two hours as one class (src/data/times.js).
//
// Views the city layer offers. `state` names the feature-state key the paint
// expression reads — hourly values are joined at runtime, never baked into
// the mesh.

export const CITYCHRONE_VIEWS = [
  { key: 'velocity', state: 'v' },
  { key: 'sociality', state: 's' },
  { key: 'isochrone', state: 't' },
];

export const DEFAULT_HOUR = 8;

// Band edges chosen against the published Milan distributions (v_score
// 0.6–8.3 across the day, s_score up to ~650k); the last band is open-ended.
// Bands are presentation — the tooltips quote the exact values.
export const CITYCHRONE_BANDS = {
  velocity: [1, 2, 3, 4, 5, 6, 7, 8, 10],
  sociality: [50e3, 150e3, 250e3, 300e3, 350e3, 400e3, 450e3, 550e3, 700e3],
  isochrone: [10, 20, 30, 45, 60, 75, 90, 120, 180],
};

// The resident percentiles a fitted scale spans: from the 5th, so a few
// cells with next to nothing do not wash the city out, to the 99th, so the
// best served places keep colours of their own.
export const RESIDENT_DOMAIN = [0.05, 0.99];

/**
 * The 5th and 99th percentile of `values`, each weighted by its residents:
 * the range a city view fits a scale to, so the colours span where people
 * live rather than the many thinly settled outer cells. A value with no
 * residents counts for nothing; with no weights at all every value counts
 * once. Null when nothing is left.
 */
export function residentDomain(values, weights) {
  const pairs = [];
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const weight = weights ? weights[i] : 1;
    if (!Number.isFinite(value) || !(weight > 0)) continue;
    pairs.push([value, weight]);
    total += weight;
  }
  if (!pairs.length) return null;
  pairs.sort((a, b) => a[0] - b[0]);
  const at = (q) => {
    let acc = 0;
    for (const [value, weight] of pairs) {
      acc += weight;
      if (acc >= q * total) return value;
    }
    return pairs[pairs.length - 1][0];
  };
  return [at(RESIDENT_DOMAIN[0]), at(RESIDENT_DOMAIN[1])];
}

/**
 * The city's own range of sociality scores: `residentDomain` over every
 * published hour together, so moving the hour never recolours a value.
 * `hours` is the layer file's `hourly.s` (one array per hour) or a single
 * hour's values; `population` the layer's residents per row.
 */
export function socialityDomain(hours, population) {
  const values = [];
  const weights = population ? [] : null;
  for (const hour of hours) {
    for (let row = 0; row < hour.length; row++) {
      values.push(hour[row]);
      if (weights) weights.push(population[row]);
    }
  }
  return residentDomain(values, weights);
}

/** Share of cells per band for one hour's values. */
export function summariseCitychrone(values, bands) {
  const counts = new Array(bands.length).fill(0);
  let total = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    total++;
    let band = bands.findIndex((edge) => value <= edge);
    if (band < 0) band = bands.length - 1;
    counts[band]++;
  }
  return {
    shares: total ? counts.map((c) => Math.round((c / total) * 1000) / 10) : counts.map(() => 0),
    total,
  };
}
