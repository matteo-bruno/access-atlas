import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow, SectionHeading } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { PlatformPreview } from '../components/PlatformPreview.jsx';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS } from '../data/platforms.js';
import { citiesForPlatform } from '../data/cities.js';
import { BLOG_LISTED, postForLayer } from '../data/blog.js';
import {
  NEWS,
  RANKING_MEASURE,
  RANKING_MIN_POPULATION,
  WORK_IN_PROGRESS,
  cityRankings,
} from '../data/home.js';
import { usePublishedCityCounts, useStats } from '../data/useAtlasData.js';
import './Home.css';

export default function Home() {
  return (
    <div className="aa-page">

      <main className="aa-main" id="main">
        <HomeSections />
      </main>

      <Footer />
    </div>
  );
}

/**
 * Everything the home page says, without the page around it.
 *
 * The landing scrolls into this rather than linking to it, so the two cannot
 * drift apart: there is one set of sections, mounted in two places.
 *
 * `hero` is off under the landing, which has already said all of it over the
 * map — the same headline twice in one scroll reads as a mistake, because it
 * is one.
 */
export function HomeSections({ hero = true }) {
  const { t, n, lang } = useI18n();
  const firstPlatform = PLATFORMS[0];
  const fifteen = PLATFORMS.find((p) => p.id === 'fifteen');
  const cityCounts = usePublishedCityCounts();
  // The rankings, read from the published statistics (see cityRankings).
  const { stats } = useStats();
  const rankings = useMemo(() => cityRankings(stats), [stats]);

  const platformCities = useMemo(
    () => Object.fromEntries(PLATFORMS.map((p) => [p.id, citiesForPlatform(p)])),
    [],
  );

  return (
    <>
        {/* ── Hero ─────────────────────────────────────────────── */}
        {hero && (
        <section className="aa-shell aa-hero">
          <div className="aa-hero__lead">
            <Eyebrow>{t('home.hero.eyebrow')}</Eyebrow>
            <h1 className="aa-hero__headline">
              {t('home.hero.headline')}{' '}
              <span className="aa-accent">{t('home.hero.headlineAccent')}</span>
            </h1>
            <p className="aa-hero__lede">
              <Interpolate
                template={t('home.hero.lede')}
                values={{
                  proximity: <strong>{t('home.hero.ledeProximity')}</strong>,
                  opportunity: <strong>{t('home.hero.ledeOpportunity')}</strong>,
                  cardep: <strong>{t('home.hero.ledeCardep')}</strong>,
                }}
              />
            </p>
            <div className="aa-hero__actions">
              <Link className="aa-btn aa-btn--solid" to={`/platforms/${firstPlatform.slug}`}>
                {t('home.hero.ctaPrimary')}
                <Icon name="arrow" size={14} />
              </Link>
              <Link className="aa-btn aa-btn--ghost" to="/research">
                {t('home.hero.ctaSecondary')}
              </Link>
            </div>
          </div>

          <aside className="aa-card aa-news">
            <Eyebrow>{t('home.news.title')}</Eyebrow>
            <div className="aa-news__list">
              {NEWS.map((item) => (
                <article key={item.key} className="aa-news__item">
                  <span className="aa-dot aa-dot--sm aa-news__dot" style={{ background: item.color }} />
                  <div className="aa-news__body">
                    <div className="aa-news__meta aa-mono">
                      <span>{t(`home.news.dates.${item.key}`)}</span>
                      <span>{t(`home.news.kinds.${item.kind}`)}</span>
                    </div>
                    <div className="aa-news__title">
                      {t(`home.news.items.${item.key}`, {
                        count: item.count == null ? '' : n(item.count),
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>
        )}

        {/* ── The four layers ──────────────────────────────────── */}
        <section className="aa-shell aa-block">
          <SectionHeading title={t('home.platforms.title')} />
          <div className="aa-platforms">
            {/* Each card opens the Atlas's own introduction to that layer —
                what it measures, how its colours read, and from there the
                platform itself and the paper behind it. Sending a first-time
                visitor straight into an upstream viewer skipped all of that. */}
            {PLATFORMS.map((platform) => {
              // While the blog is unlisted, a card opens the layer's map.
              const post = BLOG_LISTED ? postForLayer(platform.id) : null;
              return (
                <Link
                  key={platform.id}
                  to={post ? `/blog/${post.slug}` : `/platforms/${platform.slug}`}
                  className="aa-card aa-lift aa-platform"
                >
                  <div className="aa-platform__text">
                    <div className="aa-platform__kicker">
                      <span className="aa-dot" style={{ background: platform.accent }} />
                      <span>{t(`home.platforms.themes.${platform.id}`)}</span>
                    </div>
                    <h3 className="aa-platform__name">{platform.name}</h3>
                    <p className="aa-platform__desc">{t(`home.platforms.desc.${platform.id}`)}</p>
                    <div className="aa-platform__foot">
                      <span className="aa-mono aa-platform__count">
                        {cityCounts &&
                          t('home.platforms.cityCount', { count: n(cityCounts[platform.id]) })}
                      </span>
                      <span className="aa-platform__open" style={{ color: platform.accent }}>
                        {post ? t('home.platforms.more') : t('home.platforms.explore')}
                        <Icon name="arrow" size={13} color={platform.accent} />
                      </span>
                    </div>
                  </div>

                  <div className="aa-platform__map">
                    <PlatformPreview platform={platform} cities={platformCities[platform.id]} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Compare cities ───────────────────────────────────── */}
        <section className="aa-shell aa-block">
          <SectionHeading title={t('home.table.title')} />
          <div className="aa-card aa-rank">
            <div className="aa-rank__grid">
              {rankings.map((ranking) => (
                <div key={ranking.minutes} className="aa-rank__col">
                  <Link
                    className="aa-rank__head"
                    to={`/stats?m=${RANKING_MEASURE}&s=share&t=${ranking.index}`}
                  >
                    <span className="aa-rank__minutes">
                      {t('home.table.within', { minutes: n(ranking.minutes) })}
                    </span>
                    <span className="aa-rank__mode">{t('home.table.onFoot')}</span>
                  </Link>
                  <ol className="aa-rank__list">
                    {ranking.rows.map((row, i) => (
                      <li key={row.id} className="aa-rank__row">
                        <span className="aa-mono aa-rank__pos">{n(i + 1)}</span>
                        <Link className="aa-rank__city" to={`/atlas/${row.id}?layer=fifteen`}>
                          {lang === 'it' ? row.nameIt ?? row.name : row.name}
                        </Link>
                        <span className="aa-rank__meter" aria-hidden="true">
                          <span
                            className="aa-rank__fill"
                            style={{ width: `${Math.min(100, row.share)}%`, background: fifteen?.accent }}
                          />
                        </span>
                        <span className="aa-mono aa-rank__value">
                          {n(row.share, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <div className="aa-table__foot">
              <span className="aa-table__note">
                {t('home.table.note', { population: n(RANKING_MIN_POPULATION) })}
              </span>
              <Link className="aa-table__cta" to="/stats">
                {t('home.table.statsCta')}
                <Icon name="arrow" size={13} color="currentColor" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Work in progress ─────────────────────────────────── */}
        <section className="aa-shell aa-block">
          <SectionHeading title={t('home.side.title')} />
          <div className="aa-side">
            {/* A project with a `url` has something to open — a live map, or
                the paper it produced — and links out; the rest are still
                cards, because there is nothing to open yet. */}
            {WORK_IN_PROGRESS.map((project) => {
              const body = (
                <>
                  <div className="aa-side__meta">
                    <span className="aa-dot aa-dot--sm" style={{ background: project.color }} />
                    {project.kind && <span>{t(`home.side.kinds.${project.kind}`)}</span>}
                  </div>
                  <h3 className="aa-side__name">{t(`home.side.items.${project.key}.name`)}</h3>
                  <p className="aa-side__desc">{t(`home.side.items.${project.key}.desc`)}</p>
                </>
              );

              return project.url ? (
                <a
                  key={project.key}
                  href={project.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="aa-card aa-lift aa-side__card aa-side__card--link"
                >
                  {body}
                </a>
              ) : (
                <article key={project.key} className="aa-card aa-lift aa-side__card">
                  {body}
                </article>
              );
            })}
          </div>
        </section>
    </>
  );
}
