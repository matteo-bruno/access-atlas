import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { Icon } from '../components/Icon.jsx';
import { AtlasMap } from '../map/AtlasMap.jsx';
import { CityLayer } from '../components/CityLayer.jsx';
import { useI18n } from '../i18n/index.jsx';
import { platformBySlug, PLATFORMS } from '../data/platforms.js';
import { useCityCoverage, useCityPageIds } from '../data/useAtlasData.js';
import './PlatformLanding.css';

const PAPER_URL = 'https://doi.org/10.1140/epjds';
const GITHUB_URL = 'https://github.com/sony-csl-rome';

export default function PlatformLanding() {
  const { slug } = useParams();
  const platform = platformBySlug(slug);

  if (!platform) return <Navigate to={`/platforms/${PLATFORMS[0].slug}`} replace />;
  // Remount cleanly when switching platforms so the map rebuilds its layers.
  return <PlatformScreen key={platform.id} platform={platform} />;
}

function PlatformScreen({ platform }) {
  const { t, n } = useI18n();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [query, setQuery] = useState('');

  const { cities } = useCityCoverage(platform);
  const cityPageIds = useCityPageIds(platform.id);
  const legend = t(`platform.${platform.id}.legend`);

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
    if (platform.hasCityPages && cityPageIds.has(city.id)) {
      navigate(`/platforms/${platform.slug}/${city.id}`);
      return;
    }
    mapRef.current?.flyTo({ center: [city.lon, city.lat], zoom: 6, duration: 900 });
  };

  const tooltip = (feature) => formatTooltip(platform, feature.properties, n);

  return (
    <div className="aa-page aa-page--fixed">
      <Nav active="platforms" sticky={false} />

      <Subhead
        accent={platform.accent}
        label={`§ ${platform.tag} · ${t(`platform.${platform.id}.label`)}`}
        title={platform.name}
        meta={
          <span className="aa-mono aa-subhead__count">
            {platform.published
              ? t('platform.cityCount', { count: n(platform.cityCount) })
              : t('platform.seeded')}
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

        <a className="aa-chip" href={PAPER_URL} target="_blank" rel="noreferrer noopener">
          {t('platform.paper')}
        </a>
        <a className="aa-chip" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
          {t('platform.github')}
        </a>
      </Subhead>

      <main className="aa-main aa-mapstage" id="main">
        <AtlasMap ref={mapRef} fitWorldWidth center={[10, 20]} label={platform.name}>
          <CityLayer
            platform={platform}
            cities={cities}
            tooltip={tooltip}
            onSelect={(properties) => openCity({ ...properties, id: properties.id })}
          />
        </AtlasMap>

        {welcomeOpen && (
          <section className="aa-card aa-welcome">
            <div className="aa-welcome__head">
              <Eyebrow>{t('platform.welcome', { name: platform.name })}</Eyebrow>
              <button
                type="button"
                className="aa-welcome__close"
                aria-label={t('platform.dismiss')}
                onClick={() => setWelcomeOpen(false)}
              >
                <Icon name="close" size={13} color="var(--ink-3)" />
              </button>
            </div>
            <p className="aa-welcome__body">{t(`platform.${platform.id}.intro`)}</p>
            <div className="aa-welcome__actions">
              <button
                type="button"
                className="aa-welcome__cta"
                style={{ background: platform.accent }}
                onClick={() => searchRef.current?.focus()}
              >
                {t('platform.ctaMap')}
                <Icon name="arrow" size={13} color="#FBFAF4" />
              </button>
              <a className="aa-welcome__more" href={PAPER_URL} target="_blank" rel="noreferrer noopener">
                {t('platform.learnMore')}
              </a>
            </div>
          </section>
        )}

        <section className="aa-card aa-legend" aria-label={t(`platform.${platform.id}.legendUnit`)}>
          <Eyebrow>{t(`platform.${platform.id}.legendUnit`)}</Eyebrow>
          <div className="aa-legend__items">
            {legend.map((label, index) => (
              <div key={label} className="aa-legend__item">
                <span className="aa-swatch" style={{ background: platform.scale[index] }} />
                <span>{label}</span>
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
