// React bindings over the data provider. Each hook renders the seed data
// immediately and upgrades to published data if the catalogue offers it, so a
// slow or absent dataset never blocks a page — it just stays seeded.

import { useEffect, useMemo, useRef, useState } from 'react';
import { citiesFromPublished } from './adapters.js';
import { platformEntry, publishedCity } from './catalogue.js';
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

/**
 * The other geometry published for a city's cells: the true hexagons beside a
 * cartogram. Loaded on first ask rather than with the page — a visitor who
 * never touches the switch should not pay for a second copy of the mesh — and
 * kept once loaded, so switching back and forth costs nothing.
 *
 * @returns {{ status: 'idle'|'pending'|'ready'|'error', collection: object|null }}
 */
export function useCityGeometry(platformId, cityId, enabled) {
  const [state, setState] = useState({ status: 'idle', collection: null });
  const loaded = useRef(null);

  // A companion belongs to one city's values. Drop it the moment those
  // change, or the map would draw this city's cells at the last one's.
  useEffect(() => {
    loaded.current = null;
    setState({ status: 'idle', collection: null });
  }, [platformId, cityId]);

  useEffect(() => {
    const key = `${platformId}/${cityId}`;
    if (!enabled || !platformId || !cityId || loaded.current === key) return undefined;

    let cancelled = false;
    const controller = new AbortController();
    setState({ status: 'pending', collection: null });

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        // Whichever way round this city is published: the hexagons beside a
        // cartogram, or the cartogram beside the hexagons.
        const result =
          (await provider.cityGeometry(platformId, cityId, catalogue, {
            signal: controller.signal,
          })) ??
          (await provider.cityCartogram(platformId, cityId, catalogue, {
            signal: controller.signal,
          }));
        if (cancelled) return;
        if (!result) {
          // Not published is not an error: the page offers no switch.
          setState({ status: 'idle', collection: null });
          return;
        }
        loaded.current = key;
        setState({ status: 'ready', collection: result.collection });
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return;
        if (import.meta.env.DEV) {
          console.warn(`[data] geometry for ${key} unusable`, error.message);
        }
        setState({ status: 'error', collection: null });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [platformId, cityId, enabled]);

  return state;
}

function stripEmpty(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null),
  );
}

/**
 * Every published city of a platform, one row each, for the compare view.
 *
 * Computed offline and published as a summary file — the alternative is
 * fetching all 22 city datasets to end up with twenty numbers per city.
 *
 * @returns {{ status: 'pending'|'ready'|'empty'|'error', cities: object[] }}
 */
export function usePlatformSummary(platformId) {
  const [state, setState] = useState({ status: 'pending', cities: [] });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setState({ status: 'pending', cities: [] });

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        const summary = await provider.summary(platformId, catalogue, {
          signal: controller.signal,
        });
        if (cancelled) return;
        const rows = Array.isArray(summary?.cities) ? summary.cities : [];
        if (!rows.length) {
          setState({ status: 'empty', cities: [] });
          return;
        }
        // The summary carries figures, not names: the catalogue is where a
        // city's editorial metadata lives, so the two are joined here.
        const byId = platformEntry(catalogue, platformId)?.citiesById ?? {};
        setState({
          status: 'ready',
          cities: rows
            .filter((row) => byId[row.id])
            .map((row) => ({ ...row, profile: byId[row.id] })),
        });
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return;
        setState({ status: 'error', cities: [] });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [platformId]);

  return state;
}

/**
 * Whether a platform publishes the per-city summary the compare view is built
 * from — read from the catalogue alone, so offering the link costs nothing.
 */
export function usePlatformHasSummary(platformId) {
  const [has, setHas] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setHas(false);

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        if (!cancelled) setHas(Boolean(platformEntry(catalogue, platformId)?.summary));
      } catch {
        // No catalogue means nothing is published; the link stays off.
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [platformId]);

  return has;
}
