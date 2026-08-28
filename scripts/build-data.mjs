// Convert the upstream research datasets into the Atlas's published form.
//
//   node scripts/build-data.mjs --pov ../accessibility-pov --cdi ../CDI
//
// Sources default to $ATLAS_SOURCE_POV / $ATLAS_SOURCE_CDI, then to sibling
// checkouts. The upstream repos are inputs, not dependencies: this writes
// self-contained GeoJSON into public/data/ and a catalogue that lists it, and
// nothing at runtime reaches back to them.
//
// What it does per platform:
//   • one GeoJSON per city, coordinates trimmed to 5 dp and scores to 1 dp
//   • a `<city>.geo.geojson` companion: the same cells in true geographic
//     position, so the viewer can show a map as well as a cartogram
//   • a coverage FeatureCollection of city points for the world map
//   • catalogue entries merged into public/data/index.json
//   • the derived counts src/data/home.js quotes, printed at the end
//
// CDI ships three files per city where one suffices: cdi.csv duplicates both
// the geometry of hexes.geojson and the values already in cartogram.geojson.
// Only the cartogram is read.

import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { latLngToCell, cellToLatLng, cellToBoundary } from 'h3-js';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'data');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const POV_DIR = arg('pov', process.env.ATLAS_SOURCE_POV ?? '../accessibility-pov');
const CDI_DIR = arg('cdi', process.env.ATLAS_SOURCE_CDI ?? '../CDI');
const FIFTEEN_DIR = arg('fifteen', process.env.ATLAS_SOURCE_FIFTEEN ?? '../15mincity');

// ── City metadata the datasets do not carry ──────────────────────────
// Country, localised name and region are editorial; everything numeric is
// computed from the data itself.
const CITIES = {
  barcelona: { name: 'Barcelona', nameIt: 'Barcellona', country: 'ES' },
  berlin: { name: 'Berlin', nameIt: 'Berlino', country: 'DE' },
  bordeaux: { name: 'Bordeaux', nameIt: 'Bordeaux', country: 'FR' },
  boston: { name: 'Boston', nameIt: 'Boston', country: 'US' },
  chicago: { name: 'Chicago', nameIt: 'Chicago', country: 'US' },
  florence: { name: 'Florence', nameIt: 'Firenze', country: 'IT' },
  karlsruhe: { name: 'Karlsruhe', nameIt: 'Karlsruhe', country: 'DE' },
  malaga: { name: 'Málaga', nameIt: 'Malaga', country: 'ES' },
  milan: { name: 'Milan', nameIt: 'Milano', country: 'IT' },
  munich: { name: 'Munich', nameIt: 'Monaco di Baviera', country: 'DE' },
  'munich-fua': { name: 'Munich (metro area)', nameIt: 'Monaco (area metropolitana)', country: 'DE' },
  nantes: { name: 'Nantes', nameIt: 'Nantes', country: 'FR' },
  'new-york': { name: 'New York', nameIt: 'New York', country: 'US' },
  paris: { name: 'Paris', nameIt: 'Parigi', country: 'FR' },
  'paris-fua': { name: 'Paris (metro area)', nameIt: 'Parigi (area metropolitana)', country: 'FR' },
  porto: { name: 'Porto', nameIt: 'Porto', country: 'PT' },
  rome: { name: 'Rome', nameIt: 'Roma', country: 'IT' },
  'rome-metro-d': { name: 'Rome (Metro D scenario)', nameIt: 'Roma (scenario Metro D)', country: 'IT' },
  seattle: { name: 'Seattle', nameIt: 'Seattle', country: 'US' },
  stockholm: { name: 'Stockholm', nameIt: 'Stoccolma', country: 'SE' },
  valencia: { name: 'Valencia', nameIt: 'Valencia', country: 'ES' },
  vienna: { name: 'Vienna', nameIt: 'Vienna', country: 'AT' },
  zurich: { name: 'Zurich', nameIt: 'Zurigo', country: 'CH' },
};

