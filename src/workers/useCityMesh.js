import { useEffect, useRef, useState } from 'react';
import MeshWorker from './mesh.worker.js?worker';
import { buildCityMesh } from '../data/mesh.js';

// Runs buildCityMesh in a Worker and returns { status, data, error }.
// Falls back to computing inline where Workers are unavailable (older
// browsers, some test runners) so the page still renders.
export function useCityMesh(profile) {
  const [state, setState] = useState({ status: 'pending', data: null, error: null });
  const workerRef = useRef(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!profile) {
      setState({ status: 'idle', data: null, error: null });
      return undefined;
    }

    let cancelled = false;
    const id = ++requestId.current;
    const params = { center: profile.center, ...profile.mesh };
    setState({ status: 'pending', data: null, error: null });

    const runInline = () => {
      try {
        const result = buildCityMesh(params);
        if (!cancelled) setState({ status: 'ready', data: result, error: null });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', data: null, error });
      }
    };

    if (typeof Worker === 'undefined') {
      runInline();
      return () => {
        cancelled = true;
      };
    }

    let worker;
    try {
      worker = new MeshWorker();
    } catch {
      runInline();
      return () => {
        cancelled = true;
      };
    }

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const msg = event.data ?? {};
      // Ignore results for a city we have already navigated away from.
      if (cancelled || msg.id !== id) return;
      if (msg.ok) setState({ status: 'ready', data: msg.result, error: null });
      else setState({ status: 'error', data: null, error: new Error(msg.error) });
    };

    worker.onerror = (event) => {
      if (cancelled) return;
      // The worker died (bundling issue, OOM) — do the work inline rather than
      // leaving the page stuck on a spinner.
      event.preventDefault?.();
      runInline();
    };

    worker.postMessage({ id, params });

    return () => {
      cancelled = true;
      worker.terminate();
      workerRef.current = null;
    };
  }, [profile]);

  return state;
}
