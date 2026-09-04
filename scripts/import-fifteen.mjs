#!/usr/bin/env node
// Import 15minCity cities from `input_data/15mincity/*.geojson` into the
// Atlas, one file per city, with all the compressions the published files
// benefit from applied on the way through.
//
// The published files sit at `public/data/fifteen/<city>.geojson`, joined by
// a companion cartogram `public/data/fifteen/<city>.cartogram.geojson`. The
// catalogue in `public/data/index.json` picks them up under
// `platforms.fifteen.cities`, and the coverage layer's marker for each city
// goes into `public/data/fifteen/coverage.geojson`.
//
// Usage:
//   npm run import:fifteen
//   npm run import:fifteen -- --src input_data/15mincity --out public/data/fifteen
//   npm run import:fifteen -- --dry-run                    # write nothing
//   npm run import:fifteen -- --only acilia,rome           # subset by slug
//
// What the script does per file:
//   1. Rounds every coordinate to 5 decimal places  (~1.1 m at Rome latitude,
//      more than enough for a ~200 m hex — the source had 15 dp of noise).
//   2. Rounds every travel-time value to 1 decimal   (the ramp is in minutes,
//      sub-second precision is noise).
//   3. Drops pipeline debris: `snapped_id`, `closest_waypoint`, `internal_id`,
//      `component`. Nothing in the app reads these.
//   4. Keeps `centroid_lon/lat`, `radius`, `population` — small overhead,
//      and useful for future re-processing (build-atlas.mjs needs them if
//      the file is later folded into an H3 union mesh).
//   5. Keeps `99999` "unreachable" sentinels — the ramp handles the tail.
//   6. Recomputes `proximity_time_foot` and `proximity_time_bicycle` as the
//      arithmetic mean of the nine category values in minutes (skipping
//      99999 sentinels). Some source exports store these fields in seconds,
//      or as a sum — the app's ramp expects a minutes-scale average.
//   7. Derives a population-scaled cartogram companion:
//      each cell keeps its centre, its area proportional to residents,
//      reaching the full hexagon at the city's median cell population
//      (this is the rule build-atlas.mjs already uses for Milan).
//   8. Writes both files to `public/data/fifteen/`.
//   9. Updates the catalogue entry in `public/data/index.json` and the
//      coverage-marker feature in `public/data/fifteen/coverage.geojson`.
//
// Idempotent. Rerunning the script on the same source overwrites the
// published city cleanly; existing cities the source does not name are
// left alone.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

// ── arg parsing ──────────────────────────────────────────────────────
function arg(name, fallback) {
  const flag = `--${name}`;
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return fallback;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const SRC_DIR = path.resolve(ROOT, arg('src', 'input_data/15mincity'));
const OUT_DIR = path.resolve(ROOT, arg('out', 'public/data/fifteen'));
const CATALOGUE = path.resolve(ROOT, arg('catalogue', 'public/data/index.json'));
const DRY_RUN = flag('dry-run');
const ONLY = (arg('only') ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Where this batch of cities is. The source files say nothing about it, and
// the UI shows both — the city header prints `region`, the search result
// prints `country` — so they are stated once per run rather than left blank.
// `--region` accepts the English name and `--region-it` its Italian; a city
// that needs different copy is a hand edit to the catalogue afterwards, which
// a later rerun preserves.
const COUNTRY = arg('country', 'IT');
const REGION = arg('region', 'Italy');
const REGION_IT = arg('region-it', 'Italia');

// ── constants ────────────────────────────────────────────────────────
const COORD_DECIMALS = 5;
const VALUE_DECIMALS = 1;
const CATEGORIES = [
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
const MODES = ['foot', 'bicycle'];
const UNREACHABLE = 99999;
const PROP_DROP = new Set(['snapped_id', 'closest_waypoint', 'internal_id', 'component']);

// ── helpers ──────────────────────────────────────────────────────────
const r = (n, d) => {
  if (!Number.isFinite(n)) return n;
  const m = 10 ** d;
  return Math.round(n * m) / m;
};
const rCoord = (n) => r(n, COORD_DECIMALS);
const rVal = (n) => r(n, VALUE_DECIMALS);

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function walkCoords(coords, fn) {
  if (typeof coords[0] === 'number') return fn(coords);
  return coords.map((c) => walkCoords(c, fn));
}

function roundGeometry(geometry) {
  if (!geometry?.coordinates) return geometry;
  return {
    ...geometry,
    coordinates: walkCoords(geometry.coordinates, ([lon, lat, ...rest]) =>
      rest.length ? [rCoord(lon), rCoord(lat), ...rest] : [rCoord(lon), rCoord(lat)],
    ),
  };
}

function polygonCentroid(geometry) {
  // Not area-weighted — the centroid we want is "where is this cell", and for
  // a small hex the geometric mean of the vertices is that within a metre. If
  // the cell has centroid_lon/lat, prefer those (author's own centre).
  let lonSum = 0;
  let latSum = 0;
  let count = 0;
  walkCoords(geometry.coordinates, ([lon, lat]) => {
    lonSum += lon;
    latSum += lat;
    count++;
  });
  return count ? [lonSum / count, latSum / count] : null;
}

function polygonArea(geometry) {
  // Shoelace on lon/lat — good enough for a *relative* size at one city, which
  // is what the cartogram compares against. Returns the sum across sub-rings.
  const rings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.type === 'MultiPolygon' ? geometry.coordinates.map((p) => p[0]) : [];
  let total = 0;
  for (const ring of rings) {
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      a += x1 * y2 - x2 * y1;
    }
    total += Math.abs(a) / 2;
  }
  return total;
}

function scaleRing(ring, factor, centre) {
  const [cx, cy] = centre;
  return ring.map(([x, y]) => [rCoord(cx + (x - cx) * factor), rCoord(cy + (y - cy) * factor)]);
}

function scaleGeometry(geometry, factor, centre) {
  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates.map((ring) => scaleRing(ring, factor, centre)),
    };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map((poly) =>
        poly.map((ring) => scaleRing(ring, factor, centre)),
      ),
    };
  }
  return geometry;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function weightedMedian(values, weights) {
  const paired = values
    .map((v, i) => [v, Math.max(0, Number(weights[i]) || 0)])
    .filter(([v]) => Number.isFinite(v))
    .sort((a, b) => a[0] - b[0]);
  const totalW = paired.reduce((s, [, w]) => s + w, 0);
  if (!totalW) return null;
  let cum = 0;
  for (const [v, w] of paired) {
    cum += w;
    if (cum >= totalW / 2) return v;
  }
  return paired[paired.length - 1][0];
}

