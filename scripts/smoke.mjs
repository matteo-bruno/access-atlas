// End-to-end smoke test: loads every route in a real browser and asserts the
// pages render, the maps rasterise, the Rome mesh computes, and EN ⇄ IT works.
//
// Playwright is not a project dependency — install it when you want to run this:
//
//   npm install --no-save playwright && npx playwright install chromium
//   npm run build && npm run preview -- --port 4321 &
//   npm run smoke
//
// Override the browser binary with PLAYWRIGHT_CHROMIUM_PATH, and the target
// with SMOKE_URL.

import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4321';

const ROUTES = [
  ['/', 'Home'],
  ['/platforms', 'All-platforms world map'],
  ['/platforms/15min-city', '15min-City landing'],
  ['/platforms/citychrone', 'CityChrone landing'],
  ['/platforms/car-dependency-index', 'Car Dependency landing'],
  ['/platforms/accessibility-pov', 'P.O.V. landing'],
  ['/platforms/accessibility-pov/rome', 'Rome P.O.V. city page'],
  ['/platforms/car-dependency-index/rome', 'Rome Car Dependency city page'],
  ['/platforms/15min-city/rome', 'Rome 15min-City city page (seeded)'],
  ['/platforms/15min-city/milan', 'Milan 15min-City city page'],
  ['/atlas/milan', 'Milan combined viewer'],
  ['/atlas/milan?layer=citychrone&view=isochrone', 'Milan combined viewer, CityChrone isochrones'],
  ['/research', 'Research'],
  ['/blog', 'Blog index'],
  ['/blog/what-the-atlas-measures', 'Blog post'],
  ['/work-with-us', 'Work with us'],
  ['/faq', 'FAQ'],
  ['/contact', 'Contact'],
  ['/nope', '404 fallback'],
];

// Rome as published in public/data/pov/rome.geojson. Proximity and opportunity
// are median scores — weighted counts of reachable points of interest — so
// they carry no unit, which is why neither is asserted with one.
const ROME_EXPECTED = {
  zones: ['12.9%', '2.7%', '1.4%', '83.0%'],
  hexagons: '8,089',
  proximity: '643.6',
  opportunity: '2,656.6',
  population: '2.6 M',
};

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

// ── Every route renders without console or network errors ────────────
for (const [route, name] of ROUTES) {
  const page = await context.newPage();
  const errors = [];
  const badResponses = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('response', (r) => r.status() >= 400 && badResponses.push(`${r.status()} ${r.url()}`));

  await page.goto(BASE + route, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  // Scroll so lazily-initialised map thumbnails build their contexts.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => ({
    mounted: (document.getElementById('root')?.children.length ?? 0) > 0,
    text: document.body.innerText.length,
    canvases: document.querySelectorAll('canvas').length,
  }));

  check(
    `Renders: ${name}`,
    info.mounted && info.text > 200 && errors.length === 0 && badResponses.length === 0,
    `canvas=${info.canvases} text=${info.text}`,
  );
  errors.slice(0, 3).forEach((e) => console.log(`        console: ${e.slice(0, 180)}`));
  badResponses.slice(0, 3).forEach((u) => console.log(`        http:    ${u.slice(0, 180)}`));
  await page.close();
}

// ── The map actually rasterises land and city markers ────────────────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/platforms/15min-city`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  // MapLibre runs with preserveDrawingBuffer:false, so reading the canvas back
  // in-page always yields blank — screenshot the composited result instead.
  const shot = await page.locator('.aa-mapstage').screenshot();
  const distinct = await page.evaluate(async (bytes) => {
    const bmp = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const data = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
    const seen = new Set();
    for (let i = 0; i < data.length; i += 4 * 331) {
      seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    }
    return seen.size;
  }, Array.from(shot));
  check('Map rasterises land + city markers', distinct > 10, `${distinct} distinct colours`);
  await page.close();
}

