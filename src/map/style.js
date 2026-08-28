// MapLibre style construction.
//
// World views draw the Atlas's own "paper" basemap: a flat background, a
// graticule and simplified land polygons (Natural Earth 110m, bundled at
// public/data/world-land.geojson). No tile server, no API key, no network — it
// matches the approved design and works offline.
//
// City views ask for `basemap: true` and get a real basemap underneath
// instead. Natural Earth 110m has nothing to say at city zoom — the whole
// viewport sits inside a single land polygon — so a cell mesh would float on a
// blank field with no streets or place names to locate it against.
//
// The city basemap comes from a third party, so it is a build-time decision
// rather than something baked in. One switch: VITE_BASEMAP_STYLE names a
// MapLibre style, and `none` turns city basemaps off entirely — which is how
// the test suites and any offline or air-gapped build run, city maps then
// falling back to paper.

import { PAPER } from '../data/brand.js';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const LAND_URL = asset('data/world-land.geojson');

// OpenFreeMap's Positron: a light, low-chroma OSM basemap that sits under the
// Atlas's palette without competing with it. Vector rather than raster, and
// served without an API key or an account — which is what the rest of this
// codebase assumes, and what CARTO's basemaps stopped being. Attribution
// travels inside the style's own sources and is rendered by MapLibre's
// attribution control (see AtlasMap).
const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_OVERRIDE = import.meta.env.VITE_BASEMAP_STYLE || null;

export const CITY_STYLE_URL =
  STYLE_OVERRIDE === 'none' ? null : (STYLE_OVERRIDE ?? DEFAULT_STYLE_URL);

/**
 * Whether a map with these options draws a third-party basemap, and so must
 * show its attribution. World views never do: the paper basemap is the
 * approved design and reads correctly at that scale.
 */
export function usesTiles({ basemap = false } = {}) {
  return basemap && Boolean(CITY_STYLE_URL);
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
 * The Atlas's own basemap — no network, no key, works offline.
 *
 * @param {object} [options]
 * @param {boolean} [options.graticule] draw meridians/parallels (world views only)
 * @param {string}  [options.paper]     background colour override
 */
export function paperStyle({ graticule: withGraticule = true, paper = PAPER.mapPaper } = {}) {
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

/**
 * The style a map should use, resolved before the map is built.
 *
 * City views fetch the basemap style themselves rather than handing MapLibre
 * a URL, so that a style host which is slow, blocked or down degrades to the
 * paper basemap instead of leaving the map with no style at all — and
 * therefore no data layers, since children mount only once a style has
 * loaded. The data is the point of the map; the basemap is context.
 */
export async function resolveStyle({ graticule = true, basemap = false, signal } = {}) {
  const paper = paperStyle({ graticule });
  if (!usesTiles({ basemap })) return paper;

  try {
    const response = await fetch(CITY_STYLE_URL, { signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    console.warn('[map] basemap style unavailable — falling back to paper', error.message);
    return paper;
  }
}

/**
 * The layer a component's own layers are inserted before: the style's first
 * symbol layer, so place names and road labels stay legible above the data
 * rather than under it. The paper basemap has no symbols and returns
 * undefined, which appends as before.
 */
export function overlayAnchor(map) {
  return map.getStyle()?.layers?.find((layer) => layer.type === 'symbol')?.id;
}
