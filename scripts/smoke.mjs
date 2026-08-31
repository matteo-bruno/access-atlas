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
  ['/', 'Landing'],
  ['/overview', 'The previous home page, still routed'],
  ['/platforms', 'All-platforms world map'],
  ['/platforms/15min-city', '15min-City landing'],
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
// The landing is the coverage map with the words over it, and "explore the
// platform" dissolves the words rather than cutting to another screen. What
// is asserted is that the map is really there — not a picture of one — and
// that the invitation actually leads in.
{
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);

  const mapCanvas = await page.locator('.aa-landing__map canvas').count();
  const tab = (await page.locator('.aa-nav__link').allInnerTexts())[0];
  check(
    'The landing draws the coverage map behind its copy',
    mapCanvas === 1 && /Accessibility Atlas/.test(tab),
    tab,
  );

  await page.getByRole('button', { name: /Explore the platform/ }).click();
  await page.waitForTimeout(1400);
  check('Explore leads into the platform', page.url().endsWith('/platforms'), page.url());
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
  const enMetric = await page.$$eval('.aa-landing__metric dd', (els) =>
    els.map((e) => e.textContent.trim()).join(' '),
  );

  await page.click('.aa-nav__langbtn:not(.aa-nav__langbtn--active)');
  await page.waitForTimeout(700);
  const it = await page.$eval('h1', (e) => e.textContent.trim());
  const itMetric = await page.$$eval('.aa-landing__metric dd', (els) =>
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
