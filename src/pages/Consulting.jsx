import { Footer } from '../components/Footer.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import { CONTACT } from '../data/team.js';
import './Prose.css';

// What the group can be asked about. Labels only, not links.
const SERVICES = [
  'digitalTwins',
  'inequalities',
  'mobilityForecasting',
  'demand',
  'emissions',
  'bikeLanes',
  'busLanes',
  'pedestrianization',
  'originDestination',
];

/**
 * Consulting: short on purpose.
 *
 * There is no service catalogue and no price list to publish, so the page
 * does the one thing it can honestly do: say what the group can be asked
 * about, and give an address to ask at.
 */
export default function Consulting() {
  const { t } = useI18n();
  const mailto = `mailto:${CONTACT.general}`;

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        {/* The page on the left, what can be asked about running beside it. */}
        <div className="aa-shell aa-consulting">
          <div className="aa-consulting__main">
            <section className="aa-prose__intro">
              <h1 className="aa-prose__headline">
                {t('consulting.headline')}
                <br />
                <span className="aa-accent">{t('consulting.headlineAccent')}</span>
              </h1>
              <p className="aa-prose__lede">{t('consulting.lede')}</p>

              <div className="aa-prose__links aa-prose__links--contact">
                <a className="aa-prose__cta aa-prose__cta--navy" href={mailto}>
                  {t('consulting.cta')}
                  <Icon name="arrow" size={13} color="#FBFAF4" />
                </a>
                <a className="aa-prose__link aa-prose__email" href={mailto}>
                  {CONTACT.general}
                </a>
              </div>
            </section>

            <section className="aa-block">
              <SectionHeading title={t('consulting.whoTitle')} />
              <p className="aa-prose__p">{t('consulting.whoBody')}</p>
            </section>
          </div>

          <aside className="aa-consulting__aside">
            <ul className="aa-consulting__services">
              {SERVICES.map((key) => (
                <li key={key} className="aa-consulting__service">
                  {t(`consulting.services.${key}`)}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
