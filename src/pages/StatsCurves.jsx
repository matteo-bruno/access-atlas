import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  HIGHLIGHT,
  MAX_HIGHLIGHT,
  cumulativePoints,
  formatStat,
  formatThreshold,
  hourLabel,
  measureLabel,
  rowName,
  statLabel,
  statRows,
  statValue,
} from '../data/stats.js';
import { niceTicks } from './StatsViews.jsx';

// The curves of the Stats page, and the box their cities are picked with.
//
// A curve is a city: for a distribution, the share of its residents on the
// measure's side of each value (`cumulativePoints`), for CityChrone its
// figure at each hour. Up to eight cities are drawn in colour, each named at
// its end and in the chips above, so no line is told apart by colour alone;
// every other city on screen is a faint grey line behind them, named when
// the pointer is on it. Nothing here computes a figure: the points are the
// published quantiles and shares, joined by straight lines.

// Lower case, accents off: "zurich" finds Zürich, "sao" São Paulo.
const fold = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

/** How well a row answers a query, lower is better, or null: name, then word, then anywhere, then its country. */
function score(entry, q) {
  let best = null;
  for (const name of entry.names) {
    const s = name.startsWith(q) ? 0 : name.split(/[\s\-'’(]+/).some((w) => w.startsWith(q)) ? 1 : name.includes(q) ? 2 : null;
    if (s != null && (best == null || s < best)) best = s;
  }
  if (best == null && entry.places.some((p) => p.startsWith(q))) best = 3;
  return best;
}

const compact = (v, n) => (v >= 1e6 ? `${n(v / 1e6, { maximumFractionDigits: 1 })} M` : v >= 1e3 ? `${n(Math.round(v / 1e3))} k` : n(v));

// ── picking cities by name ───────────────────────────────────────────

/**
 * The cities a chart draws, as chips in their colours, and a box that adds
 * one by its name: an ARIA combobox, arrows and Enter, Backspace on an empty
 * box removes the last city. Slots are positions, so removing one city never
 * repaints the others.
 *
 * @param {object[]} props.pool       rows that can be picked
 * @param {string[]} props.picked     one id per slot, '' for an empty slot
 * @param {(next: string[]) => void} props.onChange
 * @param {(id: string|null) => void} [props.onHover]  a chip under the pointer
 */
export function CityPicker({ pool, picked, onChange, onHover, unit = 'city', note, ctx }) {
  const { t, n, lang } = ctx;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const byId = useMemo(() => new Map(pool.map((r) => [r.id, r])), [pool]);
  const index = useMemo(
    () =>
      pool.map((row) => ({
        row,
        names: [...new Set([row.name, row.nameIt, rowName(row, lang)].filter(Boolean).map(fold))],
        places: row.kind === 'city' ? [row.city?.region, row.city?.regionIt, row.country].filter(Boolean).map(fold) : [],
      })),
    [pool, lang],
  );
  const slots = [...picked];
  while (slots.length < MAX_HIGHLIGHT) slots.push('');
  const taken = new Set(slots.filter(Boolean));
  const full = taken.size >= MAX_HIGHLIGHT;

  const q = fold(query.trim());
  const matches = q
    ? index
        .filter((e) => !taken.has(e.row.id))
        .map((e) => ({ e, s: score(e, q) }))
        .filter((x) => x.s != null)
        .sort((a, b) => a.s - b.s || (b.e.row.population ?? 0) - (a.e.row.population ?? 0))
        .slice(0, 8)
        .map((x) => x.e.row)
    : [];
  const shown = open && q !== '';
  const current = Math.min(active, Math.max(0, matches.length - 1));

  const add = (row) => {
    const next = [...slots];
    const free = next.indexOf('');
    if (!row || free < 0) return;
    next[free] = row.id;
    onChange(next);
    setQuery('');
    setActive(0);
  };
  const remove = (id) => onChange(slots.map((x) => (x === id ? '' : x)));

  const onKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      if (matches.length) setActive((current + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      if (shown && matches[current]) {
        e.preventDefault();
        add(matches[current]);
      }
    } else if (e.key === 'Escape') {
      if (query) setQuery('');
      else e.currentTarget.blur();
    } else if (e.key === 'Backspace' && !query) {
      const last = [...slots].reverse().find(Boolean);
      if (last) remove(last);
    }
  };

  const place = (row) => (row.kind === 'city' ? (lang === 'it' ? row.city?.regionIt ?? row.city?.region : row.city?.region) ?? row.country : '');

  return (
    <div className="aa-cpick">
      <ul className="aa-cpick__chips">
        {slots.map((id, slot) => {
          const row = id ? byId.get(id) : null;
          if (!row) return null;
          const name = rowName(row, lang);
          return (
            <li key={id} className="aa-cpick__chip" onPointerEnter={() => onHover?.(id)} onPointerLeave={() => onHover?.(null)}>
              <span className="aa-cpick__key" style={{ background: HIGHLIGHT[slot] }} aria-hidden="true" />
              <span className="aa-cpick__name">{name}</span>
              {row.kind === 'city' && <span className="aa-cpick__cc">{row.country}</span>}
              <button type="button" className="aa-cpick__x" onClick={() => remove(id)} aria-label={t('stats.selection.remove', { name })}>
                ×
              </button>
            </li>
          );
        })}
        <li className="aa-cpick__field">
          <span className="aa-cpick__plus" aria-hidden="true">
            +
          </span>
          <input
            type="text"
            className="aa-cpick__input"
            role="combobox"
            aria-expanded={shown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={shown && matches[current] ? `${listId}-${current}` : undefined}
            aria-label={t(unit === 'country' ? 'stats.picker.addCountry' : 'stats.picker.add')}
            placeholder={full ? t('stats.picker.full') : t(unit === 'country' ? 'stats.picker.addCountry' : 'stats.picker.add')}
            disabled={full}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKey}
          />
          {shown && (
            <ul className="aa-cpick__menu" id={listId} role="listbox">
              {matches.length ? (
                matches.map((row, i) => (
                  <li
                    key={row.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === current}
                    className={`aa-cpick__option${i === current ? ' aa-cpick__option--on' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      add(row);
                    }}
                    onPointerEnter={() => setActive(i)}
                  >
                    <span className="aa-cpick__optname">{rowName(row, lang)}</span>
                    <span className="aa-cpick__optplace">{place(row)}</span>
                    {row.population != null && <span className="aa-cpick__optpop aa-mono">{compact(row.population, n)}</span>}
                  </li>
                ))
              ) : (
                <li className="aa-cpick__none">{t('stats.picker.none')}</li>
              )}
            </ul>
          )}
        </li>
      </ul>
      {note && <p className="aa-cpick__note">{note}</p>}
    </div>
  );
}

// ── the chart ────────────────────────────────────────────────────────

/**
 * The chart's box in pixels: as wide as its container, so the figures and
 * names print at their true size on a phone as on a desktop, rather than a
 * fixed drawing scaled down to illegible.
 */
function useFrame(ref) {
  const [width, setWidth] = useState(760);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  const CW = Math.max(300, width);
  const narrow = CW < 560;
  return {
    CW,
    CH: Math.round(Math.min(440, Math.max(300, CW * 0.58))),
    PAD: { left: narrow ? 40 : 50, right: narrow ? 84 : 138, top: 34, bottom: 52 },
    narrow,
  };
}

/** A polyline's distance to a point, and the nearest point on it. Null entries break the line. */
function nearestOn(pts, mx, my) {
  let best = { d: Infinity, at: null };
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    if (!a) continue;
    const b = pts[i + 1];
    let qx = a[0];
    let qy = a[1];
    if (b) {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = dx * dx + dy * dy;
      const k = len ? Math.max(0, Math.min(1, ((mx - a[0]) * dx + (my - a[1]) * dy) / len)) : 0;
      qx = a[0] + k * dx;
      qy = a[1] + k * dy;
    }
    const d = Math.hypot(mx - qx, my - qy);
    if (d < best.d) best = { d, at: [qx, qy] };
  }
  return best;
}

/** Where a line meets the right edge of the plot: its last point, or where it crosses the edge. */
function endOf(points, x1) {
  const known = points.filter(Boolean);
  if (!known.length) return null;
  for (let i = 1; i < known.length; i++) {
    const [ax, ay] = known[i - 1];
    const [bx, by] = known[i];
    if (bx > x1 && ax <= x1) return [x1, ay + ((x1 - ax) / (bx - ax || 1)) * (by - ay)];
  }
  const last = known[known.length - 1];
  return last[0] > x1 ? null : last;
}

/**
 * Lines on one pair of axes. `series` are drawn in colour and named; the
 * `context` lines are grey and named only under the pointer, which can add
 * one with a click. The crosshair snaps to `snaps`, the positions where every
 * line has a measured value, and the tooltip lists them all there.
 */
function CurveChart({ series, context, x, y, snaps, snapLabel, readout, markers, guide, emphasis, onAdd, ariaLabel, ctx }) {
  const { t } = ctx;
  const { show, hide } = ctx.tipApi;
  const svgRef = useRef(null);
  const boxRef = useRef(null);
  const { CW, CH, PAD, narrow } = useFrame(boxRef);
  const clip = `aa-curves-${useId().replace(/[^a-z0-9]/gi, '')}`;
  const [hover, setHover] = useState(null);
  const [x0, x1] = x.domain;
  const [y0, y1] = y.domain;
  const px = (v) => PAD.left + ((v - x0) / (x1 - x0 || 1)) * (CW - PAD.left - PAD.right);
  const py = (v) => CH - PAD.bottom - ((v - y0) / (y1 - y0 || 1)) * (CH - PAD.top - PAD.bottom);
  const project = (points) => points.map((p) => (p ? [px(p[0]), py(p[1])] : null));
  const pathOf = (pts) =>
    pts
      .reduce(
        (acc, p) => {
          if (!p) acc.push([]);
          else acc[acc.length - 1].push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
          return acc;
        },
        [[]],
      )
      .filter((seg) => seg.length)
      .map((seg) => `M${seg.join('L')}`)
      .join('');

  const drawn = useMemo(() => series.map((s) => ({ ...s, pts: project(s.points) })), [series, x0, x1, y0, y1, CW, CH]); // eslint-disable-line react-hooks/exhaustive-deps
  const faint = useMemo(() => context.map((s) => ({ ...s, pts: project(s.points) })), [context, x0, x1, y0, y1, CW, CH]); // eslint-disable-line react-hooks/exhaustive-deps
  const focused = hover?.id ?? emphasis ?? null;

  // Every coloured line is named. One that reaches the right edge is named
  // in the gutter, tied to its end by a hairline; one that stops inside the
  // plot is named where it stops, since a hairline across the plot would
  // read as more line. Names are nudged apart so none prints over another.
  const right = CW - PAD.right;
  const ends = drawn
    .map((s) => {
      const end = endOf(s.points, x1);
      return end ? { s, ex: px(end[0]), ey: py(end[1]), y: py(end[1]) } : null;
    })
    .filter(Boolean);
  const labels = ends.filter((l) => l.ex >= right - 2).sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 15);
  const overflow = labels.length ? labels[labels.length - 1].y - (CH - PAD.bottom) : 0;
  if (overflow > 0) {
    for (const l of labels) l.y -= overflow;
    for (let i = labels.length - 2; i >= 0; i--) labels[i].y = Math.min(labels[i].y, labels[i + 1].y - 15);
  }
  const inner = ends.filter((l) => l.ex < right - 2).sort((a, b) => a.y - b.y);
  inner.forEach((l, i) => {
    const above = inner.slice(0, i).filter((o) => Math.abs(o.ex - l.ex) < 90);
    if (above.length) l.y = Math.max(l.y, Math.max(...above.map((o) => o.y)) + 15);
  });

  const leave = () => {
    setHover(null);
    hide();
  };

  const onMove = (event) => {
    const box = svgRef.current.getBoundingClientRect();
    const mx = ((event.clientX - box.left) / box.width) * CW;
    const my = ((event.clientY - box.top) / box.height) * CH;
    if (mx < PAD.left - 8 || mx > CW - PAD.right + 8 || my < PAD.top - 12 || my > CH - PAD.bottom + 8) {
      leave();
      return;
    }
    // A coloured line wins within a generous reach; a grey one only close up.
    let hit = null;
    for (const s of drawn) {
      const r = nearestOn(s.pts, mx, my);
      if (r.d < 16 && (!hit || r.d < hit.d)) hit = { ...r, id: s.id, name: s.name, color: s.color, kind: 'series' };
    }
    if (!hit) {
      for (const s of faint) {
        const r = nearestOn(s.pts, mx, my);
        if (r.d < 7 && (!hit || r.d < hit.d)) hit = { ...r, id: s.id, name: s.name, kind: 'context', row: s.row };
      }
    }
    let snap = 0;
    snaps.forEach((v, i) => {
      if (Math.abs(px(v) - mx) < Math.abs(px(snaps[snap]) - mx)) snap = i;
    });
    setHover({ ...(hit ?? {}), snap });

    const lines = drawn
      .map((s) => ({ s, v: readout(s.row, snap) }))
      .filter(({ v }) => v != null)
      .sort((a, b) => b.v - a.v);
    const extra = hit?.kind === 'context' ? readout(hit.row, snap) : null;
    show(
      event,
      <>
        <div className="aa-stats__tiptitle aa-curves__tiptitle">{snapLabel(snap)}</div>
        {hit?.kind === 'context' && (
          <div className="aa-curves__tipline aa-curves__tipline--on">
            <span className="aa-curves__tipkey" style={{ background: 'var(--ink-4)' }} />
            <span className="aa-mono">{extra != null ? (y.value ?? y.format)(extra) : '—'}</span>
            <span>{hit.name}</span>
          </div>
        )}
        {lines.map(({ s, v }) => (
          <div key={s.id} className={`aa-curves__tipline${hit?.id === s.id ? ' aa-curves__tipline--on' : ''}`}>
            <span className="aa-curves__tipkey" style={{ background: s.color }} />
            <span className="aa-mono">{(y.value ?? y.format)(v)}</span>
            <span>{s.name}</span>
          </div>
        ))}
        {hit?.kind === 'context' && onAdd && <div className="aa-stats__tipnote">{t('stats.picker.clickToAdd')}</div>}
      </>,
    );
  };

  const yTicks = y.ticks;
  // On a phone every other tick, so the figures do not run together.
  const xTicks = narrow && x.ticks.length > 5 ? x.ticks.filter((_, i) => i % 2 === 0) : x.ticks;
  const hoverAt = hover?.at;
  const hoverLeft = hoverAt && hoverAt[0] > CW - PAD.right - 120;

  return (
    <div ref={boxRef} className="aa-curves__box">
      <svg
        ref={svgRef}
        width={CW}
        height={CH}
        viewBox={`0 0 ${CW} ${CH}`}
        className="aa-curves__svg"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={leave}
        onClick={() => hover?.kind === 'context' && onAdd?.(hover.row)}
        style={{ cursor: hover?.kind === 'context' && onAdd ? 'pointer' : undefined }}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={PAD.left} y={PAD.top - 6} width={CW - PAD.left - PAD.right} height={CH - PAD.top - PAD.bottom + 12} />
          </clipPath>
        </defs>

        {/* The axes: recessive hairlines, the figures in muted ink. */}
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line x1={PAD.left} x2={CW - PAD.right} y1={py(v)} y2={py(v)} className={v === y0 ? 'aa-curves__base' : 'aa-curves__grid'} />
            <text x={PAD.left - 8} y={py(v) + 3.5} textAnchor="end" className="aa-stats__axis">
              {y.format(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={`x${v}`} x={px(v)} y={CH - PAD.bottom + 17} textAnchor="middle" className="aa-stats__axis">
            {x.format(v)}
          </text>
        ))}
        <text x={PAD.left} y={PAD.top - 16} className="aa-stats__axis aa-stats__axis--title">
          {y.title}
        </text>
        <text x={(PAD.left + CW - PAD.right) / 2} y={CH - 10} textAnchor="middle" className="aa-stats__axis aa-stats__axis--title">
          {x.title}
        </text>

        {guide && guide.value > x0 && guide.value < x1 && (
          <g className="aa-curves__guide">
            <line x1={px(guide.value)} x2={px(guide.value)} y1={PAD.top - 4} y2={CH - PAD.bottom} />
            <text x={px(guide.value) + 6} y={CH - PAD.bottom - 8}>
              {guide.label}
            </text>
          </g>
        )}

        <g clipPath={`url(#${clip})`}>
          {faint.map((s) => (
            <path key={s.id} d={pathOf(s.pts)} className={`aa-curves__faint${focused === s.id ? ' aa-curves__faint--on' : ''}`} />
          ))}
        </g>

        {hover && snaps.length > 0 && (
          <line x1={px(snaps[hover.snap])} x2={px(snaps[hover.snap])} y1={PAD.top - 4} y2={CH - PAD.bottom} className="aa-curves__cross" />
        )}

        <g clipPath={`url(#${clip})`}>
          {[...drawn]
            .sort((a, b) => (a.id === focused) - (b.id === focused))
            .map((s) => {
              const dim = focused && focused !== s.id && drawn.some((d) => d.id === focused);
              return (
                <g key={s.id} className={`aa-curves__series${dim ? ' aa-curves__series--dim' : ''}${focused === s.id ? ' aa-curves__series--on' : ''}`}>
                  <path d={pathOf(s.pts)} stroke={s.color} className="aa-curves__line" />
                  {markers &&
                    s.pts.map((p, i) =>
                      p ? <circle key={i} cx={p[0]} cy={p[1]} r={focused === s.id ? 3.6 : 2.8} fill={s.color} className="aa-curves__marker" /> : null,
                    )}
                </g>
              );
            })}
        </g>

        {/* The crosshair's reading, on every line that has one there. */}
        {hover &&
          drawn.map((s) => {
            const v = readout(s.row, hover.snap);
            if (v == null || v < y0 || v > y1) return null;
            return <circle key={s.id} cx={px(snaps[hover.snap])} cy={py(v)} r="4.2" fill={s.color} className="aa-curves__marker aa-curves__marker--cross" />;
          })}

        {labels.map(({ s, ex, ey, y: ly }) => {
          const dim = focused && focused !== s.id && drawn.some((d) => d.id === focused);
          return (
            <g key={s.id} className={`aa-curves__label${dim ? ' aa-curves__label--dim' : ''}`}>
              <polyline points={`${ex + 3},${ey} ${right + 8},${ly} ${right + 12},${ly}`} stroke={s.color} className="aa-curves__leader" />
              <text x={right + 16} y={ly + 4} className={`aa-curves__name${focused === s.id ? ' aa-curves__name--on' : ''}`}>
                {s.name}
              </text>
            </g>
          );
        })}
        {inner.map(({ s, ex, y: ly }) => {
          const dim = focused && focused !== s.id && drawn.some((d) => d.id === focused);
          return (
            <text
              key={s.id}
              x={ex + 8}
              y={ly + 4}
              className={`aa-curves__name aa-curves__name--inner${focused === s.id ? ' aa-curves__name--on' : ''}${dim ? ' aa-curves__label--dim' : ''}`}
            >
              {s.name}
            </text>
          );
        })}

        {/* The line under the pointer, named where the pointer is. */}
        {hoverAt && (
          <g className="aa-curves__hover" pointerEvents="none">
            <circle cx={hoverAt[0]} cy={hoverAt[1]} r="5" fill={hover.kind === 'series' ? hover.color : 'var(--ink-3)'} className="aa-curves__marker" />
            <text x={hoverAt[0] + (hoverLeft ? -10 : 10)} y={hoverAt[1] - 10} textAnchor={hoverLeft ? 'end' : 'start'} className="aa-curves__hovername">
              {hover.name}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── the view ─────────────────────────────────────────────────────────

/** A range on round ticks that covers [lo, hi]. */
function niceDomain(lo, hi) {
  if (!(hi > lo)) return [lo, lo + 1];
  const ticks = niceTicks(lo, hi, 6);
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : hi - lo;
  return [ticks[0] > lo ? ticks[0] - step : ticks[0], ticks[ticks.length - 1] < hi ? ticks[ticks.length - 1] + step : ticks[ticks.length - 1]];
}

const MAX_CONTEXT = 400;

/**
 * Cities as curves, picked by name. For a distribution, the cumulative
 * share of residents along the measure; for CityChrone, the statistic picked
 * at every hour of the day.
 *
 * @param {object[]} props.rows      the rows the filters leave: the grey lines
 * @param {object[]} props.pool      every row that can be picked by name
 * @param {string[]} props.picked    the coloured cities, one id per slot
 * @param {boolean} [props.suggested] the picked cities are a suggestion, not a choice
 */
export function CurvesView({ stats, unit, rows, pool, spec, picked, onPick, suggested, ctx }) {
  const { t, n, lang } = ctx;
  const { measure, key, index = 0 } = spec;
  const [emphasis, setEmphasis] = useState(null);
  const hourly = measure.layer === 'citychrone';

  const model = useMemo(() => {
    if (hourly) {
      const hours = Array.from({ length: 24 }, (_, h) => h);
      const byHour = hours.map((h) => new Map(statRows(stats, unit, `citychrone.${measure.facets.score}.${String(h).padStart(2, '0')}`).map((r) => [r.id, r.stat])));
      const at = (row, h) => statValue(byHour[h].get(row.id), key, index);
      return {
        points: (row) => hours.map((h) => (at(row, h) == null ? null : [h, at(row, h)])),
        snaps: hours,
        readout: at,
        snapLabel: (i) => hourLabel(hours[i], t),
      };
    }
    const thresholds = measure.thresholds ?? [];
    return {
      points: (row) => cumulativePoints(measure, row.stat, stats.quantiles),
      snaps: thresholds,
      readout: (row, i) => statValue(row.stat, 'share', i),
      snapLabel: (i) => t(`stats.side.${measure.side}`, { value: formatThreshold(measure, thresholds[i], n) }),
    };
  }, [stats, unit, measure, key, index, hourly, t, n]);

  const byId = new Map(pool.map((r) => [r.id, r]));
  const series = picked
    .map((id, slot) => {
      const row = id ? byId.get(id) : null;
      if (!row) return null;
      const points = model.points(row);
      return points.some(Boolean) ? { id, row, name: rowName(row, lang), color: HIGHLIGHT[slot], points } : null;
    })
    .filter(Boolean);
  const chosen = new Set(series.map((s) => s.id));
  const context = useMemo(
    () =>
      rows
        .filter((r) => !chosen.has(r.id) && r.stat)
        .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
        .slice(0, MAX_CONTEXT)
        .map((row) => ({ id: row.id, row, name: rowName(row, lang), points: model.points(row) }))
        .filter((s) => s.points.some(Boolean)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, model, lang, [...chosen].join()],
  );

  // The axes. Shares run 0–100%; a travel time runs to the last threshold,
  // like the 15-minute city's own legend, and a line past it is cut at the
  // edge; the index runs its whole range. Scores and CityChrone's hours are
  // fitted to the lines drawn, since they have no natural end.
  const values = [...series, ...context].flatMap((s) => s.points.filter(Boolean));
  let x;
  let y;
  if (hourly) {
    const top = Math.max(1, ...values.map((p) => p[1]));
    const ticks = niceTicks(0, top, 5);
    if (ticks[ticks.length - 1] < top) ticks.push(ticks[ticks.length - 1] + (ticks[1] - ticks[0]));
    x = { domain: [0, 23], ticks: [0, 3, 6, 9, 12, 15, 18, 21], format: (h) => hourLabel(h, t), title: t('stats.hour') };
    y = {
      domain: [0, ticks[ticks.length - 1]],
      ticks,
      // Ticks are round numbers and say so; the readings keep their decimals.
      format: (v) => (['share', 'unreachable'].includes(key) ? `${n(v)}%` : formatStat(measure, key, v, ctx)),
      value: (v) => formatStat(measure, key, v, ctx),
      title: `${t(`stats.measures.${measure.facets.score}`)} · ${statLabel(measure, key, index, t, n)}`,
    };
  } else {
    let domain;
    if (measure.kind === 'minutes') domain = [0, Math.max(...(measure.thresholds ?? [30]))];
    else {
      const xs = [...values.map((p) => p[0]), ...(measure.thresholds ?? [])];
      domain = niceDomain(measure.signed ? Math.min(0, ...xs) : 0, Math.max(...xs));
    }
    x = {
      domain,
      ticks: niceTicks(domain[0], domain[1], 7),
      format: (v) => formatThreshold(measure, v, n),
      title: `${measureLabel(measure, t, stats.measuresById)} →`,
    };
    y = {
      domain: [0, 100],
      ticks: [0, 25, 50, 75, 100],
      format: (v) => `${n(v)}%`,
      value: (v) => formatStat(measure, 'share', v, ctx),
      title: t(`stats.curves.yAxis.${measure.side ?? 'atMost'}`),
    };
  }

  const add = (row) => {
    const next = [...picked];
    while (next.length < MAX_HIGHLIGHT) next.push('');
    const free = next.indexOf('');
    if (free < 0) return;
    next[free] = row.id;
    onPick(next);
  };

  const note = suggested ? t(unit === 'country' ? 'stats.picker.suggestedCountries' : 'stats.picker.suggested', { count: n(series.length) }) : null;

  return (
    <div className="aa-curves">
      <CityPicker pool={pool} picked={picked} onChange={onPick} onHover={setEmphasis} unit={unit} note={note} ctx={ctx} />
      {series.length || context.length ? (
        <CurveChart
          series={series}
          context={context}
          x={x}
          y={y}
          snaps={model.snaps}
          snapLabel={model.snapLabel}
          readout={model.readout}
          markers={!hourly}
          // The 15-minute city's own line, where its name says it is.
          guide={measure.layer === 'fifteen' ? { value: 15, label: formatThreshold(measure, 15, n) } : null}
          emphasis={emphasis}
          onAdd={series.length < MAX_HIGHLIGHT ? add : null}
          ariaLabel={`${measureLabel(measure, t, stats.measuresById)} · ${y.title}`}
          ctx={ctx}
        />
      ) : (
        <p className="aa-stats__empty">{t('stats.noValues')}</p>
      )}
    </div>
  );
}
