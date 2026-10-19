// The group's open research: the papers (a short list of highlights, or all
// of them), the datasets, and how to cite each layer and the Atlas itself.
// The bibliography and the citations come from data/research.js.

import { useSearchParams } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import {
  ATLAS_CITATION,
  ATLAS_URL,
  CITED_LAYERS,
  DATASETS,
  PAPERS,
  PAPER_BY_PLATFORM,
  citationFor,
} from '../data/research.js';
import { PLATFORMS_BY_ID } from '../data/platforms.js';
import './Research.css';

const HIGHLIGHTS = PAPERS.filter((paper) => paper.highlight);

// Papers grouped by year, newest first, for the full list.
function byYear(papers) {
  const groups = [];
  for (const paper of papers) {
    const last = groups[groups.length - 1];
    if (last && last.year === paper.year) last.papers.push(paper);
    else groups.push({ year: paper.year, papers: [paper] });
  }
  return groups;
}

function PlatformTag({ id }) {
  const platform = PLATFORMS_BY_ID[id];
  if (!platform) return null;
  return (
    <span className="aa-research__platform">
      <span className="aa-dot aa-dot--sm" style={{ background: platform.accent }} />
      {platform.name}
    </span>
  );
}

function DoiLink({ paper }) {
  if (!paper.doi) return null;
  return (
    <a
      className="aa-mono aa-research__doi"
      href={`https://doi.org/${paper.doi}`}
      target="_blank"
      rel="noreferrer noopener"
    >
      doi:{paper.doi}
    </a>
  );
}

// A highlighted paper: the whole card is the link.
function HighlightCard({ paper }) {
  const { t } = useI18n();
  return (
    <a
      className="aa-card aa-lift aa-research__paper"
      href={paper.url}
      target="_blank"
      rel="noreferrer noopener"
    >
      <div className="aa-research__kicker">
        <span className="aa-mono">{paper.year}</span>
        {paper.preprint && <span className="aa-research__badge">{t('research.preprint')}</span>}
        {paper.platform && <PlatformTag id={paper.platform} />}
      </div>
      <h3 className="aa-research__papertitle">{paper.title}</h3>
      <div className="aa-research__authors">{paper.authors}</div>
      <div className="aa-research__venue">
        <span>{paper.venue}</span>
        <Icon name="external" size={13} color="var(--ink-3)" />
      </div>
    </a>
  );
}

function PaperRow({ paper }) {
  const { t } = useI18n();
  return (
    <li className="aa-research__row">
      <h3 className="aa-research__rowtitle">
        {paper.url ? (
          <a href={paper.url} target="_blank" rel="noreferrer noopener">
            {paper.title}
          </a>
        ) : (
          paper.title
        )}
      </h3>
      <div className="aa-research__authors">{paper.authors}</div>
      <div className="aa-research__meta">
        <span>{paper.venue}</span>
        {paper.preprint && <span className="aa-research__badge">{t('research.preprint')}</span>}
        {paper.platform && <PlatformTag id={paper.platform} />}
        <DoiLink paper={paper} />
      </div>
    </li>
  );
}

export default function Research() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const showAll = params.get('papers') === 'all';

  const setView = (all) => {
    const next = new URLSearchParams(params);
    if (all) next.set('papers', 'all');
    else next.delete('papers');
    setParams(next, { replace: true });
  };

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-research__intro">
          <h1 className="aa-research__headline">
            {t('research.headline')} <span className="aa-accent">{t('research.headlineAccent')}</span>
          </h1>
        </section>

        <section className="aa-shell aa-block">
          <div className="aa-research__head">
            <SectionHeading title={t('research.papersTitle')} />
            <div className="aa-research__switch" role="group" aria-label={t('research.papersTitle')}>
              <button type="button" aria-pressed={!showAll} onClick={() => setView(false)}>
                {t('research.highlights')}
              </button>
              <button type="button" aria-pressed={showAll} onClick={() => setView(true)}>
                {t('research.allPapers')}
              </button>
            </div>
          </div>

          {showAll ? (
            <div className="aa-card aa-research__all">
              {byYear(PAPERS).map((group) => (
                <section key={group.year} className="aa-research__year">
                  <h3 className="aa-mono aa-research__yearlabel">{group.year}</h3>
                  <ol className="aa-research__rows">
                    {group.papers.map((paper) => (
                      <PaperRow key={paper.id} paper={paper} />
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          ) : (
            <div className="aa-research__papers">
              {HIGHLIGHTS.map((paper) => (
                <HighlightCard key={paper.id} paper={paper} />
              ))}
            </div>
          )}
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('research.datasetsTitle')} />
          <div className="aa-research__datasets">
            {DATASETS.map((dataset) => {
              const platform = PLATFORMS_BY_ID[dataset.platform];
              const dot = <span className="aa-dot" style={{ background: platform.accent }} />;
              return dataset.url ? (
                <a
                  key={dataset.id}
                  className="aa-research__dataset"
                  href={dataset.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {dot}
                  <span className="aa-research__datasetname">{platform.name}</span>
                  <Icon name="github" size={15} color="var(--ink-2)" />
                </a>
              ) : (
                <span key={dataset.id} className="aa-research__dataset aa-research__dataset--soon" aria-disabled="true">
                  {dot}
                  <span className="aa-research__datasetname">{platform.name}</span>
                  <span className="aa-research__badge">{t('research.comingSoon')}</span>
                </span>
              );
            })}
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('research.citeTitle')} />
          <div className="aa-card aa-research__cite">
            <p className="aa-research__citelede">{t('research.citeLayers')}</p>
            <ul className="aa-research__citations">
              {CITED_LAYERS.map((id) => {
                const paper = PAPER_BY_PLATFORM[id];
                if (!paper) return null;
                return (
                  <li key={id} className="aa-research__citation">
                    <PlatformTag id={id} />
                    <p className="aa-research__citetext">
                      {citationFor(paper)} <DoiLink paper={paper} />
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="aa-research__citeatlas">
              <p className="aa-research__citelede">{t('research.citeAtlas')}</p>
              <p className="aa-research__citetext">
                {ATLAS_CITATION.replace(ATLAS_URL, '')}
                <a className="aa-research__link" href={ATLAS_URL}>
                  {ATLAS_URL}
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
