// Continuous colour ramps for the combined viewer.
//
// Every measure except P.O.V.'s zones is a continuous quantity, so it is
// coloured by interpolation rather than cut into bands: a step scale invents
// boundaries the data does not have, and makes two cells either side of an
// edge look further apart than two cells at opposite ends of one band.
// P.O.V. keeps its four categories, which are genuinely categorical.
//
// **Domains are fixed, not fitted to the data.** A ramp rescaled per city or
// per hour would recolour the same value differently depending on what else is
// on screen, which is exactly what makes maps uncomparable. Each domain below
// is a round number chosen to cover the published range, stated with the
// measurements it was checked against.
//
// A ramp is `{ stops, unit, ticks, beyond }`:
//   stops   [value, colour] pairs, ascending — the interpolation itself
//   ticks   values to label on the legend bar (defaults to first/last)
//   legendTo  clip the *legend* below the last stop, where the tail is real
//             but rare and would otherwise squash the informative part
//   beyond  { value, color, label } for a tail the bar does not show

import { BRAND } from '../data/brand.js';

export const RAMPS = {
  // 15minCity — one scale for every category and mode, so a colour means the
  // same number of minutes wherever you see it. White sits at 15 minutes, the
  // reference the platform is named for: blue is inside it, red outside.
  // Published Milan measures run 0–80 min (99th percentile 38).
  fifteen: {
    stops: [
      [0, '#2b5f86'],
      [7.5, '#93b8cf'],
      [15, '#ffffff'],
      [22.5, '#c96a4e'],
      [30, '#8a2c1c'],
      [120, '#140b08'],
    ],
    unit: 'min',
    legendTo: 30,
    ticks: [0, 7.5, 15, 22.5, 30],
    beyond: { value: 120, color: '#140b08' },
  },

  // CityChrone velocity score, after the upstream site's own ramp: cyan →
  // blue → violet → magenta → red → brown. Domain 0–12 km/h-like, as the
  // platform publishes it; Milan's 24 hours span 0.62–8.60.
  velocity: {
    stops: [
      [0, '#d7fbf5'],
      [1, '#7ff0e8'],
      [2, '#85c0ef'],
      [3, '#6f8ef0'],
      [4, '#5f5cf0'],
      [5, '#7b4fc0'],
      [6, '#b04fe0'],
      [7, '#f050f0'],
      [8, '#f0a0b0'],
      [9, '#e8707a'],
      [10, '#ef4a52'],
      [12, '#7a4a4a'],
    ],
    unit: 'km/h',
    ticks: [0, 3, 6, 9, 12],
  },

  // CityChrone sociality score — reachable people, weighted. Red (few) through
  // yellow to blue (many), after the upstream ramp. Domain 0–700k; Milan's 24
  // hours top out at 666,987.
  sociality: {
    stops: [
      [0, '#d1596a'],
      [87500, '#e8785e'],
      [175000, '#f2a86b'],
      [262500, '#f7d894'],
      [350000, '#fbfbc0'],
      [437500, '#dcefa0'],
      [525000, '#b7e2a8'],
      [612500, '#8fd0b0'],
      [700000, '#7fa9d0'],
    ],
    ticks: [0, 175000, 350000, 525000, 700000],
  },

  // Travel time from one cell, by public transport. Green near, yellow around
  // the hour, red beyond. The published matrices cap at 180 minutes.
  isochrone: {
    stops: [
      [0, '#1a7d3f'],
      [20, '#63b45c'],
      [40, '#b8d96a'],
      [60, '#f2e05a'],
      [90, '#e08a3c'],
      [120, '#b32222'],
      [180, '#5e1111'],
    ],
    unit: 'min',
    legendTo: 120,
    ticks: [0, 30, 60, 90, 120],
    beyond: { value: 180, color: '#5e1111' },
  },

  // Residents per cell, from the 15minCity export. Population is heavy-tailed
  // — Milan's cells run 0 to 3,443 with a median of 251 — so a linear ramp
  // would put almost every cell in the first colour. Coloured on log10(1+pop);
  // the legend labels the counts, not the logarithm.
  population: {
    log: true,
    stops: [
      [0, '#f2ede1'],
      [10, '#cfd9da'],
      [100, '#8fb0cc'],
      [500, '#4a7fb8'],
      [1500, '#2b4a86'],
      [3500, BRAND.navy],
    ],
    ticks: [0, 50, 500, 3500],
  },

  // Car Dependency Index, bounded by its definition at ±1. Diverging about 0,
  // where a car and public transport reach the same amount.
  cdi: {
    stops: [
      [-1, '#2b5f86'],
      [-0.3, '#8fb0cc'],
      [0, '#eae6da'],
      [0.3, '#c26a52'],
      [0.6, '#a04640'],
      [1, '#5e1a0d'],
    ],
    ticks: [-1, -0.5, 0, 0.5, 1],
    signed: true,
  },
};

