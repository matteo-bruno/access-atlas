#!/usr/bin/env node
// Import 15minCity cities from `input_data/15mincity/*.geojson` into the
// Atlas, one file per city, with all the compressions the published files
// benefit from applied on the way through.
//
// Where a city lands depends on its grid, and the script proves which:
//
//   • **On the shared H3 grid** (what these exports are) the city joins the
//     atlas union at `public/data/atlas/<city>.geojson.gz`, with its cartogram
//     beside it as `<city>.cartogram-fifteen.geojson.gz`. The union is the
//     only file the viewer reads for a city that has one, so no per-platform
//     copy is written — producing one would store every measure twice and
//     fetch it never. Re-running *adds this layer* to whatever the union
//     already carries, keyed by H3 index, rather than replacing the file.
//   • **Off it**, there is no union to join, and the mesh is published on its
//     own at `public/data/fifteen/<city>.geojson.gz` with a null resolution.
//
// The grid is detected, never assumed. Centroid proximity alone cannot decide
// it — an H3 cell's centre coincides with its central child's, so an r9 mesh
// matches r9, r10 and r11 centres equally well — so a resolution is only
// accepted when the cell's own boundary lands on the feature's polygon. See
// `detectH3`.
//
// Either way the catalogue in `public/data/index.json` is updated (the
// `platforms.fifteen` row, plus the `atlas` entry for a city on the grid) and
// the coverage marker goes into `fifteen/coverage.geojson.gz`. `--plain`
// writes uncompressed files, for inspecting an import.
//
// Idempotent. Rerunning the script on the same source overwrites the
// published city cleanly; existing cities the source does not name are
// left alone.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { latLngToCell, cellToLatLng, cellToBoundary } from 'h3-js';
import { readDataJSON, writeDataFile } from './lib/datafile.mjs';
import { countryAt } from './lib/country.mjs';

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

// Where a city is, is **derived from its own centroid** (see lib/country.mjs)
// rather than stated per run: the source files carry no such field, the UI
// shows it twice, and a value derived every run cannot go stale or be undone
// by a flag someone forgot to pass. These three override the lookup when it
// is wrong or when the Italian name is wanted — `regionIt` is the one that
// cannot be derived, so it falls back to the English name unless the
// catalogue already carries a hand-written one — Natural Earth's own
// `NAME_IT` supplies it otherwise.
// 15minCity keeps only the compressed copy on disk: the Atlas is served from
// a machine where the size of the data tree is the binding constraint, and a
// plain companion beside it would double that for bytes no client asks for.
// `--plain` writes uncompressed files instead, for inspecting an import.
const STORE_GZIP = !flag('plain');
const EXT = STORE_GZIP ? '.geojson.gz' : '.geojson';

const COUNTRY = arg('country');
const REGION = arg('region');
const REGION_IT = arg('region-it');

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

// ── H3 grid detection ────────────────────────────────────────────────
// A cell centroid this close to an H3 cell centre *is* that cell; further
// means the export is not on this grid and must not be forced onto it. Same
// tolerance build-atlas.mjs uses, for the same reason.
const GRID_TOLERANCE_M = 10;
const CANDIDATE_RESOLUTIONS = [8, 9, 10, 11];

const metresBetween = ([lat1, lon1], [lat2, lon2]) =>
  Math.hypot((lon2 - lon1) * 111320 * Math.cos((lat1 * Math.PI) / 180), (lat2 - lat1) * 110540);

/**
 * The H3 resolution a mesh is published on, or null if it is not H3.
 *
 * Centroid proximity alone cannot decide this: an H3 cell's centre coincides
 * with the centre of its central child, so a mesh on r9 matches r9, r10 and
 * r11 centres equally well and picking the first hit silently claims a grid
 * four times too fine. The size has to be checked too — so a candidate is only
 * accepted when the cell's own **boundary** lands on the feature's polygon.
 * Measured on a real export: r9 gives a 0.0 m vertex mismatch and r10 gives
 * 138.7 m.
 *
 * Returns `{ resolution, indices }` or null. `indices` is parallel to
 * `features`, so callers do not recompute what was proved here.
 */
