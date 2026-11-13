// The blog's charts, as SVG strings: drawn once by scripts/build-blog.mjs from
// the published statistics and layer files, and styled by the post page
// (`.aa-bfig` in src/pages/Blog.css), so the class names here are the
// contract with that stylesheet: gr (grid), ref (a reference line), tk
// (ticks), ax (axis titles), nm (series names), lb (row labels), vl (values),
// in (labels inside a bar), qn (quadrant names), sw-l (labels over dots).
//
// Marks follow the site's charts: thin lines, rounded data ends, a 2 px
// paper ring on overlapping dots, a native <title> on every mark so a hover
// reads it, and names beside the lines rather than a legend alone.

let IT = (v) => String(v);
let ZONES = [];
/** The number format and the four zones, set once by the caller. */
export function configureCharts({ format, zones }) {
  IT = format;
  ZONES = zones;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function lineChart({ series, xs, xFmt, yFmt, yMax, yLabel, xLabel, band, w = 680, h = 330, refX }) {
  const m = { l: 44, r: 84, t: 12, b: 42 }; const iw = w - m.l - m.r, ih = h - m.t - m.b;
  const X = (v) => m.l + (v - xs[0]) / (xs[xs.length - 1] - xs[0]) * iw, Y = (v) => m.t + ih - v / yMax * ih;
  let g = '';
  for (let i = 0; i <= 4; i++) { const v = yMax / 4 * i; g += `<line x1="${m.l}" x2="${m.l + iw}" y1="${Y(v)}" y2="${Y(v)}" class="gr"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="tk">${yFmt(v)}</text>`; }
  xs.forEach((v) => { const s = xFmt(v); if (s !== '') g += `<text x="${X(v)}" y="${m.t + ih + 18}" text-anchor="middle" class="tk">${s}</text>`; });
  g += `<text x="${m.l}" y="${h - 4}" class="ax">${xLabel}</text><text x="${m.l}" y="${m.t - 1}" class="ax" dy="-0">${''}</text>`;
  if (refX != null) g += `<line x1="${X(refX)}" x2="${X(refX)}" y1="${m.t}" y2="${m.t + ih}" class="ref"/><text x="${X(refX) + 5}" y="${m.t + 12}" class="ax">15 min</text>`;
  if (band) g += `<polygon points="${band.hi.map((v, i) => `${X(xs[i])},${Y(v)}`).concat(band.lo.map((v, i) => `${X(xs[i])},${Y(v)}`).reverse()).join(' ')}" fill="${band.color}" opacity=".14"/>`;
  const ends = [];
  series.forEach((s) => {
    g += `<polyline fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${s.ys.map((v, k) => `${X(xs[k])},${Y(v)}`).join(' ')}"/>`;
    if (s.dots) s.ys.forEach((v, k) => { g += `<circle cx="${X(xs[k])}" cy="${Y(v)}" r="4.5" fill="${s.color}" stroke="#FBFAF4" stroke-width="2"><title>${esc(s.name)}: ${s.tip(xs[k], v)}</title></circle>`; });
    ends.push({ y: Y(s.ys[s.ys.length - 1]), name: s.name, color: s.color });
  });
  ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
  ends.forEach((e) => { g += `<circle cx="${m.l + iw + 10}" cy="${e.y}" r="4" fill="${e.color}"/><text x="${m.l + iw + 18}" y="${e.y + 4}" class="nm">${e.name}</text>`; });
  return `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img"><text x="0" y="0"></text>${g}</svg><p class="yl">${yLabel}</p>`;
}
const legendRow = (items) => `<div class="kl">${items.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>`;

// dot strip: rows (categories), one dot per city
function dotStrip({ rows, cities, max, fmt, w = 680 }) {
  const lw = 140, rh = 30, iw = w - lw - 30, h = rows.length * rh + 30; const X = (v) => lw + v / max * iw;
  let g = '';
  for (let v = 0; v <= max; v += 5) g += `<line x1="${X(v)}" x2="${X(v)}" y1="4" y2="${h - 24}" class="gr"/><text x="${X(v)}" y="${h - 8}" text-anchor="middle" class="tk">${v}</text>`;
  g += `<line x1="${X(15)}" x2="${X(15)}" y1="4" y2="${h - 24}" class="ref"/>`;
  rows.forEach((r, i) => {
    const y = 18 + i * rh; const vs = cities.map((c) => r.v[c.id]);
    g += `<text x="${lw - 10}" y="${y + 4}" text-anchor="end" class="lb">${r.label}</text><line x1="${X(Math.min(...vs))}" x2="${X(Math.max(...vs))}" y1="${y}" y2="${y}" stroke="#BEC0C2" stroke-width="2"/>`;
    cities.forEach((c) => { g += `<circle cx="${X(r.v[c.id])}" cy="${y}" r="6" fill="${c.color}" stroke="#FBFAF4" stroke-width="2"><title>${c.name}, ${r.label}: ${fmt(r.v[c.id])}</title></circle>`; });
  });
  return `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`;
}

// range plot: per city q10–q90 thin, q25–q75 thick, median dot
function rangePlot({ rows, lo, hi, ticks, fmt, w = 680, zero }) {
  const lw = 150, rh = 26, iw = w - lw - 70, h = rows.length * rh + 30; const X = (v) => lw + (v - lo) / (hi - lo) * iw;
  let g = '';
  ticks.forEach((v) => { g += `<line x1="${X(v)}" x2="${X(v)}" y1="2" y2="${h - 24}" class="${v === zero ? 'ref' : 'gr'}"/><text x="${X(v)}" y="${h - 8}" text-anchor="middle" class="tk">${fmt(v)}</text>`; });
  rows.forEach((r, i) => {
    const y = 14 + i * rh; const q = r.q;
    g += `<text x="${lw - 10}" y="${y + 4}" text-anchor="end" class="lb${r.hi ? ' lb--hi' : ''}">${r.label}</text>
<line x1="${X(q[0])}" x2="${X(q[4])}" y1="${y}" y2="${y}" stroke="${r.color}" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
<line x1="${X(q[1])}" x2="${X(q[3])}" y1="${y}" y2="${y}" stroke="${r.color}" stroke-opacity=".7" stroke-width="7" stroke-linecap="round"/>
<circle cx="${X(q[2])}" cy="${y}" r="6" fill="${r.color}" stroke="#FBFAF4" stroke-width="2"><title>${r.label}: median ${fmt(q[2])}, middle half ${fmt(q[1])} to ${fmt(q[3])}</title></circle>
<text x="${X(q[4]) + 8}" y="${y + 4}" class="vl">${fmt(q[2])}</text>`;
  });
  return `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`;
}

function stack({ rows, w = 680, lw = 150 }) {
  const rh = 28, iw = w - lw - 6, h = rows.length * rh + 4; let g = '';
  rows.forEach((r, i) => {
    const y = i * rh + 4; let x = lw;
    g += `<text x="${lw - 10}" y="${y + 15}" text-anchor="end" class="lb${r.hi ? ' lb--hi' : ''}">${r.label}</text>`;
    r.parts.forEach((p, k) => {
      const bw = p / 100 * iw; if (bw <= 0) return;
      g += `<rect x="${(x + 1).toFixed(1)}" y="${y}" width="${Math.max(bw - 2, 0.8).toFixed(1)}" height="${rh - 10}" rx="3" fill="${ZONES[k].c}"><title>${r.label}, ${ZONES[k].k}: ${IT(p, 1)}%</title></rect>`;
      if (bw > 34) g += `<text x="${(x + bw / 2).toFixed(1)}" y="${y + 13}" text-anchor="middle" class="in">${IT(p)}%</text>`;
      x += bw;
    });
  });
  return `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`;
}

// swarm: one row per continent, one dot per city, x = a share in %
function swarm({ rows, hi, w = 680, fmt }) {
  const lw = 110, iw = w - lw - 20; const rhs = rows.map((r) => Math.max(64, Math.min(150, 30 + r.items.length * 0.45))); const tops = rhs.map((_, i) => rhs.slice(0, i).reduce((a, b) => a + b, 0)); const h = tops[tops.length - 1] + rhs[rhs.length - 1] + 34; const X = (v) => lw + v / 100 * iw;
  let g = '';
  for (let v = 0; v <= 100; v += 25) g += `<line x1="${X(v)}" x2="${X(v)}" y1="0" y2="${h - 26}" class="gr"/><text x="${X(v)}" y="${h - 8}" text-anchor="middle" class="tk">${v}%</text>`;
  const labels = [];
  rows.forEach((row, i) => {
    const rh = rhs[i]; const cy = tops[i] + rh / 2; const placed = [];
    g += `<text x="0" y="${cy + 4}" class="lb">${row.name}</text><text x="0" y="${cy + 19}" class="tk">${row.items.length} cities</text>`;
    const items = [...row.items].sort((a, b) => a.v - b.v);
    for (const it of items) {
      const x = X(it.v); let y = cy;
      for (let k = 0; k < 40; k++) {
        const dy = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 3.4; const yy = cy + dy;
        if (Math.abs(dy) > rh / 2 - 5) { y = cy + (((x * 7919) % 97) / 97 - 0.5) * (rh - 12); break; }
        if (!placed.some((p) => (p[0] - x) ** 2 + (p[1] - yy) ** 2 < 6.6 ** 2)) { y = yy; break; }
      }
      placed.push([x, y]);
      const H = hi[it.id] ? row.color : null;
      if (!H) g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.1" fill="${row.color}" fill-opacity=".45"><title>${esc(it.name)}: ${fmt(it.v)}</title></circle>`;
      else labels.push({ x, y, it, H });
    }
  });
  for (const { x, y, it, H } of labels) {
    g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="${H}" stroke="#15171A" stroke-width="1.5"><title>${esc(it.name)}: ${fmt(it.v)}</title></circle>
<text x="${x.toFixed(1)}" y="${(y - 10).toFixed(1)}" text-anchor="middle" class="nm sw-l">${esc(it.name)}</text>`;
  }
  return `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`;
}


export { esc, lineChart, legendRow, dotStrip, rangePlot, stack, swarm };
