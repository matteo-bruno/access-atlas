// ─────────────────────────────────────────────────────────────────────────
// Published datasets → the shapes the UI already consumes.
//
// `buildCityMesh` (src/data/mesh.js) defines the contract the city page reads:
// { geojson, stats, scatter, thresholds }. These adapters produce the same
// contract from real files, so swapping seed data for measurements is a change
// of source, not a change of component.
// ─────────────────────────────────────────────────────────────────────────

// The four P.O.V. zones, in the order src/data/platforms.js declares them.
// Upstream files spell the class out; the UI indexes into ZONES.
const ZONE_BY_CELL_TYPE = {
  inclusion: 0,
  'spatial isolation': 1,
  'social isolation': 2,
  'total isolation': 3,
};

const SCATTER_SAMPLE = 520;

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function median(values) {
  return quantile([...values].sort((a, b) => a - b), 0.5);
}

function zoneIndex(properties) {
  if (Number.isFinite(properties.zone)) return properties.zone;
  const cell = properties.cell_type ?? properties.cellType;
  if (typeof cell === 'string') {
    const index = ZONE_BY_CELL_TYPE[cell.trim().toLowerCase()];
    if (Number.isFinite(index)) return index;
  }
  return null;
}

// The scatter plot draws in a unit square, but the published axes are weighted
// POI counts on their own scales. Normalising min→max keeps the plot's shape
// and lets the city medians land as the quadrant thresholds.
function normaliser(values) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return () => 0.5;
  return (v) => (Number.isFinite(v) ? (v - min) / (max - min) : 0);
}

export class AdapterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AdapterError';
  }
}

/**
 * A published P.O.V. cartogram → the city-page mesh contract.
 *
 * Expected properties per feature: `proximity`, `opportunity`, and either
 * `cell_type` (the upstream spelling) or a numeric `zone`. `population`,
 * `proximity_median_city` and `opportunity_median_city` are used when present.
 *
 * @param {object} collection  GeoJSON FeatureCollection
 * @param {object} [profile]   catalogue entry, for mesh metadata the file lacks
 */
export function meshFromPublished(collection, profile = {}) {
  const input = collection?.features;
  if (!Array.isArray(input) || input.length === 0) {
    throw new AdapterError('Published mesh has no features');
  }

  const proximities = [];
  const opportunities = [];
  const rows = [];

  for (const feature of input) {
    const p = feature?.properties ?? {};
    const zone = zoneIndex(p);
    // A cell we cannot classify would silently distort every share below.
    if (zone == null) throw new AdapterError('Feature is missing `cell_type`/`zone`');
    const proximity = Number(p.proximity);
    const opportunity = Number(p.opportunity);
    proximities.push(proximity);
    opportunities.push(opportunity);
    rows.push({ feature, zone, proximity, opportunity, population: Number(p.population) || 0 });
  }

  const normProx = normaliser(proximities);
  const normOpp = normaliser(opportunities);

  const counts = [0, 0, 0, 0];
  const features = new Array(rows.length);

  rows.forEach((row, i) => {
    counts[row.zone] = (counts[row.zone] ?? 0) + 1;
    const source = row.feature;
    features[i] = {
      type: 'Feature',
      // The city page filters the highlight layer on the feature id, so it has
      // to be the array index the scatter points also carry.
      id: i,
      geometry: source.geometry,
      properties: {
        ...source.properties,
        zone: row.zone,
        proximity: row.proximity,
        opportunity: row.opportunity,
      },
    };
  });

  const total = rows.length;
  const firstProps = input[0].properties ?? {};
  const proximityMedian = Number.isFinite(firstProps.proximity_median_city)
    ? firstProps.proximity_median_city
    : median(proximities);
  const opportunityMedian = Number.isFinite(firstProps.opportunity_median_city)
    ? firstProps.opportunity_median_city
    : median(opportunities);

  const stats = {
    cellCount: total,
    // Cartogram polygons are population-scaled, so their geometry cannot state
    // the real cell size — it comes from the catalogue or stays unknown.
    cellRadiusM: profile.cell?.cellRadiusM ?? null,
    h3Resolution: profile.cell?.h3Resolution ?? null,
    zoneShares: counts.map((n) => Math.round((n / total) * 1000) / 10),
    zoneCounts: counts,
    medianProximity: Math.round(proximityMedian * 10) / 10,
    medianOpportunity: Math.round(opportunityMedian * 10) / 10,
    population: rows.reduce((sum, row) => sum + row.population, 0) || null,
    // The seed mesh reports walking distance and jobs; the published P.O.V.
    // files carry weighted POI counts instead, so these have no value here.
    medianWalkMetres: null,
    medianJobsK: null,
  };

  const stride = Math.max(1, Math.floor(total / SCATTER_SAMPLE));
  const scatter = [];
  for (let i = 0; i < total; i += stride) {
    const row = rows[i];
    scatter.push({
      i,
      x: Math.round(normOpp(row.opportunity) * 1000) / 1000,
      y: Math.round(normProx(row.proximity) * 1000) / 1000,
      z: row.zone,
    });
  }

  return {
    geojson: { type: 'FeatureCollection', features },
    stats,
    scatter,
    thresholds: { proximity: normProx(proximityMedian), opportunity: normOpp(opportunityMedian) },
  };
}

