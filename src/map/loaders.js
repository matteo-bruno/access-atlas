// Dataset loading for the Atlas maps.
//
// Everything downstream speaks GeoJSON, so this module is the single place that
// knows about wire formats. Today that means GeoJSON, zipped shapefiles and
// NumPy .npy matrices (CityChrone's travel times); adding FlatGeobuf or
// PMTiles later means adding one branch here.

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

/**
 * Load a NumPy .npy file — CityChrone publishes its hourly travel-time
 * matrices this way (uint8 minutes, cells × cells). Only the formats those
 * files actually use are read: version 1.0 headers, C order, uint8. Returns
 * `{ shape, data }` with `data` a flat Uint8Array in row-major order.
 */
export async function loadNpy(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new DatasetError(`${response.status} ${response.statusText}`, { url });
  }
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Magic: \x93NUMPY, then major/minor version, then a little-endian header
  // length (2 bytes in v1, 4 in v2+) and a Python-dict header padded to it.
  const magic = String.fromCharCode(...bytes.slice(1, 6));
  if (bytes[0] !== 0x93 || magic !== 'NUMPY') {
    throw new DatasetError('Not a .npy file', { url });
  }
  const major = bytes[6];
  const view = new DataView(buffer);
  const headerLength = major >= 2 ? view.getUint32(8, true) : view.getUint16(8, true);
  const headerStart = major >= 2 ? 12 : 10;
  const header = new TextDecoder('latin1').decode(
    bytes.slice(headerStart, headerStart + headerLength),
  );

  if (!/'descr':\s*'\|u1'/.test(header)) {
    throw new DatasetError(`Unsupported .npy dtype in ${header}`, { url });
  }
  if (/'fortran_order':\s*True/.test(header)) {
    throw new DatasetError('Fortran-ordered .npy is not supported', { url });
  }
  const shapeMatch = header.match(/'shape':\s*\(([^)]*)\)/);
  if (!shapeMatch) throw new DatasetError('No shape in .npy header', { url });
  const shape = shapeMatch[1]
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number);

  const expected = shape.reduce((a, b) => a * b, 1);
  const data = bytes.slice(headerStart + headerLength);
  if (data.length < expected) {
    throw new DatasetError(`.npy holds ${data.length} bytes, shape needs ${expected}`, { url });
  }
  return { shape, data: data.subarray(0, expected) };
}

function formatFor(url, explicit) {
  if (explicit) return explicit;
  let path = url.split('?')[0].toLowerCase();
  // A `.gz` is a transport wrapper, not a format: the browser has already
  // decoded it by the time a loader sees the body (the server sends it with
  // `Content-Encoding: gzip`), so the format is whatever it decodes *to*.
  // Without this, `times00.npy.gz` would be parsed as GeoJSON.
  if (path.endsWith('.gz')) path = path.slice(0, -3);
  if (path.endsWith('.zip') || path.endsWith('.shp')) return 'shapefile';
  if (path.endsWith('.npy')) return 'npy';
  return 'geojson';
}

const LOADERS = { geojson: loadGeoJSON, shapefile: loadShapefile, npy: loadNpy };

/**
 * Load a dataset by descriptor, with an in-memory cache keyed on the URL so
 * revisiting a platform does not refetch.
 *
 * @param {{ url: string, format?: 'geojson'|'shapefile'|'npy' }} descriptor
 */
export async function loadDataset(descriptor, { signal, cache: useCache = true } = {}) {
  const { url } = descriptor;
  if (useCache && cache.has(url)) return cache.get(url);

  const format = formatFor(url, descriptor.format);
  const promise = (LOADERS[format] ?? loadGeoJSON)(url, { signal }).catch(
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