// A conservative fit zoom for the bbox — enough margin that the panel's own
// width does not crop the city. Matches the spirit of scripts/build-atlas.mjs.
function zoomForBBox([west, south, east, north]) {
  const spanLon = Math.max(east - west, 1e-6);
  const spanLat = Math.max(north - south, 1e-6);
  const span = Math.max(spanLon, spanLat / Math.cos(((south + north) / 2) * (Math.PI / 180)));
  // World spans 360° at zoom 0; each zoom halves the span. Back off by 1.5
  // zooms to leave paper around the mesh.
  const worldSpan = 360;
  return Math.max(0, Math.log2(worldSpan / span) - 1.5);
}

// Radius of the hexagon at the median cell population, in coordinate units.
// Uses "circle-of-equal-area" so cells with lots of residents fill their hex.
function cartogramFactor(population, referencePop) {
  if (!Number.isFinite(population) || population <= 0) return 0;
  if (!Number.isFinite(referencePop) || referencePop <= 0) return 1;
  return Math.min(1, Math.sqrt(population / referencePop));
}

// ── per-file processing ──────────────────────────────────────────────
function processCity(srcPath) {
  const raw = fs.readFileSync(srcPath, 'utf8');
  const collection = JSON.parse(raw);
  if (collection.type !== 'FeatureCollection') {
    throw new Error(`${srcPath}: not a FeatureCollection`);
  }

  const cityId = slugify(path.basename(srcPath, path.extname(srcPath)));
  const cityName = titleCase(cityId);

  let population = 0;
  const radii = [];
  const centres = [];
  const walkTimes = [];
  const walkWeights = [];
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;

  const outFeatures = collection.features.map((feature, i) => {
    const src = feature?.properties ?? {};
    const geometry = roundGeometry(feature.geometry);

    // Prefer the author's stated centre, fall back to the polygon's own.
    const centre =
      Number.isFinite(Number(src.centroid_lon)) && Number.isFinite(Number(src.centroid_lat))
        ? [Number(src.centroid_lon), Number(src.centroid_lat)]
        : polygonCentroid(geometry);
    if (centre) centres.push(centre);
    const pop = Math.round(Number(src.population) || 0);
    population += pop;

    if (Number.isFinite(Number(src.radius))) radii.push(Number(src.radius));

    // Track bbox from the *rounded* geometry, so the value stored matches
    // what the file will report.
    walkCoords(geometry.coordinates, ([lon, lat]) => {
      if (lon < west) west = lon;
      if (lon > east) east = lon;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    });

    const props = {
      id: Number.isFinite(Number(src.id)) ? Number(src.id) : i,
      pop,
    };
    if (centre) {
      props.centroid_lon = rCoord(centre[0]);
      props.centroid_lat = rCoord(centre[1]);
    }
    if (Number.isFinite(Number(src.radius))) props.radius = r(Number(src.radius), 2);

    // Per-category values, in minutes. 99999 sentinels are preserved so the
    // ramp's tail still paints them; the mean below skips them.
    for (const cat of CATEGORIES) {
      for (const mode of MODES) {
        const key = `${cat}_${mode}`;
        const v = Number(src[key]);
        if (!Number.isFinite(v)) continue;
        props[key] = v === UNREACHABLE ? UNREACHABLE : rVal(v);
      }
    }

    // Recompute the mode averages from the individual categories, in minutes.
    // Some source exports store these in seconds; recomputing keeps the
    // published values on the ramp's expected scale.
    for (const mode of MODES) {
      const vals = CATEGORIES.map((c) => Number(props[`${c}_${mode}`])).filter(
        (v) => Number.isFinite(v) && v !== UNREACHABLE,
      );
      if (vals.length) {
        const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
        props[`proximity_time_${mode}`] = rVal(mean);
      } else if (Number.isFinite(Number(src[`proximity_time_${mode}`]))) {
        // No usable categories, keep the source's average as-is.
        props[`proximity_time_${mode}`] = rVal(Number(src[`proximity_time_${mode}`]));
      }
    }

    // The walking-time proxy for the coverage marker below, weighted by pop.
    if (Number.isFinite(props.proximity_time_foot)) {
      walkTimes.push(props.proximity_time_foot);
      walkWeights.push(pop);
    }

    // Any other numeric properties on the source get passed through (rounded
    // conservatively) so we do not silently lose fields the source cared
    // about. Dropped keys are named explicitly.
    for (const [k, v] of Object.entries(src)) {
      if (k in props) continue;
      if (PROP_DROP.has(k)) continue;
      if (k === 'centroid_lon' || k === 'centroid_lat' || k === 'radius') continue;
      if (k === 'id' || k === 'population') continue;
      if (CATEGORIES.some((c) => k === `${c}_foot` || k === `${c}_bicycle`)) continue;
      if (k === 'proximity_time_foot' || k === 'proximity_time_bicycle') continue;
      props[k] = typeof v === 'number' ? rVal(v) : v;
    }

    return {
      type: 'Feature',
      id: i,
      geometry,
      properties: props,
    };
  });

  const bbox = [west, south, east, north];
  const centre = centres.length
    ? [
        centres.reduce((s, c) => s + c[0], 0) / centres.length,
        centres.reduce((s, c) => s + c[1], 0) / centres.length,
      ]
    : [(west + east) / 2, (south + north) / 2];

  // ── cartogram companion ────────────────────────────────────────────
  const populations = outFeatures.map((f) => f.properties.pop);
  const referencePop = median(populations.filter((p) => p > 0));
  const cartFeatures = outFeatures.map((feature) => {
    const p = feature.properties;
    const cellCentre =
      Number.isFinite(p.centroid_lon) && Number.isFinite(p.centroid_lat)
        ? [p.centroid_lon, p.centroid_lat]
        : polygonCentroid(feature.geometry);
    const factor = cartogramFactor(p.pop, referencePop);
    return {
      type: 'Feature',
      properties: { i: feature.id },
      geometry: factor === 0
        ? { type: 'Polygon', coordinates: [] }
        : scaleGeometry(feature.geometry, factor, cellCentre),
    };
  });

  // ── coverage marker + catalogue row ────────────────────────────────
  const proximityMinutes = walkTimes.length
    ? Math.round(weightedMedian(walkTimes, walkWeights) * 10) / 10
    : null;

  const radiusM = radii.length
    ? Math.round(radii.sort((a, b) => a - b)[radii.length >> 1])
    : null;

  return {
    cityId,
    cityName,
    name: cityName,
    country: COUNTRY,
    region: REGION,
    regionIt: REGION_IT,
    population,
    centre: [rCoord(centre[0]), rCoord(centre[1])],
    bbox,
    zoom: Math.round(zoomForBBox(bbox) * 10) / 10,
    cellRadiusM: radiusM,
    proximityMinutes,
    cellCount: outFeatures.length,
    layerCollection: {
      type: 'FeatureCollection',
      bbox: bbox.map((v) => rCoord(v)),
      features: outFeatures,
    },
    cartogramCollection: {
      type: 'FeatureCollection',
      features: cartFeatures,
    },
  };
}

