import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { RampLegend } from '../components/RampLegend.jsx';
import { colorAt } from '../map/ramps.js';
import { loadDataset } from '../map/loaders.js';
import { dataUrl } from '../data/catalogue.js';
import { ZONES } from '../data/platforms.js';
import {
  HEADLINES,
  HIGHLIGHT,
  ZONE_KEYS,
  cityFlags,
  formatStat,
  formatThreshold,
  hourLabel,
  isDistribution,
  measureLabel,
  orderRows,
  rowName,
  statDirection,
  statLabel,
  statRamp,
  statRows,
  statValue,
} from '../data/stats.js';

// The views of the Stats page. Each takes the rows the filters left and the
// statistic picked, and draws it one way; none of them computes a figure.
// Every mark answers hover with its numbers, and every number a tooltip
// shows is also on the page somewhere without it (the ranking's values, the
// matrix's cells).

// ── the shared hover tooltip ─────────────────────────────────────────

/** One tooltip for a view, following the pointer, drawn on the body. */
export function useTip() {
  const [tip, setTip] = useState(null);
  return {
    tip,
    show: (event, content) => setTip({ x: event.clientX, y: event.clientY, content }),
    hide: () => setTip(null),
  };
}

export function Tip({ tip }) {
  if (!tip) return null;
  const left = Math.min(tip.x + 14, window.innerWidth - 270);
  const top = tip.y + 16 + 160 > window.innerHeight ? tip.y - 16 : tip.y + 16;
  const flip = top < tip.y;
  return createPortal(
    <div className="aa-stats__tip" style={{ left, top, transform: flip ? 'translateY(-100%)' : undefined }} role="tooltip">
      {tip.content}
    </div>,
    document.body,
  );
}

/** A tooltip's body: the name, then the figures, value first. */
function TipBody({ title, lines = [], note }) {
  return (
    <>
      <div className="aa-stats__tiptitle">{title}</div>
      {lines.map(([label, value]) => (
        <div className="aa-stats__tipline" key={label}>
          <span className="aa-mono">{value}</span>
          <span>{label}</span>
        </div>
      ))}
      {note && <div className="aa-stats__tipnote">{note}</div>}
    </>
  );
}

/** The lines a row's tooltip carries for a distribution: where its residents sit. */
function distributionLines(measure, stat, ctx) {
  const { t, n } = ctx;
  if (!stat) return [];
  const f = (key) => formatStat(measure, key, statValue(stat, key), ctx);
  const lines = [];
  if (stat.q) {
    lines.push([t('stats.statLabels.p50'), f('p50')]);
    if (stat.mean != null) lines.push([t('stats.statLabels.mean'), f('mean')]);
    lines.push([t('stats.tooltip.iqr'), `${f('p25')} – ${f('p75')}`]);
    lines.push([t('stats.tooltip.range'), `${f('p10')} – ${f('p90')}`]);
  }
  if (stat.population != null) lines.push([t('stats.tooltip.population'), n(stat.population)]);
  if (stat.cities != null) lines.push([t('stats.tooltip.cities'), n(stat.cities)]);
  else if (stat.cells != null) lines.push([t('stats.tooltip.cells'), n(stat.cells)]);
  return lines;
}

// ── marks shared by the views ────────────────────────────────────────

/** A highlighted row's colour key; nothing for the rest. */
function Key({ slot }) {
  if (slot == null) return null;
  return <span className="aa-stats__key" style={{ background: HIGHLIGHT[slot] }} aria-hidden="true" />;
}

/** A warning beside a row, explained on hover. */
function Flags({ flags, ctx, name, show, hide }) {
  if (!flags.length) return <span />;
  const text = flags.map((f) =>
    ctx.t(`stats.flag.${f.key}`, {
      share: f.share != null ? ctx.n(f.share) : '',
      name,
      population: ctx.rule?.population != null ? ctx.n(ctx.rule.population) : '',
      minutes: ctx.rule?.minutes != null ? ctx.n(ctx.rule.minutes) : '',
    }),
  );
  return (
    <button
      type="button"
      className="aa-stats__flag"
      aria-label={text.join(' ')}
      onPointerEnter={(e) => show(e, <TipBody title={name} note={text.join(' ')} />)}
      onPointerMove={(e) => show(e, <TipBody title={name} note={text.join(' ')} />)}
      onPointerLeave={hide}
      onFocus={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        show({ clientX: r.left, clientY: r.bottom }, <TipBody title={name} note={text.join(' ')} />);
      }}
      onBlur={hide}
    >
      !
    </button>
  );
}