const REGION = {
  AT: ['Austria', 'Austria'],
  CH: ['Switzerland', 'Svizzera'],
  DE: ['Germany', 'Germania'],
  ES: ['Spain', 'Spagna'],
  FR: ['France', 'Francia'],
  IT: ['Italy', 'Italia'],
  PT: ['Portugal', 'Portogallo'],
  SE: ['Sweden', 'Svezia'],
  US: ['United States', 'Stati Uniti'],
};

// Upstream names → Atlas city ids (which match src/data/cities.js slugs).
const SLUGS = {
  new_york: 'new-york',
  'málaga': 'malaga',
  'paris (city)': 'paris',
  'paris (FUA)': 'paris-fua',
  'munich (city)': 'munich',
  'munich (FUA)': 'munich-fua',
  'rome (metro D scenario)': 'rome-metro-d',
};

// Variants sit on top of their base city, so only the base gets a marker on
// the world map. Their datasets are still published and still get a page.
const VARIANTS = new Set(['paris-fua', 'munich-fua', 'rome-metro-d']);

const ZONE_TYPES = ['inclusion', 'spatial isolation', 'social isolation', 'total isolation'];

const r5 = (v) => Math.round(v * 1e5) / 1e5;
const r1 = (v) => Math.round(v * 10) / 10;
const r3 = (v) => Math.round(v * 1e3) / 1e3;

