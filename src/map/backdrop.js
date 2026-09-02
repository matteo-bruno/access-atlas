import { useEffect, useSyncExternalStore } from 'react';

/**
 * Whether a full-bleed map is currently covering the site's backdrop.
 *
 * The backdrop (`components/Backdrop.jsx`) is one coverage map fixed behind
 * every page, and the two screens that are themselves a map — the platform
 * tab and the city view — draw their own. Unmounting the backdrop the moment
 * the URL changed made stepping between them read as one map leaving and
 * another arriving: the world vanished, a sheet of paper showed for as long
 * as the new map took to build, and the world came back.
 *
 * So the backdrop is not dismissed by the route. It is dismissed by the
 * covering map, once that map has actually painted — the two are framed
 * identically (see `map/framing.js`), so the handover is a change of chrome
 * over a world that never moves. Leaving such a screen is the same story
 * backwards: the covering map unmounts, the count drops, and the backdrop is
 * already there underneath.
 *
 * A count rather than a flag: during a route cross-fade the outgoing screen
 * is still mounted while the incoming one arrives, and a flag would let the
 * one leaving switch the backdrop back on over the one that just took over.
 */
let covering = 0;
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) listener();
}

/** For the backdrop: is anything covering it right now? */
export function useBackdropCovered() {
  return useSyncExternalStore(
    subscribe,
    () => covering > 0,
    // Server-rendered or pre-hydration: nothing has painted, so nothing covers.
    () => false,
  );
}

/**
 * For a full-bleed map: declare that it is covering the backdrop.
 *
 * Called with the map's own readiness, so the backdrop is only let go once
 * there is something in front of it.
 *
 * @param {boolean} covers
 */
export function useCoversBackdrop(covers) {
  useEffect(() => {
    if (!covers) return undefined;
    covering += 1;
    notify();
    return () => {
      covering -= 1;
      notify();
    };
  }, [covers]);
}
