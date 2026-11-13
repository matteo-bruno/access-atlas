#!/usr/bin/env node
// The blog's figures: every number its posts quote and every map and chart
// they show, computed from the published data in public/data/.
//
//   npm run blog                 numbers, charts and maps
//   npm run blog -- --no-maps    numbers and charts; keep the maps on disk
//   npm run blog -- --only=h15   redraw only the maps whose key starts so
//
// Writes public/blog-figures/figures.json and one WebP per map in
// public/blog-figures/maps/. The posts in src/data/blog.js hold the prose
// and name these by key: `{key}` in a paragraph is a value, `{ figure: id }`
// a figure. Nothing in a post is typed by hand, so re-running this after a
// data change is what keeps the posts true; `test:data` checks that every
// key a post names is in the file.
//
// The maps are drawn the way the city view draws them: MapLibre in Chromium,
// the site's basemap underneath (OpenFreeMap Positron, so the run needs that
// host), the hexagons from the published grid and layer files, coloured with
// the site's own ramps (src/map/ramps.js, src/map/bivariate.js). Playwright
// is not a dependency, as for the browser suites:
//   npm install --no-save playwright && npx playwright install chromium

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { cellToBoundary, cellToLatLng } from 'h3-js';
import { DATA, ROOT } from './lib/bundle.mjs';
import { readDataJSON } from './lib/datafile.mjs';
import { configureCharts, dotStrip, legendRow, lineChart, rangePlot, stack, swarm } from './lib/blog-charts.mjs';
import { RAMPS, colorAt, ratioOfCdi } from '../src/map/ramps.js';
import { BIVARIATE_CORNERS, bivariateAxis, bivariateColor, rankOn } from '../src/map/bivariate.js';
import { ZONES as ZONE_DEFS } from '../src/data/platforms.js';

const OUT = path.join(ROOT, 'public', 'blog-figures');
const MAPS_DIR = path.join(OUT, 'maps');
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const args = process.argv.slice(2);
const DRAW_MAPS = !args.includes('--no-maps');
const ONLY = args.find((a) => a.startsWith('--only='))?.slice(7) ?? null;

// ── Reading the published data ─────────────────────────────────────────
const data = (file) => readDataJSON(path.join(DATA, file));
const stats = data('stats/stats.json.gz');
const list = data('cities.json.gz').cities;
const meta = Object.fromEntries(list.map((c) => [c.id, c]));
const cityIdx = Object.fromEntries(stats.cities.map((c, i) => [c.id, i]));
const val = (measure, id) => {
  const v = stats.values[measure]?.[cityIdx[id]];
  if (!v) throw new Error(`stats: no ${measure} for ${id}`);
  return v;
};

