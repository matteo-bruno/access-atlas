// 15minCity: the service categories and travel modes the platform measures.
//
// Upstream stores each measure as `<category>_<mode>` in minutes — `a_f` is
// average accessibility on foot — with `d_<category>_<mode>` holding the
// difference against the "ideal city" scenario.
//
// The single-letter keys are not mnemonic and the legacy `script.php` carries
// two conflicting letter→label tables; the mapping below is the live one,
// verified against the dropdowns the site actually rendered. The stale table
// assigns different categories to the same letters — `d` is Supplies there and
// Healthcare here — so do not take a letter's meaning from that file.
//
// Order matches the legacy selector, which leads with the average and then
// runs through the nine individual categories.

export const CATEGORIES = [
  { key: 'a', i18n: 'average' },
  { key: 'e', i18n: 'outdoor' },
  { key: 'c', i18n: 'learning' },
  { key: 'i', i18n: 'supplies' },
  { key: 'g', i18n: 'eating' },
  { key: 'l', i18n: 'moving' },
  { key: 'b', i18n: 'cultural' },
  { key: 'f', i18n: 'exercise' },
  { key: 'h', i18n: 'services' },
  { key: 'd', i18n: 'healthcare' },
];

export const MODES = [
  { key: 'f', i18n: 'foot' },
  { key: 'b', i18n: 'bike' },
];

/** Property name for a measure, or its difference against the ideal city. */
export function measureKey(category, mode, view = 'value') {
  return view === 'diff' ? `d_${category}_${mode}` : `${category}_${mode}`;
}

// Cycling is roughly three times walking speed, so one legend cannot serve
// both modes. Bands are in minutes; the last is open-ended.
export const BANDS = {
  f: [3, 6, 9, 12, 15, 18, 21, 24, 30],
  b: [1, 2, 3, 4, 5, 6, 7, 8, 10],
};

// Differences are signed: negative means the real city already beats the
// ideal-city scenario at that cell.
export const DIFF_BANDS = [-20, -10, -5, 0, 5, 10, 20, 40, 80];
