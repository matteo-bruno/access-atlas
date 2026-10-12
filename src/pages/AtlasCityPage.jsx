import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { Icon } from '../components/Icon.jsx';
import { RampLegend } from '../components/RampLegend.jsx';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { DELTA_RAMPS, RAMPS, rampColor } from '../map/ramps.js';
import { cityZoom, meshBounds } from '../map/framing.js';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS, PLATFORMS_BY_ID, ZONES } from '../data/platforms.js';
import { CATEGORIES, MODES, formatTime, measureKey } from '../data/fifteen.js';
import { CITYCHRONE_VIEWS, DEFAULT_HOUR } from '../data/citychrone.js';
import { paperForPlatform } from '../data/research.js';
import { BRAND } from '../data/brand.js';
import { summariseMeasure, weightedMean, withGeometry, zoneSharesOf } from '../data/adapters.js';
import { citychroneHourFromLayer, scenarioKey } from '../data/grid.js';
import { layerScenarios } from '../data/catalogue.js';
import { GeometryToggle } from '../components/GeometryToggle.jsx';
import { Explain } from '../components/Explain.jsx';
import { CellInspector } from '../components/CellInspector.jsx';
import { MapBox } from '../components/MapBox.jsx';
import { CategoryBars } from '../components/CategoryBars.jsx';
import { PlatformAbout } from '../components/PlatformAbout.jsx';
import { RangeFilter } from '../components/RangeFilter.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { CONTACT } from '../data/team.js';
import { formatOsmDate } from '../data/osm.js';
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
const POPULATED = ['!=', ['coalesce', ['get', 'population'], -1], 0];
const isPopulationLayer = (id) => id === 'population';
const NO_CELLS = { type: 'FeatureCollection', features: [] };
// 15minCity's "not reachable": no difference can be taken from it.
const UNREACHABLE = 99999;
const measured = (v) => Number.isFinite(v) && v < UNREACHABLE;

// Every layer the URL may name, and where its values come from.
const ALL_LAYERS = [...LAYER_ORDER, POPULATION_LAYER];

const DEFAULT_OPACITY = 0.8;

// A city is "large" for the loading note from this many cells in any of its
// layers: Rome's widest layer has 11,409 and opens in a moment, Tokyo's metro
// area has 123,555 and takes seconds to draw.
const LARGE_CITY_CELLS = 40000;

// Query parameters that name a row of one city's own grid, so they mean
// nothing on the other boundary's (a CityChrone isochrone origin). `cell` is
// an H3 index and holds on both.
const GRID_BOUND_PARAMS = ['from'];

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
  // The screen is not keyed by the city: stepping between a city's core and
  // its metro area keeps it, and its map, and repaints. While the next city
  // resolves, the last one stays on screen.
  const last = useRef(null);
  if (view.status === 'ready' && view.profile) last.current = { cityId, view };

  if (view.status === 'missing' || (view.status === 'ready' && !view.profile)) return <Navigate to="/" replace />;
  if (!last.current) return <div className="aa-page" />;
  return <AtlasScreen cityId={last.current.cityId} view={last.current.view} />;
}

