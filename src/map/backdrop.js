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
 *
 * The count is qualified by one other thing: whether a route cross-fade is
 * running. A covering map that belongs to the screen being *left* is still
 * mounted and still counted, but it is dissolving — and stepping from one map
 * screen to the other (the platform world to a city, say) it was the only
 * thing counted, so the backdrop stayed hidden behind a map fading to nothing
 * and the frame emptied for the length of the fade. While a fade is in
 * flight, then, nothing is taken to cover: the world comes back underneath
 * the outgoing map and that map dissolves into it.
 */
let covering = 0;
let fading = false;
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
    () => covering > 0 && !fading,
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

/**
 * For the route cross-fade: declare that one is running.
 *
 * Called by `FadingRoutes` with its own state, so the backdrop learns that
 * the screen on top is on its way out at the moment the fade starts rather
 * than when that screen finally unmounts — which is a whole fade too late.
 *
 * @param {boolean} isFading
 */
export function useRouteFading(isFading) {
  useEffect(() => {
    fading = isFading;
    notify();
  }, [isFading]);
}