function slugFor(raw) {
  const key = raw.replace(/_cartogram\.geojson$/, '');
  if (SLUGS[key]) return SLUGS[key];
  return key
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function trimRings(geometry) {
  return {
    type: geometry.type,
    coordinates: geometry.coordinates.map((ring) => ring.map(([x, y]) => [r5(x), r5(y)])),
  };
}

// Population-weighted centre, so the marker sits where the people are rather
// than at the middle of the bounding box.
function weightedCentre(rows) {
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (const row of rows) {
    const w = row.population || 0;
    sx += row.lon * w;
    sy += row.lat * w;
    sw += w;
  }
  if (!sw) {
    const n = rows.length || 1;
    return [r5(rows.reduce((s, r) => s + r.lon, 0) / n), r5(rows.reduce((s, r) => s + r.lat, 0) / n)];
  }
  return [r5(sx / sw), r5(sy / sw)];
}

function ringCentroid(geometry) {
  let ring = geometry.coordinates[0];
  if (ring.length > 1) {
    const a = ring[0];
    const b = ring[ring.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) ring = ring.slice(0, -1);
  }
  let x = 0;
  let y = 0;
  for (const [px, py] of ring) {
    x += px;
    y += py;
  }
  return [x / ring.length, y / ring.length];
}

function zoomFor(rows) {
  const lons = rows.map((r) => r.lon);
  const lats = rows.map((r) => r.lat);
  const spanLon = (Math.max(...lons) - Math.min(...lons)) * Math.cos((lats[0] * Math.PI) / 180);
  const spanLat = Math.max(...lats) - Math.min(...lats);
  const span = Math.max(spanLon, spanLat, 0.01);
  // 360° at zoom 0, halving each level; back off one so the city has margin.
  return Math.round(Math.min(12, Math.max(8.5, Math.log2(360 / span) - 1.2)) * 10) / 10;
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

function writeJSON(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = JSON.stringify(value);
  fs.writeFileSync(file, text);
  return { raw: text.length, gz: gzipSync(text).length };
}

const mb = (b) => `${(b / 1e6).toFixed(2)} MB`;

// ── City summaries ───────────────────────────────────────────────────
// The compare view needs one row per city, not one row per cell. Computing it
// in the browser would mean fetching every city's dataset — 15 MB for P.O.V.,
// 27 MB for Car Dependency — to end up with twenty numbers, so it is computed
// here and published as a summary file per platform.
//
// Everything in it is derived from the same features that were just written,
// so a figure in the table and the same figure on the city page cannot drift.

// Cumulative share of the *population* at or below each step of a measure —
// the distribution chart's curve. Twenty-one points is enough to draw it and
// small enough to publish for every city.
function populationCdf(rows, value, from, to, steps = 20) {
  const total = rows.reduce((sum, row) => sum + row.population, 0);
  if (!total) return null;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const edge = from + ((to - from) * i) / steps;
    let below = 0;
    for (const row of rows) if (value(row) <= edge) below += row.population;
    points.push([r3(edge), r3(below / total)]);
  }
  return points;
}

function summaryFile(platform, cities) {
  return { platform, cities };
}

// ── Geographic geometry ──────────────────────────────────────────────
// Both platforms publish *population-scaled cartograms*: the polygon encodes
// how many people live in the cell, not where the cell's edges are. The true
// hexagon is not lost, though — the cartogram scales each cell about its own
// centroid, and every published city sits on the standard H3 grid, so the
// centroid identifies the cell and the cell determines its boundary.
//
// That boundary is written as a companion file rather than folded into the
// dataset: one geometry per cell, in the dataset's own order, so the viewer
// can swap geometries without refetching the values. `i` states the index it
// belongs to instead of leaving the alignment to chance.
//
// The same contract as scripts/build-atlas.mjs: a centroid further than
// GRID_TOLERANCE_M from an H3 cell centre means the dataset is not on this
// grid, and the build stops rather than forcing it on.
const H3_RESOLUTION = 9;
const GRID_TOLERANCE_M = 10;

function metresBetween(a, b) {
  const dLat = (a[0] - b[0]) * 111320;
  const dLon = (a[1] - b[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

// Drop the closing vertex, however many times it was written: CDI's
// hexes.geojson repeats it twice, which would otherwise weight one corner
// double in every average below.
function openRing(ring) {
  let end = ring.length;
  while (end > 1 && ring[end - 1][0] === ring[0][0] && ring[end - 1][1] === ring[0][1]) end--;
  return ring.slice(0, end);
}

// Mean distance from centroid to vertices — a polygon's "radius", used to
// compare a derived hexagon against a published one.
function ringRadiusM(ring) {
  const open = openRing(ring);
  let cx = 0;
  let cy = 0;
  for (const [x, y] of open) {
    cx += x;
    cy += y;
  }
  cx /= open.length;
  cy /= open.length;
  const k = Math.cos((cy * Math.PI) / 180);
  let sum = 0;
  for (const [x, y] of open) sum += Math.hypot((x - cx) * 111320 * k, (y - cy) * 111320);
  return sum / open.length;
}

// Centroid of a ring, on the same normalisation as ringRadiusM.
function ringCentre(ring) {
  const open = openRing(ring);
  let x = 0;
  let y = 0;
  for (const [px, py] of open) {
    x += px;
    y += py;
  }
  return [x / open.length, y / open.length];
}

/**
 * The true hexagons behind a city's cartogram, in the dataset's order.
 *
 * @param {object[]} features  published features, cartogram geometry
 * @param {string}   source    file name, for error messages
 * @returns {{ collection: object, cells: string[] }}
 */
function geoCompanion(features, source) {
  const cells = [];
  const out = features.map((feature, i) => {
    const [lon, lat] = ringCentroid(feature.geometry);
    const cell = latLngToCell(lat, lon, H3_RESOLUTION);
    const distance = metresBetween([lat, lon], cellToLatLng(cell));
    if (distance > GRID_TOLERANCE_M) {
      throw new Error(
        `${source}: cell ${i} centroid is ${distance.toFixed(1)} m from the nearest ` +
          `H3 r${H3_RESOLUTION} cell centre — this dataset is not on the standard grid`,
      );
    }
    cells.push(cell);
    const ring = cellToBoundary(cell).map(([la, lo]) => [r5(lo), r5(la)]);
    ring.push(ring[0]);
    return {
      type: 'Feature',
      properties: { i },
      geometry: { type: 'Polygon', coordinates: [ring] },
    };
  });
  return { collection: { type: 'FeatureCollection', features: out }, cells };
}

// ── P.O.V. ───────────────────────────────────────────────────────────
function buildPov(dir) {
  const src = path.join(dir, 'data');
  if (!fs.existsSync(src)) {
    console.log(`P.O.V. source not found at ${src} — skipping`);
    return null;
  }

  const files = fs.readdirSync(src).filter((f) => f.endsWith('_cartogram.geojson')).sort();
  const cities = [];
  const summaries = [];
  const coverage = [];
  let totalRaw = 0;
  let totalGz = 0;
  let totalCells = 0;

  for (const file of files) {
    const id = slugFor(file);
    const meta = CITIES[id];
    if (!meta) throw new Error(`No metadata for P.O.V. city "${id}" (from ${file})`);

    const input = JSON.parse(fs.readFileSync(path.join(src, file), 'utf8'));
    const rows = input.features.map((f) => {
      const p = f.properties;
      const [lon, lat] = ringCentroid(f.geometry);
      return {
        geometry: f.geometry,
        lon,
        lat,
        population: Number(p.population) || 0,
        proximity: Number(p.proximity),
        opportunity: Number(p.opportunity),
        cellType: p.cell_type,
      };
    });

    // Thresholds are the population-weighted medians; classifying against them
    // reproduces the upstream cell_type exactly, which is asserted below.
    const pop = rows.map((r) => r.population);
    const proxCut = weightedMedian(rows.map((r) => r.proximity), pop);
    const oppCut = weightedMedian(rows.map((r) => r.opportunity), pop);

    const counts = [0, 0, 0, 0];
    const popByZone = [0, 0, 0, 0];
    const features = rows.map((row, i) => {
      const zone = ZONE_TYPES.indexOf(row.cellType);
      if (zone < 0) throw new Error(`${id}: unknown cell_type "${row.cellType}"`);
      const derived =
        row.proximity >= proxCut && row.opportunity >= oppCut
          ? 0
          : row.proximity >= proxCut
            ? 1
            : row.opportunity >= oppCut
              ? 2
              : 3;
      if (derived !== zone) {
        throw new Error(`${id}: cell ${i} classifies as ${derived} but is labelled ${zone}`);
      }
      counts[zone]++;
      popByZone[zone] += row.population;

      return {
        type: 'Feature',
        id: i,
        geometry: trimRings(row.geometry),
        properties: {
          zone,
          cell_type: row.cellType,
          proximity: r1(row.proximity),
          opportunity: r1(row.opportunity),
          population: Math.round(row.population),
        },
      };
    });

    const size = writeJSON(path.join(OUT, 'pov', `${id}.geojson`), {
      type: 'FeatureCollection',
      features,
    });
    const geo = geoCompanion(features, `pov/${id}.geojson`);
    const geoSize = writeJSON(path.join(OUT, 'pov', `${id}.geo.geojson`), geo.collection);
    totalRaw += size.raw + geoSize.raw;
    totalGz += size.gz + geoSize.gz;
    totalCells += features.length;

    const population = Math.round(rows.reduce((s, r) => s + r.population, 0));
    const centre = weightedCentre(rows);
    const [region, regionIt] = REGION[meta.country];

    cities.push({
      id,
      name: meta.name,
      nameIt: meta.nameIt,
      region,
      regionIt,
      center: centre,
      zoom: zoomFor(rows),
      population,
      dataset: `pov/${id}.geojson`,
      // What the dataset's polygons are, and where the other geometry lives.
      geometry: 'cartogram',
      geoDataset: `pov/${id}.geo.geojson`,
      cell: { h3Resolution: 9, cellRadiusM: 200 },
      thresholds: { proximity: r1(proxCut), opportunity: r1(oppCut) },
    });

    // The compare view's row for this city. Medians are per cell; the means
    // are population-weighted, which is the figure that describes a resident
    // rather than a hexagon.
    const sortedProx = rows.map((r) => r.proximity).sort((a, b) => a - b);
    const sortedOpp = rows.map((r) => r.opportunity).sort((a, b) => a - b);
    summaries.push({
      id,
      cells: features.length,
      population,
      medianProximity: r1(sortedProx[sortedProx.length >> 1]),
      medianOpportunity: r1(sortedOpp[sortedOpp.length >> 1]),
      weightedProximity: population
        ? r1(rows.reduce((s, r) => s + r.proximity * r.population, 0) / population)
        : null,
      weightedOpportunity: population
        ? r1(rows.reduce((s, r) => s + r.opportunity * r.population, 0) / population)
        : null,
      zoneShares: counts.map((c) => r1((c / features.length) * 100)),
      // The share of *people*, not cells: isolated cells are large and thinly
      // populated, so the two tell very different stories.
      zonePopulationShares: population
        ? popByZone.map((p) => r1((p / population) * 100))
        : null,
      thresholds: { proximity: r1(proxCut), opportunity: r1(oppCut) },
    });

    if (!VARIANTS.has(id)) {
      // City-level zone: the zone most of this city's residents live in.
      // A modal zone by cell count would read "total isolation" almost
      // everywhere, because isolated cells are large and thinly populated.
      const zone = popByZone.indexOf(Math.max(...popByZone));
      coverage.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: centre },
        properties: {
          id,
          name: meta.name,
          country: meta.country,
          isStudy: true,
          zone,
          population,
          inclusionShare: r1((counts[0] / features.length) * 100),
        },
      });
    }

    console.log(
      `  pov/${id.padEnd(14)} ${String(features.length).padStart(6)} cells  ${mb(size.raw).padStart(8)} → ${mb(size.gz).padStart(8)} gz` +
        `  + ${mb(geoSize.gz)} gz geometry`,
    );
  }

  writeJSON(path.join(OUT, 'pov', 'coverage.geojson'), {
    type: 'FeatureCollection',
    features: coverage,
  });
  writeJSON(path.join(OUT, 'pov', 'summary.json'), summaryFile('pov', summaries));

  return {
    cities,
    coverage: 'pov/coverage.geojson',
    summary: 'pov/summary.json',
    totalRaw,
    totalGz,
    totalCells,
  };
}

/**
 * Check derived hexagons against the ones CDI publishes in hexes.geojson.
 *
 * The geometry written beside a cartogram is generated from an H3 index, not
 * copied from a file, so where upstream states the same hexagon the two must
 * agree. Both the centre and the size are compared: a centroid check alone
 * would pass a cell of the wrong resolution.
 *
 * @returns {string} a short report for the build log
 */
function checkAgainstHexes(file, rows, geo) {
  if (!fs.existsSync(file)) return 'hexes.geojson absent — geometry unchecked';
  const published = new Map();
  for (const feature of JSON.parse(fs.readFileSync(file, 'utf8')).features) {
    if (feature.geometry?.type !== 'Polygon') continue;
    published.set(feature.properties?.id, feature.geometry.coordinates[0]);
  }

  let worstCentre = 0;
  let worstRadius = 0;
  let compared = 0;
  geo.collection.features.forEach((derived, i) => {
    const ring = published.get(rows[i].sourceId);
    if (!ring) return;
    compared++;
    const [ax, ay] = ringCentre(derived.geometry.coordinates[0]);
    const [bx, by] = ringCentre(ring);
    worstCentre = Math.max(worstCentre, metresBetween([ay, ax], [by, bx]));
    worstRadius = Math.max(
      worstRadius,
      Math.abs(ringRadiusM(derived.geometry.coordinates[0]) - ringRadiusM(ring)),
    );
  });

  if (!compared) return 'no ids in common with hexes.geojson — geometry unchecked';
  if (worstCentre > GRID_TOLERANCE_M || worstRadius > GRID_TOLERANCE_M) {
    throw new Error(
      `${file}: derived hexagons disagree with the published ones — ` +
        `centre off by up to ${worstCentre.toFixed(1)} m, radius by ${worstRadius.toFixed(1)} m`,
    );
  }
  return `geometry ✓ ${compared} vs hexes.geojson (≤${Math.max(worstCentre, worstRadius).toFixed(1)} m)`;
}

// ── Car Dependency Index ─────────────────────────────────────────────
function buildCdi(dir) {
  const src = path.join(dir, 'data');
  if (!fs.existsSync(src)) {
    console.log(`CDI source not found at ${src} — skipping`);
    return null;
  }

  const dirs = fs
    .readdirSync(src, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const cities = [];
  const coverage = [];
  const summaries = [];
  let totalRaw = 0;
  let totalGz = 0;
  let totalCells = 0;

  for (const name of dirs) {
    const file = path.join(src, name, 'cartogram.geojson');
    if (!fs.existsSync(file)) {
      console.log(`  cardep/${name}: no cartogram.geojson — skipping`);
      continue;
    }
    const id = slugFor(name);
    const meta = CITIES[id];
    if (!meta) throw new Error(`No metadata for CDI city "${id}" (from ${name})`);

    const input = JSON.parse(fs.readFileSync(file, 'utf8'));
    const rows = input.features
      .filter((f) => Number.isFinite(Number(f.properties.CDI)))
      .map((f) => {
        const p = f.properties;
        const [lon, lat] = ringCentroid(f.geometry);
        return {
          geometry: f.geometry,
          lon,
          lat,
          // Upstream's own cell id, kept only to check the derived hexagon
          // against the hexes.geojson CDI publishes beside the cartogram.
          sourceId: p.id,
          population: Number(p.population) || 0,
          cdi: Number(p.CDI),
          pt: Number(p.o_score_pt),
          car: Number(p.o_score_car),
        };
      });

    const features = rows.map((row, i) => ({
      type: 'Feature',
      id: i,
      geometry: trimRings(row.geometry),
      properties: {
        cdi: r3(row.cdi),
        o_score_pt: r1(row.pt),
        o_score_car: r1(row.car),
        population: Math.round(row.population),
      },
    }));

    const size = writeJSON(path.join(OUT, 'cardep', `${id}.geojson`), {
      type: 'FeatureCollection',
      features,
    });
    const geo = geoCompanion(features, `cardep/${id}.geojson`);
    const geoSize = writeJSON(path.join(OUT, 'cardep', `${id}.geo.geojson`), geo.collection);
    totalRaw += size.raw + geoSize.raw;
    totalGz += size.gz + geoSize.gz;
    totalCells += features.length;
    // CDI is the one platform that publishes the true hexagons as well as the
    // cartogram, so the geometry derived above can be checked rather than
    // trusted: it must reproduce the file upstream ships.
    const checked = checkAgainstHexes(path.join(src, name, 'hexes.geojson'), rows, geo);

    const population = Math.round(rows.reduce((s, r) => s + r.population, 0));
    const centre = weightedCentre(rows);
    const [region, regionIt] = REGION[meta.country];
    // Population-weighted mean: the index for the average resident, which is
    // what the upstream viewer's comparison chart reports.
    const cdi = population
      ? r3(rows.reduce((s, r) => s + r.cdi * r.population, 0) / population)
      : r3(rows.reduce((s, r) => s + r.cdi, 0) / (rows.length || 1));

    cities.push({
      id,
      name: meta.name,
      nameIt: meta.nameIt,
      region,
      regionIt,
      center: centre,
      zoom: zoomFor(rows),
      population,
      dataset: `cardep/${id}.geojson`,
      geometry: 'cartogram',
      geoDataset: `cardep/${id}.geo.geojson`,
      cell: { h3Resolution: 9, cellRadiusM: 200 },
    });

    // The compare view's row. `ptShare`/`carShare` use the same ±0.05 band
    // around zero the upstream viewer calls balanced — a cell that close to
    // zero is not evidence either way.
    const sortedCdi = rows.map((r) => r.cdi).sort((a, b) => a - b);
    summaries.push({
      id,
      cells: features.length,
      population,
      medianCdi: r3(sortedCdi[sortedCdi.length >> 1]),
      weightedCdi: cdi,
      ptShare: r1((rows.filter((r) => r.cdi < -0.05).length / rows.length) * 100),
      carShare: r1((rows.filter((r) => r.cdi > 0.05).length / rows.length) * 100),
      weightedByCar: population
        ? r1(rows.reduce((s, r) => s + r.car * r.population, 0) / population)
        : null,
      weightedByTransit: population
        ? r1(rows.reduce((s, r) => s + r.pt * r.population, 0) / population)
        : null,
      // Share of residents living at or below each index value: a steeper
      // curve is a city where car dependency is more uniform.
      cdf: populationCdf(rows, (r) => r.cdi, -1, 1),
    });

    if (!VARIANTS.has(id)) {
      coverage.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: centre },
        properties: {
          id,
          name: meta.name,
          country: meta.country,
          isStudy: true,
          cdi,
          population,
        },
      });
    }

    console.log(
      `  cardep/${id.padEnd(14)} ${String(features.length).padStart(6)} cells  ${mb(size.raw).padStart(8)} → ${mb(size.gz).padStart(8)} gz  CDI ${cdi >= 0 ? '+' : ''}${cdi}` +
        `  ${checked}`,
    );
  }

  writeJSON(path.join(OUT, 'cardep', 'coverage.geojson'), {
    type: 'FeatureCollection',
    features: coverage,
  });
  writeJSON(path.join(OUT, 'cardep', 'summary.json'), summaryFile('cardep', summaries));

  return {
    cities,
    coverage: 'cardep/coverage.geojson',
    summary: 'cardep/summary.json',
    totalRaw,
    totalGz,
    totalCells,
  };
}

