import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';
import it from './it.js';
import es from './es.js';
import fr from './fr.js';
import de from './de.js';
import pt from './pt.js';
import zh from './zh.js';
import ja from './ja.js';
import ko from './ko.js';
import ar from './ar.js';

// In the order the language menu lists them.
const DICTS = { en, it, es, fr, de, pt, zh, ja, ko, ar };
export const LANGS = Object.keys(DICTS);
// Each language's own name for itself, for the menu.
export const LANG_NAMES = Object.fromEntries(LANGS.map((code) => [code, DICTS[code].meta.name]));
const RTL = new Set(['ar']);
export const isRtl = (code) => RTL.has(code);
const STORAGE_KEY = 'access-atlas:lang';

const I18nCtx = createContext(null);

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTS[saved]) return saved;
  } catch {
    /* private mode — fall through to the browser preference */
  }
  const pref = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : '';
  return LANGS.find((code) => pref.startsWith(code)) ?? 'en';
}

// Walk a dotted path, e.g. resolve(dict, 'home.hero.lede').
function resolve(dict, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), dict);
}

// Replace {name} placeholders with values from `vars`. In a right-to-left
// language each value is wrapped in Unicode first-strong isolates (FSI…PDI):
// a value is a platform name, a figure or an address, and left to the
// surrounding Arabic its digits and punctuation reorder ("15-minute city"
// reads "minute city-15"). The isolates are invisible.
function interpolate(str, vars, rtl = false) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) return match;
    return rtl ? `\u2068${vars[key]}\u2069` : String(vars[key]);
  });
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
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
      if (typeof node === 'string') return interpolate(node, vars, isRtl(lang));
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
  return useCallback(
    () => setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]),
    [lang, setLang],
  );
}
