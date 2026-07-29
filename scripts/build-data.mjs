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

// ── P.O.V. ───────────────────────────────────────────────────────────
function buildPov(dir) {
  const src = path.join(dir, 'data');
  if (!fs.existsSync(src)) {
    console.log(`P.O.V. source not found at ${src} — skipping`);
    return null;
  }

  const files = fs.readdirSync(src).filter((f) => f.endsWith('_cartogram.geojson')).sort();
  const cities = [];
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
    totalRaw += size.raw;
    totalGz += size.gz;
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
      cell: { h3Resolution: 9, cellRadiusM: 200 },
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
      `  pov/${id.padEnd(14)} ${String(features.length).padStart(6)} cells  ${mb(size.raw).padStart(8)} → ${mb(size.gz).padStart(8)} gz`,
    );
  }

  writeJSON(path.join(OUT, 'pov', 'coverage.geojson'), {
    type: 'FeatureCollection',
    features: coverage,
  });

  return { cities, coverage: 'pov/coverage.geojson', totalRaw, totalGz, totalCells };
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
    totalRaw += size.raw;
    totalGz += size.gz;
    totalCells += features.length;

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
      cell: { h3Resolution: 9, cellRadiusM: 200 },
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
      `  cardep/${id.padEnd(14)} ${String(features.length).padStart(6)} cells  ${mb(size.raw).padStart(8)} → ${mb(size.gz).padStart(8)} gz  CDI ${cdi >= 0 ? '+' : ''}${cdi}`,
    );
  }

  writeJSON(path.join(OUT, 'cardep', 'coverage.geojson'), {
    type: 'FeatureCollection',
    features: coverage,
  });

  return { cities, coverage: 'cardep/coverage.geojson', totalRaw, totalGz, totalCells };
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
  const features = input.features.map((f, i) => {
    const p = f.properties;
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
        cell: { h3Resolution: 9, cellRadiusM: 200 },
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
  version: 1,
  platforms: {
    ...existing.platforms,
    ...(pov ? { pov: { coverage: pov.coverage, cities: pov.cities } } : {}),
    ...(cdi ? { cardep: { coverage: cdi.coverage, cities: cdi.cities } } : {}),
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