/**
 * A published Car Dependency cartogram → the same city-page contract.
 *
 * The index is continuous in [−1, +1]; `stops` (from src/data/platforms.js)
 * cuts it into the four bands the legend names, so one panel component serves
 * both platforms — `zone` is a band here and a class there.
 *
 * Expected properties: `cdi`, `o_score_pt`, `o_score_car`, `population`.
 */
export function meshFromPublishedCdi(collection, profile = {}, stops = [-0.1, 0.1, 0.3, 1]) {
  const input = collection?.features;
  if (!Array.isArray(input) || input.length === 0) {
    throw new AdapterError('Published mesh has no features');
  }

  const band = (value) => {
    for (let i = 0; i < stops.length; i++) if (value <= stops[i]) return i;
    return stops.length - 1;
  };

  const rows = input.map((feature) => {
    const p = feature?.properties ?? {};
    const cdi = Number(p.cdi);
    if (!Number.isFinite(cdi)) throw new AdapterError('Feature is missing `cdi`');
    return {
      feature,
      cdi,
      pt: Number(p.o_score_pt),
      car: Number(p.o_score_car),
      population: Number(p.population) || 0,
    };
  });

  // Both axes share one normaliser so the y = x diagonal — the line where a
  // car and public transport reach the same amount — stays meaningful.
  const both = rows.flatMap((row) => [row.pt, row.car]);
  const norm = normaliser(both);

  const counts = [0, 0, 0, 0];
  const features = rows.map((row, i) => {
    const zone = band(row.cdi);
    counts[zone] = (counts[zone] ?? 0) + 1;
    return {
      type: 'Feature',
      id: i,
      geometry: row.feature.geometry,
      properties: { ...row.feature.properties, zone, cdi: row.cdi },
    };
  });

  const total = rows.length;
  const population = rows.reduce((sum, row) => sum + row.population, 0);
  const stride = Math.max(1, Math.floor(total / SCATTER_SAMPLE));
  const scatter = [];
  for (let i = 0; i < total; i += stride) {
    const row = rows[i];
    scatter.push({
      i,
      x: Math.round(norm(row.car) * 1000) / 1000,
      y: Math.round(norm(row.pt) * 1000) / 1000,
      z: features[i].properties.zone,
    });
  }

  return {
    geojson: { type: 'FeatureCollection', features },
    stats: {
      cellCount: total,
      cellRadiusM: profile.cell?.cellRadiusM ?? null,
      h3Resolution: profile.cell?.h3Resolution ?? null,
      zoneShares: counts.map((n) => Math.round((n / total) * 1000) / 10),
      zoneCounts: counts,
      medianCdi: Math.round(median(rows.map((r) => r.cdi)) * 1000) / 1000,
      // The index for the average resident, not the average cell.
      weightedCdi: population
        ? Math.round((rows.reduce((s, r) => s + r.cdi * r.population, 0) / population) * 1000) / 1000
        : null,
      population: population || null,
      medianWalkMetres: null,
      medianJobsK: null,
    },
    scatter,
    // No quadrants: the reference for this platform is the diagonal.
    thresholds: null,
  };
}