/** The value expression a ramp reads, wrapped for log ramps. */
function rampInput(ramp, value) {
  // log10(1 + x) keeps zero-population cells on the scale instead of sending
  // them to −Infinity.
  return ramp.log ? ['log10', ['+', 1, ['max', value, 0]]] : value;
}

function rampStops(ramp) {
  return ramp.log
    ? ramp.stops.map(([v, color]) => [Math.log10(1 + Math.max(v, 0)), color])
    : ramp.stops;
}

/**
 * A MapLibre `interpolate` expression for a ramp.
 *
 * @param {object} ramp     one of RAMPS
 * @param {Array}  value    expression yielding the measure
 * @param {Array}  [fallback] expression that is true where the cell has no
 *                 value; those cells are not coloured at all rather than
 *                 taking the ramp's first colour.
 */
export function rampColor(ramp, value) {
  const stops = rampStops(ramp).flat();
  return ['interpolate', ['linear'], rampInput(ramp, value), ...stops];
}

/**
 * Where a value sits along a ramp's legend bar, as a percentage. Log ramps
 * place both the gradient and its tick labels by the same projection — the
 * bar and the numbers under it have to agree.
 */
export function rampPosition(ramp, value) {
  const [from, to] = legendRange(ramp);
  if (!ramp.log) return ((value - from) / ((to - from) || 1)) * 100;
  const lf = Math.log10(1 + Math.max(from, 0));
  const lt = Math.log10(1 + Math.max(to, 0));
  return ((Math.log10(1 + Math.max(value, 0)) - lf) / ((lt - lf) || 1)) * 100;
}

/** CSS gradient mirroring a ramp over the range its legend bar shows. */
export function rampGradient(ramp) {
  const [from, to] = legendRange(ramp);
  const project = (v) => rampPosition(ramp, v);
  const inside = ramp.stops.filter(([v]) => v >= from && v <= to);
  // A ramp clipped for the legend still needs the colour it has reached at the
  // clip, or the bar would end on the wrong hue.
  if (inside.length === 0 || inside[inside.length - 1][0] < to) {
    inside.push([to, colorAt(ramp, to)]);
  }
  const parts = inside.map(([v, color]) => `${color} ${project(v).toFixed(1)}%`);
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

/**
 * CSS gradient for the tail a ramp keeps going into past its legend bar —
 * 30 to 120 minutes for 15-minute city, 120 to 180 for the isochrones.
 *
 * The bar shows the range nearly every cell sits in; stretching it to the
 * maximum would squash that range to nothing. The tail is drawn beside it,
 * compressed, so the colours past the end are still on the legend instead of
 * being described in a sentence.
 */
export function rampTailGradient(ramp) {
  if (!ramp.beyond) return null;
  const [, from] = legendRange(ramp);
  const to = ramp.beyond.value;
  const inside = ramp.stops.filter(([v]) => v > from && v <= to);
  const parts = [[from, colorAt(ramp, from)], ...inside].map(
    ([v, color]) => `${color} ${(((v - from) / (to - from || 1)) * 100).toFixed(1)}%`,
  );
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

/** The value range a ramp's legend bar covers. */
export function legendRange(ramp) {
  const values = ramp.stops.map(([v]) => v);
  return [values[0], ramp.legendTo ?? values[values.length - 1]];
}

/** Linear interpolation of a ramp's colour at one value, for the legend. */
export function colorAt(ramp, value) {
  const stops = rampStops(ramp);
  const x = ramp.log ? Math.log10(1 + Math.max(value, 0)) : value;
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [x1, c1] = stops[i];
    if (x <= x1) {
      const [x0, c0] = stops[i - 1];
      return mixHex(c0, c1, (x - x0) / (x1 - x0 || 1));
    }
  }
  return stops[stops.length - 1][1];
}

function mixHex(a, b, t) {
  const parse = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const mix = (x, y) => Math.round(x + (y - x) * Math.min(Math.max(t, 0), 1));
  return `#${[mix(ar, br), mix(ag, bg), mix(ab, bb)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}
