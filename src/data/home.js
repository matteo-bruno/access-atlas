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

// "Compare cities" on the home page: six cities, picked editorially, on
// three P.O.V. figures read from its published compare rows (never written
// here): the median resident's proximity and opportunity scores (weighted
// counts of reachable points of interest, not minutes or jobs), and the
// share of residents in the inclusion zone. A city with no P.O.V. row is
// left out rather than shown with a number nobody computed.
export const CITY_TABLE = ['paris', 'barcelona', 'berlin', 'vienna', 'new-york', 'rome'];

/**
 * The table's rows from P.O.V.'s compare rows (`usePlatformSummary('pov')`),
 * in CITY_TABLE's order, and each meter's full width: just above the
 * largest value shown, so the widest bar nearly fills its track.
 */
export function cityTableRows(summaryRows) {
  const byId = new Map((summaryRows ?? []).map((row) => [row.id, row]));
  const rows = CITY_TABLE.map((id) => byId.get(id))
    .filter(Boolean)
    .map((row) => ({
      id: row.id,
      profile: row.profile,
      proximity: row.medianProximity,
      opportunity: row.medianOpportunity,
      inclusion: row.zonePopulationShares?.[0] ?? null,
    }));
  const top = (key) => Math.max(1e-9, ...rows.map((row) => row[key] ?? 0)) * 1.03;
  return { rows, scale: { proximity: top('proximity'), opportunity: top('opportunity'), inclusion: top('inclusion') } };
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
