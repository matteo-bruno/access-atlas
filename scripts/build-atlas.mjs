// Build the combined-viewer artifact for cities exported on the standard H3
// grid: one union mesh per city, every platform's values on the same cells.
//
//   node scripts/build-atlas.mjs            # all cities listed in HARMONISED
//   node scripts/build-atlas.mjs milan
//
// This is the offline half of the harmonisation contract (see CLAUDE.md): the
// app renders whatever grid the catalogue describes and never reconciles
// anything itself, so joining the four platforms happens here, keyed by H3
// index. Inputs are the published per-platform files already under
// public/data/ — the per-platform pages keep reading those; the union mesh is
// an *additional* artifact for /atlas/:cityId.
//
// The join is verification, not resampling: every cell centroid must sit on
// the centre of the H3 cell it maps to (within GRID_TOLERANCE_M), or the build
// fails. A legacy-grid city run through this script stops with an error rather
// than producing a silently resampled mesh.
//
// Outputs, per city:
//   • public/data/atlas/<id>.cartogram-<platform>.geojson — the cartogram
//     polygons P.O.V. and Car Dependency publish, keyed by the union mesh's
//     own feature index, so the viewer can switch geometry without a second
//     copy of the values. The other two platforms publish no cartogram.
//   • public/data/atlas/<id>.geojson — union mesh; each feature carries `h3`,
//     `population`, and whichever platform values exist for that cell
//     (pov: zone/proximity/opportunity · cardep: cdi/o_score_pt/o_score_car ·
//     fifteen: <category>_<mode> · citychrone: cc, the row index into the
//     hourly hexcover/times files)
//   • catalogue entries merged into public/data/index.json: the `atlas`
//     section, the fifteen city entry, the citychrone city entry (hourly file
//     templates), and both platforms' coverage.geojson
//
// It also prints the counts src/data/home.js and platforms.js quote.

import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { latLngToCell, cellToLatLng, cellToBoundary } from 'h3-js';

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'public', 'data');

const H3_RESOLUTION = 9;
// A centroid this close to the H3 cell centre is that cell; further means the
// dataset is not on this grid and must not be forced onto it.
const GRID_TOLERANCE_M = 10;

// Cities exported on the standard grid across the platforms listed. Extend
// this list as new harmonised exports land.
const HARMONISED = {
  milan: {
    fifteen: 'fifteen/milan.geojson',
    pov: 'pov/milan.geojson',
    cardep: 'cardep/milan.geojson',
    citychrone: {
      dir: 'citychrone/milan',
      hexcover: 'citychrone/milan/hexcover{hh}.json',
      times: 'citychrone/milan/times{hh}.npy',
      hours: 24,
    },
  },
};

// The hour whose v_score summarises a city on the citychrone coverage map —
// morning peak, matching how the upstream site opens.
const COVERAGE_HOUR = 8;

const FIFTEEN_CATEGORIES = [
  'proximity_time',
  'outdoor',
  'education',
  'supplies',
  'restaurant',
  'transport',
  'culture',
  'physical',
  'services',
  'healthcare',
];
const FIFTEEN_MODES = ['foot', 'bicycle'];

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const mb = (b) => `${(b / 1e6).toFixed(2)} MB`;

const readJSON = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));

