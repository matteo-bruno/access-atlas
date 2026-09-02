import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { Icon } from '../components/Icon.jsx';
import { RampLegend } from '../components/RampLegend.jsx';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { RAMPS, rampColor } from '../map/ramps.js';
import { cityZoom, meshBounds } from '../map/framing.js';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS, PLATFORMS_BY_ID, ZONES } from '../data/platforms.js';
import { CATEGORIES, MODES, formatTime, measureKey } from '../data/fifteen.js';
import { CITYCHRONE_VIEWS, DEFAULT_HOUR } from '../data/citychrone.js';
import { paperForPlatform } from '../data/research.js';
import { BRAND } from '../data/brand.js';
import { summariseMeasure, withGeometry } from '../data/adapters.js';
import { GeometryToggle } from '../components/GeometryToggle.jsx';
import { Explain } from '../components/Explain.jsx';
import { CellInspector } from '../components/CellInspector.jsx';
import { MapBox } from '../components/MapBox.jsx';
import { CategoryBars } from '../components/CategoryBars.jsx';
import { PlatformAbout } from '../components/PlatformAbout.jsx';
import { RangeFilter } from '../components/RangeFilter.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { CONTACT } from '../data/team.js';
import {
  useAtlasCartogram,
  useAtlasMesh,
  useAtlasView,
  useCitychroneHour,
  useTravelTimes,
} from '../data/useAtlasView.js';
import { useCityMesh } from '../workers/useCityMesh.js';
import './CityPage.css';
import './FifteenCityPage.css';
import './AtlasCityPage.css';

// Switcher order matches the platform numbering (§01–§04). Population is not
// a platform — it is the context the four are measured against — so it is
// offered separately rather than as a fifth lens.
const LAYER_ORDER = PLATFORMS.map((platform) => platform.id);
const POPULATION_LAYER = 'population';

// Every layer the URL may name, and where its values come from.
const ALL_LAYERS = [...LAYER_ORDER, POPULATION_LAYER];

