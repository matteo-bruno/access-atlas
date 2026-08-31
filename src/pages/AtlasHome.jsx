import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { CitySearch } from '../components/CitySearch.jsx';
import { AtlasMap } from '../map/AtlasMap.jsx';
import { CoverageLayer } from '../components/CityLayer.jsx';
import { HomeSections } from './Home.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useAllCoverage, useAtlasCityIds } from '../data/useAtlasData.js';
import { ATLAS_METRICS } from '../data/home.js';
// The floating-box chrome these pages share with the city view.
import '../components/MapBox.css';
import './AtlasHome.css';

const GITHUB_URL = 'https://github.com/sony-csl-rome';

// Long enough to read as a dissolve, short enough that nobody waits for it.
// Matched to the transition in AtlasHome.css — change both together.
const DISSOLVE_MS = 620;

/**
 * The front door, and the platform behind it — on one route.
 *
 * The map is not an illustration: it is the Atlas's own coverage map, held
 * behind a scrim with the copy over it. There are two ways past that copy and
 * they answer different questions. Scrolling reads the rest of the home page,
 * which is directly underneath. "Explore the platform" lifts the scrim and
 * the words instead, leaving the map — the *same* map, the same MapLibre
 * instance — now interactive, with the controls the world map needs.
 *
 * Nothing is routed for that second path. Navigating would tear the map down
 * and build another, which is a flash exactly where the transition is meant
 * to be smooth, so the URL stays put and the page changes what it shows.
 *
 * The previous home page is still routed at /overview, unchanged.
 */
export default function AtlasHome() {
  const { t, n } = useI18n();
  const navigate = useNavigate();
  const { cities } = useAllCoverage();
  const atlasCityIds = useAtlasCityIds();
  // 'home' → the words over the map, with the page under them.
  // 'leaving' → the dissolve.
  // 'platform' → the map, interactive, with its own controls.
  const [phase, setPhase] = useState('home');
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const stillness = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const enter = () => {
    if (stillness()) {
      setPhase('platform');
      return;
    }
    setPhase('leaving');
    timer.current = window.setTimeout(() => setPhase('platform'), DISSOLVE_MS);
  };

  const leave = () => {
    window.clearTimeout(timer.current);
    setPhase('home');
  };

  // Escape is how anyone expects to get out of a screen they went into.
  useEffect(() => {
    if (phase !== 'platform') return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') leave();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase]);

  const openCity = (city) => {
    // Every city view is the combined viewer; the map is only the way in.
    if (atlasCityIds.has(city.id) || city.id) navigate(`/atlas/${city.id}`);
  };

  const onMap = phase === 'platform';

  return (
    <div className={`aa-page aa-landing aa-landing--${phase}`}>
      <Nav active="atlas" sticky={!onMap} />

      <main className="aa-main aa-landing__main" id="main">
        <section className="aa-landing__stage">
          <div className="aa-landing__map">
            <AtlasMap
              fitWorldWidth
              center={[10, 20]}
              interactive={onMap}
              label={t('home.landing.mapLabel')}
            >
              <CoverageLayer
                cities={cities}
                interactive={onMap}
                onSelect={onMap ? (properties) => openCity(properties) : undefined}
                tooltip={onMap ? (feature) => feature.properties.name : undefined}
              />
            </AtlasMap>
          </div>
          <div className="aa-landing__scrim" />

          {/* ── The words ─────────────────────────────────────── */}
          {phase !== 'platform' && (
            <div className="aa-landing__content">
              <div className="aa-landing__lead">
                <Eyebrow>{t('home.hero.eyebrow')}</Eyebrow>
                <h1 className="aa-landing__headline">
                  {t('home.hero.headline')}{' '}
                  <span className="aa-hero__accent">{t('home.hero.headlineAccent')}</span>
                </h1>
                <p className="aa-landing__lede">
                  <Interpolate
                    template={t('home.hero.lede')}
                    values={{
                      proximity: <strong>{t('home.hero.ledeProximity')}</strong>,
                      opportunity: <strong>{t('home.hero.ledeOpportunity')}</strong>,
                      cardep: <strong>{t('home.hero.ledeCardep')}</strong>,
                    }}
                  />
                </p>

                <div className="aa-landing__actions">
                  <button type="button" className="aa-btn aa-btn--solid" onClick={enter}>
                    {t('home.hero.ctaPrimary')}
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              </div>

              <div className="aa-landing__foot">
                {/* Counted from the published files, like everything else. */}
                <dl className="aa-landing__metrics">
                  {ATLAS_METRICS.map((metric) => (
                    <div className="aa-landing__metric" key={metric.key}>
                      <dt>{t(`home.metrics.${metric.key}`)}</dt>
                      <dd className="aa-mono">{metric.raw ? metric.value : n(metric.value)}</dd>
                    </div>
                  ))}
                </dl>
                {/* The other way past the copy, and the one that needs
                    saying: the page continues below. */}
                <p className="aa-landing__scroll" aria-hidden="true">
                  {t('home.landing.scrollHint')} ↓
                </p>
              </div>
            </div>
          )}

          {/* ── The platform, on the same map ─────────────────── */}
          {onMap && (
            <div className="aa-mapui aa-mapui--tr aa-landing__tools">
              <CitySearch cities={cities} onOpen={openCity} />
              <a className="aa-mapbtn" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                {t('platform.github')}
              </a>
            </div>
          )}
          {onMap && (
            <div className="aa-mapui aa-mapui--tl">
              <button type="button" className="aa-mapbtn" onClick={leave}>
                ← {t('home.landing.back')}
              </button>
            </div>
          )}
        </section>

        {/* The rest of the home page, directly underneath. */}
        {phase !== 'platform' && <HomeSections />}
      </main>

      {phase !== 'platform' && <Footer />}
    </div>
  );
}
