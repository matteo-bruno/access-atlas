// ─────────────────────────────────────────────────────────────────────────
// The data catalogue: what real data has actually been published.
//
// `public/data/index.json` is the one file that decides whether the Atlas
// renders measurements or seed data. It is deliberately additive — a platform
// with no entry, or a city missing from a platform's list, simply falls back
// to the generated stand-ins, so the site works on a fresh checkout and picks
// up real outputs one city at a time.
//
// Shape (see public/data/README.md for the full contract):
//
//   {
//     "version": 1,
//     "platforms": {
//       "pov": {
//         "coverage": "pov/coverage.geojson",
//         "cities": [{ "id": "rome", "name": "Rome", "center": [lon, lat],
//                      "zoom": 10.1, "dataset": "pov/rome.geojson",
//                      "population": 2610243,
//                      "geometry": "cartogram",
//                      "geoDataset": "pov/rome.geo.geojson",
//                      "cell": { "h3Resolution": 9, "cellRadiusM": 200 } }]
//       }
//     }
//   }
// ─────────────────────────────────────────────────────────────────────────

// Relative to public/data/ — `dataUrl` supplies the directory.
export const CATALOGUE_PATH = 'index.json';

export const EMPTY_CATALOGUE = {
  version: 1,
  platforms: {},
  atlas: { cities: [], citiesById: {} },
};

/** Absolute URL for a path inside public/data/, honouring the deploy base. */
export function dataUrl(path) {
  return `${import.meta.env.BASE_URL}data/${path}`;
}

// Build id, defined by vite.config.js. Falls back for consumers that run the
// modules outside a Vite build — the Node test suites import these files
// directly.
const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

/**
 * URL for the catalogue, tagged with the build id.
 *
 * Every other file is fetched by its plain path and may cache freely. The
 * catalogue may not: it is what tells the app which cities are published, it
 * never changes within a session, and it sits at a stable URL — so a copy
 * cached from an earlier deploy makes newly published cities read as "not
 * published" long after they went live.
 */
export function catalogueUrl() {
  return `${dataUrl(CATALOGUE_PATH)}?v=${BUILD_ID}`;
}

// Coordinates are [lon, lat] throughout the Atlas, matching GeoJSON and
// MapLibre. The upstream CDI manifest uses [lat, lon]; converting is the
// exporter's job, not the reader's.
function normaliseCity(raw) {
  if (!raw || typeof raw.id !== 'string') return null;
  const center = Array.isArray(raw.center) && raw.center.length === 2 ? raw.center.map(Number) : null;
  if (!center || center.some((v) => !Number.isFinite(v))) return null;

  // Hourly data (CityChrone): one hexcover/times file pair per hour of day,
  // referenced as path templates with `{hh}` standing for the zero-padded
  // hour. `cells` is the row count shared by every hour's matrix.
  const hourly =
    raw.hourly &&
    typeof raw.hourly.hexcover === 'string' &&
    Number.isFinite(raw.hourly.hours) &&
    Number.isFinite(raw.hourly.cells)
      ? {
          hours: raw.hourly.hours,
          hexcover: raw.hourly.hexcover,
          times: typeof raw.hourly.times === 'string' ? raw.hourly.times : null,
          cells: raw.hourly.cells,
        }
      : null;

  return {
    id: raw.id,
    name: typeof raw.name === 'string' ? raw.name : raw.id,
    nameIt: typeof raw.nameIt === 'string' ? raw.nameIt : undefined,
    region: typeof raw.region === 'string' ? raw.region : undefined,
    regionIt: typeof raw.regionIt === 'string' ? raw.regionIt : undefined,
    center,
    zoom: Number.isFinite(raw.zoom) ? raw.zoom : 10,
    population: Number.isFinite(raw.population) ? raw.population : null,
    dataset: typeof raw.dataset === 'string' ? raw.dataset : null,
    // Alternative runs of the same city — the legacy site's "ideal city" and
    // Metro D are these. A static host serves the ones published ahead of
    // time; a backend provider can offer ones computed on demand.
    scenarios: Array.isArray(raw.scenarios)
      ? raw.scenarios
          .filter((s) => s && typeof s.id === 'string' && typeof s.dataset === 'string')
          .map((s) => ({ id: s.id, name: typeof s.name === 'string' ? s.name : s.id, dataset: s.dataset }))
      : [],
    hourly,
    // A city can be published on two geometries: the values sit on one, and a
    // companion file carries the other for the same cells. `geometry` says
    // which one `dataset` itself is — a cartogram encodes population in the
    // polygon, so it is a different claim about the cell than a hexagon is.
    //
    // `geoDataset` is the true geography beside a cartogram; `cartograms`
    // maps a platform id to the cartogram beside an atlas city's geographic
    // union mesh. Both are absent where nothing is published, and the viewer
    // offers the switch exactly where one exists.
    geometry: raw.geometry === 'cartogram' ? 'cartogram' : 'geographic',
    geoDataset: typeof raw.geoDataset === 'string' ? raw.geoDataset : null,
    cartograms:
      raw.cartograms && typeof raw.cartograms === 'object'
        ? Object.fromEntries(
            Object.entries(raw.cartograms).filter(([, path]) => typeof path === 'string'),
          )
        : {},
    // Atlas (combined-viewer) entries list which platform layers their union
    // mesh carries values for.
    layers: Array.isArray(raw.layers) ? raw.layers.filter((l) => typeof l === 'string') : null,
    // Cell geometry is metadata the exporter knows and the file cannot state:
    // a population-scaled cartogram's polygons are not the true cell size.
    // Named `cell` rather than `mesh` so it never collides with the seed
    // profiles' `mesh`, which holds generator parameters instead.
    cell: {
      h3Resolution: Number.isFinite(raw.cell?.h3Resolution) ? raw.cell.h3Resolution : null,
      cellRadiusM: Number.isFinite(raw.cell?.cellRadiusM) ? raw.cell.cellRadiusM : null,
    },
  };
}

