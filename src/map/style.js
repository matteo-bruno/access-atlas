// MapLibre style construction.
//
// World views draw the Atlas's own "paper" basemap: a flat background, a
// graticule and simplified land polygons (Natural Earth 110m, bundled at
// public/data/world-land.geojson). No tile server, no API key, no network — it
// matches the approved design and works offline.
//
// City views ask for `basemap: true` and get raster tiles underneath instead.
// Natural Earth 110m has nothing to say at city zoom — the whole viewport sits
// inside a single land polygon — so a cell mesh would float on a blank field
// with no streets or place names to locate it against.
//
// Tiles come from a third party, so they are a build-time decision rather than
// something baked in: VITE_TILE_URL replaces the template, and
// VITE_TILE_URL=none switches them off entirely, which is how the test suites
// and any offline or air-gapped build run — city maps then fall back to paper.
// VITE_MAP_STYLE (a full MapLibre style JSON) overrides everything.

import { PAPER } from '../data/brand.js';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const LAND_URL = asset('data/world-land.geojson');

export const EXTERNAL_STYLE = import.meta.env.VITE_MAP_STYLE || null;

// CARTO Positron: a light, low-chroma OSM basemap that sits under the Atlas's
// palette without competing with it. Attribution is required and rendered by
// MapLibre's attribution control (see AtlasMap).
const DEFAULT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
const TILE_OVERRIDE = import.meta.env.VITE_TILE_URL || null;
const TILE_URL = TILE_OVERRIDE === 'none' ? null : (TILE_OVERRIDE ?? DEFAULT_TILE_URL);
const TILE_ATTRIBUTION =
  import.meta.env.VITE_TILE_ATTRIBUTION || '© OpenStreetMap contributors © CARTO';

/**
 * Whether a map with these options draws third-party tiles, and so must show
 * their attribution. World views never do: the paper basemap is the approved
 * design and reads correctly at that scale.
 */
export function usesTiles({ basemap = false } = {}) {
  if (EXTERNAL_STYLE) return true;
  return basemap && Boolean(TILE_URL);
}

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
 * @param {boolean} [options.basemap]   draw raster tiles (city views)
 */
export function paperStyle({
  graticule: withGraticule = true,
  paper = PAPER.mapPaper,
  basemap = false,
} = {}) {
  if (usesTiles({ basemap })) {
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
        // Kept below the tiles: if they fail to load — offline, blocked host,
        // provider down — the map degrades to the paper background with the
        // mesh on top rather than to a void.
        { id: 'paper', type: 'background', paint: { 'background-color': paper } },
        {
          id: 'basemap',
          type: 'raster',
          source: 'basemap',
          paint: {
            // Warm the tiles toward the Atlas paper palette and mute them, so
            // the data layer stays the thing you read first.
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
