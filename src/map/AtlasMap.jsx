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
import { resolveStyle } from './style.js';
import './AtlasMap.css';

const MapCtx = createContext(null);

export function useAtlasMap() {
  return useContext(MapCtx);
}

setWorkerUrl(maplibreWorkerUrl);

const HAS_TILES = Boolean(import.meta.env.VITE_TILE_URL);

// MapLibre renders the whole world across 512 px at zoom 0, so this is the
// zoom at which 360° of longitude exactly spans the container. Short, wide
// world views (the home coverage strip, the card thumbnails) use it so the
// map fills its box horizontally and crops top and bottom — the same framing
// the design's illustration used.
function worldWidthZoom(widthPx) {
  return Math.log2(Math.max(widthPx, 1) / 512);
}

function applyWorldWidthZoom(map) {
  const width = map.getContainer().clientWidth;
  if (!width) return;
  map.setZoom(worldWidthZoom(width));
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
  bounds = null,
  fitPadding = 40,
  fitWorldWidth = false,
  className = '',
  children,
  onReady,
  ref,
  label,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(interactive);

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

    const map = new MapLibreMap({
      container: containerRef.current,
      style: resolveStyle({ graticule }),
      center,
      zoom,
      minZoom,
      maxZoom,
      interactive,
      attributionControl: HAS_TILES ? { compact: true } : false,
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: true,
      fadeDuration: 0,
    });

    map.touchZoomRotate?.disableRotation();
    mapRef.current = map;
    // MapLibre swallows style/source failures unless you listen for them.
    map.on('error', (event) =>
      console.error('[maplibre]', event?.error?.message ?? event?.error ?? event),
    );

    const handleLoad = () => {
      if (bounds) map.fitBounds(bounds, { padding: fitPadding, duration: 0 });
      else if (fitWorldWidth) applyWorldWidthZoom(map);
      setReady(true);
      onReady?.(map);
    };
    map.on('load', handleLoad);

    // Re-fit on resize so a world view keeps spanning exactly 360° of
    // longitude at any breakpoint.
    let observer;
    if (fitWorldWidth && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (map.loaded()) applyWorldWidthZoom(map);
      });
      observer.observe(containerRef.current);
    }

    return () => {
      observer?.disconnect();
      map.off('load', handleLoad);
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // center/zoom are initial camera values only — changing them later should
    // move the camera (see below), not tear the map down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, interactive, graticule]);

  // Keep the camera in sync when a parent drives it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || bounds || fitWorldWidth) return;
    map.jumpTo({ center, zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, center[0], center[1], zoom]);

  return (
    <div
      ref={containerRef}
      className={`aa-map ${className}`.trim()}
      role={interactive ? 'application' : 'img'}
      aria-label={label}
    >
      <MapCtx.Provider value={ready ? { map: mapRef.current } : null}>
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
    map.addLayer({
      id: layerId,
      type,
      source: sourceId,
      ...(layout ? { layout } : {}),
      ...(filter ? { filter } : {}),
      paint,
    });

    return () => {
      if (!map.getStyle()) return;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layerId, sourceId, type]);

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
