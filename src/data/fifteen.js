// 15minCity: the service categories and travel modes the platform measures.
//
// The harmonised H3 exports (Milan onward) store each measure as
// `<category>_<mode>` in minutes, with full-word keys: `services_foot`,
// `education_bicycle`, … plus `proximity_time_<mode>`, the average across all
// services. This replaced the legacy single-letter scheme (`a_f`, `d_a_f`),
// whose letter→label tables conflicted between files; no letter-keyed city is
// published any more, so the letters are gone rather than kept alongside.
//
// The legacy "difference vs. ideal city" fields (`d_*`) have no counterpart in
// the new exports, so the diff view went with them.
//
// Order matches the legacy selector, which leads with the average and then
// runs through the nine individual categories.

export const CATEGORIES = [
  { key: 'proximity_time', i18n: 'average' },
  { key: 'outdoor', i18n: 'outdoor' },
  { key: 'education', i18n: 'learning' },
  { key: 'supplies', i18n: 'supplies' },
  { key: 'restaurant', i18n: 'eating' },
  { key: 'transport', i18n: 'moving' },
  { key: 'culture', i18n: 'cultural' },
  { key: 'physical', i18n: 'exercise' },
  { key: 'services', i18n: 'services' },
  { key: 'healthcare', i18n: 'healthcare' },
];

export const MODES = [
  { key: 'foot', i18n: 'foot' },
  { key: 'bicycle', i18n: 'bike' },
];

/** Property name for a measure, e.g. `education_foot`. */
export function measureKey(category, mode) {
  return `${category}_${mode}`;
}

// Cycling is roughly three times walking speed, so one legend cannot serve
// both modes. Bands are in minutes; the last is open-ended.
export const BANDS = {
  foot: [3, 6, 9, 12, 15, 18, 21, 24, 30],
  bicycle: [1, 2, 3, 4, 5, 6, 7, 8, 10],
};

/**
 * A travel time as a clock reading: `m:ss`, or `mm:ss` past ten minutes.
 *
 * The exports carry decimal minutes — 3.99, 12.4 — which reads as a quantity
 * rather than as a duration. Nobody says "three point nine nine minutes to
 * the shops". The clock form is the same in both locales, so this is not
 * routed through Intl: only the separator would differ, and it does not.
 */
export function formatTime(minutes) {
  if (!Number.isFinite(minutes)) return null;
  const seconds = Math.max(0, Math.round(minutes * 60));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