function detectH3(features, centroids) {
  for (const resolution of CANDIDATE_RESOLUTIONS) {
    const indices = [];
    let ok = true;

    for (let i = 0; i < features.length && ok; i++) {
      const centre = centroids[i];
      if (!centre) { ok = false; break; }
      const [lon, lat] = centre;
      const cell = latLngToCell(lat, lon, resolution);
      if (metresBetween([lat, lon], cellToLatLng(cell)) > GRID_TOLERANCE_M) ok = false;
      indices.push(cell);
    }
    if (!ok) continue;

    // One feature per cell, or the mesh is finer than the grid claimed.
    if (new Set(indices).size !== features.length) continue;

    // The decisive test: does the cell drawn at this resolution have the same
    // outline as the feature? Sampled — a mesh is one grid or it is not.
    const step = Math.max(1, Math.floor(features.length / 40));
    let worst = 0;
    for (let i = 0; i < features.length; i += step) {
      const ring = features[i]?.geometry?.coordinates?.[0];
      if (!Array.isArray(ring)) continue;
      for (const [blat, blon] of cellToBoundary(indices[i])) {
        let nearest = Infinity;
        for (const [plon, plat] of ring) {
          nearest = Math.min(nearest, metresBetween([blat, blon], [plat, plon]));
        }
        worst = Math.max(worst, nearest);
      }
    }
    if (worst <= GRID_TOLERANCE_M) return { resolution, indices, vertexError: worst };
  }
  return null;
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
  // Parallel to the features, unlike `centres` — detectH3 needs to line each
  // cell up with its own centroid, including any that has none.
  const cellCentres = [];
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
    cellCentres.push(centre ?? null);
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

  // Where the city is, from the centroid just computed. `--country` /
  // `--region` override it; a null result leaves both blank rather than
  // guessing, and is reported so it is not discovered on the page.
  const found = countryAt(centre[0], centre[1]);
  const place = {
    iso: COUNTRY ?? found?.iso ?? null,
    name: REGION ?? found?.name ?? null,
    // Natural Earth carries localised country names, so the Italian label is
    // derived rather than kept in a table that would drift from the English.
    nameIt: REGION_IT ?? found?.nameIt ?? REGION ?? found?.name ?? null,
    derived: found,
    overridden: Boolean(COUNTRY || REGION),
  };

  // Is this export on the shared H3 grid? If it is, the city joins the atlas
  // union directly and the per-platform copy is never written — the union is
  // the only file the viewer reads for a city that has one, so producing both
  // would be storing every measure twice. If it is not, the mesh is published
  // on its own and says so with a null resolution.
  const grid = detectH3(outFeatures, cellCentres);
  if (grid) {
    outFeatures.forEach((feature, i) => {
      feature.properties.h3 = grid.indices[i];
    });
  }

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
      // An unpopulated cell scales to nothing, but it still has to be a
      // well-formed ring collapsed onto its own centre rather than an empty
      // `coordinates: []` — consumers read `coordinates[0]` to find where the
      // companion sits, and an empty one crashes them. This is what
      // build-atlas.mjs's derived cartogram does for the same case.
      geometry: scaleGeometry(feature.geometry, factor, cellCentre),
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
    country: place.iso,
    region: place.name,
    regionIt: REGION_IT ?? place.nameIt,
    place,
    population,
    centre: [rCoord(centre[0]), rCoord(centre[1])],
    bbox,
    zoom: Math.round(zoomForBBox(bbox) * 10) / 10,
    cellRadiusM: radiusM,
    proximityMinutes,
    cellCount: outFeatures.length,
    grid,
    // What the atlas union carries for this layer: the H3 index it joins on,
    // the population the cartogram rule needs, and the measures themselves.
    // The source's own bookkeeping (`centroid_lon`, `radius`, `id`) is left
    // behind — the union is keyed by `h3`, so a second notion of where a cell
    // is could only ever disagree with it.
    atlasFeatures: grid
      ? outFeatures.map((feature) => {
          const p = feature.properties;
          const props = { h3: p.h3, population: p.pop };
          for (const cat of CATEGORIES) {
            for (const mode of MODES) {
              const key = `${cat}_${mode}`;
              if (key in p) props[key] = p[key];
            }
          }
          for (const mode of MODES) {
            const key = `proximity_time_${mode}`;
            if (key in p) props[key] = p[key];
          }
          return { type: 'Feature', geometry: feature.geometry, properties: props };
        })
      : null,
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
  const isGeo = target.endsWith('.geojson') || target.endsWith('.geojson.gz');
  const body = isGeo ? JSON.stringify(data) : `${JSON.stringify(data, null, 2)}\n`;
  if (DRY_RUN) {
    // Report what the write would have cost without performing it.
    return target.endsWith('.gz')
      ? { raw: body.length, stored: zlib.gzipSync(Buffer.from(body)).length }
      : { raw: body.length, stored: body.length };
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  return writeDataFile(target, body);
}

function readJSONIfExists(target) {
  try {
    return readDataJSON(target);
  } catch {
    return null;
  }
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

// Which properties belong to which layer, so adding one can replace exactly
// its own measures and leave every other platform's alone.
const FIFTEEN_KEYS = new Set([
  ...CATEGORIES.flatMap((c) => MODES.map((m) => `${c}_${m}`)),
  ...MODES.map((m) => `proximity_time_${m}`),
]);

/**
 * Add this city's 15minCity measures to its atlas union mesh.
 *
 * The union is keyed by H3 index, so this is a merge rather than a write: a
 * city that already carries P.O.V. or Car Dependency keeps them, gains the
 * fifteen measures on the cells they cover, and grows by any cell only
 * 15minCity reaches. Re-importing replaces this layer's own keys and touches
 * nothing else — which is what makes "add a layer" an operation rather than a
 * rebuild.
 *
 * @returns {{ collection: object, cells: number, layers: string[] }}
 */
function mergeAtlas(atlasPath, city) {
  const existing = readJSONIfExists(atlasPath);
  const byH3 = new Map();

  for (const feature of existing?.features ?? []) {
    const h3 = feature?.properties?.h3;
    if (typeof h3 !== 'string') continue;
    // Drop this layer's previous values so a re-import cannot leave a stale
    // measure on a cell the new export no longer covers.
    const props = {};
    for (const [k, v] of Object.entries(feature.properties)) {
      if (!FIFTEEN_KEYS.has(k)) props[k] = v;
    }
    byH3.set(h3, { ...feature, properties: props });
  }

  for (const feature of city.atlasFeatures) {
    const h3 = feature.properties.h3;
    const prior = byH3.get(h3);
    byH3.set(
      h3,
      prior
        ? { ...prior, properties: { ...prior.properties, ...feature.properties } }
        : feature,
    );
  }

  // Feature ids are array indices — the page filters highlights and applies
  // feature-state by them, so they are assigned after the merge settles.
  const features = [...byH3.values()].map((feature, i) => ({ ...feature, id: i }));

  // Which layers the union now actually carries, read off the cells rather
  // than remembered: a declared layer with no cells fails test:data.
  const present = new Set();
  for (const { properties: p } of features) {
    if (Number.isFinite(p.proximity_time_foot)) present.add('fifteen');
    if (Number.isFinite(p.zone)) present.add('pov');
    if (Number.isFinite(p.cdi)) present.add('cardep');
    if (Number.isFinite(p.cc)) present.add('citychrone');
  }

  return {
    collection: { type: 'FeatureCollection', features },
    cells: features.length,
    layers: [...present],
  };
}

/**
 * Platforms that publish this city on a mesh of their own, and whose values
 * the union does not carry.
 *
 * The union is all the viewer reads for a city with an atlas entry, so each
 * of these would go dark the moment such an entry existed.
 */
function layersPublishedOutside(catalogue, cityId, unionLayers) {
  const carried = new Set(unionLayers);
  const outside = [];
  for (const [platformId, entry] of Object.entries(catalogue.platforms ?? {})) {
    if (platformId === 'fifteen') continue;
    const row = (entry.cities ?? []).find((c) => c.id === cityId);
    if (!row || (!row.dataset && !row.hourly)) continue;
    if (!carried.has(platformId)) outside.push(platformId);
  }
  return outside;
}

/** Remove a file whichever way round it is stored. */
function removeDataFile(relative) {
  for (const candidate of [relative, `${relative}.gz`, relative.replace(/\.gz$/, '')]) {
    const target = path.resolve(ROOT, 'public/data', candidate);
    if (fs.existsSync(target)) {
      if (!DRY_RUN) fs.rmSync(target);
      console.warn(`      removed ${candidate}`);
    }
  }
}

/**
 * Undo a union this script wrote for a city that should not have one.
 *
 * Only ever called where the union holds this layer and nothing else, so
 * there is no other platform's data to lose. The catalogue entry is what
 * actually matters — it is what makes the viewer read the union — but the
 * file goes too rather than sitting unreferenced.
 */
function dropOwnUnion(catalogue, cityId) {
  const cities = catalogue.atlas?.cities ?? [];
  const idx = cities.findIndex((c) => c.id === cityId);
  if (idx < 0) return;
  cities.splice(idx, 1);
  catalogue.atlas = { ...catalogue.atlas, cities };
  console.warn(`      dropped the atlas entry for ${cityId}`);
  removeDataFile(`atlas/${cityId}${EXT}`);
  removeDataFile(`atlas/${cityId}.cartogram-fifteen${EXT}`);
}

/** The atlas-union catalogue entry for a city, merged with what is there. */
function upsertAtlasCatalogue(catalogue, city, { cells, layers }, paths) {
  const atlas = catalogue.atlas ?? { cities: [] };
  const cities = atlas.cities ?? [];
  const idx = cities.findIndex((c) => c.id === city.cityId);
  const existing = idx >= 0 ? cities[idx] : null;

  const row = {
    id: city.cityId,
    name: city.cityName,
    // The city's own name in Italian cannot be derived, so a hand-written one
    // is kept. `region` / `regionIt` are derived from the centroid every run
    // and deliberately are *not* — preserving them would let a wrong value
    // from an earlier run outlive the fix, which is the staleness this
    // derivation exists to remove. `--region` overrides per run.
    nameIt: existing?.nameIt ?? city.name,
    region: city.region,
    regionIt: city.regionIt,
    center: city.centre,
    zoom: city.zoom,
    population: city.population,
    dataset: paths.atlas,
    geometry: 'geographic',
    cartograms: { ...(existing?.cartograms ?? {}), fifteen: paths.cartogram },
    cartogramSources: { ...(existing?.cartogramSources ?? {}), fifteen: 'derived' },
    cell: { h3Resolution: city.grid.resolution, cellRadiusM: city.cellRadiusM },
    layers,
  };

  if (idx >= 0) cities[idx] = row;
  else cities.push(row);
  catalogue.atlas = { ...atlas, cities };
  return cities.length;
}

function upsertCatalogue(catalogue, city, paths) {
  const platforms = catalogue.platforms ?? {};
  const fifteen = platforms.fifteen ?? { coverage: `fifteen/coverage${EXT}`, cities: [] };

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
    // For a city on the shared grid this points at the **union mesh**, the
    // same file the atlas entry names. The row still has to exist — it is
    // what puts the city in the platform's list and makes its marker open a
    // page — but the measures live in one file, not two.
    dataset: paths.dataset,
    geometry: 'geographic',
    cartogramDataset: paths.cartogram,
    cartogramSource: 'derived',
    cell: {
      h3Resolution: city.grid?.resolution ?? null,
      cellRadiusM: city.cellRadiusM,
    },
  };

  const cities = fifteen.cities ?? [];
  const idx = cities.findIndex((c) => c.id === city.cityId);
  // Only `nameIt` is preserved: it is the one field nothing can derive. The
  // region pair comes from the centroid on every run, so a stale or wrong
  // value cannot survive a re-import.
  if (idx >= 0) {
    const existing = cities[idx];
    if (existing.nameIt != null) row.nameIt = existing.nameIt;
    cities[idx] = row;
  } else {
    cities.push(row);
  }

  platforms.fifteen = { ...fifteen, cities };
  catalogue.platforms = platforms;
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

  const catalogue = readJSONIfExists(CATALOGUE);
  if (!catalogue) {
    console.error(`catalogue not found: ${CATALOGUE}`);
    process.exit(1);
  }

  const stats = [];
  for (const file of files) {
    const srcPath = path.join(SRC_DIR, file);
    try {
      const city = processCity(srcPath);

      // On the shared grid the city joins the atlas union and that union is
      // the only copy: the viewer reads it for any city that has one, so a
      // per-platform file beside it would be every measure stored twice and
      // never fetched. Off the grid there is no union to join, and the mesh
      // is published on its own.
      //
      // Being on the grid is not on its own enough, because the union is the
      // *whole* of what the viewer reads for a city that has one. A union
      // carrying only this layer, for a city P.O.V. and Car Dependency
      // publish on their own meshes, does not add 15minCity to that city: it
      // hides the two layers that were already there. So the union may claim
      // a city only when it carries every layer the catalogue publishes for
      // it — which is what `missing` below asks, on the merged result rather
      // than on what was declared.
      const onGrid = Boolean(city.grid);
      const atlasPath = path.resolve(ROOT, 'public/data', `atlas/${city.cityId}${EXT}`);
      const merged = onGrid ? mergeAtlas(atlasPath, city) : null;
      const missing = merged ? layersPublishedOutside(catalogue, city.cityId, merged.layers) : [];
      const carried = merged ? merged.layers.filter((l) => l !== 'fifteen') : [];

      // A union that already holds another platform's values *and* is missing
      // a third is a half-harmonised city, and joining it or stepping around
      // it would both hide a layer. That is `build:atlas`'s job, not a guess
      // to make here.
      if (missing.length && carried.length) {
        throw new Error(
          `atlas/${city.cityId} carries ${carried.join(', ')} but ${missing.join(', ')} ` +
            `publish ${city.cityId} on their own meshes — run build:atlas to harmonise them first`,
        );
      }

      const joinsUnion = onGrid && missing.length === 0;
      const paths = joinsUnion
        ? {
            atlas: `atlas/${city.cityId}${EXT}`,
            cartogram: `atlas/${city.cityId}.cartogram-fifteen${EXT}`,
          }
        : {
            atlas: null,
            dataset: `fifteen/${city.cityId}${EXT}`,
            cartogram: `fifteen/${city.cityId}.cartogram${EXT}`,
          };
      if (joinsUnion) paths.dataset = paths.atlas;

      let layerBytes;
      let cartBytes;

      if (joinsUnion) {
        layerBytes = writeJSON(atlasPath, merged.collection);
        cartBytes = writeJSON(
          path.resolve(ROOT, 'public/data', paths.cartogram),
          city.cartogramCollection,
        );
        upsertAtlasCatalogue(catalogue, city, merged, paths);
      } else {
        layerBytes = writeJSON(path.join(OUT_DIR, `${city.cityId}${EXT}`), city.layerCollection);
        cartBytes = writeJSON(
          path.join(OUT_DIR, `${city.cityId}.cartogram${EXT}`),
          city.cartogramCollection,
        );
        if (missing.length) {
          console.warn(
            `    ~ ${city.cityId}: ${missing.join(', ')} publish it on their own meshes, so a union` +
              ' would hide them — published on its own mesh instead',
          );
          // An earlier run may have written exactly that union. It holds
          // nothing but this layer (the throw above covers the other case),
          // so the catalogue entry and the file go together.
          dropOwnUnion(catalogue, city.cityId);
        }
      }

      const coverageCount = upsertCoverage(path.join(OUT_DIR, `coverage${EXT}`), city);
      const cityCount = upsertCatalogue(catalogue, city, paths);

      stats.push({
        id: city.cityId,
        cells: city.cellCount,
        raw: layerBytes.raw + cartBytes.raw,
        stored: layerBytes.stored + cartBytes.stored,
        onGrid,
        joinsUnion,
      });

      const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
      const last = stats[stats.length - 1];
      // A nearest-coast match or no match at all is worth saying out loud:
      // both are the cases where the derived country can be wrong, and a
      // blank one reaches the page as a missing region.
      const d = city.place.derived;
      if (!city.place.iso) {
        console.warn(
          `    ! ${city.cityId}: no country within range of ${city.centre.join(', ')} — region left blank`,
        );
      } else if (d && !d.exact && !city.place.overridden) {
        console.warn(
          `    ~ ${city.cityId}: ${d.iso} matched ${d.distanceKm} km from the coast, not contained`,
        );
      }

      const where = joinsUnion
        ? `atlas r${city.grid.resolution}${merged.layers.length > 1 ? ` +${carried.join('/')}` : ''}`
        : 'own mesh';
      console.log(
        `  ${city.cityId.padEnd(16)} ${String(city.cellCount).padStart(6)} cells  ${String(city.population).padStart(9)} pop  ` +
          `${kb(last.raw).padStart(9)} json → ${kb(last.stored).padStart(9)} on disk  ${(city.place.iso ?? '--').padEnd(3)} ${where}  (cov ${coverageCount}, cat ${cityCount})`,
      );
    } catch (err) {
      console.error(`  failed on ${file}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  writeJSON(CATALOGUE, catalogue);

  const raw = stats.reduce((s, c) => s + c.raw, 0);
  const stored = stats.reduce((s, c) => s + c.stored, 0);
  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (raw) {
    console.log(
      `\n${stats.length} cities  ${mb(raw)} json → ${mb(stored)} on disk` +
        (STORE_GZIP ? ` (${Math.round((1 - stored / raw) * 100)}% saved, stored gzipped)` : ''),
    );
    const off = stats.filter((c) => !c.onGrid);
    if (off.length) {
      console.log(
        `${off.length} not on the shared H3 grid, published on their own mesh: ${off.map((c) => c.id).join(', ')}`,
      );
    }
    // On the grid, but another platform publishes the city on a mesh of its
    // own: a union here would be the only file the viewer reads, and would
    // therefore hide that platform. `build:atlas` is what joins them.
    const beside = stats.filter((c) => c.onGrid && !c.joinsUnion);
    if (beside.length) {
      console.log(
        `${beside.length} on the grid but published beside another platform's mesh rather than in a union: ${beside
          .map((c) => c.id)
          .join(', ')}`,
      );
    }
  }

  if (DRY_RUN) console.log('dry run — no files written');
  else console.log('run `npm run test:data` to validate.');
}

main();
