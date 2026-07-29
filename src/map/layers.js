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

// Markers grow with zoom so a world view stays readable without the dots
// swamping the map when you zoom into a region.
const RADIUS = ['interpolate', ['linear'], ['zoom'], 0, 2.4, 2, 4, 5, 7.5, 9, 13];
const RADIUS_DENSE = ['interpolate', ['linear'], ['zoom'], 0, 1.9, 2, 3.2, 5, 6, 9, 11];

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
      'circle-stroke-color': color,
      'circle-stroke-width': 1.6,
      'circle-stroke-opacity': 1,
    };
  }

  return {
    'circle-radius': radius,
    'circle-color': color,
    'circle-opacity': 0.9,
    'circle-stroke-color': 'rgba(255,255,255,0.55)',
    'circle-stroke-width': dense ? 0 : 0.8,
  };
}

/** Multi-hue dot palette for the home coverage map. */
export function atlasCirclePaint(scale) {
  return {
    'circle-radius': RADIUS_DENSE,
    'circle-color': [
      'match',
      ['%', ['get', 'paletteIndex'], scale.length],
      ...scale.flatMap((color, i) => [i, color]),
      scale[0],
    ],
    'circle-opacity': 0.9,
    'circle-stroke-color': 'rgba(255,255,255,0.5)',
    'circle-stroke-width': 0.6,
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