const cityHref = (row, layer) =>
  row.kind === 'city' ? `/atlas/${row.id}${layer && layer !== 'cross' ? `?layer=${layer}` : ''}` : null;

/** Rank numbers, ties sharing the better one. */
function ranksOf(ordered, key, index) {
  const out = new Map();
  ordered.forEach((row, i) => {
    const value = statValue(row.stat, key, index);
    const previous = i ? ordered[i - 1] : null;
    out.set(row.id, previous && statValue(previous.stat, key, index) === value ? out.get(previous.id) : i + 1);
  });
  return out;
}

/** Evenly spaced round ticks covering [lo, hi]. */
function niceTicks(lo, hi, count = 5) {
  const span = hi - lo || 1;
  const raw = span / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) ticks.push(Math.round(v / step) * step);
  return ticks;
}

/** The value range a statistic is laid out on. */
function domainFor(measure, key, rows, index) {
  if (['share', 'zone', 'unreachable'].includes(key)) return [0, 100];
  if (key === 'value') return [-1, 1];
  const quantile = isDistribution(measure) && (key === 'mean' || key.startsWith('p'));
  const values = [];
  for (const row of rows) {
    if (quantile && row.stat?.q) values.push(...row.stat.q);
    const v = statValue(row.stat, key, index);
    if (v != null) values.push(v);
  }
  const finite = values.filter((v) => measure.sentinel == null || v < measure.sentinel);
  if (!finite.length) return [0, 1];
  let lo = Math.min(...finite);
  let hi = Math.max(...finite);
  if (key === 'gini' || key === 'theil') lo = 0;
  else if (key === 'ratio') lo = 1;
  else if (measure.signed) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  } else if (lo >= 0 && lo < hi * 0.35) lo = 0;
  const pad = (hi - lo) * 0.04;
  return [lo === 0 || key === 'ratio' ? lo : lo - pad, hi + pad];
}

// ── ranking ──────────────────────────────────────────────────────────

/**
 * One row per city (or country), best first. A level is drawn as where the
 * city's residents sit: the 10th–90th percentile as a line, the middle half
 * as a box, the median as a tick, and the figure picked as a dot — one
 * number per city hides how far apart its own residents are, and this is
 * where that shows.
 */
