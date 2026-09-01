import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { HomeSections } from './Home.jsx';
import { useI18n } from '../i18n/index.jsx';
import { ATLAS_METRICS } from '../data/home.js';
import './AtlasHome.css';

/**
 * The front door: one viewport of the Atlas's own coverage map, with the
 * words over it.
 *
 * The map itself is not here — it is the site's backdrop (`Backdrop`, in the
 * shell), fixed behind every page and framed exactly as the platform screen
 * frames it. This screen only leaves it a viewport of clear space. Scrolling
 * then brings the rest of the home page up as a sheet over a map that does
 * not move, which is the whole reason the backdrop is fixed rather than
 * parallaxed.
 *
 * The words sit in the middle of that viewport rather than at the top of it:
 * the name, what the Atlas does, and one way in. The premise reads beside
 * them, to the right — three sentences that say why any of this is measured,
 * which is the argument the rest of the page then supports.
 *
 * "Explore the platform" goes to the platform tab — an ordinary link, so it
 * changes the URL, lights that tab, and can be opened in a new one like any
 * other. The platform is not duplicated here.
 *
 * The previous home page is still routed at /overview, unchanged.
 */
export default function AtlasHome() {
  const { t, n } = useI18n();

  return (
    <div className="aa-page aa-landing">
      <main className="aa-main aa-landing__main" id="main">
        {/* A viewport of nothing: the backdrop shows through it. */}
        <section className="aa-landing__stage">
          <div className="aa-landing__content">
            <div className="aa-landing__middle">
              <div className="aa-landing__lead aa-fadein">
                <Eyebrow>{t('home.hero.eyebrow')}</Eyebrow>
                <h1 className="aa-landing__headline">
                  {t('home.hero.title')}{' '}
                  <span className="aa-accent">{t('home.hero.titleAccent')}</span>
                </h1>
                <p className="aa-landing__subtitle">{t('home.hero.subtitle')}</p>

                <div className="aa-landing__actions">
                  <Link className="aa-btn aa-btn--solid" to="/platforms">
                    {t('home.hero.ctaPrimary')}
                    <Icon name="arrow" size={14} />
                  </Link>
                </div>
              </div>

              {/* Why the Atlas measures anything at all. Three sentences,
                  under the title and to the right of it, so the name is read
                  first and the argument second. */}
              <aside className="aa-landing__premise aa-fadein aa-fadein--slow">
                <Eyebrow>{t('home.premise.eyebrow')}</Eyebrow>
                <p className="aa-landing__premisebody">
                  {t('home.premise.lines').map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </aside>
            </div>

            <div className="aa-landing__foot aa-fadein aa-fadein--slow">
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
        </section>

        {/* The rest of the home page, directly underneath — without its own
            hero, which is the one over the map. */}
        <div className="aa-landing__sheet">
          <HomeSections hero={false} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