/**
 * Coerce whatever is on disk into a predictable shape. A malformed catalogue
 * degrades to "nothing published" rather than breaking the page — the fallback
 * path is always available, so there is no reason to fail hard here.
 */
export function normaliseCatalogue(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.platforms !== 'object' || !raw.platforms) {
    return EMPTY_CATALOGUE;
  }

  const platforms = {};
  for (const [id, entry] of Object.entries(raw.platforms)) {
    if (!entry || typeof entry !== 'object') continue;
    const cities = Array.isArray(entry.cities)
      ? entry.cities.map(normaliseCity).filter(Boolean)
      : [];
    platforms[id] = {
      coverage: typeof entry.coverage === 'string' ? entry.coverage : null,
      cities,
      citiesById: Object.fromEntries(cities.map((city) => [city.id, city])),
    };
  }

  // The atlas section describes the combined viewer's harmonised cities: one
  // union mesh per city, every platform's values on the same H3 cells. A city
  // absent here still gets a combined view — the viewer swaps per-platform
  // meshes instead of repainting one (the legacy path).
  const atlasCities = Array.isArray(raw.atlas?.cities)
    ? raw.atlas.cities.map(normaliseCity).filter(Boolean)
    : [];

  return {
    version: Number.isFinite(raw.version) ? raw.version : 1,
    platforms,
    atlas: {
      cities: atlasCities,
      citiesById: Object.fromEntries(atlasCities.map((city) => [city.id, city])),
    },
  };
}

export function platformEntry(catalogue, platformId) {
  return catalogue?.platforms?.[platformId] ?? null;
}

/** The published profile for a city, or null when it has not been published. */
export function publishedCity(catalogue, platformId, cityId) {
  return platformEntry(catalogue, platformId)?.citiesById?.[cityId] ?? null;
}

/** The combined-viewer (union mesh) entry for a city, or null. */
export function atlasCity(catalogue, cityId) {
  return catalogue?.atlas?.citiesById?.[cityId] ?? null;
}

/** Path inside public/data/ for one hour of an hourly dataset. */
export function hourlyPath(template, hour) {
  return template.replace('{hh}', String(hour).padStart(2, '0'));
}