// ── Rome mesh: computed in the worker, matching the published figures ─
{
  const page = await context.newPage();
  await page.goto(`${BASE}/platforms/accessibility-pov/rome`, { waitUntil: 'load' });
  await page.waitForTimeout(4000);

  const zones = await page.$$eval('.aa-zones__pct', (els) => els.map((e) => e.textContent.trim()));
  const summary = await page.$$eval('.aa-summary__row dd', (els) =>
    els.map((e) => e.textContent.trim()),
  );
  const points = await page.$$eval('.aa-scatter circle', (els) => els.length);

  check(
    'Rome zone shares match published figures',
    zones.join(' ') === ROME_EXPECTED.zones.join(' '),
    zones.join(' / '),
  );
  check(
    'Rome summary matches published figures',
    summary[0] === ROME_EXPECTED.hexagons &&
      summary[1] === ROME_EXPECTED.proximity &&
      summary[2] === ROME_EXPECTED.opportunity &&
      summary[3] === ROME_EXPECTED.population,
    summary.join(' | '),
  );
  check('Rome scatter plotted', points > 400, `${points} points`);
  await page.close();
}

// ── The Car Dependency city page reads the same city, differently ────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/platforms/car-dependency-index/rome`, { waitUntil: 'load' });
  await page.waitForTimeout(4000);

  const summary = await page.$$eval('.aa-summary__row dd', (els) =>
    els.map((e) => e.textContent.trim()),
  );
  // The index is continuous, so the panel states its scale as a ramp rather
  // than a share per band — ±1 are the bounds of the index's own definition.
  const ticks = await page.$$eval('.aa-ramp__tick', (els) => els.map((e) => e.textContent.trim()));
  check(
    'Car Dependency states the bounded index as a ramp',
    ticks.length === 5 && /^−1/.test(ticks[0]) && /^\+1/.test(ticks[4]),
    ticks.join(' / '),
  );
  check('Car Dependency cell count from the published file', summary[0] === '11,409', summary[0]);
  // The index is signed; losing the sign would invert the reading entirely.
  check(
    'Car Dependency index keeps its sign',
    /^[+−]/.test(summary[1]) && /^[+−]/.test(summary[2]),
    `${summary[1]} | ${summary[2]}`,
  );
  await page.close();
}

// ── The combined viewer: one mesh, four layers, state in the URL ─────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/atlas/milan`, { waitUntil: 'load' });
  await page.waitForTimeout(6000);

  // 7,637 is the union mesh's cell count — a figure the seed data cannot
  // produce, so its presence is provenance, not luck.
  const summary = await page.$$eval('.aa-summary__row dd', (els) =>
    els.map((e) => e.textContent.trim()),
  );
  check('Combined viewer reads the union mesh', summary[0] === '7,637', summary[0]);
  check(
    'P.O.V. layer states its mask honestly',
    summary[1] === '1,636',
    summary[1],
  );

  const layers = await page.$$eval('.aa-layers__row', (els) =>
    els.map((e) => ({ text: e.textContent.trim(), disabled: e.disabled })),
  );
  // The four platforms, plus population as context — all enabled for a city
  // on the shared grid.
  check(
    'All four platform layers are offered and enabled, plus population',
    layers.length === 5 && layers.every((l) => !l.disabled),
    layers.map((l) => `${l.text}${l.disabled ? ' (off)' : ''}`).join(' · '),
  );

  // P.O.V. is the categorical layer, so it is the one that still lists shares.
  const shares = await page.$$eval('.aa-bands__pct', (els) => els.map((e) => e.textContent.trim()));
  const total = shares.reduce((sum, b) => sum + (parseFloat(b) || 0), 0);
  check(
    'P.O.V. zone shares cover every measured cell',
    shares.length === 4 && Math.abs(total - 100) < 0.5,
    `${shares.join(' / ')} = ${total.toFixed(1)}`,
  );

  await page.click('.aa-layers__row:has-text("CityChrone")');
  await page.waitForTimeout(4000);
  // Continuous layers state their scale as a ramp, not as bands: the hourly
  // join has happened once the velocity figure is on the panel.
  const ticks = await page.$$eval('.aa-ramp__tick', (els) => els.map((e) => e.textContent.trim()));
  const ccSummary = await page.$$eval('.aa-summary__row dd', (els) =>
    els.map((e) => e.textContent.trim()),
  );
  check(
    'CityChrone hourly layer renders with the layer in the URL',
    page.url().includes('layer=citychrone') &&
      ticks.join(' ') === '0 3 6 9 12' &&
      /km\/h/.test(ccSummary.join(' ')),
    `${page.url().split('/atlas/')[1]} · ticks ${ticks.join(' ')} · ${ccSummary.join(' | ')}`,
  );

  // Population is drawn from the union mesh rather than a platform dataset.
  await page.click('.aa-layers__row:has-text("Population")');
  await page.waitForTimeout(3000);
  const popTicks = await page.$$eval('.aa-ramp__tick', (els) =>
    els.map((e) => e.textContent.trim()),
  );
  check(
    'Population layer draws from the union mesh',
    page.url().includes('layer=population') && popTicks.length > 0,
    `${page.url().split('/atlas/')[1]} · ticks ${popTicks.join(' ')}`,
  );
  await page.close();
}

