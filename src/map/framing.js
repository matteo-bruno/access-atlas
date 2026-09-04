// How a city map frames its city.
//
// The catalogue's `zoom` is a fit computed offline from the extent of the
// city's cells, backed off far enough to guarantee margin at any aspect ratio
// (see `zoomFor` in scripts/build-atlas.mjs). That is the right figure to
// store — it depends only on the data — but it is deliberately conservative,
// and the city panels are wide, so a city drawn at it sits small in a lot of
// empty paper. City views close that gap here rather than by rewriting the
// catalogue, which would put a presentation choice into the published data.

const CITY_ZOOM_BOOST = 1.1;

/**
 * How far past the world-width fit the site's coverage maps sit.
 *
 * Two maps show it — the backdrop behind every page, and the platform screen
 * — and they have to be the same map: the front door hands the reader
 * straight to the platform tab, and a world that jumps a step between them
 * reads as two different maps rather than one. So the figure lives here and
 * both pass it, alongside the same centre and the same box (the backdrop
 * starts below the nav for exactly that reason — see Backdrop.css).
 *
 * Zero is the plain fit: the whole world across the container, every city on
 * screen with the map spanning the full 360° in longitude. The Atlas is now
 * global in ambition — cities are being added on every continent — so the
 * frame stays at the plain fit rather than trading paper for a data-centric
 * boost that would crop new regions off the sides. The longitude span is
 * `360 / 2^boost`, so a boost of 0 means the whole world sits across the
 * container's width. Latitude follows the viewport's own aspect ratio and is
 * never the binding constraint: the poles clip, which is expected — no
 * published city sits above ~60°N.
 */
export const WORLD_ZOOM_BOOST = 0;

/**
 * The centre both coverage maps are framed on.
 *
 * A shade north of the equator, on the prime meridian: this keeps the
 * populated latitudes (Europe, North America, most of Asia, the northern
 * half of Africa) inside a viewport of any reasonable aspect ratio, and
 * puts the map's horizontal midline through the belt where most cities
 * are. Longitude 0 keeps the frame symmetric around the Atlantic + Europe
 * axis rather than biasing east or west.
 */
export const WORLD_CENTER = [0, 25];

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
