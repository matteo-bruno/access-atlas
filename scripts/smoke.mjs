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
// Plain module, no dependencies — the checks below reproject against the very
// constants the app frames its coverage maps with.
import { WORLD_CENTER, WORLD_ZOOM_BOOST } from '../src/map/framing.js';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4321';

const ROUTES = [
  ['/', 'Landing'],
  ['/overview', 'The previous home page, still routed'],
  ['/platforms', 'All-platforms world map'],
  ['/platforms/15min-city', '15-minute city landing'],
  ['/platforms/citychrone', 'CityChrone landing'],
  ['/platforms/car-dependency-index', 'Car Dependency landing'],
  ['/platforms/accessibility-pov', 'P.O.V. landing'],
  ['/platforms/accessibility-pov/compare', 'P.O.V. city comparison'],
  ['/platforms/car-dependency-index/compare', 'Car Dependency city comparison'],
  // One city view now. The per-platform city URLs are still in the wild, so
  // they forward to it rather than 404.
  ['/platforms/accessibility-pov/rome', 'Old P.O.V. city URL (forwards)'],
  ['/atlas/rome?layer=pov', 'Rome, P.O.V. layer'],
  ['/atlas/rome?layer=cardep', 'Rome, Car Dependency layer'],
  ['/atlas/milan', 'Milan combined viewer'],
  ['/atlas/milan?layer=citychrone&view=isochrone', 'Milan combined viewer, CityChrone isochrones'],
  ['/sustainable-cities', 'Sustainable cities — who we are'],
  ['/stats', 'Stats — the comparison screen, before it exists'],
  ['/consulting', 'Consulting'],
  ['/research', 'Research'],
  ['/blog', 'Blog index'],
  ['/blog/what-the-atlas-measures', 'Blog post'],
  ['/blog/layer-15-minute-city', 'Layer post — 15-minute city'],
  ['/blog/layer-accessibility-pov', 'Layer post — P.O.V.'],
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
  // Rome is not on the shared grid, so the viewer swaps in P.O.V.'s own mesh
  // rather than repainting a union one — the legacy path, still in service.
  await page.goto(`${BASE}/atlas/rome?layer=pov`, { waitUntil: 'load' });
  await page.waitForTimeout(4500);

  const zones = await page.$$eval('.aa-bands__pct', (els) => els.map((e) => e.textContent.trim()));
  const summary = await page.$$eval('.aa-summary__row dd', (els) =>
    els.map((e) => e.textContent.trim()),
  );

  check(
    'Rome zone shares match published figures',
    zones.join(' ') === ROME_EXPECTED.zones.join(' '),
    zones.join(' / '),
  );
  check(
    'Rome reads its own published mesh',
    summary[0] === ROME_EXPECTED.hexagons && summary.at(-1) === ROME_EXPECTED.population,
    summary.join(' | '),
  );
  await page.close();
}

// ── The Car Dependency city page reads the same city, differently ────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/atlas/rome?layer=cardep`, { waitUntil: 'load' });
  await page.waitForTimeout(4500);

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
    /^[+−]/.test(summary[1]),
    summary.join(' | '),
  );
  await page.close();
}