// ── The world map switches between platforms ─────────────────────────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/platforms`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const items = await page.$$eval('.aa-picker__item', (els) => els.map((e) => e.textContent.trim()));
  const allLegend = await page.$$eval('.aa-legend__item', (els) =>
    els.map((e) => e.textContent.trim()),
  );
  check(
    'World map offers all four platforms plus the combined coverage',
    items.length === 5,
    items.join(' · '),
  );

  await page.click('.aa-picker__item:has-text("Car Dependency")');
  await page.waitForTimeout(2500);
  const cdiLegend = await page.$$eval('.aa-legend__item', (els) =>
    els.map((e) => e.textContent.trim()),
  );
  // Picking a platform has to change both the URL and what the legend claims
  // — the point of the switcher is that each map is on its own scale.
  check(
    'Picking a platform swaps the city set and its legend',
    page.url().endsWith('/platforms/car-dependency-index') &&
      cdiLegend.join(' ') !== allLegend.join(' '),
    `${allLegend.join('/')} → ${cdiLegend.join('/')}`,
  );
  await page.close();
}

// ── City search navigates to a city page ─────────────────────────────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/platforms/accessibility-pov`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.fill('.aa-search__input', 'rom');
  await page.waitForTimeout(300);
  const results = await page.$$eval('.aa-search__result', (els) => els.length);
  await page.click('.aa-search__result');
  await page.waitForTimeout(1500);
  check('Search finds and opens Rome', results > 0 && page.url().endsWith('/rome'), page.url());
  await page.close();
}

// ── EN ⇄ IT ──────────────────────────────────────────────────────────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const en = await page.$eval('h1', (e) => e.textContent.trim());
  // Read every metric, not just the first: only values above 999 pick up a
  // thousands separator, and which metrics the home page shows can change.
  const enMetric = await page.$$eval('.aa-metrics__value', (els) =>
    els.map((e) => e.textContent.trim()).join(' '),
  );

  await page.click('.aa-nav__langbtn:not(.aa-nav__langbtn--active)');
  await page.waitForTimeout(700);
  const it = await page.$eval('h1', (e) => e.textContent.trim());
  const itMetric = await page.$$eval('.aa-metrics__value', (els) =>
    els.map((e) => e.textContent.trim()).join(' '),
  );
  const lang = await page.evaluate(() => document.documentElement.lang);

  check('Locale swaps copy', en !== it, `${en} → ${it}`);
  check('Locale swaps number formatting', enMetric !== itMetric, `${enMetric} → ${itMetric}`);
  check('Locale updates <html lang>', lang === 'it');

  await page.goto(`${BASE}/faq`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const faq = await page.$eval('h1', (e) => e.textContent.trim());
  check('Locale persists across routes', /ricorrenti/i.test(faq), faq.replace(/\n/g, ' '));
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll smoke checks passed');
process.exit(failures ? 1 : 0);