export function RankingView({ rows, spec, unit, slots, onToggle, reverse, ctx }) {
  const { measure, key, index } = spec;
  const { show, hide } = ctx.tipApi;
  const ordered = orderRows(rows, measure, key, index, reverse);
  const ranked = measure.comparability !== 'within-city';
  const ranks = ranksOf(ordered, key, index);
  const [lo, hi] = domainFor(measure, key, ordered, index);
  const x = (v) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo || 1)) * 100))}%`;
  const glyph = unit === 'city' && isDistribution(measure) && (key === 'mean' || key.startsWith('p'));
  const ramp = statRamp(measure, key);
  const base = key === 'ratio' ? 1 : Math.max(lo, Math.min(0, hi));
  const fmt = (v) => formatStat(measure, key, v, ctx);
  const ticks = niceTicks(lo, hi);

  if (!ordered.length) return <p className="aa-stats__empty">{ctx.t('stats.noValues')}</p>;

  return (
    <div className="aa-stats__ranking">
      <div className="aa-stats__rrow aa-stats__rrow--axis" aria-hidden="true">
        <span />
        <span />
        <span className="aa-stats__track">
          {ticks.map((v) => (
            <span key={v} className="aa-stats__tick aa-mono" style={{ left: x(v) }}>
              {glyph || ['share', 'zone', 'unreachable', 'value'].includes(key) ? fmt(v) : ctx.n(v)}
            </span>
          ))}
        </span>
        <span />
        <span />
      </div>
      {ordered.map((row) => {
        const value = statValue(row.stat, key, index);
        const name = rowName(row, ctx.lang);
        const slot = slots.get(row.id);
        const q = row.stat?.q;
        const over = (v) => measure.sentinel != null && v >= measure.sentinel;
        const picked = statLabel(measure, key, index, ctx.t, ctx.n);
        const tipContent = (
          <TipBody
            title={name}
            lines={[[picked, fmt(value)], ...distributionLines(measure, row.stat, ctx).filter(([label]) => label !== picked)]}
          />
        );
        const href = cityHref(row, measure.layer);
        return (
          <div
            key={row.id}
            className={`aa-stats__rrow${slot != null ? ' aa-stats__rrow--on' : ''}`}
            onPointerMove={(e) => show(e, tipContent)}
            onPointerLeave={hide}
          >
            <span className="aa-stats__rank aa-mono">{ranked ? ranks.get(row.id) : ''}</span>
            <span className="aa-stats__name">
              <button type="button" className="aa-stats__pick" onClick={() => onToggle(row.id)} aria-pressed={slot != null} title={ctx.t('stats.selection.toggle')}>
                <Key slot={slot} />
                <span className="aa-stats__pickname">{name}</span>
              </button>
              {row.kind === 'city' ? (
                <span className="aa-stats__sub aa-mono">{row.country}</span>
              ) : (
                <span className="aa-stats__sub">{ctx.t('stats.cityCount', { count: ctx.n(row.cities?.length ?? 0) })}</span>
              )}
            </span>
            <span className="aa-stats__track">
              {ticks.map((v) => (
                <span key={v} className="aa-stats__grid" style={{ left: x(v) }} />
              ))}
              {glyph && q ? (
                <>
                  <span className={`aa-stats__whisker${over(q[4]) ? ' aa-stats__whisker--open' : ''}`} style={{ left: x(q[0]), right: `calc(100% - ${x(Math.min(q[4], over(q[4]) ? hi : q[4]))})` }} />
                  <span className="aa-stats__box" style={{ left: x(q[1]), right: `calc(100% - ${x(over(q[3]) ? hi : q[3])})` }} />
                  <span className="aa-stats__median" style={{ left: x(over(q[2]) ? hi : q[2]) }} />
                  {value != null && !over(value) && (
                    <span className="aa-stats__dot" style={{ left: x(value), background: slot != null ? HIGHLIGHT[slot] : 'var(--ink)' }} />
                  )}
                </>
              ) : (
                <span
                  className="aa-stats__bar"
                  style={{
                    left: x(Math.min(value, base)),
                    right: `calc(100% - ${x(Math.max(value, base))})`,
                    background: ramp ? colorAt(ramp, value) : 'var(--ink-3)',
                  }}
                />
              )}
              {measure.signed && <span className="aa-stats__zero" style={{ left: x(0) }} />}
            </span>
            <span className="aa-stats__value aa-mono">
              {href ? (
                <Link to={href} title={ctx.t('stats.openCity', { name })}>
                  {fmt(value)}
                </Link>
              ) : (
                fmt(value)
              )}
            </span>
            <Flags flags={cityFlags(row, measure.layer)} ctx={ctx} name={name} show={show} hide={hide} />
          </div>
        );
      })}
    </div>
  );
}

// ── map ──────────────────────────────────────────────────────────────

const W = 760;
const H = 420;
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-80, Math.min(80, lat)) * Math.PI) / 360));

/**
 * Where the cities are, coloured by the figure picked. Drawn here rather
 * than on MapLibre: it is one small chart among five, and the page already
 * has the site's map behind it. The land is the same paper basemap the
 * world maps use; the frame fits the cities on screen, the colours do not.
 */
export function MapView({ rows, spec, slots, onToggle, ctx }) {
  const { measure, key, index } = spec;
  const { show, hide } = ctx.tipApi;
  const [land, setLand] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    loadDataset({ url: dataUrl('world-land.geojson') }, { signal: controller.signal })
      .then(setLand)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Only cities with this figure: a city without the layer is not on this map.
  const placed = rows.filter((r) => Array.isArray(r.center) && statValue(r.stat, key, index) != null);
  const frame = useMemo(() => {
    if (!placed.length) return null;
    const xs = placed.map((r) => r.center[0]);
    const ys = placed.map((r) => mercY(r.center[1]));
    const toRad = Math.PI / 180;
    let [x0, x1] = [Math.min(...xs) * toRad, Math.max(...xs) * toRad];
    let [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    const pad = Math.max(x1 - x0, y1 - y0, 0.25) * 0.12;
    x0 -= pad;
    x1 += pad;
    y0 -= pad;
    y1 += pad;
    const k = Math.min(W / (x1 - x0), H / (y1 - y0));
    const ox = (W - (x1 - x0) * k) / 2;
    const oy = (H - (y1 - y0) * k) / 2;
    return {
      x: (lon) => ox + (lon * toRad - x0) * k,
      y: (lat) => H - (oy + (mercY(lat) - y0) * k),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed.map((r) => r.id).join()]);

  const landPath = useMemo(() => {
    if (!land || !frame) return '';
    const rings = [];
    for (const f of land.features ?? []) {
      const g = f.geometry;
      const polys = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : [];
      for (const poly of polys) {
        for (const ring of poly) {
          rings.push(`M${ring.map(([lon, lat]) => `${frame.x(lon).toFixed(1)},${frame.y(lat).toFixed(1)}`).join('L')}Z`);
        }
      }
    }
    return rings.join('');
  }, [land, frame]);

  const ramp = statRamp(measure, key);
  const maxPop = Math.max(1, ...placed.map((r) => r.population ?? 0));
  const radius = (pop) => 4 + Math.sqrt((pop ?? 0) / maxPop) * 10;
  const fmt = (v) => formatStat(measure, key, v, ctx);
  // Larger dots first, so a small city on top of a big one stays visible.
  const drawn = [...placed].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));

  if (!frame) return <p className="aa-stats__empty">{ctx.t('stats.noValues')}</p>;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="aa-stats__map" role="img" aria-label={ctx.t('stats.views.map')}>
        <rect width={W} height={H} fill="var(--map-paper)" />
        <path d={landPath} fill="var(--map-land)" stroke="var(--map-land-line)" strokeWidth="0.6" />
        {drawn.map((row) => {
          const value = statValue(row.stat, key, index);
          const slot = slots.get(row.id);
          const cx = frame.x(row.center[0]);
          const cy = frame.y(row.center[1]);
          const r = radius(row.population);
          const name = rowName(row, ctx.lang);
          const content = (
            <TipBody title={name} lines={[[statLabel(measure, key, index, ctx.t, ctx.n), fmt(value)], ...distributionLines(measure, row.stat, ctx).slice(-1)]} />
          );
          return (
            <g
              key={row.id}
              className="aa-stats__mapdot"
              onPointerMove={(e) => show(e, content)}
              onPointerLeave={hide}
              onClick={() => onToggle(row.id)}
            >
              <circle cx={cx} cy={cy} r={Math.max(r, 12)} fill="transparent" />
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={ramp ? colorAt(ramp, value) : 'var(--ink-3)'}
                stroke={slot != null ? HIGHLIGHT[slot] : 'rgba(21, 23, 26, 0.5)'}
                strokeWidth={slot != null ? 3 : 0.8}
              />
              {slot != null && (
                <text x={cx} y={cy - r - 5} textAnchor="middle" className="aa-stats__svglabel">
                  {name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {ramp && (
        <div className="aa-stats__legend">
          <RampLegend ramp={ramp} format={(v) => (measure.kind === 'minutes' && !['share', 'zone', 'unreachable', 'gini', 'theil', 'ratio'].includes(key) ? `${ctx.n(v)}′` : fmt(v))} />
        </div>
      )}
      <p className="aa-stats__caption">{ctx.t('stats.mapCaption')}</p>
    </div>
  );
}

// ── scatter ──────────────────────────────────────────────────────────

/** Two figures against each other, one dot per city, sized by residents. */
export function ScatterView({ stats, unit, rows, spec, specY, slots, onToggle, ctx }) {
  const { show, hide } = ctx.tipApi;
  const yRows = new Map(statRows(stats, unit, specY.measure.id).map((r) => [r.id, r]));
  const points = rows
    .map((row) => ({
      row,
      x: statValue(row.stat, spec.key, spec.index),
      y: statValue(yRows.get(row.id)?.stat, specY.key, specY.index),
    }))
    .filter((p) => p.x != null && p.y != null && !(spec.measure.sentinel != null && p.x >= spec.measure.sentinel) && !(specY.measure.sentinel != null && p.y >= specY.measure.sentinel));

  const PAD = { left: 66, right: 24, top: 18, bottom: 48 };
  const SW = 760;
  const SH = 440;
  if (!points.length) return <p className="aa-stats__empty">{ctx.t('stats.noPairs')}</p>;
  const [x0, x1] = domainFor(spec.measure, spec.key, points.map((p) => p.row), spec.index);
  const [y0, y1] = domainFor(specY.measure, specY.key, points.map((p) => yRows.get(p.row.id)), specY.index);
  const px = (v) => PAD.left + ((v - x0) / (x1 - x0 || 1)) * (SW - PAD.left - PAD.right);
  const py = (v) => SH - PAD.bottom - ((v - y0) / (y1 - y0 || 1)) * (SH - PAD.top - PAD.bottom);
  const maxPop = Math.max(1, ...points.map((p) => p.row.population ?? 0));
  const radius = (pop) => 4 + Math.sqrt((pop ?? 0) / maxPop) * 11;
  const fx = (v) => formatStat(spec.measure, spec.key, v, ctx);
  const fy = (v) => formatStat(specY.measure, specY.key, v, ctx);
  const labelX = `${measureLabel(spec.measure, ctx.t, stats.measuresById)} · ${statLabel(spec.measure, spec.key, spec.index, ctx.t, ctx.n)}`;
  const labelY = `${measureLabel(specY.measure, ctx.t, stats.measuresById)} · ${statLabel(specY.measure, specY.key, specY.index, ctx.t, ctx.n)}`;

  // Highlighted cities drawn last, so they sit on top. Names are placed
  // greedily, highlighted first and then by residents: a name that would
  // overlap one already placed is left to the tooltip rather than printed
  // over it.
  const placed = points
    .map((p) => ({ ...p, r: radius(p.row.population), slot: slots.get(p.row.id) }))
    .sort((a, b) => (a.slot != null) - (b.slot != null) || (b.row.population ?? 0) - (a.row.population ?? 0));
  const labels = [];
  const boxes = [];
  for (const p of [...placed].sort((a, b) => (b.slot != null) - (a.slot != null) || (b.row.population ?? 0) - (a.row.population ?? 0))) {
    const on = p.slot != null;
    const w = rowName(p.row, ctx.lang).length * (on ? 6.4 : 5.6) + 4;
    const lx = px(p.x);
    const ly = py(p.y) - p.r - 4;
    const box = [lx - w / 2, ly - 10, lx + w / 2, ly + 2];
    if (!on && boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
    boxes.push(box);
    labels.push({ row: p.row, x: lx, y: ly, on });
  }

  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="aa-stats__scatter" role="img" aria-label={`${labelY} / ${labelX}`}>
      {niceTicks(x0, x1).map((v) => (
        <g key={`x${v}`}>
          <line x1={px(v)} x2={px(v)} y1={PAD.top} y2={SH - PAD.bottom} stroke="var(--hair-soft)" />
          <text x={px(v)} y={SH - PAD.bottom + 15} textAnchor="middle" className="aa-stats__axis">
            {fx(v)}
          </text>
        </g>
      ))}
      {niceTicks(y0, y1).map((v) => (
        <g key={`y${v}`}>
          <line x1={PAD.left} x2={SW - PAD.right} y1={py(v)} y2={py(v)} stroke="var(--hair-soft)" />
          <text x={PAD.left - 8} y={py(v) + 3} textAnchor="end" className="aa-stats__axis">
            {fy(v)}
          </text>
        </g>
      ))}
      <text x={(PAD.left + SW - PAD.right) / 2} y={SH - 8} textAnchor="middle" className="aa-stats__axis aa-stats__axis--title">
        {labelX} →
      </text>
      <text
        x={14}
        y={(SH - PAD.bottom + PAD.top) / 2}
        textAnchor="middle"
        transform={`rotate(-90 14 ${(SH - PAD.bottom + PAD.top) / 2})`}
        className="aa-stats__axis aa-stats__axis--title"
      >
        {labelY} →
      </text>
      {placed.map(({ row, x, y, r, slot }) => {
        const name = rowName(row, ctx.lang);
        const content = <TipBody title={name} lines={[[labelX, fx(x)], [labelY, fy(y)]]} />;
        return (
          <g
            key={row.id}
            className="aa-stats__mapdot"
            onPointerMove={(e) => show(e, content)}
            onPointerLeave={hide}
            onClick={() => onToggle(row.id)}
          >
            <circle cx={px(x)} cy={py(y)} r={Math.max(r, 12)} fill="transparent" />
            <circle
              cx={px(x)}
              cy={py(y)}
              r={r}
              fill={slot != null ? HIGHLIGHT[slot] : 'var(--ink-3)'}
              fillOpacity={slot != null ? 0.9 : 0.45}
              stroke="var(--card)"
              strokeWidth="1.5"
            />
          </g>
        );
      })}
      {labels.map(({ row, x, y, on }) => (
        <text key={row.id} x={x} y={y} textAnchor="middle" className={`aa-stats__svglabel${on ? ' aa-stats__svglabel--on' : ''}`}>
          {rowName(row, ctx.lang)}
        </text>
      ))}
    </svg>
  );
}

// ── matrix ───────────────────────────────────────────────────────────

/**
 * Every city against the headline figures at once. A cell's shade is the
 * city's position among the cities on screen, darker for better — the one
 * place on the page where colour is a rank rather than a value, because the
 * columns share no unit. The value itself is printed in the cell.
 */
export function MatrixView({ stats, unit, rows, spec, slots, onToggle, onPick, ctx }) {
  const { show, hide } = ctx.tipApi;
  const columns = useMemo(() => {
    const list = HEADLINES.map(([id, key, index = 0]) => ({ id, key: unit === 'country' && key.startsWith('p') ? 'mean' : key, index }))
      .filter((c) => stats.measuresById[c.id])
      .filter((c) => unit === 'city' || stats.countries.some((country) => country.values?.[c.id]));
    const current = { id: spec.measure.id, key: spec.key, index: spec.index };
    if (!list.some((c) => c.id === current.id && c.key === current.key && c.index === current.index)) list.unshift(current);
    return list.map((c) => ({ ...c, measure: stats.measuresById[c.id] }));
  }, [stats, unit, spec]);

  const byColumn = columns.map((c) => {
    const values = new Map(statRows(stats, unit, c.id).map((r) => [r.id, statValue(r.stat, c.key, c.index)]));
    const shown = rows.map((r) => values.get(r.id)).filter((v) => v != null && !(c.measure.sentinel != null && v >= c.measure.sentinel));
    const direction = statDirection(c.measure, c.key, c.index);
    const percentile = (v) => {
      if (v == null || !direction || shown.length < 2) return null;
      const below = shown.filter((w) => (direction === 'up' ? w < v : w > v)).length;
      return below / (shown.length - 1);
    };
    return { ...c, values, percentile };
  });

  const ordered = orderRows(rows, spec.measure, spec.key, spec.index);
  const rest = rows.filter((r) => !ordered.includes(r)).sort((a, b) => rowName(a, ctx.lang).localeCompare(rowName(b, ctx.lang)));

  return (
    <div className="aa-stats__matrixwrap">
      <table className="aa-stats__matrix">
        <thead>
          <tr>
            <th />
            {byColumn.map((c) => (
              <th key={`${c.id}${c.key}${c.index}`}>
                <button type="button" className="aa-stats__colpick" onClick={() => onPick(c)} title={ctx.t('stats.matrixPick')}>
                  <span className="aa-stats__collayer">{ctx.layerName(c.measure.layer)}</span>
                  <span>{measureLabel(c.measure, ctx.t, stats.measuresById)}</span>
                  <span className="aa-stats__colstat">{statLabel(c.measure, c.key, c.index, ctx.t, ctx.n)}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...ordered, ...rest].map((row) => {
            const slot = slots.get(row.id);
            const name = rowName(row, ctx.lang);
            return (
              <tr key={row.id}>
                <th scope="row">
                  <button type="button" className="aa-stats__pick" onClick={() => onToggle(row.id)} aria-pressed={slot != null}>
                    <Key slot={slot} />
                    <span className="aa-stats__pickname">{name}</span>
                  </button>
                </th>
                {byColumn.map((c) => {
                  const v = c.values.get(row.id);
                  const p = c.percentile(v);
                  const text = formatStat(c.measure, c.key, v, ctx);
                  return (
                    <td
                      key={`${c.id}${c.key}${c.index}`}
                      className={`aa-mono${p != null && p > 0.55 ? ' aa-stats__cell--dark' : ''}`}
                      style={{ background: p == null ? undefined : colorAt(MATRIX_RAMP, p) }}
                      onPointerMove={(e) =>
                        show(e, <TipBody title={name} lines={[[`${measureLabel(c.measure, ctx.t, stats.measuresById)} · ${statLabel(c.measure, c.key, c.index, ctx.t, ctx.n)}`, text]]} />)
                      }
                      onPointerLeave={hide}
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const MATRIX_RAMP = {
  stops: [
    [0, '#f4f1e8'],
    [0.5, '#a9c1d3'],
    [1, '#2b4a86'],
  ],
};

// ── curves ───────────────────────────────────────────────────────────

/**
 * How a figure changes along something the file measures it on: the share
 * of residents at each threshold, or (CityChrone) the hour of the day. Every
 * city is a faint line; the highlighted ones are coloured and named at
 * their end, so no line is identified by colour alone.
 */
export function CurvesView({ stats, unit, rows, spec, slots, onToggle, ctx }) {
  const { measure, key, index } = spec;
  const { show, hide } = ctx.tipApi;
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  if (measure.kind === 'zones') return <ZoneBars rows={rows} spec={spec} slots={slots} onToggle={onToggle} ctx={ctx} />;
  if (measure.kind === 'correlation') return <p className="aa-stats__empty">{ctx.t('stats.note.curvesNone')}</p>;

  const hourly = measure.layer === 'citychrone';
  let xs;
  let seriesOf;
  let yKey;
  if (hourly) {
    xs = Array.from({ length: 24 }, (_, h) => h);
    const byHour = xs.map((h) => {
      const id = `citychrone.${measure.facets.score}.${String(h).padStart(2, '0')}`;
      return new Map(statRows(stats, unit, id).map((r) => [r.id, r.stat]));
    });
    yKey = key;
    seriesOf = (row) => xs.map((h, i) => statValue(byHour[i].get(row.id), key, index));
  } else {
    xs = measure.thresholds.map((_, i) => i);
    yKey = 'share';
    seriesOf = (row) => xs.map((i) => statValue(row.stat, 'share', i));
  }

  const series = rows.map((row) => ({ row, values: seriesOf(row) })).filter((s) => s.values.some((v) => v != null));
  if (!series.length) return <p className="aa-stats__empty">{ctx.t('stats.noValues')}</p>;

  const CW = 760;
  const CH = 400;
  const PAD = { left: 62, right: 120, top: 16, bottom: 44 };
  const all = series.flatMap((s) => s.values).filter((v) => v != null);
  let [y0, y1] = ['share', 'zone', 'unreachable'].includes(yKey)
    ? [0, 100]
    : ['gini', 'theil'].includes(yKey) || (!measure.signed && Math.min(...all) >= 0)
      ? [0, Math.max(...all)]
      : [Math.min(...all, 0), Math.max(...all, 0)];
  // End the axis on a labelled tick rather than just past the data.
  const yTicks = niceTicks(y0, y1);
  if (yTicks.length > 1 && yTicks[yTicks.length - 1] < y1) {
    yTicks.push(yTicks[yTicks.length - 1] + (yTicks[1] - yTicks[0]));
    y1 = yTicks[yTicks.length - 1];
  }
  const px = (i) => PAD.left + (i / (xs.length - 1 || 1)) * (CW - PAD.left - PAD.right);
  const py = (v) => CH - PAD.bottom - ((v - y0) / (y1 - y0 || 1)) * (CH - PAD.top - PAD.bottom);
  const fy = (v) => formatStat(measure, yKey, v, ctx);
  const xLabel = (i) => (hourly ? hourLabel(xs[i], ctx.t) : formatThreshold(measure, measure.thresholds[i], ctx.n));
  const line = (values) =>
    values
      .map((v, i) => (v == null ? null : `${px(i).toFixed(1)},${py(v).toFixed(1)}`))
      .reduce((acc, p) => {
        if (!p) acc.push([]);
        else acc[acc.length - 1].push(p);
        return acc;
      }, [[]])
      .filter((seg) => seg.length)
      .map((seg) => `M${seg.join('L')}`)
      .join('');

  const highlighted = series.filter((s) => slots.has(s.row.id));
  const faint = series.filter((s) => !slots.has(s.row.id));
  // End labels, nudged apart so two close lines do not print over each other.
  const labels = highlighted
    .map((s) => {
      const last = s.values.map((v, i) => [v, i]).filter(([v]) => v != null).pop();
      return { s, y: py(last[0]) };
    })
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 13);

  const onMove = (event) => {
    const box = svgRef.current.getBoundingClientRect();
    const fx = ((event.clientX - box.left) / box.width) * CW;
    const i = Math.round(((fx - PAD.left) / (CW - PAD.left - PAD.right)) * (xs.length - 1));
    if (i < 0 || i >= xs.length) {
      setHover(null);
      hide();
      return;
    }
    setHover(i);
    const shown = (highlighted.length ? highlighted : series)
      .map((s) => [rowName(s.row, ctx.lang), s.values[i]])
      .filter(([, v]) => v != null)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    show(event, <TipBody title={xLabel(i)} lines={shown.map(([name, v]) => [name, fy(v)])} note={highlighted.length ? null : ctx.t('stats.curvesTop')} />);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CW} ${CH}`}
      className="aa-stats__curves"
      role="img"
      aria-label={measureLabel(measure, ctx.t, stats.measuresById)}
      onPointerMove={onMove}
      onPointerLeave={() => {
        setHover(null);
        hide();
      }}
    >
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={CW - PAD.right} y1={py(v)} y2={py(v)} stroke="var(--hair-soft)" />
          <text x={PAD.left - 8} y={py(v) + 3} textAnchor="end" className="aa-stats__axis">
            {fy(v)}
          </text>
        </g>
      ))}
      {xs.map((_, i) =>
        !hourly || i % 3 === 0 ? (
          <text key={i} x={px(i)} y={CH - PAD.bottom + 16} textAnchor="middle" className="aa-stats__axis">
            {xLabel(i)}
          </text>
        ) : null,
      )}
      <text x={(PAD.left + CW - PAD.right) / 2} y={CH - 6} textAnchor="middle" className="aa-stats__axis aa-stats__axis--title">
        {hourly ? ctx.t('stats.hour') : `${ctx.t('stats.threshold')} (${ctx.t(`stats.sideShort.${measure.side}`)})`}
      </text>
      {hover != null && <line x1={px(hover)} x2={px(hover)} y1={PAD.top} y2={CH - PAD.bottom} stroke="var(--ink-4)" strokeWidth="1" />}
      {faint.map((s) => (
        <path key={s.row.id} d={line(s.values)} fill="none" stroke="var(--ink-3)" strokeOpacity="0.35" strokeWidth="1.2" />
      ))}
      {highlighted.map((s) => (
        <g key={s.row.id}>
          <path d={line(s.values)} fill="none" stroke={HIGHLIGHT[slots.get(s.row.id)]} strokeWidth="2.2" />
          {s.values.map((v, i) => (v == null ? null : <circle key={i} cx={px(i)} cy={py(v)} r={hourly ? 0 : 4} fill={HIGHLIGHT[slots.get(s.row.id)]} stroke="var(--card)" strokeWidth="2" />))}
        </g>
      ))}
      {labels.map(({ s, y }) => (
        <text key={s.row.id} x={CW - PAD.right + 8} y={y + 4} className="aa-stats__svglabel aa-stats__svglabel--on">
          {rowName(s.row, ctx.lang)}
        </text>
      ))}
      {!highlighted.length && (
        <text x={CW - PAD.right + 8} y={PAD.top + 10} className="aa-stats__axis">
          {ctx.t('stats.curvesPick')}
        </text>
      )}
    </svg>
  );
}

