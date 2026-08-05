// React bindings over the data provider. Each hook renders the seed data
// immediately and upgrades to published data if the catalogue offers it, so a
// slow or absent dataset never blocks a page — it just stays seeded.

import { useEffect, useMemo, useState } from 'react';
import { citiesFromPublished } from './adapters.js';
import { publishedCity } from './catalogue.js';
import { getDataProvider } from './sources.js';
import { CITY_PROFILES } from './mesh.js';
import { CITIES, citiesForPlatform } from './cities.js';
import { PLATFORMS } from './platforms.js';

/**
 * City coverage for a platform's world map and search.
 * @returns {{ cities: object[], source: 'published'|'seed' }}
 */
export function useCityCoverage(platform) {
  const [published, setPublished] = useState(null);
  const seed = useMemo(() => citiesForPlatform(platform), [platform]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setPublished(null);

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        const collection = await provider.coverage(platform.id, catalogue, {
          signal: controller.signal,
        });
        if (cancelled || !collection) return;
        const cities = citiesFromPublished(collection);
        if (cities.length) setPublished(cities);
      } catch (error) {
        // Staying on seed data is the designed outcome, not a failure.
        if (error?.name !== 'AbortError' && import.meta.env.DEV) {
          console.info(`[data] coverage for ${platform.id} unavailable`, error.message);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [platform]);

  return {
    cities: published ?? seed,
    source: published ? 'published' : 'seed',
  };
}

/**
 * Every published city across all four platforms, merged by id, with the list
 * of platforms that cover each. Drives the all-platforms world map, where the
 * readable quantity is how many of the four lenses a city has.
 *
 * Falls back to the seed list only if no platform publishes coverage at all —
 * a partially published Atlas shows what is real rather than mixing the two.
 *
 * @returns {{ cities: object[], source: 'published'|'seed' }}
 */
export function useAllCoverage() {
  const [published, setPublished] = useState(null);
  const seed = useMemo(
    () => CITIES.map((city) => ({ ...city, platforms: [], platformCount: 1 })),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        const merged = new Map();

        for (const platform of PLATFORMS) {
          let collection = null;
          try {
            collection = await provider.coverage(platform.id, catalogue, {
              signal: controller.signal,
            });
          } catch (error) {
            if (error?.name === 'AbortError') return;
          }
          if (!collection) continue;
          for (const city of citiesFromPublished(collection)) {
            const existing = merged.get(city.id);
            if (existing) {
              // Keep the first platform's figures; only the platform list and
              // the count are merged. Mixing per-platform measures into one
              // record would invent a city-level number no file states.
              existing.platforms.push(platform.id);
              existing.platformCount = existing.platforms.length;
            } else {
              merged.set(city.id, { ...city, platforms: [platform.id], platformCount: 1 });
            }
          }
        }

        if (cancelled || merged.size === 0) return;
        setPublished([...merged.values()]);
      } catch (error) {
        if (error?.name !== 'AbortError' && import.meta.env.DEV) {
          console.info('[data] merged coverage unavailable', error.message);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { cities: published ?? seed, source: published ? 'published' : 'seed' };
}

/**
 * The set of city ids that have a detail page for this platform — a bundled
 * seed profile, or a published dataset. Used to decide whether clicking a
 * marker opens a city or just flies the map to it.
 */
export function useCityPageIds(platformId) {
  const [publishedIds, setPublishedIds] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setPublishedIds(null);

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        if (cancelled) return;
        const cities = catalogue?.platforms?.[platformId]?.cities ?? [];
        setPublishedIds(cities.filter((city) => city.dataset).map((city) => city.id));
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [platformId]);

  return useMemo(
    () => new Set([...Object.keys(CITY_PROFILES), ...(publishedIds ?? [])]),
    [publishedIds],
  );
}

/**
 * Cities with a combined-viewer (union mesh) entry in the catalogue — the ones
 * exported on the shared H3 grid, which /atlas/:cityId can draw every platform
 * from at once.
 */
export function useAtlasCities() {
  const [cities, setCities] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        if (cancelled) return;
        setCities(catalogue?.atlas?.cities ?? []);
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return cities ?? EMPTY_CITIES;
}

// Stable identity, so consumers can depend on the result without re-running.
const EMPTY_CITIES = [];

/** Just their ids — for deciding whether to offer the combined view. */
export function useAtlasCityIds() {
  const cities = useAtlasCities();
  return useMemo(() => new Set(cities.map((city) => city.id)), [cities]);
}

/**
 * Resolve a city page's profile from the catalogue, falling back to the
 * bundled seed profiles. Published entries win, so a city that exists only as
 * real data still gets a page.
 *
 * @returns {{ status: 'pending'|'ready'|'missing', profile: object|null,
 *             source: 'published'|'seed'|null }}
 */
export function useCityProfile(platformId, cityId) {
  const seed = CITY_PROFILES[cityId] ?? null;
  const [state, setState] = useState({ status: 'pending', profile: null, source: null });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setState({ status: 'pending', profile: null, source: null });

    (async () => {
      let entry = null;
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        entry = publishedCity(catalogue, platformId, cityId);
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
      if (cancelled) return;

      if (!entry && !seed) {
        setState({ status: 'missing', profile: null, source: null });
        return;
      }

      // Seed first so its editorial fields (Italian names, region) survive,
      // then let the published entry override anything it actually states.
      const profile = entry
        ? {
            ...seed,
            ...stripEmpty(entry),
            id: cityId,
            // Generator params belong to the seed profile alone.
            mesh: seed?.mesh,
          }
        : seed;

      setState({
        status: 'ready',
        profile,
        source: entry?.dataset ? 'published' : 'seed',
      });
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [platformId, cityId, seed]);

  return state;
}

function stripEmpty(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null),
  );
}
