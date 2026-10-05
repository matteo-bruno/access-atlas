// The BCP 47 locale for a language code, for code that formats outside React
// (src/data/osm.js, the blog's dates). Plain JS, so the Node scripts can
// import what imports it. Keep it equal to each dictionary's `meta.locale`.
const LOCALES = {
  en: 'en-GB',
  it: 'it-IT',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  // Western digits: every figure the maps and legends draw is in them, and a
  // panel in Arabic-Indic digits beside a legend in Western ones reads as two
  // different numbers.
  ar: 'ar-u-nu-latn',
};

export function localeFor(lang) {
  return LOCALES[lang] ?? LOCALES.en;
}
