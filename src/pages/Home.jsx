import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow, SectionHeading } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { AtlasMap } from '../map/AtlasMap.jsx';
import { AtlasCityLayer } from '../components/CityLayer.jsx';
import { PlatformPreview } from '../components/PlatformPreview.jsx';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS } from '../data/platforms.js';
import { useAtlasCities } from '../data/useAtlasData.js';
import { CITIES, citiesForPlatform } from '../data/cities.js';
import { ATLAS_METRICS, CITY_TABLE, NEWS, SIDE_PROJECTS, TABLE_SCALE } from '../data/home.js';
import { BRAND } from '../data/brand.js';
import './Home.css';

export default function Home() {
  const { t, n, lang } = useI18n();
  const firstPlatform = PLATFORMS[0];
  // Cities published on the shared grid, so the combined viewer can draw every
  // platform from one mesh. Empty until one is — the CTA appears with the data.
  const atlasCities = useAtlasCities();

  const platformCities = useMemo(
    () => Object.fromEntries(PLATFORMS.map((p) => [p.id, citiesForPlatform(p)])),
    [],
  );

  return (
    <div className="aa-page">
      <Nav active="atlas" />

      <main className="aa-main" id="main">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="aa-shell aa-hero">
          <div className="aa-hero__lead">
            <Eyebrow>{t('home.hero.eyebrow')}</Eyebrow>
            <h1 className="aa-hero__headline">
              {t('home.hero.headline')}{' '}
              <span className="aa-hero__accent">{t('home.hero.headlineAccent')}</span>
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

        {/* ── Atlas metrics ────────────────────────────────────── */}
        <section className="aa-shell">
          <div className="aa-card aa-metrics">
            {ATLAS_METRICS.map((metric) => (
              <div key={metric.key} className="aa-metrics__item">
                <div className="aa-metrics__value">
                  {metric.raw ? metric.value : n(metric.value)}
                </div>
                <div className="aa-metrics__label">{t(`home.metrics.${metric.key}`)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── §01 Coverage map ─────────────────────────────────── */}
        <section className="aa-shell aa-block">
          <SectionHeading
            tag={t('home.coverage.tag')}
            title={t('home.coverage.title')}
            hint={t('home.coverage.hint')}
          />
          <div className="aa-card aa-coverage">
            <div className="aa-coverage__canvas">
              <AtlasMap
                fitWorldWidth
                center={[10, 20]}
                interactive={false}
                label={t('home.coverage.badge', { count: n(10142) })}
              >
                <AtlasCityLayer cities={CITIES} interactive={false} />
              </AtlasMap>

              <div className="aa-map-badge aa-coverage__badge">
                {t('home.coverage.badge', { count: n(10142) })}
              </div>

              <div className="aa-map-badge aa-coverage__legend">
                {[
                  ['opportunity', BRAND.navy],
                  ['proximity', BRAND.magenta],
                  ['comparison', BRAND.cyan],
                ].map(([key, color]) => (
                  <span key={key} className="aa-coverage__legenditem">
                    <span className="aa-dot" style={{ background: color }} />
                    {t(`home.coverage.legend.${key}`)}
                  </span>
                ))}
              </div>
            </div>

            {/* The combined viewer is what this section's title describes, so
                the way in belongs here. Listed per city, because being on the
                shared grid is a property of the city, not of the site. */}
            {atlasCities.length > 0 && (
              <div className="aa-coverage__foot">
                <p className="aa-coverage__note">{t('home.coverage.combined')}</p>
                <div className="aa-coverage__links">
                  {atlasCities.map((city) => (
                    <Link key={city.id} className="aa-coverage__cta" to={`/atlas/${city.id}`}>
                      {lang === 'it' ? (city.nameIt ?? city.name) : city.name}
                      <Icon name="arrow" size={13} color="currentColor" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── §02 The four platforms ───────────────────────────── */}
        <section className="aa-shell aa-block">
          <SectionHeading
            tag={t('home.platforms.tag')}
            title={t('home.platforms.title')}
            hint={t('home.platforms.hint')}
          />
          <div className="aa-platforms">
            {/* Each card opens the platform's own live site — the upstream
                platforms show more cities than the Atlas has republished. The
                Atlas's own views are reached from §01 above (the combined
                viewer) and from the Platforms nav. */}
            {PLATFORMS.map((platform) => (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noreferrer noopener"
                className="aa-card aa-lift aa-platform"
              >
                <div className="aa-platform__text">
                  <div className="aa-platform__kicker">
                    <span className="aa-dot" style={{ background: platform.accent }} />
                    <span>
                      {platform.tag} · {t(`home.platforms.themes.${platform.id}`)}
                    </span>
                  </div>
                  <h3 className="aa-platform__name">{platform.name}</h3>
                  <p className="aa-platform__desc">{t(`home.platforms.desc.${platform.id}`)}</p>
                  <div className="aa-platform__foot">
                    <span className="aa-mono aa-platform__count">
                      {t('home.platforms.cityCount', { count: n(platform.cityCount) })}
                    </span>
                    <span className="aa-platform__open" style={{ color: platform.accent }}>
                      {t('home.platforms.open')}
                      <Icon name="arrow" size={13} color={platform.accent} />
                    </span>
                  </div>
                </div>

                <div className="aa-platform__map">
                  <PlatformPreview platform={platform} cities={platformCities[platform.id]} />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── §03 By the numbers ───────────────────────────────── */}
        <section className="aa-shell aa-block">
          <SectionHeading
            tag={t('home.table.tag')}
            title={t('home.table.title')}
            hint={t('home.table.hint')}
          />
          <div className="aa-card aa-table">
            <div className="aa-table__head">
              <div>{t('home.table.headers.city')}</div>
              <div>{t('home.table.headers.proximity')}</div>
              <div>{t('home.table.headers.opportunity')}</div>
              <div>{t('home.table.headers.inclusion')}</div>
            </div>
            {CITY_TABLE.map((row) => (
              <div key={row.id} className="aa-table__row">
                <div className="aa-table__city">{lang === 'it' ? row.nameIt : row.name}</div>

                <MeterCell
                  width={TABLE_SCALE.proximity(row.proximity)}
                  color={BRAND.magenta}
                  value={n(row.proximity, { minimumFractionDigits: 1 })}
                  max={140}
                />
                <MeterCell
                  width={TABLE_SCALE.opportunity(row.opportunity)}
                  color={BRAND.navy}
                  value={n(row.opportunity, { minimumFractionDigits: 1 })}
                  max={140}
                />
                <MeterCell
                  width={TABLE_SCALE.inclusion(row.inclusion)}
                  color={BRAND.cyan}
                  value={`${n(row.inclusion)}%`}
                  max={200}
                  wide
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Pull quote ───────────────────────────────────────── */}
        <section className="aa-shell aa-quote">
          <Eyebrow>{t('home.quote.eyebrow')}</Eyebrow>
          <blockquote className="aa-quote__body">
            {t('home.quote.before')}
            <em className="aa-quote__accent">{t('home.quote.accent')}</em>
            {t('home.quote.after')}
            <footer className="aa-quote__attribution">{t('home.quote.attribution')}</footer>
          </blockquote>
        </section>

        {/* ── §04 Side projects ────────────────────────────────── */}
        <section className="aa-shell aa-block">
          <SectionHeading tag={t('home.side.tag')} title={t('home.side.title')} />
          <div className="aa-side">
            {/* A project with a `url` is live and links out; the rest are
                still cards, because there is nothing to open yet. */}
            {SIDE_PROJECTS.map((project) => {
              const body = (
                <>
                  <div className="aa-side__meta">
                    <span className="aa-dot aa-dot--sm" style={{ background: project.color }} />
                    <span>{t(`home.side.items.${project.key}.status`)}</span>
                  </div>
                  <h3 className="aa-side__name">
                    {project.name ?? t(`home.side.items.${project.key}.name`)}
                  </h3>
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
      </main>

      <Footer />
    </div>
  );
}

function MeterCell({ width, color, value, max, wide = false }) {
  return (
    <div className="aa-table__cell">
      <div className={`aa-meter${wide ? ' aa-meter--wide' : ''}`} style={{ maxWidth: max }}>
        <div
          className="aa-meter__fill"
          style={{ width: `${Math.min(width, 100)}%`, background: color }}
        />
      </div>
      <span className="aa-mono aa-table__value">{value}</span>
    </div>
  );
}
