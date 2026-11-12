// Close & Connected's two scores on one map: a continuous bivariate colour.
//
// Each axis is a score's rank among the layer's own residents, 0 to 1: the
// share of the city's residents who live in a cell scoring lower. Ranks
// rather than the scores themselves for two reasons. The two scores run on
// different scales (Rome's median resident's proximity is 2,590, its
// opportunity 9,435), and a rank puts them on one. And the middle of each
// axis is then the population-weighted median, which is exactly where the
// layer's zones split a city: the bivariate map is the four zones without
// the four edges, each corner the extreme of one zone.
//
// The colour is the bilinear mix of four corners. Low on both is the paper's
// own pale, so a place with little within reach recedes; proximity alone is
// light blue and opportunity alone pink, two hues far apart so the mixed
// cases read; both together is deep indigo, where the two meet. Checked for
// colour blindness with Machado et al.'s (2009) simulation: the two
// one-score corners stay ΔE 40 apart for deuteranopia and 20 for
// protanopia, where they differ mostly in lightness.
//
// Ranks, like the zones, compare places within a city, not cities: the
// same colour in two cities is the same rank, not the same score.

import { colorAt } from './ramps.js';

// [low on both, proximity only, opportunity only, high on both]
export const BIVARIATE_CORNERS = ['#f3f1e4', '#2fa4dc', '#e8609f', '#2f2a6e'];

// How finely an axis follows the residents: a point every 5% of them.
const STEPS = 20;

const parse = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const CORNERS = BIVARIATE_CORNERS.map(parse);

/**
 * One axis: the score at every 5% of the layer's residents, as
 * `[score, rank]` pairs ascending in both. Scores shared by several
 * percentiles (a city where many people score zero) are one pair, at the
 * middle of the ranks they span, so the expression's stops stay strictly
 * ascending and a tie reads as the rank in the middle of it. Null when
 * nobody is counted.
 *
 * @param {number[]} values   the score per cell
 * @param {number[]} weights  the layer's residents per cell
 */
export function bivariateAxis(values, weights) {
  const pairs = [];
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const weight = weights ? weights[i] : 1;
    if (!Number.isFinite(value) || !(weight > 0)) continue;
    pairs.push([value, weight]);
    total += weight;
  }
  if (!pairs.length) return null;
  pairs.sort((a, b) => a[0] - b[0]);
  const quantiles = [];
  let acc = 0;
  let at = 0;
  for (let step = 0; step <= STEPS; step++) {
    const q = step / STEPS;
    if (step === 0) {
      quantiles.push([pairs[0][0], 0]);
      continue;
    }
    while (at < pairs.length - 1 && acc + pairs[at][1] < q * total) {
      acc += pairs[at][1];
      at++;
    }
    quantiles.push([pairs[at][0], q]);
  }
  quantiles[quantiles.length - 1] = [pairs[pairs.length - 1][0], 1];
  // Ties: one stop per score, at the middle of its ranks.
  const axis = [];
  for (let i = 0; i < quantiles.length; ) {
    let j = i;
    while (j + 1 < quantiles.length && quantiles[j + 1][0] === quantiles[i][0]) j++;
    axis.push([quantiles[i][0], (quantiles[i][1] + quantiles[j][1]) / 2]);
    i = j + 1;
  }
  return axis;
}

/** A score's rank on an axis, 0 to 1, read the way the map's expression reads it. */
export function rankOn(axis, value) {
  if (!axis?.length || !Number.isFinite(value)) return null;
  if (axis.length === 1 || value <= axis[0][0]) return axis[0][1];
  for (let i = 1; i < axis.length; i++) {
    const [x1, r1] = axis[i];
    if (value <= x1) {
      const [x0, r0] = axis[i - 1];
      return r0 + ((r1 - r0) * (value - x0)) / (x1 - x0 || 1);
    }
  }
  return axis[axis.length - 1][1];
}

/** The MapLibre expression for a score's rank on an axis. */
export function rankExpression(axis, value) {
  if (axis.length === 1) return axis[0][1];
  return ['interpolate', ['linear'], value, ...axis.flat()];
}

// One channel of the bilinear mix: x is opportunity's rank, y proximity's.
const channel = (c, x, y) =>
  CORNERS[0][c] * (1 - x) * (1 - y) +
  CORNERS[1][c] * (1 - x) * y +
  CORNERS[2][c] * x * (1 - y) +
  CORNERS[3][c] * x * y;

/** The colour of a pair of ranks, as `#rrggbb`. */
export function bivariateColor(proximityRank, opportunityRank) {
  const x = Math.min(Math.max(opportunityRank ?? 0, 0), 1);
  const y = Math.min(Math.max(proximityRank ?? 0, 0), 1);
  return `#${[0, 1, 2]
    .map((c) => Math.round(channel(c, x, y)).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * The MapLibre colour expression: the same bilinear mix, one channel at a
 * time, on the two ranks' expressions.
 */
export function bivariateExpression(proximityRank, opportunityRank) {
  const x = opportunityRank;
  const y = proximityRank;
  const one = (e) => ['-', 1, e];
  const terms = (c) => [
    '+',
    ['*', CORNERS[0][c], one(x), one(y)],
    ['*', CORNERS[1][c], one(x), y],
    ['*', CORNERS[2][c], x, one(y)],
    ['*', CORNERS[3][c], x, y],
  ];
  return ['rgb', terms(0), terms(1), terms(2)];
}

/** A score ramp's colour, for anything drawn outside MapLibre (the scatter). */
export const scoreColor = (ramp, value) => (Number.isFinite(value) ? colorAt(ramp, value) : null);
