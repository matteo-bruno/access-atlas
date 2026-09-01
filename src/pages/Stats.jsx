import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow, SectionHeading } from '../components/SectionHeading.jsx';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS } from '../data/platforms.js';
import { usePlatformHasSummary } from '../data/useAtlasData.js';
import './Prose.css';

/**
 * Where cities will be compared.
 *
 * Deliberately empty: the screen that compares every city on every measure is
 * not built, and a page of plausible-looking figures would be worse than a
 * page that says so. What already exists — the per-platform comparisons, each
 * computed from that platform's published summary — is linked from here, so
 * the tab is a way in rather than a dead end.
 */
export default function Stats() {
  const { t } = useI18n();

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-prose__intro">
          <Eyebrow>{t('stats.eyebrow')}</Eyebrow>
          <h1 className="aa-prose__headline">{t('stats.headline')}</h1>
          <p className="aa-prose__lede">{t('stats.lede')}</p>
        </section>

        <section className="aa-shell aa-block">
          <div className="aa-card aa-prose__empty">
            <span className="aa-dot aa-prose__emptydot" />
            <div>
              <div className="aa-prose__emptytitle">{t('stats.emptyTitle')}</div>
              <p className="aa-prose__emptybody">{t('stats.emptyBody')}</p>
            </div>
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('stats.availableTitle')} hint={t('stats.availableHint')} />
          <div className="aa-prose__list">
            {PLATFORMS.map((platform) => (
              <ComparisonCard key={platform.id} platform={platform} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/**
 * One platform's comparison, if it has published the summary that screen reads.
 * A platform without one is not listed as "coming": it is simply not here.
 */
function ComparisonCard({ platform }) {
  const { t } = useI18n();
  const hasSummary = usePlatformHasSummary(platform.id);
  if (!hasSummary) return null;

  return (
    <Link className="aa-card aa-lift aa-prose__card" to={`/platforms/${platform.slug}/compare`}>
      <Eyebrow>{t(`home.platforms.themes.${platform.id}`)}</Eyebrow>
      <h3 className="aa-prose__cardtitle">{platform.name}</h3>
      <p className="aa-prose__carddesc">{t(`stats.compare.${platform.id}`)}</p>
    </Link>
  );
}