// ── writers ──────────────────────────────────────────────────────────
function writeJSON(target, data) {
  // GeoJSON files are only ever read by machines — minify. `.json` files
  // (the catalogue) are human-readable and reviewed by hand — pretty-print.
  const body = target.endsWith('.geojson')
    ? JSON.stringify(data)
    : `${JSON.stringify(data, null, 2)}\n`;
  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  }
  return body.length;
}

function readJSONIfExists(target) {
  if (!fs.existsSync(target)) return null;
  return JSON.parse(fs.readFileSync(target, 'utf8'));
}

function upsertCoverage(coveragePath, city) {
  const existing = readJSONIfExists(coveragePath) ?? {
    type: 'FeatureCollection',
    features: [],
  };
  const others = existing.features.filter((f) => f?.properties?.id !== city.cityId);
  others.push({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: city.centre },
    properties: {
      id: city.cityId,
      name: city.cityName,
      // The search result prints the country beside the name; without it the
      // row reads as a bare name next to every other city's "Milan · IT".
      country: city.country,
      isStudy: true,
      proximityMinutes: city.proximityMinutes,
      population: city.population,
    },
  });
  writeJSON(coveragePath, { type: 'FeatureCollection', features: others });
  return others.length;
}

function upsertCatalogue(cataloguePath, city) {
  const catalogue = readJSONIfExists(cataloguePath);
  if (!catalogue) throw new Error(`catalogue not found: ${cataloguePath}`);
  const platforms = catalogue.platforms ?? {};
  const fifteen = platforms.fifteen ?? { coverage: 'fifteen/coverage.geojson', cities: [] };

  const row = {
    id: city.cityId,
    name: city.cityName,
    // The city header renders `region` directly, so it must be a string even
    // when the source file says nothing about where the city is — an absent
    // key reaches the page as the literal text "undefined". `--country` names
    // the region for a whole import run; a per-city correction is a hand edit
    // to the catalogue, which a rerun then preserves (see below).
    region: city.region,
    nameIt: city.name,
    regionIt: city.regionIt,
    center: city.centre,
    zoom: city.zoom,
    population: city.population,
    dataset: `fifteen/${city.cityId}.geojson`,
    geometry: 'geographic',
    cartogramDataset: `fifteen/${city.cityId}.cartogram.geojson`,
    cartogramSource: 'derived',
    cell: {
      h3Resolution: null,
      cellRadiusM: city.cellRadiusM,
    },
  };

  const cities = fifteen.cities ?? [];
  const idx = cities.findIndex((c) => c.id === city.cityId);
  // Preserve any editorial overrides the catalogue already has for this city
  // (nameIt, region, regionIt) so a rerun does not clobber hand-written copy.
  if (idx >= 0) {
    const existing = cities[idx];
    for (const k of ['nameIt', 'region', 'regionIt']) {
      if (existing[k] != null) row[k] = existing[k];
    }
    cities[idx] = row;
  } else {
    cities.push(row);
  }

  platforms.fifteen = { ...fifteen, cities };
  catalogue.platforms = platforms;
  writeJSON(cataloguePath, catalogue);
  return cities.length;
}

