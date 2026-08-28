// React bindings for the combined viewer (/atlas/:cityId).
//
// The catalogue decides how a city is drawn, per CLAUDE.md's grid contract:
// a city with an `atlas` entry has a harmonised union mesh — one load, then
// switching layers is purely a paint change. A city without one falls back to
// swapping per-platform meshes (the legacy path, handled by the page with
// useCityMesh). Both are decided here so the page asks one hook one question.

import { useEffect, useRef, useState } from 'react';
import { citychroneHour, meshFromAtlas } from './adapters.js';
import { atlasCity, publishedCity } from './catalogue.js';
import { getDataProvider } from './sources.js';
import { PLATFORMS } from './platforms.js';

/**
 * Resolve what the combined viewer knows about a city before any mesh loads:
 * whether it is harmonised, which platforms have published data for it, and
 * the profile to frame the map with.
 *
 * @returns {{
 *   status: 'pending'|'ready'|'missing',
 *   unified: boolean,
 *   profile: object|null,             // atlas entry, or a platform entry
 *   platformProfiles: object,         // platformId → published city entry
 *   available: Set<string>,           // platform ids with data for this city
 * }}
 */
export function useAtlasView(cityId) {
  const [state, setState] = useState({
    status: 'pending',
    unified: false,
    profile: null,
    platformProfiles: {},
    available: new Set(),
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setState({
      status: 'pending',
      unified: false,
      profile: null,
      platformProfiles: {},
      available: new Set(),
    });

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        if (cancelled) return;

        const entry = atlasCity(catalogue, cityId);
        const platformProfiles = {};
        for (const platform of PLATFORMS) {
          const cityEntry = publishedCity(catalogue, platform.id, cityId);
          if (cityEntry && (cityEntry.dataset || cityEntry.hourly)) {
            platformProfiles[platform.id] = cityEntry;
          }
        }

        const available = new Set(
          entry
            ? (entry.layers ?? Object.keys(platformProfiles))
            : Object.keys(platformProfiles),
        );

        if (!entry && available.size === 0) {
          setState({
            status: 'missing',
            unified: false,
            profile: null,
            platformProfiles: {},
            available,
          });
          return;
        }

        setState({
          status: 'ready',
          unified: Boolean(entry),
          profile: entry ?? Object.values(platformProfiles)[0],
          platformProfiles,
          available,
        });
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return;
        setState({
          status: 'missing',
          unified: false,
          profile: null,
          platformProfiles: {},
          available: new Set(),
        });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cityId]);

  return state;
}

/**
 * The union mesh for a harmonised city. No seed fallback — the combined
 * viewer only ever draws measurements, so a failed load is an error state the
 * page reports rather than papers over.
 */
export function useAtlasMesh(cityId, enabled = true) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    if (!enabled || !cityId) {
      setState({ status: 'idle', data: null, error: null });
      return undefined;
    }
    let cancelled = false;
    const controller = new AbortController();
    setState({ status: 'pending', data: null, error: null });

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        const published = await provider.atlasMesh(cityId, catalogue, {
          signal: controller.signal,
        });
        if (cancelled) return;
        if (!published) {
          setState({ status: 'idle', data: null, error: null });
          return;
        }
        const data = meshFromAtlas(published.collection, published.profile);
        setState({ status: 'ready', data, error: null });
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return;
        setState({ status: 'error', data: null, error });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cityId, enabled]);

  return state;
}

/**
 * One hour of CityChrone: the hexcover's scores keyed by `cc` for the union
 * mesh, plus the collection itself for cities where the hexcover is the mesh.
 */
export function useCitychroneHour(cityId, hour, enabled = true) {
  const [state, setState] = useState({ status: 'idle', data: null, collection: null });

  useEffect(() => {
    if (!enabled || !cityId) {
      setState({ status: 'idle', data: null, collection: null });
      return undefined;
    }
    let cancelled = false;
    const controller = new AbortController();
    // Keep the previous hour's colours while the next hour loads — the swap
    // is a repaint, not a page change.
    setState((current) => ({ ...current, status: 'pending' }));

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        const published = await provider.hourly('citychrone', cityId, hour, catalogue, {
          signal: controller.signal,
        });
        if (cancelled) return;
        if (!published) {
          setState({ status: 'idle', data: null, collection: null });
          return;
        }
        setState({
          status: 'ready',
          data: citychroneHour(published.collection),
          collection: published.collection,
        });
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return;
        setState({ status: 'error', data: null, collection: null });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cityId, hour, enabled]);

  return state;
}

/**
 * The travel-time matrix behind one hour's isochrones. ~3 MB per hour, so it
 * only loads while the isochrone view is active; the URL cache makes
 * revisiting an hour free.
 */
export function useTravelTimes(cityId, hour, enabled = false) {
  const [state, setState] = useState({ status: 'idle', matrix: null });

  useEffect(() => {
    if (!enabled || !cityId) {
      setState({ status: 'idle', matrix: null });
      return undefined;
    }
    let cancelled = false;
    const controller = new AbortController();
    setState((current) => ({ ...current, status: 'pending' }));

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        const published = await provider.travelTimes('citychrone', cityId, hour, catalogue, {
          signal: controller.signal,
        });
        if (cancelled) return;
        setState(
          published
            ? { status: 'ready', matrix: published.matrix }
            : { status: 'idle', matrix: null },
        );
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return;
        setState({ status: 'error', matrix: null });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cityId, hour, enabled]);

  return state;
}

/**
 * One platform's cartogram polygons for a harmonised city — the combined
 * viewer's union mesh is geographic, so this is the switch in the other
 * direction. Null where that platform publishes no cartogram, which is how
 * the viewer knows to say so rather than draw one.
 *
 * @returns {{ status: 'idle'|'pending'|'ready'|'error', collection: object|null }}
 */
export function useAtlasCartogram(cityId, platformId, enabled) {
  const [state, setState] = useState({ status: 'idle', collection: null });
  const loaded = useRef(null);

  useEffect(() => {
    const key = `${cityId}/${platformId}`;
    if (!enabled || !cityId || !platformId) return undefined;
    // Each layer has its own cartogram, so the key carries both — switching
    // layer while in cartogram view has to fetch the new one.
    if (loaded.current === key) return undefined;

    let cancelled = false;
    const controller = new AbortController();
    setState({ status: 'pending', collection: null });

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        const result = await provider.atlasGeometry(cityId, platformId, catalogue, {
          signal: controller.signal,
        });
        if (cancelled) return;
        if (!result) {
          setState({ status: 'idle', collection: null });
          return;
        }
        loaded.current = key;
        setState({ status: 'ready', collection: result.collection });
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return;
        setState({ status: 'error', collection: null });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cityId, platformId, enabled]);

  return state;
}