// English, like the posts: 1,234 and 12.5.
const IT = (v, d = 0) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
const clock = (m) => { const s = Math.round(m * 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const sgn = (v, d = 2) => (v < 0 ? '−' : '+') + IT(Math.abs(v), d);
const fmtRatio = (v) => (!Number.isFinite(v) ? '∞' : v < 10 ? IT(v, 2) : IT(v, 0));
const nm = (id) => meta[id].name;

// The zones in the platform's order, with the layer's own names.
const ZONE_TEXT = {
  inclusion: ['Close & Connected', 'high on both scores'],
  spatial: ['Close', 'plenty on foot, little by transit'],
  social: ['Connected', 'good transit, little close by'],
  total: ['Total isolation', 'low on both'],
};
const ZONES = ZONE_DEFS.map((z) => ({ k: ZONE_TEXT[z.id][0], d: ZONE_TEXT[z.id][1], c: z.color }));
configureCharts({ format: IT, zones: ZONES });

// Continents, for colouring cities in the charts. Only a key for a chart:
// countries the published cities of over a million are in.
const CONT = {};
const addC = (name, codes) => codes.split(' ').forEach((c) => { CONT[c] = name; });
addC('Europe', 'AT BE BG BY CH CZ DE DK ES FI FR GB GR HU IE IT NL NO PL PT RO RS RU SE UA');
addC('Asia', 'AE AF AM AZ BD BH CN ID IL IN IQ IR JO JP KG KH KP KR KW KZ LB LK MM MN MY NP PH PK PS QA SA SG SY TH TJ TR TW UZ VN YE');
addC('Africa', 'AO BF BI BJ CD CG CI CM DZ EG ET GH GN KE LR LY MA MG ML MR MZ NE NG RW SD SL SN SO TD TN TZ UG ZA ZM ZW');
addC('North America', 'CA CR CU DO GT HT MX NI PA SV US');
addC('South America', 'AR BO BR CL CO EC PE PY UY VE');
addC('Oceania', 'AU NZ');
const continent = (id) => CONT[meta[id].country] ?? 'Other';
// The dataviz reference palette, as the Stats page's highlights.
const HL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const CONT_COL = { Europe: HL[0], 'North America': HL[1], Asia: HL[2], 'South America': HL[3], Africa: HL[6], Oceania: HL[4], Other: '#73767D' };

// ── Cities, grids and layers ───────────────────────────────────────────
const cache = {};
function load(id) {
  if (cache[id]) return cache[id];
  const grid = data(`cities/${id}/grid.json.gz`);
  const ll = grid.cells.map((h) => cellToLatLng(h));
  const layers = {};
  const layer = (name) => {
    if (layers[name]) return layers[name];
    const f = data(`cities/${id}/${name}.json.gz`);
    if (f.grid !== grid.id) throw new Error(`${id}/${name} was written for another grid`);
    const pos = [];
    let at = 0;
    for (const d of f.idx) { at += d; pos.push(at); }
    return (layers[name] = { f, pos, pop: f.fields.population });
  };
  return (cache[id] = { id, grid, ll, layer });
}
const KM_LAT = 110.57;
function popCentre(c, L) {
  let sx = 0, sy = 0, sw = 0;
  L.pos.forEach((p, r) => { const w = L.pop[r]; if (w > 0) { sx += c.ll[p][1] * w; sy += c.ll[p][0] * w; sw += w; } });
  return [sx / sw, sy / sw];
}
const kmFrom = (c, p, [lon0, lat0]) => { const [la, lo] = c.ll[p]; return Math.hypot((la - lat0) * KM_LAT, (lo - lon0) * 111.32 * Math.cos(lat0 * Math.PI / 180)); };

// ── Maps: the specs here, drawn later in Chromium ──────────────────────
const MAPS = {};
/**
 * A map of one layer, framed `frameKm` wide on the layer's centre of
 * residents. Only inhabited cells are drawn, as on the city view; with
 * `cartogram` each hexagon is scaled to its population by the Atlas's rule.
 */
function map(key, { id, layer, colorOf, frameKm, W = 700, H = 450, cartogram = false, opacity = 0.86 }) {
  const c = load(id); const L = c.layer(layer);
  const [lon0, lat0] = popCentre(c, L);
  const kx = 111.32 * Math.cos(lat0 * Math.PI / 180);
  const halfW = frameKm / 2 + 1, halfH = frameKm * H / W / 2 + 1;
  const ref = L.f.cartogram?.reference || 1;
  const feats = [];
  for (let r = 0; r < L.pos.length; r++) {
    const p = L.pos[r]; if (!(L.pop[r] > 0)) continue;
    const [la, lo] = c.ll[p];
    if (Math.abs((lo - lon0) * kx) > halfW || Math.abs((la - lat0) * KM_LAT) > halfH) continue;
    const col = colorOf(r, L); if (!col) continue;
    let s = 1;
    if (cartogram) { s = Math.sqrt(Math.min(Math.max(c.grid.population[p], 0) / ref, 1)); if (s < 0.12) continue; s = Math.max(s, 0.3); }
    const ring = cellToBoundary(c.grid.cells[p]).map(([y, x]) => [+(lo + (x - lo) * s).toFixed(6), +(la + (y - la) * s).toFixed(6)]);
    ring.push(ring[0]);
    feats.push([ring, col]);
  }
  const zoom = Math.log2(40075016.686 * Math.cos(lat0 * Math.PI / 180) * W / (512 * frameKm * 1000));
  MAPS[key] = { W, H, center: [lon0, lat0], zoom, opacity, feats };
  return { key, frameKm, W, H };
}
// `{base}` is the site's base URL, filled in by the post page.
function mapFig(m, { name, sub, small = false }) {
  const bar = m.frameKm > 40 ? 10 : 5;
  return `<div class="mf${small ? ' mf--s' : ''}"><div class="mf__img"><img data-map="${m.key}" alt="${name}" loading="lazy" width="${m.W}" height="${m.H}">
<div class="mf__bar"><i style="width:${(bar / m.frameKm * 100).toFixed(2)}%"></i><b>${bar} km</b></div></div>
<div class="mf__name"><span>${name}</span>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
}
function legendRamp(id, stops, lo, hi, ticks, fmt, tail) {
  const span = hi - lo;
  const st = stops.filter(([v]) => v >= lo && v <= hi).map(([v, c]) => `<stop offset="${((v - lo) / span * 100).toFixed(1)}%" stop-color="${c}"/>`).join('');
  return `<div class="lg"><div class="lg__bar"><svg viewBox="0 0 100 10" preserveAspectRatio="none"><defs><linearGradient id="${id}">${st}</linearGradient></defs><rect width="100" height="10" fill="url(#${id})"/></svg>${tail ? `<span class="lg__tail" style="background:linear-gradient(90deg,${tail.join(',')})"></span>` : ''}</div>
<div class="lg__t">${ticks.map((v) => `<span style="left:${((v - lo) / span * (tail ? 80 : 100)).toFixed(1)}%">${fmt(v)}</span>`).join('')}${tail ? '<span style="left:90%">… 120+</span>' : ''}</div></div>`;
}
const zoneKey = () => `<div class="zk">${ZONES.map((z) => `<span><i style="background:${z.c}"></i><b>${z.k}</b> ${z.d}</span>`).join('')}</div>`;
const hero = (m, { name, sub }, legendTitle, legend, note) =>
  `<div class="hm">${mapFig(m, { name, sub })}<div class="hm__leg"><b>${legendTitle}</b>${legend}${note ? `<span>${note}</span>` : ''}</div></div>`;
const grid = (cols, items) => `<div class="grid${cols}">${items.join('')}</div>`;
const legendUnder = (html) => `<div class="lgu">${html}</div>`;
const tab = (rows, head, cls = '') => `<table${cls ? ` class="${cls}"` : ''}><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

// Colours, from the site's ramps.
const NINE = ['healthcare', 'transport', 'culture', 'services', 'restaurant', 'physical', 'education', 'supplies', 'outdoor'];
// 15minCity's average over the nine categories, as the viewer and the
// statistics take it.
const avg15 = (L, r) => { let s = 0, n = 0; for (const k of NINE) { const v = L.f.fields[`${k}_foot`]?.[r]; if (Number.isFinite(v) && v !== 99999) { s += v; n++; } } return n ? s / n : null; };
const fifteenColor = (r, L) => colorAt(RAMPS.fifteen, avg15(L, r));
const ratioColor = (r, L) => { const v = ratioOfCdi(L.f.fields.cdi[r]); return v == null ? null : colorAt(RAMPS.cdiRatio, v); };
const carColor = (r, L) => colorAt(RAMPS.cdiCarAbsolute, L.f.fields.o_score_car[r]);
const ptColor = (r, L) => colorAt(RAMPS.cdiTransitAbsolute, L.f.fields.o_score_pt[r]);
const zoneColor = (r, L) => ZONES[L.f.fields.zone[r]].c;
const velColor = (h) => (r, L) => colorAt(RAMPS.velocity, L.f.hourly.v[h][r]);
const log10Stops = (stops) => stops.map(([v, c]) => [Math.log10(v), c]);
const lg15 = legendRamp('g15', RAMPS.fifteen.stops, 0, 30, [0, 7.5, 15, 22.5, 30], (v) => (v % 1 ? clock(v) : v), ['#8a2c1c', '#140b08']);
const lgVel = legendRamp('gv', RAMPS.velocity.stops, 0, 10, [0, 2, 4, 6, 8, 10], (v) => v);
const lgRatio = legendRamp('gr', log10Stops(RAMPS.cdiRatio.stops), -1, 1, [-1, Math.log10(0.5), 0, Math.log10(2), Math.log10(4), 1], (v) => (Math.abs(v - Math.log10(0.5)) < 1e-9 ? '½' : v === -1 ? '0.1' : IT(10 ** v, 0)));
const lgAbs = (ramp, id) => legendRamp(id, log10Stops(ramp.stops), 2, 4, [2, Math.log10(300), 3, Math.log10(3000), 4], (v) => IT(Math.round(10 ** v / 100) * 100));

const V = {}; // the values the prose quotes
const F = {}; // the figures, as HTML

// ═══ 15-minute city ════════════════════════════════════════════════════
{
  const foot = (id) => val('fifteen.proximity_time.foot', id);
  const SIX = ['paris', 'tokyo', 'bogota', 'sydney', 'houston', 'nairobi'];
  const CURVE = ['paris', 'tokyo', 'bogota', 'rome', 'sydney', 'phoenix', 'houston'];
  const col = Object.fromEntries(CURVE.concat(['nairobi']).map((id, i) => [id, HL[i]]));
  for (const id of ['paris', 'tokyo', 'bogota', 'rome', 'sydney', 'phoenix', 'houston']) V[`fifteen.${id}.15`] = IT(foot(id).shares[2]);
  V['fifteen.bogota.millions'] = IT(foot('bogota').population / 1e6, 1);
  V['fifteen.houston.median'] = clock(foot('houston').q[2]);
  V['fifteen.houston.30'] = IT(foot('houston').shares[4]);

  F['fifteen.hero'] = hero(map('h15', { id: 'bogota', layer: 'fifteen', colorOf: fifteenColor, frameKm: 30, W: 700, H: 470, cartogram: true }),
    { name: nm('bogota'), sub: 'Average walk to the nine services · cartogram' },
    'Minutes on foot, average of nine categories', lg15, 'Each hexagon’s area is proportional to its residents: where few people live, the cell shrinks.');
  F['fifteen.six'] = grid(3, SIX.map((id) => mapFig(map(`s15-${id}`, { id, layer: 'fifteen', colorOf: fifteenColor, frameKm: 34, W: 340, H: 340 }),
    { name: nm(id), sub: `${continent(id)} · median resident ${clock(foot(id).q[2])}`, small: true }))) + legendUnder(lg15);

  // Two cells of Rome: the most populated near the centre and 12 to 16 km out.
  const CATS = [['outdoor', 'Outdoor activities'], ['supplies', 'Supplies'], ['transport', 'Transport'], ['physical', 'Physical activity'], ['restaurant', 'Eating'], ['services', 'Services'], ['education', 'Learning'], ['healthcare', 'Healthcare'], ['culture', 'Culture']];
  const ro = load('rome'); const L = ro.layer('fifteen'); const centre = meta.rome.center;
  const rows = L.pos.map((p, r) => ({ r, p, pop: L.pop[r], km: kmFrom(ro, p, centre) }));
  const cin = rows.filter((x) => x.km < 2).sort((a, b) => b.pop - a.pop)[0];
  const cout = rows.filter((x) => x.km > 12 && x.km < 16).sort((a, b) => b.pop - a.pop)[0];
  const tIn = CATS.map(([k]) => L.f.fields[`${k}_foot`][cin.r]), tOut = CATS.map(([k]) => L.f.fields[`${k}_foot`][cout.r]);
  const far = Math.max(...tOut);
  Object.assign(V, {
    'fifteen.rome.in.residents': IT(cin.pop), 'fifteen.rome.in.furthest': clock(Math.max(...tIn)),
    'fifteen.rome.out.residents': IT(cout.pop), 'fifteen.rome.out.km': IT(cout.km), 'fifteen.rome.out.furthest': clock(far),
    'fifteen.rome.out.category': CATS[tOut.indexOf(far)][1].toLowerCase(),
  });
  const bar = (t) => `<span class="tb"><i style="width:${(Math.min(t, 45) / 45 * 100).toFixed(1)}%;background:${colorAt(RAMPS.fifteen, t)}"></i></span>`;
  F['fifteen.romeCells'] = tab(CATS.map(([, l], i) => [l, clock(tIn[i]) + bar(tIn[i]), clock(tOut[i]) + bar(tOut[i])]),
    ['Category', `Centre · ${IT(cin.pop)} res.`, `${IT(cout.km)} km · ${IT(cout.pop)} res.`]);
  V['fifteen.rome.in.cell'] = ro.grid.cells[cin.p];
  V['fifteen.rome.out.cell'] = ro.grid.cells[cout.p];

  const FIVE = ['paris', 'tokyo', 'bogota', 'sydney', 'houston'];
  const catRows = CATS.map(([k, label]) => ({ label, k, v: Object.fromEntries(FIVE.map((id) => [id, val(`fifteen.${k}.foot`, id).q[2]])) }));
  V['fifteen.paris.healthcare'] = clock(catRows.find((r) => r.k === 'healthcare').v.paris);
  V['fifteen.houston.healthcare'] = clock(catRows.find((r) => r.k === 'healthcare').v.houston);
  F['fifteen.categories'] = legendRow(FIVE.map((id) => ({ name: nm(id), color: col[id] })))
    + dotStrip({ rows: catRows, cities: FIVE.map((id) => ({ id, name: nm(id), color: col[id] })), max: Math.ceil(Math.max(...catRows.flatMap((r) => Object.values(r.v))) / 5) * 5, fmt: clock });
  F['fifteen.curves'] = lineChart({ xs: [5, 10, 15, 20, 30], xFmt: (v) => v, yFmt: (v) => `${v}%`, yMax: 100, xLabel: 'minutes on foot', yLabel: '', refX: 15,
    series: CURVE.map((id) => ({ name: nm(id), color: col[id], ys: foot(id).shares, dots: true, tip: (x, v) => `${IT(v, 1)}% within ${x} min` })) });

  // Every city of over a million on its urban-centre boundary, by continent.
  const big = (hidden) => stats.cities.filter((c, k) => c.layers.fifteen && !c.id.endsWith('-fua') && Boolean(c.hidden) === hidden && stats.values['fifteen.proximity_time.foot'][k]?.population >= 1e6);
  const bigs = big(false);
  const CONTS = ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];
  const rowsC = CONTS.map((name) => ({ name, color: CONT_COL[name], items: bigs.filter((c) => continent(c.id) === name).map((c) => ({ id: c.id, name: nm(c.id), v: foot(c.id).shares[2] })) }));
  const mid = (name) => { const a = rowsC.find((r) => r.name === name).items.map((x) => x.v).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  V['fifteen.big.count'] = IT(bigs.length);
  V['fifteen.big.hidden'] = IT(big(true).length);
  V['fifteen.big.europe'] = IT(mid('Europe'));
  V['fifteen.big.northAmerica'] = IT(mid('North America'));
  F['fifteen.world'] = swarm({ rows: rowsC, hi: Object.fromEntries(CURVE.concat(['nairobi']).map((id) => [id, 1])), fmt: (v) => `${IT(v, 1)}%` });
}

// ═══ CityChrone ════════════════════════════════════════════════════════
{
  const SIX = ['paris', 'milan', 'zurich', 'rome', 'new-york', 'tokyo'];
  const THREE = ['milan', 'new-york', 'seattle'];
  const H24 = [...Array(24).keys()];
  const hh = (h) => String(h).padStart(2, '0');
  const q = (id) => H24.map((h) => val(`citychrone.velocity.${hh(h)}`, id).q);
  const med = Object.fromEntries(SIX.map((id) => [id, q(id).map((x) => x[2])]));
  const ny = med['new-york']; const mx = Math.max(...ny), mn = Math.min(...ny);
  const at8 = (id) => val('citychrone.velocity.08', id).q[2];
  Object.assign(V, {
    'citychrone.tokyo.8': IT(at8('tokyo'), 1), 'citychrone.paris.8': IT(at8('paris'), 1),
    'citychrone.newYork.peak': IT(mx, 1), 'citychrone.newYork.peakHour': `${ny.indexOf(mx)}:00`,
    'citychrone.newYork.low': IT(mn, 1), 'citychrone.newYork.lowHour': `${ny.indexOf(mn)}:00`,
  });
  F['citychrone.hero'] = hero(map('hcc', { id: 'tokyo', layer: 'citychrone', colorOf: velColor(8), frameKm: 44, W: 700, H: 470 }),
    { name: nm('tokyo'), sub: 'Public transport velocity at 8:00' }, 'Velocity, km/h', lgVel,
    'How fast public transport, walking included, carries you away from a cell. A score, not a measured speed.');
  const STRIP = [3, 7, 13, 21];
  F['citychrone.hours'] = grid(4, STRIP.map((h) => mapFig(map(`scc-${h}`, { id: 'new-york', layer: 'citychrone', colorOf: velColor(h), frameKm: 36, W: 300, H: 300 }),
    { name: `${h}:00`, sub: `median ${IT(ny[h], 1)}`, small: true }))) + legendUnder(lgVel);
  F['citychrone.day'] = lineChart({ xs: H24, xFmt: (v) => (v % 3 ? '' : `${v}:00`), yFmt: (v) => v, yMax: 8, xLabel: 'hour of the day', yLabel: '',
    band: { lo: q('new-york').map((x) => x[1]), hi: q('new-york').map((x) => x[3]), color: HL[4] },
    series: SIX.map((id, i) => ({ name: nm(id), color: HL[i], ys: med[id], dots: false })) });
  F['citychrone.three'] = grid(3, THREE.map((id) => mapFig(map(`s8-${id}`, { id, layer: 'citychrone', colorOf: velColor(8), frameKm: 36, W: 340, H: 340 }),
    { name: nm(id), sub: `${continent(id)} · median ${IT(at8(id), 1)}`, small: true }))) + legendUnder(lgVel);
}

// ═══ Car Dependency Index ══════════════════════════════════════════════
{
  const ids = stats.cities.filter((c, k) => c.layers.cardep && !c.id.endsWith('-fua') && stats.values['cardep.cdi'][k]).map((c) => c.id);
  // Quantiles carry over exactly: the ratio rises with the normalised index.
  const lr = (v) => Math.log10(Math.min(Math.max(v, 0.05), 16));
  const rows = ids.map((id) => { const rq = val('cardep.cdi', id).q.map(ratioOfCdi); return { id, label: nm(id), rq, q: rq.map(lr), color: CONT_COL[continent(id)], hi: id === 'new-york' || id === 'tokyo' }; })
    .sort((a, b) => a.q[2] - b.q[2]);
  const wins = rows.filter((r) => r.rq[2] > 1).length;
  const losers = rows.filter((r) => r.rq[2] < 1).map((r) => r.label);
  const contMid = (c) => { const a = rows.filter((r) => continent(r.id) === c).map((r) => r.rq[2]).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const ny = load('new-york'); const L = ny.layer('cardep');
  const cells = L.pos.map((p, r) => ({ r, p, pop: L.pop[r], km: kmFrom(ny, p, [-73.985, 40.758]), car: L.f.fields.o_score_car[r], pt: L.f.fields.o_score_pt[r], cdi: L.f.fields.cdi[r] }));
  const cin = cells.filter((x) => x.km < 1.5).sort((a, b) => b.pop - a.pop)[0];
  const cout = cells.filter((x) => x.km > 22 && x.km < 30).sort((a, b) => b.pop - a.pop)[0];
  Object.assign(V, {
    'cardep.cities': IT(rows.length), 'cardep.carWins': IT(wins),
    'cardep.exceptions': losers.length === 0 ? 'There is no exception.' : losers.length === 1 ? `The one exception is ${losers[0]}.` : `The exceptions are ${losers.slice(0, -1).join(', ')} and ${losers.at(-1)}.`,
    'cardep.europe': fmtRatio(contMid('Europe')), 'cardep.northAmerica': fmtRatio(contMid('North America')),
    'cardep.tokyo.median': fmtRatio(rows.find((r) => r.id === 'tokyo').rq[2]),
    'cardep.rome.p90': fmtRatio(rows.find((r) => r.id === 'rome').rq[4]),
    'cardep.newYork.car': IT(val('cardep.car', 'new-york').q[2]), 'cardep.newYork.transit': IT(val('cardep.pt', 'new-york').q[2]),
    'cardep.newYork.in.ratio': fmtRatio(cin.car / cin.pt),
    'cardep.newYork.out.km': IT(cout.km), 'cardep.newYork.out.car': IT(cout.car), 'cardep.newYork.out.transit': IT(cout.pt), 'cardep.newYork.out.ratio': fmtRatio(cout.car / cout.pt),
  });
  F['cardep.hero'] = hero(map('hcdi', { id: 'new-york', layer: 'cardep', colorOf: ratioColor, frameKm: 40, W: 700, H: 500, cartogram: true }),
    { name: nm('new-york'), sub: 'Opportunities by car ÷ by transit · cartogram' }, 'Opportunities by car ÷ by transit', lgRatio,
    'Green: transit reaches more. White: even. Orange: the car reaches more. Logarithmic, so twice as much either way is the same step from white.');
  F['cardep.carTransit'] = grid(2, [
    mapFig(map('ny-car', { id: 'new-york', layer: 'cardep', colorOf: carColor, frameKm: 40, W: 440, H: 440 }), { name: 'By car', sub: `median resident ${V['cardep.newYork.car']}`, small: true }),
    mapFig(map('ny-pt', { id: 'new-york', layer: 'cardep', colorOf: ptColor, frameKm: 40, W: 440, H: 440 }), { name: 'By public transport', sub: `median resident ${V['cardep.newYork.transit']}`, small: true }),
  ]) + `<div class="grid2 lgu">${lgAbs(RAMPS.cdiCarAbsolute, 'gcar')}${lgAbs(RAMPS.cdiTransitAbsolute, 'gpt')}</div>`;
  F['cardep.ratioTable'] = tab([['½', IT(-1 / 3, 2), 'transit reaches twice as much'], ['1', '0', 'even'], ['2', `+${IT(1 / 3, 2)}`, 'a car reaches twice as much'],
    ['4', `+${IT(0.6, 2)}`, 'four times as much'], ['10', `+${IT(9 / 11, 2)}`, 'ten times as much'], ['∞', '+1', 'transit reaches nothing']], ['Car ÷ transit', 'Normalised', 'Reads as'], 'ratio');
  F['cardep.nyCells'] = tab([
    [`Midtown · ${IT(cin.pop)} res.`, IT(cin.car), IT(cin.pt), `<b>${fmtRatio(cin.car / cin.pt)}</b>`, sgn(cin.cdi)],
    [`${IT(cout.km)} km · ${IT(cout.pop)} res.`, IT(cout.car), IT(cout.pt), `<b>${fmtRatio(cout.car / cout.pt)}</b>`, sgn(cout.cdi)],
  ], ['Cell', 'By car', 'By transit', 'Car ÷ transit', 'Normalised']);
  const SIX = ['new-york', 'chicago', 'tokyo', 'paris', 'barcelona', 'rome'];
  F['cardep.six'] = grid(3, SIX.map((id) => mapFig(map(`scdi-${id}`, { id, layer: 'cardep', colorOf: ratioColor, frameKm: 34, W: 340, H: 340 }),
    { name: nm(id), sub: `${continent(id)} · median resident ${fmtRatio(rows.find((r) => r.id === id).rq[2])}`, small: true }))) + legendUnder(lgRatio);
  F['cardep.cities'] = legendRow([...new Set(rows.map((r) => continent(r.id)))].map((name) => ({ name, color: CONT_COL[name] })))
    + rangePlot({ rows, lo: lr(0.5), hi: lr(16), ticks: [0.5, 1, 2, 4, 8, 16].map(lr), fmt: (v) => (10 ** v >= 15.99 ? '16+' : fmtRatio(10 ** v)), zero: 0 });
}

// ═══ Close & Connected ═════════════════════════════════════════════════
{
  const zoneQuad = `<svg class="quad" viewBox="0 0 560 296" role="img" aria-label="The four zones">
<rect x="60" y="10" width="240" height="120" rx="6" fill="${ZONES[1].c}"/><rect x="304" y="10" width="240" height="120" rx="6" fill="${ZONES[0].c}"/><rect x="60" y="134" width="240" height="120" rx="6" fill="${ZONES[3].c}"/><rect x="304" y="134" width="240" height="120" rx="6" fill="${ZONES[2].c}"/>
<g text-anchor="middle" fill="#fff"><text x="180" y="64" font-size="18" font-weight="700">Close</text><text x="180" y="86" font-size="13">plenty on foot, little by transit</text>
<text x="424" y="64" font-size="18" font-weight="700">Close &amp; Connected</text><text x="424" y="86" font-size="13">high on both scores</text>
<text x="180" y="188" font-size="18" font-weight="700">Total isolation</text><text x="180" y="210" font-size="13">low on both</text>
<text x="424" y="188" font-size="18" font-weight="700">Connected</text><text x="424" y="210" font-size="13">good transit, little close by</text></g>
<text x="302" y="276" text-anchor="middle" class="ax">opportunity →</text><text transform="translate(40 132) rotate(-90)" text-anchor="middle" class="ax">proximity →</text></svg>`;
  F['pov.quadrants'] = zoneQuad;
  F['pov.hero'] = hero(map('hpov', { id: 'paris', layer: 'pov', colorOf: zoneColor, frameKm: 22, W: 700, H: 500, cartogram: true }),
    { name: nm('paris'), sub: 'Zones on the city’s medians · cartogram' }, 'Zones, against the city’s own medians', zoneKey(), '');

  const ny = load('new-york'); const P = ny.layer('pov');
  const axP = bivariateAxis(P.f.fields.proximity, P.pop), axO = bivariateAxis(P.f.fields.opportunity, P.pop);
  const both = (r, L) => bivariateColor(rankOn(axP, L.f.fields.proximity[r]), rankOn(axO, L.f.fields.opportunity[r]));
  const n = 12, size = 120, s = size / n;
  let sq = '';
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) sq += `<rect x="${(i * s).toFixed(1)}" y="${((n - 1 - k) * s).toFixed(1)}" width="${(s + 0.4).toFixed(1)}" height="${(s + 0.4).toFixed(1)}" fill="${bivariateColor((k + 0.5) / n, (i + 0.5) / n)}"/>`;
  sq += `<line x1="${size / 2}" x2="${size / 2}" y1="0" y2="${size}" stroke="#15171A" stroke-opacity=".4" stroke-dasharray="3 3"/><line y1="${size / 2}" y2="${size / 2}" x1="0" x2="${size}" stroke="#15171A" stroke-opacity=".4" stroke-dasharray="3 3"/>`;
  const bivKey = `<div class="bk"><div class="bk__sq"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${sq}</svg><span class="bk__x">Opportunity →</span><span class="bk__y">Proximity →</span></div>
<ul><li><i style="background:${BIVARIATE_CORNERS[3]}"></i>High on both</li><li><i style="background:${BIVARIATE_CORNERS[1]}"></i>Proximity only</li><li><i style="background:${BIVARIATE_CORNERS[2]}"></i>Opportunity only</li><li><i style="background:${BIVARIATE_CORNERS[0]}"></i>Low on both</li></ul></div>`;
  F['pov.zonesBoth'] = grid(2, [
    mapFig(map('ny-zones', { id: 'new-york', layer: 'pov', colorOf: zoneColor, frameKm: 30, W: 440, H: 440 }), { name: 'Zones', sub: 'four classes at the city’s medians', small: true }),
    mapFig(map('ny-both', { id: 'new-york', layer: 'pov', colorOf: both, frameKm: 30, W: 440, H: 440 }), { name: 'Both', sub: 'the two ranks as one colour', small: true }),
  ]) + `<div class="grid2 lgu lgu--mid"><div>${zoneKey()}</div><div>${bivKey}</div></div>`;

  // Rome's inhabited cells by their two scores, as the city view's plot.
  const ro = load('rome'); const R = ro.layer('pov'); const th = R.f.meta.thresholds;
  const w = 680, h = 470, m = { l: 60, r: 16, t: 16, b: 46 }; const iw = w - m.l - m.r, ih = h - m.t - m.b;
  const pts = []; let mx = 0, my = 0;
  R.pos.forEach((_, r) => { const pop = R.pop[r]; if (!(pop > 0)) return; const x = R.f.fields.opportunity[r], y = R.f.fields.proximity[r]; pts.push({ x, y, pop, z: R.f.fields.zone[r] }); mx = Math.max(mx, x); my = Math.max(my, y); });
  const nice = (v) => { const e = 10 ** Math.floor(Math.log10(v)); const st = [1, 2, 2.5, 5, 10].map((k) => k * e).find((k) => v / k <= 6); return { step: st, top: Math.ceil(v / st) * st }; };
  const ax = nice(mx * 1.02), ay = nice(my * 1.02);
  const X = (v) => m.l + v / ax.top * iw, Y = (v) => m.t + ih - v / ay.top * ih;
  const ref = R.f.cartogram?.reference || 1;
  let g = '';
  for (let v = 0; v <= ax.top + 1e-9; v += ax.step) g += `<line x1="${X(v)}" x2="${X(v)}" y1="${m.t}" y2="${m.t + ih}" class="gr"/><text x="${X(v)}" y="${m.t + ih + 16}" text-anchor="middle" class="tk">${IT(v)}</text>`;
  for (let v = 0; v <= ay.top + 1e-9; v += ay.step) g += `<line x1="${m.l}" x2="${m.l + iw}" y1="${Y(v)}" y2="${Y(v)}" class="gr"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" class="tk">${IT(v)}</text>`;
  pts.map((p) => ({ ...p, rad: Math.min(8, Math.max(1.1, 3.2 * Math.sqrt(p.pop / ref))) })).sort((a, b) => b.rad - a.rad)
    .forEach((p) => { g += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.rad.toFixed(1)}" fill="${ZONES[p.z].c}" fill-opacity=".72"/>`; });
  g += `<line x1="${X(th.opportunity)}" x2="${X(th.opportunity)}" y1="${m.t}" y2="${m.t + ih}" class="ref"/><line x1="${m.l}" x2="${m.l + iw}" y1="${Y(th.proximity)}" y2="${Y(th.proximity)}" class="ref"/>`;
  const qn = (x, y, k, a) => `<text x="${x}" y="${y}" text-anchor="${a}" class="qn" fill="${ZONES[k].c}">${ZONES[k].k.replace('&', '&amp;')}</text>`;
  g += qn(m.l + iw - 6, m.t + 16, 0, 'end') + qn(m.l + 8, m.t + 16, 1, 'start') + qn(m.l + iw - 6, m.t + ih - 10, 2, 'end') + qn(m.l + 8, m.t + ih - 10, 3, 'start');
  g += `<text x="${m.l + iw}" y="${h - 6}" text-anchor="end" class="ax">Opportunity score →</text><text transform="translate(14 ${m.t + 4}) rotate(-90)" text-anchor="end" class="ax">Proximity score →</text>`;
  F['pov.scatter'] = `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img" aria-label="Rome's inhabited cells by proximity and opportunity">${g}</svg>${zoneKey()}`;
  V['pov.rome.cells'] = IT(pts.length);
  V['pov.rome.proximity'] = IT(th.proximity);
  V['pov.rome.opportunity'] = IT(th.opportunity);

  const cvr = (id) => {
    const L = load(id).layer('pov'); const zc = [0, 0, 0, 0], zp = [0, 0, 0, 0];
    L.pos.forEach((_, r) => { const z = L.f.fields.zone[r]; zc[z]++; zp[z] += L.pop[r]; });
    const tc = zc.reduce((a, b) => a + b), tp = zp.reduce((a, b) => a + b);
    return { c: zc.map((x) => x / tc * 100), p: zp.map((x) => x / tp * 100) };
  };
  const three = [['rome', 'rome'], ['new-york', 'newYork'], ['paris', 'paris']];
  const shares = Object.fromEntries(three.map(([id]) => [id, cvr(id)]));
  for (const [id, key] of three) { V[`pov.${key}.totalCells`] = IT(shares[id].c[3], 1); V[`pov.${key}.totalResidents`] = IT(shares[id].p[3], 1); }
  F['pov.cellsResidents'] = stack({ rows: three.flatMap(([id]) => [{ label: `${nm(id)} · cells`, parts: shares[id].c }, { label: `${nm(id)} · residents`, parts: shares[id].p, hi: true }]), lw: 170 }) + zoneKey();
  const SIX = ['new-york', 'chicago', 'seattle', 'paris', 'berlin', 'rome'];
  F['pov.six'] = grid(3, SIX.map((id) => mapFig(map(`spov-${id}`, { id, layer: 'pov', colorOf: zoneColor, frameKm: 34, W: 340, H: 340 }), { name: nm(id), sub: continent(id), small: true }))) + legendUnder(zoneKey());
}

// ── Drawing the maps ───────────────────────────────────────────────────
fs.mkdirSync(MAPS_DIR, { recursive: true });
const manifestPath = path.join(OUT, 'figures.json');
const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')).maps ?? {} : {};
const files = { ...previous };
const wanted = Object.keys(MAPS).filter((k) => (ONLY ? k.startsWith(ONLY) : true));
if (DRAW_MAPS && wanted.length) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('The maps are drawn in Chromium, with Playwright, which is not a dependency:\n  npm install --no-save playwright && npx playwright install chromium\nor run with --no-maps to keep the maps on disk.');
    process.exit(1);
  }
  // Through the environment's proxy where there is one.
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.warn('  page:', e.message));
  // MapLibre 6 ships as ES modules with a module worker, which need an
  // origin to load from. The page and the package's dist/ are served on an
  // origin that does not exist, by intercepting its requests, so nothing of
  // it leaves the machine (a local server would go through a proxy).
  const dist = path.join(ROOT, 'node_modules', 'maplibre-gl', 'dist');
  const ORIGIN = 'https://atlas-blog.invalid';
  const PAGE = '<!doctype html><html><body style="margin:0"><div id="m"></div><script type="module">'
    + "import * as maplibregl from './maplibre-gl.mjs'; maplibregl.setWorkerUrl(new URL('./maplibre-gl-worker.mjs', location.href).href); window.maplibregl = maplibregl; window.ready = true;"
    + '</script></body></html>';
  await page.context().route(`${ORIGIN}/**`, (route) => {
    const name = path.basename(new URL(route.request().url()).pathname);
    if (!name) return route.fulfill({ contentType: 'text/html', body: PAGE });
    const file = path.join(dist, name);
    return fs.existsSync(file) ? route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(file) }) : route.fulfill({ status: 404 });
  });
  await page.goto(`${ORIGIN}/`);
  await page.waitForFunction(() => window.ready === true);
  for (const key of wanted) {
    const m = MAPS[key];
    const t = Date.now();
    const url = await page.evaluate(async ({ m, style }) => {
      const el = document.getElementById('m'); el.style.width = `${m.W}px`; el.style.height = `${m.H}px`;
      const map = new maplibregl.Map({ container: el, style, center: m.center, zoom: m.zoom, interactive: false, attributionControl: false, preserveDrawingBuffer: true, fadeDuration: 0 });
      await new Promise((r) => map.once('load', r));
      const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
      // Place names stay over the data; roads, stations and shops go, so the
      // basemap is the city's outline rather than a second message.
      for (const l of map.getStyle().layers) if (l.type === 'symbol' && /poi|housenumber|road|highway|transport/.test(l.id)) map.setLayoutProperty(l.id, 'visibility', 'none');
      // tolerance 0: MapLibre would otherwise drop polygons smaller than a
      // pixel, which at a metro area's framing is every cell (CLAUDE.md).
      map.addSource('h', { type: 'geojson', tolerance: 0, data: { type: 'FeatureCollection', features: m.feats.map(([ring, c]) => ({ type: 'Feature', properties: { c }, geometry: { type: 'Polygon', coordinates: [ring] } })) } });
      map.addLayer({ id: 'h', type: 'fill', source: 'h', paint: { 'fill-color': ['get', 'c'], 'fill-opacity': m.opacity } }, firstSymbol);
      await new Promise((r) => map.once('idle', r));
      const out = map.getCanvas().toDataURL('image/webp', 0.86);
      map.remove();
      return out;
    }, { m, style: STYLE_URL });
    const buf = Buffer.from(url.split(',')[1], 'base64');
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
    const name = `${key}.${hash}.webp`;
    if (files[key] && files[key] !== name) fs.rmSync(path.join(MAPS_DIR, files[key]), { force: true });
    fs.writeFileSync(path.join(MAPS_DIR, name), buf);
    files[key] = name;
    console.log(`  ${key.padEnd(16)} ${(buf.length / 1024).toFixed(0).padStart(4)} kB  ${Date.now() - t} ms`);
  }
  await browser.close();
}
const missing = Object.keys(MAPS).filter((k) => !files[k]);
if (missing.length) { console.error(`No image for ${missing.join(', ')}: run without --no-maps or --only.`); process.exit(1); }
for (const k of Object.keys(files)) if (!MAPS[k]) { fs.rmSync(path.join(MAPS_DIR, files[k]), { force: true }); delete files[k]; }

// Image paths in the figures: `{base}` is filled in by the post page.
for (const [id, html] of Object.entries(F)) F[id] = html.replace(/<img data-map="([^"]+)"/g, (_, k) => `<img src="{base}blog-figures/maps/${files[k]}" data-map="${k}"`);
const doc = { format: 'atlas-blog-figures', version: 1, generatedAt: new Date().toISOString().slice(0, 10), values: V, figures: F, maps: files };
fs.writeFileSync(manifestPath, `${JSON.stringify(doc)}\n`);
console.log(`blog figures: ${Object.keys(V).length} values, ${Object.keys(F).length} figures, ${Object.keys(files).length} maps → ${path.relative(ROOT, OUT)}`);
