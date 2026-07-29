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
//                      "cell": { "h3Resolution": 9, "cellRadiusM": 200 } }]
//       }
//     }
//   }
// ─────────────────────────────────────────────────────────────────────────

// Relative to public/data/ — `dataUrl` supplies the directory.
export const CATALOGUE_PATH = 'index.json';

export const EMPTY_CATALOGUE = { version: 1, platforms: {} };

/** Absolute URL for a path inside public/data/, honouring the deploy base. */
export function dataUrl(path) {
  return `${import.meta.env.BASE_URL}data/${path}`;
}

// Coordinates are [lon, lat] throughout the Atlas, matching GeoJSON and
// MapLibre. The upstream CDI manifest uses [lat, lon]; converting is the
// exporter's job, not the reader's.
function normaliseCity(raw) {
  if (!raw || typeof raw.id !== 'string') return null;
  const center = Array.isArray(raw.center) && raw.center.length === 2 ? raw.center.map(Number) : null;
  if (!center || center.some((v) => !Number.isFinite(v))) return null;

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

  return { version: Number.isFinite(raw.version) ? raw.version : 1, platforms };
}

export function platformEntry(catalogue, platformId) {
  return catalogue?.platforms?.[platformId] ?? null;
}

/** The published profile for a city, or null when it has not been published. */
export function publishedCity(catalogue, platformId, cityId) {
  return platformEntry(catalogue, platformId)?.citiesById?.[cityId] ?? null;
}
