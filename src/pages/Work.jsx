import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow, SectionHeading } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { useI18n } from '../i18n/index.jsx';
import { CONTACT } from '../data/team.js';
import './Work.css';

// The three routes in are listed as routes, not vacancies — there is no funded
// position open, and the page says so before it says anything else.
const ROUTES = ['phd', 'thesis', 'internship'];

export default function Work() {
  const { t } = useI18n();
  const careers = CONTACT.careers ?? CONTACT.general;

  return (
    <div className="aa-page">
      <Nav active="work" />

      <main className="aa-main" id="main">
        <section className="aa-shell aa-work__intro">
          <Eyebrow>{t('work.eyebrow')}</Eyebrow>
          <h1 className="aa-work__headline">{t('work.headline')}</h1>
          <p className="aa-work__lede">{t('work.lede')}</p>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading tag="01" title={t('work.positionsTitle')} />
          <div className="aa-card aa-work__notice">
            <div className="aa-work__noticehead">
              <span className="aa-dot aa-work__dot" />
              <span className="aa-work__noticetitle">{t('work.noPositions')}</span>
            </div>
            <p className="aa-work__noticebody">{t('work.noPositionsDetail')}</p>
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading tag="02" title={t('work.openTitle')} />
          <div className="aa-work__routes">
            {ROUTES.map((key, index) => (
              <article key={key} className="aa-card aa-lift aa-work__route">
                <div className="aa-mono aa-work__routeindex">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="aa-work__routetitle">{t(`work.routes.${key}.title`)}</h3>
                <p className="aa-work__routedesc">{t(`work.routes.${key}.desc`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading tag="03" title={t('work.howTitle')} />
          <div className="aa-work__how">
            <p className="aa-work__howbody">
              <Interpolate
                template={t('work.howBody')}
                values={{
                  email: (
                    <a className="aa-work__email" href={`mailto:${careers}`}>
                      {careers}
                    </a>
                  ),
                }}
              />
            </p>

            <div className="aa-work__expect">
              <Eyebrow>{t('work.expectTitle')}</Eyebrow>
              <p className="aa-work__howbody">{t('work.expectBody')}</p>
            </div>

            <a className="aa-work__cta" href={`mailto:${careers}`}>
              {t('work.cta')}
              <Icon name="arrow" size={13} color="#FBFAF4" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