// ── 15minCity ────────────────────────────────────────────────────────
// The legacy site stores one hexes.geojson per city under data/<id>/hexes.zip.
// This reads an unpacked tree: <dir>/hexes/hexes.geojson, which is Rome.
//
// Each cell carries 10 service categories × 2 modes in minutes, plus a
// `d_<cat>_<mode>` difference against the "ideal city" scenario. All 40 are
// kept — they are the whole point of the platform's controls — but rounded to
// one decimal, which is well inside the precision of a travel-time model.
const FIFTEEN_CATEGORIES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l'];
const FIFTEEN_MODES = ['f', 'b'];

function buildFifteen(dir, cityId = 'rome') {
  const file = path.join(dir, 'hexes', 'hexes.geojson');
  if (!fs.existsSync(file)) {
    console.log(`15minCity source not found at ${file} — skipping`);
    return null;
  }
  const meta = CITIES[cityId];
  const input = JSON.parse(fs.readFileSync(file, 'utf8'));

  let population = 0;
  const rows = [];
  const radii = [];
  const features = input.features.map((f, i) => {
    const p = f.properties;
    if (Number.isFinite(Number(p.radius))) radii.push(Number(p.radius));
    const props = { pop: Math.round(Number(p.population) || 0) };
    for (const cat of FIFTEEN_CATEGORIES) {
      for (const mode of FIFTEEN_MODES) {
        const key = `${cat}_${mode}`;
        if (Number.isFinite(Number(p[key]))) props[key] = r1(Number(p[key]));
        const diff = `d_${cat}_${mode}`;
        if (Number.isFinite(Number(p[diff]))) props[diff] = r1(Number(p[diff]));
      }
    }
    population += props.pop;
    rows.push({
      lon: Number(p.centroid_lon),
      lat: Number(p.centroid_lat),
      population: props.pop,
      value: Number(p.a_f),
    });
    return { type: 'Feature', id: i, geometry: trimRings(f.geometry), properties: props };
  });

  const size = writeJSON(path.join(OUT, 'fifteen', `${cityId}.geojson`), {
    type: 'FeatureCollection',
    features,
  });
  console.log(
    `  fifteen/${cityId.padEnd(12)} ${String(features.length).padStart(6)} cells  ${mb(size.raw).padStart(8)} → ${mb(size.gz).padStart(8)} gz`,
  );

  const centre = weightedCentre(rows);
  const [region, regionIt] = REGION[meta.country];
  // Coverage colours cities by average walking time to all services, which is
  // what the platform's legend measures.
  const proximityMinutes = r1(
    weightedMedian(rows.map((r) => r.value), rows.map((r) => r.population)),
  );

  writeJSON(path.join(OUT, 'fifteen', 'coverage.geojson'), {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: centre },
        properties: {
          id: cityId,
          name: meta.name,
          country: meta.country,
          isStudy: true,
          proximityMinutes,
          population,
        },
      },
    ],
  });

  return {
    cities: [
      {
        id: cityId,
        name: meta.name,
        nameIt: meta.nameIt,
        region,
        regionIt,
        center: centre,
        zoom: zoomFor(rows),
        population,
        dataset: `fifteen/${cityId}.geojson`,
        // 15minCity publishes the cells where they are; there is no
        // population-scaled cartogram of it to switch to.
        geometry: 'geographic',
        // The legacy meshes are NOT H3: their cell centroids share only ~8%
        // of positions with the H3 r9 grid the other platforms use, which is
        // chance rather than alignment. Claim the measured cell size and
        // nothing more — a null resolution makes the map caption omit it
        // rather than assert a grid this data is not on. Cities exported onto
        // the standard H3 grid should set h3Resolution here.
        cell: {
          h3Resolution: null,
          cellRadiusM: radii.length
            ? Math.round(radii.sort((a, b) => a - b)[radii.length >> 1])
            : null,
        },
      },
    ],
    coverage: 'fifteen/coverage.geojson',
    totalRaw: size.raw,
    totalGz: size.gz,
    totalCells: features.length,
  };
}

