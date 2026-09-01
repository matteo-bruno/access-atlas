import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow, SectionHeading } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import { LAB, OTHER_PROJECTS } from '../data/lab.js';
import './Prose.css';

// What the group works on, in the order the Atlas presents it: measure, then
// compare, then the things that come out of it.
const WHAT_WE_DO = ['measure', 'compare', 'publish'];

/**
 * Who we are — the page every other page assumes.
 *
 * The Atlas is one output of a research line, not a product from a company,
 * and nothing else on the site says so plainly. This does, and then hands the
 * reader on to the lab and to the group's other work.
 */
export default function SustainableCities() {
  const { t } = useI18n();

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-prose__intro">
          <Eyebrow>{t('about.eyebrow')}</Eyebrow>
          <h1 className="aa-prose__headline">
            {t('about.headline')}
            <br />
            <span className="aa-prose__accent">{t('about.headlineAccent')}</span>
          </h1>
          <p className="aa-prose__lede">{t('about.lede')}</p>

          <div className="aa-prose__links">
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
          <div className="aa-prose__list">
            {WHAT_WE_DO.map((key) => (
              <article key={key} className="aa-card aa-lift aa-prose__card">
                <Eyebrow>{t(`about.do.${key}.tag`)}</Eyebrow>
                <h3 className="aa-prose__cardtitle">{t(`about.do.${key}.title`)}</h3>
                <p className="aa-prose__carddesc">{t(`about.do.${key}.desc`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('about.withTitle')} />
          <div className="aa-card aa-prose__body">
            <p className="aa-prose__p">{t('about.withBody')}</p>
            <p className="aa-prose__p">{t('about.withBody2')}</p>
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('about.projectsTitle')} hint={t('about.projectsHint')} />
          <div className="aa-prose__list">
            {OTHER_PROJECTS.map((project) => (
              <a
                key={project.key}
                className="aa-card aa-lift aa-prose__card"
                href={project.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Eyebrow>{t(`about.projects.${project.key}.tag`)}</Eyebrow>
                <h3 className="aa-prose__cardtitle">{t(`about.projects.${project.key}.name`)}</h3>
                <p className="aa-prose__carddesc">{t(`about.projects.${project.key}.desc`)}</p>
              </a>
            ))}
          </div>

          <div className="aa-prose__links">
            <a className="aa-prose__cta" href={LAB.url} target="_blank" rel="noreferrer noopener">
              {t('about.labCta')}
              <Icon name="arrow" size={13} color="#FBFAF4" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
