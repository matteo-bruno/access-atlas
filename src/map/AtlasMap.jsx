import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
// maplibre-gl v6 ships named exports only — there is no default export.
import { Map as MapLibreMap, Popup, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// v6 locates its worker with `new URL('./maplibre-gl-worker.mjs', import.meta.url)`,
// which resolves next to the *bundled* chunk — a path Vite never emits, so the
// worker 404s (and, behind an SPA fallback, silently loads index.html instead:
// the map then hangs with its style permanently "loading"). `?worker&url` makes
// Vite bundle the worker properly — plain `?url` would copy the file verbatim
// and leave its `./maplibre-gl-shared.mjs` import dangling. Needs
// `worker.format: 'es'` in vite.config.js, since MapLibre spawns it as a module.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useCoversBackdrop } from './backdrop.js';
import { overlayAnchor, resolveStyle, usesTiles } from './style.js';
import './AtlasMap.css';

const MapCtx = createContext(null);

export function useAtlasMap() {
  return useContext(MapCtx);
}

setWorkerUrl(maplibreWorkerUrl);

// MapLibre renders the whole world across 512 px at zoom 0, so this is the
// zoom at which 360° of longitude exactly spans the container. Short, wide
// world views (the home coverage strip, the card thumbnails) use it so the
// map fills its box horizontally and crops top and bottom — the same framing
// the design's illustration used.
function worldWidthZoom(widthPx) {
  return Math.log2(Math.max(widthPx, 1) / 512);
}

/**
 * Frame a world view: the zoom that spans the container, plus any boost, and
 * the centre it is meant to be looking at.
 *
 * The centre has to be re-applied *with* the zoom rather than left to the
 * constructor. MapLibre clamps the centre latitude so the viewport cannot
 * show past the poles, and at the construction zoom the whole world is barely
 * taller than the box — the clamp there is about ±18.6°, so a map asked to
 * centre on 47°N was quietly pulled to 19°N and never let back once the real
 * zoom arrived. It cost a coverage map that looked centred on the Atlantic
 * while the cities sat in a band at the top.
 */
function applyWorldWidthZoom(map, boost = 0, center = null) {
  const width = map.getContainer().clientWidth;
  if (!width) return;
  const zoom = worldWidthZoom(width) + boost;
  if (center) map.jumpTo({ center, zoom });
  else map.setZoom(zoom);
}

/**
 * A MapLibre map with the Atlas paper style. Children are declarative layers
 * (see <GeoJSONLayer>) and are only mounted once the style has loaded.
 *
 * Thumbnails pass `interactive={false}`; those maps also defer creating their
 * WebGL context until they scroll into view, so the home page does not build
 * five contexts up front.
 */
export function AtlasMap({
  center = [10, 24],
  zoom = 0.85,
  // Thumbnails need to zoom out past 0 to fit a whole world into a small box.
  minZoom = -2,
  maxZoom = 16,
  interactive = true,
  graticule = true,
  // City views draw raster tiles under the mesh; world views keep the paper
  // basemap, which is the approved design and self-contained.
  basemap = false,
  bounds = null,
  fitPadding = 40,
  fitWorldWidth = false,
  // Zoom levels past the world-width fit. The site's two coverage maps — the
  // backdrop and the platform screen — share one value (WORLD_ZOOM_BOOST in
  // map/framing.js) so they frame the world identically; thumbnails keep the
  // plain fit, which is what makes a whole world fit in a small box.
  worldZoomBoost = 0,
  // Set by the two screens that *are* a map. The site's backdrop stays on
  // screen until this map has painted, so stepping onto one of them changes
  // the chrome over the world rather than replacing the world (see
  // map/backdrop.js).
  coversBackdrop = false,
  className = '',
  children,
  onReady,
  ref,
  label,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  // Teardown is registered from inside an async block, so it is held here
  // rather than returned directly from the effect.
  const cleanupRef = useRef(null);
  const [ready, setReady] = useState(false);
  // The basemap's first symbol layer: data layers are inserted before it so
  // place names stay readable above the mesh.
  const [anchor, setAnchor] = useState(undefined);
  const [visible, setVisible] = useState(interactive);

  useCoversBackdrop(coversBackdrop && ready);

  useImperativeHandle(ref, () => ({
    get map() {
      return mapRef.current;
    },
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    flyTo: (options) => mapRef.current?.flyTo(options),
  }));

  // Defer non-interactive maps (card thumbnails) until they are near the
  // viewport.
  useEffect(() => {
    if (visible || !containerRef.current) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: '200px' },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !containerRef.current || mapRef.current) return undefined;

    // The style is resolved before the map exists: a city basemap is fetched
    // from a third party, and handing MapLibre a URL that never answers would
    // leave the map with no style, and so with no data layers at all.
    const controller = new AbortController();
    let disposed = false;

    (async () => {
      const style = await resolveStyle({ graticule, basemap, signal: controller.signal }).catch(
        () => null,
      );
      if (disposed || !style || !containerRef.current) return;

      const map = new MapLibreMap({
        container: containerRef.current,
        style,
        center,
        zoom,
        minZoom,
        maxZoom,
        interactive,
        // Third-party tiles must carry their attribution; the paper basemap is
        // credited in the page chrome instead. Not compact: the credit is a
        // condition of using the tiles, so it is on screen rather than behind
        // an "i" the reader has to find — and it is now the only place the
        // city view states it.
        attributionControl: usesTiles({ basemap }) ? { compact: false } : false,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: true,
        fadeDuration: 0,
      });

      map.touchZoomRotate?.disableRotation();
      mapRef.current = map;

      // Frame it *now*, before the style has loaded and so before the first
      // frame is painted. The camera the constructor was given is only a
      // starting point — a world view's real zoom depends on how wide its
      // container turned out to be, and a city's on the extent of its mesh —
      // and applying it on `load` meant the map painted once at the wrong
      // framing and then jumped to the right one. Nothing renders before the
      // style arrives, so a camera set here is simply the one the reader
      // sees first.
      const frame = () => {
        if (bounds) map.fitBounds(bounds, { padding: fitPadding, duration: 0 });
        else if (fitWorldWidth) applyWorldWidthZoom(map, worldZoomBoost, center);
      };
      frame();

      // MapLibre swallows style/source failures unless you listen for them.
      let basemapReported = false;
      map.on('error', (event) => {
        const message = event?.error?.message ?? event?.error ?? event;
        // A basemap tile that will not load is an external resource being
        // unavailable — offline, a blocked host, the provider down. The data
        // layers are ours and local; anything else is the basemap's, and the
        // map still reads without it. Report it once rather than per tile.
        if (event?.sourceId && !event.sourceId.includes('-src')) {
          if (!basemapReported) {
            basemapReported = true;
            console.warn('[maplibre] basemap tiles unavailable — falling back to paper', message);
          }
          return;
        }
        console.error('[maplibre]', message);
      });

      let announced = false;
      const handleLoad = () => {
        if (announced) return;
        announced = true;
        setAnchor(overlayAnchor(map));
        // Again, now that the style is up: MapLibre clamps the centre against
        // the viewport, and the clamp before a style has given the map its
        // real extent is not the one that will hold.
        frame();
        setReady(true);
        onReady?.(map);
      };
      map.on('load', handleLoad);

      // `load` waits for every source to settle, which a raster basemap on a
      // slow or unreachable host may never do — and the data layers are the
      // point of the map, so they must not wait on a decorative one. The style
      // being parsed is all a child needs to add its source and layer.
      const handleStyle = () => {
        if (map.isStyleLoaded()) handleLoad();
      };
      map.on('styledata', handleStyle);

      // Re-fit on resize so a world view keeps spanning exactly 360° of
      // longitude at any breakpoint.
      let observer;
      if (fitWorldWidth && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          if (map.loaded()) applyWorldWidthZoom(map, worldZoomBoost, center);
        });
        observer.observe(containerRef.current);
      }

      cleanupRef.current = () => {
        observer?.disconnect();
        map.off('load', handleLoad);
        map.off('styledata', handleStyle);
        map.remove();
        mapRef.current = null;
        setReady(false);
      };
    })();

    return () => {
      disposed = true;
      controller.abort();
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
    // center/zoom are initial camera values only — changing them later should
    // move the camera (see below), not tear the map down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, interactive, graticule, basemap, worldZoomBoost]);

  // Keep the camera in sync when a parent drives it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || bounds || fitWorldWidth) return;
    map.jumpTo({ center, zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, center[0], center[1], zoom]);

  // A parent that frames by extent rather than by zoom: refit when the extent
  // changes, and when the panel is resized, since the fit depends on the shape
  // of the space as much as on the data.
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !ready || !bounds) return undefined;
    const fit = () => map.fitBounds(bounds, { padding: fitPadding, duration: 0 });
    fit();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fitPadding, bounds?.[0]?.[0], bounds?.[0]?.[1], bounds?.[1]?.[0], bounds?.[1]?.[1]]);

  return (
    <div
      ref={containerRef}
      // Blank until the style is up: an empty map's paper is an opaque sheet,
      // and on the two screens that take over from the site's backdrop it was
      // painting the world out for as long as MapLibre took to build. It fades
      // up instead, over whatever is behind it (see AtlasMap.css).
      className={`aa-map${ready ? '' : ' aa-map--blank'} ${className}`.trim()}
      role={interactive ? 'application' : 'img'}
      aria-label={label}
    >
      <MapCtx.Provider value={ready ? { map: mapRef.current, anchor } : null}>
        {ready && children}
      </MapCtx.Provider>
    </div>
  );
}

