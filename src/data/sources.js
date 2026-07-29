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
import { CATALOGUE_PATH, EMPTY_CATALOGUE, dataUrl, normaliseCatalogue, platformEntry, publishedCity } from './catalogue.js';

/** Static provider: plain files under public/data/, no backend required. */
export function createStaticProvider() {
  let cataloguePromise = null;

  return {
    id: 'published',

    async catalogue({ signal } = {}) {
      // Memoised rather than refetched: the catalogue is read on nearly every
      // route and never changes within a session.
      if (!cataloguePromise) {
        cataloguePromise = loadJSON(dataUrl(CATALOGUE_PATH), { signal })
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

    async cityMesh(platformId, cityId, catalogue, { signal } = {}) {
      const profile = publishedCity(catalogue, platformId, cityId);
      if (!profile?.dataset) return null;
      const collection = await loadDataset({ url: dataUrl(profile.dataset) }, { signal });
      return { collection, profile };
    },
  };
}

let provider = createStaticProvider();

export function getDataProvider() {
  return provider;
}

/** Swap the data provider — the seam for a future scenario backend. */
export function setDataProvider(next) {
  provider = next ?? createStaticProvider();
  return provider;
}
