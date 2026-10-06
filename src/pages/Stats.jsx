import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Explain } from '../components/Explain.jsx';
import { Modal } from '../components/Modal.jsx';
import { Eyebrow, SectionHeading } from '../components/SectionHeading.jsx';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS, PLATFORMS_BY_ID } from '../data/platforms.js';
import { CATEGORIES as FIFTEEN_CATEGORIES, MODES as FIFTEEN_MODES } from '../data/fifteen.js';
import { usePlatformHasSummary, useStats } from '../data/useAtlasData.js';
import {
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
 * The page opens on the dashboard itself: its title is the figure on screen.
 * Only cities that have that figure are drawn anywhere. A city without the
 * layer is not listed as missing; it is simply not one of the cities this
 * figure is about.
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

        <section className="aa-shell aa-block">
          <SectionHeading title={t('stats.availableTitle')} />
          <div className="aa-prose__list">
            {PLATFORMS.map((platform) => (
              <ComparisonCard key={platform.id} platform={platform} />
            ))}
          </div>
        </section>
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
  c: '',
  sel: '',
  pop: '1000000',
  hidden: '',
  m2: 'fifteen.proximity_time.foot',
  s2: 'p50',
  t2: '0',
  rev: '',
};
const VIEWS = ['ranking', 'map', 'scatter', 'matrix', 'curves'];
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

