import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Explain } from '../components/Explain.jsx';
import { RAMPS, colorAt } from '../map/ramps.js';
import { ZONES } from '../data/platforms.js';
import { CATEGORIES as FIFTEEN_CATEGORIES } from '../data/fifteen.js';
import {
  HIGHLIGHT,
  STAT_RAMPS,
  ZONE_KEYS,
  formatStat,
  formatThreshold,
  hourLabel,
  measureLabel,
  rowName,
  statRows,
  statValue,
} from '../data/stats.js';
import { Key, TipBody, niceTicks } from './StatsViews.jsx';

// The Focus view: one layer on its own terms, with the charts its platform is
// read with, for every city the filters leave. Like the other views it only
// reads published figures; every chart here draws from the statistics file,
// so the same filters, highlights and hidden cities apply.

/** Whether a background colour needs light text on it. */
function isDark(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.45;
}

function Section({ title, about, children, more }) {
  return (
    <section className="aa-focus__section">
      <header className="aa-focus__head">
        <h2 className="aa-focus__title">{title}</h2>
        {about && <Explain body={about} align="right" />}
        {more}
      </header>
      {children}
    </section>
  );
}

function Name({ row, slots, onToggle, ctx }) {
  const slot = slots.get(row.id);
  return (
    <button type="button" className="aa-stats__pick" onClick={() => onToggle(row.id)} aria-pressed={slot != null}>
      <Key slot={slot} />
      <span className="aa-stats__pickname">{rowName(row, ctx.lang)}</span>
    </button>
  );
}

/**
 * @param {object} props
 * @param {(row: object) => boolean} props.pass  the page's filters
 */
export function FocusView({ stats, unit, layer, pass, slots, onToggle, mode, ctx }) {
  const rowsOf = (id) => statRows(stats, unit, id).filter((r) => r.stat && pass(r));
  const props = { stats, unit, rowsOf, slots, onToggle, ctx };
  if (layer === 'fifteen') return <FifteenFocus {...props} mode={mode} />;
  if (layer === 'citychrone') return <CitychroneFocus {...props} />;
  if (layer === 'cardep') return <CardepFocus {...props} />;
  if (layer === 'pov') return <PovFocus {...props} />;
  return <CrossFocus {...props} />;
}

const Empty = ({ ctx }) => <p className="aa-stats__empty">{ctx.t('stats.noValues')}</p>;

// ── 15-minute city ───────────────────────────────────────────────────

