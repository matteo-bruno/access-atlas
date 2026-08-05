import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS, PLATFORMS_BY_ID, ZONES } from '../data/platforms.js';
import { BANDS, CATEGORIES, MODES, measureKey } from '../data/fifteen.js';
import {
  CITYCHRONE_BANDS,
  CITYCHRONE_VIEWS,
  DEFAULT_HOUR,
  summariseCitychrone,
} from '../data/citychrone.js';
import { summariseMeasure } from '../data/adapters.js';
import {
  useAtlasMesh,
  useAtlasView,
  useCitychroneHour,
  useTravelTimes,
} from '../data/useAtlasView.js';
import { useCityMesh } from '../workers/useCityMesh.js';
import './CityPage.css';
import './FifteenCityPage.css';
import './AtlasCityPage.css';

// Switcher order matches the platform numbering (§01–§04).
const LAYER_ORDER = PLATFORMS.map((platform) => platform.id);

// The P.O.V. cool→warm ramp doubles for the time-like layers; CityChrone's
// scores read it reversed, so that cool = fast/most-reachable everywhere.
const FIFTEEN_SCALE = PLATFORMS_BY_ID.fifteen.scale;
const REVERSED_SCALE = [...FIFTEEN_SCALE].reverse();
const CDI_STOPS = PLATFORMS_BY_ID.cardep.stops;

/**
 * The combined viewer: one city, one map, a switch between the four
 * platforms' visualisations. The catalogue decides the drawing strategy —
 * a harmonised city loads its union mesh once and every switch is a paint
 * change; a legacy city swaps in the active platform's own mesh. Layer and
 * per-layer options live in the query string so any view is linkable.
 */
export default function AtlasCityPage() {
  const { cityId } = useParams();
  const view = useAtlasView(cityId);

  if (view.status === 'pending') return <div className="aa-page" />;
  if (view.status === 'missing' || !view.profile) return <Navigate to="/" replace />;
  return <AtlasScreen key={cityId} cityId={cityId} view={view} />;
}