/**
 * A published 15minCity mesh. Unlike the other two platforms nothing is
 * classified here: the page picks a category, a mode and a view at runtime and
 * colours the cells straight from the matching property, so the adapter's job
 * is to hand back the collection and the figures that do not depend on that
 * choice.
 */
export function meshFromPublishedFifteen(collection, profile = {}) {
  const features = collection?.features;
  if (!Array.isArray(features) || features.length === 0) {
    throw new AdapterError('Published mesh has no features');
  }

  // Harmonised exports carry `population`; the legacy files wrote `pop`.
  const population = features.reduce(
    (sum, f) => sum + (Number(f.properties?.population ?? f.properties?.pop) || 0),
    0,
  );

  return {
    geojson: collection,
    stats: {
      cellCount: features.length,
      cellRadiusM: profile.cell?.cellRadiusM ?? null,
      h3Resolution: profile.cell?.h3Resolution ?? null,
      population: population || null,
    },
    // No zones, no scatter — this platform measures a time, not a class.
    zoneShares: null,
    scatter: null,
    thresholds: null,
  };
}

/**
 * Median and band shares for one 15minCity measure. Recomputed in the page
 * whenever the category, mode or view changes — 12k cells is well inside a
 * frame, so there is no reason to precompute all forty combinations.
 */
export function summariseMeasure(collection, key, bands) {
  const values = [];
  const counts = new Array(bands.length).fill(0);

  for (const feature of collection.features ?? []) {
    const value = Number(feature.properties?.[key]);
    if (!Number.isFinite(value)) continue;
    values.push(value);
    let band = bands.findIndex((edge) => value <= edge);
    if (band < 0) band = bands.length - 1;
    counts[band]++;
  }

  if (!values.length) return { median: null, shares: counts.map(() => 0), total: 0 };

  values.sort((a, b) => a - b);
  const total = values.length;
  return {
    median: Math.round(values[Math.floor(total / 2)] * 10) / 10,
    shares: counts.map((n) => Math.round((n / total) * 1000) / 10),
    total,
  };
}

/**
 * A published coverage file → the city objects the search and landing maps use.
 * Property names match what `citiesToGeoJSON` emits for the seed list, so the
 * two are interchangeable downstream.
 */
export function citiesFromPublished(collection) {
  const features = collection?.features;
  if (!Array.isArray(features)) throw new AdapterError('Coverage is not a FeatureCollection');

  return features
    .map((feature) => {
      const p = feature?.properties ?? {};
      const coords = feature?.geometry?.coordinates;
      const id = p.id ?? feature.id;
      if (typeof id !== 'string' || !Array.isArray(coords) || coords.length < 2) return null;

      return {
        id,
        name: typeof p.name === 'string' ? p.name : id,
        lon: Number(coords[0]),
        lat: Number(coords[1]),
        country: typeof p.country === 'string' ? p.country : '',
        isStudy: p.isStudy !== false,
        proximityMinutes: Number.isFinite(p.proximityMinutes) ? p.proximityMinutes : null,
        velocityScore: Number.isFinite(p.velocityScore) ? p.velocityScore : null,
        cdi: Number.isFinite(p.cdi) ? p.cdi : null,
        zone: Number.isFinite(p.zone) ? p.zone : null,
      };
    })
    .filter((city) => city && Number.isFinite(city.lon) && Number.isFinite(city.lat));
}