function FifteenFocus({ stats, unit, rowsOf, slots, onToggle, mode, ctx }) {
  const { t, n } = ctx;
  const { show, hide } = ctx.tipApi;
  const key = unit === 'country' ? 'mean' : 'p50';
  const lead = stats.measuresById[`fifteen.proximity_time.${mode}`];
  const rows = rowsOf(lead?.id ?? '').sort((a, b) => (statValue(a.stat, key) ?? Infinity) - (statValue(b.stat, key) ?? Infinity));
  if (!rows.length) return <Empty ctx={ctx} />;

  const categories = FIFTEEN_CATEGORIES.filter((c) => stats.measuresById[`fifteen.${c.key}.${mode}`]);
  const columns = categories.map((c) => {
    const measure = stats.measuresById[`fifteen.${c.key}.${mode}`];
    return { category: c, measure, byId: new Map(rowsOf(measure.id).map((r) => [r.id, r.stat])) };
  });

  const at15 = (m) => m?.thresholds?.indexOf(15) ?? -1;
  const foot = stats.measuresById['fifteen.proximity_time.foot'];
  const bike = stats.measuresById['fifteen.proximity_time.bicycle'];
  const footById = new Map(foot ? rowsOf(foot.id).map((r) => [r.id, statValue(r.stat, 'share', at15(foot))]) : []);
  const bikeById = new Map(bike ? rowsOf(bike.id).map((r) => [r.id, statValue(r.stat, 'share', at15(bike))]) : []);
  const byShare = [...rows].sort((a, b) => (footById.get(b.id) ?? -1) - (footById.get(a.id) ?? -1));
  const MODE_COLORS = { foot: '#2b5f86', bike: '#c96a4e' };

  return (
    <div className="aa-focus">
      <Section title={t('stats.focus.fifteen.profile', { mode: t(`fifteen.modes.${mode === 'bicycle' ? 'bike' : 'foot'}`) })} about={t('stats.focus.fifteen.profileAbout')}>
        <div className="aa-stats__matrixwrap">
          <table className="aa-focus__heat">
            <thead>
              <tr>
                <th />
                {columns.map((c) => (
                  <th key={c.category.key} className={c.category.key === 'proximity_time' ? 'aa-focus__lead' : ''}>
                    {t(`fifteen.categories.${c.category.i18n}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    <Name row={row} slots={slots} onToggle={onToggle} ctx={ctx} />
                  </th>
                  {columns.map((c) => {
                    const stat = c.byId.get(row.id);
                    const v = statValue(stat, key);
                    const unreachable = v != null && v >= (c.measure.sentinel ?? Infinity);
                    const bg = v == null ? null : colorAt(RAMPS.fifteen, Math.min(v, 120));
                    const text = formatStat(c.measure, key, v, ctx);
                    return (
                      <td
                        key={c.category.key}
                        className={`aa-mono${bg && isDark(bg) ? ' aa-focus__dark' : ''}${c.category.key === 'proximity_time' ? ' aa-focus__lead' : ''}`}
                        style={{ background: bg ?? undefined }}
                        onPointerMove={(e) =>
                          show(
                            e,
                            <TipBody
                              title={rowName(row, ctx.lang)}
                              lines={[
                                [measureLabel(c.measure, t), text],
                                [t('stats.focus.fifteen.within'), formatStat(c.measure, 'share', statValue(stat, 'share', at15(c.measure)), ctx)],
                              ]}
                            />,
                          )
                        }
                        onPointerLeave={hide}
                      >
                        {unreachable ? '—' : text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {foot && bike && (
        <Section title={t('stats.focus.fifteen.modes')} about={t('stats.focus.fifteen.modesAbout')}>
          <div className="aa-focus__legend">
            {['foot', 'bike'].map((m) => (
              <span key={m}>
                <span className="aa-focus__dot" style={{ background: MODE_COLORS[m] }} />
                {t(`fifteen.modes.${m}`)}
              </span>
            ))}
          </div>
          <div className="aa-focus__rows">
            {byShare.map((row) => {
              const f = footById.get(row.id);
              const b = bikeById.get(row.id);
              const lo = Math.min(f ?? b ?? 0, b ?? f ?? 0);
              const hi = Math.max(f ?? b ?? 0, b ?? f ?? 0);
              return (
                <div className="aa-focus__row" key={row.id}>
                  <Name row={row} slots={slots} onToggle={onToggle} ctx={ctx} />
                  <span className="aa-focus__track">
                    {[0, 25, 50, 75, 100].map((g) => (
                      <span key={g} className="aa-stats__grid" style={{ left: `${g}%` }} />
                    ))}
                    <span className="aa-focus__span" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                    {f != null && <span className="aa-focus__mark" style={{ left: `${f}%`, background: MODE_COLORS.foot }} />}
                    {b != null && <span className="aa-focus__mark" style={{ left: `${b}%`, background: MODE_COLORS.bike }} />}
                  </span>
                  <span className="aa-focus__vals aa-mono">
                    {f != null ? `${n(f, { maximumFractionDigits: 1 })}%` : '—'} · {b != null ? `${n(b, { maximumFractionDigits: 1 })}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── CityChrone ───────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function CitychroneFocus({ stats, rowsOf, slots, onToggle, ctx }) {
  const { t } = ctx;
  const day = rowsOf('citychrone.velocity.day').sort((a, b) => (statValue(b.stat, 'p50') ?? 0) - (statValue(a.stat, 'p50') ?? 0));
  if (!day.length) return <Empty ctx={ctx} />;
  const series = (score) => {
    const hours = HOURS.map((h) => new Map(rowsOf(`citychrone.${score}.${String(h).padStart(2, '0')}`).map((r) => [r.id, r.stat])));
    let top = 0;
    for (const hour of hours) for (const stat of hour.values()) top = Math.max(top, stat?.q?.[3] ?? 0);
    const ticks = niceTicks(0, top, 3);
    return { hours, top: Math.max(top, ticks[ticks.length - 1] ?? top), ticks };
  };
  const velocity = series('velocity');
  const sociality = series('sociality');

  return (
    <div className="aa-focus">
      <Section title={t('stats.focus.citychrone.day')} about={t('stats.focus.citychrone.dayAbout')}>
        <div className="aa-focus__cards">
          {day.map((row) => (
            <div className={`aa-focus__card${slots.has(row.id) ? ' aa-focus__card--on' : ''}`} key={row.id}>
              <Name row={row} slots={slots} onToggle={onToggle} ctx={ctx} />
              <DayChart row={row} score="velocity" data={velocity} measure={stats.measuresById['citychrone.velocity.08']} slot={slots.get(row.id)} ctx={ctx} />
              <DayChart row={row} score="sociality" data={sociality} measure={stats.measuresById['citychrone.sociality.08']} slot={slots.get(row.id)} ctx={ctx} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/** One city's day for one score: the middle half of its residents as a band, the median as a line. */
function DayChart({ row, score, data, measure, slot, ctx }) {
  const { t } = ctx;
  const { show, hide } = ctx.tipApi;
  const ref = useRef(null);
  const [at, setAt] = useState(null);
  const W = 260;
  const H = 74;
  const P = { l: 4, r: 4, t: 6, b: 14 };
  const px = (h) => P.l + (h / 23) * (W - P.l - P.r);
  const py = (v) => H - P.b - (v / (data.top || 1)) * (H - P.t - P.b);
  const stats = data.hours.map((m) => m.get(row.id) ?? null);
  const pts = (k) => stats.map((s, h) => (s?.q ? `${px(h).toFixed(1)},${py(s.q[k]).toFixed(1)}` : null)).filter(Boolean);
  const band = [...pts(1), ...pts(3).reverse()].join(' ');
  const med = stats.map((s) => s?.q?.[2] ?? null);
  const finite = med.map((v, h) => [v, h]).filter(([v]) => v != null);
  if (!finite.length) return null;
  const peak = finite.reduce((a, b) => (b[0] > a[0] ? b : a));
  const low = finite.reduce((a, b) => (b[0] < a[0] ? b : a));
  const fmt = (v) => formatStat(measure, 'p50', v, ctx);
  const colour = slot != null ? HIGHLIGHT[slot] : 'var(--ink)';

  const move = (e) => {
    const box = ref.current.getBoundingClientRect();
    const h = Math.round((((e.clientX - box.left) / box.width) * W - P.l) / ((W - P.l - P.r) / 23));
    if (h < 0 || h > 23 || !stats[h]) return;
    setAt(h);
    show(
      e,
      <TipBody
        title={`${rowName(row, ctx.lang)} · ${hourLabel(h, t)}`}
        lines={[
          [t('stats.statLabels.p50'), fmt(stats[h].q[2])],
          [t('stats.tooltip.iqr'), `${fmt(stats[h].q[1])} – ${fmt(stats[h].q[3])}`],
        ]}
      />,
    );
  };

  return (
    <div className="aa-focus__day">
      <div className="aa-focus__daylabel">
        <span>{t(`stats.measures.${score}`)}</span>
        <span className="aa-mono">
          {t('stats.focus.citychrone.peak')} {hourLabel(peak[1], t)} {fmt(peak[0])} · {t('stats.focus.citychrone.low')} {hourLabel(low[1], t)} {fmt(low[0])}
        </span>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="aa-focus__daysvg"
        onPointerMove={move}
        onPointerLeave={() => {
          setAt(null);
          hide();
        }}
      >
        {data.ticks.map((v) => (
          <line key={v} x1={P.l} x2={W - P.r} y1={py(v)} y2={py(v)} stroke="var(--hair-soft)" />
        ))}
        {[0, 6, 12, 18].map((h) => (
          <text key={h} x={px(h)} y={H - 2} className="aa-stats__axis" textAnchor={h === 0 ? 'start' : 'middle'}>
            {hourLabel(h, t)}
          </text>
        ))}
        <polygon points={band} fill={colour} fillOpacity="0.14" />
        <polyline points={pts(2).join(' ')} fill="none" stroke={colour} strokeWidth="1.8" />
        {at != null && <line x1={px(at)} x2={px(at)} y1={P.t} y2={H - P.b} stroke="var(--ink-4)" />}
      </svg>
    </div>
  );
}

// ── Car Dependency ───────────────────────────────────────────────────

function CardepFocus({ stats, rowsOf, slots, onToggle, ctx }) {
  const { t, n } = ctx;
  const { show, hide } = ctx.tipApi;
  const cdi = stats.measuresById['cardep.cdi'];
  const rows = rowsOf('cardep.cdi').sort((a, b) => statValue(a.stat, 'mean') - statValue(b.stat, 'mean'));
  if (!cdi || !rows.length) return <Empty ctx={ctx} />;
  const extent = Math.max(0.1, ...rows.map((r) => Math.abs(statValue(r.stat, 'mean')))) * 1.1;

  // Residents per index band, from the shares above each threshold.
  const th = cdi.thresholds;
  const bands = [
    { lo: -1, hi: th[0] },
    ...th.slice(0, -1).map((v, i) => ({ lo: v, hi: th[i + 1] })),
    { lo: th[th.length - 1], hi: 1 },
  ].map((b) => ({ ...b, color: colorAt(RAMPS.cdi, (b.lo + b.hi) / 2) }));
  const bandShares = (stat) => {
    const above = stat.shares;
    return bands.map((_, i) => (i === 0 ? 100 - above[0] : i === bands.length - 1 ? above[i - 1] : above[i - 1] - above[i]));
  };
  const label = (b) => `${formatThreshold(cdi, b.lo, n)} … ${formatThreshold(cdi, b.hi, n)}`;

  const car = new Map(rowsOf('cardep.car').map((r) => [r.id, statValue(r.stat, 'mean')]));
  const pt = new Map(rowsOf('cardep.pt').map((r) => [r.id, statValue(r.stat, 'mean')]));
  const points = rows.filter((r) => car.get(r.id) != null && pt.get(r.id) != null).map((r) => ({ row: r, x: car.get(r.id), y: pt.get(r.id) }));

  return (
    <div className="aa-focus">
      <Section title={t('stats.focus.cardep.index')} about={t('stats.focus.cardep.indexAbout')} more={<More slug="car-dependency-index" ctx={ctx} />}>
        <div className="aa-focus__rows">
          {rows.map((row) => {
            const v = statValue(row.stat, 'mean');
            const w = (Math.abs(v) / extent) * 50;
            return (
              <div className="aa-focus__row" key={row.id}>
                <Name row={row} slots={slots} onToggle={onToggle} ctx={ctx} />
                <span className="aa-focus__track">
                  <span className="aa-stats__zero" style={{ left: '50%' }} />
                  <span className="aa-focus__bar" style={{ left: v < 0 ? `${50 - w}%` : '50%', width: `${w}%`, background: colorAt(RAMPS.cdi, v) }} />
                </span>
                <span className="aa-focus__vals aa-mono">{formatStat(cdi, 'mean', v, ctx)}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title={t('stats.focus.cardep.bands')} about={t('stats.focus.cardep.bandsAbout')}>
        <div className="aa-focus__legend">
          {bands.map((b) => (
            <span key={b.lo}>
              <span className="aa-swatch" style={{ background: b.color }} />
              {label(b)}
            </span>
          ))}
        </div>
        <div className="aa-focus__rows">
          {rows.map((row) => (
            <div className="aa-focus__row aa-focus__row--stack" key={row.id}>
              <Name row={row} slots={slots} onToggle={onToggle} ctx={ctx} />
              <span className="aa-stats__stack">
                {bandShares(row.stat).map((share, i) => (
                  <span
                    key={bands[i].lo}
                    style={{ width: `${Math.max(0, share)}%`, background: bands[i].color }}
                    onPointerMove={(e) => show(e, <TipBody title={rowName(row, ctx.lang)} lines={[[label(bands[i]), `${n(Math.max(0, share), { maximumFractionDigits: 1 })}%`]]} />)}
                    onPointerLeave={hide}
                  />
                ))}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {points.length > 0 && (
        <Section title={t('stats.focus.cardep.reach')} about={t('stats.focus.cardep.reachAbout')}>
          <FocusScatter
            points={points}
            fx={(v) => formatStat(stats.measuresById['cardep.car'], 'mean', v, ctx)}
            fy={(v) => formatStat(stats.measuresById['cardep.pt'], 'mean', v, ctx)}
            labelX={t('stats.measures.car')}
            labelY={t('stats.measures.pt')}
            diagonal={t('stats.focus.cardep.equal')}
            slots={slots}
            onToggle={onToggle}
            ctx={ctx}
          />
        </Section>
      )}
    </div>
  );
}

// ── P.O.V. ───────────────────────────────────────────────────────────

function PovFocus({ stats, rowsOf, slots, onToggle, ctx }) {
  const { t, n } = ctx;
  const { show, hide } = ctx.tipApi;
  const common = stats.measuresById['pov.zonesCommon'];
  const own = new Map(rowsOf('pov.zonesCity').map((r) => [r.id, r.stat]));
  const rows = rowsOf(common ? 'pov.zonesCommon' : 'pov.zonesCity').sort((a, b) => (b.stat.shares[0] ?? 0) - (a.stat.shares[0] ?? 0));
  if (!rows.length) return <Empty ctx={ctx} />;
  const cut = common?.zoneThresholds;

  const prox = new Map(rowsOf('pov.proximity').map((r) => [r.id, statValue(r.stat, 'p50')]));
  const opp = new Map(rowsOf('pov.opportunity').map((r) => [r.id, statValue(r.stat, 'p50')]));
  const points = rows.filter((r) => prox.get(r.id) != null && opp.get(r.id) != null).map((r) => ({ row: r, x: prox.get(r.id), y: opp.get(r.id) }));

  const stack = (row, stat) => (
    <span className="aa-stats__stack">
      {(stat?.shares ?? []).map((share, i) => (
        <span
          key={ZONE_KEYS[i]}
          style={{ width: `${share}%`, background: ZONES[i].color }}
          onPointerMove={(e) =>
            show(e, <TipBody title={rowName(row, ctx.lang)} lines={[[t(`city.zones.${ZONE_KEYS[i]}.name`), `${n(share, { maximumFractionDigits: 1 })}%`]]} />)
          }
          onPointerLeave={hide}
        />
      ))}
    </span>
  );

  return (
    <div className="aa-focus">
      <Section
        title={t('stats.focus.pov.zones')}
        about={cut ? t('stats.focus.pov.zonesAbout', { proximity: n(cut.proximity), opportunity: n(cut.opportunity), count: n(cut.cities) }) : null}
        more={<More slug="accessibility-pov" ctx={ctx} />}
      >
        <div className="aa-focus__legend">
          {ZONES.map((zone) => (
            <span key={zone.id}>
              <span className="aa-swatch" style={{ background: zone.color }} />
              {t(`city.zones.${zone.key}.name`)}
            </span>
          ))}
        </div>
        <div className="aa-focus__zonehead">
          <span />
          {common && <span>{t('stats.measures.zonesCommon')}</span>}
          <span>{t('stats.measures.zonesCity')}</span>
        </div>
        <div className="aa-focus__rows">
          {rows.map((row) => (
            <div className={`aa-focus__row aa-focus__row--zones${common ? '' : ' aa-focus__row--one'}`} key={row.id}>
              <Name row={row} slots={slots} onToggle={onToggle} ctx={ctx} />
              {common && stack(row, row.stat)}
              {stack(row, own.get(row.id))}
            </div>
          ))}
        </div>
      </Section>

      {points.length > 0 && (
        <Section title={t('stats.focus.pov.scores')} about={t('stats.focus.pov.scoresAbout')}>
          <FocusScatter
            points={points}
            fx={(v) => formatStat(stats.measuresById['pov.proximity'], 'p50', v, ctx)}
            fy={(v) => formatStat(stats.measuresById['pov.opportunity'], 'p50', v, ctx)}
            labelX={t('stats.measures.proximity')}
            labelY={t('stats.measures.opportunity')}
            guides={cut ? { x: cut.proximity, y: cut.opportunity, label: t('stats.focus.pov.atlasMedian') } : null}
            slots={slots}
            onToggle={onToggle}
            ctx={ctx}
          />
        </Section>
      )}
    </div>
  );
}

// ── across layers ────────────────────────────────────────────────────

function CrossFocus({ stats, rowsOf, slots, onToggle, ctx }) {
  const { t } = ctx;
  const { show, hide } = ctx.tipApi;
  const pairs = stats.measures.filter((m) => m.kind === 'correlation');
  const columns = pairs.map((m) => ({ m, byId: new Map(rowsOf(m.id).map((r) => [r.id, r])) })).filter((c) => c.byId.size);
  const ids = new Map();
  for (const c of columns) for (const [id, r] of c.byId) ids.set(id, r);
  const rows = [...ids.values()].sort((a, b) => rowName(a, ctx.lang).localeCompare(rowName(b, ctx.lang)));
  if (!rows.length) return <Empty ctx={ctx} />;
  return (
    <div className="aa-focus">
      <Section title={t('stats.focus.cross.title')} about={t('stats.focus.cross.about')}>
        <div className="aa-stats__matrixwrap">
          <table className="aa-focus__heat">
            <thead>
              <tr>
                <th />
                {columns.map((c) => (
                  <th key={c.m.id}>{measureLabel(c.m, t, stats.measuresById)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    <Name row={row} slots={slots} onToggle={onToggle} ctx={ctx} />
                  </th>
                  {columns.map((c) => {
                    const v = statValue(c.byId.get(row.id)?.stat, 'value');
                    const bg = v == null ? null : colorAt(STAT_RAMPS.correlation, v);
                    return (
                      <td
                        key={c.m.id}
                        className={`aa-mono${bg && isDark(bg) ? ' aa-focus__dark' : ''}`}
                        style={{ background: bg ?? undefined }}
                        onPointerMove={(e) => v != null && show(e, <TipBody title={rowName(row, ctx.lang)} lines={[[measureLabel(c.m, t, stats.measuresById), formatStat(c.m, 'value', v, ctx)]]} />)}
                        onPointerLeave={hide}
                      >
                        {formatStat(c.m, 'value', v, ctx)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ── shared ───────────────────────────────────────────────────────────

/** The platform's own comparison page, where one exists. */
function More({ slug, ctx }) {
  return (
    <Link className="aa-focus__more" to={`/platforms/${slug}/compare`}>
      {ctx.t('stats.focus.more')} →
    </Link>
  );
}

/**
 * Cities against two figures, sized by residents, with an optional diagonal
 * (equal on both axes) or a pair of guide lines and the quadrants they make.
 */
function FocusScatter({ points, fx, fy, labelX, labelY, diagonal, guides, slots, onToggle, ctx }) {
  const { show, hide } = ctx.tipApi;
  const W = 760;
  const H = 420;
  const P = { l: 70, r: 24, t: 18, b: 48 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let x1 = Math.max(...xs, guides?.x ?? 0) * 1.08;
  let y1 = Math.max(...ys, guides?.y ?? 0) * 1.08;
  if (diagonal) x1 = y1 = Math.max(x1, y1);
  const px = (v) => P.l + (v / (x1 || 1)) * (W - P.l - P.r);
  const py = (v) => H - P.b - (v / (y1 || 1)) * (H - P.t - P.b);
  const maxPop = Math.max(1, ...points.map((p) => p.row.population ?? 0));
  const radius = (pop) => 4 + Math.sqrt((pop ?? 0) / maxPop) * 11;
  const ordered = [...points].sort((a, b) => (slots.has(a.row.id) ? 1 : 0) - (slots.has(b.row.id) ? 1 : 0) || (b.row.population ?? 0) - (a.row.population ?? 0));
  const boxes = [];
  const labels = [];
  for (const p of [...ordered].reverse()) {
    const on = slots.has(p.row.id);
    const name = rowName(p.row, ctx.lang);
    const w = name.length * (on ? 6.4 : 5.6) + 4;
    const lx = px(p.x);
    const ly = py(p.y) - radius(p.row.population) - 4;
    const box = [lx - w / 2, ly - 10, lx + w / 2, ly + 2];
    if (!on && boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
    boxes.push(box);
    labels.push({ id: p.row.id, name, x: lx, y: ly, on });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="aa-stats__scatter" role="img" aria-label={`${labelY} / ${labelX}`}>
      {niceTicks(0, x1).map((v) => (
        <g key={`x${v}`}>
          <line x1={px(v)} x2={px(v)} y1={P.t} y2={H - P.b} stroke="var(--hair-soft)" />
          <text x={px(v)} y={H - P.b + 15} textAnchor="middle" className="aa-stats__axis">
            {fx(v)}
          </text>
        </g>
      ))}
      {niceTicks(0, y1).map((v) => (
        <g key={`y${v}`}>
          <line x1={P.l} x2={W - P.r} y1={py(v)} y2={py(v)} stroke="var(--hair-soft)" />
          <text x={P.l - 8} y={py(v) + 3} textAnchor="end" className="aa-stats__axis">
            {fy(v)}
          </text>
        </g>
      ))}
      {diagonal && (
        <>
          <line x1={px(0)} y1={py(0)} x2={px(x1)} y2={py(y1)} stroke="var(--ink-3)" strokeDasharray="4 3" />
          <text x={px(x1 * 0.92)} y={py(y1 * 0.92) - 6} textAnchor="end" className="aa-stats__axis">
            {diagonal}
          </text>
        </>
      )}
      {guides && (
        <>
          <line x1={px(guides.x)} x2={px(guides.x)} y1={P.t} y2={H - P.b} stroke="var(--magenta)" strokeOpacity="0.55" strokeDasharray="4 3" />
          <line x1={P.l} x2={W - P.r} y1={py(guides.y)} y2={py(guides.y)} stroke="var(--magenta)" strokeOpacity="0.55" strokeDasharray="4 3" />
          <text x={px(guides.x) + 5} y={P.t + 10} className="aa-stats__axis" fill="var(--magenta)">
            {guides.label}
          </text>
        </>
      )}
      <text x={(P.l + W - P.r) / 2} y={H - 8} textAnchor="middle" className="aa-stats__axis aa-stats__axis--title">
        {labelX} →
      </text>
      <text x={14} y={(H - P.b + P.t) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(H - P.b + P.t) / 2})`} className="aa-stats__axis aa-stats__axis--title">
        {labelY} →
      </text>
      {ordered.map(({ row, x, y }) => {
        const slot = slots.get(row.id);
        const r = radius(row.population);
        return (
          <g
            key={row.id}
            className="aa-stats__mapdot"
            onPointerMove={(e) => show(e, <TipBody title={rowName(row, ctx.lang)} lines={[[labelX, fx(x)], [labelY, fy(y)]]} />)}
            onPointerLeave={hide}
            onClick={() => onToggle(row.id)}
          >
            <circle cx={px(x)} cy={py(y)} r={Math.max(r, 12)} fill="transparent" />
            <circle cx={px(x)} cy={py(y)} r={r} fill={slot != null ? HIGHLIGHT[slot] : 'var(--ink-3)'} fillOpacity={slot != null ? 0.9 : 0.45} stroke="var(--card)" strokeWidth="1.5" />
          </g>
        );
      })}
      {labels.map((l) => (
        <text key={l.id} x={l.x} y={l.y} textAnchor="middle" className={`aa-stats__svglabel${l.on ? ' aa-stats__svglabel--on' : ''}`}>
          {l.name}
        </text>
      ))}
    </svg>
  );
}
