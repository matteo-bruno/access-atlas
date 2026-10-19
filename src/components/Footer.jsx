import { Link } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { Icon } from './Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import { BLOG_LISTED } from '../data/blog.js';
import './Footer.css';

// The design shows four short link columns. A label with no destination is
// rendered as plain text — the columns only promise what exists.
export function Footer() {
  const { t } = useI18n();

  // Destinations by position, so the dictionaries stay pure labels and the
  // translations cannot drift away from the routes.
  const researchTo = ['/research', '/research', '/blog', '/faq'];
  // The blog is kept off the footer while it is off the nav (BLOG_LISTED).
  const hiddenTo = new Set(BLOG_LISTED ? [] : ['/blog']);
  const platformTo = ['/platforms', '/citychat', '/stats'];
  const aboutTo = ['/sustainable-cities', '/contact', '/consulting'];
  const touchTo = ['/contact', '/work-with-us'];

  const columns = [
    {
      key: 'platforms',
      heading: t('footer.platforms'),
      links: t('footer.platformLinks').map((label, i) => ({ label, to: platformTo[i] })),
    },
    {
      key: 'research',
      heading: t('footer.research'),
      links: t('footer.researchLinks')
        .map((label, i) => ({ label, to: researchTo[i] }))
        .filter((link) => !hiddenTo.has(link.to)),
    },
    {
      key: 'about',
      heading: t('footer.about'),
      links: t('footer.aboutLinks').map((label, i) => ({ label, to: aboutTo[i] })),
    },
    {
      key: 'touch',
      heading: t('footer.touch'),
      links: t('footer.touchLinks').map((label, i) => ({ label, to: touchTo[i] })),
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
      </div>
    </footer>
  );
}