/** The four zones as one bar per city, residents rather than cells. */
function ZoneBars({ rows, spec, slots, onToggle, ctx }) {
  const { show, hide } = ctx.tipApi;
  const ordered = orderRows(rows, spec.measure, 'zone', 0);
  return (
    <div className="aa-stats__zones">
      <div className="aa-stats__zonekey">
        {ZONES.map((zone) => (
          <span key={zone.id}>
            <span className="aa-swatch" style={{ background: zone.color }} />
            {ctx.t(`city.zones.${zone.key}.name`)}
          </span>
        ))}
      </div>
      {ordered.map((row) => {
        const slot = slots.get(row.id);
        const name = rowName(row, ctx.lang);
        return (
          <div className="aa-stats__zrow" key={row.id}>
            <button type="button" className="aa-stats__pick" onClick={() => onToggle(row.id)} aria-pressed={slot != null}>
              <Key slot={slot} />
              <span className="aa-stats__pickname">{name}</span>
            </button>
            <span className="aa-stats__stack">
              {(row.stat?.shares ?? []).map((share, i) => (
                <span
                  key={ZONE_KEYS[i]}
                  style={{ width: `${share}%`, background: ZONES[i].color }}
                  onPointerMove={(e) => show(e, <TipBody title={name} lines={[[ctx.t(`city.zones.${ZONE_KEYS[i]}.name`), formatStat(spec.measure, 'zone', share, ctx)]]} />)}
                  onPointerLeave={hide}
                />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
