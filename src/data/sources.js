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

import { loadDataset, loadJSON, loadTimesRow, whenAborted } from '../map/loaders.js';
import { layerCartogram } from './grid.js';
import {
  EMPTY_CATALOGUE,
  addCityEntry,
  atlasCity,
  catalogueUrl,
  cityEntryPath,
  fileUrl,
  hourlyPath,
  normaliseCatalogue,
  normaliseCityList,
  platformEntry,
  publishedCity,
} from './catalogue.js';

/** Static provider: plain files under public/data/, no backend required. */
export function createStaticProvider() {
  let cataloguePromise = null;
  // One city's entry, and the city list, each fetched once and shared, for
  // the same reasons as the catalogue below: no caller's signal, and a
  // failure forgotten so the next caller tries again.
  const entryPromises = new Map();
  let listPromise = null;
  const race = (promise, signal) => (signal ? Promise.race([promise, whenAborted(signal)]) : promise);

  return {
    id: 'published',

    async catalogue({ signal } = {}) {
      // Memoised rather than refetched: the catalogue is read on nearly every
      // route and never changes within a session.
      //
      // Fetched **without the caller's signal**, and that is the whole point.
      // One promise is shared by every consumer on the page, so binding it to
      // the first consumer's lifetime let that consumer's unmount cancel the
      // catalogue for all of them, and the rejected promise stayed memoised,
      // so nothing ever retried. React remounts every effect in development,
      // which aborts the first request on every single page load: the app
      // then answered "nothing is published" for the rest of the session and
      // drew seed cities, silently and only in `npm run dev`. The symptom is
      // a city list that is neither the catalogue's nor obviously wrong.
      //
      // A failure is not memoised either: the entry is cleared before the
      // empty catalogue is returned, so the next caller tries again.
      if (!cataloguePromise) {
        cataloguePromise = loadJSON(catalogueUrl())
          .then(normaliseCatalogue)
          .catch(() => {
            // No catalogue at all is the normal state before any data is
            // published — not an error worth propagating.
            cataloguePromise = null;
            return EMPTY_CATALOGUE;
          });
      }
      // The caller's own abort still ends *its* wait, which is what an
      // unmounting component needs; the shared fetch carries on for whoever
      // else asked, and its result is what the next caller gets.
      return signal ? Promise.race([cataloguePromise, whenAborted(signal)]) : cataloguePromise;
    },

    // One city's entry (catalogue version 3): fetched the first time the city
    // is asked for and merged into the catalogue, so `atlasCity` and
    // `publishedCity` answer for it from then on. Every method below that
    // takes a city starts here. On an older catalogue every city is already
    // in it. Resolves to the city's atlas entry, or null if it is not
    // published.
    async city(cityId, catalogue, { signal } = {}) {
      const known = atlasCity(catalogue, cityId);
      const path = cityEntryPath(catalogue, cityId);
      if (known || !path || !cityId) return known;
      if (!entryPromises.has(cityId)) {
        entryPromises.set(
          cityId,
          loadJSON(fileUrl(catalogue, path))
            .then((raw) => addCityEntry(catalogue, raw))
            .catch(() => {
              // Not published (the SPA fallback answers a missing file with
              // index.html, which does not parse), or a failed request: both
              // read as "not published", and the next caller asks again.
              entryPromises.delete(cityId);
              return null;
            }),
        );
      }
      return race(entryPromises.get(cityId), signal);
    },

    // Every published city: who and where, not how to draw it (version 3's
    // city list), for the search and whatever links cities by name. On an
    // older catalogue, its atlas entries.
    async cities(catalogue, { signal } = {}) {
      if (!catalogue?.cityList) return catalogue?.atlas?.cities ?? [];
      if (!listPromise) {
        listPromise = loadJSON(fileUrl(catalogue, catalogue.cityList))
          .then((raw) => normaliseCityList(raw) ?? [])
          .catch(() => {
            listPromise = null;
            return [];
          });
      }
      return race(listPromise, signal);
    },

    // Per-city aggregates for the compare view. Null where a platform has
    // published none, which is how the page knows to say so.
    async summary(platformId, catalogue, { signal } = {}) {
      const entry = platformEntry(catalogue, platformId);
      if (!entry?.summary) return null;
      // Plain JSON, not a dataset: loadDataset would hand a .json file to the
      // GeoJSON loader, which asserts a FeatureCollection.
      return loadJSON(fileUrl(catalogue, entry.summary), { signal });
    },

    // The statistics: every city on every measure, computed offline. Null
    // until any have been published, which is how the Stats page knows.
    async stats(catalogue, { signal } = {}) {
      if (!catalogue?.stats) return null;
      return loadDataset({ url: fileUrl(catalogue, catalogue.stats), format: 'json' }, { signal });
    },

    async coverage(platformId, catalogue, { signal } = {}) {
      const entry = platformEntry(catalogue, platformId);
      if (!entry?.coverage) return null;
      return loadDataset({ url: fileUrl(catalogue, entry.coverage) }, { signal });
    },

    async cityMesh(platformId, cityId, catalogue, { signal, scenario } = {}) {
      await this.city(cityId, catalogue, { signal });
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

      const collection = await loadDataset({ url: fileUrl(catalogue, dataset) }, { signal });
      return { collection, profile, scenario: scenario ?? null };
    },

    // The other geometry for a city's cells: the true hexagons beside a
    // published cartogram. Null where only one geometry is published, which
    // is how the viewer knows not to offer the switch.
    async cityGeometry(platformId, cityId, catalogue, { signal } = {}) {
      await this.city(cityId, catalogue, { signal });
      const profile = publishedCity(catalogue, platformId, cityId);
      if (!profile?.geoDataset) return null;
      const collection = await loadDataset({ url: fileUrl(catalogue, profile.geoDataset) }, { signal });
      return { collection, profile, kind: 'geographic' };
    },

    // The cartogram beside a city published on true geography — the mirror of
    // cityGeometry, for platforms whose dataset is the map rather than the
    // cartogram.
    async cityCartogram(platformId, cityId, catalogue, { signal } = {}) {
      await this.city(cityId, catalogue, { signal });
      const profile = publishedCity(catalogue, platformId, cityId);
      if (!profile?.cartogramDataset) return null;
      const collection = await loadDataset({ url: fileUrl(catalogue, profile.cartogramDataset) }, { signal });
      return { collection, profile, kind: 'cartogram' };
    },

    // The same in reverse for the combined viewer, whose union mesh is
    // already geographic: one platform's cartogram polygons, covering only
    // the cells that platform measures. On the per-city layout they are built
    // from the layer file, which carries them (or the rule for them).
    async atlasGeometry(cityId, platformId, catalogue, { signal } = {}) {
      await this.city(cityId, catalogue, { signal });
      const profile = atlasCity(catalogue, cityId);
      if (profile?.grid) {
        if (!profile.layerData?.[platformId]) return null;
        const [grid, layer] = await Promise.all([
          this.cityGrid(cityId, catalogue, { signal }),
          this.cityLayer(cityId, platformId, catalogue, { signal }),
        ]);
        if (!grid || !layer) return null;
        return { collection: await layerCartogram(grid, layer), profile, kind: 'cartogram' };
      }
      const dataset = profile?.cartograms?.[platformId];
      if (!dataset) return null;
      const collection = await loadDataset({ url: fileUrl(catalogue, dataset) }, { signal });
      return { collection, profile, kind: 'cartogram' };
    },

    // The per-city layout: the city's shared grid (H3 indices and a
    // population per cell), and one layer's values keyed to it. Both are
    // plain JSON; the viewer draws the hexagons itself (see grid.js).
    async cityGrid(cityId, catalogue, { signal } = {}) {
      await this.city(cityId, catalogue, { signal });
      const profile = atlasCity(catalogue, cityId);
      if (!profile?.grid) return null;
      return loadDataset({ url: fileUrl(catalogue, profile.grid), format: 'json' }, { signal });
    },

    async cityLayer(cityId, platformId, catalogue, { signal } = {}) {
      await this.city(cityId, catalogue, { signal });
      const path = atlasCity(catalogue, cityId)?.layerData?.[platformId];
      if (!path) return null;
      return loadDataset({ url: fileUrl(catalogue, path), format: 'json' }, { signal });
    },

    // One layer of a scenario of a city, on the city's own grid: the same
    // shape as `cityLayer`, merged beside the baseline (grid.js).
    async cityScenario(cityId, scenarioId, platformId, catalogue, { signal } = {}) {
      await this.city(cityId, catalogue, { signal });
      const scenario = atlasCity(catalogue, cityId)?.scenarios?.find((s) => s.id === scenarioId);
      const path = scenario?.layerData?.[platformId];
      if (!path) return null;
      return loadDataset({ url: fileUrl(catalogue, path), format: 'json' }, { signal });
    },

    // Scenarios a static host can offer: whatever the catalogue lists. A
    // backend provider would return ones computed on demand instead.
    async scenarios(platformId, cityId, catalogue) {
      await this.city(cityId, catalogue);
      return publishedCity(catalogue, platformId, cityId)?.scenarios ?? [];
    },

    // The combined viewer's union mesh — every platform's values on one H3
    // grid, built offline. Null when the city has no harmonised export yet;
    // the viewer then swaps per-platform meshes instead of repainting one.
    async atlasMesh(cityId, catalogue, { signal } = {}) {
      await this.city(cityId, catalogue, { signal });
      const profile = atlasCity(catalogue, cityId);
      if (!profile?.dataset) return null;
      const collection = await loadDataset({ url: fileUrl(catalogue, profile.dataset) }, { signal });
      return { collection, profile };
    },

    // One hour of an hourly dataset (CityChrone's hexcovers). `hour` is
    // clamped to what the catalogue declares rather than trusted.
    async hourly(platformId, cityId, hour, catalogue, { signal } = {}) {
      await this.city(cityId, catalogue, { signal });
      const profile = publishedCity(catalogue, platformId, cityId);
      if (!profile?.hourly) return null;
      const clamped = Math.min(Math.max(0, hour | 0), profile.hourly.hours - 1);
      const collection = await loadDataset(
        { url: fileUrl(catalogue, hourlyPath(profile.hourly.hexcover, clamped)) },
        { signal },
      );
      return { collection, profile, hour: clamped };
    },

    // One origin's travel times for one hour: a value per layer row. A city
    // in the per-origin format (`timesHH.bin`, src/data/times.js) sends one
    // block of origins; one imported before it sends the hour's whole
    // matrix (`timesHH.npy.gz`, ~10 MB gzipped for Rome), cached by URL, so
    // the next origin in that hour is free. With no origin the file is only
    // opened, so it is warm by the time the reader clicks. `row` is null
    // where nobody lives at the origin; null altogether is a city with no
    // published travel times.
    async travelTimes(platformId, cityId, hour, catalogue, { signal, origin = null } = {}) {
      await this.city(cityId, catalogue, { signal });
      const atlas = atlasCity(catalogue, cityId);
      const profile = atlas?.hourly?.times ? atlas : publishedCity(catalogue, platformId, cityId);
      if (!profile?.hourly?.times) return null;
      const clamped = Math.min(Math.max(0, hour | 0), profile.hourly.hours - 1);
      const url = fileUrl(catalogue, hourlyPath(profile.hourly.times, clamped));
      if (profile.hourly.times.endsWith('.bin')) {
        return { row: await loadTimesRow(url, origin, { signal }), profile, hour: clamped };
      }
      const matrix = await loadDataset({ url }, { signal });
      const [rows, cols] = matrix.shape;
      const row = origin != null && origin < rows ? matrix.data.subarray(origin * cols, (origin + 1) * cols) : null;
      return { row, profile, hour: clamped };
    },
  };
}

