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
 * The longitude span is `360 / 2^boost` at any width (the fit zoom already
 * scales with the container), so zero is the plain fit — the whole world
 * across the container — and each step of boost halves it. These values are
 * what `coverageFraming()` derives for the coverage published today; keeping
 * the fallback equal to the derived pose is what stops a cold load from
 * visibly re-framing when the catalogue arrives.
 *
 * **Do not hand-tune these to suit one screenshot.** They are a cache of the
 * function's output, not an independent design choice — if the frame is
 * wrong, the padding or the clamp below is what wants changing.
 */
export const WORLD_ZOOM_BOOST = 1.04;
export const WORLD_CENTER = [-52.16, 49.29];

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
 * about 68° of longitude, roughly Europe end to end.
 */
const MAX_COVERAGE_BOOST = 2.4;

const mercatorY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const inverseMercatorY = (y) => ((Math.atan(Math.exp(y)) - Math.PI / 4) * 360) / Math.PI;

/**
 * The shortest arc of longitude containing every point.
 *
 * Not `max - min`: coverage that straddles the antimeridian (Auckland at
 * +174°, Honolulu at −157°) is 29° of world across the date line, and a plain
 * bbox reads it as 331° the long way round and frames the entire globe to
 * show two cities that are neighbours. The arc is the complement of the
 * *largest gap* between consecutive longitudes, which is that 29°.
 *
 * @returns {{ span: number, center: number }} degrees, centre in [−180, 180]
 */
function longitudeArc(lons) {
  const sorted = [...lons].sort((a, b) => a - b);
  if (sorted.length === 1) return { span: 0, center: sorted[0] };

  let widestGap = -1;
  let gapStartsAt = sorted[0];
  for (let i = 0; i < sorted.length; i++) {
    const from = sorted[i];
    // The last point's gap wraps around the world to the first.
    const to = i === sorted.length - 1 ? sorted[0] + 360 : sorted[i + 1];
    if (to - from > widestGap) {
      widestGap = to - from;
      gapStartsAt = from;
    }
  }

  const span = 360 - widestGap;
  // The data starts where the widest gap ends and runs `span` degrees east.
  const west = gapStartsAt + widestGap;
  const center = ((((west + span / 2) % 360) + 540) % 360) - 180;
  return { span, center };
}

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
 * Both callers pass the *merged* coverage — every platform, not the one whose
 * tab is open — so switching platform never moves the world.
 *
 * @param {{lon: number, lat: number}[]} cities
 * @returns {{ center: [number, number], zoomBoost: number }}
 */
export function coverageFraming(cities) {
  const points = (cities ?? []).filter(
    (city) => Number.isFinite(city?.lon) && Number.isFinite(city?.lat),
  );
  if (points.length === 0) {
    return { center: WORLD_CENTER, zoomBoost: WORLD_ZOOM_BOOST };
  }

  const { span, center: centerLon } = longitudeArc(points.map((c) => c.lon));

  // Latitude's midpoint is taken in Mercator rather than in degrees: the
  // projection stretches toward the poles, so the degree-midpoint of 37°N and
  // 59°N sits visibly north of the middle of the drawn band.
  const lats = points.map((c) => c.lat);
  const centerLat = inverseMercatorY(
    (mercatorY(Math.min(...lats)) + mercatorY(Math.max(...lats))) / 2,
  );

  // A single city (or several at one longitude) has no span to fit, so it
  // takes the ceiling rather than dividing by zero.
  const zoomBoost =
    span > 0
      ? Math.min(MAX_COVERAGE_BOOST, Math.max(0, Math.log2(360 / (span * COVERAGE_PADDING))))
      : MAX_COVERAGE_BOOST;

  return { center: [centerLon, centerLat], zoomBoost };
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
