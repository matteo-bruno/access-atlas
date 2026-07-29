// The four Atlas platforms. Colours, legend scales and coverage counts are the
// approved design values; `slug` drives routing, `i18n` points at the copy keys.

import { BRAND } from './brand.js';

export const PLATFORMS = [
  {
    id: 'fifteen',
    slug: '15min-city',
    tag: '01',
    name: '15min-City',
    theme: 'Proximity',
    themeKey: 'proximity',
    accent: '#b94e3b',
    cityCount: 10142,
    // Diverging scale: cool = close, warm = far. Index i covers stops[i].
    scale: [
      '#3b6e8f',
      '#6c93b1',
      '#9ab9cf',
      '#cfd9da',
      '#e9b6a3',
      '#d57b66',
      '#b94e3b',
      '#8a2c1c',
      '#5e1a0d',
    ],
    // Upper bound in minutes for each scale step.
    stops: [3, 6, 9, 12, 15, 18, 21, 24, 30],
    property: 'proximityMinutes',
    markerStyle: 'dot',
    coversAllCities: true,
  },
  {
    id: 'citychrone',
    slug: 'citychrone',
    tag: '02',
    name: 'CityChrone++',
    theme: 'Opportunity',
    themeKey: 'opportunity',
    accent: BRAND.navy,
    cityCount: 42,
    scale: ['#d9dfe9', BRAND.cyan, BRAND.navy],
    stops: [0.34, 0.67, 1],
    property: 'velocityScore',
    markerStyle: 'dot',
    coversAllCities: false,
  },
  {
    id: 'cardep',
    slug: 'car-dependency-index',
    tag: '03',
    name: 'Car Dependency Index',
    theme: 'Comparison',
    themeKey: 'comparison',
    accent: '#a04640',
    cityCount: 19,
    scale: ['#4a7fb8', '#cfd2c8', '#a04640', '#7a2e29'],
    stops: [1.5, 2.5, 3.5, 6],
    property: 'cdi',
    markerStyle: 'ring',
    coversAllCities: false,
    studyOnly: true,
  },
  {
    id: 'pov',
    slug: 'accessibility-pov',
    tag: '04',
    name: 'Urban Accessibility P.O.V.',
    theme: 'Synthesis',
    themeKey: 'synthesis',
    accent: BRAND.navy,
    cityCount: 19,
    // Categorical, not a ramp — index matches ZONES below.
    scale: ['#3b8a4f', BRAND.cyan, '#e0a23a', '#c54a3a'],
    stops: null,
    property: 'zone',
    markerStyle: 'ring',
    coversAllCities: false,
    studyOnly: true,
    hasCityPages: true,
  },
];

export const PLATFORMS_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));
export const PLATFORMS_BY_SLUG = Object.fromEntries(PLATFORMS.map((p) => [p.slug, p]));

// P.O.V. zone taxonomy — shared by the platform legend, the Rome city page and
// the worker that classifies the hex mesh.
export const ZONES = [
  { id: 'inclusion', key: 'inclusion', color: '#3b8a4f' },
  { id: 'spatial', key: 'spatial', color: BRAND.cyan },
  { id: 'social', key: 'social', color: '#e0a23a' },
  { id: 'total', key: 'total', color: '#c54a3a' },
];

export const ZONE_COLORS = ZONES.map((z) => z.color);

// Atlas-wide dot palette used on the home coverage map.
export const ATLAS_SCALE = [BRAND.navy, BRAND.cyan, BRAND.magenta];

export function platformBySlug(slug) {
  return PLATFORMS_BY_SLUG[slug] ?? null;
}
