import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { CitySearch } from '../components/CitySearch.jsx';
import { AtlasMap } from '../map/AtlasMap.jsx';
import { coverageFraming } from '../map/framing.js';
import { CityLayer, CoverageLayer } from '../components/CityLayer.jsx';
import { useI18n } from '../i18n/index.jsx';
import { platformBySlug, PLATFORMS, COVERAGE_SCALE } from '../data/platforms.js';
import {
  useAllCoverage,
  useAtlasCityIds,
  useCityCoverage,
  usePlatformHasSummary,
  useCityPageIds,
} from '../data/useAtlasData.js';
import { paperForPlatform } from '../data/research.js';
// The floating-box chrome these pages share with the city view.
import '../components/MapBox.css';
import './PlatformLanding.css';

/**
 * A picker dot is a miniature of the scale the map behind it draws with.
 *
 * Solid accents could not do this job: two of the four layers are navy and
 * two are terracotta, so half the list was two pairs of identical dots. A
 * scale is the one thing that is different for every layer *and* already on
 * screen a moment later, which makes the dot a preview rather than a label
 * needing to be learned. Continuous scales run as a gradient; P.O.V.'s four
 * zones are categorical and get hard quarters, because a zone is a class and
 * not a point on a ramp.
 *
 * @param {string[]} colors  the scale, in order
 * @param {boolean} [hard]   draw discrete wedges rather than a blend
 */
