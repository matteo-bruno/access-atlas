// Generate the platform-card preview images.
//
//   npm run build && npm run preview -- --port 4321 &
//   npm run shoot:previews
//
// Each image is a screenshot of that platform's own city view — the cartogram
// a visitor sees after clicking through — rather than the world map, so the
// card shows what the platform actually renders. CityChrone has no page of
// its own; the combined viewer's CityChrone layer is its city view.
//
// Output goes to src/assets/platforms/<id>.jpg at 2× for retina. Home.jsx
// picks them up by filename; delete one and that card reverts to a live map.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4321';
const OUT = path.join(process.cwd(), 'src', 'assets', 'platforms');

// Card art is 16:10; 520×320 CSS at 2× gives 1040×640.
const W = 520;
const H = 320;
const SCALE = 2;

const SHOTS = [
  { id: 'fifteen', route: '/platforms/15min-city/milan', target: '.aa-city__canvas' },
  { id: 'cardep', route: '/platforms/car-dependency-index/rome', target: '.aa-city__canvas' },
  { id: 'pov', route: '/platforms/accessibility-pov/rome', target: '.aa-city__canvas' },
  { id: 'citychrone', route: '/atlas/milan?layer=citychrone', target: '.aa-city__canvas' },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: SCALE,
});

let failures = 0;

for (const shot of SHOTS) {
  const page = await context.newPage();
  try {
    await page.goto(BASE + shot.route, { waitUntil: 'load' });
    // MapLibre rasterises asynchronously; wait for the canvas, then let it
    // settle so the shot is not of a half-drawn frame.
    await page.waitForSelector(`${shot.target} canvas`, { timeout: 30000 });
    await page.waitForTimeout(6000);

    const box = await page.$eval(shot.target, (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });

    // Largest 16:10 region that fits, but never larger than the target: the
    // card is 263 px wide, so anything beyond 1040×640 is bytes nobody sees.
    const scale = Math.min(box.width / W, box.height / H, 1);
    const w = W * scale;
    const h = H * scale;
    const clip = {
      x: Math.round(box.x + (box.width - w) / 2),
      y: Math.round(box.y + (box.height - h) / 2),
      width: Math.round(w),
      height: Math.round(h),
    };

    // JPEG, not PNG: these are rasterised map imagery, and at this size the
    // quality difference is invisible while the files are ~4× smaller.
    const file = path.join(OUT, `${shot.id}.jpg`);
    await page.screenshot({ path: file, clip, type: 'jpeg', quality: 86 });
    const kb = (fs.statSync(file).size / 1024).toFixed(0);
    console.log(
      `PASS  ${shot.id.padEnd(11)} ${clip.width}×${clip.height} CSS → ${clip.width * SCALE}×${clip.height * SCALE} px  ${kb} kB  (${shot.route})`,
    );
  } catch (error) {
    failures++;
    console.log(`FAIL  ${shot.id.padEnd(11)} ${error.message.split('\n')[0]}`);
  }
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} shot(s) failed` : `\nWrote ${SHOTS.length} previews to ${OUT}`);
process.exit(failures ? 1 : 0);
