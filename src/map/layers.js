// How the world maps draw a city marker, from a platform's colour scale.
//
// The world maps are drawn on a canvas by WorldMap.jsx (MapLibre cannot draw
// Equal Earth; see map/framing.js), so a marker's style is a plain function
// of the city and the zoom rather than a MapLibre expression. Keeping it
// declarative still means a new platform only needs an entry in
// data/platforms.js — no new component code.
//
// The zoom is MapLibre's (`worldZoom` in map/framing.js): the sizes below
// were tuned on MapLibre maps, and are kept the size they were.

import { ZONE_COLORS } from '../data/platforms.js';

/** Piecewise-linear interpolation over `[x, y]` stops, clamped at both ends. */
function interpolate(stops, x) {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [x1, y1] = stops[i];
    if (x <= x1) {
      const [x0, y0] = stops[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return stops[stops.length - 1][1];
}

/**
 * Which step of a platform's scale a value falls in. Continuous scales are
 * stepped by `stops` (scale[i] applies below stops[i]; the last colour
 * catches everything above); P.O.V.'s zones are categories, and the zone is
 * the index. Null for a city that has no value to place.
 */
function scaleIndex(platform, value) {
  if (!Number.isFinite(value)) return null;
  if (!platform.stops) {
    const zone = Math.trunc(value);
    return zone >= 0 && zone < ZONE_COLORS.length ? zone : ZONE_COLORS.length - 1;
  }
  let i = 0;
  while (i < platform.stops.length - 1 && value >= platform.stops[i]) i += 1;
  return Math.min(i, platform.scale.length - 1);
}

// Markers grow with zoom so a world view stays readable without the dots
// swamping the map when you zoom into a region.
const RADIUS = [[0, 2.4], [2, 4], [5, 7.5], [9, 13]];
const RADIUS_DENSE = [[0, 1.9], [2, 3.2], [5, 6], [9, 11]];

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
const MARKER_EDGE_WIDTH = [[0, 0.6], [5, 1], [9, 1.4]];

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

export function isPale(hex) {
  const [r, g, b] = rgbOf(hex).map((c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > PALE_LUMINANCE;
}

export function darkEdge(hex) {
  const mixed = rgbOf(hex).map((c, i) => Math.round(c + (INK[i] - c) * 0.6));
  return `rgb(${mixed.join(', ')})`;
}

// A city with no value on the open layer's scale. Not expected on a
// platform's own coverage, which only lists cities it measured.
const NO_VALUE = '#bdb8ab';

/**
 * A filled marker's edge: ink at half alpha, or for a pale step its own
 * colour darkened and a wider line.
 */
function filledEdge(color, zoom) {
  const pale = isPale(color);
  return {
    stroke: pale ? darkEdge(color) : MARKER_EDGE,
    strokeWidth: interpolate(MARKER_EDGE_WIDTH, zoom) + (pale ? 0.7 : 0),
  };
}

/**
 * A platform's city markers, as `(city, zoom) => style`.
 *
 * `ring` platforms (Car Dependency, P.O.V.) draw a hollow marker with a soft
 * halo, matching the design; the others draw filled dots.
 *
 * @returns {(city: object, zoom: number) => { radius: number, fill: string,
 *           fillOpacity: number, stroke: string, strokeWidth: number }}
 */
export function cityMarkerStyle(platform) {
  const radii = platform.coversAllCities ? RADIUS_DENSE : RADIUS;
  return (city, zoom) => {
    const index = scaleIndex(platform, city[platform.property]);
    const color = index == null ? NO_VALUE : platform.scale[index];
    const radius = interpolate(radii, zoom);
    if (platform.markerStyle === 'ring') {
      return {
        radius,
        fill: color,
        fillOpacity: 0.18,
        stroke: isPale(color) ? darkEdge(color) : color,
        strokeWidth: 1.6,
      };
    }
    return { radius, fill: color, fillOpacity: 0.92, ...filledEdge(color, zoom) };
  };
}

/**
 * Markers for the all-platforms world map, shaded by how many of the four
 * lenses a city has published data for. That is the one thing worth reading
 * off a map that mixes platforms: a decorative palette would say nothing, and
 * any single platform's scale would be a category error there.
 *
 * `scale[i]` is the colour for a city covered by i + 1 platforms.
 */
export function coverageMarkerStyle(scale) {
  return (city, zoom) => {
    const count = Math.min(scale.length, Math.max(1, Math.round(city.platformCount ?? 1)));
    const color = scale[count - 1];
    return {
      radius: interpolate(RADIUS_DENSE, zoom),
      fill: color,
      fillOpacity: 0.92,
      ...filledEdge(color, zoom),
    };
  };
}
