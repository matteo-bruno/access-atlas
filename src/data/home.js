// Home-page figures. Numbers live here (not in the dictionaries) so both
// locales format them with Intl — 10,142 in English, 10.142 in Italian.
//
// Every figure below is counted from the datasets published under
// public/data/. `npm run build:data` recomputes them when the data changes and
// prints the values it derived — nothing here is an estimate, and nothing is
// carried over from the design mock.

import { BRAND } from './brand.js';

export const ATLAS_METRICS = [
  // 20 distinct cities across the four platforms' datasets.
  { key: 'cities', value: 20 },
  { key: 'platforms', value: 4 },
  // AT CH DE ES FR IT PT SE US
  { key: 'countries', value: 9 },
  // Cells across all 42 published city datasets, scenario variants included
  // (pov 47,902 · cardep 96,846 · fifteen 7,498 · citychrone 1,741).
  { key: 'cells', value: 153987 },
  { key: 'researchers', value: 7 },
];

export const NEWS = [
  { key: 'atlas', kind: 'data', color: BRAND.navy },
  { key: 'pov', kind: 'paper', color: BRAND.navy },
  { key: 'cdi', kind: 'release', color: BRAND.magenta, count: 22 },
];

// "By the numbers" — six cities from the published P.O.V. datasets.
//
// proximity/opportunity: median score per cell — weighted counts of reachable
// points of interest, not minutes or jobs. inclusion: share of cells above
// both population-weighted medians, in %.
export const CITY_TABLE = [
  {
    id: 'paris',
    name: 'Paris',
    nameIt: 'Parigi',
    proximity: 16899.8,
    opportunity: 48266.8,
    inclusion: 36.9,
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    nameIt: 'Barcellona',
    proximity: 7649.9,
    opportunity: 16876.5,
    inclusion: 31.5,
  },
  {
    id: 'berlin',
    name: 'Berlin',
    nameIt: 'Berlino',
    proximity: 4627.9,
    opportunity: 25813.4,
    inclusion: 30.1,
  },
  {
    id: 'vienna',
    name: 'Vienna',
    nameIt: 'Vienna',
    proximity: 4941.2,
    opportunity: 21104.6,
    inclusion: 25.8,
  },
  {
    id: 'new-york',
    name: 'New York',
    nameIt: 'New York',
    proximity: 5714.8,
    opportunity: 24840.2,
    inclusion: 22.9,
  },
  { id: 'rome', name: 'Rome', nameIt: 'Roma', proximity: 643.6, opportunity: 2656.6, inclusion: 12.9 },
];

// Bar scaling for the table meters. Denominators are just above the maximum in
// the table so the widest bar nearly fills its track.
export const TABLE_SCALE = {
  proximity: (v) => Math.min((v / 17500) * 100, 100),
  opportunity: (v) => Math.min((v / 50000) * 100, 100),
  inclusion: (v) => Math.min(v * 2.4, 100),
};

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
