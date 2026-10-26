import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { CitySearch } from '../components/CitySearch.jsx';
import { WorldMap } from '../map/WorldMap.jsx';
import { coverageFraming } from '../map/framing.js';
import { MARKER_RAMPS, cityMarkerStyle, coverageMarkerStyle, pickerDot, scaleDot } from '../map/layers.js';
import { useI18n } from '../i18n/index.jsx';
import { platformBySlug, PLATFORMS, COVERAGE_SCALE } from '../data/platforms.js';
import {
  useAllCoverage,
  useAtlasCities,
  useAtlasCityIds,
  useCityCoverage,
  usePlatformHasSummary,
  useCityPageIds,
} from '../data/useAtlasData.js';
import { rampGradient } from '../map/ramps.js';
import { paperForPlatform } from '../data/research.js';
import { formatTime } from '../data/fifteen.js';
import { Tour } from '../components/Tour.jsx';
// The floating-box chrome these pages share with the city view.
import '../components/MapBox.css';
import './PlatformLanding.css';
import { useActiveInView } from '../hooks/useActiveInView.js';

// How long a layer's markers and boxes take to fade off before the next
// layer's fade on; the markers' own fade in WorldMap is the same length.
const LAYER_FADE_MS = 200;

// Every city of a layer side by side, on the Stats page. All populations
// (`pop=0`): the page's default floor of a million residents is a choice for
// its ranking, not for a layer's own comparison.
const STATS_FOCUS = {
  fifteen: '/stats?view=focus&pop=0',
  citychrone: '/stats?view=focus&pop=0&m=citychrone.velocity.08',
};

// Layers whose welcome card has copy of its own, shorter than the `intro` the
// "about this layer" dialog reads; the others introduce themselves with it.
const WELCOME_INTRO = new Set(['fifteen']);

/**
 * The world map. Without a slug it shows every published city across the four
 * platforms; with one it shows that platform's cities, its scale and its
 * legend. The selector switches between them by navigating, so which map you
 * are looking at is in the URL rather than in component state.
 */
export default function PlatformLanding() {
  const { slug } = useParams();
  // `/platforms` opens on the first layer — 15-minute city, the measure that
  // needs the least explaining and covers the most cities — and the merged
  // map has its own address at `/platforms/all`. An unknown slug lands there
  // too rather than on a 404: the route is still a request for the world map.
  const platform = slug === undefined ? PLATFORMS[0] : platformBySlug(slug);

  // Not keyed by the layer: switching layer keeps the same world map, which
  // empties and fills with the new layer's cities (FadingRoutes counts every
  // layer as one screen, see screenOf in App.jsx).
  return (
    <div className="aa-page aa-page--fixed">
      <main className="aa-main aa-stagewrap" id="main">
        <PlatformExplorer platform={platform} />
      </main>
    </div>
  );
}

/**
 * The world map and everything on it — the screen the platform tab *is*, and
 * the one the landing becomes when you step onto it.
 *
 * It is a component rather than a page so those two can be the same screen
 * rather than two that resemble each other. The landing mounts it from the
 * first frame with `chrome` off: the map is then already there, behind the
 * words, and entering only reveals the controls. Nothing remounts, which is
 * the whole reason that transition is smooth.
 *
 * @param {object|null} props.platform   one platform's map, or all of them
 * @param {boolean} [props.chrome]       show the controls
 * @param {boolean} [props.interactive]  let the map take the pointer
 * @param {React.ReactNode} [props.children]  drawn over the map
 */
