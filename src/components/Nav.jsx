import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';
import { LANGS, LANG_NAMES, isRtl, useI18n } from '../i18n/index.jsx';
import './Nav.css';

const GITHUB_URL = 'https://github.com/sony-csl-rome';

export function Nav({ active = 'atlas', sticky = true }) {
  const { t, lang, setLang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const items = [
    { key: 'atlas', to: '/', label: t('nav.atlas') },
    { key: 'platforms', to: '/platforms', label: t('nav.platforms') },
    { key: 'stats', to: '/stats', label: t('nav.stats') },
    { key: 'about', to: '/sustainable-cities', label: t('nav.about') },
    { key: 'consulting', to: '/consulting', label: t('nav.consulting') },
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

        <LangMenu lang={lang} setLang={setLang} label={t('nav.language')} />

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

// The language switcher: the current language's code, and the full list only
// when asked for. Each name is written in its own language and script, so a
// reader finds theirs without reading the one on screen.
function LangMenu({ lang, setLang, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="aa-nav__lang" ref={ref}>
      <button
        type="button"
        className="aa-nav__langtoggle"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${label}: ${LANG_NAMES[lang]}`}
        onClick={() => setOpen((value) => !value)}
      >
        {lang.toUpperCase()}
        <Icon name="chevronDown" size={12} />
      </button>
      {open && (
        <ul className="aa-nav__langlist" aria-label={label}>
          {LANGS.map((code) => (
            <li key={code}>
              <button
                type="button"
                lang={code}
                dir={isRtl(code) ? 'rtl' : 'ltr'}
                data-lang={code}
                className={`aa-nav__langbtn${lang === code ? ' aa-nav__langbtn--active' : ''}`}
                aria-current={lang === code ? 'true' : undefined}
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
              >
                {LANG_NAMES[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
