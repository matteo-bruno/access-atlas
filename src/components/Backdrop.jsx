import { useLocation } from 'react-router-dom';
import { AtlasMap } from '../map/AtlasMap.jsx';
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
 * A veil sits over it. Strong by default, because most pages are text and the
 * map has to stay a suggestion behind them; light on the landing, where
 * showing the map *is* the point. Content above it is opaque where it needs
 * to be, so scrolling reads as a sheet moving over a fixed map.
 */
export function Backdrop() {
  const { pathname } = useLocation();
  const { cities } = useAllCoverage();
  if (OWN_MAP.some((prefix) => pathname.startsWith(prefix))) return null;

  const landing = pathname === '/';

  return (
    <div className={`aa-backdrop${landing ? ' aa-backdrop--open' : ''}`} aria-hidden="true">
      <AtlasMap fitWorldWidth center={[10, 20]} interactive={false} label="">
        <CoverageLayer cities={cities} interactive={false} />
      </AtlasMap>
      <div className="aa-backdrop__veil" />
    </div>
  );
}
