import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Explain } from '../components/Explain.jsx';
import { Modal } from '../components/Modal.jsx';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS_BY_ID } from '../data/platforms.js';
import { CATEGORIES as FIFTEEN_CATEGORIES, MODES as FIFTEEN_MODES } from '../data/fifteen.js';
import { useStats } from '../data/useAtlasData.js';
import {
  extentsOf,
  scopeStats,
  HIGHLIGHT,
  MAX_HIGHLIGHT,
  ZONE_KEYS,
  aboutKey,
  countryLayers,
  defaultStat,
  formatStat,
  formatThreshold,
  hourLabel,
  isDistribution,
  isJudged,
  layersOf,
  measureLabel,
  orderRows,
  rowName,
  statDirection,
  statKeys,
  statLabel,
  statRows,
  statValue,
} from '../data/stats.js';
import { CurvesView, MapView, MatrixView, RankingView, ScatterView, Tip, useTip } from './StatsViews.jsx';
import { FocusView } from './StatsFocus.jsx';
import './Prose.css';
import './Stats.css';

/**
 * Every published city on every measure.
 *
 * The figures are computed offline by `npm run stats` (scripts/lib/stats.mjs)
 * and published as one small file; this page only picks among them, filters
 * them, orders them and draws them. What is on screen lives in the query
 * string, so a view can be linked to as it is.
 *
 * Layout: one row of buttons on top (the layer, then the view), the figure
 * and the filters in a sidebar, the chart beside it. The page opens on the
 * dashboard itself: its title is the figure on screen.
 *
 * Only cities that have the figure are drawn anywhere, and never a city whose
 * data is too thin to compare (`hidden`, scripts/lib/quality.mjs): those are
 * counted in a note, not offered.
 */
