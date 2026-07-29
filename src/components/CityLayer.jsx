import { useMemo } from 'react';
import { GeoJSONLayer } from '../map/AtlasMap.jsx';
import { atlasCirclePaint, cityCirclePaint } from '../map/layers.js';
import { citiesToGeoJSON, hash } from '../data/cities.js';
import { ATLAS_SCALE } from '../data/platforms.js';

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

/** Multi-hue markers for the atlas-wide coverage map. */
export function AtlasCityLayer({ cities, tooltip, interactive = true }) {
  const data = useMemo(() => {
    const collection = citiesToGeoJSON(cities);
    for (const feature of collection.features) {
      feature.properties.paletteIndex = hash(feature.properties.name) % ATLAS_SCALE.length;
    }
    return collection;
  }, [cities]);

  const paint = useMemo(() => atlasCirclePaint(ATLAS_SCALE), []);

  return (
    <GeoJSONLayer
      id="cities-atlas"
      data={data}
      type="circle"
      paint={paint}
      interactive={interactive}
      promoteId="id"
      tooltip={tooltip}
    />
  );
}
