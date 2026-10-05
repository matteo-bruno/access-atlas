import { useCallback, useState } from 'react';
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
  defaultStat,
  formatThreshold,
  hourLabel,
  isDistribution,
  isJudged,
  layersOf,
  measureLabel,
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
 * and published as one small file; this page only picks among them, orders
 * them and draws them. What is on screen lives in the query string, so a
 * view can be linked to as it is.
 *
 * Two things it never does: fill a gap (a city without a layer is listed as
 * having no figure, not given one), and show a figure for data that is no
 * longer published (out-of-date cities are left out of the file itself).
 */
export default function Stats() {
  const { t } = useI18n();
  const state = useStats();

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-prose__intro aa-stats__intro">
          <Eyebrow>{t('stats.eyebrow')}</Eyebrow>
          <h1 className="aa-prose__headline">
            {t('stats.headline')} <span className="aa-accent">{t('stats.headlineAccent')}</span>
          </h1>
          <p className="aa-prose__lede">{t('stats.lede')}</p>
        </section>

        {state.status === 'ready' ? (
          <Dashboard stats={state.stats} />
        ) : (
          <section className="aa-shell aa-block">
            <div className="aa-card aa-prose__empty">
              <span className="aa-dot aa-prose__emptydot" />
              <div>
                <div className="aa-prose__emptytitle">
                  {t(state.status === 'pending' ? 'stats.loading' : state.status === 'error' ? 'stats.error' : 'stats.emptyTitle')}
                </div>
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

const DEFAULTS = {
  view: 'ranking',
  m: 'pov.proximity',
  s: '',
  t: '0',
  unit: 'city',
  c: '',
  sel: '',
  m2: 'pov.opportunity',
  s2: '',
  t2: '0',
  rev: '',
};
const VIEWS = ['ranking', 'map', 'scatter', 'matrix', 'curves'];

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
            if (text === '' || text === DEFAULTS[key]) next.delete(key);
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
function resolveSpec(stats, unit, m, s, t) {
  const measure = stats.measuresById[m] ?? stats.measuresById[DEFAULTS.m] ?? stats.measures[0];
  const keys = statKeys(measure, unit);
  const key = keys.includes(s) ? s : defaultStat(measure, unit);
  const limit = key === 'zone' ? ZONE_KEYS.length : measure.thresholds?.length ?? 0;
  const index = Math.min(Math.max(0, Number(t) || 0), Math.max(0, limit - 1));
  return { measure, key, index };
}

// ── the dashboard ────────────────────────────────────────────────────

function Dashboard({ stats }) {
  const { t, n, lang, locale } = useI18n();
  const query = useQuery();
  const tipApi = useTip();
  const [about, setAbout] = useState(false);
  const [full, setFull] = useState(false);

  // Correlations are a city's own; there is no country of them.
  const requestedUnit = query.get('unit') === 'country' ? 'country' : 'city';
  const primary = resolveSpec(stats, requestedUnit, query.get('m'), query.get('s'), query.get('t'));
  const unit = primary.measure.kind === 'correlation' ? 'city' : requestedUnit;
  const spec = resolveSpec(stats, unit, primary.measure.id, query.get('s'), query.get('t'));
  const specY = resolveSpec(stats, unit, query.get('m2'), query.get('s2'), query.get('t2'));
  const view = VIEWS.includes(query.get('view')) ? query.get('view') : 'ranking';

  const countryFilter = new Set(query.get('c').split(',').filter(Boolean));
  const sel = query.get('sel').split(',').slice(0, MAX_HIGHLIGHT);
  const slots = new Map(sel.map((id, i) => [id, i]).filter(([id]) => id));

  const allRows = statRows(stats, unit, spec.measure.id);
  const rows = allRows.filter((r) => !countryFilter.size || countryFilter.has(r.country));
  const withValue = rows.filter((r) => statValue(r.stat, spec.key, spec.index) != null);

  const ctx = {
    t,
    n,
    lang,
    tipApi,
    layerName: (layer) => (layer === 'cross' ? t('stats.layers.cross') : PLATFORMS_BY_ID[layer]?.name ?? layer),
  };

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

  const countries = [...new Set(stats.cities.map((c) => c.country).filter(Boolean))].sort((a, b) =>
    ctxCountry(a, lang, stats).localeCompare(ctxCountry(b, lang, stats), locale),
  );
  const toggleCountry = (iso) => {
    const next = new Set(countryFilter);
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    query.set({ c: [...next].sort().join(',') });
  };

  const direction = statDirection(spec.measure, spec.key, spec.index);
  const judged = Boolean(direction) && isJudged(spec.key);
  const reverse = query.get('rev') === '1';
  // Curves draw every threshold at once, so their title names none.
  const statTitle =
    view === 'curves' && spec.measure.layer !== 'citychrone' && isDistribution(spec.measure)
      ? t('stats.statLabels.share')
      : statLabel(spec.measure, spec.key, spec.index, t, n);
  // …and CityChrone's draw every hour, so theirs names no hour.
  const measureTitle =
    view === 'curves' && spec.measure.layer === 'citychrone'
      ? t(`stats.measures.${spec.measure.facets.score}`)
      : measureLabel(spec.measure, t, stats.measuresById);
  const title = `${measureTitle} · ${statTitle}`;
  const notes = contextNotes({ spec, unit, view, rows, t, n });
  const computed = stats.computedAt ? new Date(stats.computedAt).toLocaleDateString(locale, { dateStyle: 'long' }) : null;

  return (
    <section className="aa-shell aa-stats">
      <div className="aa-card aa-stats__caveat" role="note">
        <span className="aa-stats__caveaticon" aria-hidden="true">!</span>
        <p>
          <strong>{t('stats.caveat.title')}</strong> {t('stats.caveat.body')}
        </p>
        <button type="button" className="aa-chip aa-chip--icon" onClick={() => setAbout(true)}>
          {t('stats.caveat.open')}
        </button>
      </div>

      <div className="aa-card aa-stats__controls">
        <div className="aa-stats__controlrow">
          <div className="aa-stats__field">
            <span className="aa-eyebrow">{t('stats.unit.label')}</span>
            <div className="aa-stats__toggle" role="group" aria-label={t('stats.unit.label')}>
              {['city', 'country'].map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`aa-stats__togglebtn${unit === key ? ' aa-stats__togglebtn--on' : ''}`}
                  aria-pressed={unit === key}
                  disabled={key === 'country' && primary.measure.kind === 'correlation'}
                  onClick={() => query.set({ unit: key, sel: '' })}
                >
                  {t(`stats.unit.${key}`)}
                </button>
              ))}
              <Explain body={t('stats.unit.about')} />
            </div>
          </div>
          <div className="aa-stats__field aa-stats__field--grow">
            <span className="aa-eyebrow">{t('stats.countries.label')}</span>
            <div className="aa-stats__chips">
              <button
                type="button"
                className={`aa-stats__chip${countryFilter.size ? '' : ' aa-stats__chip--on'}`}
                aria-pressed={!countryFilter.size}
                onClick={() => query.set({ c: '' })}
              >
                {t('stats.countries.all')}
              </button>
              {countries.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  className={`aa-stats__chip${countryFilter.has(iso) ? ' aa-stats__chip--on' : ''}`}
                  aria-pressed={countryFilter.has(iso)}
                  onClick={() => toggleCountry(iso)}
                >
                  {ctxCountry(iso, lang, stats)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <MetricPicker
          stats={stats}
          unit={unit}
          spec={spec}
          onChange={(patch) => query.set({ m: patch.m, s: patch.s, t: patch.t })}
        />

        {view === 'scatter' && (
          <MetricPicker
            stats={stats}
            unit={unit}
            spec={specY}
            label={t('stats.yAxis')}
            onChange={(patch) => query.set({ m2: patch.m, s2: patch.s, t2: patch.t })}
          />
        )}

        <div className="aa-stats__controlrow aa-stats__selection">
          <span className="aa-eyebrow">{t('stats.selection.label')}</span>
          {sel.map((id, slot) => {
            if (!id) return null;
            const row = allRows.find((r) => r.id === id);
            if (!row) return null;
            const name = rowName(row, lang);
            return (
              <button key={id} type="button" className="aa-stats__selchip" onClick={() => toggle(id)} aria-label={t('stats.selection.remove', { name })}>
                <span className="aa-stats__key" style={{ background: HIGHLIGHT[slot] }} />
                {name}
                <span aria-hidden="true">×</span>
              </button>
            );
          })}
          {slots.size < MAX_HIGHLIGHT && (
            <select
              className="aa-stats__select aa-stats__select--inline"
              value=""
              onChange={(e) => e.target.value && toggle(e.target.value)}
              aria-label={t(unit === 'country' ? 'stats.selection.addCountry' : 'stats.selection.add')}
            >
              <option value="">{t(unit === 'country' ? 'stats.selection.addCountry' : 'stats.selection.add')}</option>
              {[...allRows]
                .filter((r) => !slots.has(r.id))
                .sort((a, b) => rowName(a, lang).localeCompare(rowName(b, lang), locale))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {rowName(r, lang)}
                  </option>
                ))}
            </select>
          )}
          <span className="aa-stats__hint">{full ? t('stats.selection.full') : slots.size ? '' : t('stats.selection.none')}</span>
        </div>
      </div>

      <div className="aa-card aa-stats__panel">
        <div className="aa-stats__tabs" role="tablist" aria-label={t('stats.views.label')}>
          {VIEWS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              className={`aa-stats__tab${view === key ? ' aa-stats__tab--on' : ''}`}
              onClick={() => query.set({ view: key })}
            >
              {t(`stats.views.${key}`)}
            </button>
          ))}
          <Explain body={t(`stats.viewAbout.${view}`)} align="right" className="aa-stats__tabsexplain" />
        </div>

        <div className="aa-stats__head">
          <div>
            <div className="aa-eyebrow">{ctx.layerName(spec.measure.layer)}</div>
            <h2 className="aa-stats__title">{title}</h2>
            <div className="aa-stats__meta">
              {t(unit === 'country' ? 'stats.countLineCountries' : 'stats.countLine', {
                count: n(withValue.length),
                total: n(rows.length),
              })}
              {view === 'ranking' && (
                <>
                  {' · '}
                  {t(judged ? (reverse ? 'stats.order.worst' : 'stats.order.best') : reverse ? 'stats.order.low' : 'stats.order.high')}
                </>
              )}
            </div>
          </div>
          {view === 'ranking' && (
            <button type="button" className="aa-chip aa-chip--icon" onClick={() => query.set({ rev: reverse ? '' : '1' })}>
              ⇅ {t('stats.order.reverse')}
            </button>
          )}
        </div>

        <div className="aa-stats__view">
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
        </div>

        {notes.length > 0 && (
          <ul className="aa-stats__notes">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      <p className="aa-stats__footer">
        {computed && t('stats.footer.computed', { date: computed })}
        {stats.omitted.length > 0 && (
          <>
            {' '}
            {t('stats.footer.omitted', {
              names: stats.omitted.map((o) => o.id).join(', '),
            })}
          </>
        )}
      </p>

      <Tip tip={tipApi.tip} />
      {about && (
        <Modal title={t('stats.method.title')} onClose={() => setAbout(false)}>
          <div className="aa-stats__method">
            {Object.entries(t('stats.method.sections')).map(([key, section]) => (
              <section key={key}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}

function ctxCountry(iso, lang, stats) {
  const entry = stats.countries.find((c) => c.iso === iso);
  return rowName({ kind: 'country', country: iso, name: entry?.name ?? iso, nameIt: entry?.nameIt }, lang);
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

/**
 * Layer → measure (with its facets: category and mode, score and hour) →
 * statistic → threshold or zone. Changing an earlier step keeps the later
 * ones where they still make sense.
 */
function MetricPicker({ stats, unit, spec, onChange, label }) {
  const { t, n } = useI18n();
  const { measure, key, index } = spec;
  const layers = layersOf(stats).filter((l) => unit === 'city' || l !== 'cross');
  const ofLayer = (layer) => stats.measures.filter((m) => m.layer === layer);
  const layerName = (layer) => (layer === 'cross' ? t('stats.layers.cross') : PLATFORMS_BY_ID[layer]?.name ?? layer);

  const pick = (id, patch = {}) => {
    const next = stats.measuresById[id];
    if (!next) return;
    const keys = statKeys(next, unit);
    const s = patch.s ?? (keys.includes(key) ? key : defaultStat(next, unit));
    const limit = s === 'zone' ? ZONE_KEYS.length : next.thresholds?.length ?? 0;
    const tIndex = patch.t ?? Math.min(index, Math.max(0, limit - 1));
    onChange({ m: id, s, t: tIndex });
  };

  const layerDefault = (layer) => {
    if (layer === 'fifteen') return 'fifteen.proximity_time.foot';
    if (layer === 'citychrone') return 'citychrone.velocity.08';
    return ofLayer(layer)[0]?.id;
  };

  const facetIds = (facet, value) =>
    stats.measures.find(
      (m) => m.layer === measure.layer && Object.entries({ ...measure.facets, [facet]: value }).every(([k, v]) => m.facets[k] === v),
    )?.id;

  const keys = statKeys(measure, unit);

  return (
    <div className="aa-stats__controlrow aa-stats__picker">
      {label && <span className="aa-stats__pickerlabel aa-eyebrow">{label}</span>}
      <Field label={t('stats.layer')}>
        <select className="aa-stats__select" value={measure.layer} onChange={(e) => pick(layerDefault(e.target.value))}>
          {layers.map((l) => (
            <option key={l} value={l}>
              {layerName(l)}
            </option>
          ))}
        </select>
      </Field>

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
      <span className="aa-eyebrow">{label}</span>
      {children}
    </label>
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
