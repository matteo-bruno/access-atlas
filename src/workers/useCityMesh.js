import { useEffect, useRef, useState } from 'react';
import MeshWorker from './mesh.worker.js?worker';
import { buildCityMesh } from '../data/mesh.js';
import {
  meshFromPublished,
  meshFromPublishedCdi,
  meshFromPublishedFifteen,
} from '../data/adapters.js';
import { getDataProvider } from '../data/sources.js';
import { PLATFORMS_BY_ID } from '../data/platforms.js';

// Returns { status, data, error, source } for a city's mesh.
//
// A published dataset wins when the catalogue offers one; otherwise the seed
// mesh is generated in a Worker. Both paths produce the same contract
// ({ geojson, stats, scatter, thresholds }), so the city page does not care
// which it got — `source` is there to tell the reader, not the renderer.
//
// Falls back to computing inline where Workers are unavailable (older
// browsers, some test runners) so the page still renders.
export function useCityMesh(profile, platformId) {
  const [state, setState] = useState({
    status: 'pending',
    data: null,
    error: null,
    source: null,
  });
  const workerRef = useRef(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!profile) {
      setState({ status: 'idle', data: null, error: null, source: null });
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    const id = ++requestId.current;
    const params = { center: profile.center, ...profile.mesh };
    setState({ status: 'pending', data: null, error: null, source: null });

    const runInline = () => {
      try {
        const result = buildCityMesh(params);
        if (!cancelled) setState({ status: 'ready', data: result, error: null, source: 'seed' });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', data: null, error, source: null });
      }
    };

    const runSeed = () => {
      if (typeof Worker === 'undefined') return runInline();

      let worker;
      try {
        worker = new MeshWorker();
      } catch {
        return runInline();
      }
      workerRef.current = worker;

      worker.onmessage = (event) => {
        const msg = event.data ?? {};
        // Ignore results for a city we have already navigated away from.
        if (cancelled || msg.id !== id) return;
        if (msg.ok) setState({ status: 'ready', data: msg.result, error: null, source: 'seed' });
        else setState({ status: 'error', data: null, error: new Error(msg.error), source: null });
      };

      worker.onerror = (event) => {
        if (cancelled) return;
        // The worker died (bundling issue, OOM) — do the work inline rather
        // than leaving the page stuck on a spinner.
        event.preventDefault?.();
        runInline();
      };

      worker.postMessage({ id, params });
      return undefined;
    };

    (async () => {
      try {
        const provider = getDataProvider();
        const catalogue = await provider.catalogue({ signal: controller.signal });
        const published = await provider.cityMesh(platformId, profile.id, catalogue, {
          signal: controller.signal,
        });
        if (cancelled) return;
        if (published) {
          // Each platform measures something different; the adapters bring
          // them to one contract so the page renders either.
          const data =
            platformId === 'cardep'
              ? meshFromPublishedCdi(
                  published.collection,
                  published.profile,
                  PLATFORMS_BY_ID.cardep.stops,
                )
              : platformId === 'fifteen'
                ? meshFromPublishedFifteen(published.collection, published.profile)
                : meshFromPublished(published.collection, published.profile);
          if (!cancelled) setState({ status: 'ready', data, error: null, source: 'published' });
          return;
        }
      } catch (error) {
        if (error?.name === 'AbortError' || cancelled) return;
        // A published file that fails to load or adapt falls back to the seed
        // mesh, but say so — silently drawing a synthetic city in place of a
        // broken real one is exactly the confusion this layer exists to avoid.
        if (import.meta.env.DEV) {
          console.warn(`[data] published mesh for ${profile.id} unusable`, error.message);
        }
      }
      if (!cancelled) runSeed();
    })();

    return () => {
      cancelled = true;
      controller.abort();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [profile, platformId]);

  return state;
}