function fail(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

function metresBetween(a, b) {
  const dLat = (a[0] - b[0]) * 111320;
  const dLon = (a[1] - b[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

function ringCentroid(geometry) {
  let ring = geometry.coordinates[0];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (ring.length > 1 && first[0] === last[0] && first[1] === last[1]) ring = ring.slice(0, -1);
  let lon = 0;
  let lat = 0;
  for (const [x, y] of ring) {
    lon += x;
    lat += y;
  }
  return [lat / ring.length, lon / ring.length]; // [lat, lon] for h3-js
}

/** Map [lat, lon] onto the standard grid, refusing centroids that miss it. */
function toCell(latLng, source) {
  const cell = latLngToCell(latLng[0], latLng[1], H3_RESOLUTION);
  const centre = cellToLatLng(cell);
  const distance = metresBetween(latLng, centre);
  if (distance > GRID_TOLERANCE_M) {
    fail(
      `${source}: centroid ${latLng.map((v) => v.toFixed(5)).join(', ')} is ${distance.toFixed(1)} m ` +
        `from the nearest H3 r${H3_RESOLUTION} cell centre — this dataset is not on the standard grid`,
    );
  }
  return cell;
}

function weightedMedian(values, weights) {
  const pairs = values.map((v, i) => [v, weights[i] || 0]).sort((a, b) => a[0] - b[0]);
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  if (!total) return pairs[Math.floor(pairs.length / 2)]?.[0] ?? 0;
  let acc = 0;
  for (const [v, w] of pairs) {
    acc += w;
    if (acc >= total / 2) return v;
  }
  return pairs[pairs.length - 1][0];
}

function zoomFor(latLngs) {
  const lats = latLngs.map((p) => p[0]);
  const lons = latLngs.map((p) => p[1]);
  const spanLon = (Math.max(...lons) - Math.min(...lons)) * Math.cos((lats[0] * Math.PI) / 180);
  const spanLat = Math.max(...lats) - Math.min(...lats);
  const span = Math.max(spanLon, spanLat, 0.01);
  return Math.round(Math.min(12, Math.max(8.5, Math.log2(360 / span) - 1.2)) * 10) / 10;
}

function writeJSON(rel, value, pretty = false) {
  const file = path.join(DATA, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = pretty ? `${JSON.stringify(value, null, 2)}\n` : JSON.stringify(value);
  fs.writeFileSync(file, text);
  return { raw: text.length, gz: gzipSync(text).length };
}

// Editorial metadata comes from the existing catalogue (any platform's entry
// for the city), so it is stated once rather than re-invented here.
function cityMeta(catalogue, cityId) {
  for (const platform of ['cardep', 'pov', 'fifteen']) {
    const entry = catalogue.platforms?.[platform]?.cities?.find((c) => c.id === cityId);
    if (entry) {
      const { name, nameIt, region, regionIt } = entry;
      return { name, nameIt, region, regionIt };
    }
  }
  fail(`no existing catalogue entry provides editorial metadata for "${cityId}"`);
  return null;
}

// Countries are not stated in the catalogue's city entries; the coverage files
// carry them. Look the city up in any platform's coverage.
function cityCountry(catalogue, cityId) {
  for (const platform of Object.values(catalogue.platforms ?? {})) {
    if (!platform.coverage) continue;
    try {
      const feature = readJSON(platform.coverage).features?.find((f) => f.properties?.id === cityId);
      if (feature?.properties?.country) return feature.properties.country;
    } catch {
      // A missing coverage file is reported elsewhere.
    }
  }
  return null;
}

function buildCity(cityId, sources, catalogue) {
  console.log(`\n${cityId}`);
  const cells = new Map(); // h3 → { properties, geometry|null, population }

  const ensure = (h3) => {
    let cell = cells.get(h3);
    if (!cell) {
      cell = { h3, geometry: null, properties: {} };
      cells.set(h3, cell);
    }
    return cell;
  };

  // ── 15minCity: defines the widest mask and the published geometry ──
  const fifteen = readJSON(sources.fifteen);
  const fifteenRadii = [];
  for (const feature of fifteen.features) {
    const p = feature.properties;
    const h3 = toCell([p.centroid_lat, p.centroid_lon], sources.fifteen);
    const cell = ensure(h3);
    if (cell.geometry) fail(`${sources.fifteen}: two features map to cell ${h3}`);
    cell.geometry = feature.geometry;
    cell.properties.population = Math.round(Number(p.population) || 0);
    if (Number.isFinite(Number(p.radius))) fifteenRadii.push(Number(p.radius));
    for (const category of FIFTEEN_CATEGORIES) {
      for (const mode of FIFTEEN_MODES) {
        const key = `${category}_${mode}`;
        const value = Number(p[key]);
        if (!Number.isFinite(value)) fail(`${sources.fifteen}: cell ${h3} is missing ${key}`);
        cell.properties[key] = r1(value);
      }
    }
  }
  console.log(`  fifteen     ${fifteen.features.length} cells`);

  // ── P.O.V. ─────────────────────────────────────────────────────────
  // The published file is a population-scaled cartogram; only its values are
  // taken. Union-mesh geometry is the true hexagon.
  const pov = readJSON(sources.pov);
  let povCells = 0;
  for (const feature of pov.features) {
    const p = feature.properties;
    const h3 = toCell(ringCentroid(feature.geometry), sources.pov);
    const cell = ensure(h3);
    if (cell.properties.zone != null) fail(`${sources.pov}: two features map to cell ${h3}`);
    // The cartogram polygon is kept aside, not used: the union mesh is drawn
    // in true geography, and this becomes the companion file the viewer swaps
    // in when someone asks for the cartogram.
    cell.cartograms = { ...cell.cartograms, pov: feature.geometry };
    cell.properties.zone = p.zone;
    cell.properties.proximity = p.proximity;
    cell.properties.opportunity = p.opportunity;
    // P.O.V. and CDI share one population model (verified identical cell by
    // cell); 15minCity uses another. Prefer the former where present so the
    // union reproduces the published weighted CDI exactly.
    cell.properties.population = p.population;
    povCells++;
  }
  console.log(`  pov         ${povCells} cells`);

  // ── Car Dependency ─────────────────────────────────────────────────
  const cardep = readJSON(sources.cardep);
  let cardepCells = 0;
  for (const feature of cardep.features) {
    const p = feature.properties;
    if (!(p.cdi >= -1 && p.cdi <= 1)) fail(`${sources.cardep}: CDI ${p.cdi} outside [−1, +1]`);
    const h3 = toCell(ringCentroid(feature.geometry), sources.cardep);
    const cell = ensure(h3);
    if (cell.properties.cdi != null) fail(`${sources.cardep}: two features map to cell ${h3}`);
    cell.cartograms = { ...cell.cartograms, cardep: feature.geometry };
    cell.properties.cdi = p.cdi;
    cell.properties.o_score_pt = p.o_score_pt;
    cell.properties.o_score_car = p.o_score_car;
    cell.properties.population = p.population; // same model as P.O.V. — see above
    cardepCells++;
  }
  console.log(`  cardep      ${cardepCells} cells`);

  // ── CityChrone: hourly files stay as published; the mesh records each
  // cell's row index (`cc`) into them ──────────────────────────────────
  const cc = sources.citychrone;
  const reference = readJSON(cc.hexcover.replace('{hh}', '00'));
  for (let hour = 1; hour < cc.hours; hour++) {
    const cover = readJSON(cc.hexcover.replace('{hh}', String(hour).padStart(2, '0')));
    if (cover.features.length !== reference.features.length) {
      fail(`${cc.dir}: hexcover ${hour} has ${cover.features.length} cells, hour 0 has ${reference.features.length}`);
    }
    for (let i = 0; i < cover.features.length; i++) {
      const a = cover.features[i].properties;
      const b = reference.features[i].properties;
      if (a.new_id !== b.new_id || a.coord[0] !== b.coord[0] || a.coord[1] !== b.coord[1]) {
        fail(`${cc.dir}: hexcover ${hour} row ${i} does not match hour 0 — cell order is not stable`);
      }
    }
  }
  const n = reference.features.length;
  for (let hour = 0; hour < cc.hours; hour++) {
    const file = path.join(DATA, cc.times.replace('{hh}', String(hour).padStart(2, '0')));
    const stat = fs.statSync(file);
    if (stat.size < n * n) fail(`${file}: ${stat.size} bytes cannot hold a ${n}×${n} matrix`);
  }
  for (const feature of reference.features) {
    const p = feature.properties;
    // hexcover `coord` is [lat, lon] — the one upstream file on that order.
    const h3 = toCell([p.coord[0], p.coord[1]], `${cc.dir}/hexcover00.json`);
    const cell = ensure(h3);
    if (cell.properties.cc != null) fail(`${cc.dir}: two features map to cell ${h3}`);
    cell.properties.cc = p.new_id;
    if (cell.properties.population == null) cell.properties.population = Math.round(p.pop || 0);
  }
  console.log(`  citychrone  ${n} cells × ${cc.hours} hours`);

  // ── Union mesh ─────────────────────────────────────────────────────
  const ordered = [...cells.values()].sort((a, b) => (a.h3 < b.h3 ? -1 : 1));
  const features = ordered.map((cell, i) => ({
    type: 'Feature',
    id: i,
    geometry:
      cell.geometry ??
      // Cells outside the 15minCity mask get the true H3 boundary — the same
      // hexagon, generated rather than copied.
      {
        type: 'Polygon',
        coordinates: [
          [...cellToBoundary(cell.h3), cellToBoundary(cell.h3)[0]].map(([lat, lon]) => [
            r5(lon),
            r5(lat),
          ]),
        ],
      },
    properties: { h3: cell.h3, ...cell.properties },
  }));

  const size = writeJSON(`atlas/${cityId}.geojson`, { type: 'FeatureCollection', features });
  console.log(
    `  atlas/${cityId}.geojson  ${features.length} cells  ${mb(size.raw)} → ${mb(size.gz)} gz`,
  );

  // ── Cartogram companions ───────────────────────────────────────────
  // One file per platform that publishes a cartogram, carrying only the
  // cells that platform covers. `i` is the union mesh's feature index, so a
  // companion can never drift into the wrong cells: nothing is matched by
  // position, and a cell a platform does not measure is simply absent.
  const cartograms = {};
  for (const platform of ['pov', 'cardep']) {
    const shapes = [];
    ordered.forEach((cell, i) => {
      const geometry = cell.cartograms?.[platform];
      if (geometry) shapes.push({ type: 'Feature', properties: { i }, geometry });
    });
    if (!shapes.length) continue;
    const rel = `atlas/${cityId}.cartogram-${platform}.geojson`;
    const written = writeJSON(rel, { type: 'FeatureCollection', features: shapes });
    cartograms[platform] = rel;
    console.log(
      `  ${rel}  ${shapes.length} cells  ${mb(written.raw)} → ${mb(written.gz)} gz`,
    );
  }

  // ── Catalogue entries ──────────────────────────────────────────────
  const meta = cityMeta(catalogue, cityId);
  const country = cityCountry(catalogue, cityId);
  const latLngs = ordered.map((cell) => cellToLatLng(cell.h3));
  const populations = ordered.map((cell) => Number(cell.properties.population) || 0);
  const population = Math.round(populations.reduce((a, b) => a + b, 0));
  const sw = populations.reduce((a, b) => a + b, 0);
  const centre = sw
    ? [
        r5(latLngs.reduce((s, p, i) => s + p[1] * populations[i], 0) / sw),
        r5(latLngs.reduce((s, p, i) => s + p[0] * populations[i], 0) / sw),
      ]
    : [r5(latLngs[0][1]), r5(latLngs[0][0])];
  const cellRadiusM = fifteenRadii.length
    ? Math.round(fifteenRadii.sort((a, b) => a - b)[fifteenRadii.length >> 1])
    : 200;
  const cell = { h3Resolution: H3_RESOLUTION, cellRadiusM };
  const zoom = zoomFor(latLngs);

  const base = { id: cityId, ...meta, center: centre, zoom };

  // Population figures are per-source sums, not the union's: each platform's
  // page and coverage marker quotes the extent that platform measured.
  const fifteenPopulation = Math.round(
    fifteen.features.reduce((s, f) => s + (Number(f.properties.population) || 0), 0),
  );
  const ccPopulation = Math.round(
    reference.features.reduce((s, f) => s + (Number(f.properties.pop) || 0), 0),
  );

  const proximityMinutes = r1(
    weightedMedian(
      fifteen.features.map((f) => Number(f.properties.proximity_time_foot)),
      fifteen.features.map((f) => Number(f.properties.population) || 0),
    ),
  );
  // Population-weighted median v_score at COVERAGE_HOUR — the same figure the
  // upstream landing map summarises a city with.
  const coverageCover = readJSON(
    cc.hexcover.replace('{hh}', String(COVERAGE_HOUR).padStart(2, '0')),
  );
  const velocityScore = r2(
    weightedMedian(
      coverageCover.features.map((f) => Number(f.properties.v_score)),
      coverageCover.features.map((f) => Number(f.properties.pop) || 0),
    ),
  );

  return {
    atlasCity: {
      ...base,
      population,
      dataset: `atlas/${cityId}.geojson`,
      // The union mesh is drawn where the cells are; the cartogram is an
      // alternative geometry, and only for the platforms that publish one.
      geometry: 'geographic',
      cartograms,
      cell,
      layers: ['pov', 'cardep', 'fifteen', 'citychrone'],
    },
    fifteenCity: {
      ...base,
      population: fifteenPopulation,
      dataset: sources.fifteen,
      geometry: 'geographic',
      cell,
    },
    citychroneCity: {
      ...base,
      population: ccPopulation,
      dataset: null,
      geometry: 'geographic',
      hourly: { hours: cc.hours, hexcover: cc.hexcover, times: cc.times, cells: n },
      cell,
    },
    coverage: {
      fifteen: {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: centre },
        properties: {
          id: cityId,
          name: meta.name,
          country,
          isStudy: true,
          proximityMinutes,
          population: fifteenPopulation,
        },
      },
      citychrone: {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: centre },
        properties: {
          id: cityId,
          name: meta.name,
          country,
          isStudy: true,
          velocityScore,
          population: ccPopulation,
        },
      },
    },
    counts: { cells: features.length, citychroneCells: n },
  };
}

// ── Run ──────────────────────────────────────────────────────────────
const only = process.argv[2];
const cityIds = only ? [only] : Object.keys(HARMONISED);
if (only && !HARMONISED[only]) fail(`"${only}" is not in the HARMONISED table`);

const cataloguePath = path.join(DATA, 'index.json');
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));

const built = cityIds.map((id) => buildCity(id, HARMONISED[id], catalogue));

// Merge into the catalogue. The fifteen and citychrone platform lists are
// rebuilt from what this script verified plus any existing entries whose
// dataset still exists on disk — an entry pointing at a deleted file would
// otherwise silently seed (the SPA fallback masks the 404).
function mergeCities(existing = [], updates) {
  const byId = new Map();
  for (const city of existing) {
    if (city.dataset && !fs.existsSync(path.join(DATA, city.dataset))) {
      console.log(`  dropping ${city.id}: dataset ${city.dataset} no longer exists`);
      continue;
    }
    byId.set(city.id, city);
  }
  for (const city of updates) byId.set(city.id, city);
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
}

console.log('\nCatalogue');
const fifteenCities = mergeCities(
  catalogue.platforms?.fifteen?.cities,
  built.map((b) => b.fifteenCity),
);
const citychroneCities = mergeCities(
  catalogue.platforms?.citychrone?.cities,
  built.map((b) => b.citychroneCity),
);
const atlasCities = mergeCities(catalogue.atlas?.cities, built.map((b) => b.atlasCity));

// Coverage lists exactly the catalogued cities (test:data enforces this), so
// rebuild both files from the merged lists.
const coverageFor = (cities, key) =>
  cities.map(
    (city) =>
      built.find((b) => b.coverage[key].properties.id === city.id)?.coverage[key] ??
      readJSON(`${key}/coverage.geojson`).features.find((f) => f.properties.id === city.id),
  );
writeJSON('fifteen/coverage.geojson', {
  type: 'FeatureCollection',
  features: coverageFor(fifteenCities, 'fifteen').filter(Boolean),
});
writeJSON('citychrone/coverage.geojson', {
  type: 'FeatureCollection',
  features: coverageFor(citychroneCities, 'citychrone').filter(Boolean),
});

const next = {
  ...catalogue,
  platforms: {
    ...catalogue.platforms,
    fifteen: { coverage: 'fifteen/coverage.geojson', cities: fifteenCities },
    citychrone: { coverage: 'citychrone/coverage.geojson', cities: citychroneCities },
  },
  atlas: { cities: atlasCities },
};
fs.writeFileSync(cataloguePath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`  fifteen: ${fifteenCities.length} · citychrone: ${citychroneCities.length} · atlas: ${atlasCities.length}`);

// ── Derived figures, for src/data/home.js and platforms.js ───────────
const povCities = next.platforms.pov?.cities ?? [];
const cardepCities = next.platforms.cardep?.cities ?? [];
const countJSON = (rel) => readJSON(rel).features.length;
const platformCells = {
  pov: povCities.reduce((s, c) => s + countJSON(c.dataset), 0),
  cardep: cardepCities.reduce((s, c) => s + countJSON(c.dataset), 0),
  fifteen: fifteenCities.reduce((s, c) => s + countJSON(c.dataset), 0),
  citychrone: citychroneCities.reduce((s, c) => s + (c.hourly?.cells ?? 0), 0),
};
const variants = new Set(['paris-fua', 'munich-fua', 'rome-metro-d']);
const distinct = new Set(
  [...povCities, ...cardepCities, ...fifteenCities, ...citychroneCities]
    .map((c) => c.id)
    .filter((id) => !variants.has(id)),
);

console.log('\n─────────────────────────────────────────────');
console.log('Figures for src/data/home.js and platforms.js');
console.log('─────────────────────────────────────────────');
console.log(`  cities (distinct, excl. variants) : ${distinct.size}`);
const cells = Object.values(platformCells).reduce((a, b) => a + b, 0);
console.log(
  `  hexagonal cells                   : ${cells.toLocaleString('en-GB')}  (pov ${platformCells.pov.toLocaleString('en-GB')} · cardep ${platformCells.cardep.toLocaleString('en-GB')} · fifteen ${platformCells.fifteen.toLocaleString('en-GB')} · citychrone ${platformCells.citychrone.toLocaleString('en-GB')})`,
);
console.log(`  fifteen.cityCount                 : ${fifteenCities.length}`);
console.log(`  citychrone.cityCount              : ${citychroneCities.length}`);