export default function Stats() {
  const { t } = useI18n();
  const state = useStats();

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        {state.status === 'ready' ? (
          <Dashboard stats={state.stats} />
        ) : (
          <section className="aa-shell aa-stats">
            <div className="aa-card aa-prose__empty">
              <span className="aa-dot aa-prose__emptydot" />
              <div>
                <h1 className="aa-prose__emptytitle">
                  {t(state.status === 'pending' ? 'stats.loading' : state.status === 'error' ? 'stats.error' : 'stats.emptyTitle')}
                </h1>
                {state.status === 'empty' && <p className="aa-prose__emptybody">{t('stats.emptyBody')}</p>}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ── the state in the URL ─────────────────────────────────────────────

// What the page opens on: how many residents of each large city live within
// a 15-minute walk of the services 15minCity measures, best first.
const DEFAULTS = {
  view: 'ranking',
  m: 'fifteen.proximity_time.foot',
  s: 'share',
  t: '2',
  unit: 'city',
  ext: 'core',
  c: '',
  sel: '',
  pop: '1000000',
  popmax: '',
  m2: 'fifteen.proximity_time.foot',
  s2: 'p50',
  t2: '0',
  rev: '',
};
const VIEWS = ['focus', 'ranking', 'map', 'scatter', 'matrix', 'curves'];
const LAYER_DEFAULTS = {
  fifteen: 'fifteen.proximity_time.foot',
  citychrone: 'citychrone.velocity.08',
};

function useQuery() {
  const [params, setParams] = useSearchParams();
  const get = (key) => params.get(key) ?? DEFAULTS[key];
  const set = useCallback(
    (patch) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(patch)) {
            const text = value == null ? '' : String(value);
            if (text === DEFAULTS[key]) next.delete(key);
            else if (text === '' && !DEFAULTS[key]) next.delete(key);
            else next.set(key, text);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return { get, set };
}

/** The picked measure, statistic and threshold, made valid for what the file has. */
function resolveSpec(stats, unit, m, s, t, fallback = DEFAULTS.m) {
  let measure = stats.measuresById[m] ?? stats.measuresById[fallback] ?? stats.measures[0];
  // Countries are pooled for some layers only (scripts/lib/stats.mjs).
  if (unit === 'country' && !countryLayers(stats).has(measure.layer)) {
    measure = stats.measuresById[DEFAULTS.m] ?? stats.measures.find((x) => countryLayers(stats).has(x.layer)) ?? measure;
  }
  const keys = statKeys(measure, unit);
  const key = keys.includes(s) ? s : defaultStat(measure, unit);
  const limit = key === 'zone' ? ZONE_KEYS.length : measure.thresholds?.length ?? 0;
  const index = Math.min(Math.max(0, Number(t) || 0), Math.max(0, limit - 1));
  return { measure, key, index };
}

const layerName = (layer, t) => (layer === 'cross' ? t('stats.layers.cross') : PLATFORMS_BY_ID[layer]?.name ?? layer);

// ── the dashboard ────────────────────────────────────────────────────

function Dashboard({ stats: all }) {
  const { t, n, lang, locale } = useI18n();
  const query = useQuery();
  // One boundary at a time (GHS core or metro area): a metro area includes
  // its core, so the two never share a chart. Everything below reads the
  // chosen boundary's cities as if they were the whole file.
  const extents = extentsOf(all);
  const extent = extents.includes(query.get('ext')) ? query.get('ext') : extents[0];
  const stats = useMemo(() => scopeStats(all, extent), [all, extent]);
  const tipApi = useTip();
  const [about, setAbout] = useState(false);
  const [full, setFull] = useState(false);

  const pooled = countryLayers(stats);
  const unit = query.get('unit') === 'country' && pooled.size ? 'country' : 'city';
  const spec = resolveSpec(stats, unit, query.get('m'), query.get('s'), query.get('t'));
  const specY = resolveSpec(stats, unit, query.get('m2'), query.get('s2'), query.get('t2'), DEFAULTS.m2);
  const view = VIEWS.includes(query.get('view')) ? query.get('view') : 'ranking';
  const focus = view === 'focus';
  const layer = spec.measure.layer;

  const countryFilter = new Set(query.get('c').split(',').filter(Boolean));
  const minPop = Math.max(0, Number(query.get('pop')) || 0);
  const maxPop = Math.max(0, Number(query.get('popmax')) || 0);
  const sel = query.get('sel').split(',').slice(0, MAX_HIGHLIGHT);
  const slots = new Map(sel.map((id, i) => [id, i]).filter(([id]) => id));

  // Every filter. Hidden cities never pass: their data is too thin to compare.
  const pass = (row) =>
    (!countryFilter.size || countryFilter.has(row.country)) &&
    (row.kind === 'country' ||
      (!row.city?.hidden &&
        (row.city?.population ?? 0) >= minPop &&
        (!maxPop || (row.city?.population ?? 0) <= maxPop)));
  const withFigure = statRows(stats, unit, spec.measure.id).filter((r) => statValue(r.stat, spec.key, spec.index) != null);
  const rows = withFigure.filter(pass);
  const hiddenHere = unit === 'city' ? withFigure.filter((r) => r.city?.hidden).length : 0;

  const rule = stats.hiddenRule;
  const ctx = { t, n, lang, tipApi, rule, layerName: (l) => layerName(l, t) };

  const toggle = (id) => {
    const next = [...sel];
    while (next.length < MAX_HIGHLIGHT) next.push('');
    const at = next.indexOf(id);
    if (at >= 0) next[at] = '';
    else {
      const free = next.indexOf('');
      if (free < 0) {
        setFull(true);
        return;
      }
      next[free] = id;
    }
    setFull(false);
    query.set({ sel: next.join(',').replace(/,+$/, '') });
  };

  const pickLayer = (next) => {
    const id = LAYER_DEFAULTS[next] ?? stats.measures.find((m) => m.layer === next)?.id;
    const measure = stats.measuresById[id];
    const keys = statKeys(measure, unit);
    query.set({ m: id, s: keys.includes(spec.key) ? spec.key : defaultStat(measure, unit), t: spec.index });
  };

  const direction = statDirection(spec.measure, spec.key, spec.index);
  const judged = Boolean(direction) && isJudged(spec.key);
  const reverse = query.get('rev') === '1';
  // Curves draw every threshold at once, so their title names none, and
  // CityChrone's draw every hour, so theirs names no hour. Focus is the
  // layer's own, so its title is the layer's.
  const statTitle = focus
    ? t(`stats.focus.${layer}.title`)
    : view === 'curves' && layer !== 'citychrone' && isDistribution(spec.measure)
      ? t('stats.statLabels.share')
      : statLabel(spec.measure, spec.key, spec.index, t, n);
  const measureTitle = focus
    ? layerName(layer, t)
    : view === 'curves' && layer === 'citychrone'
      ? t(`stats.measures.${spec.measure.facets.score}`)
      : measureLabel(spec.measure, t, stats.measuresById);
  const notes = focus ? [] : contextNotes({ spec, unit, view, rows, t, n });
  if (hiddenHere) notes.push(t('stats.note.hidden', { count: n(hiddenHere) }));
  const computed = stats.computedAt ? new Date(stats.computedAt).toLocaleDateString(locale, { dateStyle: 'long' }) : null;
  const ceiling = Math.max(...stats.cities.filter((c) => !c.hidden).map((c) => c.population || 0));
  const fifteenMode = layer === 'fifteen' ? spec.measure.facets.mode : 'foot';

  return (
    <section className="aa-shell aa-stats">
      {/* One row: the layer, then the view. */}
      <div className="aa-card aa-stats__topbar">
        <LayerTabs stats={stats} current={layer} enabled={(l) => unit === 'city' || pooled.has(l)} onPick={pickLayer} />
        <div className="aa-stats__viewbar">
          <div className="aa-stats__segment" role="tablist" aria-label={t('stats.views.label')}>
            {VIEWS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                className={`aa-stats__segbtn${view === key ? ' aa-stats__segbtn--on' : ''}${key === 'focus' ? ' aa-stats__segbtn--focus' : ''}`}
                onClick={() => query.set({ view: key })}
              >
                {key === 'focus' && <span className="aa-stats__layerdot" style={{ background: PLATFORMS_BY_ID[layer]?.accent ?? 'var(--ink-3)' }} />}
                {t(`stats.views.${key}`)}
              </button>
            ))}
          </div>
          <Explain body={t(`stats.viewAbout.${view}`)} align="right" />
        </div>
      </div>

      <div className="aa-stats__body">
        <aside className="aa-card aa-stats__side" aria-label={t('stats.sidebar.label')}>
          {(!focus || layer === 'fifteen') && (
            <SideSection title={t('stats.sidebar.figure')}>
              {focus ? (
                <Field label={t('fifteen.controls.mode')}>
                  <select
                    className="aa-stats__select"
                    value={fifteenMode}
                    onChange={(e) => query.set({ m: `fifteen.proximity_time.${e.target.value}` })}
                  >
                    {FIFTEEN_MODES.map((m) => (
                      <option key={m.key} value={m.key}>
                        {t(`fifteen.modes.${m.i18n}`)}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <MetricPicker stats={stats} unit={unit} spec={spec} onChange={(patch) => query.set({ m: patch.m, s: patch.s, t: patch.t })} />
              )}
            </SideSection>
          )}

          <SideSection title={t('stats.sidebar.filters')}>
            {extents.length > 1 && (
              <Field label={t('stats.extent.label')} about={t('stats.extent.about')}>
                <div className="aa-stats__segment aa-stats__segment--full" role="group" aria-label={t('stats.extent.label')}>
                  {extents.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`aa-stats__segbtn${extent === key ? ' aa-stats__segbtn--on' : ''}`}
                      aria-pressed={extent === key}
                      // Highlighted cities are the other boundary's ids.
                      onClick={() => query.set({ ext: key, sel: '' })}
                    >
                      {t(`stats.extent.${key}`)}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <Field label={t('stats.unit.label')} about={t('stats.unit.about')}>
              <div className="aa-stats__segment aa-stats__segment--full" role="group" aria-label={t('stats.unit.label')}>
                {['city', 'country'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`aa-stats__segbtn${unit === key ? ' aa-stats__segbtn--on' : ''}`}
                    aria-pressed={unit === key}
                    disabled={key === 'country' && !pooled.size}
                    onClick={() => query.set({ unit: key, sel: '' })}
                  >
                    {t(`stats.unit.${key}`)}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t('stats.countries.label')}>
              <CountryMenu stats={stats} selected={countryFilter} onChange={(next) => query.set({ c: [...next].sort().join(',') })} />
            </Field>
            {unit === 'city' && (
              <Field label={t('stats.filters.population')} about={t('stats.filters.populationAbout')}>
                <PopulationRange
                  min={minPop}
                  max={maxPop}
                  ceiling={ceiling}
                  onChange={(lo, hi) => query.set({ pop: String(lo), popmax: hi ? String(hi) : '' })}
                />
              </Field>
            )}
          </SideSection>

          <SideSection title={t('stats.selection.label')}>
            <div className="aa-stats__selection">
              {sel.map((id, slot) => {
                if (!id) return null;
                const row = statRows(stats, unit, spec.measure.id).find((r) => r.id === id);
                if (!row) return null;
                const name = rowName(row, lang);
                return (
                  <button key={id} type="button" className="aa-stats__selchip" onClick={() => toggle(id)} aria-label={t('stats.selection.remove', { name })}>
                    <span className="aa-stats__key" style={{ background: HIGHLIGHT[slot] }} />
                    {name}
                    <span aria-hidden="true" className="aa-stats__selx">
                      ×
                    </span>
                  </button>
                );
              })}
              {slots.size < MAX_HIGHLIGHT && (
                <select
                  className="aa-stats__select aa-stats__select--ghost"
                  value=""
                  onChange={(e) => e.target.value && toggle(e.target.value)}
                  aria-label={t(unit === 'country' ? 'stats.selection.addCountry' : 'stats.selection.add')}
                >
                  <option value="">+ {t(unit === 'country' ? 'stats.selection.addCountry' : 'stats.selection.add')}</option>
                  {statRows(stats, unit, spec.measure.id)
                    .filter((r) => pass(r) && !slots.has(r.id))
                    .sort((a, b) => rowName(a, lang).localeCompare(rowName(b, lang), locale))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {rowName(r, lang)}
                      </option>
                    ))}
                </select>
              )}
              {full && <span className="aa-stats__hint">{t('stats.selection.full')}</span>}
            </div>
          </SideSection>
        </aside>

        <div className="aa-card aa-stats__panel">
          <header className="aa-stats__head">
            <div className="aa-eyebrow">{focus ? t('stats.views.focus') : layerName(layer, t)}</div>
            <h1 className="aa-stats__headline">
              {measureTitle}
              <span className="aa-stats__headsep" aria-hidden="true">
                {' / '}
              </span>
              <span className="aa-accent">{statTitle}</span>
            </h1>
            {focus && <p className="aa-stats__lede">{t(`stats.focus.${layer}.lede`)}</p>}
          </header>

          {!focus && <Kpis rows={rows} spec={spec} unit={unit} judged={judged} ctx={ctx} />}

          {view === 'scatter' && (
            <div className="aa-stats__yaxis">
              <MetricPicker
                stats={stats}
                unit={unit}
                spec={specY}
                withLayer
                inline
                label={t('stats.yAxis')}
                onChange={(patch) => query.set({ m2: patch.m, s2: patch.s, t2: patch.t })}
              />
            </div>
          )}

          {view === 'ranking' && rows.length > 1 && (
            <div className="aa-stats__order">
              <span>{t(judged ? (reverse ? 'stats.order.worst' : 'stats.order.best') : reverse ? 'stats.order.low' : 'stats.order.high')}</span>
              <button type="button" className="aa-stats__link" onClick={() => query.set({ rev: reverse ? '' : '1' })}>
                ⇅ {t('stats.order.reverse')}
              </button>
            </div>
          )}

          <div className="aa-stats__view">
            {focus ? (
              <FocusView stats={stats} unit={unit} layer={layer} pass={pass} slots={slots} onToggle={toggle} mode={fifteenMode} ctx={ctx} />
            ) : rows.length === 0 ? (
              <p className="aa-stats__empty">{t('stats.noValues')}</p>
            ) : (
              <>
                {view === 'ranking' && <RankingView rows={rows} spec={spec} unit={unit} slots={slots} onToggle={toggle} reverse={reverse} ctx={ctx} />}
                {view === 'map' && <MapView rows={rows} spec={spec} slots={slots} onToggle={toggle} ctx={ctx} />}
                {view === 'scatter' && (
                  <ScatterView stats={stats} unit={unit} rows={rows} spec={spec} specY={specY} slots={slots} onToggle={toggle} ctx={ctx} />
                )}
                {view === 'matrix' && (
                  <MatrixView
                    stats={stats}
                    unit={unit}
                    rows={rows}
                    spec={spec}
                    slots={slots}
                    onToggle={toggle}
                    onPick={(c) => query.set({ m: c.id, s: c.key, t: c.index })}
                    ctx={ctx}
                  />
                )}
                {view === 'curves' && <CurvesView stats={stats} unit={unit} rows={rows} spec={spec} slots={slots} onToggle={toggle} ctx={ctx} />}
              </>
            )}
          </div>

          <footer className="aa-stats__foot">
            {notes.length > 0 && (
              <ul className="aa-stats__notes">
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
            <div className="aa-stats__caveat" role="note">
              <span className="aa-stats__caveaticon" aria-hidden="true">
                !
              </span>
              <p>
                <strong>{t('stats.caveat.title')}</strong> {t('stats.caveat.body')}{' '}
                <button type="button" className="aa-stats__link" onClick={() => setAbout(true)}>
                  {t('stats.caveat.open')} →
                </button>
              </p>
            </div>
            {computed && <p className="aa-stats__computed">{t('stats.footer.computed', { date: computed })}</p>}
          </footer>
        </div>
      </div>

      <Tip tip={tipApi.tip} />
      {about && (
        <Modal title={t('stats.method.title')} onClose={() => setAbout(false)}>
          <div className="aa-stats__method">
            {Object.entries(t('stats.method.sections')).map(([key, section]) => (
              <section key={key}>
                <h3>{section.title}</h3>
                <p>
                  {key === 'hidden'
                    ? t('stats.method.sections.hidden.body', { population: n(rule.population), minutes: n(rule.minutes) })
                    : section.body}
                </p>
              </section>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}

function SideSection({ title, children }) {
  return (
    <section className="aa-stats__sidesection">
      <h2 className="aa-stats__sidetitle">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Four figures over the chart: how many are shown, the two ends of the
 * order, and how many residents the figure is about. All read off the rows
 * on screen, so they move with every filter.
 */
function Kpis({ rows, spec, unit, judged, ctx }) {
  const { t, n, lang } = ctx;
  const ordered = orderRows(rows, spec.measure, spec.key, spec.index);
  const first = ordered[0];
  const last = ordered.length > 1 ? ordered[ordered.length - 1] : null;
  const residents = rows.reduce((s, r) => s + (r.stat?.population ?? 0), 0);
  const fmt = (row) => formatStat(spec.measure, spec.key, statValue(row.stat, spec.key, spec.index), ctx);
  const compact = (v) => (v >= 1e6 ? `${n(v / 1e6, { maximumFractionDigits: 1 })} M` : v >= 1e3 ? `${n(Math.round(v / 1e3))} k` : n(v));

  return (
    <div className="aa-stats__kpis">
      <div className="aa-stats__kpi">
        <span className="aa-stats__kpilabel">{t(unit === 'country' ? 'stats.kpi.countries' : 'stats.kpi.cities')}</span>
        <span className="aa-stats__kpivalue aa-mono">{n(rows.length)}</span>
      </div>
      {first && (
        <div className="aa-stats__kpi">
          <span className="aa-stats__kpilabel">{t(judged ? 'stats.kpi.best' : 'stats.kpi.highest')}</span>
          <span className="aa-stats__kpivalue aa-mono">{fmt(first)}</span>
          <span className="aa-stats__kpisub">{rowName(first, lang)}</span>
        </div>
      )}
      {last && (
        <div className="aa-stats__kpi">
          <span className="aa-stats__kpilabel">{t(judged ? 'stats.kpi.worst' : 'stats.kpi.lowest')}</span>
          <span className="aa-stats__kpivalue aa-mono">{fmt(last)}</span>
          <span className="aa-stats__kpisub">{rowName(last, lang)}</span>
        </div>
      )}
      {residents > 0 && (
        <div className="aa-stats__kpi">
          <span className="aa-stats__kpilabel">{t('stats.kpi.residents')}</span>
          <span className="aa-stats__kpivalue aa-mono">{compact(residents)}</span>
        </div>
      )}
    </div>
  );
}

/** The caveats that apply to what is on screen, and only those. */
function contextNotes({ spec, unit, view, rows, t, n }) {
  const { measure, key } = spec;
  const notes = [];
  if (measure.comparability === 'within-city') notes.push(t('stats.note.withinCity'));
  if (measure.zoneThresholds) {
    notes.push(
      t('stats.note.zonesCommon', {
        proximity: n(measure.zoneThresholds.proximity),
        opportunity: n(measure.zoneThresholds.opportunity),
        count: n(measure.zoneThresholds.cities),
      }),
    );
  }
  if (key === 'share') notes.push(t('stats.note.thresholds'));
  if (measure.kind === 'correlation') notes.push(t('stats.note.correlation'));
  if (measure.layer === 'citychrone') notes.push(t('stats.note.citychrone'));
  if (rows.some((r) => r.stat?.unreachable > 0)) notes.push(t('stats.note.unreachable'));
  if (['gini', 'theil', 'ratio'].includes(key)) notes.push(t('stats.note.inequality'));
  if (unit === 'country') notes.push(t('stats.note.countries'));
  else if (isLevel(key)) notes.push(t('stats.note.oneNumber'));
  if (view === 'matrix') notes.push(t('stats.note.matrix'));
  if (view === 'curves' && measure.layer !== 'citychrone' && measure.thresholds?.length) notes.push(t('stats.note.curvesThresholds'));
  return notes;
}

const isLevel = (key) => ['p10', 'p25', 'p50', 'p75', 'p90', 'mean'].includes(key);

// ── picking a figure ─────────────────────────────────────────────────

/** The layers, as tabs: each with its platform's colour. */
function LayerTabs({ stats, current, enabled, onPick }) {
  const { t } = useI18n();
  return (
    <div className="aa-stats__layers" role="tablist" aria-label={t('stats.layer')}>
      {layersOf(stats).map((l) => {
        const on = l === current;
        const usable = enabled(l);
        return (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={!usable}
            title={usable ? undefined : t('stats.unit.onlyFifteen')}
            className={`aa-stats__layer${on ? ' aa-stats__layer--on' : ''}`}
            onClick={() => onPick(l)}
          >
            <span className="aa-stats__layerdot" style={{ background: PLATFORMS_BY_ID[l]?.accent ?? 'var(--ink-3)' }} />
            {layerName(l, t)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Measure (with its facets: category and mode, score and hour) → statistic
 * → threshold or zone. Changing an earlier step keeps the later ones where
 * they still make sense. The layer is picked by the tabs, or here
 * (`withLayer`) for the scatter's second axis. Stacked in the sidebar,
 * `inline` above the scatter.
 */
function MetricPicker({ stats, unit, spec, onChange, label, withLayer = false, inline = false }) {
  const { t, n } = useI18n();
  const { measure, key, index } = spec;
  const pooled = countryLayers(stats);
  const layers = layersOf(stats).filter((l) => unit === 'city' || pooled.has(l));
  const ofLayer = (l) => stats.measures.filter((m) => m.layer === l);

  const pick = (id, patch = {}) => {
    const next = stats.measuresById[id];
    if (!next) return;
    const keys = statKeys(next, unit);
    const s = patch.s ?? (keys.includes(key) ? key : defaultStat(next, unit));
    const limit = s === 'zone' ? ZONE_KEYS.length : next.thresholds?.length ?? 0;
    const tIndex = patch.t ?? Math.min(index, Math.max(0, limit - 1));
    onChange({ m: id, s, t: tIndex });
  };

  const facetIds = (facet, value) =>
    stats.measures.find(
      (m) => m.layer === measure.layer && Object.entries({ ...measure.facets, [facet]: value }).every(([k, v]) => m.facets[k] === v),
    )?.id;

  const keys = statKeys(measure, unit);
  const about = t(`stats.about.${aboutKey(measure)}`);

  return (
    <div className={`aa-stats__picker${inline ? ' aa-stats__picker--inline' : ''}`}>
      {label && <span className="aa-stats__pickerlabel aa-eyebrow">{label}</span>}
      {withLayer && (
        <Field label={t('stats.layer')}>
          <select
            className="aa-stats__select"
            value={measure.layer}
            onChange={(e) => pick(LAYER_DEFAULTS[e.target.value] ?? ofLayer(e.target.value)[0]?.id)}
          >
            {layers.map((l) => (
              <option key={l} value={l}>
                {layerName(l, t)}
              </option>
            ))}
          </select>
        </Field>
      )}

      {measure.layer === 'fifteen' ? (
        <>
          <Field label={t('fifteen.controls.category')} about={about}>
            <select className="aa-stats__select" value={measure.facets.category} onChange={(e) => pick(facetIds('category', e.target.value))}>
              {FIFTEEN_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {t(`fifteen.categories.${c.i18n}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('fifteen.controls.mode')}>
            <select className="aa-stats__select" value={measure.facets.mode} onChange={(e) => pick(facetIds('mode', e.target.value))}>
              {FIFTEEN_MODES.map((m) => (
                <option key={m.key} value={m.key}>
                  {t(`fifteen.modes.${m.i18n}`)}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : measure.layer === 'citychrone' ? (
        <>
          <Field label={t('stats.score')} about={about}>
            <select className="aa-stats__select" value={measure.facets.score} onChange={(e) => pick(facetIds('score', e.target.value))}>
              {['velocity', 'sociality'].map((s) => (
                <option key={s} value={s}>
                  {t(`stats.measures.${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('stats.hour')}>
            <select
              className="aa-stats__select"
              value={String(measure.facets.hour)}
              onChange={(e) => pick(facetIds('hour', e.target.value === 'day' ? 'day' : Number(e.target.value)))}
            >
              {['day', ...Array.from({ length: 24 }, (_, h) => h)].map((h) => (
                <option key={h} value={String(h)}>
                  {hourLabel(h, t)}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : (
        <Field label={t('stats.measure')} about={about}>
          <select className="aa-stats__select" value={measure.id} onChange={(e) => pick(e.target.value)}>
            {ofLayer(measure.layer).map((m) => (
              <option key={m.id} value={m.id}>
                {measureLabel(m, t, stats.measuresById)}
              </option>
            ))}
          </select>
        </Field>
      )}

      {keys.length > 1 && (
        <Field label={t('stats.statistic')} about={t(`stats.statAbout.${key}`)}>
          <select className="aa-stats__select" value={key} onChange={(e) => pick(measure.id, { s: e.target.value })}>
            {keys.map((k) => (
              <option key={k} value={k}>
                {t(`stats.statLabels.${k}`)}
              </option>
            ))}
          </select>
        </Field>
      )}
      {key === 'share' && (
        <Field label={t('stats.threshold')}>
          <select className="aa-stats__select" value={index} onChange={(e) => pick(measure.id, { s: 'share', t: Number(e.target.value) })}>
            {measure.thresholds.map((value, i) => (
              <option key={value} value={i}>
                {t(`stats.side.${measure.side}`, { value: formatThreshold(measure, value, n) })}
              </option>
            ))}
          </select>
        </Field>
      )}
      {key === 'zone' && (
        <Field label={t('stats.zone')} about={keys.length > 1 ? null : t('stats.statAbout.zone')}>
          <select className="aa-stats__select" value={index} onChange={(e) => pick(measure.id, { s: 'zone', t: Number(e.target.value) })}>
            {ZONE_KEYS.map((z, i) => (
              <option key={z} value={i}>
                {t(`city.zones.${z}.name`)}
              </option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}

function Field({ label, about, children }) {
  return (
    <div className="aa-stats__field">
      <span className="aa-stats__fieldhead">
        <span className="aa-stats__fieldlabel">{label}</span>
        {about && <Explain body={about} align="right" />}
      </span>
      {children}
    </div>
  );
}

// ── filters ──────────────────────────────────────────────────────────

/** Countries as a menu: a list as long as the Atlas's coverage does not fit on a bar. */
function CountryMenu({ stats, selected, onChange }) {
  const { t, n, lang, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => !box.current?.contains(e.target) && setOpen(false);
    const key = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const shownCities = stats.cities.filter((c) => !c.hidden);
  const name = (iso) => {
    const entry = stats.countries.find((c) => c.iso === iso);
    const city = stats.cities.find((c) => c.country === iso);
    return rowName({ kind: 'country', country: iso, name: entry?.name ?? city?.region ?? iso, nameIt: entry?.nameIt ?? city?.regionIt }, lang);
  };
  const all = [...new Set(shownCities.map((c) => c.country).filter(Boolean))]
    .map((iso) => ({ iso, name: name(iso), cities: shownCities.filter((c) => c.country === iso).length }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  const shown = all.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const toggle = (iso) => {
    const next = new Set(selected);
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    onChange(next);
  };
  const summary = !selected.size
    ? t('stats.countries.all')
    : selected.size === 1
      ? name([...selected][0])
      : t('stats.countries.some', { count: n(selected.size) });

  return (
    <div className="aa-stats__menu" ref={box}>
      <button
        type="button"
        className={`aa-stats__menubtn${selected.size ? ' aa-stats__menubtn--set' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="aa-stats__menuvalue">{summary}</span>
        <span className="aa-stats__caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="aa-stats__pop" role="listbox" aria-multiselectable="true">
          <input
            className="aa-stats__search"
            type="search"
            placeholder={t('stats.countries.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="aa-stats__poplist">
            {shown.map((c) => (
              <label key={c.iso} className="aa-stats__popitem">
                <input type="checkbox" checked={selected.has(c.iso)} onChange={() => toggle(c.iso)} />
                <span className="aa-stats__popname">{c.name}</span>
                <span className="aa-stats__popcount aa-mono">{n(c.cities)}</span>
              </label>
            ))}
          </div>
          <div className="aa-stats__popfoot">
            <button type="button" className="aa-stats__link" onClick={() => onChange(new Set())} disabled={!selected.size}>
              {t('stats.countries.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// The slider runs on a logarithmic scale from 10,000 residents to the largest
// city shown: city sizes span three orders of magnitude, and a linear slider
// would spend nearly all its length above the cities most people live in.
// Two handles, a minimum and a maximum; the top of the scale means "no
// maximum", so a city published later and larger is not cut off.
const POP_FLOOR = 10000;
const STEPS = 1000;

function PopulationRange({ min, max, ceiling, onChange }) {
  const { t, n } = useI18n();
  const lo = Math.log10(POP_FLOOR);
  const hi = Math.log10(Math.max(ceiling, POP_FLOOR * 10));
  const toPos = (v) => (v <= 0 ? 0 : Math.round(Math.min(1, Math.max(0, (Math.log10(Math.max(v, POP_FLOOR)) - lo) / (hi - lo))) * STEPS));
  const fromPos = (p) => (p <= 0 ? 0 : Number((10 ** (lo + (p / STEPS) * (hi - lo))).toPrecision(2)));
  const a = toPos(min);
  const b = max ? toPos(max) : STEPS;

  const setLow = (p) => onChange(fromPos(Math.min(p, b)), max);
  const setHigh = (p) => onChange(min, p >= STEPS ? 0 : fromPos(Math.max(p, a)));

  return (
    <div className="aa-stats__range2">
      <div className="aa-stats__range2track">
        <span className="aa-stats__range2fill" style={{ left: `${(a / STEPS) * 100}%`, right: `${100 - (b / STEPS) * 100}%` }} />
        <input
          type="range"
          min="0"
          max={STEPS}
          value={a}
          onChange={(e) => setLow(Number(e.target.value))}
          aria-label={t('stats.filters.popMin')}
          aria-valuetext={min ? n(min) : t('stats.filters.any')}
          style={{ zIndex: a > STEPS - 20 ? 3 : 2 }}
        />
        <input
          type="range"
          min="0"
          max={STEPS}
          value={b}
          onChange={(e) => setHigh(Number(e.target.value))}
          aria-label={t('stats.filters.popMax')}
          aria-valuetext={max ? n(max) : t('stats.filters.any')}
          style={{ zIndex: 2 }}
        />
      </div>
      <div className="aa-stats__range2boxes">
        <NumberBox label={t('stats.filters.popMin')} value={min} onChange={(v) => onChange(v, max)} />
        <span className="aa-stats__range2dash" aria-hidden="true">
          –
        </span>
        <NumberBox label={t('stats.filters.popMax')} value={max} onChange={(v) => onChange(min, v)} />
      </div>
    </div>
  );
}

/**
 * A number typed as text, so it can show grouped the reader's way
 * (1,000,000 or 1.000.000); only its digits are read. Empty means "any".
 */
function NumberBox({ label, value, onChange }) {
  const { t, n } = useI18n();
  const [text, setText] = useState(value ? n(value) : '');
  useEffect(() => setText(value ? n(value) : ''), [value, n]);
  return (
    <label className="aa-stats__numfield">
      <span className="aa-stats__numlabel">{label}</span>
      <input
        type="text"
        className="aa-stats__number aa-mono"
        inputMode="numeric"
        placeholder={t('stats.filters.any')}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const digits = e.target.value.replace(/\D/g, '');
          onChange(digits ? Number(digits) : 0);
        }}
      />
    </label>
  );
}
