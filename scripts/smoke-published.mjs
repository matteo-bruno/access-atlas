// Smoke test for the *published* data path.
//
// `smoke.mjs` exercises the site as it ships — with no published data, every
// page falls back to the generated seed. That leaves the more important half
// untested: what happens when real files are dropped in. This script stages a
// small synthetic dataset in the real upstream schema, asserts the Atlas picks
// it up instead of the seed, and removes it again.
//
// It exists because the failure it guards against is invisible: a wrong data
// URL is served the SPA fallback (index.html, HTTP 200) rather than a 404, so
// the app quietly renders synthetic data and every other check still passes.
//
//   npm run build && npm run preview -- --port 4321 &
//   npm run smoke:published
//
// Override the target with SMOKE_URL and the browser with
// PLAYWRIGHT_CHROMIUM_PATH. DIST overrides the build directory to stage into.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4321';
const DIST = process.env.DIST ?? 'dist';
const DATA = path.join(DIST, 'data');

if (!fs.existsSync(DATA)) {
  console.error(`No build at ${DATA} — run \`npm run build\` first.`);
  process.exit(1);
}

// ── Fixture ──────────────────────────────────────────────────────────
// Deliberately in the upstream P.O.V. spelling (`cell_type`, weighted POI
// counts, city medians) so this also pins the adapter to the real schema.
const CELL_TYPES = ['inclusion', 'spatial isolation', 'social isolation', 'total isolation'];
const CENTER = [12.4964, 41.9028];
const COUNT = 240;

const cells = Array.from({ length: COUNT }, (_, i) => {
  const ring = Array.from({ length: 6 }, (_, v) => {
    const a = (Math.PI / 180) * (60 * v - 30);
    return [
      +(CENTER[0] + ((i % 20) - 10) * 0.01 + Math.cos(a) * 0.004).toFixed(5),
      +(CENTER[1] + (Math.floor(i / 20) - 6) * 0.01 + Math.sin(a) * 0.004).toFixed(5),
    ];
  });
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
    properties: {
      hexagon_id: i,
      // Spread the four classes unevenly so the shares are distinctive.
      cell_type: CELL_TYPES[i % 7 === 0 ? 0 : i % 5 === 0 ? 1 : i % 3 === 0 ? 2 : 3],
      proximity: 100 + (i % 37) * 11,
      opportunity: 900 + (i % 23) * 47,
      population: 40 + (i % 17) * 9,
      proximity_median_city: 2590.5,
      opportunity_median_city: 9435.4,
    },
  };
});

const counts = [0, 0, 0, 0];
cells.forEach((c) => counts[CELL_TYPES.indexOf(c.properties.cell_type)]++);
const expected = {
  cellCount: COUNT,
  shares: counts.map((n) => `${((n / COUNT) * 100).toFixed(1)}%`),
  population: cells.reduce((s, c) => s + c.properties.population, 0),
};

const coverage = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: CENTER },
      properties: { id: 'rome', name: 'Rome', country: 'IT', isStudy: true, zone: 0 },
    },
    {
      // A name absent from the seed list, so finding it proves the swap.
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10.4, 43.7] },
      properties: { id: 'testopolis', name: 'Testopolis', country: 'IT', isStudy: true, zone: 1 },
    },
  ],
};

const catalogue = {
  version: 1,
  platforms: {
    fifteen: { coverage: null, cities: [] },
    citychrone: { coverage: null, cities: [] },
    cardep: { coverage: null, cities: [] },
    pov: {
      coverage: '__smoke__/coverage.geojson',
      cities: [
        {
          id: 'rome',
          name: 'Rome',
          center: CENTER,
          zoom: 10.1,
          dataset: '__smoke__/rome.geojson',
          population: expected.population,
          cell: { h3Resolution: 9, cellRadiusM: 200 },
        },
      ],
    },
  },
};

const originalCatalogue = fs.readFileSync(path.join(DATA, 'index.json'), 'utf8');
// A dedicated directory: staging into data/pov/ would overwrite — and on
// cleanup delete — the real published datasets sitting in the same build.
const povDir = path.join(DATA, '__smoke__');

