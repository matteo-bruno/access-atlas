// How a city map frames its city.
//
// The catalogue's `zoom` is a fit computed offline from the extent of the
// city's cells, backed off far enough to guarantee margin at any aspect ratio
// (see `zoomFor` in scripts/lib/bundle.mjs). That is the right figure to
// store — it depends only on the data — but it is deliberately conservative,
// and the city panels are wide, so a city drawn at it sits small in a lot of
// empty paper. City views close that gap here rather than by rewriting the
// catalogue, which would put a presentation choice into the published data.

const CITY_ZOOM_BOOST = 1.1;

import { geoEqualEarth } from 'd3-geo';

/**
 * The projection the site's world maps are drawn in: Equal Earth, on the
 * Greenwich meridian.
 *
 * An equal-area projection, because what these maps show is where in the
 * world the Atlas has data, and Mercator answered that with a Europe and a
 * North America twice the size of Africa. MapLibre cannot draw it (version 6
 * registers mercator, globe and vertical-perspective, and nothing else), so
 * the world maps are drawn by `WorldMap.jsx` with d3-geo, and only the city
 * view is MapLibre.
 *
 * The central meridian is fixed at 0° rather than following the coverage:
 * a world that rotates as cities are added is a different map each time.
 * The price is that coverage straddling the antimeridian (Auckland and
 * Honolulu) is framed the long way round, which is what a flat map with one
 * seam is.
 */
export const worldProjectionAt = (scale = 1) => geoEqualEarth().rotate([0, 0]).scale(scale);

const UNIT = worldProjectionAt(1).translate([0, 0]);
// Equal Earth at scale 1: half the world's width (at the equator) and half
// its height (at the poles).
const HALF_WIDTH = UNIT([180, 0])[0];
const HALF_HEIGHT = -UNIT([0, 90])[1];

/**
 * How far past the world-width fit the site's coverage maps sit, and the
 * centre they look at, when the published coverage is not known yet.
 *
 * Two maps show that coverage — the backdrop behind every page, and the
 * platform screen — and they have to be the same map: the front door hands
 * the reader straight to the platform tab, and a world that jumps a step
 * between them reads as two different maps rather than one. So both take
 * their pose from `coverageFraming()` below, over the same merged coverage,
 * and fall back to these two constants only for the frame or two before the
 * catalogue has answered.
 *
 * The world's width is `container / 2^-boost` at any size, so zero is the
 * plain fit (the whole world across the container) and each step of boost
 * halves the part of it on screen. These values are what
 * `coverageFraming()` derives for the coverage published today; keeping the
 * fallback equal to the derived pose is what stops a cold load from visibly
 * re-framing when the catalogue arrives.
 *
 * **Do not hand-tune these to suit one screenshot.** They are a cache of the
 * function's output, not an independent design choice — if the frame is
 * wrong, the padding or the clamp below is what wants changing.
 */
export const WORLD_ZOOM_BOOST = 0.33;
export const WORLD_CENTER = [14.27, 46.7];

/**
 * How much wider than the coverage itself the frame is drawn.
 *
 * 1.25 leaves an eighth of the span as paper on each side, which is enough
 * that a marker never sits on the frame's edge and enough that adding one
 * city just outside the current extent does not immediately crop it.
 */
const COVERAGE_PADDING = 1.25;

/**
 * The tightest the coverage map is ever allowed to frame.
 *
 * Without a ceiling, an Atlas publishing a single city would zoom its world
 * map to that city's rooftops — the coverage map's job is to say where in the
 * world the Atlas has data, which needs the world visible around it. 2.4 is
 * about a fifth of the world's width, roughly Europe end to end.
 */
const MAX_COVERAGE_BOOST = 2.4;

/**
 * Where the site's two coverage maps should look, derived from the coverage
 * they are about to draw.
 *
 * The Atlas is global in ambition — cities are being added well beyond the
 * European cluster and the handful of North American ones it started with —
 * and a pose written down once goes wrong in both directions as that happens:
 * too tight and the new continents are cropped off the sides, too loose and
 * the cities that *are* published shrink to specks on an empty ocean. Neither
 * failure is visible to a test that only asks whether the markers are inside
 * the frame, so the frame follows the data instead of being asserted about.
 *
 * Measured in the projection, not in degrees: Equal Earth's meridians bend,
 * so a degree of longitude is narrower at Oslo than at Rome, and the box
 * that holds the markers on screen is the box of their projected positions.
 * `extent` is that box, at scale 1, so `worldProjection` can also fit it
 * against a box that is shorter than it is wide.
 *
 * Both callers pass the *merged* coverage — every platform, not the one whose
 * tab is open — so switching platform never moves the world.
 *
 * @param {{lon: number, lat: number}[]} cities
 * @returns {{ center: [number, number], zoomBoost: number,
 *             extent: [[number, number], [number, number]] | null }}
 */
