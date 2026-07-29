// MapLibre style construction.
//
// By default the Atlas draws its own "paper" basemap: a flat background, a
// graticule and simplified land polygons (Natural Earth 110m, bundled at
// public/data/world-land.geojson). No tile server, no API key, no network — it
// matches the approved design exactly and works offline.
//
// Point VITE_MAP_STYLE at a full MapLibre style JSON, or VITE_TILE_URL at a
// raster tile template, to swap in a real basemap without touching components.

import { PAPER } from '../data/brand.js';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const LAND_URL = asset('data/world-land.geojson');

export const EXTERNAL_STYLE = import.meta.env.VITE_MAP_STYLE || null;
const TILE_URL = import.meta.env.VITE_TILE_URL || null;
const TILE_ATTRIBUTION = import.meta.env.VITE_TILE_ATTRIBUTION || '© OpenStreetMap contributors';

// Meridians and parallels every `step` degrees, as a GeoJSON line collection.
function graticule(step = 30) {
  const features = [];
  for (let lon = -180; lon <= 180; lon += step) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [lon, -85],
          [lon, 85],
        ],
      },
    });
  }
  for (let lat = -60; lat <= 60; lat += step) {
    const line = [];
    for (let lon = -180; lon <= 180; lon += 10) line.push([lon, lat]);
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } });
  }
  return { type: 'FeatureCollection', features };
}

/**
 * @param {object} [options]
 * @param {boolean} [options.graticule] draw meridians/parallels (world views only)
 * @param {string}  [options.paper]     background colour override
 */
export function paperStyle({ graticule: withGraticule = true, paper = PAPER.mapPaper } = {}) {
  if (TILE_URL) {
    return {
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
          tiles: [TILE_URL],
          tileSize: 256,
          attribution: TILE_ATTRIBUTION,
        },
      },
      layers: [
        { id: 'paper', type: 'background', paint: { 'background-color': paper } },
        {
          id: 'basemap',
          type: 'raster',
          source: 'basemap',
          paint: {
            // Warm the tiles toward the Atlas paper palette.
            'raster-saturation': -0.55,
            'raster-contrast': -0.12,
            'raster-brightness-min': 0.08,
            'raster-opacity': 0.85,
          },
        },
      ],
    };
  }

  const sources = {
    land: { type: 'geojson', data: LAND_URL },
  };
  const layers = [{ id: 'paper', type: 'background', paint: { 'background-color': paper } }];

  if (withGraticule) {
    sources.graticule = { type: 'geojson', data: graticule(30) };
    layers.push({
      id: 'graticule',
      type: 'line',
      source: 'graticule',
      paint: { 'line-color': 'rgba(0,0,0,0.05)', 'line-width': 0.6 },
    });
  }

  layers.push(
    { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': PAPER.mapLand, 'fill-opacity': 0.9 } },
    {
      id: 'land-outline',
      type: 'line',
      source: 'land',
      paint: { 'line-color': PAPER.mapLandLine, 'line-width': 0.7 },
    },
  );

  return { version: 8, sources, layers };
}

export function resolveStyle(options) {
  return EXTERNAL_STYLE ?? paperStyle(options);
}

// Layers added by components sit above the basemap; this is the id they are
// inserted before when a style already carries its own overlays.
export const OVERLAY_ANCHOR = undefined;
