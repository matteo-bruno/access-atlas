// Home-page figures. Numbers live here (not in the dictionaries) so both
// locales format them with Intl — 10,142 in English, 10.142 in Italian.
//
// Figures about the published data are counted from the catalogue, not
// written here, so publishing a city needs no code change — nothing is an
// estimate, and nothing is carried over from the design mock.

import { BRAND } from './brand.js';

/**
 * The Atlas by the numbers, counted from a (normalised) catalogue.
 *
 * Nothing renders these at the moment: the landing and the home page both
 * dropped their list of them — counting the Atlas on the way in said nothing
 * a reader could act on. Putting the list back is one block of JSX over this.
 * Cities count places: a metro area whose core is published is the same
 * place on a wider boundary, and scenarios are not cities at all. Cells count
 * every published layer of every city, metro areas included. Researchers is
 * editorial.
 */
export function atlasMetrics(catalogue) {
  // A version 3 catalogue states its totals (counted by buildIndex the same
  // way as below), because it no longer carries the cities to count.
  if (catalogue?.totals) {
    const { cities, countries, cells } = catalogue.totals;
    return [
      { key: 'cities', value: cities },
      { key: 'platforms', value: 4 },
      { key: 'countries', value: countries },
      { key: 'cells', value: cells },
      { key: 'researchers', value: 7 },
    ];
  }
  const all = catalogue?.atlas?.cities ?? [];
  const ids = new Set(all.map((city) => city.id));
  const cities = all.filter((city) => city.extent !== 'fua' || !ids.has(city.core));
  const rows = Object.values(catalogue?.platforms ?? {}).flatMap((p) => p.cities ?? []);
  return [
    { key: 'cities', value: cities.length },
    { key: 'platforms', value: 4 },
    { key: 'countries', value: new Set(cities.map((c) => c.country).filter(Boolean)).size },
    { key: 'cells', value: rows.reduce((sum, row) => sum + (row.cells ?? 0), 0) },
    { key: 'researchers', value: 7 },
  ];
}

export const NEWS = [
  { key: 'atlas', kind: 'data', color: BRAND.navy },
  { key: 'pov', kind: 'paper', color: BRAND.navy },
  { key: 'cdi', kind: 'release', color: BRAND.magenta, count: 22 },
];

// "Compare cities" on the home page: three rankings of the published
// statistics (src/data/stats.js), the share of a city's residents within 5,
// 10 and 15 minutes on foot of the services on average. Read from the same
// figure objects the Stats page draws, so the two cannot disagree, and
// filtered the way the Stats page opens: cores only (a metro area includes
// its core's residents), never a city hidden for thin data, and at least
// RANKING_MIN_POPULATION residents, so a small town at 100% does not top a
// list of capitals.
export const RANKING_MEASURE = 'fifteen.proximity_time.foot';
export const RANKING_MINUTES = [5, 10, 15];
export const RANKING_MIN_POPULATION = 1000000;
export const RANKING_LENGTH = 5;

/**
 * One ranking per threshold in RANKING_MINUTES that the measure publishes:
 * `{ minutes, index, rows: [{ id, name, nameIt, share }] }`, best first.
 * `index` is the threshold's position in the measure's shares, which is
 * also what the Stats page's `t=` names. Empty when nothing is published.
 */
export function cityRankings(stats) {
  const measure = stats?.measuresById?.[RANKING_MEASURE];
  if (!measure) return [];
  const column = stats.values[RANKING_MEASURE] ?? [];
  const cities = stats.cities
    .map((city, i) => ({ city, stat: column[i] }))
    .filter(
      ({ city, stat }) =>
        stat &&
        city.extent !== 'fua' &&
        !city.hidden &&
        (city.population ?? 0) >= RANKING_MIN_POPULATION,
    );
  return RANKING_MINUTES.map((minutes) => ({ minutes, index: measure.thresholds?.indexOf(minutes) ?? -1 }))
    .filter(({ index }) => index >= 0)
    .map(({ minutes, index }) => ({
      minutes,
      index,
      rows: cities
        .map(({ city, stat }) => ({ id: city.id, name: city.name, nameIt: city.nameIt, share: stat.shares?.[index] }))
        .filter((row) => Number.isFinite(row.share))
        .sort((a, b) => b.share - a.share)
        .slice(0, RANKING_LENGTH),
    }));
}

// Work in progress — the lines of research running alongside the four
// published layers. A `url` marks one that has something to open: a live map,
// or the paper it produced. `kind` says which, so the card can label the link
// honestly rather than calling a preprint a platform. The rest have neither
// yet, and say nothing rather than claiming a status nobody can check.
export const WORK_IN_PROGRESS = [
  { key: 'shade', color: '#d57b66' },
  {
    key: 'weight',
    color: BRAND.navy,
    kind: 'live',
    url: 'https://mat701.github.io/3D-maps/weight-urban.html',
  },
  { key: 'odMatrices', color: BRAND.cyan },
  {
    key: 'bikeLanes',
    color: '#3b8a4f',
    kind: 'paper',
    // Basilone R. et al. (2025), J. Phys. Complexity 6, 035008 — see
    // src/data/research.js, which carries the same DOI.
    url: 'https://doi.org/10.1088/2632-072X/adf683',
  },
  {
    key: 'co2',
    color: '#a04640',
    kind: 'paper',
    // Marzolla F. et al. (2026), npj Sustainable Mobility and Transport 3, 7.
    url: 'https://doi.org/10.1038/s44333-025-00074-0',
  },
  { key: 'quality', color: BRAND.magenta },
];