// ── Run ──────────────────────────────────────────────────────────────
console.log('Building published data\n');

console.log('P.O.V.');
const pov = buildPov(POV_DIR);
console.log('\nCar Dependency Index');
const cdi = buildCdi(CDI_DIR);
console.log('\n15minCity');
const fifteen = buildFifteen(FIFTEEN_DIR);

// Merge into the catalogue, leaving platforms this script did not touch alone.
const cataloguePath = path.join(OUT, 'index.json');
const existing = fs.existsSync(cataloguePath)
  ? JSON.parse(fs.readFileSync(cataloguePath, 'utf8'))
  : { version: 1, platforms: {} };

const catalogue = {
  ...existing,
  version: 1,
  platforms: {
    ...existing.platforms,
    ...(pov
      ? { pov: { coverage: pov.coverage, summary: pov.summary, cities: pov.cities } }
      : {}),
    ...(cdi
      ? { cardep: { coverage: cdi.coverage, summary: cdi.summary, cities: cdi.cities } }
      : {}),
    ...(fifteen ? { fifteen: { coverage: fifteen.coverage, cities: fifteen.cities } } : {}),
  },
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(cataloguePath, `${JSON.stringify(catalogue, null, 2)}\n`);

// ── Derived figures, for src/data/home.js and platforms.js ───────────
const all = [...(pov?.cities ?? []), ...(cdi?.cities ?? []), ...(fifteen?.cities ?? [])];
const distinct = new Set(all.filter((c) => !VARIANTS.has(c.id)).map((c) => c.id));
const countries = new Set([...distinct].map((id) => CITIES[id].country));
const cells = (pov?.totalCells ?? 0) + (cdi?.totalCells ?? 0) + (fifteen?.totalCells ?? 0);

console.log('\n─────────────────────────────────────────────');
console.log('Figures for src/data/home.js and platforms.js');
console.log('─────────────────────────────────────────────');
console.log(`  cities (distinct, excl. variants) : ${distinct.size}`);
console.log(`  countries                         : ${countries.size}  [${[...countries].sort().join(' ')}]`);
console.log(`  hexagonal cells                   : ${cells.toLocaleString('en-GB')}`);
console.log(`  pov.cityCount                     : ${pov?.cities.length ?? 0}`);
console.log(`  cardep.cityCount                  : ${cdi?.cities.length ?? 0}`);
console.log(`  fifteen.cityCount                 : ${fifteen?.cities.length ?? 0}`);
console.log(
  `\n  published bytes: ${mb(
    (pov?.totalRaw ?? 0) + (cdi?.totalRaw ?? 0) + (fifteen?.totalRaw ?? 0),
  )} raw → ${mb(
    (pov?.totalGz ?? 0) + (cdi?.totalGz ?? 0) + (fifteen?.totalGz ?? 0),
  )} over the wire`,
);
