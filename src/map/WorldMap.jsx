import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { geoGraticule, geoPath } from 'd3-geo';
import { interpolateZoom } from 'd3-interpolate';
import { quadtree } from 'd3-quadtree';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { PAPER } from '../data/brand.js';
import { useCoversBackdrop } from './backdrop.js';
import { worldProjection, worldZoom } from './framing.js';
import { LAND_URL } from './style.js';
import './AtlasMap.css';
import './WorldMap.css';

// The deepest a world map zooms, as a MapLibre zoom (see `worldZoom`): about
// a region, which is as far as Natural Earth 110m has anything to say. A city
// is opened in the city view, not zoomed into here.
const MAX_ZOOM = 6;

// A marker answers the pointer this many pixels past its edge: twenty dots
// on a world map are small targets.
const HIT_SLOP = 4;

// The land is one file every world map draws, so it is fetched once.
let landPromise = null;
function loadLand() {
  if (!landPromise) {
    landPromise = fetch(LAND_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.json();
      })
      .catch((error) => {
        // Let the next map retry rather than remembering a failure for good.
        landPromise = null;
        throw error;
      });
  }
  return landPromise;
}

const GRATICULE = geoGraticule().step([30, 30]).extentMinor([[-180, -80], [180, 80]])();
const SPHERE = { type: 'Sphere' };

/**
 * A world map drawn in Equal Earth, on a canvas.
 *
 * The site's two coverage maps (the backdrop behind every page and the
 * platform screen) and the platform cards' thumbnails. MapLibre cannot draw
 * an equal-area world (see map/framing.js), so these are d3-geo: paper, the
 * projection's own outline, a graticule, Natural Earth's land, and the
 * markers. The city view is still MapLibre, and nothing here is shared with
 * it but the paper's colours.
 *
 * The pose comes from `worldProjection(size, frame)`, the same function the
 * smoke suite reprojects cities with. Pan and zoom are a d3-zoom transform on
 * top of it, reset when the box is resized, as the MapLibre maps refitted.
 *
 * @param {object}   props
 * @param {{center: [number, number], zoomBoost: number, extent?: object}} props.frame
 * @param {object[]} props.cities          `{ id, lon, lat, … }`
 * @param {Function} props.markerStyle     (city, zoom) => style, see map/layers.js
 * @param {boolean}  [props.interactive]   pan, zoom, hover and click
 * @param {Function} [props.tooltip]       city => string
 * @param {Function} [props.onSelect]      city => void
 * @param {boolean}  [props.coversBackdrop] see map/backdrop.js
 * @param {string}   [props.highlight]     a city id to draw as if hovered:
 *                                         the search's highlighted result
 * @param {string}   [props.label]
 */
