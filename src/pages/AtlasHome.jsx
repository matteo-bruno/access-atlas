import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Icon } from '../components/Icon.jsx';
import { Logo } from '../components/Logo.jsx';
import { HomeSections } from './Home.jsx';
import { useI18n } from '../i18n/index.jsx';
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
 * The words sit in the middle of that viewport, and on its centre line: the
 * name, what the Atlas does, the premise, and one way in — one column, read
 * top to bottom. The premise used to be a second block off to the right,
 * under its own heading, which made the screen two things to read rather than
 * one; it is now the argument the title arrives at, three sentences below a
 * cyan rule, ending in navy on the sentence the whole site rests on.
 *
 * The screen carries no figures. Counting the Atlas's cities and cells on the
 * way in said nothing a reader could act on, and the same list appeared again
 * a screen further down.
 *
 * "Explore the platform" goes to the platform tab — an ordinary link, so it
 * changes the URL, lights that tab, and can be opened in a new one like any
 * other. The platform is not duplicated here.
 *
 * The previous home page is still routed at /overview, unchanged.
 */
export default function AtlasHome() {
  const { t } = useI18n();
  const premise = t('home.premise.lines');

  return (
    <div className="aa-page aa-landing">
      <main className="aa-main aa-landing__main" id="main">
        {/* A viewport of nothing: the backdrop shows through it. */}
        <section className="aa-landing__stage">
          <div className="aa-landing__content">
            <div className="aa-landing__middle">
              <div className="aa-landing__lead aa-fadein">
                <h1 className="aa-landing__headline">
                  {t('home.hero.title')}{' '}
                  <span className="aa-accent">{t('home.hero.titleAccent')}</span>
                </h1>
                <p className="aa-landing__subtitle">{t('home.hero.subtitle')}</p>

                {/* Why the Atlas measures anything at all — the argument the
                    name arrives at, not a second column beside it. Three
                    sentences, in this order, the last one the point. */}
                <p className="aa-landing__premisebody aa-fadein aa-fadein--slow">
                  {premise.map((line, index) => (
                    <span
                      key={line}
                      className={index === premise.length - 1 ? 'aa-landing__premiseend' : undefined}
                    >
                      {line}
                    </span>
                  ))}
                </p>

                <div className="aa-landing__actions">
                  <Link className="aa-btn aa-btn--solid aa-landing__cta" to="/platforms">
                    {t('home.hero.ctaPrimary')}
                    <Icon name="arrow" size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Whose Atlas this is. The corner of the first screen, where a
                credit belongs — not above the name. */}
            <div className="aa-landing__foot aa-fadein aa-fadein--slow">
              <p className="aa-landing__by">
                <Logo variant="symbol" tone="color" height={18} alt="" />
                {t('home.landing.by')}
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
