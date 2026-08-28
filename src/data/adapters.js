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
 * Re-draw a mesh on the other geometry published for the same cells.
 *
 * A companion file carries one polygon per cell and states the row it belongs
 * to, so the values are never re-read and never re-matched by position. Cells
 * the companion omits are dropped: a cartogram covers only the cells its own
 * platform measures, and drawing the rest on their hexagons would mix two
 * geometries in one picture.
 *
 * @param {object} collection  the mesh being drawn, values and all
 * @param {object} companion   FeatureCollection of `{ properties: { i } }`
 */
export function withGeometry(collection, companion) {
  const source = collection?.features;
  const rows = companion?.features;
  if (!Array.isArray(source) || !Array.isArray(rows) || rows.length === 0) {
    throw new AdapterError('Geometry companion has no features');
  }

  return {
    type: 'FeatureCollection',
    features: rows.map((row) => {
      const i = row?.properties?.i;
      if (!Number.isInteger(i) || i < 0 || i >= source.length) {
        throw new AdapterError(`Geometry companion points at row ${i}`);
      }
      if (!row.geometry) throw new AdapterError(`Geometry companion row ${i} has no geometry`);
      // Keep the feature's id: the page filters its highlight layer on it and
      // applies feature-state by it, and neither should notice the swap.
      return { ...source[i], geometry: row.geometry };
    }),
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
 * A combined-viewer union mesh → what /atlas/:cityId renders.
 *
 * One FeatureCollection on the standard H3 grid, every platform's values on
 * the same cells; a cell simply lacks the properties of platforms whose mask
 * it falls outside. Nothing is classified here — the page picks a layer at
 * runtime and colours straight from the matching properties — but the
 * per-layer figures that do not depend on that choice are computed once:
 * which cells each layer covers, and the shares/medians its legend quotes.
 *
 * Expected properties per feature: `h3`, `population`, and per layer
 *   pov      `zone` (0–3), `proximity`, `opportunity`
 *   cardep   `cdi`, `o_score_pt`, `o_score_car`
 *   fifteen  `<category>_<mode>` in minutes (summarised at runtime)
 *   citychrone `cc` — row index into the hourly hexcover/times files
 */
export function meshFromAtlas(collection, profile = {}, cdiStops = [-0.1, 0.1, 0.3, 1]) {
  const features = collection?.features;
  if (!Array.isArray(features) || features.length === 0) {
    throw new AdapterError('Atlas mesh has no features');
  }

  const cdiBand = (value) => {
    for (let i = 0; i < cdiStops.length; i++) if (value <= cdiStops[i]) return i;
    return cdiStops.length - 1;
  };

  const zoneCounts = [0, 0, 0, 0];
  const cdiCounts = [0, 0, 0, 0];
  const cdiValues = [];
  let cdiPopulation = 0;
  let cdiWeightedSum = 0;
  let povCells = 0;
  let cardepCells = 0;
  let fifteenCells = 0;
  let citychroneCells = 0;
  let population = 0;
  const ccToId = new Map();

  const withIds = features.map((feature, i) => {
    const p = feature?.properties ?? {};
    const pop = Number(p.population) || 0;
    population += pop;

    if (Number.isFinite(p.zone)) {
      if (p.zone < 0 || p.zone > 3) throw new AdapterError(`Cell ${i} has zone ${p.zone}`);
      zoneCounts[p.zone]++;
      povCells++;
    }
    if (Number.isFinite(p.cdi)) {
      if (p.cdi < -1 || p.cdi > 1) throw new AdapterError(`Cell ${i} has CDI ${p.cdi}`);
      cdiCounts[cdiBand(p.cdi)]++;
      cdiValues.push(p.cdi);
      cdiPopulation += pop;
      cdiWeightedSum += p.cdi * pop;
      cardepCells++;
    }
    if (Number.isFinite(p.proximity_time_foot)) fifteenCells++;
    if (Number.isFinite(p.cc)) {
      ccToId.set(p.cc, i);
      citychroneCells++;
    }

    // The page filters highlights and applies feature-state by feature id, so
    // it has to be the array index.
    return feature.id === i ? feature : { ...feature, id: i };
  });

  const share = (counts, total) =>
    total ? counts.map((c) => Math.round((c / total) * 1000) / 10) : null;

  return {
    geojson: { type: 'FeatureCollection', features: withIds },
    stats: {
      cellCount: features.length,
      cellRadiusM: profile.cell?.cellRadiusM ?? null,
      h3Resolution: profile.cell?.h3Resolution ?? null,
      population: population || null,
    },
    layers: {
      pov: {
        cells: povCells,
        zoneShares: share(zoneCounts, povCells),
        zoneCounts,
      },
      cardep: {
        cells: cardepCells,
        zoneShares: share(cdiCounts, cardepCells),
        zoneCounts: cdiCounts,
        medianCdi: cdiValues.length ? Math.round(median(cdiValues) * 1000) / 1000 : null,
        weightedCdi: cdiPopulation
          ? Math.round((cdiWeightedSum / cdiPopulation) * 1000) / 1000
          : null,
      },
      fifteen: { cells: fifteenCells },
      citychrone: { cells: citychroneCells, ccToId },
    },
  };
}

/**
 * One hour of a CityChrone hexcover → the values keyed the way the atlas mesh
 * references them (`cc`), plus the population-weighted median the summary
 * quotes. Works both against the union mesh (joined via feature-state) and
 * standalone, when the hexcover itself is the drawn mesh.
 */
export function citychroneHour(collection) {
  const features = collection?.features;
  if (!Array.isArray(features) || features.length === 0) {
    throw new AdapterError('Hexcover has no features');
  }

  const byCc = new Map();
  const vValues = [];
  const weights = [];
  for (const feature of features) {
    const p = feature?.properties ?? {};
    if (!Number.isFinite(p.new_id)) throw new AdapterError('Hexcover feature has no new_id');
    const v = Number(p.v_score);
    const s = Number(p.s_score);
    byCc.set(p.new_id, { v, s });
    vValues.push(v);
    weights.push(Number(p.pop) || 0);
  }

  let acc = 0;
  const pairs = vValues.map((v, i) => [v, weights[i]]).sort((a, b) => a[0] - b[0]);
  const totalWeight = pairs.reduce((s, [, w]) => s + w, 0);
  let weightedMedianV = pairs[pairs.length - 1]?.[0] ?? null;
  for (const [v, w] of pairs) {
    acc += w;
    if (acc >= totalWeight / 2) {
      weightedMedianV = v;
      break;
    }
  }

  return {
    byCc,
    cells: features.length,
    medianV: Math.round(median(vValues) * 100) / 100,
    weightedMedianV: Math.round(weightedMedianV * 100) / 100,
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