/**
 * Adds one GeoJSON source + one layer, and keeps them in sync with props.
 *
 * @param {object}   props
 * @param {string}   props.id        layer id (source id is derived)
 * @param {object}   props.data      GeoJSON FeatureCollection
 * @param {string}   [props.type]    'circle' | 'fill' | 'line'
 * @param {object}   props.paint
 * @param {Function} [props.onClick] (feature, event) => void
 * @param {Function} [props.onHover] (feature | null, event) => void
 * @param {Function} [props.tooltip] feature => string, rendered in a popup
 * @param {Map}      [props.featureState] feature id → state object, applied
 *                   via setFeatureState so paint can read values the GeoJSON
 *                   does not carry (e.g. hourly scores joined at runtime).
 *                   Pass a new Map to swap the whole set; null clears it.
 */
export function GeoJSONLayer({
  id,
  data,
  type = 'circle',
  paint,
  layout,
  filter,
  onClick,
  onHover,
  tooltip,
  interactive = true,
  promoteId,
  featureState,
}) {
  const ctx = useAtlasMap();
  const map = ctx?.map;
  // Data goes under the basemap's labels, so the place names a reader locates
  // the mesh by stay legible through it.
  const anchor = ctx?.anchor;
  const uid = useId().replace(/:/g, '');
  const sourceId = `${id}-${uid}-src`;
  const layerId = `${id}-${uid}`;
  const popupRef = useRef(null);
  // Latest handlers, so re-renders don't force listener churn.
  const handlers = useRef({ onClick, onHover, tooltip });
  handlers.current = { onClick, onHover, tooltip };

  // Create source + layer.
  useEffect(() => {
    if (!map) return undefined;

    map.addSource(sourceId, { type: 'geojson', data, promoteId });
    map.addLayer(
      {
        id: layerId,
        type,
        source: sourceId,
        ...(layout ? { layout } : {}),
        ...(filter ? { filter } : {}),
        paint: {
          // A fill layer outlines itself in the fill colour unless told
          // otherwise, and under fill-opacity that outline reads as a border
          // on every cell — a mesh of 7,600 hexagons then looks like a grid
          // rather than a surface. Callers can still ask for one.
          ...(type === 'fill' ? { 'fill-outline-color': 'rgba(0,0,0,0)' } : {}),
          ...paint,
        },
      },
      // Undefined on the paper basemap, which has no symbols — appended, as
      // it was before there was a basemap to sit under.
      anchor,
    );

    return () => {
      if (!map.getStyle()) return;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layerId, sourceId, type, anchor]);

  // Data updates.
  useEffect(() => {
    const source = map?.getSource(sourceId);
    if (source) source.setData(data);
  }, [map, sourceId, data]);

  // Paint updates.
  useEffect(() => {
    if (!map || !map.getLayer(layerId) || !paint) return;
    for (const [property, value] of Object.entries(paint)) {
      map.setPaintProperty(layerId, property, value);
    }
    // Paint objects are rebuilt each render; compare by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layerId, JSON.stringify(paint)]);

  // Filter updates.
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return;
    map.setFilter(layerId, filter ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layerId, JSON.stringify(filter)]);

  // Feature-state updates. State survives setData, so a repaint driven from
  // here never forces the source to reload.
  useEffect(() => {
    if (!map || !map.getSource(sourceId)) return undefined;
    if (featureState) {
      for (const [featureId, state] of featureState) {
        map.setFeatureState({ source: sourceId, id: featureId }, state);
      }
    }
    return () => {
      if (map.getStyle() && map.getSource(sourceId)) {
        map.removeFeatureState({ source: sourceId });
      }
    };
  }, [map, sourceId, featureState]);

  // Pointer interaction.
  useEffect(() => {
    if (!map || !interactive) return undefined;

    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'aa-map-popup',
    });
    popupRef.current = popup;

    const handleMove = (event) => {
      const feature = event.features?.[0];
      map.getCanvas().style.cursor = feature ? 'pointer' : '';
      handlers.current.onHover?.(feature ?? null, event);
      const text = feature && handlers.current.tooltip?.(feature);
      if (text) {
        // setText, never setHTML — feature properties are data, not markup.
        popup.setLngLat(event.lngLat).setText(text).addTo(map);
      } else {
        popup.remove();
      }
    };

    const handleLeave = () => {
      map.getCanvas().style.cursor = '';
      handlers.current.onHover?.(null);
      popup.remove();
    };

    const handleClick = (event) => {
      const feature = event.features?.[0];
      if (feature) handlers.current.onClick?.(feature, event);
    };

    map.on('mousemove', layerId, handleMove);
    map.on('mouseleave', layerId, handleLeave);
    map.on('click', layerId, handleClick);

    return () => {
      map.off('mousemove', layerId, handleMove);
      map.off('mouseleave', layerId, handleLeave);
      map.off('click', layerId, handleClick);
      popup.remove();
    };
  }, [map, layerId, interactive]);

  return null;
}