// ── The combined viewer: one mesh, four layers, state in the URL ─────
{
  const page = await context.newPage();
  // The viewer opens on 15-minute city; this block is about P.O.V.'s mask and
  // its shares, so it asks for that layer rather than assuming the default.
  await page.goto(`${BASE}/atlas/milan?layer=pov`, { waitUntil: 'load' });
  await page.waitForTimeout(6000);

  // The summary describes the layer on screen, not the union beneath it: the
  // count beside a figure has to be the count that figure came from. 1,636
  // cells over 170 km² is P.O.V.'s mask, and neither is a figure the seed
  // data can produce — their presence is provenance, not luck.
  const summary = await page.$$eval('.aa-summary__row dd', (els) =>
    els.map((e) => e.textContent.trim()),
  );
  check(
    'The summary states the layer’s own mask, in cells and on the ground',
    summary[0] === '1,636' && summary[1] === '170 km²',
    summary.join(' | '),
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
  check(
    'Search finds and opens Rome, on the platform’s layer',
    results > 0 && /\/atlas\/rome\?layer=pov$/.test(page.url()),
    page.url(),
  );
  await page.close();
}

// ── Map ⇄ cartogram ──────────────────────────────────────────────────
// The switch is a change of what a polygon claims, not a display preference,
// so what is asserted here is the claim: that the companion is fetched only
// when asked for, that the caption says which of the two is on screen, and
// that a platform publishing no cartogram says so instead of hiding the
// option — an absent view and an unbuilt one look identical otherwise.
{
  const page = await context.newPage();
  const requested = [];
  page.on('request', (r) => requested.push(r.url()));

  await page.goto(`${BASE}/atlas/milan?layer=pov`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  check(
    'The cartogram is not fetched until it is asked for',
    requested.filter((u) => u.includes('cartogram')).length === 0,
  );

  await page.getByRole('button', { name: 'Cartogram', exact: true }).click();
  await page.waitForTimeout(2500);
  const pressed = await page
    .getByRole('button', { name: 'Cartogram', exact: true })
    .getAttribute('aria-pressed');
  check(
    'Switching to the cartogram loads the one P.O.V. publishes',
    requested.filter((u) => u.includes('cartogram-pov')).length === 1 && pressed === 'true',
  );

  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.waitForTimeout(800);
  check(
    'And back to the hexagons',
    (await page.getByRole('button', { name: 'Map', exact: true }).getAttribute('aria-pressed')) ===
      'true',
  );
  await page.close();
}

{
  const page = await context.newPage();
  const requested = [];
  page.on('request', (r) => requested.push(r.url()));
  await page.goto(`${BASE}/atlas/milan`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  await page.getByRole('button', { name: 'Cartogram', exact: true }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Car Dependency Index' }).click();
  await page.waitForTimeout(2200);

  // No layer reuses another's cartogram: the two published ones disagree by
  // up to 9.6 m on cells they share, and the derived ones are per platform
  // too. Switching layer in cartogram view therefore fetches a second file,
  // and the choice survives the switch.
  const stillCartogram = await page
    .getByRole('button', { name: 'Cartogram', exact: true })
    .getAttribute('aria-pressed');
  check(
    'The combined viewer switches geometry per layer',
    stillCartogram === 'true' &&
      requested.filter((u) => u.includes('cartogram-fifteen')).length === 1 &&
      requested.filter((u) => u.includes('cartogram-cardep')).length === 1,
    requested.filter((u) => u.includes('cartogram-')).map((u) => u.split('/').pop()).join(' '),
  );
  await page.close();
}

// ── The combined viewer's defaults and detail ────────────────────────
// Opens on proximity, offers the cartogram on every layer (two platforms
// publish one, two are the Atlas's own), answers a click with all ten
// categories at once, and keeps the long explanation behind "full
// explanation" rather than in the panel.
{
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));

  await page.goto(`${BASE}/atlas/milan`, { waitUntil: 'load' });
  await page.waitForTimeout(3200);
  const opening = await page.locator('.aa-layers__row--active').innerText();
  const cartogramOffered = !(await page.getByRole('button', { name: /^Cartogram/ }).isDisabled());
  check(
    'The combined viewer opens on 15-minute city, with a cartogram to switch to',
    /15-minute city/.test(opening) && cartogramOffered,
    opening.replace(/\s+/g, ' '),
  );

  const box = await page.locator('canvas').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(900);
  check(
    'A selected cell answers every category at once',
    (await page.locator('.aa-catbars__row').count()) === 10,
  );

  await page.getByRole('button', { name: /About this layer/ }).click();
  await page.waitForTimeout(500);
  const modal = (await page.locator('.aa-modal__body').innerText()).toLowerCase();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(
    'The full explanation opens in a dialog and Escape closes it',
    /reading the map/.test(modal) &&
      /data & methods/.test(modal) &&
      (await page.locator('.aa-modal').count()) === 0,
  );
  check('No console errors in the combined viewer', errors.length === 0, errors.slice(0, 2).join(' | '));
  await page.close();
}

{
  const page = await context.newPage();
  const requested15 = [];
  page.on('request', (r) => requested15.push(r.url()));
  await page.goto(`${BASE}/atlas/milan`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Cartogram', exact: true }).click();
  await page.waitForTimeout(2500);
  // 15-minute city publishes no cartogram; this one is the Atlas's own, and
  // the viewer has to draw it as readily as a published one.
  check(
    '15-minute city can be drawn as a cartogram too',
    requested15.filter((u) => u.includes('cartogram-fifteen')).length === 1,
  );
  await page.close();
}

// ── Compare cities ───────────────────────────────────────────────────
// The screen both upstream viewers end on. Every figure comes from the
// published summary file rather than being recomputed in the browser, so what
// is checked is that the page reproduces the published numbers — and that the
// cells/residents switch actually changes them, since that difference is the
// reason both are published.
{
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));

  await page.goto(`${BASE}/platforms/car-dependency-index/compare`, { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  const rows = await page.locator('.aa-compare__table tbody tr').count();
  const bars = await page.locator('.aa-bars__row').count();
  const curves = await page.locator('.aa-cdf polyline').count();
  const milan = await page
    .locator('.aa-compare__table tbody tr', { hasText: 'Milan' })
    .first()
    .innerText();
  check(
    'Car Dependency compares all 22 cities on its published figures',
    rows === 22 && bars === 22 && curves === 22 && /1,741/.test(milan) && /\+0\.06/.test(milan),
    `${rows} rows · ${curves} curves · ${milan.replace(/\s+/g, ' ')}`,
  );
  check('No console errors on the comparison', errors.length === 0, errors.slice(0, 2).join(' | '));
  await page.close();
}

{
  const page = await context.newPage();
  await page.goto(`${BASE}/platforms/accessibility-pov/compare`, { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  const row = () =>
    page.locator('.aa-compare__table tbody tr', { hasText: 'Milan' }).first().innerText();
  const byCells = await row();
  await page.getByRole('button', { name: 'By resident' }).click();
  await page.waitForTimeout(400);
  const byResidents = await row();
  // Isolated cells are large and thinly populated: two thirds of Milan's
  // cells are total isolation, but only two fifths of its residents.
  check(
    'Counting residents instead of cells changes what the zones say',
    /67\.7%/.test(byCells) && /42\.7%/.test(byResidents),
    `${byCells.replace(/\s+/g, ' ')} → ${byResidents.replace(/\s+/g, ' ')}`,
  );
  await page.close();
}

// ── Inspector and filter ─────────────────────────────────────────────
// Both upstream viewers pair the map with an inspector and a filter, and both
// are cross-wired to the scatter. What matters here is that a click reaches
// the panel with the right cell's numbers, and that filtering says how much
// of the city it left rather than silently shrinking the map.
{
  const page = await context.newPage();
  await page.goto(`${BASE}/atlas/milan?layer=cardep`, { waitUntil: 'load' });
  await page.waitForTimeout(3200);

  const cell = await page.locator('canvas').boundingBox();
  await page.mouse.click(cell.x + cell.width / 2, cell.y + cell.height / 2);
  await page.waitForTimeout(700);
  const rows = (await page.locator('.aa-inspector__rows .aa-summary__row').allInnerTexts()).join(' ');
  check(
    'A click inspects the cell under it',
    /Car Dependency Index/.test(rows) && /Reachable by car/.test(rows) && /Residents/.test(rows),
    rows.replace(/\s+/g, ' ').slice(0, 90),
  );

  // Milan's index runs −0.133 to +1, so the upper thumb is the one that
  // excludes anything here.
  await page.locator('.aa-range__input').nth(1).focus();
  for (let i = 0; i < 80; i++) await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(400);
  // The filter dims rather than removes, so the slice is read off the map by
  // the paint expression. What is checked here is that the control engages:
  // the reset appears only once something is filtered out.
  check('The index filter engages', (await page.locator('.aa-range__reset').count()) === 1);
  await page.close();
}

{
  const page = await context.newPage();
  await page.goto(`${BASE}/atlas/milan`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(700);
  const rows = (await page.locator('.aa-inspector__rows .aa-summary__row').allInnerTexts()).join(' ');
  // The H3 row is the one the union mesh adds: it is the cell's name on the
  // shared grid, and the reason the four layers can be compared at all.
  check(
    'The combined viewer inspects a cell and names it on the grid',
    /H3 cell/.test(rows) && /Residents/.test(rows),
    rows.replace(/\s+/g, ' ').slice(0, 100),
  );

  await page.getByRole('button', { name: 'Car Dependency Index' }).click();
  await page.waitForTimeout(900);
  check(
    'Switching layer drops a selection made under another',
    (await page.locator('.aa-inspector__empty').count()) === 1,
  );
  await page.close();
}

// ── Explanations ─────────────────────────────────────────────────────
// The "?" panels carry the method, so what is checked is the wording that has
// been got wrong before: P.O.V.'s thresholds are population-weighted medians,
// and the two upstream viewers both say "median" alone.
{
  const page = await context.newPage();
  await page.goto(`${BASE}/atlas/milan?layer=pov`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  // A tooltip follows the pointer's intent: it arrives on hover and leaves
  // with it, so reading one costs nothing and dismissing it is not a second
  // decision.
  await page.locator('.aa-explain__btn').first().hover();
  await page.waitForTimeout(400);
  const tip = await page.locator('.aa-explain__tip').innerText();
  await page.mouse.move(10, 10);
  await page.waitForTimeout(400);
  check(
    'A legend explains itself on hover, and stops when the pointer leaves',
    /population-weighted median/.test(tip) &&
      (await page.locator('.aa-explain__tip').count()) === 0,
    tip.replace(/\s+/g, ' ').slice(0, 70),
  );

  // A tooltip in the controls column is bounded by the window, not by the
  // column: it used to be a child of a box that scrolls, which clips what its
  // children paint outside it, so the half with the method in it was cut off
  // at the map's edge.
  const panelBox = await page.locator('.aa-city__panel').boundingBox();
  await page.locator('.aa-city__panel .aa-explain__btn').first().hover();
  await page.waitForTimeout(400);
  const tipBox = await page.locator('.aa-explain__tip').boundingBox();
  const viewport = page.viewportSize();
  check(
    'A tooltip in the controls column is not clipped by it',
    tipBox.x + tipBox.width > panelBox.x + panelBox.width &&
      tipBox.x >= 0 &&
      tipBox.x + tipBox.width <= viewport.width &&
      tipBox.y + tipBox.height <= viewport.height,
    `tip to ${Math.round(tipBox.x + tipBox.width)}px, column ends at ${Math.round(
      panelBox.x + panelBox.width,
    )}px`,
  );
  await page.mouse.move(10, 10);
  await page.waitForTimeout(300);

  // The column's handle is on the column's own edge, and says which way it
  // moves it with a chevron rather than a word.
  const handle = page.locator('.aa-city__panelbtn');
  const handleBox = await handle.boundingBox();
  const onTheSeam = Math.abs(handleBox.x + handleBox.width / 2 - (panelBox.x + panelBox.width)) < 3;
  const wordless = (await handle.innerText()).trim() === '';
  await handle.click();
  await page.waitForTimeout(500);
  const closed = await page.locator('.aa-city__panel').count();
  await page.locator('.aa-city__panelbtn').click();
  await page.waitForTimeout(500);
  check(
    'The controls column is closed from its own edge, by a chevron with no word on it',
    onTheSeam &&
      wordless &&
      closed === 0 &&
      (await page.locator('.aa-city__panel').count()) === 1 &&
      (await page.locator('.aa-mapbtn', { hasText: 'Hide controls' }).count()) === 0,
    `${onTheSeam ? 'on the seam' : 'off the seam'} · ${wordless ? 'no label' : 'labelled'}`,
  );

  // The long form is one click from the header, not four around the panel.
  await page.getByRole('button', { name: /About this layer/ }).click();
  await page.waitForTimeout(500);
  const modal = (await page.locator('.aa-modal__body').innerText()).toLowerCase();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(
    'About this layer opens the full account, and states the method',
    /reading the map/.test(modal) &&
      /connection scan/.test(modal) &&
      (await page.locator('.aa-modal').count()) === 0,
  );
  await page.close();
}

// ── Phone width ──────────────────────────────────────────────────────
// A page that scrolls sideways on a phone is broken, and the ways to cause it
// are subtle: a flex item's automatic minimum is its min-content width, auto
// cross-axis margins stop it stretching so it takes its content's width
// instead, and the subhead's title does not wrap. Wide content — the
// comparison table, the charts — has to scroll inside its own box instead.
{
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const wide = [];
  for (const route of [
    '/platforms/car-dependency-index/compare',
    '/platforms/accessibility-pov/compare',
    '/atlas/milan',
    '/atlas/rome?layer=pov',
  ]) {
    const page = await phone.newPage();
    await page.goto(BASE + route, { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    const over = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      view: window.innerWidth,
    }));
    if (over.doc > over.view + 1) wide.push(`${route} ${over.doc}px > ${over.view}px`);
    await page.close();
  }
  await phone.close();
  check('No page scrolls sideways on a phone', wide.length === 0, wide.join(' | '));
}

// ── The front door ───────────────────────────────────────────────────
// The landing is the coverage map with the words over it — the platform
// screen itself, mounted with its chrome withheld, so what is behind the copy
// is the real thing rather than a picture of it. There are two ways past the
// copy: scroll to read the rest of the home page, or take the invitation,
// which is an ordinary link to the platform tab. The platform is not
// duplicated here, and the route cross-fade carries the transition.
{
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);

  const tab = (await page.locator('.aa-nav__link').allInnerTexts())[0];
  const headline = await page.$eval('.aa-landing__headline', (e) => e.textContent.trim());
  check(
    'The landing leaves a viewport of the site backdrop under its copy',
    (await page.locator('.aa-backdrop canvas').count()) === 1 &&
      /Accessibility Atlas/.test(tab) &&
      headline === 'Accessibility Atlas' &&
      (await page.locator('.aa-picker').count()) === 0,
    `${tab} · ${headline}`,
  );

  // One column on the centre line: the name, then the argument under it. The
  // premise used to be a second block off to the right, which made the screen
  // two things to read rather than one.
  const premise = await page.$eval('.aa-landing__premisebody', (e) => e.innerText.trim());
  const headBox = await page.locator('.aa-landing__headline').boundingBox();
  const premiseBox = await page.locator('.aa-landing__premisebody').boundingBox();
  const middle = (box) => box.x + box.width / 2;
  check(
    'The premise reads under the name, on the same centre line',
    /^Cities are places of opportunities\./.test(premise) &&
      /unequal societies\.$/.test(premise) &&
      premiseBox.y > headBox.y + headBox.height &&
      Math.abs(middle(premiseBox) - middle(headBox)) < 2,
    `${premise.replace(/\n/g, ' ').slice(0, 44)}… · Δcentre ${(
      middle(premiseBox) - middle(headBox)
    ).toFixed(1)}px`,
  );

  // Whose Atlas it is, in the corner — and nothing counting itself on the way
  // in: the figures that used to sit at the foot of this screen, and again a
  // screen below it, are gone from both.
  const stageBox = await page.locator('.aa-landing__stage').boundingBox();
  const creditBox = await page.locator('.aa-landing__by').boundingBox();
  check(
    'A credit in the corner, and no figures counted at the door',
    (await page.locator('.aa-landing__by img').count()) === 1 &&
      middle(creditBox) > middle(stageBox) &&
      creditBox.y > stageBox.y + stageBox.height * 0.7 &&
      (await page.locator('.aa-landing__metric').count()) === 0 &&
      (await page.locator('.aa-metrics').count()) === 0 &&
      (await page.locator('.aa-section-head__hint').count()) === 0,
    await page.$eval('.aa-landing__by', (e) => e.innerText.trim()),
  );

  // The rest of the home page is directly underneath, not behind a link, and
  // it comes up *over* the map rather than dragging it along.
  const backdropBefore = await page.locator('.aa-backdrop canvas').boundingBox();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.05));
  await page.waitForTimeout(700);
  const backdropAfter = await page.locator('.aa-backdrop canvas').boundingBox();
  check(
    'The backdrop stays put while the page scrolls over it',
    backdropBefore.y === backdropAfter.y && (await page.evaluate(() => window.scrollY)) > 200,
    `${backdropBefore.y} → ${backdropAfter.y}`,
  );
  check(
    'Scrolling reaches the rest of the home page, once',
    (await page.locator('.aa-section-head').count()) >= 3 &&
      // The hero is over the map; repeating it below would read as a mistake.
      (await page.locator('.aa-hero').count()) === 0,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  // The invitation is the tab: same destination, same link, so it can be
  // opened in a new one like any other.
  const cta = page.getByRole('link', { name: /Explore the platform/ });
  const href = await cta.getAttribute('href');
  await cta.click();
  await page.waitForTimeout(1600);
  check(
    'Explore goes to the platform tab, and lights it',
    href === '/platforms' &&
      page.url().endsWith('/platforms') &&
      (await page.locator('.aa-nav__link--active').innerText()) === 'Platform' &&
      (await page.locator('.aa-picker').count()) === 1 &&
      (await page.locator('.aa-welcome').count()) === 1,
    `${href} → ${page.url()}`,
  );
  await page.close();
}

// ── One backdrop, everywhere ─────────────────────────────────────────
// The same map sits behind every page — except the two screens that are
// themselves a full-bleed map, where a second WebGL context would draw
// nothing behind an opaque one. Loaded straight onto one of those, the
// backdrop is never built at all.
{
  const page = await context.newPage();
  const seen = {};
  for (const route of ['/research', '/faq', '/contact', '/overview', '/platforms', '/atlas/milan']) {
    await page.goto(BASE + route, { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    seen[route] = await page.locator('.aa-backdrop canvas').count();
  }
  check(
    'The backdrop is on every page but the ones that are a map',
    seen['/research'] === 1 &&
      seen['/faq'] === 1 &&
      seen['/contact'] === 1 &&
      seen['/overview'] === 1 &&
      seen['/platforms'] === 0 &&
      seen['/atlas/milan'] === 0,
    JSON.stringify(seen),
  );

  // Arriving at a map screen from a page is the other half of that rule.
  // Dropping the backdrop the moment the URL changed emptied the frame while
  // the new map was built in front of the reader — the world left and came
  // back, when the two are framed as one world. It now stays until that map
  // has painted, and is hidden rather than torn down, so stepping back out
  // returns the same map rather than building a second one.
  {
    await page.goto(`${BASE}/research`, { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    // Mark it, so a rebuilt map can be told from the one that stayed.
    await page.$eval('.aa-backdrop canvas', (e) => {
      e.dataset.smoke = 'kept';
    });

    await page.getByRole('link', { name: 'Platform', exact: true }).click();
    // Mid-fade: the platform map is not up yet, and the world must still be.
    await page.waitForTimeout(150);
    const midway = await page.$eval('.aa-backdrop', (e) => getComputedStyle(e).visibility);
    await page.waitForTimeout(2200);
    const covered = await page.$eval('.aa-backdrop', (e) => getComputedStyle(e).visibility);
    const stage = await page.locator('.aa-mapstage canvas').count();

    await page.getByRole('link', { name: 'Research', exact: true }).click();
    await page.waitForTimeout(1500);
    const back = await page.$eval('.aa-backdrop', (e) => getComputedStyle(e).visibility);
    const kept = await page.$eval('.aa-backdrop canvas', (e) => e.dataset.smoke === 'kept');
    check(
      'The world holds while a map screen takes over, and is the same one after',
      midway === 'visible' && covered === 'hidden' && stage === 1 && back === 'visible' && kept,
      `${midway} → ${covered} → ${back} · ${kept ? 'one map' : 'rebuilt'}`,
    );
  }

  // And the same rule read off the screen rather than off the DOM.
  //
  // The check above passed while the handover was still visibly broken: the
  // backdrop element stayed `visible` throughout, and an opaque sheet of the
  // incoming screen's own paper was painted over it — its map container's
  // background, up the moment the route committed and covering the world for
  // the ~350ms MapLibre took to build. No computed style can see that; only
  // the composited frame can. So this samples frames straight off the
  // compositor and asserts none of them is blank, across the two handovers
  // that hurt most: a page onto the platform world, and that world onto a
  // city.
  //
  // "Blank" is measured as contrast — the standard deviation of luminance
  // over the lower half of the frame, which is clear of the cards on every
  // screen involved. A frame with a world in it scores ~11 and one with the
  // city view's chrome far more; the frames the old build dropped scored 1-4.
  {
    const page = await context.newPage();
    await page.goto(`${BASE}/research`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    // Where Milan's marker lands, from the constants both maps are framed
    // with — the backdrop's box is the platform map's box, which is the whole
    // point of the handover.
    const box = await page.locator('.aa-backdrop canvas').boundingBox();
    const worldPx = box.width * 2 ** WORLD_ZOOM_BOOST;
    const mercY = (lat) => 0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / (2 * Math.PI);
    const marker = {
      x: Math.round(box.x + box.width / 2 + ((9.19 - WORLD_CENTER[0]) / 360) * worldPx),
      y: Math.round(box.y + box.height / 2 + (mercY(45.46) - mercY(WORLD_CENTER[1])) * worldPx),
    };

    const client = await context.newCDPSession(page);
    const frames = [];
    client.on('Page.screencastFrame', async ({ data, sessionId }) => {
      frames.push(data);
      await client.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });

    await page.getByRole('link', { name: 'Platform', exact: true }).click();
    await page.waitForTimeout(2500);
    await page.fill('.aa-search__input', 'mila');
    await page.waitForTimeout(400);
    // Everything up to here is the platform world, where the markers belong;
    // past it the city map legitimately takes the world off the screen.
    const worldFrames = frames.length;
    await page.click('.aa-search__result');
    await page.waitForTimeout(2500);
    await client.send('Page.stopScreencast');

    // Decoded somewhere else, so nothing is drawn into the page being watched.
    const meter = await context.newPage();
    await meter.setContent('<canvas id="c"></canvas>');
    let worst = Infinity;
    const dots = [];
    for (const [index, data] of frames.entries()) {
      if (index < worldFrames) {
        // eslint-disable-next-line no-await-in-loop
        dots.push(
          await meter.evaluate(
            async ({ jpeg, at }) => {
              const img = new Image();
              img.src = `data:image/jpeg;base64,${jpeg}`;
              await img.decode();
              const canvas = document.getElementById('c');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const px = ctx.getImageData(at.x - 12, at.y - 12, 24, 24).data;
              let darkest = 255;
              for (let i = 0; i < px.length; i += 4) {
                const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
                if (v < darkest) darkest = v;
              }
              return darkest;
            },
            { jpeg: data, at: marker },
          ),
        );
      }
      // eslint-disable-next-line no-await-in-loop
      const contrast = await meter.evaluate(async (jpeg) => {
        const img = new Image();
        img.src = `data:image/jpeg;base64,${jpeg}`;
        await img.decode();
        const canvas = document.getElementById('c');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const top = Math.round(img.height * 0.55);
        const px = ctx.getImageData(0, top, img.width, img.height - top).data;
        let sum = 0;
        let sumSq = 0;
        const n = px.length / 4;
        for (let i = 0; i < px.length; i += 4) {
          const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          sum += v;
          sumSq += v * v;
        }
        const mean = sum / n;
        return Math.sqrt(Math.max(sumSq / n - mean * mean, 0));
      }, data);
      worst = Math.min(worst, contrast);
    }
    await meter.close();

    check(
      'No frame of either handover is a blank sheet where the world was',
      frames.length > 20 && worst > 5,
      `${frames.length} frames · quietest ${Number.isFinite(worst) ? worst.toFixed(1) : 'n/a'}`,
    );

    // And the markers on it are not blinking either. The incoming map used to
    // fade in on its style rather than on its data, so for ~200ms it covered
    // the backdrop's city markers with its own empty world and then popped the
    // same dots back in. Once Milan's dot is on screen it has to stay there:
    // the two maps draw it in the same place, so there is nothing for a reader
    // to see between them.
    // Measured against the dot's own settled darkness rather than a number
    // picked here: what matters is that it does not lighten once it is on
    // screen. Settled it reads ~28 and never strays past ~33; through the
    // blink it climbed to 65 and 123 before dropping back.
    const tail = dots.slice(-10).sort((a, b) => a - b);
    const limit = (tail[Math.floor(tail.length / 2)] ?? 255) + 25;
    const first = dots.findIndex((darkest) => darkest < 60);
    const faded = first < 0 ? [] : dots.slice(first).filter((darkest) => darkest > limit);
    check(
      'A city marker does not blink as one map hands the world to the next',
      first >= 0 && faded.length === 0,
      `${dots.length} frames of the world · ${
        first < 0 ? 'dot never seen' : `dot from #${first}, ${faded.length} frames paler than ${Math.round(limit)}`
      }`,
    );
    await page.close();
  }

  // The map is framed by the width of its box, so a page that scrolls and a
  // page that does not must still hand it the same width — otherwise the
  // world shifts by a scrollbar between one tab and the next. The gutter is
  // reserved on every page for exactly that (see global.css).
  const measure = async () => ({
    w: (await page.locator('.aa-backdrop canvas').boundingBox()).width,
    scrolls: await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 1,
    ),
  });
  await page.goto(`${BASE}/research`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const scrolling = await measure();
  // The same page with nothing left to scroll — which is a short page, without
  // depending on which of the site's pages happens to be short at this size.
  await page.evaluate(() => {
    document.querySelector('.aa-fade').style.display = 'none';
  });
  await page.waitForTimeout(600);
  const still = await measure();
  check(
    'The world is the same width on a page that scrolls and one that does not',
    scrolling.scrolls && !still.scrolls && scrolling.w === still.w,
    `${scrolling.w}px with a bar · ${still.w}px without`,
  );

  // And it is the *same* backdrop: one veil, so the map is as visible on a
  // page of text as it is on the front door.
  const veil = async (route) => {
    await page.goto(BASE + route, { waitUntil: 'load' });
    await page.waitForTimeout(1800);
    return page.$eval('.aa-backdrop__veil', (e) => getComputedStyle(e).backgroundImage);
  };
  const home = await veil('/');
  const elsewhere = await veil('/research');
  check(
    'The map is veiled the same everywhere',
    home === elsewhere && home !== 'none',
    home.slice(0, 60),
  );
  await page.close();
}

// ── The world map's chrome ───────────────────────────────────────────
// The bar above the map is gone; what it carried that the map still needs is
// on the map — a way to find a city, and the source.
{
  const page = await context.newPage();
  await page.goto(`${BASE}/platforms`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  check(
    'The world map carries its search, and no bar and no repository link',
    (await page.locator('.aa-subhead').count()) === 0 &&
      (await page.locator('.aa-mapstage__tools .aa-search').count()) === 1 &&
      (await page.locator('.aa-mapstage__tools .aa-mapbtn').count()) === 0,
  );

  // Everything that floats over the map arrives by fading in: a control that
  // snaps on over a half-drawn map reads as a page that has not loaded.
  const faded = await page.$$eval('.aa-fadein', (els) =>
    els.map((e) => getComputedStyle(e).animationName),
  );
  check(
    'The map’s chrome fades in rather than appearing',
    faded.length >= 4 && faded.every((name) => name === 'aa-fadein'),
    `${faded.length} elements`,
  );
  await page.close();
}

// ── The coverage map is framed where it says it is ───────────────────
// MapLibre clamps the centre latitude so a viewport cannot show past the
// poles, and at a world view's construction zoom that clamp is about ±18.6° —
// so a map asked to centre on 47°N was silently pulled to 19°N and never let
// back once the real zoom arrived. Nothing else here could see it: the map
// still rendered, still had markers, still passed every other check.
//
// Reprojecting a known city and hovering the pixel it should be at pins the
// centre and the zoom together: if either drifts, the tooltip does not appear.
{
  const page = await context.newPage();
  await page.goto(`${BASE}/platforms`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.click('.aa-welcome__close').catch(() => {});
  await page.waitForTimeout(300);

  const box = await page.locator('.aa-mapstage canvas').boundingBox();
  // MapLibre spans the world across 512px at zoom 0, and a world view's zoom
  // is the one that fits the container's width, plus the boost.
  const worldPx = box.width * 2 ** WORLD_ZOOM_BOOST;
  const mercatorY = (lat) =>
    0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / (2 * Math.PI);
  const project = ([lon, lat]) => {
    let delta = lon - WORLD_CENTER[0];
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return [
      box.x + box.width / 2 + (delta / 360) * worldPx,
      box.y + box.height / 2 + (mercatorY(lat) - mercatorY(WORLD_CENTER[1])) * worldPx,
    ];
  };

  // Milan is the city published on every platform, so it is on this map
  // whatever else changes.
  const [x, y] = project([9.19, 45.46]);
  await page.mouse.move(x, y);
  await page.waitForTimeout(400);
  const tip = await page.$eval('.aa-map-popup', (e) => e.innerText.trim()).catch(() => '');
  check(
    'The world map is framed on the centre and zoom it was given',
    /Milan/.test(tip),
    `${Math.round(x)},${Math.round(y)} → ${tip.split('\n')[0] || '(nothing under the pointer)'}`,
  );

  // And the frame still holds every published city: this is the Atlas's own
  // coverage map, and a city cropped out of it reads as one we do not have.
  const cities = await page.evaluate(async (url) => {
    const catalogue = await (await fetch(url)).json();
    const points = [];
    for (const platform of Object.values(catalogue.platforms ?? {})) {
      if (!platform.coverage) continue;
      const collection = await (await fetch(`/data/${platform.coverage}`)).json();
      for (const feature of collection.features) {
        points.push([feature.properties.name, feature.geometry.coordinates]);
      }
    }
    return points;
  }, `${BASE}/data/index.json`);
  const outside = cities
    .filter(([, coords]) => {
      const [px, py] = project(coords);
      return px < box.x || px > box.x + box.width || py < box.y || py > box.y + box.height;
    })
    .map(([name]) => name);
  check(
    'Every published city is inside the coverage frame',
    cities.length > 0 && outside.length === 0,
    outside.length ? [...new Set(outside)].join(', ') : `${cities.length} markers`,
  );
  await page.close();
}

// ── Between screens ──────────────────────────────────────────────────
// Routes cross-fade, and the bar above them does not: it lives outside the
// fading region, so navigating never rebuilds it. The failures that matter
// are a fade that never comes back — the site would be invisible — a fade on
// a query change, which would flash the map every time someone picks a
// layer, and a bar that moves.
{
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const navBefore = await page.locator('.aa-nav').boundingBox();
  const navVar = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
  );
  check(
    'One bar, measured and published as --nav-h',
    (await page.locator('.aa-nav').count()) === 1 &&
      Math.abs(parseFloat(navVar) - navBefore.height) < 2,
    `${navVar} vs ${navBefore.height}px`,
  );

  await page.getByRole('link', { name: 'Research' }).click();
  // Mid-flight: out, swapped, or fading back in — but not yet arrived.
  await page.waitForTimeout(250);
  const midway = await page.evaluate(
    () => getComputedStyle(document.querySelector('.aa-fade')).opacity,
  );
  await page.waitForTimeout(1000);
  const settled = await page.evaluate(
    () => getComputedStyle(document.querySelector('.aa-fade')).opacity,
  );
  const navAfter = await page.locator('.aa-nav').boundingBox();
  check(
    'The content fades both ways while the bar stays put',
    Number(midway) < 1 &&
      settled === '1' &&
      navBefore.y === navAfter.y &&
      navBefore.height === navAfter.height,
    `${midway} → ${settled}`,
  );
  check(
    'A tab change lands, and lights the tab it landed on',
    page.url().endsWith('/research') &&
      (await page.locator('.aa-nav__link--active').innerText()) === 'Research',
  );

  await page.goto(`${BASE}/atlas/milan`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.getByRole('button', { name: 'Car Dependency Index' }).click();
  await page.waitForTimeout(120);
  check(
    'Changing a layer does not fade the map',
    (await page.evaluate(
      () => getComputedStyle(document.querySelector('.aa-fade')).opacity,
    )) === '1',
  );
  await page.close();
}

// ── EN ⇄ IT ──────────────────────────────────────────────────────────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  // The h1 is the Atlas's name and is the same in both locales — the line
  // under it is what a locale swap has to change.
  const en = await page.$eval('.aa-landing__subtitle', (e) => e.textContent.trim());
  // Read every figure in the compare table, not just the first: only values
  // above 999 pick up a thousands separator.
  const enMetric = await page.$$eval('.aa-table__value', (els) =>
    els.map((e) => e.textContent.trim()).join(' '),
  );

  await page.click('.aa-nav__langbtn:not(.aa-nav__langbtn--active)');
  await page.waitForTimeout(700);
  const it = await page.$eval('.aa-landing__subtitle', (e) => e.textContent.trim());
  const itMetric = await page.$$eval('.aa-table__value', (els) =>
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
