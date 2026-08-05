import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';
import { useI18n } from '../i18n/index.jsx';
import './Nav.css';

const GITHUB_URL = 'https://github.com/sony-csl-rome';

export function Nav({ active = 'atlas', sticky = true }) {
  const { t, lang, setLang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const items = [
    { key: 'atlas', to: '/', label: t('nav.atlas') },
    { key: 'platforms', to: '/platforms', label: t('nav.platforms') },
    { key: 'research', to: '/research', label: t('nav.research') },
    { key: 'blog', to: '/blog', label: t('nav.blog') },
    { key: 'faq', to: '/faq', label: t('nav.faq') },
    { key: 'contact', to: '/contact', label: t('nav.contact') },
  ];

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className={`aa-nav${sticky ? ' aa-nav--sticky' : ''}`}>
      <Link to="/" className="aa-nav__brand" aria-label={t('nav.title')}>
        <Logo variant="symbol" tone="color" height={22} alt="Sony CSL" />
        <span className="aa-nav__brandtext">
          <span className="aa-nav__title">{t('nav.title')}</span>
          <span className="aa-nav__tagline">{t('nav.tagline')}</span>
        </span>
      </Link>

      <nav className="aa-nav__links" aria-label={t('nav.title')}>
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `aa-nav__link${isActive || active === item.key ? ' aa-nav__link--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="aa-nav__tools">
        <a
          className="aa-chip aa-nav__github"
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          <Icon name="github" size={14} />
          {t('nav.github')}
        </a>

        <div className="aa-nav__lang" role="group" aria-label="Language">
          {['en', 'it'].map((code, index) => (
            <span key={code}>
              {index > 0 && <span className="aa-nav__langsep">·</span>}
              <button
                type="button"
                className={`aa-nav__langbtn${lang === code ? ' aa-nav__langbtn--active' : ''}`}
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            </span>
          ))}
        </div>

        <div className="aa-nav__menu" ref={menuRef}>
          <button
            type="button"
            className="aa-nav__menubtn"
            aria-expanded={menuOpen}
            aria-label={t('nav.openMenu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={18} />
          </button>
          {menuOpen && (
            <div className="aa-nav__drawer">
              {items.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.to === '/'}
                  className="aa-nav__draweritem"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <a
                className="aa-nav__draweritem"
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('nav.github')}
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
