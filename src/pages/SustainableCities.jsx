import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { useI18n } from '../i18n/index.jsx';
import { LAB } from '../data/lab.js';
import './Prose.css';

// What the group does, as three corners of one triangle: the research, the
// platforms that replicate it on many cities, and the use cases built for a
// city from those platforms.
const WHAT_WE_DO = ['research', 'platform', 'useCase'];

// The topics the group works on. Labels only, not links.
const TOPICS = ['accessibility', 'justice', 'sustainability', 'green', 'walkability', 'bikeability'];

/**
 * Who we are: the page every other page assumes.
 *
 * The Atlas is one output of a research line, not a product from a company,
 * and nothing else on the site says so plainly. This does, then says what the
 * group does and which topics it works on.
 */
export default function SustainableCities() {
  const { t } = useI18n();

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-prose__intro aa-prose__intro--split">
          <div>
            <h1 className="aa-prose__headline">
              {t('about.headline')}
              <br />
              <span className="aa-accent">{t('about.headlineAccent')}</span>
            </h1>
            <p className="aa-prose__lede">{t('about.lede')}</p>
          </div>

          <div className="aa-prose__links aa-prose__links--side">
            <a className="aa-chip" href={LAB.url} target="_blank" rel="noreferrer noopener">
              {t('about.labLink')}
            </a>
            <Link className="aa-chip" to="/contact">
              {t('about.teamLink')}
            </Link>
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('about.doTitle')} />
          <div className="aa-prose__triangle">
            {/* The edges of the triangle, drawn behind the cards so only the
                stretches between them show. */}
            <svg
              className="aa-prose__triangle-edges"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,22 25,78 75,78" vectorEffect="non-scaling-stroke" />
            </svg>
            {WHAT_WE_DO.map((key) => (
              <article key={key} className={`aa-card aa-prose__card aa-prose__corner aa-prose__corner--${key}`}>
                <h3 className="aa-prose__cardtitle">{t(`about.do.${key}.title`)}</h3>
                <p className="aa-prose__carddesc">
                  {t(`about.do.${key}.desc`)}
                  {key === 'useCase' && (
                    <>
                      {' '}
                      <Link className="aa-prose__link" to="/consulting">
                        {t('about.do.useCase.cta')}
                      </Link>
                    </>
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('about.topicsTitle')} />
          <ul className="aa-prose__topics">
            {TOPICS.map((key) => (
              <li key={key} className="aa-prose__topic">
                {t(`about.topics.${key}`)}
              </li>
            ))}
          </ul>
          <p className="aa-prose__p aa-prose__topicsnote">
            <Interpolate
              template={t('about.topicsNote')}
              values={{
                research: (
                  <Link className="aa-prose__link" to="/research">
                    {t('about.topicsResearch')}
                  </Link>
                ),
                contact: (
                  <Link className="aa-prose__link" to="/contact">
                    {t('about.topicsContact')}
                  </Link>
                ),
              }}
            />
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