function scaleDot(colors, { hard = false } = {}) {
  if (!hard) return `linear-gradient(135deg, ${colors.join(', ')})`;
  const step = 100 / colors.length;
  return `conic-gradient(from -45deg, ${colors
    .map((color, i) => `${color} ${i * step}% ${(i + 1) * step}%`)
    .join(', ')})`;
}

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

  // Remount cleanly when switching platforms so the map rebuilds its layers.
  return (
    <div className="aa-page aa-page--fixed">
      <main className="aa-main aa-stagewrap" id="main">
        <PlatformExplorer key={platform?.id ?? 'all'} platform={platform} />
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
export function PlatformExplorer({ platform, chrome = true, interactive = true, children }) {
  const { t, n } = useI18n();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  // Both hooks run unconditionally — hooks cannot be called behind a branch —
  // and the unused one is cheap: its fetch is cached by URL either way.
  const all = useAllCoverage();
  const single = useCityCoverage(platform ?? PLATFORMS[0]);
  const hasSummary = usePlatformHasSummary(platform?.id);
  const cities = platform ? single.cities : all.cities;
  // Always the merged coverage, never the open tab's — see the AtlasMap props.
  const worldFrame = coverageFraming(all.cities);

  const cityPageIds = useCityPageIds(platform?.id);
  const atlasCityIds = useAtlasCityIds();
  const paper = platform ? paperForPlatform(platform.id) : null;
  const copyKey = platform ? `platform.${platform.id}` : 'platform.all';
  const legend = t(`${copyKey}.legend`);



  const openCity = (city) => {
    // One city view, whichever map you came from: the combined viewer, opened
    // on this platform's layer. It draws a harmonised city from one union
    // mesh and a legacy one by swapping per-platform meshes, so it works for
    // every published city — there is nothing left for a per-platform page to
    // do that this does not.
    if (atlasCityIds.has(city.id) || cityPageIds.has(city.id)) {
      navigate(platform ? `/atlas/${city.id}?layer=${platform.id}` : `/atlas/${city.id}`);
      return;
    }
    mapRef.current?.flyTo({ center: [city.lon, city.lat], zoom: 6, duration: 900 });
  };

  const tooltip = (feature) =>
    platform
      ? formatTooltip(platform, feature.properties, n)
      : coverageTooltip(feature.properties, t, n);

  const title = platform ? platform.name : t('platform.all.name');
  const label = platform
    ? `§ ${platform.tag} · ${t(`platform.${platform.id}.label`)}`
    : t('platform.all.label');

  return (
    <div className="aa-mapstage">
      {/* The map first, and always: it is what the landing holds behind its
          words, and what this screen is built around. */}
      <AtlasMap
        ref={mapRef}
        fitWorldWidth
        // The same framing as the backdrop behind every other page: one world,
        // however you arrived at it (see coverageFraming). Which is also why
        // this map takes the backdrop's place rather than the route doing it:
        // the backdrop stays until this one has painted the same world in the
        // same box, so arriving here changes the chrome, not the world.
        //
        // Derived from `all.cities`, never from the open tab's `cities`: the
        // world must not move when the reader switches platform, and a tab
        // showing one city would otherwise frame itself to that city.
        worldZoomBoost={worldFrame.zoomBoost}
        center={worldFrame.center}
        coversBackdrop
        interactive={interactive}
        label={title}
      >
        {platform ? (
          <CityLayer
            platform={platform}
            cities={cities}
            interactive={interactive}
            tooltip={interactive ? tooltip : undefined}
            onSelect={
              interactive ? (properties) => openCity({ ...properties, id: properties.id }) : undefined
            }
          />
        ) : (
          <CoverageLayer
            cities={cities}
            interactive={interactive}
            tooltip={interactive ? tooltip : undefined}
            onSelect={
              interactive ? (properties) => openCity({ ...properties, id: properties.id }) : undefined
            }
          />
        )}
      </AtlasMap>

      {chrome && (
        <>
        {/* What the bar above the map used to carry, on the map itself: a way
            to find a city. The rest of what it held — the platform's name and
            its city count — the picker and the welcome card already say, and
            the repository link that sat here went with it: this screen is for
            reading the map, and the code is linked from the footer. */}
        <div className="aa-mapui aa-mapui--tr aa-mapstage__tools aa-fadein">
          <CitySearch cities={cities} onOpen={openCity} inputRef={searchRef} />
        </div>

        {/* Which set of cities the map draws — the four platforms, or all of
            them at once. Navigating rather than setting state keeps the
            choice in the URL. */}
        <nav className="aa-card aa-picker aa-fadein" aria-label={t('platform.all.pick')}>
          {PLATFORMS.map((option) => (
            <Link
              key={option.id}
              className={`aa-picker__item${
                platform?.id === option.id ? ' aa-picker__item--active' : ''
              }`}
              to={`/platforms/${option.slug}`}
            >
              <span
                className="aa-picker__dot"
                style={{ backgroundImage: scaleDot(option.scale, { hard: !option.stops }) }}
              />
              {option.name}
            </Link>
          ))}
          {/* Last, because it is the whole rather than another layer. Its
              dot is the coverage scale, which is what that map colours by. */}
          <Link
            className={`aa-picker__item${platform ? '' : ' aa-picker__item--active'}`}
            to="/platforms/all"
          >
            <span className="aa-picker__dot" style={{ backgroundImage: scaleDot(COVERAGE_SCALE) }} />
            {t('platform.all.name')}
          </Link>
        </nav>

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
            <p className="aa-welcome__body">{t(`${copyKey}.intro`)}</p>
            <div className="aa-welcome__actions">
              <button
                type="button"
                className="aa-welcome__cta"
                style={{
                  background: platform ? platform.accent : COVERAGE_SCALE[COVERAGE_SCALE.length - 1],
                }}
                onClick={() => searchRef.current?.focus()}
              >
                {t('platform.ctaMap')}
                <Icon name="arrow" size={13} color="#FBFAF4" />
              </button>
              {platform && hasSummary && (
                <Link className="aa-welcome__more" to={`/platforms/${platform.slug}/compare`}>
                  {t('compare.label')}
                </Link>
              )}
              {paper && (
                <a
                  className="aa-welcome__more"
                  href={paper.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {t('platform.learnMore')}
                </a>
              )}
            </div>
          </section>
        )}

        <section className="aa-card aa-legend aa-fadein aa-fadein--slow" aria-label={t(`${copyKey}.legendUnit`)}>
          <Eyebrow>{t(`${copyKey}.legendUnit`)}</Eyebrow>
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
        </section>

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

// On the all-platforms map the readable fact is which lenses a city has, not
// any one platform's measure — those are on different scales and mean
// different things.
function coverageTooltip(properties, t, n) {
  const count = properties.platformCount ?? 0;
  return `${properties.name} · ${t('platform.all.covered', { count: n(count) })}`;
}

function formatTooltip(platform, properties, n) {
  const name = properties.name;
  switch (platform.id) {
    case 'fifteen':
      return `${name} · ${n(properties.proximityMinutes, { minimumFractionDigits: 1 })} min`;
    case 'citychrone':
      return `${name} · ${n(properties.velocityScore, { minimumFractionDigits: 2 })}`;
    case 'cardep':
      return `${name} · CDI ${n(properties.cdi, { minimumFractionDigits: 2 })}`;
    default:
      return name;
  }
}
