// Small pieces every importer needs.

/** A source file's JSON, BOM and all. */
export function parseJSON(file) {
  const text = file.read().toString('utf8').replace(/^﻿/, '');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${file.path} is not valid JSON (${error.message})`);
  }
}

const R = 6378137;
const fromMercator = ([x, y]) => [
  ((x / R) * 180) / Math.PI,
  ((2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180) / Math.PI,
];

/**
 * A function that brings a collection's coordinates to lon/lat.
 *
 * P.O.V. ships its cartogram in Web Mercator metres, the rest in degrees. The
 * `crs` member says which when it is there; a coordinate outside ±180 says so
 * when it is not. Any other projection is refused rather than guessed.
 */
export function toLonLat(collection, label) {
  const name = String(collection.crs?.properties?.name ?? '');
  const first = collection.features?.[0]?.geometry?.coordinates?.[0]?.[0];
  const mercator = /3857|900913|3785/.test(name) || (first && Math.abs(first[0]) > 180);
  if (mercator) return fromMercator;
  if (name && !/4326|CRS84/i.test(name)) throw new Error(`${label}: unsupported CRS ${name}`);
  return (p) => p;
}

export const metresApart = ([lon1, lat1], [lon2, lat2]) =>
  Math.hypot((lon2 - lon1) * 111320 * Math.cos((lat1 * Math.PI) / 180), (lat2 - lat1) * 111320);