function AtlasScreen({ cityId, view }) {
  const { t, n, lang } = useI18n();
  const { unified, profile, platformProfiles, available, extents } = view;
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
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
  // Another city on the same screen (a boundary switch): a cell or an
  // isochrone origin is a position on the last city's grid. `?cell=` is an H3
  // index and is selected again on the new grid below.
  const firstCity = useRef(cityId);
  useEffect(() => {
    if (firstCity.current === cityId) return;
    firstCity.current = cityId;
    setSelectedCell(null);
    setHoverCell(null);
    setActiveZone(null);
  }, [cityId]);

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
    const next = new URLSearchParams(params);
    next.set('layer', id);
    // A scenario is a scenario of one layer: kept only where the next layer
    // has one of that name.
    if (!layerScenarios(profile, id).some((s) => s.id === params.get('sc'))) {
      next.delete('sc');
      next.delete('cmp');
    }
    setParams(next, { replace: false });
  };

  // ── Boundary ───────────────────────────────────────────────────────
  // The core and the metro area are two cities in the catalogue, each with
  // its own grid; switching opens the other with the same view, less what
  // only makes sense on this city's grid.
  const extent = profile.extent === 'fua' ? 'fua' : 'core';
  const bothExtents = Boolean(extents?.core && extents?.fua);
  const pickExtent = (key) => {
    const target = extents?.[key];
    if (!target || target === cityId) return;
    const next = new URLSearchParams(params);
    for (const name of GRID_BOUND_PARAMS) next.delete(name);
    const query = next.toString();
    navigate(`/atlas/${target}${query ? `?${query}` : ''}`);
  };

  // ── Scenario ───────────────────────────────────────────────────────
  // Alternative runs of the open layer, on the same cells (`sc=<id>`), shown
  // on their own or as the difference from the current measurement
  // (`cmp=diff`). The difference needs a quantity: P.O.V.'s zones are
  // categories, so it is offered where a delta ramp is defined.
  const scenarios = unified && layer !== POPULATION_LAYER ? layerScenarios(profile, layer) : [];
  const scenario = scenarios.find((s) => s.id === params.get('sc')) ?? null;
  const diffAvailable = Boolean(scenario && DELTA_RAMPS[layer]);
  const diffOn = diffAvailable && params.get('cmp') === 'diff';
  const pickScenario = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set('sc', id);
    else {
      next.delete('sc');
      next.delete('cmp');
    }
    setParams(next, { replace: true });
  };

  // ── Data ───────────────────────────────────────────────────────────
  // The grid loads once; the open layer's file loads the first time it is
  // opened (population is the grid's own and needs none).
  const atlas = useAtlasMesh(cityId, layer === POPULATION_LAYER ? null : layer, unified, scenario?.id ?? null);
  const layerLoaded =
    !unified || layer === POPULATION_LAYER || !profile.layerData?.[layer]
      ? true
      : atlas.layerStatus[layer] === 'ready';
  // Until its file is in, the scenario is not on screen: the baseline stays,
  // and the note says what is loading.
  const scenarioStatus = scenario ? atlas.layerStatus[`${scenario.id}:${layer}`] : null;
  const shown = scenario && scenarioStatus === 'ready' ? scenario : null;
  const diffShown = diffOn && Boolean(shown);
  const scenarioName = shown ? (lang === 'it' ? shown.nameIt ?? shown.name : shown.name) : null;
  // The key a measure is read from on screen: the scenario's where one is
  // shown, the plain one otherwise.
  const keyOf = (name) => (shown ? scenarioKey(shown.id, name) : name);
  const largeCity = Math.max(0, ...Object.values(platformProfiles).map((p) => p.cells ?? 0)) >= LARGE_CITY_CELLS;
  // Legacy path: the active platform's own mesh, swapped on layer change.
  const swapProfile =
    !unified && layer !== 'citychrone' && layer !== POPULATION_LAYER
      ? platformProfiles[layer]
      : null;
  const swapMesh = useCityMesh(swapProfile ?? null, layer);

  const citychroneOn = layer === 'citychrone' && available.has('citychrone');
  // On the per-city layout every hour's scores are in the CityChrone layer
  // file, so the hour selector is a recomputation, not a fetch.
  const ccLayerFile = atlas.data?.files?.citychrone ?? null;
  const ccHour = useCitychroneHour(cityId, hour, citychroneOn && !profile.grid);
  const ccHourData = useMemo(
    () => (ccLayerFile ? citychroneHourFromLayer(ccLayerFile, hour) : ccHour.data),
    [ccLayerFile, hour, ccHour.data],
  );
  const times = useTravelTimes(cityId, hour, citychroneOn && ccView === 'isochrone');

  // ── Geometry ───────────────────────────────────────────────────────
  // Reversed from the platform pages: the union mesh is already the cells
  // where they are, and the cartogram is the companion. Every layer has one,
  // drawn by the Atlas's own rule on the grid's population, so a cell is the
  // same size whichever layer is on screen.
  const cartogramLayer = unified && layer !== POPULATION_LAYER ? layer : null;
  const cartogramPublished = Boolean(
    profile.cartograms?.[cartogramLayer] || profile.layerData?.[cartogramLayer],
  );
  const cartogramDerived = profile.cartogramSources?.[cartogramLayer] === 'derived';
  const cartogramOn = geometry === 'cartogram' && cartogramPublished;
  // The choice is remembered across layers but only honoured where that
  // layer has a cartogram.
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
  // The union mesh is drawable once a grid is in: this city's, or the last
  // city's while this one's loads (a boundary switch keeps the map).
  const meshReady = unified
    ? atlas.data != null
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
    if (!citychroneOn || !ccHourData || !featureIdForCc) return null;
    const states = new Map();
    for (const [cc, scores] of ccHourData.byCc) {
      const id = featureIdForCc(cc);
      if (id == null) continue;
      const state = { v: scores.v, s: scores.s };
      if (matrixRow) state.t = matrixRow[cc];
      states.set(id, state);
    }
    return states;
  }, [citychroneOn, ccHourData, featureIdForCc, matrixRow]);

  // The union mesh's extent, so the frame is the city and not the layer:
  // switching between a platform covering 7,498 cells and one covering 1,636
  // must not move the camera.
  //
  // A cell named in the URL (`?cell=<h3>`, what CityChat's "show on map"
  // links carry) is selected once the mesh has it, and the frame closes in on
  // the ground around it instead. The frame is still the same across layers:
  // the cell is one cell of the union mesh, whichever layer is on screen.
  const focusH3 = params.get('cell');
  const focusId = useMemo(() => {
    if (!focusH3 || !baseGeojson?.features) return null;
    const at = baseGeojson.features.findIndex((f) => f.properties?.h3 === focusH3);
    return at >= 0 ? at : null;
  }, [focusH3, baseGeojson]);
  useEffect(() => {
    if (focusId != null) setSelectedCell(focusId);
  }, [focusId]);
  const bounds = useMemo(() => {
    const cell = focusId != null ? baseGeojson?.features?.[focusId] : null;
    return cell ? aroundCell(cell) : meshBounds(baseGeojson);
  }, [baseGeojson, focusId]);

  // ── What the active layer measures ─────────────────────────────────
  // One description per layer: the value expression to colour by, the ramp
  // that colours it, and how to read a number back out. Everything below —
  // paint, legend, tooltip, summary — is driven from this rather than
  // branching on the layer id in four separate places.
  const fifteenKey = measureKey(category, mode);

  const shownId = shown?.id ?? null;
  const measure = useMemo(() => {
    const key = (name) => (shownId ? scenarioKey(shownId, name) : name);
    // The difference: the scenario's value less the current one, on a cell
    // that carries both, neither of them 15minCity's "not reachable".
    const delta = (name, ramp, format) => ({
      ramp,
      value: ['-', ['get', key(name)], ['get', name]],
      covered: [
        'all',
        ['has', key(name)],
        ['has', name],
        ['<', ['get', key(name)], UNREACHABLE],
        ['<', ['get', name], UNREACHABLE],
      ],
      format,
    });
    if (layer === 'pov') return null; // categorical — handled separately
    if (layer === 'cardep') {
      if (diffShown) return delta('cdi', DELTA_RAMPS.cardep, (v) => signed(v, n, 3));
      return { ramp: RAMPS.cdi, value: ['get', key('cdi')], format: (v) => signed(v, n) };
    }
    if (layer === POPULATION_LAYER) {
      return {
        ramp: RAMPS.population,
        value: ['get', 'population'],
        format: (v) => n(Math.round(v)),
      };
    }
    if (layer === 'fifteen') {
      if (diffShown) {
        return delta(fifteenKey, DELTA_RAMPS.fifteen, (v) => `${v < 0 ? '−' : '+'}${formatTime(Math.abs(v)) ?? '—'}`);
      }
      // A travel time reads as a clock, not as a decimal: 3:59, not 3.99 min.
      return {
        ramp: RAMPS.fifteen,
        value: ['get', key(fifteenKey)],
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
  }, [layer, fifteenKey, ccView, n, t, shownId, diffShown]);

  // The one figure the legend no longer carries: a continuous ramp states the
  // scale, not what the city sits at, so the median is quoted in the summary.
  const fifteenMedian = useMemo(
    () =>
      layer === 'fifteen' && baseGeojson
        ? summariseMeasure(baseGeojson, fifteenKey, RAMPS.fifteen.ticks).median
        : null,
    [layer, baseGeojson, fifteenKey],
  );

  // The figures a shown scenario changes, computed the way the baseline's
  // are (adapters.js), so the summary can set one beside the other.
  const scenarioFigures = useMemo(() => {
    if (!shownId || !baseGeojson) return null;
    const key = (name) => scenarioKey(shownId, name);
    if (layer === 'cardep') return { weightedCdi: weightedMean(baseGeojson, key('cdi')) };
    if (layer === 'fifteen') return { median: summariseMeasure(baseGeojson, key(fifteenKey), RAMPS.fifteen.ticks).median };
    if (layer === 'pov') return { zoneShares: zoneSharesOf(baseGeojson, key('zone')) };
    return null;
  }, [shownId, baseGeojson, layer, fifteenKey]);

  // ── Paint ──────────────────────────────────────────────────────────
  // The index filter reads the index, not a difference of two.
  const rangeOn = layer === 'cardep' && !diffShown && (range[0] > -1 || range[1] < 1);

  // The last city's mesh, kept on screen while this one's grid loads.
  const gridLoading = unified && atlas.status === 'pending';
  const waiting = unified && !isPopulationLayer(layer) && (!layerLoaded || gridLoading);
  const fillPaint = useMemo(() => {
    // While the layer's own file is on its way, the grid is already here:
    // the city's cells are drawn faintly, so the map shows where the colours
    // will land instead of an empty frame.
    if (waiting) {
      return { 'fill-color': '#cfd9da', 'fill-opacity': opacity * 0.4 };
    }
    // P.O.V. is the one genuinely categorical layer: four named classes, not a
    // quantity, so it keeps discrete colours and band isolation.
    if (layer === 'pov') {
      const zone = ['coalesce', ['get', shownId ? scenarioKey(shownId, 'zone') : 'zone'], -1];
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
      measure.covered ??
      (value[0] === 'feature-state' ? present(value[1], true) : present(value[1], false));
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
  }, [layer, activeZone, opacity, measure, citychroneOn, ccView, matrixRow, rangeOn, range, waiting, shownId]);

  // A cell where nobody lives has no one for a measure to describe, so every
  // layer but Population leaves it out. Dropped by the layer filter rather
  // than painted clear, so it cannot be hovered or selected either. The
  // grid's populations are whole numbers; a feature carrying none at all (a
  // legacy mesh) is kept.
  const meshFilter = layer === POPULATION_LAYER ? undefined : POPULATED;

  // One cell of whatever is drawn (the hexagon, or its cartogram polygon).
  // The union mesh's feature ids are their positions; a legacy hexcover
  // promotes `new_id`, so there the cell is looked up by it.
  const oneCell = (id) => {
    if (id == null || !geojson?.features) return NO_CELLS;
    const at = geojson.features[id];
    const feature =
      at && (at.id ?? id) === id
        ? at
        : geojson.features.find((f) => (f.id ?? f.properties?.new_id) === id);
    return feature ? { type: 'FeatureCollection', features: [feature] } : NO_CELLS;
  };
  const hoverOutline = useMemo(() => oneCell(hoverCell), [geojson, hoverCell]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedOutline = useMemo(() => oneCell(selectedCell), [geojson, selectedCell]); // eslint-disable-line react-hooks/exhaustive-deps
  const originId =
    citychroneOn && ccView === 'isochrone' && originCc != null && featureIdForCc ? featureIdForCc(originCc) : null;
  const originOutline = useMemo(() => oneCell(originId), [geojson, originId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  // Nothing to count until the layer's own file is in: a zero here would be
  // a claim, not a placeholder.
  const layerCells = !layerLoaded
    ? null
    : isPopulation
      ? cellCount
      : unified
        ? atlas.data?.layers[layer]?.cells
        : stats?.cellCount;
  // Residents of the cells this layer measures, as the layer counts them: the
  // catalogue row's own sum, the figure its compare row and markers carry.
  // The mesh's own total is the grid's, every layer together, which beside
  // one layer's cell count would describe other cells (Rome's P.O.V.: 8,089
  // cells and 2.6 M residents, not the grid's 2.7 M). Population, which is
  // the grid, keeps the grid's.
  const layerPopulation = !layerLoaded
    ? null
    : isPopulation || !unified
      ? stats?.population ?? null
      : platformProfiles[layer]?.population ?? null;

  // Ground covered by the cells this layer measures. Only the union mesh is
  // drawn in true geography, so only it can be measured — a cartogram's
  // polygons are a population, not a place.
  const layerArea = unified && layerLoaded
    ? isPopulation
      ? atlas.data?.stats.areaKm2
      : atlas.data?.layers[layer]?.areaKm2
    : null;

  const ccForFeature = (feature) =>
    unified ? feature.properties?.cc : feature.properties?.new_id;

  const tooltip = (feature) => {
    const p = feature.properties ?? {};
    // The value on screen: the scenario's where one is shown.
    const at = (name) => p[keyOf(name)];
    if (layer === 'pov') {
      const zone = at('zone');
      if (!Number.isFinite(zone)) return t('atlas.noValue');
      return `${t(`city.zones.${ZONES[zone].key}.name`)} · ${[at('proximity'), at('opportunity')]
        .map((v) => n(v, { maximumFractionDigits: 1 }))
        .join(' · ')}`;
    }
    if (layer === 'cardep') {
      if (diffShown) {
        if (!Number.isFinite(p.cdi) || !Number.isFinite(at('cdi'))) return t('atlas.noValue');
        return `${t('atlas.scenario.change')} ${measure.format(at('cdi') - p.cdi)} · CDI ${signed(p.cdi, n)} → ${signed(at('cdi'), n)}`;
      }
      return Number.isFinite(at('cdi')) ? `CDI ${signed(at('cdi'), n)}` : t('atlas.noValue');
    }
    if (isPopulation) {
      return Number.isFinite(p.population)
        ? t('atlas.population.tooltip', { count: n(Math.round(p.population)) })
        : t('atlas.noValue');
    }
    if (layer === 'fifteen') {
      if (diffShown) {
        const before = p[fifteenKey];
        const after = at(fifteenKey);
        if (!measured(before) || !measured(after)) return t('atlas.noValue');
        return `${t('atlas.scenario.change')} ${measure.format(after - before)} · ${formatTime(before)} → ${formatTime(after)}`;
      }
      const value = at(fifteenKey);
      return value == null ? t('atlas.noValue') : measure.format(value);
    }
    const cc = ccForFeature(feature);
    const scores = cc != null ? ccHourData?.byCc.get(cc) : null;
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
    const base = feature.properties ?? {};
    // What is on screen: the shown scenario's values under the plain names.
    const p = shownProperties(base, shownId);
    const score = (v) => (Number.isFinite(v) ? n(v, { maximumFractionDigits: 1 }) : '—');
    const rows = [];
    // The row the map draws says it is the scenario's, where one is shown.
    const named = (label) => (shownId ? `${label} · ${scenarioName}` : label);
    // With a scenario shown, the current value and the change sit under the
    // one the map draws.
    const versus = (name, format, difference) => {
      if (!shownId) return;
      const before = base[name];
      const after = p[name];
      rows.push({ label: t('atlas.scenario.current'), value: Number.isFinite(before) ? format(before) : '—' });
      rows.push({
        label: t('atlas.scenario.change'),
        value: measured(before) && measured(after) ? difference(after - before) : '—',
      });
    };

    if (layer === 'pov') {
      const zoneName = (z) => (Number.isFinite(z) ? t(`city.zones.${ZONES[z].key}.name`) : '—');
      rows.push({
        label: named(t('city.cell.zone')),
        value: zoneName(p.zone),
        accent: Number.isFinite(p.zone) ? ZONES[p.zone].color : undefined,
      });
      if (shownId) rows.push({ label: t('atlas.scenario.current'), value: zoneName(base.zone) });
      rows.push({ label: t('city.cell.proximity'), value: score(p.proximity) });
      rows.push({ label: t('city.cell.opportunity'), value: score(p.opportunity) });
    } else if (layer === 'cardep') {
      rows.push({ label: named(t('city.cell.cdi')), value: Number.isFinite(p.cdi) ? signed(p.cdi, n) : '—' });
      versus('cdi', (v) => signed(v, n), (v) => signed(v, n, 3));
      rows.push({ label: t('city.cell.byCar'), value: score(p.o_score_car) });
      rows.push({ label: t('city.cell.byTransit'), value: score(p.o_score_pt) });
    } else if (layer === 'fifteen') {
      rows.push({
        label: named(
          `${t(`fifteen.categories.${CATEGORIES.find((c) => c.key === category).i18n}`)} · ${t(
            `fifteen.modes.${MODES.find((m) => m.key === mode).i18n}`,
          )}`,
        ),
        value: p[fifteenKey] == null ? '—' : formatTime(p[fifteenKey]) ?? '—',
      });
      versus(fifteenKey, (v) => formatTime(v) ?? '—', (v) => `${v < 0 ? '−' : '+'}${formatTime(Math.abs(v)) ?? '—'}`);
    } else if (layer === 'citychrone') {
      const scores = Number.isFinite(p.cc) ? ccHourData?.byCc.get(p.cc) : null;
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
  }, [selectedCell, baseGeojson, layer, category, mode, fifteenKey, ccHourData, matrixRow, t, n, shownId, scenarioName]);

  const legendTitle = diffShown
    ? t('atlas.scenario.legendDiff', { scenario: scenarioName })
    : isPopulation
    ? t('atlas.population.legend')
    : layer === 'pov'
      ? t('city.zoneType')
      : layer === 'cardep'
        ? t('platform.cardep.legendUnit')
        : layer === 'fifteen'
          ? t('fifteen.legendValue')
          : t(`atlas.legend.${ccView}`);

  // How to label the legend's tick values, per layer.
  const tickFormat = diffShown
    ? (v) => (v === 0 ? '0' : `${v < 0 ? '−' : '+'}${n(Math.abs(v), { maximumFractionDigits: 1 })}`)
    : isPopulation
    ? (v) => (v >= 1000 ? `${n(v / 1000, { maximumFractionDigits: 1 })}k` : n(v))
    : layer === 'cardep'
      ? (v) => (v === 0 ? '0' : signed(v, n))
      : ccView === 'sociality' && citychroneOn
        ? (v) => (v === 0 ? '0' : `${n(Math.round(v / 1000))}k`)
        : (v) => n(v, { maximumFractionDigits: 1 });

  // How to read the colours of the layer on screen. The three cell-valued
  // platforms explain their own scale; CityChrone's changes with the measure
  // picked, so its per-view hint stands in.
  const legendExplain = diffShown
    ? t(`atlas.scenario.diffAbout.${layer}`)
    : isPopulation
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
                {t('city.region', {
                  // Which boundary this is, wherever the city has two (or
                  // only its metro area is published).
                  region: bothExtents || extent === 'fua' ? `${region} · ${t(`atlas.extent.${extent}`)}` : region,
                  count: layerCells != null ? n(layerCells) : '—',
                })}
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
            {/* ── The boundary: the city's core or its metro area ── */}
            {bothExtents && (
              <>
                <Explain label={t('atlas.extent.label')} body={t('atlas.extent.about')} />
                <div className="aa-toggle" role="group" aria-label={t('atlas.extent.label')}>
                  {['core', 'fua'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`aa-toggle__btn${extent === key ? ' aa-toggle__btn--active' : ''}`}
                      aria-pressed={extent === key}
                      onClick={() => pickExtent(key)}
                    >
                      {t(`atlas.extent.${key}`)}
                    </button>
                  ))}
                </div>
              </>
            )}

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

            {/* ── Scenarios of the open layer ──────────────────── */}
            {scenarios.length > 0 && (
              <>
                <Explain label={t('atlas.scenario.label')} body={t('atlas.scenario.about')} />
                <div className="aa-toggle aa-toggle--wrap" role="group" aria-label={t('atlas.scenario.label')}>
                  {[null, ...scenarios].map((option) => {
                    const active = (scenario?.id ?? null) === (option?.id ?? null);
                    return (
                      <button
                        key={option?.id ?? 'current'}
                        type="button"
                        className={`aa-toggle__btn${active ? ' aa-toggle__btn--active' : ''}`}
                        aria-pressed={active}
                        onClick={() => pickScenario(option?.id ?? null)}
                      >
                        {option
                          ? lang === 'it'
                            ? option.nameIt ?? option.name
                            : option.name
                          : t('atlas.scenario.current')}
                      </button>
                    );
                  })}
                </div>
                {diffAvailable && (
                  <div className="aa-toggle" role="group" aria-label={t('atlas.scenario.label')}>
                    {['scenario', 'diff'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`aa-toggle__btn${(diffOn ? 'diff' : 'scenario') === key ? ' aa-toggle__btn--active' : ''}`}
                        aria-pressed={(diffOn ? 'diff' : 'scenario') === key}
                        onClick={() => setParam('cmp', key === 'diff' ? 'diff' : null)}
                      >
                        {t(`atlas.scenario.view.${key}`)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

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
                  const shares = shown
                    ? scenarioFigures?.zoneShares
                    : unified
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
            ) : waiting ? null : (
              <RampLegend
                ramp={measure.ramp}
                format={tickFormat}
                // Both time ramps keep going past their bar; the tail carries
                // the rest of the scale rather than a sentence about it.
                tailLabel={measure.ramp.beyond ? `${n(measure.ramp.beyond.value)}+` : undefined}
              />
            )}

            {layer === 'cardep' && !diffShown && (
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
          {/* The controls column's own edge, not a control on the map: a
              chevron astride the seam between the two, pointing at what
              closing it would leave. It says which way it moves the column
              and needs no word for it. */}
          <button
            type="button"
            className="aa-city__panelbtn"
            aria-pressed={!sidebarOpen}
            aria-label={t(sidebarOpen ? 'atlas.hidePanel' : 'atlas.showPanel')}
            title={t(sidebarOpen ? 'atlas.hidePanel' : 'atlas.showPanel')}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <Icon name={sidebarOpen ? 'chevronLeft' : 'chevronRight'} size={14} color="currentColor" />
          </button>
          <div className="aa-city__canvas">
            {meshReady && geojson ? (
              <AtlasMap
                center={profile.center}
                zoom={cityZoom(profile)}
                bounds={bounds}
                fitPadding={24}
                // A boundary switch moves the camera to the other extent.
                fitDuration={600}
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
                  // Every cell at every zoom: the default tolerance drops
                  // cells smaller than a pixel, which is all of a metro area.
                  tolerance={0}
                  type="fill"
                  paint={fillPaint}
                  filter={meshFilter}
                  promoteId={!unified && layer === 'citychrone' ? 'new_id' : undefined}
                  featureState={featureState}
                  onHover={(feature) => setHoverCell(feature ? feature.id : null)}
                  onClick={onCellClick}
                  tooltip={tooltip}
                />
                {/* Outlines are a source of one cell each, always mounted. As
                    filters over the whole mesh they made MapLibre re-tile
                    every cell on each move of the pointer, and as copies of
                    the mesh they sent all of it to the worker again: on a
                    metro area of 120,000 cells, seconds of a frozen page. */}
                <GeoJSONLayer
                  id="atlas-mesh-highlight"
                  data={hoverOutline}
                  type="line"
                  paint={highlightPaint}
                  interactive={false}
                />
                <GeoJSONLayer
                  id="atlas-mesh-selected"
                  data={selectedOutline}
                  type="line"
                  paint={selectedPaint}
                  interactive={false}
                />
                <GeoJSONLayer
                  id="atlas-iso-origin"
                  data={originOutline}
                  type="line"
                  paint={originPaint}
                  interactive={false}
                />
              </AtlasMap>
            ) : (
              <div className="aa-city__loading">
                {unified && atlas.status === 'error' ? (
                  t('atlas.error')
                ) : (
                  <span className="aa-atlas__loadingtext">
                    {t('city.computing')}
                    {largeCity && <span className="aa-atlas__loadinghint">{t('atlas.loading.large')}</span>}
                  </span>
                )}
              </div>
            )}

            {/* The grid is drawn; a layer, or a scenario of it, is still on
                its way. Said over the map rather than left as a pale city. */}
            {meshReady && geojson && (gridLoading || waiting || scenarioStatus === 'pending') && (
              <div className="aa-atlas__prompt aa-atlas__prompt--loading" role="status">
                {gridLoading
                  ? t('city.computing')
                  : t('atlas.loading.layer', {
                      name: scenario && !waiting ? (lang === 'it' ? scenario.nameIt ?? scenario.name : scenario.name) : platform.name,
                    })}
                {largeCity && <span className="aa-atlas__loadinghint">{t('atlas.loading.large')}</span>}
              </div>
            )}

            {/* ── Top left: the geometry ───────────────────────── */}
            {unified && (
              <div className="aa-mapui aa-mapui--tl aa-fadein">
                <GeometryToggle
                  compact
                  value={geometryValue}
                  onChange={setGeometry}
                  available={{ geographic: true, cartogram: cartogramPublished }}
                  derived={cartogramDerived}
                  loading={cartogramOn && cartogram.status === 'pending'}
                />
              </div>
            )}

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
                    <>
                      <SummaryRow
                        label={shown ? `${t('city.summary.weightedCdi')} · ${scenarioName}` : t('city.summary.weightedCdi')}
                        value={signedOrDash(
                          shown
                            ? scenarioFigures?.weightedCdi
                            : unified
                              ? atlas.data?.layers.cardep.weightedCdi
                              : stats?.weightedCdi,
                          n,
                        )}
                      />
                      {shown && (
                        <>
                          <SummaryRow
                            label={t('atlas.scenario.current')}
                            value={signedOrDash(atlas.data?.layers.cardep.weightedCdi, n)}
                          />
                          <SummaryRow
                            label={t('atlas.scenario.change')}
                            value={
                              scenarioFigures?.weightedCdi == null || atlas.data?.layers.cardep.weightedCdi == null
                                ? '—'
                                : signed(scenarioFigures.weightedCdi - atlas.data.layers.cardep.weightedCdi, n, 3)
                            }
                          />
                        </>
                      )}
                    </>
                  )}
                  {layer === 'fifteen' && (
                    <>
                      <SummaryRow
                        label={shown ? `${t('fifteen.summary.median')} · ${scenarioName}` : t('fifteen.summary.median')}
                        value={
                          (shown ? scenarioFigures?.median : fifteenMedian) == null
                            ? '—'
                            : formatTime(shown ? scenarioFigures.median : fifteenMedian)
                        }
                      />
                      {shown && (
                        <SummaryRow
                          label={t('atlas.scenario.current')}
                          value={fifteenMedian == null ? '—' : formatTime(fifteenMedian)}
                        />
                      )}
                    </>
                  )}
                  {layer === 'citychrone' && ccView !== 'isochrone' && (
                    <SummaryRow
                      label={t('atlas.summary.weightedV')}
                      value={
                        ccHourData?.weightedMedianV == null
                          ? '—'
                          : `${n(ccHourData.weightedMedianV, { maximumFractionDigits: 1 })} km/h`
                      }
                    />
                  )}
                  <SummaryRow
                    label={t('city.summary.population')}
                    value={
                      layerPopulation == null
                        ? '—'
                        : `${n(layerPopulation / 1e6, {
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
                          properties={shownProperties(baseGeojson.features[selectedCell].properties, shownId)}
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
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className={`aa-mistake${open ? ' aa-mistake--open' : ''}`}>
      {/* How old the street and point-of-interest data under every layer is:
          the first thing to check when a cell looks out of date. */}
      <p className="aa-osmnote">{t('atlas.osmUpdate', { date: formatOsmDate(lang) })}</p>
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
 * A cell's properties as a scenario has them: its `<scenario>:<name>` values
 * under the plain names, everything else as it is. The baseline when no
 * scenario is shown.
 */
function shownProperties(properties, scenarioId) {
  if (!scenarioId) return properties;
  const prefix = `${scenarioId}:`;
  const out = { ...properties };
  for (const [key, value] of Object.entries(properties)) {
    if (key.startsWith(prefix)) out[key.slice(prefix.length)] = value;
  }
  return out;
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

function signed(value, n, digits = 2) {
  // A difference of two published values carries their floating-point noise:
  // rounded first, so −0.0000001 reads as 0 and not as "−0.000".
  const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
  const text = n(Math.abs(rounded), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (rounded === 0) return text;
  return rounded < 0 ? `−${text}` : `+${text}`;
}

function signedOrDash(value, n) {
  return value == null ? '—' : signed(value, n);
}

function formatCoord(value, axes) {
  const hemisphere = value >= 0 ? axes[0] : axes[1];
  return `${Math.abs(value).toFixed(3)}°${hemisphere}`;
}

// The ground about a kilometre and a half either side of one cell: enough of
// the city around it to see where it is.
const FOCUS_PAD_DEG = 0.014;
function aroundCell(feature) {
  const ring = feature.geometry?.coordinates?.[0] ?? [];
  if (!ring.length) return null;
  const lons = ring.map(([x]) => x);
  const lats = ring.map(([, y]) => y);
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const padLon = FOCUS_PAD_DEG / Math.cos((lat * Math.PI) / 180);
  return [
    [Math.min(...lons) - padLon, Math.min(...lats) - FOCUS_PAD_DEG],
    [Math.max(...lons) + padLon, Math.max(...lats) + FOCUS_PAD_DEG],
  ];
}
