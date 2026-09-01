import { useLocation } from 'react-router-dom';
import { AtlasMap } from '../map/AtlasMap.jsx';
import { WORLD_CENTER, WORLD_ZOOM_BOOST } from '../map/framing.js';
import { CoverageLayer } from './CityLayer.jsx';
import { useAllCoverage } from '../data/useAtlasData.js';
import './Backdrop.css';

// Screens that are themselves a full-bleed map. The backdrop would sit behind
// an opaque map, costing a second WebGL context to draw nothing.
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
 */
export function Backdrop() {
  const { pathname } = useLocation();
  const { cities } = useAllCoverage();
  if (OWN_MAP.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <div className="aa-backdrop" aria-hidden="true">
      <AtlasMap
        fitWorldWidth
        worldZoomBoost={WORLD_ZOOM_BOOST}
        center={WORLD_CENTER}
        interactive={false}
        label=""
      >
        <CoverageLayer cities={cities} interactive={false} />
      </AtlasMap>
      <div className="aa-backdrop__veil" />
    </div>
  );
}
