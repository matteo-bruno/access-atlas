// The nav has always carried a Research entry; the handoff had no artboard for
// it, so this page is assembled strictly from the approved design vocabulary
// (section headings, cards, the by-the-numbers table) rather than inventing new
// patterns. Content is placeholder — see data/research.js.

import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow, SectionHeading } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import { CITATION, DATASETS, PAPERS } from '../data/research.js';
import { PLATFORMS_BY_ID } from '../data/platforms.js';
import './Research.css';

export default function Research() {
  const { t, n } = useI18n();

  return (
    <div className="aa-page">
      <Nav active="research" />

      <main className="aa-main" id="main">
        <section className="aa-shell aa-research__intro">
          <Eyebrow>{t('research.eyebrow')}</Eyebrow>
          <h1 className="aa-research__headline">{t('research.headline')}</h1>
          <p className="aa-research__lede">{t('research.lede')}</p>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading
            tag={t('research.papersTag')}
            title={t('research.papersTitle')}
            hint={t('research.papersHint')}
          />
          <div className="aa-papers">
            {PAPERS.map((paper) => {
              const platform = PLATFORMS_BY_ID[paper.platform];
              return (
                <article key={paper.id} className="aa-card aa-lift aa-paper">
                  <div className="aa-paper__kicker">
                    <span className="aa-dot" style={{ background: platform.accent }} />
                    <span>{platform.name}</span>
                  </div>
                  <h3 className="aa-paper__title">{paper.title}</h3>
                  <div className="aa-paper__meta">
                    {paper.authors} · {paper.venue} · {paper.year}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading
            tag={t('research.datasetsTag')}
            title={t('research.datasetsTitle')}
            hint={t('research.datasetsHint')}
          />
          <div className="aa-card aa-datasets">
            <div className="aa-datasets__head">
              <div>{t('research.columns.dataset')}</div>
              <div>{t('research.columns.coverage')}</div>
              <div>{t('research.columns.format')}</div>
              <div>{t('research.columns.licence')}</div>
            </div>
            {DATASETS.map((dataset) => {
              const platform = PLATFORMS_BY_ID[dataset.platform];
              return (
                <div key={dataset.id} className="aa-datasets__row">
                  <Link className="aa-datasets__name" to={`/platforms/${platform.slug}`}>
                    <span className="aa-dot" style={{ background: platform.accent }} />
                    {platform.name}
                    <Icon name="arrow" size={13} color="var(--ink-3)" />
                  </Link>
                  <div className="aa-mono">
                    {t('platform.cityCount', { count: n(dataset.coverage) })}
                  </div>
                  <div>{dataset.format}</div>
                  <div className="aa-mono aa-datasets__licence">{dataset.licence}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading tag="03" title={t('research.citeTitle')} />
          <pre className="aa-card aa-citation">{CITATION}</pre>
        </section>
      </main>

      <Footer />
    </div>
  );
}
