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

// Gzip's magic number. Two bytes is enough to tell a compressed body from a
// decompressed one with no false positives here: JSON starts `{` or `[`, and
// a .npy starts \x93NUMPY.
const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

/**
 * Fetch a dataset and hand back its *decoded* bytes.
 *
 * Most published files are stored gzipped (`milan.geojson.gz`), and who
 * decompresses them depends on the host, which the app cannot assume:
 *
 *   • A server told about them — nginx with the `.gz` location blocks in the
 *     README, or the dev/preview plugin — sends `Content-Encoding: gzip`, and
 *     the browser decodes before we ever see the body.
 *   • A plain static host — GitHub Pages among them, and it cannot be
 *     configured otherwise — serves the file as an opaque `application/gzip`
 *     download. The body then arrives still compressed.
 *
 * Sniffing the first two bytes covers both without caring which happened, and
 * without trusting `Content-Encoding`, which the fetch spec lets the browser
 * strip once it has decoded. This is why the whole data tree can be stored
 * compressed and still work on a host with no configuration at all.
 */
async function fetchDecoded(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new DatasetError(`${response.status} ${response.statusText}`, { url });
  }
  const buffer = await response.arrayBuffer();
  const head = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
  if (head.length < 2 || head[0] !== GZIP_MAGIC_0 || head[1] !== GZIP_MAGIC_1) {
    return buffer;
  }

  if (typeof DecompressionStream === 'undefined') {
    throw new DatasetError(
      `${url} is gzipped and this browser cannot decompress it`,
      { url },
    );
  }
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

const decodeText = (buffer) => new TextDecoder().decode(buffer);

export async function loadGeoJSON(url, { signal } = {}) {
  const buffer = await fetchDecoded(url, { signal });
  let parsed;
  try {
    parsed = JSON.parse(decodeText(buffer));
  } catch (cause) {
    throw new DatasetError(`${url} is not valid JSON`, { url, cause });
  }
  return assertFeatureCollection(parsed, url);
}

/**
 * Plain JSON — the data catalogue rather than a dataset, so it deliberately
 * skips the FeatureCollection assertion the map layer needs.
 */
export async function loadJSON(url, { signal } = {}) {
  const buffer = await fetchDecoded(url, { signal });
  try {
    return JSON.parse(decodeText(buffer));
  } catch (cause) {
    throw new DatasetError(`${url} is not valid JSON`, { url, cause });
  }
}

/**
 * Load a shapefile — either a .zip bundle (shp + dbf + prj) or the base name of
 * a set of sibling files. shpjs is ~200 kB, so it is imported on demand and
 * never lands in the main bundle.
 */
export async function loadShapefile(url, { signal } = {}) {
  // A zipped shapefile is not gzip, so `fetchDecoded` passes it through
  // untouched; a `.shp.gz` would be decoded before shpjs sees it.
  const buffer = await fetchDecoded(url, { signal });
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
  const buffer = await fetchDecoded(url, { signal });
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