const DEFAULT_OPACITY = 0.8;

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
  const [activeZone, setActiveZone] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [infoOpen, setInfoOpen] = useState(false);
  const [geometry, setGeometry] = useState('geographic');
  const [selectedCell, setSelectedCell] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  // The map is the page; everything else can step out of its way.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [selectedOpen, setSelectedOpen] = useState(true);

  // The nav belongs to the shell now, so full screen asks for it to go rather
  // than declining to render it.
  useEffect(() => {
    document.documentElement.classList.toggle('aa-chromeless', fullscreen);
    return () => document.documentElement.classList.remove('aa-chromeless');
  }, [fullscreen]);

  // Full screen is a mode, not a destination: Escape is how anyone expects to
  // leave one.
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fullscreen]);
  // Car Dependency's index filter, on the same bounds as its own viewer.
  // Whether it is actually filtering depends on the active layer, which is
  // resolved from the URL further down.
  const [range, setRange] = useState([-1, 1]);

  // Population comes from the union mesh, so it is offered wherever that mesh
  // is — it is not a platform and has no catalogue entry of its own.
  const hasPopulation = unified;

  // ── URL state ──────────────────────────────────────────────────────
  const layerAvailable = (id) => (id === POPULATION_LAYER ? hasPopulation : available.has(id));

  const layer = useMemo(() => {
    const requested = params.get('layer');
    if (requested && ALL_LAYERS.includes(requested) && layerAvailable(requested)) return requested;
    // LAYER_ORDER is the platform numbering, so this opens on 15-minute city:
    // proximity is the measure that needs the least explaining, and the one
    // with the widest coverage of the city.
    return LAYER_ORDER.find((id) => available.has(id)) ?? 'pov';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, available, hasPopulation]);

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
    setActiveZone(null);
    // Every layer measures something else, so a selection made under one is
    // not a selection under the next.
    setSelectedCell(null);
    setParam('layer', id, { push: true });
  };

  // ── Data ───────────────────────────────────────────────────────────
  const atlas = useAtlasMesh(cityId, unified);
  // Legacy path: the active platform's own mesh, swapped on layer change.
  const swapProfile =
    !unified && layer !== 'citychrone' && layer !== POPULATION_LAYER
      ? platformProfiles[layer]
      : null;
  const swapMesh = useCityMesh(swapProfile ?? null, layer);

  const citychroneOn = layer === 'citychrone' && available.has('citychrone');
  const ccHour = useCitychroneHour(cityId, hour, citychroneOn);
  const times = useTravelTimes(cityId, hour, citychroneOn && ccView === 'isochrone');

  // ── Geometry ───────────────────────────────────────────────────────
  // Reversed from the platform pages: the union mesh is already the cells
  // where they are, and the cartogram is the companion. Every layer has one —
  // P.O.V.'s and Car Dependency's as those platforms publish them, the other
  // two derived by the Atlas — and each is its own, never shared: even the two
  // published ones disagree by up to 9.6 m on cells they both cover.
  const cartogramLayer = unified && layer !== POPULATION_LAYER ? layer : null;
  const cartogramPublished = Boolean(profile.cartograms?.[cartogramLayer]);
  const cartogramDerived = profile.cartogramSources?.[cartogramLayer] === 'derived';
  const cartogramOn = geometry === 'cartogram' && cartogramPublished;
  // The choice is remembered across layers but only honoured where that
  // layer publishes a cartogram, so switching to 15minCity shows the map and
  // switching back to P.O.V. returns to the cartogram.
  const geometryValue = cartogramOn ? 'cartogram' : 'geographic';
  const cartogram = useAtlasCartogram(cityId, cartogramLayer, cartogramOn);

  const meshData = unified ? atlas.data : swapMesh.data;
  const baseGeojson =
    unified || layer !== 'citychrone' ? meshData?.geojson : ccHour.collection ?? null;
  const geojson = useMemo(() => {
    if (!baseGeojson || !cartogramOn || cartogram.status !== 'ready') return baseGeojson;
    try {
      return withGeometry(baseGeojson, cartogram.collection);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[data] cartogram companion unusable', error.message);
      return baseGeojson;
    }
  }, [baseGeojson, cartogramOn, cartogram.status, cartogram.collection]);
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

  // The union mesh's extent, so the frame is the city and not the layer:
  // switching between a platform covering 7,498 cells and one covering 1,636
  // must not move the camera.
  const bounds = useMemo(() => meshBounds(baseGeojson), [baseGeojson]);

  // ── What the active layer measures ─────────────────────────────────
  // One description per layer: the value expression to colour by, the ramp
  // that colours it, and how to read a number back out. Everything below —
  // paint, legend, tooltip, summary — is driven from this rather than
  // branching on the layer id in four separate places.
  const fifteenKey = measureKey(category, mode);

  const measure = useMemo(() => {
    if (layer === 'pov') return null; // categorical — handled separately
    if (layer === 'cardep') {
      return { ramp: RAMPS.cdi, value: ['get', 'cdi'], format: (v) => signed(v, n) };
    }
    if (layer === POPULATION_LAYER) {
      return {
        ramp: RAMPS.population,
        value: ['get', 'population'],
        format: (v) => n(Math.round(v)),
      };
    }
    if (layer === 'fifteen') {
      // A travel time reads as a clock, not as a decimal: 3:59, not 3.99 min.
      return {
        ramp: RAMPS.fifteen,
        value: ['get', fifteenKey],
        format: (v) => formatTime(v) ?? '—',
      };
    }
    // CityChrone values are joined per hour as feature-state, never baked in.
    const state = CITYCHRONE_VIEWS.find((v) => v.key === ccView).state;
    if (ccView === 'isochrone') {
      return {
        ramp: RAMPS.isochrone,
        value: ['feature-state', state],
        format: (v) => `${n(Math.round(v))} ${t('fifteen.minutes')}`,
      };
    }
    return ccView === 'velocity'
      ? {
          ramp: RAMPS.velocity,
          value: ['feature-state', state],
          format: (v) => `${n(v, { maximumFractionDigits: 1 })} km/h`,
        }
      : {
          ramp: RAMPS.sociality,
          value: ['feature-state', state],
          format: (v) => n(Math.round(v)),
        };
  }, [layer, fifteenKey, ccView, n, t]);

  // The one figure the legend no longer carries: a continuous ramp states the
  // scale, not what the city sits at, so the median is quoted in the summary.
  const fifteenMedian = useMemo(
    () =>
      layer === 'fifteen' && baseGeojson
        ? summariseMeasure(baseGeojson, fifteenKey, RAMPS.fifteen.ticks).median
        : null,
    [layer, baseGeojson, fifteenKey],
  );

  // ── Paint ──────────────────────────────────────────────────────────
  const rangeOn = layer === 'cardep' && (range[0] > -1 || range[1] < 1);

  const fillPaint = useMemo(() => {
    // P.O.V. is the one genuinely categorical layer: four named classes, not a
    // quantity, so it keeps discrete colours and band isolation.
    if (layer === 'pov') {
      const zone = ['coalesce', ['get', 'zone'], -1];
      const covered = ['>=', zone, 0];
      return {
        'fill-color': [
          'match',
          zone,
          ...ZONES.flatMap((z, index) => [index, z.color]),
          'rgba(0,0,0,0)',
        ],
        'fill-opacity':
          activeZone == null
            ? ['case', covered, opacity, 0]
            : [
                'case',
                ['==', zone, activeZone],
                Math.min(opacity + 0.12, 1),
                covered,
                opacity * 0.18,
                0,
              ],
      };
    }

    // Before an isochrone origin is chosen there is no value to colour by —
    // show the cells that *can* be chosen, faintly, so there is a target.
    if (citychroneOn && ccView === 'isochrone' && !matrixRow) {
      return {
        'fill-color': '#cfd9da',
        'fill-opacity': ['case', present('v', true), opacity * 0.45, 0],
      };
    }

    const { ramp, value } = measure;
    // Cells a layer does not cover get no colour at all, rather than the
    // ramp's first colour — absence of data is not a low value.
    const covered =
      value[0] === 'feature-state' ? present(value[1], true) : present(value[1], false);
    // Filtered-out cells are dimmed rather than dropped, so the slice is read
    // against the city it was taken from.
    const opacityFor = rangeOn
      ? [
          'case',
          ['all', ['>=', ['coalesce', value, 0], range[0]], ['<=', ['coalesce', value, 0], range[1]]],
          opacity,
          opacity * 0.1,
        ]
      : opacity;
    return {
      'fill-color': rampColor(ramp, ['coalesce', value, 0]),
      'fill-opacity': ['case', covered, opacityFor, 0],
    };
  }, [layer, activeZone, opacity, measure, citychroneOn, ccView, matrixRow, rangeOn, range]);

  const highlightPaint = useMemo(
    () => ({ 'line-color': 'rgba(21,23,26,0.85)', 'line-width': 1.6 }),
    [],
  );
  const originPaint = useMemo(
    () => ({ 'line-color': 'rgba(21,23,26,0.95)', 'line-width': 2.2 }),
    [],
  );
  const selectedPaint = useMemo(
    () => ({ 'line-color': 'rgba(21,23,26,0.95)', 'line-width': 2.6 }),
    [],
  );

  // ── Presentation helpers ───────────────────────────────────────────
  const cityName = lang === 'it' ? profile.nameIt ?? profile.name : profile.name;
  const region = lang === 'it' ? profile.regionIt : profile.region;
  // Population is not a platform; it borrows the Atlas's own accent and name.
  const isPopulation = layer === POPULATION_LAYER;
  const platform = isPopulation
    ? { id: POPULATION_LAYER, name: t('atlas.population.name'), accent: BRAND.navy }
    : PLATFORMS_BY_ID[layer];
  const paper = isPopulation ? null : paperForPlatform(layer);
  const stats = meshData?.stats;
  const cellCount = unified ? atlas.data?.stats.cellCount : stats?.cellCount;
  const layerCells = isPopulation
    ? cellCount
    : unified
      ? atlas.data?.layers[layer]?.cells
      : stats?.cellCount;
  // Ground covered by the cells this layer measures. Only the union mesh is
  // drawn in true geography, so only it can be measured — a cartogram's
  // polygons are a population, not a place.
  const layerArea = unified
    ? isPopulation
      ? atlas.data?.stats.areaKm2
      : atlas.data?.layers[layer]?.areaKm2
    : null;

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
    if (isPopulation) {
      return Number.isFinite(p.population)
        ? t('atlas.population.tooltip', { count: n(Math.round(p.population)) })
        : t('atlas.noValue');
    }
    if (layer === 'fifteen') {
      const value = p[fifteenKey];
      return value == null ? t('atlas.noValue') : measure.format(value);
    }
    const cc = ccForFeature(feature);
    const scores = cc != null ? ccHour.data?.byCc.get(cc) : null;
    if (!scores) return t('atlas.noValue');
    if (ccView === 'isochrone') {
      // No popup before an origin exists — the standing prompt instructs, and
      // a popup would freeze on the old text once the matrix arrives.
      if (!matrixRow) return null;
      return measure.format(matrixRow[cc]);
    }
    return measure.format(ccView === 'velocity' ? scores.v : scores.s);
  };

  const onCellClick = (feature) => {
    setSelectedCell((current) => (current === feature.id ? null : feature.id));
    // In the isochrone view a click also chooses the origin everything is
    // measured from, which is a different job from inspecting the cell.
    if (!citychroneOn || ccView !== 'isochrone') return;
    const cc = ccForFeature(feature);
    if (Number.isFinite(cc)) setParam('from', cc);
  };

  // ── The selected cell ──────────────────────────────────────────────
  // One mesh, so a cell is the same cell under every layer; what is worth
  // reading about it is not, so the rows follow the layer on screen.
  const selectedRows = useMemo(() => {
    const feature = selectedCell == null ? null : baseGeojson?.features?.[selectedCell];
    if (!feature) return null;
    const p = feature.properties ?? {};
    const score = (v) => (Number.isFinite(v) ? n(v, { maximumFractionDigits: 1 }) : '—');
    const rows = [];

    if (layer === 'pov') {
      rows.push({
        label: t('city.cell.zone'),
        value: Number.isFinite(p.zone) ? t(`city.zones.${ZONES[p.zone].key}.name`) : '—',
        accent: Number.isFinite(p.zone) ? ZONES[p.zone].color : undefined,
      });
      rows.push({ label: t('city.cell.proximity'), value: score(p.proximity) });
      rows.push({ label: t('city.cell.opportunity'), value: score(p.opportunity) });
    } else if (layer === 'cardep') {
      rows.push({ label: t('city.cell.cdi'), value: Number.isFinite(p.cdi) ? signed(p.cdi, n) : '—' });
      rows.push({ label: t('city.cell.byCar'), value: score(p.o_score_car) });
      rows.push({ label: t('city.cell.byTransit'), value: score(p.o_score_pt) });
    } else if (layer === 'fifteen') {
      rows.push({
        label: `${t(`fifteen.categories.${CATEGORIES.find((c) => c.key === category).i18n}`)} · ${t(
          `fifteen.modes.${MODES.find((m) => m.key === mode).i18n}`,
        )}`,
        value: p[fifteenKey] == null ? '—' : measure.format(p[fifteenKey]),
      });
    } else if (layer === 'citychrone') {
      const scores = Number.isFinite(p.cc) ? ccHour.data?.byCc.get(p.cc) : null;
      rows.push({
        label: t('city.cell.velocity'),
        value: scores ? `${n(scores.v, { maximumFractionDigits: 1 })} km/h` : '—',
      });
      rows.push({
        label: t('city.cell.sociality'),
        value: scores ? n(Math.round(scores.s)) : '—',
      });
      if (matrixRow && Number.isFinite(p.cc)) {
        rows.push({
          label: t('city.cell.time'),
          value: `${n(matrixRow[p.cc])} ${t('fifteen.minutes')}`,
        });
      }
    }

    rows.push({
      label: t('city.cell.population'),
      value: Number.isFinite(p.population) ? n(Math.round(p.population)) : '—',
    });
    // The one row that is the same under every layer: the cell's own name on
    // the shared grid, which is what makes the layers comparable at all.
    if (p.h3) rows.push({ label: t('city.cell.grid'), value: p.h3 });
    return rows;
  }, [selectedCell, baseGeojson, layer, category, mode, fifteenKey, measure, ccHour.data, matrixRow, t, n]);

  const legendTitle = isPopulation
    ? t('atlas.population.legend')
    : layer === 'pov'
      ? t('city.zoneType')
      : layer === 'cardep'
        ? t('platform.cardep.legendUnit')
        : layer === 'fifteen'
          ? t('fifteen.legendValue')
          : t(`atlas.legend.${ccView}`);

  // How to label the legend's tick values, per layer.
  const tickFormat = isPopulation
    ? (v) => (v >= 1000 ? `${n(v / 1000, { maximumFractionDigits: 1 })}k` : n(v))
    : layer === 'cardep'
      ? (v) => (v === 0 ? '0' : signed(v, n))
      : ccView === 'sociality' && citychroneOn
        ? (v) => (v === 0 ? '0' : `${n(Math.round(v / 1000))}k`)
        : (v) => n(v, { maximumFractionDigits: 1 });

  // How to read the colours of the layer on screen. The three cell-valued
  // platforms explain their own scale; CityChrone's changes with the measure
  // picked, so its per-view hint stands in.
  const legendExplain = isPopulation
    ? t('atlas.population.about')
    : layer === 'citychrone'
      ? t(`atlas.viewHint.${ccView}`)
      : t(`city.explain.map.${layer}`);

  // What the info panel explains about the layer on screen.
  const infoBody = isPopulation
    ? t('atlas.population.about')
    : layer === 'citychrone'
      ? t(`atlas.viewHint.${ccView}`)
      : t(`platform.${layer}.intro`);


  return (
    <div
      className={`aa-page aa-page--fixed aa-atlas${fullscreen ? ' aa-atlas--full' : ''}${
        sidebarOpen ? '' : ' aa-atlas--nopanel'
      }`}
    >
      {/* Full screen is the map and its controls: everything that is chrome
          steps out rather than shrinking. */}
      {!fullscreen && (
        <>
          <Subhead
            accent={platform.accent}
            label={t('atlas.label')}
            title={cityName}
            meta={
              <span className="aa-city__region">
                {t('city.region', { region, count: layerCells != null ? n(layerCells) : '—' })}
              </span>
            }
          >
            {/* Straight to the full account — there is no half-open state
                between a tooltip and this. */}
            {!isPopulation && (
              <button
                type="button"
                className="aa-chip aa-chip--icon"
                onClick={() => setAboutOpen(true)}
              >
                <Icon name="info" size={13} color="currentColor" />
                {t('atlas.info')}
              </button>
            )}
            {paper && (
              <a className="aa-chip" href={paper.url} target="_blank" rel="noreferrer noopener">
                {t('platform.paper')}
              </a>
            )}
          </Subhead>
        </>
      )}

      <main className="aa-main aa-city aa-city--nochart" id="main">
        {sidebarOpen && (
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
              {/* Population is context rather than a fifth lens: it is what
                  the other four are measured for, so it sits apart. */}
              {hasPopulation && (
                <button
                  type="button"
                  className={`aa-layers__row aa-layers__row--context${
                    isPopulation ? ' aa-layers__row--active' : ''
                  }`}
                  aria-pressed={isPopulation}
                  onClick={() => pickLayer(POPULATION_LAYER)}
                >
                  <span className="aa-layers__dot" style={{ background: BRAND.navy }} />
                  <span className="aa-layers__name">{t('atlas.population.name')}</span>
                </button>
              )}
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
                        setActiveZone(null);
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
              </>
            )}

            {/* ── Legend ───────────────────────────────────────── */}
            <Explain label={legendTitle} body={legendExplain} />
            {layer === 'pov' ? (
              // The one categorical layer: four named classes, each with the
              // share of covered cells that falls in it.
              <div className="aa-bands">
                {ZONES.map((zone, index) => {
                  const shares = unified
                    ? atlas.data?.layers.pov.zoneShares
                    : swapMesh.data?.stats?.zoneShares;
                  const share = shares?.[index];
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      className={`aa-bands__row${activeZone === index ? ' aa-bands__row--active' : ''}`}
                      aria-pressed={activeZone === index}
                      onMouseEnter={() => setActiveZone(index)}
                      onMouseLeave={() => setActiveZone(null)}
                      onFocus={() => setActiveZone(index)}
                      onBlur={() => setActiveZone(null)}
                      onClick={() => setActiveZone((cur) => (cur === index ? null : index))}
                    >
                      <span className="aa-swatch" style={{ background: zone.color }} />
                      <span className="aa-bands__label">{t(`city.zones.${zone.key}.name`)}</span>
                      <span className="aa-mono aa-bands__pct">
                        {share == null ? '—' : `${n(share, { minimumFractionDigits: 1 })}%`}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <RampLegend
                ramp={measure.ramp}
                format={tickFormat}
                // Both time ramps keep going past their bar; the tail carries
                // the rest of the scale rather than a sentence about it.
                tailLabel={measure.ramp.beyond ? `${n(measure.ramp.beyond.value)}+` : undefined}
              />
            )}

            {layer === 'cardep' && (
              <>
                <Explain label={t('city.filter.title')} body={t('city.filter.about')} />
                <RangeFilter
                  value={range}
                  onChange={setRange}
                  min={-1}
                  max={1}
                  step={0.01}
                  label={t('city.filter.title')}
                  resetLabel={t('city.filter.reset')}
                  format={(v) => (v === 0 ? '0' : signed(v, n))}
                />
              </>
            )}

            {/* The corner of the panel where a reader who knows the city
                better than the data does can say so. It sits under the
                controls rather than beside a figure: the doubt is usually
                about the layer as a whole, not one cell. */}
            <MistakeNote />
          </aside>
        )}

        {/* ── Map ────────────────────────────────────────────── */}
        <section className="aa-city__cartogram aa-city__cartogram--wide">
          <div className="aa-city__canvas">
            {meshReady && geojson ? (
              <AtlasMap
                center={profile.center}
                zoom={cityZoom(profile)}
                bounds={bounds}
                fitPadding={24}
                graticule={false}
                basemap
                // Full-bleed: it takes over from the site's backdrop, which
                // holds the frame until this map has painted (map/backdrop.js).
                coversBackdrop
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
                {selectedCell != null && (
                  <GeoJSONLayer
                    id="atlas-mesh-selected"
                    data={geojson}
                    type="line"
                    paint={selectedPaint}
                    filter={['==', ['id'], selectedCell]}
                    interactive={false}
                  />
                )}
                {citychroneOn && ccView === 'isochrone' && originCc != null && (
                  <GeoJSONLayer
                    id="atlas-iso-origin"
                    data={geojson}
                    type="line"
                    paint={originPaint}
                    filter={['==', ['coalesce', ['get', unified ? 'cc' : 'new_id'], -1], originCc]}
                    interactive={false}
                  />
                )}
              </AtlasMap>
            ) : (
              <div className="aa-city__loading">
                {unified && atlas.status === 'error' ? t('atlas.error') : t('city.computing')}
              </div>
            )}

            {/* ── Top left: the panel switch and the geometry ──── */}
            <div className="aa-mapui aa-mapui--tl aa-fadein">
              <button
                type="button"
                className="aa-mapbtn"
                aria-pressed={!sidebarOpen}
                onClick={() => setSidebarOpen((open) => !open)}
              >
                {sidebarOpen ? '◀' : '▶'} {t(sidebarOpen ? 'atlas.hidePanel' : 'atlas.showPanel')}
              </button>
              {unified && (
                <GeometryToggle
                  compact
                  value={geometryValue}
                  onChange={setGeometry}
                  available={{ geographic: true, cartogram: cartogramPublished }}
                  derived={cartogramDerived}
                  missingName={platform.name}
                  loading={cartogramOn && cartogram.status === 'pending'}
                />
              )}
            </div>

            {/* ── Top right: what the city adds up to, and one cell ── */}
            <div className="aa-mapui aa-mapui--tr aa-fadein aa-fadein--slow">
              <MapBox
                title={t('city.summary.title')}
                open={summaryOpen}
                onToggle={() => setSummaryOpen((open) => !open)}
              >
                <dl className="aa-summary">
                  {/* The cells this layer measures, not the union's total:
                      the count beside a figure has to be the count that
                      figure was computed from. */}
                  <SummaryRow
                    label={t('city.summary.hexagons')}
                    value={layerCells != null ? n(layerCells) : '—'}
                  />
                  {layerArea != null && (
                    <SummaryRow
                      label={t('city.summary.area')}
                      value={`${n(layerArea)} km²`}
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
                      value={fifteenMedian == null ? '—' : formatTime(fifteenMedian)}
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
              </MapBox>

              <MapBox
                title={t('city.selected.title')}
                open={selectedOpen}
                onToggle={() => setSelectedOpen((open) => !open)}
                actions={
                  selectedRows && (
                    <button
                      type="button"
                      className="aa-inspector__clear"
                      onClick={() => setSelectedCell(null)}
                    >
                      {t('city.selected.clear')}
                    </button>
                  )
                }
              >
                <CellInspector
                  bare
                  title={t('city.selected.title')}
                  empty={t('city.selected.empty')}
                  rows={selectedRows}
                >
                  {layer === 'fifteen' &&
                    selectedCell != null &&
                    baseGeojson?.features?.[selectedCell] && (
                      <>
                        <p className="aa-catbars__title">{t('fifteen.barsTitle')}</p>
                        <CategoryBars
                          properties={baseGeojson.features[selectedCell].properties}
                          mode={mode}
                        />
                      </>
                    )}
                </CellInspector>
              </MapBox>
            </div>

            {/* ── Bottom left: how strongly the layer is painted ── */}
            <div className="aa-mapui aa-mapui--bl aa-fadein">
              <MapBox title={t('atlas.controls.opacity')} className="aa-mapbox--opacity">
                <label className="aa-opacity">
                  <input
                    className="aa-opacity__input"
                    type="range"
                    min="0.15"
                    max="1"
                    step="0.05"
                    value={opacity}
                    aria-label={t('atlas.controls.opacity')}
                    onChange={(event) => setOpacity(Number(event.target.value))}
                  />
                  <span className="aa-mono aa-opacity__value">{Math.round(opacity * 100)}%</span>
                </label>
              </MapBox>
            </div>

            <div className="aa-mapui aa-mapui--br aa-fadein">
              <button
                type="button"
                className="aa-mapbtn"
                aria-pressed={fullscreen}
                onClick={() => setFullscreen((on) => !on)}
              >
                {t(fullscreen ? 'atlas.exitFullscreen' : 'atlas.fullscreen')}
              </button>
            </div>

            {citychroneOn && ccView === 'isochrone' && originCc == null && (
              <div className="aa-atlas__prompt">{t('atlas.isochroneEmpty')}</div>
            )}
          </div>
        </section>
      </main>

      {aboutOpen && !isPopulation && (
        <PlatformAbout
          platformId={layer}
          name={platform.name}
          // The key in the dialog is the legend on screen, drawn by the same
          // component, so the two cannot disagree.
          ramp={measure?.ramp}
          tickFormat={tickFormat}
          onClose={() => setAboutOpen(false)}
        />
      )}

      {!fullscreen && (
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
      )}
    </div>
  );
}

/**
 * "Notice a mistake?" — the one place the viewer admits it can be wrong.
 *
 * Closed it is a line of text in the corner of the controls; open it says what
 * kind of wrong is likely (missing or misleading data) and hands over an
 * address. A form would promise a workflow that does not exist behind it.
 */
function MistakeNote() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className={`aa-mistake${open ? ' aa-mistake--open' : ''}`}>
      <button
        type="button"
        className="aa-mistake__toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="info" size={12} color="currentColor" />
        {t('atlas.mistake.title')}
      </button>
      {open && (
        <p className="aa-mistake__body">
          <Interpolate
            template={t('atlas.mistake.body')}
            values={{
              contact: (
                <a className="aa-mistake__link" href={`mailto:${CONTACT.general}`}>
                  {t('atlas.mistake.contact')}
                </a>
              ),
            }}
          />
        </p>
      )}
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

/**
 * Expression that is true where a cell actually carries the measure — used to
 * hide, rather than mis-colour, the cells a layer does not cover. A missing
 * value is not a low one.
 *
 * @param {string}  key      property name, or feature-state key
 * @param {boolean} fromState  read feature-state instead of a property
 */
function present(key, fromState) {
  return fromState
    ? ['!=', ['coalesce', ['feature-state', key], -99999], -99999]
    : ['has', key];
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
