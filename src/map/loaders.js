// Dataset loading for the Atlas maps.
//
// Everything downstream speaks GeoJSON, so this module is the single place that
// knows about wire formats. Today that means GeoJSON and zipped shapefiles;
// adding FlatGeobuf or PMTiles later means adding one branch here.

const cache = new Map();

export class DatasetError extends Error {
  constructor(message, { url, cause } = {}) {
    super(message);
    this.name = 'DatasetError';
    this.url = url;
    this.cause = cause;
  }
}

function assertFeatureCollection(data, url) {
  if (!data || typeof data !== 'object') {
    throw new DatasetError('Dataset is not an object', { url });
  }
  if (data.type === 'Feature') return { type: 'FeatureCollection', features: [data] };
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new DatasetError(`Expected a GeoJSON FeatureCollection, got "${data.type}"`, { url });
  }
  return data;
}

export async function loadGeoJSON(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new DatasetError(`${response.status} ${response.statusText}`, { url });
  }
  return assertFeatureCollection(await response.json(), url);
}

/**
 * Plain JSON — the data catalogue rather than a dataset, so it deliberately
 * skips the FeatureCollection assertion the map layer needs.
 */
export async function loadJSON(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new DatasetError(`${response.status} ${response.statusText}`, { url });
  }
  return response.json();
}

/**
 * Load a shapefile — either a .zip bundle (shp + dbf + prj) or the base name of
 * a set of sibling files. shpjs is ~200 kB, so it is imported on demand and
 * never lands in the main bundle.
 */
export async function loadShapefile(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new DatasetError(`${response.status} ${response.statusText}`, { url });
  }
  const buffer = await response.arrayBuffer();
  const { default: shp } = await import('shpjs');
  const parsed = await shp(buffer);
  // shpjs returns an array when the archive holds several layers — merge them.
  if (Array.isArray(parsed)) {
    return {
      type: 'FeatureCollection',
      features: parsed.flatMap((layer) => layer.features ?? []),
    };
  }
  return assertFeatureCollection(parsed, url);
}

function formatFor(url, explicit) {
  if (explicit) return explicit;
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.zip') || path.endsWith('.shp')) return 'shapefile';
  return 'geojson';
}

/**
 * Load a dataset by descriptor, with an in-memory cache keyed on the URL so
 * revisiting a platform does not refetch.
 *
 * @param {{ url: string, format?: 'geojson'|'shapefile' }} descriptor
 */
export async function loadDataset(descriptor, { signal, cache: useCache = true } = {}) {
  const { url } = descriptor;
  if (useCache && cache.has(url)) return cache.get(url);

  const format = formatFor(url, descriptor.format);
  const promise = (format === 'shapefile' ? loadShapefile : loadGeoJSON)(url, { signal }).catch(
    (error) => {
      cache.delete(url);
      throw error instanceof DatasetError
        ? error
        : new DatasetError(`Could not load ${url}`, { url, cause: error });
    },
  );

  if (useCache) cache.set(url, promise);
  return promise;
}

/**
 * Try a published dataset first and fall back to the bundled seed data, so the
 * Atlas renders on a fresh checkout but picks up real outputs the moment they
 * are dropped into public/data/.
 */
export async function loadWithFallback(descriptor, fallback, { signal } = {}) {
  try {
    return { data: await loadDataset(descriptor, { signal }), source: 'published' };
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    if (import.meta.env.DEV) {
      console.info(`[map] ${descriptor.url} unavailable — using bundled seed data`, error.message);
    }
    return { data: typeof fallback === 'function' ? fallback() : fallback, source: 'seed' };
  }
}

export function clearDatasetCache() {
  cache.clear();
}