export function PlatformExplorer({ platform: requested, chrome = true, interactive = true, children }) {
  const { t, n } = useI18n();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  // Closed on a phone: there the card would cover a third of the map, and the
  // map is what the screen is for. The layer's own words are a tap away in
  // its city view ("About this layer").
  const [welcomeOpen, setWelcomeOpen] = useState(
    () => !(typeof window !== 'undefined' && window.matchMedia?.('(max-width: 860px)').matches),
  );

  // A layer switch is a cross-fade inside the screen: the open layer's
  // markers and boxes fade off, the screen swaps to the requested layer, and
  // its markers and boxes fade on. `platform` is the layer on screen, which
  // trails the one in the URL for the length of the fade out.
  const [platform, setPlatform] = useState(requested);
  const pickerRef = useActiveInView(requested?.id ?? 'all');
  const leaving = requested !== platform;
  const switched = useRef(false);
  if (leaving) switched.current = true;
  useEffect(() => {
    if (!leaving) return undefined;
    const timer = window.setTimeout(() => setPlatform(requested), LAYER_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, requested]);

  // Both hooks run unconditionally — hooks cannot be called behind a branch —
  // and the unused one is cheap: its fetch is cached by URL either way.
  const all = useAllCoverage();
  const single = useCityCoverage(platform ?? PLATFORMS[0]);
  const hasSummary = usePlatformHasSummary(platform?.id);
  // Where "compare cities" goes: the layer's own comparison table where it
  // publishes one (P.O.V., Car Dependency), otherwise the Stats page's focus
  // on that layer, which compares its cities from the statistics file.
  const compareTo = !platform
    ? null
    : hasSummary
      ? `/platforms/${platform.slug}/compare`
      : STATS_FOCUS[platform.id] ?? null;
  // The merged map shows the cities with at least `min` of the four layers,
  // all four unless the reader asks for fewer. In the URL, like the layer.
  const [params, setParams] = useSearchParams();
  const minLayers = platform ? 1 : minLayersFrom(params);
  // How many cities each choice would show: with at least that many layers.
  const layerCounts = useMemo(
    () => PLATFORMS.map((_, i) => all.cities.filter((city) => (city.platformCount ?? 1) > i).length),
    [all.cities],
  );
  const shownAll = useMemo(
    () => (minLayers > 1 ? all.cities.filter((city) => (city.platformCount ?? 1) >= minLayers) : all.cities),
    [all.cities, minLayers],
  );
  const setMinLayers = (count) => {
    const next = new URLSearchParams(params);
    if (count === PLATFORMS.length) next.delete('min');
    else next.set('min', String(count));
    setParams(next, { replace: true });
  };
  const cities = platform ? single.cities : shownAll;
  // Off while fading out, and after a switch until the new layer's cities are
  // in, so they fade on rather than pop. Not on the screen's first paint: the
  // backdrop hands over to this map with the same dots in the same place.
  const markersHidden = leaving || (switched.current && !!platform && single.source === 'pending');
  // Always the merged coverage, never the open tab's — see the WorldMap props.
  const worldFrame = useMemo(() => coverageFraming(all.cities), [all.cities]);
  const markerStyle = useMemo(
    () => (platform ? cityMarkerStyle(platform) : coverageMarkerStyle(COVERAGE_SCALE)),
    [platform],
  );

  const cityPageIds = useCityPageIds(platform?.id);
  const atlasCityIds = useAtlasCityIds();
  const atlasCities = useAtlasCities();
  const [searched, setSearched] = useState(null);
  // Raised by the "?" button to show the tour again.
  const [tourReplay, setTourReplay] = useState(0);

  // What the search looks through: every published city, not the open
  // tab's, with the catalogue's names in both languages, its region and its
  // boundary. The coverage files carry only an English name and a country
  // code, and a metro area has no marker where its core has one, so neither
  // "Milano" nor Tokyo's metro area could be found.
  const searchable = useMemo(() => {
    const meta = new Map(atlasCities.map((city) => [city.id, city]));
    const describe = (city, entry) => ({
      ...city,
      nameIt: entry?.nameIt,
      region: entry?.region,
      regionIt: entry?.regionIt,
      extent: entry?.extent,
      population: entry?.population ?? city.population,
      layers: entry?.layers,
    });
    const list = all.cities.map((city) => describe(city, meta.get(city.id)));
    const listed = new Set(list.map((city) => city.id));
    for (const entry of atlasCities) {
      if (listed.has(entry.id) || entry.extent !== 'fua' || !listed.has(entry.core)) continue;
      const [lon, lat] = entry.center ?? [];
      list.push(describe({ id: entry.id, name: entry.name, country: entry.country, lon, lat }, entry));
    }
    return list;
  }, [all.cities, atlasCities]);
  const layersOf = useMemo(
    () => new Map(searchable.map((city) => [city.id, city.layers])),
    [searchable],
  );
  const paper = platform ? paperForPlatform(platform.id) : null;
  const copyKey = platform ? `platform.${platform.id}` : 'platform.all';
  const legend = t(`${copyKey}.legend`);



  const openCity = (city) => {
    // One city view, whichever map you came from: the combined viewer, opened
    // on this platform's layer. It draws a harmonised city from one union
    // mesh and a legacy one by swapping per-platform meshes, so it works for
    // every published city — there is nothing left for a per-platform page to
    // do that this does not.
    //
    // The search finds cities the open layer does not cover, and those open
    // on a layer they have rather than on one they would draw nothing for.
    if (atlasCityIds.has(city.id) || cityPageIds.has(city.id)) {
      const layers = layersOf.get(city.id);
      const onLayer = platform && (!layers || layers.includes(platform.id));
      navigate(onLayer ? `/atlas/${city.id}?layer=${platform.id}` : `/atlas/${city.id}`);
      return;
    }
    // Nothing to open (a seed city on a fresh checkout): show where it is.
    mapRef.current?.flyTo({ center: [city.lon, city.lat], zoom: 5 });
  };

  const tooltip = (city) =>
    platform ? formatTooltip(platform, city, t, n) : coverageTooltip(city, t, n);

  const title = platform ? platform.name : t('platform.all.name');
  const label = platform
    ? `§ ${platform.tag} · ${t(`platform.${platform.id}.label`)}`
    : t('platform.all.label');

  return (
    <div className="aa-mapstage">
      {/* The map first, and always: it is what the landing holds behind its
          words, and what this screen is built around. */}
      <WorldMap
        ref={mapRef}
        // The same framing as the backdrop behind every other page: one world,
        // however you arrived at it (see coverageFraming). Which is also why
        // this map takes the backdrop's place rather than the route doing it:
        // the backdrop stays until this one has painted the same world in the
        // same box, so arriving here changes the chrome, not the world.
        //
        // Derived from `all.cities`, never from the open tab's `cities`: the
        // world must not move when the reader switches platform, and a tab
        // showing one city would otherwise frame itself to that city.
        frame={worldFrame}
        cities={cities}
        markerStyle={markerStyle}
        coversBackdrop
        interactive={interactive}
        tooltip={interactive ? tooltip : undefined}
        onSelect={interactive ? openCity : undefined}
        highlight={searched ? (searched.core ?? searched.id) : null}
        markersHidden={markersHidden}
        label={title}
      />

      {chrome && (
        <>
        {/* What the bar above the map used to carry, on the map itself: a way
            to find a city. The rest of what it held — the platform's name and
            its city count — the picker and the welcome card already say, and
            the repository link that sat here went with it: this screen is for
            reading the map, and the code is linked from the footer. */}
        <div className="aa-mapstage__tools aa-fadein">
          <CitySearch
            cities={searchable}
            onOpen={openCity}
            onActive={setSearched}
            inputRef={searchRef}
          />
        </div>

        {/* Which set of cities the map draws — the four platforms, or all of
            them at once. Navigating rather than setting state keeps the
            choice in the URL. */}
        <nav
          ref={pickerRef}
          className="aa-card aa-picker aa-picker--float aa-fadein"
          aria-label={t('platform.all.pick')}
        >
          {PLATFORMS.map((option) => (
            <Link
              key={option.id}
              className={`aa-picker__item${
                requested?.id === option.id ? ' aa-picker__item--active' : ''
              }`}
              to={`/platforms/${option.slug}`}
            >
              <span
                className="aa-picker__dot"
                style={{ backgroundImage: pickerDot(option) }}
              />
              {option.name}
            </Link>
          ))}
          {/* Last, because it is the whole rather than another layer. Its
              dot is the coverage scale, which is what that map colours by. */}
          <Link
            className={`aa-picker__item${requested ? '' : ' aa-picker__item--active'}`}
            to="/platforms/all"
          >
            <span className="aa-picker__dot" style={{ backgroundImage: scaleDot(COVERAGE_SCALE) }} />
            {t('platform.all.name')}
          </Link>
        </nav>

        {/* What belongs to the layer on screen, as one group so a switch can
            fade it off and on together. The picker and the search above are
            the screen's own, and stay. */}
        <div className={`aa-mapstage__layer${leaving ? ' aa-mapstage__layer--leaving' : ''}`}>
        {welcomeOpen && (
          <section className="aa-card aa-welcome aa-fadein aa-fadein--slow">
            <div className="aa-welcome__head">
              <Eyebrow>
                {platform ? t('platform.welcome', { name: title }) : t('platform.all.welcome')}
              </Eyebrow>
              <button
                type="button"
                className="aa-welcome__close"
                aria-label={t('platform.dismiss')}
                onClick={() => setWelcomeOpen(false)}
              >
                <Icon name="close" size={13} color="var(--ink-3)" />
              </button>
            </div>
            <p className="aa-welcome__body">
              {t(`${copyKey}.${WELCOME_INTRO.has(platform?.id) ? 'welcomeIntro' : 'intro'}`)}
            </p>
          </section>
        )}

        {/* The two ways onward, each in a bottom corner of the map rather than
            inside the welcome card, so they outlive its dismissal. */}
        {compareTo && (
          <Link
            className="aa-mapstage__action aa-mapstage__action--start aa-fadein"
            to={compareTo}
            style={{ background: platform.accent }}
          >
            {t('compare.label')}
            <Icon name="arrow" size={13} color="#FBFAF4" />
          </Link>
        )}
        {paper && (
          <a
            className="aa-card aa-mapstage__action aa-mapstage__action--end aa-fadein"
            href={paper.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {t('platform.learnMore')}
          </a>
        )}

        {/* The merged map's legend is also its filter: each row is a number
            of layers, and picking one shows the cities with at least that
            many. Its swatches are the coverage scale, as before. */}
        {!platform ? (
          <fieldset className="aa-card aa-legend aa-legend--filter aa-fadein aa-fadein--slow">
            <legend className="aa-legend__title">
              <Eyebrow>{t('platform.all.filter')}</Eyebrow>
            </legend>
            <div className="aa-legend__items">
              {PLATFORMS.map((_, i) => PLATFORMS.length - i).map((count) => (
                <label
                  key={count}
                  className={`aa-legend__item aa-legend__option${
                    count >= minLayers ? ' aa-legend__option--on' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="aa-min-layers"
                    value={count}
                    checked={minLayers === count}
                    onChange={() => setMinLayers(count)}
                  />
                  <span className="aa-swatch" style={{ background: COVERAGE_SCALE[count - 1] }} />
                  <span>{t('platform.all.filterOptions')[count - 1]}</span>
                  <span className="aa-legend__count aa-mono">
                    {all.source === 'published' ? n(layerCounts[count - 1]) : ''}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : platform?.id === 'pov' ? null : (
        // P.O.V.'s map says where its cities are and nothing more: its zones
        // compare places within a city, and a city has no zone of its own.
        <section className="aa-card aa-legend aa-fadein aa-fadein--slow" aria-label={t(`${copyKey}.legendUnit`)}>
          <Eyebrow>{t(`${copyKey}.legendUnit`)}</Eyebrow>
          {platform && MARKER_RAMPS[platform.id] ? (
            // The city view's own ramp, with words rather than numbers under
            // it: a dot is the colour its median resident's cell would be.
            <div className="aa-legend__ramp">
              <span
                className="aa-legend__bar"
                style={{ backgroundImage: rampGradient(MARKER_RAMPS[platform.id]) }}
              />
              <span className="aa-legend__ends">
                {legend.map((entry) => (
                  <span key={entry}>{entry}</span>
                ))}
              </span>
            </div>
          ) : (
            <div className="aa-legend__items">
              {legend.map((entry, index) => (
                <div key={entry} className="aa-legend__item">
                  <span
                    className="aa-swatch"
                    style={{ background: (platform ? platform.scale : COVERAGE_SCALE)[index] }}
                  />
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        </div>

        {/* The first visit explains the screen in two steps, once. */}
        <Tour
          marks={['atlas-v2']}
          ready={interactive && cities.length > 0 && !markersHidden}
          replay={tourReplay}
          steps={[
            {
              title: t('tour.atlas.layers.title'),
              body: <p>{t('tour.atlas.layers.body')}</p>,
              targets: [{ selector: '.aa-mapstage .aa-picker' }],
              anchor: '.aa-mapstage .aa-picker',
            },
            {
              title: t('tour.atlas.cities.title'),
              body: <p>{t('tour.atlas.cities.body')}</p>,
              targets: [{ selector: '.aa-mapstage__tools .aa-search', tag: t('tour.atlas.cities.tag'), tagAt: 'below' }],
              within: '.aa-mapstage',
            },
          ]}
        />

        <button
          type="button"
          className="aa-tourbtn aa-fadein"
          aria-label={t('tour.replay')}
          title={t('tour.replay')}
          onClick={() => setTourReplay((n) => n + 1)}
        >
          <Icon name="help" size={16} color="var(--ink-2)" />
        </button>

        <div className="aa-zoom aa-fadein">
          <button type="button" aria-label={t('platform.zoomIn')} onClick={() => mapRef.current?.zoomIn()}>
            <Icon name="plus" size={14} color="var(--ink-2)" />
          </button>
          <button
            type="button"
            aria-label={t('platform.zoomOut')}
            onClick={() => mapRef.current?.zoomOut()}
          >
            <Icon name="minus" size={14} color="var(--ink-2)" />
          </button>
        </div>

        <div className="aa-mapstage__attribution aa-mono aa-fadein">{t('platform.attribution')}</div>
        </>
      )}

      {children}
    </div>
  );
}

/** `?min=` on the merged map: 1 to 4 layers, all four when absent or invalid. */
function minLayersFrom(params) {
  const value = Number(params.get('min'));
  return Number.isInteger(value) && value >= 1 && value <= PLATFORMS.length ? value : PLATFORMS.length;
}

// On the all-platforms map the readable fact is which lenses a city has, not
// any one platform's measure — those are on different scales and mean
// different things.
function coverageTooltip(properties, t, n) {
  const count = properties.platformCount ?? 0;
  return `${properties.name} · ${t('platform.all.covered', { count: n(count) })}`;
}

// A city's figure on a layer's map is its median resident's, said as such:
// 15minCity's time as a clock (m:ss, see formatTime), CityChrone's speed in
// km/h by public transport, Car Dependency's index. P.O.V. names the city.
function formatTooltip(platform, properties, t, n) {
  const name = properties.name;
  const value = {
    fifteen: properties.proximityMinutes,
    citychrone: properties.velocityScore,
    cardep: properties.cdi,
  }[platform.id];
  if (platform.id === 'pov') return name;
  if (!Number.isFinite(value)) return name;
  switch (platform.id) {
    case 'fifteen':
      return t('platform.fifteen.tooltip', { name, time: formatTime(value) });
    case 'citychrone':
      return t('platform.citychrone.tooltip', { name, value: n(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
    case 'cardep':
      return t('platform.cardep.tooltip', { name, value: n(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
    default:
      return name;
  }
}
