import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { Icon } from '../components/Icon.jsx';
import { AtlasMap } from '../map/AtlasMap.jsx';
import { CityLayer, CoverageLayer } from '../components/CityLayer.jsx';
import { useI18n } from '../i18n/index.jsx';
import { platformBySlug, PLATFORMS, COVERAGE_SCALE } from '../data/platforms.js';
import {
  useAllCoverage,
  useAtlasCityIds,
  useCityCoverage,
  useCityPageIds,
} from '../data/useAtlasData.js';
import { paperForPlatform } from '../data/research.js';
import './PlatformLanding.css';

const GITHUB_URL = 'https://github.com/matteo-bruno/access-atlas';

/**
 * The world map. Without a slug it shows every published city across the four
 * platforms; with one it shows that platform's cities, its scale and its
 * legend. The selector switches between them by navigating, so which map you
 * are looking at is in the URL rather than in component state.
 */
export default function PlatformLanding() {
  const { slug } = useParams();
  const platform = slug ? platformBySlug(slug) : null;

  // An unknown slug falls back to the all-platforms map rather than a 404:
  // the route is still a request for the world map.
  // Remount cleanly when switching platforms so the map rebuilds its layers.
  return <PlatformScreen key={platform?.id ?? 'all'} platform={platform} />;
}

function PlatformScreen({ platform }) {
  const { t, n } = useI18n();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [query, setQuery] = useState('');

  // Both hooks run unconditionally — hooks cannot be called behind a branch —
  // and the unused one is cheap: its fetch is cached by URL either way.
  const all = useAllCoverage();
  const single = useCityCoverage(platform ?? PLATFORMS[0]);
  const cities = platform ? single.cities : all.cities;

  const cityPageIds = useCityPageIds(platform?.id);
  const atlasCityIds = useAtlasCityIds();
  const paper = platform ? paperForPlatform(platform.id) : null;
  const copyKey = platform ? `platform.${platform.id}` : 'platform.all';
  const legend = t(`${copyKey}.legend`);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((city) => city.name.toLowerCase().includes(q)).slice(0, 6);
  }, [cities, query]);

  // ⌘K / Ctrl-K focuses the city search, as the design's hint promises.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openCity = (city) => {
    // On the all-platforms map the combined viewer is the natural destination
    // — it is the view that shows every lens this city has.
    if (!platform) {
      if (atlasCityIds.has(city.id)) {
        navigate(`/atlas/${city.id}`);
        return;
      }
      const covering = PLATFORMS.find(
        (p) => p.hasCityPages && (city.platforms ?? []).includes(p.id),
      );
      if (covering) {
        navigate(`/platforms/${covering.slug}/${city.id}`);
        return;
      }
    } else {
      if (platform.hasCityPages && cityPageIds.has(city.id)) {
        navigate(`/platforms/${platform.slug}/${city.id}`);
        return;
      }
      // A platform without its own city pages (CityChrone) opens the combined
      // viewer on its layer when the city is in the atlas.
      if (atlasCityIds.has(city.id)) {
        navigate(`/atlas/${city.id}?layer=${platform.id}`);
        return;
      }
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
    <div className="aa-page aa-page--fixed">
      <Nav active="platforms" sticky={false} />

      <Subhead
        accent={platform ? platform.accent : COVERAGE_SCALE[COVERAGE_SCALE.length - 1]}
        label={label}
        title={title}
        meta={
          <span className="aa-mono aa-subhead__count">
            {platform
              ? platform.published
                ? t('platform.cityCount', { count: n(platform.cityCount) })
                : t('platform.seeded')
              : t('platform.cityCount', { count: n(cities.length) })}
          </span>
        }
      >
        <div className="aa-search">
          <Icon name="search" size={14} color="var(--ink-3)" />
          <input
            ref={searchRef}
            className="aa-search__input"
            type="search"
            value={query}
            placeholder={t('platform.search')}
            aria-label={t('platform.search')}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && matches[0]) openCity(matches[0]);
              if (event.key === 'Escape') setQuery('');
            }}
          />
          <kbd className="aa-search__kbd">{t('platform.searchHint')}</kbd>

          {query.trim() && (
            <div className="aa-search__results">
              {matches.length === 0 && <div className="aa-search__empty">{t('platform.empty')}</div>}
              {matches.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  className="aa-search__result"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    openCity(city);
                    setQuery('');
                  }}
                >
                  <span>{city.name}</span>
                  <span className="aa-mono aa-search__country">{city.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {paper && (
          <a className="aa-chip" href={paper.url} target="_blank" rel="noreferrer noopener">
            {t('platform.paper')}
          </a>
        )}
        <a className="aa-chip" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
          {t('platform.github')}
        </a>
      </Subhead>

      <main className="aa-main aa-mapstage" id="main">
        {/* Which set of cities the map draws — the four platforms, or all of
            them at once. Navigating rather than setting state keeps the
            choice in the URL. */}
        <nav className="aa-card aa-picker" aria-label={t('platform.all.pick')}>
          <Link
            className={`aa-picker__item${platform ? '' : ' aa-picker__item--active'}`}
            to="/platforms"
          >
            <span
              className="aa-dot"
              style={{ background: COVERAGE_SCALE[COVERAGE_SCALE.length - 1] }}
            />
            {t('platform.all.name')}
          </Link>
          {PLATFORMS.map((option) => (
            <Link
              key={option.id}
              className={`aa-picker__item${
                platform?.id === option.id ? ' aa-picker__item--active' : ''
              }`}
              to={`/platforms/${option.slug}`}
            >
              <span className="aa-dot" style={{ background: option.accent }} />
              {option.name}
            </Link>
          ))}
        </nav>

        <AtlasMap ref={mapRef} fitWorldWidth center={[10, 20]} label={title}>
          {platform ? (
            <CityLayer
              platform={platform}
              cities={cities}
              tooltip={tooltip}
              onSelect={(properties) => openCity({ ...properties, id: properties.id })}
            />
          ) : (
            <CoverageLayer
              cities={cities}
              tooltip={tooltip}
              onSelect={(properties) => openCity({ ...properties, id: properties.id })}
            />
          )}
        </AtlasMap>

        {welcomeOpen && (
          <section className="aa-card aa-welcome">
            <div className="aa-welcome__head">
              <Eyebrow>{t('platform.welcome', { name: title })}</Eyebrow>
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

        <section className="aa-card aa-legend" aria-label={t(`${copyKey}.legendUnit`)}>
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

        <div className="aa-zoom">
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

        <div className="aa-mapstage__attribution aa-mono">{t('platform.attribution')}</div>
      </main>
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
