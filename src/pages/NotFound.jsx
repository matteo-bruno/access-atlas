import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { useI18n } from '../i18n/index.jsx';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="aa-page">
      <main className="aa-main aa-shell" id="main" style={{ padding: '96px var(--page-pad)' }}>
        <Eyebrow>{t('notFound.eyebrow')}</Eyebrow>
        <h1
          style={{
            margin: '18px 0 20px',
            // The display face, like every other page's title. One weight
            // only — see --font-serif in tokens.css.
            fontFamily: 'var(--font-serif)',
            fontSize: 54,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {t('notFound.headline')}{' '}
          <span className="aa-accent">{t('notFound.headlineAccent')}</span>
        </h1>
        <p style={{ maxWidth: 520, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          {t('notFound.lede')}
        </p>
        <Link className="aa-btn aa-btn--solid" to="/" style={{ marginTop: 28 }}>
          {t('notFound.cta')}
          <Icon name="arrow" size={14} />
        </Link>
      </main>
      <Footer />
    </div>
  );
}
