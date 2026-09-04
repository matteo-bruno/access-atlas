import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AtlasMap } from '../map/AtlasMap.jsx';
import { useBackdropCovered } from '../map/backdrop.js';
import { coverageFraming } from '../map/framing.js';
import { CoverageLayer } from './CityLayer.jsx';
import { useAllCoverage } from '../data/useAtlasData.js';
import './Backdrop.css';

// Screens that are themselves a full-bleed map. The backdrop ends up behind
// an opaque map there, so it is dropped from the compositor once that map has
// painted — but not before, and it is not torn down: see below.
const OWN_MAP = ['/platforms', '/atlas'];

/**
 * The map behind the whole site.
 *
 * One instance, in the shell, fixed to the viewport: it never scrolls, never
 * remounts on navigation, and is the same coverage map the platform screen
 * draws — so the backdrop is the Atlas's own data rather than a texture that
 * resembles it.
 *
 * It is framed exactly as the platform screen's map is — same centre, same
 * zoom past the world-width fit, and the same box, which is why the element
 * starts below the nav rather than at the top of the viewport. Stepping from
 * the front door onto the platform tab then keeps the world still.
 *
 * A veil sits over it — the same one on every page and at every scroll
 * position, densest where the copy sits and nearly clear on the far side.
 * Nothing above it paints it out: the map is the site's subject, so it is
 * visible from the first screen to the last, and what scrolls over it is
 * transparent between its own cards.
 *
 * **It survives the two screens that draw their own map.** Unmounting it on
 * their route emptied the frame at the exact moment the reader stepped onto
 * the platform tab: the world went, paper showed for as long as the new map
 * took to build, and the world came back — one map leaving and another
 * arriving, when they are meant to be the same world. So the route only
 * decides how the backdrop is *dressed*; whether it is on screen at all is
 * decided by the covering map, which reports itself once it has painted
 * (`useBackdropCovered`). Both directions then hand over with something in
 * frame throughout: the incoming map fades up over a world in the same place,
 * and the outgoing one fades off one that is still there behind it.
 *
 * Covered is hidden rather than unmounted, so returning is instant and the
 * WebGL context is built once. It costs nothing to composite while hidden,
 * and `visibility` rather than `display` keeps the box measurable, which is
 * what lets the map keep its world-width fit across a resize it cannot see.
 */
export function Backdrop() {
  const { pathname } = useLocation();
  const { cities } = useAllCoverage();
  // The pose follows the coverage rather than a constant, so the world stays
  // framed on the data as cities are published beyond the original clusters
  // (see coverageFraming). The platform screen derives it from the same
  // merged list, which is what keeps the two maps one map.
  const { center, zoomBoost } = coverageFraming(cities);
  const mapRef = useRef(null);
  const ownMap = OWN_MAP.some((prefix) => pathname.startsWith(prefix));
  // Both halves have to hold, and they answer different questions.
  //
  // `useBackdropCovered` is the map's: has something actually painted in
  // front, and is it the screen that is arriving rather than one dissolving?
  // (A route cross-fade counts as nothing covering — see map/backdrop.js.)
  //
  // `ownMap` is the route's: only the two full-bleed map screens ever cover
  // the backdrop, so a stale count cannot hide the world on a page of copy.
  const covered = useBackdropCovered() && ownMap;

  // Built the first time a page actually wants it, and kept from then on.
  // Opening the site straight onto a full-bleed map screen therefore still
  // costs one WebGL context, not two.
  const [built, setBuilt] = useState(!ownMap);
  useEffect(() => {
    if (!ownMap) setBuilt(true);
  }, [ownMap]);

  // Coming back out from under a covering map: ask for a frame rather than
  // trusting the compositor to have kept the one it was hidden with.
  useEffect(() => {
    if (!covered) mapRef.current?.map?.triggerRepaint();
  }, [covered]);

  if (!built) return null;

  return (
    <div
      className={`aa-backdrop${ownMap ? ' aa-backdrop--bare' : ''}${
        covered ? ' aa-backdrop--covered' : ''
      }`}
      aria-hidden="true"
    >
      <AtlasMap
        ref={mapRef}
        fitWorldWidth
        worldZoomBoost={zoomBoost}
        center={center}
        interactive={false}
        label=""
      >
        <CoverageLayer cities={cities} interactive={false} />
      </AtlasMap>
      <div className="aa-backdrop__veil" />
    </div>
  );
}