export function WorldMap({
  frame,
  cities,
  markerStyle,
  interactive = false,
  tooltip,
  onSelect,
  coversBackdrop = false,
  highlight = null,
  label,
  className = '',
  ref,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const tipRef = useRef(null);
  const [size, setSize] = useState(null);
  const [land, setLand] = useState(null);
  const [painted, setPainted] = useState(false);
  // The pan and zoom on top of the frame, in CSS pixels.
  const transformRef = useRef(zoomIdentity);
  const zoomRef = useRef(null);
  const hoveredRef = useRef(null);
  const frameRequest = useRef(0);
  const animation = useRef(0);
  const drawRef = useRef(() => {});
  // Latest handlers, so re-renders do not rebind the pointer.
  const handlers = useRef({ tooltip, onSelect });
  handlers.current = { tooltip, onSelect };

  useCoversBackdrop(coversBackdrop && painted);

  useEffect(() => {
    let cancelled = false;
    loadLand()
      .then((collection) => {
        if (!cancelled) setLand(collection);
      })
      .catch((error) => {
        console.error('[world map] land unavailable', error.message);
        // The markers are the map's point; draw them on bare paper.
        if (!cancelled) setLand({ type: 'FeatureCollection', features: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The box, measured: the pose depends on it.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize((previous) =>
        previous && previous.width === width && previous.height === height ? previous : { width, height },
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const frameKey = `${frame?.center?.[0]},${frame?.center?.[1]},${frame?.zoomBoost}`;
  const view = useMemo(
    () => (size?.width && size?.height ? worldProjection(size, frame) : null),
    // The extent only refines a pose the centre and boost already name.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size?.width, size?.height, frameKey],
  );

  // The geography as paths in the frame's pixels, built once per pose and
  // redrawn under the zoom transform: a pan is then a canvas transform, not a
  // reprojection of the land.
  const paths = useMemo(() => {
    if (!view || !land || typeof Path2D === 'undefined') return null;
    const path = geoPath(view.projection);
    return {
      sphere: new Path2D(path(SPHERE)),
      graticule: new Path2D(path(GRATICULE)),
      land: new Path2D(path(land)),
    };
  }, [view, land]);

  // Each city's position in the frame's pixels, before the zoom transform.
  const placed = useMemo(() => {
    if (!view) return [];
    return (cities ?? [])
      .filter((city) => Number.isFinite(city?.lon) && Number.isFinite(city?.lat))
      .map((city) => {
        const point = view.projection([city.lon, city.lat]);
        return point ? { city, x: point[0], y: point[1] } : null;
      })
      .filter(Boolean);
  }, [view, cities]);

  // Where each marker sits on screen and how big it is, for the pointer.
  const hitsRef = useRef({ tree: null, radius: 0 });

  drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas || !view || !paths || !size) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(size.width * dpr);
    const height = Math.round(size.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    const t = transformRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER.mapPaper;
    ctx.fillRect(0, 0, size.width, size.height);

    // The geography, in the frame's pixels under the zoom transform; line
    // widths are divided back out so a hairline stays a hairline.
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);
    ctx.lineWidth = 0.6 / t.k;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.stroke(paths.graticule);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.09)';
    ctx.lineWidth = 0.8 / t.k;
    ctx.stroke(paths.sphere);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = PAPER.mapLand;
    ctx.fill(paths.land);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 0.7 / t.k;
    ctx.strokeStyle = PAPER.mapLandLine;
    ctx.stroke(paths.land);
    ctx.restore();

    // The markers, in screen pixels: they keep their size as the land scales.
    const zoom = worldZoom(view.worldWidth * t.k);
    const hovered = hoveredRef.current;
    const screen = [];
    let largest = 0;
    for (const { city, x, y } of placed) {
      const style = markerStyle(city, zoom);
      const emphasised = city.id === hovered || city.id === highlight;
      const radius = style.radius * (emphasised ? 1.45 : 1);
      const sx = t.x + t.k * x;
      const sy = t.y + t.k * y;
      screen.push({ city, x: sx, y: sy });
      if (radius > largest) largest = radius;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.globalAlpha = style.fillOpacity;
      ctx.fillStyle = style.fill;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (style.strokeWidth > 0) {
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeStyle = style.stroke;
        ctx.stroke();
      }
    }
    hitsRef.current = {
      tree: quadtree(screen, (d) => d.x, (d) => d.y),
      radius: largest + HIT_SLOP,
    };
  };

  const redraw = () => {
    if (frameRequest.current) return;
    frameRequest.current = window.requestAnimationFrame(() => {
      frameRequest.current = 0;
      drawRef.current();
    });
  };

  // A new pose (a resize, or the coverage arriving) starts from the frame
  // again, as the MapLibre maps refitted on resize.
  useEffect(() => {
    transformRef.current = zoomIdentity;
    if (zoomRef.current && canvasRef.current) {
      select(canvasRef.current).property('__zoom', zoomIdentity);
    }
  }, [view]);

  // Drawn synchronously when the inputs change, so the first frame the reader
  // sees is the finished one; the pointer and the zoom go through rAF.
  useEffect(() => {
    if (!view || !paths) return;
    drawRef.current();
    setPainted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, paths, placed, markerStyle, highlight]);

  useEffect(
    () => () => {
      window.cancelAnimationFrame(frameRequest.current);
      window.cancelAnimationFrame(animation.current);
    },
    [],
  );

  // Pan and zoom.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!interactive || !canvas || !view || !size) return undefined;
    const minK = 2 ** -Math.max(0, Math.log2(view.worldWidth / size.width));
    const maxK = Math.max(1, 2 ** (MAX_ZOOM - worldZoom(view.worldWidth)));
    // The world may be panned until its edge reaches the middle of the box,
    // never off it.
    const [[x0, y0], [x1, y1]] = geoPath(view.projection).bounds(SPHERE);
    const behaviour = d3Zoom()
      .scaleExtent([Math.min(1, minK), maxK])
      .translateExtent([
        [x0 - size.width / 2, y0 - size.height / 2],
        [x1 + size.width / 2, y1 + size.height / 2],
      ])
      .extent([
        [0, 0],
        [size.width, size.height],
      ])
      // A gesture takes the camera from an animation in flight; the
      // animation's own steps (no source event) do not.
      .on('start', (event) => {
        if (event.sourceEvent) window.cancelAnimationFrame(animation.current);
      })
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        hideTip();
        redraw();
      });
    zoomRef.current = behaviour;
    const selection = select(canvas);
    selection.call(behaviour).property('__zoom', transformRef.current);
    // d3-zoom animates a double click with d3-transition, which this map
    // does without: its own animation answers it instead (below).
    selection.on('dblclick.zoom', null);
    return () => {
      selection.on('.zoom', null);
      zoomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, view, size]);

  // Move the camera to `target` (a zoom transform), the way MapLibre's flyTo
  // does: zooming out, across and back in, at a speed set by the distance.
  const animateTo = (target, duration) => {
    const canvas = canvasRef.current;
    const behaviour = zoomRef.current;
    if (!canvas || !behaviour || !size) return;
    const constrained = behaviour.constrain()(
      target,
      [
        [0, 0],
        [size.width, size.height],
      ],
      behaviour.translateExtent(),
    );
    const viewOf = (t) => [(size.width / 2 - t.x) / t.k, (size.height / 2 - t.y) / t.k, size.width / t.k];
    const path = interpolateZoom(viewOf(transformRef.current), viewOf(constrained));
    const total = duration ?? Math.max(300, Math.min(1400, path.duration));
    const selection = select(canvas);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    window.cancelAnimationFrame(animation.current);
    const step = (now) => {
      const progress = reduced ? 1 : Math.min(1, (now - start) / total);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
      const [cx, cy, w] = path(eased);
      const k = size.width / w;
      behaviour.transform(
        selection,
        zoomIdentity.translate(size.width / 2 - cx * k, size.height / 2 - cy * k).scale(k),
      );
      if (progress < 1) animation.current = window.requestAnimationFrame(step);
    };
    animation.current = window.requestAnimationFrame(step);
  };

  // Zoom by `factor` keeping the point `at` (screen pixels) where it is:
  // the middle of the box for the buttons, as MapLibre's do, and the pointer
  // for a double click.
  const zoomBy = (factor, at = null) => {
    if (!size) return;
    const t = transformRef.current;
    const [k0, k1] = zoomRef.current?.scaleExtent() ?? [1, 1];
    const k = Math.min(k1, Math.max(k0, t.k * factor));
    const [px, py] = at ?? [size.width / 2, size.height / 2];
    const x = (px - t.x) / t.k;
    const y = (py - t.y) / t.k;
    animateTo(zoomIdentity.translate(px - x * k, py - y * k).scale(k), 300);
  };

  useImperativeHandle(ref, () => ({
    get canvas() {
      return canvasRef.current;
    },
    zoomIn: () => zoomBy(2),
    zoomOut: () => zoomBy(0.5),
    /** `{ center: [lon, lat], zoom }`, the zoom as MapLibre's. */
    flyTo: ({ center, zoom: target = 4, duration } = {}) => {
      if (!view || !size || !center) return;
      const point = view.projection(center);
      if (!point) return;
      const k = 2 ** (Math.min(MAX_ZOOM, target) - worldZoom(view.worldWidth));
      animateTo(
        zoomIdentity.translate(size.width / 2 - point[0] * k, size.height / 2 - point[1] * k).scale(k),
        duration,
      );
    },
  }));

  // The pointer: the nearest marker within reach, if any.
  function hit(event) {
    const canvas = canvasRef.current;
    const { tree, radius } = hitsRef.current;
    if (!canvas || !tree) return null;
    const box = canvas.getBoundingClientRect();
    const found = tree.find(event.clientX - box.left, event.clientY - box.top, radius);
    return found ? { ...found, box } : null;
  }

  function hideTip() {
    if (tipRef.current) tipRef.current.hidden = true;
  }

  const handleMove = (event) => {
    // A drag is a pan, not a hover.
    if (event.buttons) return;
    const found = hit(event);
    const id = found?.city.id ?? null;
    canvasRef.current.style.cursor = found ? 'pointer' : '';
    if (id !== hoveredRef.current) {
      hoveredRef.current = id;
      redraw();
    }
    const text = found && handlers.current.tooltip?.(found.city);
    const tip = tipRef.current;
    if (!tip) return;
    if (!text) {
      hideTip();
      return;
    }
    // textContent, never innerHTML: city names are data, not markup.
    tip.textContent = text;
    tip.hidden = false;
    tip.style.transform = `translate(${Math.round(found.x)}px, ${Math.round(found.y)}px)`;
  };

  const handleLeave = () => {
    hideTip();
    if (canvasRef.current) canvasRef.current.style.cursor = '';
    if (hoveredRef.current != null) {
      hoveredRef.current = null;
      redraw();
    }
  };

  const handleClick = (event) => {
    const found = hit(event);
    if (found) handlers.current.onSelect?.(found.city);
  };

  const handleDoubleClick = (event) => {
    const box = canvasRef.current.getBoundingClientRect();
    zoomBy(event.shiftKey ? 0.5 : 2, [event.clientX - box.left, event.clientY - box.top]);
  };

  return (
    <div
      ref={containerRef}
      // Blank until it has drawn, as AtlasMap is: an empty map's paper is an
      // opaque sheet, and on the platform screen it would paint the backdrop
      // out while there is nothing yet to show in its place.
      className={`aa-map aa-worldmap${painted ? '' : ' aa-map--blank'} ${className}`.trim()}
      role={interactive ? 'application' : 'img'}
      aria-label={label}
    >
      <canvas
        ref={canvasRef}
        className="aa-worldmap__canvas"
        onPointerMove={interactive ? handleMove : undefined}
        onPointerLeave={interactive ? handleLeave : undefined}
        onClick={interactive ? handleClick : undefined}
        onDoubleClick={interactive ? handleDoubleClick : undefined}
      />
      {interactive && <div ref={tipRef} className="aa-map-popup aa-worldmap__tip" hidden />}
    </div>
  );
}