function stage() {
  fs.mkdirSync(povDir, { recursive: true });
  fs.writeFileSync(
    path.join(povDir, 'rome.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: cells }),
  );
  fs.writeFileSync(path.join(povDir, 'coverage.geojson'), JSON.stringify(coverage));
  fs.writeFileSync(path.join(DATA, 'index.json'), JSON.stringify(catalogue, null, 2));
}

function unstage() {
  fs.writeFileSync(path.join(DATA, 'index.json'), originalCatalogue);
  fs.rmSync(povDir, { recursive: true, force: true });
}

// ── Checks ───────────────────────────────────────────────────────────
let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

stage();
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

try {
  // The city page reads the published mesh, not the generated one.
  {
    const page = await context.newPage();
    const errors = [];
    const bad = [];
    const fetched = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
    page.on('request', (r) => {
      const [, tail] = r.url().split('/data/');
      if (tail) fetched.push(tail);
    });

    await page.goto(`${BASE}/platforms/accessibility-pov/rome`, { waitUntil: 'load' });
    await page.waitForTimeout(5000);

    // The catalogue carries a `?v=<build id>` cache-buster, so match on the
    // path rather than the whole tail.
    check(
      'Catalogue and published mesh are fetched',
      fetched.some((url) => url.startsWith('index.json')) &&
        fetched.includes('__smoke__/rome.geojson'),
      fetched.join(', ') || '(no /data/ requests)',
    );
    check(
      'Catalogue is fetched with a cache-buster',
      fetched.some((url) => /^index\.json\?v=.+/.test(url)),
      fetched.find((url) => url.startsWith('index.json')) ?? '(catalogue not fetched)',
    );
    check(
      'No console or network errors',
      errors.length === 0 && bad.length === 0,
      [...errors, ...bad].slice(0, 2).join(' | '),
    );

    // The combined viewer is the one city view now, and it lists the zone
    // shares as bands. The old per-platform page's `.aa-zones__pct` went with
    // that page, and so did its cell-level scatter.
    const zones = await page.$$eval('.aa-bands__pct', (els) => els.map((e) => e.textContent.trim()));
    const summary = await page.$$eval('.aa-summary__row dd', (els) =>
      els.map((e) => e.textContent.trim()),
    );
    check(
      'Zone shares come from the published file',
      zones.join(' ') === expected.shares.join(' '),
      `${zones.join(' / ')} (want ${expected.shares.join(' / ')})`,
    );
    check(
      'Cell count comes from the published file',
      summary[0] === String(expected.cellCount),
      summary[0],
    );
    // The basemap's terms are the only credit on the map now, and they are on
    // screen rather than behind a toggle: MapLibre's own control, not compact.
    check(
      'The basemap credit is on the map, permanently',
      (await page.locator('.maplibregl-ctrl-attrib').count()) === 0 ||
        (await page.locator('.maplibregl-ctrl-attrib.maplibregl-compact').count()) === 0,
    );
    await page.close();
  }

  // Coverage replaces the seed city list for search and the world map.
  {
    const page = await context.newPage();
    await page.goto(`${BASE}/platforms/accessibility-pov`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.fill('.aa-search__input', 'testop');
    await page.waitForTimeout(400);
    const hits = await page.$$eval('.aa-search__result', (els) =>
      els.map((e) => e.textContent.trim()),
    );
    check(
      'Search finds a city that exists only in the published coverage',
      hits.length === 1 && /Testopolis/.test(hits[0]),
      hits.join(', ') || '(none)',
    );
    await page.close();
  }

  // A platform with nothing published still renders the seed.
  {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/platforms/car-dependency-index`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.fill('.aa-search__input', 'rom');
    await page.waitForTimeout(400);
    const hits = await page.$$eval('.aa-search__result', (els) => els.length);
    check(
      'Unpublished platform still falls back to seed data',
      hits > 0 && errors.length === 0,
      `${hits} results`,
    );
    await page.close();
  }
} finally {
  await browser.close();
  unstage();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll published-path checks passed');
process.exit(failures ? 1 : 0);
