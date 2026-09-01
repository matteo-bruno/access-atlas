import { useMemo } from 'react';
import { GeoJSONLayer } from '../map/AtlasMap.jsx';
import { cityCirclePaint, coverageCountPaint } from '../map/layers.js';
import { citiesToGeoJSON } from '../data/cities.js';
import { COVERAGE_SCALE } from '../data/platforms.js';

/** City markers coloured by one platform's scale. */
export function CityLayer({ platform, cities, onSelect, tooltip, interactive = true }) {
  const data = useMemo(() => citiesToGeoJSON(cities), [cities]);
  const paint = useMemo(() => cityCirclePaint(platform), [platform]);

  return (
    <GeoJSONLayer
      id={`cities-${platform.id}`}
      data={data}
      type="circle"
      paint={paint}
      interactive={interactive}
      promoteId="id"
      onClick={onSelect ? (feature) => onSelect(feature.properties) : undefined}
      tooltip={tooltip}
    />
  );
}

/**
 * Markers for the all-platforms world map, shaded by how many of the four
 * platforms have published data for each city.
 */
export function CoverageLayer({ cities, onSelect, tooltip, interactive = true }) {
  const data = useMemo(() => {
    const collection = citiesToGeoJSON(cities);
    for (const feature of collection.features) {
      const city = cities.find((c) => c.id === feature.properties.id);
      feature.properties.platformCount = city?.platformCount ?? 1;
      // Arrays do not survive into MapLibre feature properties usefully; the
      // tooltip reads the joined form.
      feature.properties.platforms = (city?.platforms ?? []).join(',');
    }
    return collection;
  }, [cities]);

  const paint = useMemo(() => coverageCountPaint(COVERAGE_SCALE), []);

  return (
    <GeoJSONLayer
      id="cities-coverage"
      data={data}
      type="circle"
      paint={paint}
      interactive={interactive}
      promoteId="id"
      onClick={onSelect ? (feature) => onSelect(feature.properties) : undefined}
      tooltip={tooltip}
    />
  );
}
