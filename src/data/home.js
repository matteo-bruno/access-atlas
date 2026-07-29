// Home-page figures. Numbers live here (not in the dictionaries) so both
// locales format them with Intl — 10,142 in English, 10.142 in Italian.
//
// Every figure below is counted from the datasets published under
// public/data/. `npm run build:data` recomputes them when the data changes and
// prints the values it derived — nothing here is an estimate, and nothing is
// carried over from the design mock.

import { BRAND } from './brand.js';

export const ATLAS_METRICS = [
  // 20 distinct cities across the P.O.V. and Car Dependency datasets.
  { key: 'cities', value: 20 },
  { key: 'platforms', value: 4 },
  // AT, CH, DE, ES, FR, IT, PT, SE, US — plus Boston/Chicago/Seattle in the US.
  { key: 'countries', value: 10 },
  // 47,902 P.O.V. + 85,437 Car Dependency cells.
  { key: 'cells', value: 133339 },
  { key: 'researchers', value: 7 },
];

export const NEWS = [
  { key: 'pov', kind: 'paper', color: BRAND.navy },
  { key: 'cdi', kind: 'release', color: BRAND.magenta, count: 21 },
  { key: 'fifteen', kind: 'data', color: BRAND.cyan, count: 18 },
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

export const SIDE_PROJECTS = [
  { key: 'whatif', name: 'whatif-machine', color: '#9CA0A6' },
  { key: 'heat', color: '#d57b66' },
  { key: 'a11y', color: BRAND.cyan },
  { key: 'sound', color: BRAND.magenta },
];
