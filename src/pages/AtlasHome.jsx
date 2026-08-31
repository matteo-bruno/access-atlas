import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { PlatformExplorer } from './PlatformLanding.jsx';
import { HomeSections } from './Home.jsx';
import { useI18n } from '../i18n/index.jsx';
import { ATLAS_METRICS } from '../data/home.js';
// The floating-box chrome this page shares with the city view.
import '../components/MapBox.css';
import './AtlasHome.css';

/**
 * The front door: the Atlas's own coverage map, with the words over it.
 *
 * The map is not an illustration. It is `PlatformExplorer` — the very screen
 * the platform tab renders — mounted with its chrome withheld and its pointer
 * off, so what sits behind the copy is the real thing rather than a picture
 * of it.
 *
 * There are two ways past that copy. Scrolling reads the rest of the home
 * page, which is directly underneath. "Explore the platform" goes to the
 * platform tab — an ordinary link, so it changes the URL, lights that tab,
 * and can be opened in a new one like any other. The platform is not
 * duplicated here; it is only what this page is standing in front of, and the
 * route cross-fade carries the transition.
 *
 * The previous home page is still routed at /overview, unchanged.
 */
export default function AtlasHome() {
  const { t, n } = useI18n();

  return (
    <div className="aa-page aa-landing">
      <main className="aa-main aa-landing__main" id="main">
        <PlatformExplorer platform={null} chrome={false} interactive={false}>
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
                <Link className="aa-btn aa-btn--solid" to="/platforms">
                  {t('home.hero.ctaPrimary')}
                  <Icon name="arrow" size={14} />
                </Link>
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
              {/* The other way past the copy, and the one that needs saying:
                  the page continues below. */}
              <p className="aa-landing__scroll" aria-hidden="true">
                {t('home.landing.scrollHint')} ↓
              </p>
            </div>
          </div>
        </PlatformExplorer>

        {/* The rest of the home page, directly underneath — without its own
            hero, which is the one over the map. */}
        <HomeSections hero={false} />
      </main>

      <Footer />
    </div>
  );
}
