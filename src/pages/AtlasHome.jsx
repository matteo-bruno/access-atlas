import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { AtlasMap } from '../map/AtlasMap.jsx';
import { CoverageLayer } from '../components/CityLayer.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useAllCoverage } from '../data/useAtlasData.js';
import { ATLAS_METRICS } from '../data/home.js';
import './AtlasHome.css';

// Long enough to read as a dissolve, short enough that nobody waits for it.
// Matched to the transition in AtlasHome.css — change both together.
const DISSOLVE_MS = 620;

/**
 * The front door: the Atlas's own world map, with the words over it.
 *
 * The map is not an illustration of the platform, it *is* the platform's
 * coverage map — the same layer `/platforms` draws — held behind a scrim so
 * the copy stays readable. "Explore the platform" then dissolves the scrim
 * and the words rather than cutting to another screen: what is left is the
 * map at full strength, which is what the next route opens on. The point is
 * that the reader never leaves the map; the page in front of it gets out of
 * the way.
 *
 * The previous home page is still routed, at /overview, so this can be
 * dropped without taking anything with it.
 */
export default function AtlasHome() {
  const { t, n } = useI18n();
  const navigate = useNavigate();
  const { cities } = useAllCoverage();
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    // Anyone who has asked not to be moved around gets the destination, not
    // the choreography.
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      navigate('/platforms');
      return;
    }
    setLeaving(true);
    window.setTimeout(() => navigate('/platforms'), DISSOLVE_MS);
  };

  return (
    <div className={`aa-page aa-page--fixed aa-landing${leaving ? ' aa-landing--leaving' : ''}`}>
      <Nav active="atlas" sticky={false} />

      <main className="aa-main aa-landing__main" id="main">
        {/* The map is the background: it takes no clicks here, because the
            one thing to do on this page is go in. */}
        <div className="aa-landing__map">
          <AtlasMap fitWorldWidth center={[10, 20]} interactive={false} label={t('home.landing.mapLabel')}>
            <CoverageLayer cities={cities} interactive={false} />
          </AtlasMap>
        </div>
        <div className="aa-landing__scrim" />

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
              <Link className="aa-btn aa-btn--ghost" to="/overview">
                {t('home.landing.ctaOverview')}
              </Link>
            </div>
          </div>

          {/* Counted from the published files, like everything else. */}
          <dl className="aa-landing__metrics">
            {ATLAS_METRICS.map((metric) => (
              <div className="aa-landing__metric" key={metric.key}>
                <dt>{t(`home.metrics.${metric.key}`)}</dt>
                <dd className="aa-mono">{metric.raw ? metric.value : n(metric.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
    </div>
  );
}