/**
 * The provider contract, for anyone writing a second one:
 *
 *   catalogue({ signal })                      → normalised catalogue
 *   city(cityId, catalogue, opts)              → the city's atlas entry | null,
 *                                                merged into the catalogue
 *   cities(catalogue, opts)                    → every published city (the list)
 *   coverage(platformId, catalogue, opts)      → FeatureCollection | null
 *   summary(platformId, catalogue, opts)       → { platform, cities } | null
 *   stats(catalogue, opts)                     → statistics (scripts/lib/stats.mjs) | null
 *   cityMesh(platformId, cityId, catalogue, opts)
 *                                              → { collection, profile, scenario } | null
 *   scenarios(platformId, cityId, catalogue)   → [{ id, name, dataset }]
 *   cityGeometry(platformId, cityId, catalogue, opts)
 *                                              → { collection, profile, kind } | null
 *   cityCartogram(platformId, cityId, catalogue, opts)
 *                                              → { collection, profile, kind } | null
 *   atlasGeometry(cityId, platformId, catalogue, opts)
 *                                              → { collection, profile, kind } | null
 *   atlasMesh(cityId, catalogue, opts)         → { collection, profile } | null
 *   cityGrid(cityId, catalogue, opts)          → { cells, population } | null
 *   cityLayer(cityId, platformId, catalogue, opts)
 *                                              → layer file (bundle.mjs) | null
 *   cityScenario(cityId, scenarioId, platformId, catalogue, opts)
 *                                              → layer file of a scenario | null
 *   hourly(platformId, cityId, hour, catalogue, opts)
 *                                              → { collection, profile, hour } | null
 *   travelTimes(platformId, cityId, hour, catalogue, opts)
 *                                              → { row: Uint8Array | null, profile, hour } | null
 *                                                (opts.origin: a layer row)
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
