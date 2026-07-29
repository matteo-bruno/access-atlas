// React bindings over the data provider. Each hook renders the seed data
// immediately and upgrades to published data if the catalogue offers it, so a
// slow or absent dataset never blocks a page — it just stays seeded.

import { useEffect, useMemo, useState } from 'react';
import { citiesFromPublished } from './adapters.js';
import { publishedCity } from './catalogue.js';
import { getDataProvider } from './sources.js';
import { CITY_PROFILES } from './mesh.js';
import { citiesForPlatform } from './cities.js';

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
