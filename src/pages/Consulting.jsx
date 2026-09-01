import { Footer } from '../components/Footer.jsx';
import { Eyebrow, SectionHeading } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import { CONTACT } from '../data/team.js';
import './Prose.css';

// Who this page is for. Two audiences, said separately, because what they
// need from an accessibility measurement is not the same thing.
const AUDIENCES = ['policy', 'company'];

/**
 * Consulting — short on purpose.
 *
 * There is no service catalogue and no price list to publish, so the page
 * does the one thing it can honestly do: say what the group can be asked
 * about, and give an address to ask at.
 */
export default function Consulting() {
  const { t } = useI18n();

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-prose__intro">
          <Eyebrow>{t('consulting.eyebrow')}</Eyebrow>
          <h1 className="aa-prose__headline">{t('consulting.headline')}</h1>
          <p className="aa-prose__lede">{t('consulting.lede')}</p>

          <div className="aa-prose__links">
            <a className="aa-prose__cta" href={`mailto:${CONTACT.general}`}>
              {t('consulting.cta')}
              <Icon name="arrow" size={13} color="#FBFAF4" />
            </a>
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('consulting.whoTitle')} />
          <div className="aa-prose__list">
            {AUDIENCES.map((key) => (
              <article key={key} className="aa-card aa-prose__card">
                <Eyebrow>{t(`consulting.who.${key}.tag`)}</Eyebrow>
                <h3 className="aa-prose__cardtitle">{t(`consulting.who.${key}.title`)}</h3>
                <p className="aa-prose__carddesc">{t(`consulting.who.${key}.desc`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="aa-shell aa-block">
          <div className="aa-card aa-prose__body">
            <p className="aa-prose__p">{t('consulting.note')}</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
