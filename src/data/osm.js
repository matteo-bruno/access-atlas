// The OpenStreetMap extract the published layers were computed from. Every
// platform counts points of interest and walks streets from OSM, so this is the
// date a reader needs to judge whether a new school or a closed line is in the
// map. Formatted with Intl where it is shown, never written into the
// dictionaries.
export const OSM_UPDATED = '2026-01-29';

/** The extract date as dd/mm/yyyy, the form both locales read the same way. */
export function formatOsmDate(lang) {
  const [year, month, day] = OSM_UPDATED.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
