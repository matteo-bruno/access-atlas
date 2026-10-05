// The BCP 47 locale for a language code, for code that formats outside React
// (src/data/osm.js, the blog's dates). Plain JS, so the Node scripts can
// import what imports it.
const LOCALES = { en: 'en-GB', it: 'it-IT', ja: 'ja-JP' };

export function localeFor(lang) {
  return LOCALES[lang] ?? LOCALES.en;
}
