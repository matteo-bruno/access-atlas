import { Link } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS } from '../data/platforms.js';
import './Footer.css';

// The design shows four short link columns. Only the platform column has
// destinations today; the rest stay as plain labels until those pages exist,
// which is exactly how the approved design renders them.
export function Footer() {
  const { t } = useI18n();

  const columns = [
    {
      key: 'platforms',
      heading: t('footer.platforms'),
      links: PLATFORMS.map((platform) => ({
        label: platform.name,
        to: `/platforms/${platform.slug}`,
      })),
    },
    {
      key: 'research',
      heading: t('footer.research'),
      links: t('footer.researchLinks').map((label) => ({ label })),
    },
    {
      key: 'about',
      heading: t('footer.about'),
      links: t('footer.aboutLinks').map((label) => ({ label })),
    },
    {
      key: 'touch',
      heading: t('footer.touch'),
      links: t('footer.touchLinks').map((label) => ({ label })),
    },
  ];

  return (
    <footer className="aa-footer">
      <div className="aa-footer__grid">
        <div className="aa-footer__about">
          <div className="aa-footer__brand">
            <Logo variant="symbol" tone="color" height={19} alt="Sony CSL" />
            <span className="aa-footer__brandname">{t('nav.title')}</span>
          </div>
          <p className="aa-footer__desc">{t('footer.description')}</p>
        </div>

        {columns.map((column) => (
          <div key={column.key} className="aa-footer__col">
            <div className="aa-eyebrow">{column.heading}</div>
            <div className="aa-footer__links">
              {column.links.map((link) =>
                link.to ? (
                  <Link key={link.label} to={link.to} className="aa-footer__link">
                    {link.label}
                  </Link>
                ) : (
                  <span key={link.label} className="aa-footer__link">
                    {link.label}
                  </span>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="aa-footer__bar">
        <span>{t('footer.copyright')}</span>
        <span className="aa-mono aa-footer__version">{t('footer.version')}</span>
      </div>
    </footer>
  );
}
