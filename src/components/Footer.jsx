import { Link } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { Icon } from './Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import { PLATFORMS } from '../data/platforms.js';
import { CONTACT } from '../data/team.js';
import './Footer.css';

// The design shows four short link columns. A label with no destination is
// rendered as plain text — the columns only promise what exists.
export function Footer() {
  const { t } = useI18n();

  // Destinations by position, so the dictionaries stay pure labels and the
  // translations cannot drift away from the routes.
  const researchTo = ['/research', '/research', '/blog', '/faq'];
  const aboutTo = ['/sustainable-cities', '/contact', '/contact', '/consulting', '/work-with-us'];
  const touchHref = [CONTACT.codeUrl, null];

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
      links: t('footer.researchLinks').map((label, i) => ({ label, to: researchTo[i] })),
    },
    {
      key: 'about',
      heading: t('footer.about'),
      links: t('footer.aboutLinks').map((label, i) => ({ label, to: aboutTo[i] })),
    },
    {
      key: 'touch',
      heading: t('footer.touch'),
      links: t('footer.touchLinks').map((label, i) => ({ label, href: touchHref[i] })),
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
          <Link className="aa-footer__work" to="/work-with-us">
            {t('footer.workCta')}
            <Icon name="arrow" size={13} color="currentColor" />
          </Link>
        </div>

        {columns.map((column) => (
          <div key={column.key} className="aa-footer__col">
            <div className="aa-eyebrow">{column.heading}</div>
            <div className="aa-footer__links">
              {column.links.map((link) => {
                if (link.to) {
                  return (
                    <Link key={link.label} to={link.to} className="aa-footer__link">
                      {link.label}
                    </Link>
                  );
                }
                if (link.href) {
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      className="aa-footer__link"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <span key={link.label} className="aa-footer__link">
                    {link.label}
                  </span>
                );
              })}
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
