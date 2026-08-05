// ─────────────────────────────────────────────────────────────────────────
// Where the Atlas gets its data.
//
// Everything the app knows about fetching published data goes through a
// *provider*. Today there is one: static files under public/data/, served by
// whatever is hosting the build. A scenario backend — the piece the old
// 15minCity site had and a static host cannot replace — becomes a second
// provider implementing the same three methods, swapped in with
// `setDataProvider()`. No caller changes.
//
// Providers only ever describe *published* data. Falling back to the generated
// seed data is the caller's decision (see useCityCoverage / useCityMesh), which
// keeps "what is real" separate from "what do we draw when nothing is".
// ─────────────────────────────────────────────────────────────────────────

import { loadDataset, loadJSON } from '../map/loaders.js';
import {
  EMPTY_CATALOGUE,
  atlasCity,
  catalogueUrl,
  dataUrl,
  hourlyPath,
  normaliseCatalogue,
  platformEntry,
  publishedCity,
} from './catalogue.js';

/** Static provider: plain files under public/data/, no backend required. */
export function createStaticProvider() {
  let cataloguePromise = null;

  return {
    id: 'published',

    async catalogue({ signal } = {}) {
      // Memoised rather than refetched: the catalogue is read on nearly every
      // route and never changes within a session.
      if (!cataloguePromise) {
        cataloguePromise = loadJSON(catalogueUrl(), { signal })
          .then(normaliseCatalogue)
          .catch((error) => {
            // No catalogue at all is the normal state before any data is
            // published — not an error worth propagating.
            if (error?.name === 'AbortError') throw error;
            cataloguePromise = null;
            return EMPTY_CATALOGUE;
          });
      }
      return cataloguePromise;
    },

    async coverage(platformId, catalogue, { signal } = {}) {
      const entry = platformEntry(catalogue, platformId);
      if (!entry?.coverage) return null;
      return loadDataset({ url: dataUrl(entry.coverage) }, { signal });
    },

    async cityMesh(platformId, cityId, catalogue, { signal, scenario } = {}) {
      const profile = publishedCity(catalogue, platformId, cityId);
      if (!profile) return null;

      // A scenario is an alternative dataset for the same city — the legacy
      // 15minCity site's "ideal city" and Metro D runs are exactly this. A
      // static host can only serve ones that were published ahead of time;
      // user-authored scenarios are what a backend provider would add, and
      // they arrive through this same argument.
      const dataset = scenario
        ? profile.scenarios?.find((s) => s.id === scenario)?.dataset
        : profile.dataset;
      if (!dataset) return null;

      const collection = await loadDataset({ url: dataUrl(dataset) }, { signal });
      return { collection, profile, scenario: scenario ?? null };
    },

    // Scenarios a static host can offer: whatever the catalogue lists. A
    // backend provider would return ones computed on demand instead.
    async scenarios(platformId, cityId, catalogue) {
      return publishedCity(catalogue, platformId, cityId)?.scenarios ?? [];
    },

    // The combined viewer's union mesh — every platform's values on one H3
    // grid, built offline. Null when the city has no harmonised export yet;
    // the viewer then swaps per-platform meshes instead of repainting one.
    async atlasMesh(cityId, catalogue, { signal } = {}) {
      const profile = atlasCity(catalogue, cityId);
      if (!profile?.dataset) return null;
      const collection = await loadDataset({ url: dataUrl(profile.dataset) }, { signal });
      return { collection, profile };
    },

    // One hour of an hourly dataset (CityChrone's hexcovers). `hour` is
    // clamped to what the catalogue declares rather than trusted.
    async hourly(platformId, cityId, hour, catalogue, { signal } = {}) {
      const profile = publishedCity(catalogue, platformId, cityId);
      if (!profile?.hourly) return null;
      const clamped = Math.min(Math.max(0, hour | 0), profile.hourly.hours - 1);
      const collection = await loadDataset(
        { url: dataUrl(hourlyPath(profile.hourly.hexcover, clamped)) },
        { signal },
      );
      return { collection, profile, hour: clamped };
    },

    // The travel-time matrix behind one hour's isochrones: cells × cells,
    // uint8 minutes. ~3 MB per hour, so it is only fetched when the isochrone
    // view asks for it (and then cached by URL like everything else).
    async travelTimes(platformId, cityId, hour, catalogue, { signal } = {}) {
      const profile = publishedCity(catalogue, platformId, cityId);
      if (!profile?.hourly?.times) return null;
      const clamped = Math.min(Math.max(0, hour | 0), profile.hourly.hours - 1);
      const matrix = await loadDataset(
        { url: dataUrl(hourlyPath(profile.hourly.times, clamped)) },
        { signal },
      );
      return { matrix, profile, hour: clamped };
    },
  };
}

/**
 * The provider contract, for anyone writing a second one:
 *
 *   catalogue({ signal })                      → normalised catalogue
 *   coverage(platformId, catalogue, opts)      → FeatureCollection | null
 *   cityMesh(platformId, cityId, catalogue, opts)
 *                                              → { collection, profile, scenario } | null
 *   scenarios(platformId, cityId, catalogue)   → [{ id, name, dataset }]
 *   atlasMesh(cityId, catalogue, opts)         → { collection, profile } | null
 *   hourly(platformId, cityId, hour, catalogue, opts)
 *                                              → { collection, profile, hour } | null
 *   travelTimes(platformId, cityId, hour, catalogue, opts)
 *                                              → { matrix: { shape, data }, profile, hour } | null
 *
 * `opts` carries `{ signal, scenario }`. Returning `null` means "not
 * published" and is never an error: the caller falls back to seed data.
 * Anything thrown is treated as a failure of *this* provider, and the caller
 * falls back the same way — so a backend going down degrades to the static
 * files rather than to a blank page.
 */

let provider = createStaticProvider();

export function getDataProvider() {
  return provider;
}

/** Swap the data provider — the seam for a future scenario backend. */
export function setDataProvider(next) {
  provider = next ?? createStaticProvider();
  return provider;
}
