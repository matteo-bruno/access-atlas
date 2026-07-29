// Home-page figures. Numbers live here (not in the dictionaries) so both
// locales format them with Intl — 10,142 in English, 10.142 in Italian.

import { BRAND } from './brand.js';

export const ATLAS_METRICS = [
  { key: 'cities', value: 10142 },
  { key: 'platforms', value: 4 },
  { key: 'countries', value: 182 },
  { key: 'researchers', value: 14 },
  // A year, not a quantity — must not get a thousands separator.
  { key: 'founded', value: 2018, raw: true },
];

export const NEWS = [
  { key: 'pov', kind: 'paper', color: BRAND.navy },
  { key: 'cdi', kind: 'release', color: BRAND.magenta, count: 19 },
  { key: 'fifteen', kind: 'data', color: BRAND.cyan, count: 428 },
];

// "By the numbers" — six cities, three measures.
// proximity: minutes on foot · opportunity: thousands of jobs · inclusion: %
export const CITY_TABLE = [
  { id: 'paris', name: 'Paris', nameIt: 'Parigi', proximity: 8.2, opportunity: 14.6, inclusion: 38 },
  {
    id: 'barcelona',
    name: 'Barcelona',
    nameIt: 'Barcellona',
    proximity: 9.1,
    opportunity: 11.2,
    inclusion: 34,
  },
  { id: 'vienna', name: 'Vienna', nameIt: 'Vienna', proximity: 8.8, opportunity: 12.4, inclusion: 36 },
  { id: 'berlin', name: 'Berlin', nameIt: 'Berlino', proximity: 10.4, opportunity: 10.8, inclusion: 28 },
  {
    id: 'new-york',
    name: 'New York',
    nameIt: 'New York',
    proximity: 12.1,
    opportunity: 13.5,
    inclusion: 22,
  },
  { id: 'rome', name: 'Rome', nameIt: 'Roma', proximity: 11.3, opportunity: 8.7, inclusion: 18 },
];

// Bar scaling for the table meters, matching the design's proportions.
export const TABLE_SCALE = {
  proximity: (v) => Math.min(v * 7, 100),
  opportunity: (v) => v * 5,
  inclusion: (v) => v * 2.4,
};

export const SIDE_PROJECTS = [
  { key: 'whatif', name: 'whatif-machine', color: '#9CA0A6' },
  { key: 'heat', color: '#d57b66' },
  { key: 'a11y', color: BRAND.cyan },
  { key: 'sound', color: BRAND.magenta },
];
