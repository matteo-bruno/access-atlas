// Which country a point is in.
//
// The 15minCity exports say nothing about where their city is, but the UI
// shows it twice — the city header prints the region, the search result prints
// the country code — so the importer derives both from the city's own weighted
// centroid rather than taking them on the command line. Derived every run, a
// value cannot go stale or be clobbered by a flag someone forgot to pass.
//
// `countries.geojson.gz` beside this file is Natural Earth admin-0 at 1:50m,
// stripped to `iso`, `name` and `nameIt` and rounded to 3 decimals (~110 m,
// far finer than a country test needs). It is a **build-time** asset: the
// importer reads it, nothing ships it to the browser. Natural Earth carries
// localised country names, so the Italian region label is derived too rather
// than hand-maintained in a table that would drift.
//
// Two-stage lookup, because a city centroid is not reliably inside its own
// country's polygon at this generalisation. Stockholm's sits 3.9 km off
// Sweden's drawn coast — the city is on an archipelago the 1:50m outline does
// not resolve — so a plain point-in-polygon answers "nowhere" for a city that
// is obviously in Sweden. So: containment first, then the nearest boundary
// within `maxDistanceKm`. Beyond that nothing is guessed and the caller is
// told, because a point in open ocean should not quietly become a country.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(HERE, 'countries.geojson.gz');

/** Far enough for a coastal or island city, short enough not to invent one. */
const DEFAULT_MAX_KM = 25;

let cache = null;

function load() {
  if (cache) return cache;
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`country boundaries not found at ${SOURCE}`);
  }
  const collection = JSON.parse(zlib.gunzipSync(fs.readFileSync(SOURCE)).toString('utf8'));

  // A bounding box per country, so the nearest-boundary pass can skip almost
  // everything instead of walking a million vertices for each city.
  cache = collection.features.map((feature) => {
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const polygon of polygonsOf(feature.geometry)) {
      for (const [x, y] of polygon[0]) {
        if (x < west) west = x;
        if (x > east) east = x;
        if (y < south) south = y;
        if (y > north) north = y;
      }
    }
    return { feature, bbox: [west, south, east, north] };
  });
  return cache;
}

function polygonsOf(geometry) {
  if (geometry?.type === 'Polygon') return [geometry.coordinates];
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

/** Ray casting, counting crossings of one ring. */
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Inside the outer ring and outside every hole. */
function inPolygon(x, y, polygon) {
  if (!inRing(x, y, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) if (inRing(x, y, polygon[i])) return false;
  return true;
}

// Metres per degree, good enough at city scale for ranking distances.
const metresBetween = (lon1, lat1, lon2, lat2) =>
  Math.hypot((lon2 - lon1) * 111320 * Math.cos((lat1 * Math.PI) / 180), (lat2 - lat1) * 110540);

/** Distance from a point to the nearest vertex of a country's outline. */
function distanceToFeature(lon, lat, feature) {
  let best = Infinity;
  for (const polygon of polygonsOf(feature.geometry)) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        const d = metresBetween(lon, lat, x, y);
        if (d < best) best = d;
      }
    }
  }
  return best;
}

/**
 * The country a point falls in.
 *
 * @param {number} lon
 * @param {number} lat
 * @param {{ maxDistanceKm?: number }} [options]
 * @returns {{ iso: string, name: string, nameIt: string, exact: boolean, distanceKm: number } | null}
 *   `exact` is false when the point was matched to the nearest coast rather
 *   than contained — worth reporting, because it is the case that can be wrong.
 */
export function countryAt(lon, lat, { maxDistanceKm = DEFAULT_MAX_KM } = {}) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  const entries = load();

  for (const { feature, bbox } of entries) {
    if (lon < bbox[0] || lon > bbox[2] || lat < bbox[1] || lat > bbox[3]) continue;
    for (const polygon of polygonsOf(feature.geometry)) {
      if (inPolygon(lon, lat, polygon)) {
        const { iso, name, nameIt } = feature.properties;
        return { iso, name, nameIt, exact: true, distanceKm: 0 };
      }
    }
  }

  // Not inside anything: the nearest coast, if it is close enough to be this
  // city's own. The bbox is grown by the allowance so a country whose outline
  // passes nearby is still considered.
  const padDeg = maxDistanceKm / 111 + 0.5;
  let best = null;
  for (const { feature, bbox } of entries) {
    if (
      lon < bbox[0] - padDeg ||
      lon > bbox[2] + padDeg ||
      lat < bbox[1] - padDeg ||
      lat > bbox[3] + padDeg
    ) {
      continue;
    }
    const metres = distanceToFeature(lon, lat, feature);
    if (!best || metres < best.metres) best = { feature, metres };
  }

  if (!best || best.metres > maxDistanceKm * 1000) return null;
  const { iso, name, nameIt } = best.feature.properties;
  return {
    iso,
    name,
    nameIt,
    exact: false,
    distanceKm: Math.round((best.metres / 1000) * 10) / 10,
  };
}