// ── main ─────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`source directory not found: ${SRC_DIR}`);
    console.error('drop your 15minCity *.geojson files under input_data/15mincity/');
    process.exit(1);
  }

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.toLowerCase().endsWith('.geojson'))
    .filter((f) => !ONLY.length || ONLY.includes(slugify(path.basename(f, path.extname(f)))))
    .sort();

  if (!files.length) {
    console.error(`no *.geojson files found in ${SRC_DIR}`);
    process.exit(1);
  }

  console.log(`importing ${files.length} 15minCity city file${files.length === 1 ? '' : 's'} from ${path.relative(ROOT, SRC_DIR)}${DRY_RUN ? ' (dry run)' : ''}`);

  const stats = [];
  for (const file of files) {
    const srcPath = path.join(SRC_DIR, file);
    try {
      const city = processCity(srcPath);
      const layerPath = path.join(OUT_DIR, `${city.cityId}.geojson`);
      const cartPath = path.join(OUT_DIR, `${city.cityId}.cartogram.geojson`);

      const layerBytes = writeJSON(layerPath, city.layerCollection);
      const cartBytes = writeJSON(cartPath, city.cartogramCollection);
      const coverageCount = upsertCoverage(path.join(OUT_DIR, 'coverage.geojson'), city);
      const cityCount = upsertCatalogue(CATALOGUE, city);

      stats.push({
        id: city.cityId,
        cells: city.cellCount,
        layerKb: (layerBytes / 1024).toFixed(1),
        cartKb: (cartBytes / 1024).toFixed(1),
        pop: city.population,
        prox: city.proximityMinutes,
        centre: city.centre,
      });

      console.log(
        `  ${city.cityId.padEnd(16)} ${String(city.cellCount).padStart(6)} cells  ${String(city.population).padStart(9)} pop  layer ${stats[stats.length - 1].layerKb.padStart(7)} kB  cart ${stats[stats.length - 1].cartKb.padStart(7)} kB  (cov ${coverageCount}, cat ${cityCount})`,
      );
    } catch (err) {
      console.error(`  failed on ${file}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  if (DRY_RUN) console.log('\ndry run — no files written');
  else console.log(`\ndone. run \`npm run test:data\` to validate.`);
}

main();