export function coverageFraming(cities) {
  const points = (cities ?? [])
    .filter((city) => Number.isFinite(city?.lon) && Number.isFinite(city?.lat))
    .map((city) => UNIT([city.lon, city.lat]));
  if (points.length === 0) {
    return { center: WORLD_CENTER, zoomBoost: WORLD_ZOOM_BOOST, extent: null };
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const extent = [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
  const span = extent[1][0] - extent[0][0];

  // A single city (or several on one meridian) has no span to fit, so it
  // takes the ceiling rather than dividing by zero.
  const zoomBoost =
    span > 0
      ? Math.min(
          MAX_COVERAGE_BOOST,
          Math.max(0, Math.log2((2 * HALF_WIDTH) / (span * COVERAGE_PADDING))),
        )
      : MAX_COVERAGE_BOOST;

  const [lon, lat] = UNIT.invert([
    (extent[0][0] + extent[1][0]) / 2,
    (extent[0][1] + extent[1][1]) / 2,
  ]);
  const round = (v) => Math.round(v * 100) / 100;
  return { center: [round(lon), round(lat)], zoomBoost: round(zoomBoost), extent };
}

/**
 * The projection a world map of this size draws with, posed by a frame from
 * `coverageFraming()` (or any `{ center, zoomBoost }`).
 *
 * The one place a world map's pose is computed: `WorldMap` draws with it and
 * `smoke.mjs` reprojects published cities with it, so the test asks where
 * the map put a city rather than restating the arithmetic.
 *
 * - The scale spans the world across the width, times `2^zoomBoost`, and
 *   backs off if the coverage would not fit the height (a wide, short box).
 * - The centre is then clamped the way a map is: along an axis where the
 *   world is smaller than the box it is centred, and along one where it is
 *   larger no paper shows past its edge. At the plain fit that centres the
 *   whole world; framed on Europe, it keeps the frame full.
 *
 * @param {{ width: number, height: number }} size  CSS pixels
 * @param {{ center?: [number, number], zoomBoost?: number, extent?: object }} frame
 * @returns {{ projection: Function, scale: number, worldWidth: number }}
 */
export function worldProjection({ width, height }, { center = [0, 0], zoomBoost = 0, extent = null } = {}) {
  const fit = Math.max(width, 1) / (2 * HALF_WIDTH);
  let scale = fit * 2 ** zoomBoost;
  if (extent) {
    const tall = (extent[1][1] - extent[0][1]) * COVERAGE_PADDING;
    if (tall > 0 && tall * scale > height) scale = Math.max(fit, height / tall);
  }

  const projection = worldProjectionAt(scale).translate([0, 0]);
  const [cx, cy] = projection(center);
  const clamp = (offset, half, box) => {
    // `offset` puts the world's centre at this screen coordinate.
    if (2 * half <= box) return box / 2;
    return Math.min(half, Math.max(box - half, offset));
  };
  const tx = clamp(width / 2 - cx, HALF_WIDTH * scale, width);
  const ty = clamp(height / 2 - cy, HALF_HEIGHT * scale, height);
  projection.translate([tx, ty]);

  return { projection, scale, worldWidth: 2 * HALF_WIDTH * scale };
}

/**
 * The MapLibre-equivalent zoom of a world drawn `worldWidth` pixels wide:
 * MapLibre draws the world 512 px wide at zoom 0. Marker sizes are written
 * against MapLibre zooms (see map/layers.js), and this keeps them the size
 * they were.
 */
export function worldZoom(worldWidth) {
  return Math.log2(Math.max(worldWidth, 1) / 512);
}

export function cityZoom(profile, boost = CITY_ZOOM_BOOST) {
  return (profile?.zoom ?? 10) + boost;
}

/**
 * The extent of a mesh, as MapLibre's `[[w, s], [e, n]]`.
 *
 * The catalogue's `zoom` is a single number computed offline, so it cannot
 * know the shape of the panel it will be drawn in and has to be conservative
 * enough for any of them. Fitting the real extent is exact: the city fills the
 * space it is given, whatever that space is. A published `bbox` is used when
 * the file states one; otherwise the rings are walked once.
 *
 * @param {object} collection  GeoJSON FeatureCollection
 * @returns {[[number, number], [number, number]]|null}
 */
export function meshBounds(collection) {
  const bbox = collection?.bbox;
  if (Array.isArray(bbox) && bbox.length >= 4 && bbox.every((v) => Number.isFinite(v))) {
    return [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ];
  }

  const features = collection?.features;
  if (!Array.isArray(features) || !features.length) return null;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  const visit = (coords) => {
    // Rings nest to different depths across geometry types; recurse until the
    // pairs turn up rather than switching on `type`.
    if (typeof coords[0] === 'number') {
      const [lon, lat] = coords;
      if (lon < west) west = lon;
      if (lon > east) east = lon;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      return;
    }
    for (const part of coords) visit(part);
  };

  for (const feature of features) {
    if (feature?.geometry?.coordinates) visit(feature.geometry.coordinates);
  }

  if (!Number.isFinite(west) || !Number.isFinite(south)) return null;
  return [
    [west, south],
    [east, north],
  ];
}