function AtlasScreen({ cityId, view }) {
  const { t, n, lang } = useI18n();
  const { unified, profile, platformProfiles, available } = view;
  const [params, setParams] = useSearchParams();
  const [activeBand, setActiveBand] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);

  // ── URL state ──────────────────────────────────────────────────────
  const layer = useMemo(() => {
    const requested = params.get('layer');
    if (requested && available.has(requested)) return requested;
    if (available.has('pov')) return 'pov';
    return LAYER_ORDER.find((id) => available.has(id)) ?? 'pov';
  }, [params, available]);

  const category = CATEGORIES.some((c) => c.key === params.get('cat'))
    ? params.get('cat')
    : CATEGORIES[0].key;
  const mode = MODES.some((m) => m.key === params.get('mode')) ? params.get('mode') : MODES[0].key;
  const ccView = CITYCHRONE_VIEWS.some((v) => v.key === params.get('view'))
    ? params.get('view')
    : CITYCHRONE_VIEWS[0].key;
  const hourParam = Number.parseInt(params.get('hour'), 10);
  const hours = platformProfiles.citychrone?.hourly?.hours ?? 24;
  const hour = Number.isInteger(hourParam) && hourParam >= 0 && hourParam < hours
    ? hourParam
    : DEFAULT_HOUR;
  const fromParam = Number.parseInt(params.get('from'), 10);
  const originCc = Number.isInteger(fromParam) && fromParam >= 0 ? fromParam : null;

  const setParam = (key, value, { push = false } = {}) => {
    const next = new URLSearchParams(params);
    if (value == null) next.delete(key);
    else next.set(key, String(value));
    setParams(next, { replace: !push });
  };

  const pickLayer = (id) => {
    setActiveBand(null);
    setParam('layer', id, { push: true });
  };

  // ── Data ───────────────────────────────────────────────────────────
  const atlas = useAtlasMesh(cityId, unified);
  // Legacy path: the active platform's own mesh, swapped on layer change.
  const swapProfile = !unified && layer !== 'citychrone' ? platformProfiles[layer] : null;
  const swapMesh = useCityMesh(swapProfile ?? null, layer);

  const citychroneOn = layer === 'citychrone' && available.has('citychrone');
  const ccHour = useCitychroneHour(cityId, hour, citychroneOn);
  const times = useTravelTimes(cityId, hour, citychroneOn && ccView === 'isochrone');

  const meshData = unified ? atlas.data : swapMesh.data;
  const geojson =
    unified || layer !== 'citychrone' ? meshData?.geojson : ccHour.collection ?? null;
  const meshReady = unified
    ? atlas.status === 'ready'
    : layer === 'citychrone'
      ? Boolean(ccHour.collection)
      : swapMesh.status === 'ready';
  const source = unified ? 'published' : layer === 'citychrone' ? 'published' : swapMesh.source;

  // cc id → feature id in whatever mesh is drawn. The union mesh records the
  // mapping; a standalone hexcover promotes new_id to the feature id itself.
  const ccToId = unified ? atlas.data?.layers.citychrone.ccToId : null;
  const featureIdForCc = useMemo(() => {
    if (!citychroneOn) return null;
    if (unified) return (cc) => ccToId?.get(cc);
    return (cc) => cc;
  }, [citychroneOn, unified, ccToId]);

  // ── CityChrone runtime join: hourly scores / travel times as state ──
  const matrixRow = useMemo(() => {
    if (!citychroneOn || ccView !== 'isochrone' || originCc == null || !times.matrix) return null;
    const [rows, cols] = times.matrix.shape;
    if (originCc >= rows) return null;
    return times.matrix.data.subarray(originCc * cols, (originCc + 1) * cols);
  }, [citychroneOn, ccView, originCc, times.matrix]);

  const featureState = useMemo(() => {
    if (!citychroneOn || !ccHour.data || !featureIdForCc) return null;
    const states = new Map();
    for (const [cc, scores] of ccHour.data.byCc) {
      const id = featureIdForCc(cc);
      if (id == null) continue;
      const state = { v: scores.v, s: scores.s };
      if (matrixRow) state.t = matrixRow[cc];
      states.set(id, state);
    }
    return states;
  }, [citychroneOn, ccHour.data, featureIdForCc, matrixRow]);

  // ── Per-layer legend model ─────────────────────────────────────────
  const fifteenKey = measureKey(category, mode);
  const fifteenMeasure = useMemo(
    () =>
      layer === 'fifteen' && geojson ? summariseMeasure(geojson, fifteenKey, BANDS[mode]) : null,
    [layer, geojson, fifteenKey, mode],
  );

  const ccSummary = useMemo(() => {
    if (!citychroneOn || !ccHour.data) return null;
    if (ccView === 'isochrone') {
      if (!matrixRow) return null;
      return summariseCitychrone(Array.from(matrixRow), CITYCHRONE_BANDS.isochrone);
    }
    const key = ccView === 'velocity' ? 'v' : 's';
    return summariseCitychrone(
      [...ccHour.data.byCc.values()].map((scores) => scores[key]),
      CITYCHRONE_BANDS[ccView],
    );
  }, [citychroneOn, ccHour.data, ccView, matrixRow]);

  const legend = useMemo(() => {
    if (layer === 'pov') {
      const shares = unified
        ? atlas.data?.layers.pov.zoneShares
        : swapMesh.data?.stats?.zoneShares;
      return ZONES.map((zone, index) => ({
        color: zone.color,
        label: t(`city.zones.${zone.key}.name`),
        share: shares?.[index],
      }));
    }
    if (layer === 'cardep') {
      const labels = t('platform.cardep.legend');
      const shares = unified
        ? atlas.data?.layers.cardep.zoneShares
        : swapMesh.data?.stats?.zoneShares;
      return PLATFORMS_BY_ID.cardep.scale.map((color, index) => ({
        color,
        label: labels[index],
        share: shares?.[index],
      }));
    }
    if (layer === 'fifteen') {
      return BANDS[mode].map((edge, index) => ({
        color: FIFTEEN_SCALE[index],
        label: rangeLabel(BANDS[mode], index, n),
        share: fifteenMeasure?.shares[index],
      }));
    }
    const bands = CITYCHRONE_BANDS[ccView];
    const scale = ccView === 'isochrone' ? FIFTEEN_SCALE : REVERSED_SCALE;
    const fmt =
      ccView === 'sociality' ? (v) => `${n(Math.round(v / 1000))}k` : (v) => n(v);
    return bands.map((edge, index) => ({
      color: scale[index],
      label: rangeLabel(bands, index, fmt),
      share: ccSummary?.shares[index],
    }));
  }, [layer, unified, atlas.data, swapMesh.data, mode, fifteenMeasure, ccView, ccSummary, t, n]);

  // ── Paint ──────────────────────────────────────────────────────────
  const fillPaint = useMemo(() => {
    if (layer === 'pov') {
      return {
        'fill-color': [
          'match',
          ['coalesce', ['get', 'zone'], -1],
          ...ZONES.flatMap((zone, index) => [index, zone.color]),
          'rgba(0,0,0,0)',
        ],
        'fill-opacity': isolate(['coalesce', ['get', 'zone'], -1], null, activeBand, {
          match: true,
        }),
      };
    }
    if (layer === 'cardep') {
      const value = ['coalesce', ['get', 'cdi'], -9999];
      return {
        'fill-color': stepColor(value, PLATFORMS_BY_ID.cardep.scale, CDI_STOPS.slice(0, -1)),
        // The index is bounded at exactly −1, so the floor sits just below it.
        'fill-opacity': isolate(value, bandRanges(CDI_STOPS.slice(0, -1), -1.001), activeBand),
      };
    }
    if (layer === 'fifteen') {
      const bands = BANDS[mode];
      const value = ['coalesce', ['get', fifteenKey], -9999];
      return {
        'fill-color': stepColor(value, FIFTEEN_SCALE, bands.slice(0, -1)),
        'fill-opacity': isolate(value, bandRanges(bands.slice(0, -1), -0.001), activeBand),
      };
    }
    // CityChrone: values arrive as feature-state, joined per hour. Before an
    // isochrone origin is picked there is nothing to band — show the covered
    // cells faintly so there is something to click on.
    if (ccView === 'isochrone' && !matrixRow) {
      const covered = ['!=', ['coalesce', ['feature-state', 'v'], -9999], -9999];
      return {
        'fill-color': '#cfd9da',
        'fill-opacity': ['case', covered, 0.35, 0],
      };
    }
    const stateKey = CITYCHRONE_VIEWS.find((v) => v.key === ccView).state;
    const bands = CITYCHRONE_BANDS[ccView];
    const scale = ccView === 'isochrone' ? FIFTEEN_SCALE : REVERSED_SCALE;
    const value = ['coalesce', ['feature-state', stateKey], -9999];
    return {
      'fill-color': stepColor(value, scale, bands.slice(0, -1)),
      'fill-opacity': isolate(value, bandRanges(bands.slice(0, -1), -0.001), activeBand),
    };
  }, [layer, activeBand, mode, fifteenKey, ccView, matrixRow]);

  const highlightPaint = useMemo(
    () => ({ 'line-color': 'rgba(21,23,26,0.85)', 'line-width': 1.6 }),
    [],
  );
  const originPaint = useMemo(
    () => ({ 'line-color': 'rgba(21,23,26,0.95)', 'line-width': 2.2 }),
    [],
  );

  // ── Presentation helpers ───────────────────────────────────────────
  const cityName = lang === 'it' ? profile.nameIt ?? profile.name : profile.name;
  const region = lang === 'it' ? profile.regionIt : profile.region;
  const platform = PLATFORMS_BY_ID[layer];
  const stats = meshData?.stats;
  const cellCount = unified ? atlas.data?.stats.cellCount : stats?.cellCount;
  const layerCells = unified ? atlas.data?.layers[layer]?.cells : stats?.cellCount;

  const ccForFeature = (feature) =>
    unified ? feature.properties?.cc : feature.properties?.new_id;

  const tooltip = (feature) => {
    const p = feature.properties ?? {};
    if (layer === 'pov') {
      if (!Number.isFinite(p.zone)) return t('atlas.noValue');
      return `${t(`city.zones.${ZONES[p.zone].key}.name`)} · ${[p.proximity, p.opportunity]
        .map((v) => n(v, { maximumFractionDigits: 1 }))
        .join(' · ')}`;
    }
    if (layer === 'cardep') {
      return Number.isFinite(p.cdi) ? `CDI ${signed(p.cdi, n)}` : t('atlas.noValue');
    }
    if (layer === 'fifteen') {
      const value = p[fifteenKey];
      return value == null
        ? t('atlas.noValue')
        : `${n(value, { maximumFractionDigits: 1 })} ${t('fifteen.minutes')}`;
    }
    const cc = ccForFeature(feature);
    const scores = cc != null ? ccHour.data?.byCc.get(cc) : null;
    if (!scores) return t('atlas.noValue');
    if (ccView === 'isochrone') {
      // No popup before an origin exists — the standing prompt instructs, and
      // a popup would freeze on the old text once the matrix arrives.
      if (!matrixRow) return null;
      return `${n(matrixRow[cc])} ${t('fifteen.minutes')}`;
    }
    return ccView === 'velocity'
      ? `${n(scores.v, { maximumFractionDigits: 1 })} km/h`
      : n(Math.round(scores.s));
  };

  const onCellClick = (feature) => {
    if (!citychroneOn || ccView !== 'isochrone') return;
    const cc = ccForFeature(feature);
    if (Number.isFinite(cc)) setParam('from', cc);
  };

  const legendTitle =
    layer === 'pov'
      ? t('city.zoneType')
      : layer === 'cardep'
        ? t('platform.cardep.legendUnit')
        : layer === 'fifteen'
          ? t('fifteen.legendValue')
          : t(`atlas.legend.${ccView}`);

  const platformPage =
    platform.hasCityPages && platformProfiles[layer]?.dataset
      ? `/platforms/${platform.slug}/${cityId}`
      : null;

  return (
    <div className="aa-page aa-page--fixed">
      <Nav active="platforms" sticky={false} />

      <Subhead
        accent={platform.accent}
        label={t('atlas.label')}
        title={cityName}
        meta={
          <span className="aa-city__region">
            {t('city.region', { region, count: cellCount != null ? n(cellCount) : '—' })}
          </span>
        }
      >
        {platformPage && (
          <Link className="aa-chip" to={platformPage}>
            {t('atlas.openPlatform', { name: platform.name })}
          </Link>
        )}
      </Subhead>

      <main className="aa-main aa-city aa-city--nochart" id="main">
        <aside className="aa-city__panel">
          {/* ── The switcher ─────────────────────────────────── */}
          <Eyebrow>{t('atlas.controls.layer')}</Eyebrow>
          <div className="aa-layers" role="group" aria-label={t('atlas.controls.layer')}>
            {LAYER_ORDER.map((id) => {
              const option = PLATFORMS_BY_ID[id];
              const enabled = available.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`aa-layers__row${layer === id ? ' aa-layers__row--active' : ''}`}
                  disabled={!enabled}
                  aria-pressed={layer === id}
                  title={enabled ? undefined : t('atlas.unavailable')}
                  onClick={() => pickLayer(id)}
                >
                  <span className="aa-layers__dot" style={{ background: option.accent }} />
                  <span className="aa-layers__name">{option.name}</span>
                  {!enabled && <span className="aa-layers__off">{t('atlas.unavailable')}</span>}
                </button>
              );
            })}
          </div>

          {/* ── Per-layer controls ───────────────────────────── */}
          {layer === 'fifteen' && (
            <>
              <Eyebrow>{t('fifteen.controls.mode')}</Eyebrow>
              <div className="aa-toggle" role="group" aria-label={t('fifteen.controls.mode')}>
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className={`aa-toggle__btn${mode === m.key ? ' aa-toggle__btn--active' : ''}`}
                    aria-pressed={mode === m.key}
                    onClick={() => setParam('mode', m.key === MODES[0].key ? null : m.key)}
                  >
                    {t(`fifteen.modes.${m.i18n}`)}
                  </button>
                ))}
              </div>
              <label className="aa-field">
                <Eyebrow>{t('fifteen.controls.category')}</Eyebrow>
                <select
                  className="aa-select"
                  value={category}
                  onChange={(event) =>
                    setParam(
                      'cat',
                      event.target.value === CATEGORIES[0].key ? null : event.target.value,
                    )
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {t(`fifteen.categories.${c.i18n}`)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {layer === 'citychrone' && (
            <>
              <Eyebrow>{t('atlas.controls.view')}</Eyebrow>
              <div className="aa-toggle" role="group" aria-label={t('atlas.controls.view')}>
                {CITYCHRONE_VIEWS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`aa-toggle__btn${ccView === option.key ? ' aa-toggle__btn--active' : ''}`}
                    aria-pressed={ccView === option.key}
                    onClick={() => {
                      setActiveBand(null);
                      setParam('view', option.key === CITYCHRONE_VIEWS[0].key ? null : option.key);
                    }}
                  >
                    {t(`atlas.views.${option.key}`)}
                  </button>
                ))}
              </div>
              <label className="aa-field">
                <Eyebrow>{t('atlas.controls.hour')}</Eyebrow>
                <select
                  className="aa-select"
                  value={hour}
                  onChange={(event) =>
                    setParam(
                      'hour',
                      Number(event.target.value) === DEFAULT_HOUR ? null : event.target.value,
                    )
                  }
                >
                  {Array.from({ length: hours }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
              <p className="aa-city__hint">{t(`atlas.viewHint.${ccView}`)}</p>
            </>
          )}

          {/* ── Legend ───────────────────────────────────────── */}
          <Eyebrow>{legendTitle}</Eyebrow>
          <div className="aa-bands">
            {legend.map((band, index) => (
              <button
                key={`${band.label}-${index}`}
                type="button"
                className={`aa-bands__row${activeBand === index ? ' aa-bands__row--active' : ''}`}
                aria-pressed={activeBand === index}
                onMouseEnter={() => setActiveBand(index)}
                onMouseLeave={() => setActiveBand(null)}
                onFocus={() => setActiveBand(index)}
                onBlur={() => setActiveBand(null)}
                onClick={() => setActiveBand((cur) => (cur === index ? null : index))}
              >
                <span className="aa-swatch" style={{ background: band.color }} />
                <span className="aa-bands__label aa-mono">{band.label}</span>
                <span className="aa-mono aa-bands__pct">
                  {band.share == null ? '—' : `${n(band.share, { minimumFractionDigits: 1 })}%`}
                </span>
              </button>
            ))}
          </div>

          {/* ── Summary ──────────────────────────────────────── */}
          <div className="aa-city__summary">
            <Eyebrow>{t('city.summary.title')}</Eyebrow>
            <dl className="aa-summary">
              <SummaryRow
                label={t('city.summary.hexagons')}
                value={cellCount != null ? n(cellCount) : '—'}
              />
              {unified && layerCells != null && layerCells !== cellCount && (
                <SummaryRow
                  label={t('atlas.layerCells', { name: platform.name })}
                  value={n(layerCells)}
                />
              )}
              {layer === 'cardep' && (
                <SummaryRow
                  label={t('city.summary.weightedCdi')}
                  value={signedOrDash(
                    unified ? atlas.data?.layers.cardep.weightedCdi : stats?.weightedCdi,
                    n,
                  )}
                />
              )}
              {layer === 'fifteen' && (
                <SummaryRow
                  label={t('fifteen.summary.median')}
                  value={
                    fifteenMeasure?.median == null
                      ? '—'
                      : `${n(fifteenMeasure.median, { maximumFractionDigits: 1 })} ${t('fifteen.minutes')}`
                  }
                />
              )}
              {layer === 'citychrone' && ccView !== 'isochrone' && (
                <SummaryRow
                  label={t('atlas.summary.weightedV')}
                  value={
                    ccHour.data?.weightedMedianV == null
                      ? '—'
                      : `${n(ccHour.data.weightedMedianV, { maximumFractionDigits: 1 })} km/h`
                  }
                />
              )}
              <SummaryRow
                label={t('city.summary.population')}
                value={
                  stats?.population == null
                    ? '—'
                    : `${n(stats.population / 1e6, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })} M`
                }
              />
            </dl>
          </div>
        </aside>

        {/* ── Map ────────────────────────────────────────────── */}
        <section className="aa-city__cartogram aa-city__cartogram--wide">
          <Eyebrow>{t('atlas.mapTitle', { name: platform.name })}</Eyebrow>
          <div className="aa-city__canvas">
            {meshReady && geojson ? (
              <AtlasMap
                center={profile.center}
                zoom={profile.zoom}
                graticule={false}
                label={`${cityName} — ${platform.name}`}
              >
                <GeoJSONLayer
                  id="atlas-mesh"
                  data={geojson}
                  type="fill"
                  paint={fillPaint}
                  promoteId={!unified && layer === 'citychrone' ? 'new_id' : undefined}
                  featureState={featureState}
                  onHover={(feature) => setHoverCell(feature ? feature.id : null)}
                  onClick={onCellClick}
                  tooltip={tooltip}
                />
                {hoverCell != null && (
                  <GeoJSONLayer
                    id="atlas-mesh-highlight"
                    data={geojson}
                    type="line"
                    paint={highlightPaint}
                    filter={['==', ['id'], hoverCell]}
                    interactive={false}
                  />
                )}
                {citychroneOn && ccView === 'isochrone' && originCc != null && (
                  <GeoJSONLayer
                    id="atlas-iso-origin"
                    data={geojson}
                    type="line"
                    paint={originPaint}
                    filter={[
                      '==',
                      ['coalesce', ['get', unified ? 'cc' : 'new_id'], -1],
                      originCc,
                    ]}
                    interactive={false}
                  />
                )}
              </AtlasMap>
            ) : (
              <div className="aa-city__loading">
                {unified && atlas.status === 'error' ? t('atlas.error') : t('city.computing')}
              </div>
            )}
            {citychroneOn && ccView === 'isochrone' && originCc == null && (
              <div className="aa-atlas__prompt">{t('atlas.isochroneEmpty')}</div>
            )}
            {stats?.cellRadiusM != null && (
              <div className="aa-city__caption">
                {stats.h3Resolution != null
                  ? t('city.cartogram.caption', {
                      res: stats.h3Resolution,
                      size: n(stats.cellRadiusM),
                    })
                  : t('city.cartogram.captionSize', { size: n(stats.cellRadiusM) })}
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="aa-statusbar">
        <span>
          {source === 'seed'
            ? t('city.seeded')
            : unified
              ? t('atlas.statusHint')
              : t('atlas.legacyHint')}
        </span>
        <span className="aa-mono">
          {formatCoord(profile.center[1], 'NS')} {formatCoord(profile.center[0], 'EW')}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="aa-summary__row">
      <dt>{label}</dt>
      <dd className="aa-mono">{value}</dd>
    </div>
  );
}

// ── Paint expression helpers ─────────────────────────────────────────
// All value expressions coalesce missing data to a sentinel below every real
// band, so cells a layer does not cover paint fully transparent instead of
// inheriting the first band's colour.

function stepColor(value, scale, edges) {
  const steps = [];
  for (let i = 0; i < edges.length; i++) steps.push(edges[i], scale[i + 1]);
  return ['step', value, scale[0], ...steps];
}

/** Band index → [lower, upper] pairs; `floor` is the value below band 0. */
function bandRanges(edges, floor) {
  const ranges = [];
  for (let i = 0; i <= edges.length; i++) {
    ranges.push([i === 0 ? floor : edges[i - 1], i === edges.length ? null : edges[i]]);
  }
  return ranges;
}

/**
 * Opacity expression: hide cells with no value, dim everything outside the
 * active band. `match: true` treats the value as a category equal to the band
 * index (P.O.V. zones) rather than a banded continuum.
 */
function isolate(value, ranges, activeBand, { match = false } = {}) {
  const covered = match ? ['>=', value, 0] : ['>', value, -9000];
  if (activeBand == null) return ['case', covered, 0.88, 0];
  const inBand = match
    ? ['==', value, activeBand]
    : (() => {
        const [lower, upper] = ranges[activeBand];
        const tests = [['>', value, lower]];
        if (upper != null) tests.push(['<=', value, upper]);
        return ['all', ...tests];
      })();
  return ['case', ['!', covered], 0, inBand, 0.95, 0.12];
}

function rangeLabel(bands, index, fmt) {
  if (index === 0) return `≤ ${fmt(bands[0])}`;
  if (index === bands.length - 1) return `> ${fmt(bands[bands.length - 2])}`;
  return `${fmt(bands[index - 1])} – ${fmt(bands[index])}`;
}

function signed(value, n) {
  const text = n(Math.abs(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `−${text}` : `+${text}`;
}

function signedOrDash(value, n) {
  return value == null ? '—' : signed(value, n);
}

function formatCoord(value, axes) {
  const hemisphere = value >= 0 ? axes[0] : axes[1];
  return `${Math.abs(value).toFixed(3)}°${hemisphere}`;
}