function Dashboard({ stats }) {
  const { t, n, lang, locale } = useI18n();
  const query = useQuery();
  const tipApi = useTip();
  const [about, setAbout] = useState(false);
  const [full, setFull] = useState(false);

  const pooled = countryLayers(stats);
  const unit = query.get('unit') === 'country' && pooled.size ? 'country' : 'city';
  const spec = resolveSpec(stats, unit, query.get('m'), query.get('s'), query.get('t'));
  const specY = resolveSpec(stats, unit, query.get('m2'), query.get('s2'), query.get('t2'), DEFAULTS.m2);
  const view = VIEWS.includes(query.get('view')) ? query.get('view') : 'ranking';

  const countryFilter = new Set(query.get('c').split(',').filter(Boolean));
  const minPop = Math.max(0, Number(query.get('pop')) || 0);
  const showHidden = query.get('hidden') === '1';
  const sel = query.get('sel').split(',').slice(0, MAX_HIGHLIGHT);
  const slots = new Map(sel.map((id, i) => [id, i]).filter(([id]) => id));

  // Every filter, then only the cities (or countries) that have this figure.
  const inFilter = (row) =>
    (!countryFilter.size || countryFilter.has(row.country)) &&
    (row.kind === 'country' || ((showHidden || !row.city?.hidden) && (row.city?.population ?? 0) >= minPop));
  const allRows = statRows(stats, unit, spec.measure.id).filter((r) => statValue(r.stat, spec.key, spec.index) != null);
  const rows = allRows.filter(inFilter);
  const hiddenCount = stats.cities.filter((c) => c.hidden).length;

  const rule = stats.hiddenRule;
  const ctx = { t, n, lang, tipApi, rule, layerName: (layer) => layerName(layer, t) };

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

  const direction = statDirection(spec.measure, spec.key, spec.index);
  const judged = Boolean(direction) && isJudged(spec.key);
  const reverse = query.get('rev') === '1';
  // Curves draw every threshold at once, so their title names none, and
  // CityChrone's draw every hour, so theirs names no hour.
  const statTitle =
    view === 'curves' && spec.measure.layer !== 'citychrone' && isDistribution(spec.measure)
      ? t('stats.statLabels.share')
      : statLabel(spec.measure, spec.key, spec.index, t, n);
  const measureTitle =
    view === 'curves' && spec.measure.layer === 'citychrone'
      ? t(`stats.measures.${spec.measure.facets.score}`)
      : measureLabel(spec.measure, t, stats.measuresById);
  const notes = contextNotes({ spec, unit, view, rows, t, n });
  const computed = stats.computedAt ? new Date(stats.computedAt).toLocaleDateString(locale, { dateStyle: 'long' }) : null;
  const maxPop = Math.max(...stats.cities.map((c) => c.population || 0));

  return (
    <section className="aa-shell aa-stats">
      <div className="aa-card aa-stats__toolbar">
        <LayerTabs
          stats={stats}
          current={spec.measure.layer}
          enabled={(layer) => unit === 'city' || pooled.has(layer)}
          onPick={(layer) => {
            const id = LAYER_DEFAULTS[layer] ?? stats.measures.find((m) => m.layer === layer)?.id;
            const next = stats.measuresById[id];
            const keys = statKeys(next, unit);
            query.set({ m: id, s: keys.includes(spec.key) ? spec.key : defaultStat(next, unit), t: spec.index });
          }}
        />

        <MetricPicker stats={stats} unit={unit} spec={spec} onChange={(patch) => query.set({ m: patch.m, s: patch.s, t: patch.t })} />

        <div className="aa-stats__filters">
          <div className="aa-stats__segment" role="group" aria-label={t('stats.unit.label')}>
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
          <Explain body={t('stats.unit.about')} />

          <CountryMenu stats={stats} selected={countryFilter} onChange={(next) => query.set({ c: [...next].sort().join(',') })} />

          {unit === 'city' && (
            <PopulationFilter value={minPop} max={maxPop} onChange={(v) => query.set({ pop: String(v) })} />
          )}

          {unit === 'city' && (
            <label className={`aa-stats__check${hiddenCount ? '' : ' aa-stats__check--off'}`}>
              <input
                type="checkbox"
                checked={showHidden}
                disabled={!hiddenCount}
                onChange={(e) => query.set({ hidden: e.target.checked ? '1' : '' })}
              />
              {t('stats.filters.hidden', { count: n(hiddenCount) })}
              <Explain
                body={t('stats.filters.hiddenAbout', { population: n(rule.population), minutes: n(rule.minutes) })}
                align="right"
              />
            </label>
          )}
        </div>

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
                <span aria-hidden="true" className="aa-stats__selx">×</span>
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
              {[...rows]
                .filter((r) => !slots.has(r.id))
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
      </div>

      <div className="aa-card aa-stats__panel">
        <header className="aa-stats__head">
          <div className="aa-stats__heading">
            <div className="aa-eyebrow">{layerName(spec.measure.layer, t)}</div>
            <h1 className="aa-stats__headline">
              {measureTitle}
              <span className="aa-stats__headsep" aria-hidden="true">
                {' / '}
              </span>
              <span className="aa-accent">{statTitle}</span>
            </h1>
          </div>
          <div className="aa-stats__viewbar">
            <div className="aa-stats__segment" role="tablist" aria-label={t('stats.views.label')}>
              {VIEWS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={view === key}
                  className={`aa-stats__segbtn${view === key ? ' aa-stats__segbtn--on' : ''}`}
                  onClick={() => query.set({ view: key })}
                >
                  {t(`stats.views.${key}`)}
                </button>
              ))}
            </div>
            <Explain body={t(`stats.viewAbout.${view}`)} align="right" />
          </div>
        </header>

        <Kpis rows={rows} spec={spec} unit={unit} judged={judged} ctx={ctx} />

        {view === 'scatter' && (
          <div className="aa-stats__yaxis">
            <MetricPicker
              stats={stats}
              unit={unit}
              spec={specY}
              withLayer
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
          {rows.length === 0 ? (
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
            <span className="aa-stats__caveaticon" aria-hidden="true">!</span>
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
      {layersOf(stats).map((layer) => {
        const on = layer === current;
        const usable = enabled(layer);
        return (
          <button
            key={layer}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={!usable}
            title={usable ? undefined : t('stats.unit.onlyFifteen')}
            className={`aa-stats__layer${on ? ' aa-stats__layer--on' : ''}`}
            onClick={() => onPick(layer)}
          >
            <span className="aa-stats__layerdot" style={{ background: PLATFORMS_BY_ID[layer]?.accent ?? 'var(--ink-3)' }} />
            {layerName(layer, t)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Measure (with its facets: category and mode, score and hour) → statistic
 * → threshold or zone. Changing an earlier step keeps the later ones where
 * they still make sense. The layer is picked by the tabs above it, or here
 * (`withLayer`) for the scatter's second axis.
 */
function MetricPicker({ stats, unit, spec, onChange, label, withLayer = false }) {
  const { t, n } = useI18n();
  const { measure, key, index } = spec;
  const pooled = countryLayers(stats);
  const layers = layersOf(stats).filter((l) => unit === 'city' || pooled.has(l));
  const ofLayer = (layer) => stats.measures.filter((m) => m.layer === layer);

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

  return (
    <div className="aa-stats__picker">
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
          <Field label={t('fifteen.controls.category')}>
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
          <Field label={t('stats.score')}>
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
        <Field label={t('stats.measure')}>
          <select className="aa-stats__select" value={measure.id} onChange={(e) => pick(e.target.value)}>
            {ofLayer(measure.layer).map((m) => (
              <option key={m.id} value={m.id}>
                {measureLabel(m, t, stats.measuresById)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Explain body={t(`stats.about.${aboutKey(measure)}`)} className="aa-stats__explain" />

      {keys.length > 1 && (
        <Field label={t('stats.statistic')}>
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
        <Field label={t('stats.zone')}>
          <select className="aa-stats__select" value={index} onChange={(e) => pick(measure.id, { s: 'zone', t: Number(e.target.value) })}>
            {ZONE_KEYS.map((z, i) => (
              <option key={z} value={i}>
                {t(`city.zones.${z}.name`)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Explain body={t(`stats.statAbout.${key}`)} className="aa-stats__explain" align="right" />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="aa-stats__field">
      <span className="aa-stats__fieldlabel">{label}</span>
      {children}
    </label>
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

  const name = (iso) => {
    const entry = stats.countries.find((c) => c.iso === iso);
    return rowName({ kind: 'country', country: iso, name: entry?.name ?? iso, nameIt: entry?.nameIt }, lang);
  };
  const all = [...new Set(stats.cities.map((c) => c.country).filter(Boolean))]
    .map((iso) => ({ iso, name: name(iso), cities: stats.cities.filter((c) => c.country === iso).length }))
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
        <span className="aa-stats__fieldlabel">{t('stats.countries.label')}</span>
        <span className="aa-stats__menuvalue">{summary}</span>
        <span className="aa-stats__caret" aria-hidden="true">▾</span>
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
// city published: city sizes span three orders of magnitude, and a linear
// slider would spend nearly all its length above the cities most people live in.
const POP_FLOOR = 10000;
const STEPS = 1000;

function PopulationFilter({ value, max, onChange }) {
  const { t, n } = useI18n();
  const lo = Math.log10(POP_FLOOR);
  const hi = Math.log10(Math.max(max, POP_FLOOR * 10));
  const toPos = (v) => (v <= 0 ? 0 : Math.round(Math.min(1, Math.max(0, (Math.log10(Math.max(v, POP_FLOOR)) - lo) / (hi - lo))) * STEPS));
  const fromPos = (p) => (p <= 0 ? 0 : Number((10 ** (lo + (p / STEPS) * (hi - lo))).toPrecision(2)));
  // Typed as text so it can show the number grouped the reader's way
  // (1,000,000 or 1.000.000); only its digits are read.
  const [text, setText] = useState(value ? n(value) : '');
  useEffect(() => setText(value ? n(value) : ''), [value, n]);

  return (
    <div className="aa-stats__pop-filter">
      <span className="aa-stats__fieldlabel">{t('stats.filters.population')}</span>
      <input
        type="range"
        className="aa-stats__range"
        min="0"
        max={STEPS}
        value={toPos(value)}
        onChange={(e) => onChange(fromPos(Number(e.target.value)))}
        aria-label={t('stats.filters.population')}
        aria-valuetext={value ? `≥ ${n(value)}` : t('stats.filters.any')}
      />
      <span className="aa-stats__popnum">
        <span aria-hidden="true">≥</span>
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
          aria-label={t('stats.filters.population')}
        />
      </span>
      <Explain body={t('stats.filters.populationAbout')} align="right" />
    </div>
  );
}

/**
 * One platform's comparison, if it has published the summary that screen reads.
 * A platform without one is not listed as "coming": it is simply not here.
 */
function ComparisonCard({ platform }) {
  const { t } = useI18n();
  const hasSummary = usePlatformHasSummary(platform.id);
  if (!hasSummary) return null;

  return (
    <Link className="aa-card aa-lift aa-prose__card" to={`/platforms/${platform.slug}/compare`}>
      <Eyebrow>{t(`home.platforms.themes.${platform.id}`)}</Eyebrow>
      <h3 className="aa-prose__cardtitle">{platform.name}</h3>
      <p className="aa-prose__carddesc">{t(`stats.compare.${platform.id}`)}</p>
    </Link>
  );
}
