import { localeFor } from '../i18n/locales.js';

// The OpenStreetMap extract the published layers were computed from. Every
// platform counts points of interest and walks streets from OSM, so this is the
// date a reader needs to judge whether a new school or a closed line is in the
// map. Formatted with Intl where it is shown, never written into the
// dictionaries.
export const OSM_UPDATED = '2026-01-29';

/** The extract date as numbers only (dd/mm/yyyy, or yyyy/mm/dd in Japanese). */
export function formatOsmDate(lang) {
  const [year, month, day] = OSM_UPDATED.split('-').map(Number);
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
