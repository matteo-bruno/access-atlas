import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';
import it from './it.js';

const DICTS = { en, it };
export const LANGS = Object.keys(DICTS);
const STORAGE_KEY = 'access-atlas:lang';

const I18nCtx = createContext(null);

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTS[saved]) return saved;
  } catch {
    /* private mode — fall through to the browser preference */
  }
  const pref = typeof navigator !== 'undefined' ? navigator.language : '';
  return pref && pref.toLowerCase().startsWith('it') ? 'it' : 'en';
}

// Walk a dotted path, e.g. resolve(dict, 'home.hero.lede').
function resolve(dict, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), dict);
}

// Replace {name} placeholders with values from `vars`.
function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* nothing to do — the choice just won't survive a reload */
    }
  }, [lang]);

  const value = useMemo(() => {
    const dict = DICTS[lang];
    const locale = dict.meta.locale;
    const numberFmt = new Intl.NumberFormat(locale);

    // t('a.b.c') → string; t('a.b.c', { count: 3 }) fills {count}.
    // Returns arrays/objects untouched so list copy (FAQ items, legends) can
    // live in the same dictionary.
    const t = (path, vars) => {
      let node = resolve(dict, path);
      if (node === undefined) {
        node = resolve(en, path);
        if (import.meta.env.DEV) {
          console.warn(`[i18n] missing "${path}" for "${lang}" — fell back to English`);
        }
      }
      if (typeof node === 'string') return interpolate(node, vars);
      return node;
    };

    return {
      lang,
      setLang,
      locale,
      t,
      n: (value, options) =>
        options ? new Intl.NumberFormat(locale, options).format(value) : numberFmt.format(value),
    };
  }, [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

// Convenience for the very common `const { t } = useI18n()` case.
export function useT() {
  return useI18n().t;
}

export function useLangToggle() {
  const { lang, setLang } = useI18n();
  return useCallback(() => setLang(lang === 'en' ? 'it' : 'en'), [lang, setLang]);
}
