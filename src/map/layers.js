// Paint expressions that turn a platform's colour scale into MapLibre styling.
// Keeping these declarative means a new platform only needs an entry in
// data/platforms.js — no new component code.

import { ZONE_COLORS } from '../data/platforms.js';

/**
 * Continuous scale → a `step` expression.
 * scale[i] applies below stops[i]; the last colour catches everything above.
 */
export function stepColor(property, scale, stops) {
  const expr = ['step', ['get', property], scale[0]];
  for (let i = 0; i < stops.length - 1; i++) {
    expr.push(stops[i], scale[Math.min(i + 1, scale.length - 1)]);
  }
  return expr;
}

/** Categorical zone index → colour. */
export function zoneColor(property = 'zone') {
  const expr = ['match', ['get', property]];
  ZONE_COLORS.forEach((color, i) => expr.push(i, color));
  expr.push(ZONE_COLORS[ZONE_COLORS.length - 1]);
  return expr;
}

export function colorExpression(platform) {
  if (!platform.stops) return zoneColor(platform.property);
  return stepColor(platform.property, platform.scale, platform.stops);
}

/**
 * The same lookup as `colorExpression`, returning `values[i]` wherever the
 * marker would be drawn in `platform.scale[i]`. Lets an edge colour or width
 * follow the fill it surrounds.
 */
function perScaleValue(platform, values) {
  if (!platform.stops) {
    const expr = ['match', ['get', platform.property]];
    values.forEach((value, i) => expr.push(i, value));
    expr.push(values[values.length - 1]);
    return expr;
  }
  return stepColor(platform.property, values, platform.stops);
}

// Markers grow with zoom so a world view stays readable without the dots
// swamping the map when you zoom into a region.
const RADIUS = ['interpolate', ['linear'], ['zoom'], 0, 2.4, 2, 4, 5, 7.5, 9, 13];
const RADIUS_DENSE = ['interpolate', ['linear'], ['zoom'], 0, 1.9, 2, 3.2, 5, 6, 9, 11];

// Every filled marker carries a hairline of ink rather than of white.
//
// Both scales run pale at one end — 15minCity's near-15-minute band and the
// merged map's one-platform grey — and a pale dot with a white edge on this
// paper is a smudge with a lighter smudge around it: the marker that most
// needs an outline is exactly the one a white outline cannot give. Ink at low
// alpha reads against the paper and disappears into a dark dot, so the same
// value works at both ends of every scale. Kept thin enough that it draws the
// edge rather than the dot.
const MARKER_EDGE = 'rgba(21, 23, 26, 0.5)';
const MARKER_EDGE_WIDTH = ['interpolate', ['linear'], ['zoom'], 0, 0.6, 5, 1, 9, 1.4];

// A hairline at half alpha was still not enough for the palest steps (a slow
// CityChrone city, a balanced CDI, a one-platform city on the coverage map),
// which sit within a few percent of the paper's own lightness. Those get an
// edge of their own colour taken most of the way to ink, and a wider one, so
// the dot keeps its hue and gains an outline. Every other colour keeps what it
// had.
const INK = [21, 23, 26];
const PALE_LUMINANCE = 0.6;

function rgbOf(hex) {
  const v = Number.parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function isPale(hex) {
  const [r, g, b] = rgbOf(hex).map((c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > PALE_LUMINANCE;
}

function darkEdge(hex) {
  const mixed = rgbOf(hex).map((c, i) => Math.round(c + (INK[i] - c) * 0.6));
  return `rgb(${mixed.join(', ')})`;
}

/** Edge colours for a scale: pale steps darkened, the rest `otherwise(color)`. */
function edgeColours(scale, otherwise) {
  return scale.map((color) => (isPale(color) ? darkEdge(color) : otherwise(color)));
}

/** 1 for a pale step, 0 otherwise. */
function paleFlags(scale) {
  return scale.map((color) => (isPale(color) ? 1 : 0));
}

/** MARKER_EDGE_WIDTH, widened where `paleFlag` (an expression, 0 or 1) is 1. */
function edgeWidth(paleFlag) {
  const widen = (w) => ['+', w, ['*', paleFlag, 0.7]];
  return ['interpolate', ['linear'], ['zoom'], 0, widen(0.6), 5, widen(1), 9, widen(1.4)];
}

/**
 * Circle paint for a platform's city markers.
 * `ring` platforms (Car Dependency, P.O.V.) draw a hollow marker with a soft
 * halo, matching the design; the others draw filled dots.
 */
export function cityCirclePaint(platform, { hoveredId = null } = {}) {
  const color = colorExpression(platform);
  const dense = platform.coversAllCities;
  const base = dense ? RADIUS_DENSE : RADIUS;

  const radius = hoveredId == null
    ? base
    : ['case', ['==', ['get', 'id'], hoveredId], ['*', base, 1.45], base];

  if (platform.markerStyle === 'ring') {
    return {
      'circle-radius': radius,
      'circle-color': color,
      'circle-opacity': 0.18,
      'circle-stroke-color': perScaleValue(platform, edgeColours(platform.scale, (c) => c)),
      'circle-stroke-width': 1.6,
      'circle-stroke-opacity': 1,
    };
  }

  return {
    'circle-radius': radius,
    'circle-color': color,
    'circle-opacity': 0.92,
    'circle-stroke-color': perScaleValue(platform, edgeColours(platform.scale, () => MARKER_EDGE)),
    'circle-stroke-width': edgeWidth(perScaleValue(platform, paleFlags(platform.scale))),
  };
}

/**
 * Markers for the all-platforms world map, shaded by how many of the four
 * lenses a city has published data for. That is the one thing worth reading
 * off a map that mixes platforms: a decorative palette would say nothing, and
 * any single platform's scale would be a category error there.
 */
export function coverageCountPaint(scale) {
  // scale[i] is the colour for a city covered by i + 1 platforms.
  const stops = scale.flatMap((color, i) => [i + 1, color]);
  // Counts are whole numbers, so each city lands on one step exactly.
  const perCount = (values) => [
    'match',
    ['get', 'platformCount'],
    ...values.flatMap((value, i) => [i + 1, value]),
    values[values.length - 1],
  ];
  return {
    'circle-radius': RADIUS_DENSE,
    'circle-color': ['interpolate', ['linear'], ['get', 'platformCount'], ...stops],
    'circle-opacity': 0.92,
    'circle-stroke-color': perCount(edgeColours(scale, () => MARKER_EDGE)),
    'circle-stroke-width': edgeWidth(perCount(paleFlags(scale))),
  };
}

/** Fill paint for a city hex mesh, coloured by P.O.V. zone. */
export function meshFillPaint({ selectedId = null } = {}) {
  return {
    'fill-color': zoneColor('zone'),
    'fill-opacity':
      selectedId == null
        ? 0.88
        : ['case', ['==', ['id'], selectedId], 1, 0.55],
    'fill-outline-color': 'rgba(0,0,0,0)',
  };
}
