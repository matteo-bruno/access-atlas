import { useMemo } from 'react';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { CityLayer } from './CityLayer.jsx';
import { useCityProfile } from '../data/useAtlasData.js';
import { useCityMesh } from '../workers/useCityMesh.js';
import { BANDS, CATEGORIES, MODES, measureKey } from '../data/fifteen.js';

// Card art for a platform, in order of preference:
//
//   1. a still of the platform's city view, from src/assets/platforms/<id>.jpg
//   2. a live map of that platform's `previewCity`
//   3. a live world map of its city coverage
//
// The stills are what ships — they are ~70 kB each against a 935 kB MapLibre
// bundle and four WebGL contexts. The live paths are the fallback: delete an
// image and that card starts rendering again, with no other change.
//
// Picked up by filename rather than a static import list, so adding or
// removing one is a file operation.
const PREVIEWS = import.meta.glob('../assets/platforms/*.{jpg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function previewFor(id) {
  const match = Object.entries(PREVIEWS).find(([path]) =>
    path.match(/\/([^/]+)\.(jpg|png)$/)?.[1] === id,
  );
  return match?.[1] ?? null;
}

export function PlatformPreview({ platform, cities }) {
  const src = previewFor(platform.id);

  if (src) {
    return (
      <img
        className="aa-platform__preview"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        width={1040}
        height={640}
      />
    );
  }

  if (platform.previewCity) {
    return <CityPreview platform={platform} cityId={platform.previewCity} cities={cities} />;
  }

  return <WorldPreview platform={platform} cities={cities} />;
}

function WorldPreview({ platform, cities }) {
  return (
    <AtlasMap fitWorldWidth center={[10, 20]} interactive={false} label={platform.name}>
      <CityLayer platform={platform} cities={cities} interactive={false} />
    </AtlasMap>
  );
}

/** One city's mesh, coloured the way that platform's own city page colours it. */
function CityPreview({ platform, cityId, cities }) {
  const { status, profile } = useCityProfile(platform.id, cityId);
  const { data } = useCityMesh(status === 'ready' ? profile : null, platform.id);

  const paint = useMemo(() => {
    // 15minCity has no classification — colour straight from the average
    // walking time, the measure its city page opens on.
    if (platform.id === 'fifteen') {
      const bands = BANDS[MODES[0].key];
      const key = measureKey(CATEGORIES[0].key, MODES[0].key);
      const steps = [];
      for (let i = 1; i < bands.length; i++) steps.push(platform.scale[i], bands[i - 1]);
      return {
        'fill-color': ['step', ['coalesce', ['get', key], -999], platform.scale[0], ...steps],
        'fill-opacity': 0.9,
      };
    }
    // P.O.V. zones and Car Dependency bands both arrive as `zone` 0–3.
    return {
      'fill-color': [
        'match',
        ['get', 'zone'],
        ...platform.scale.flatMap((color, index) => [index, color]),
        platform.scale[platform.scale.length - 1],
      ],
      'fill-opacity': 0.9,
    };
  }, [platform]);

  // Until the profile and its dataset resolve, show the world map rather than
  // an empty box — the card is never blank.
  if (!profile || !data?.geojson) return <WorldPreview platform={platform} cities={cities} />;

  return (
    <AtlasMap
      center={profile.center}
      zoom={(profile.zoom ?? 10) - 0.9}
      graticule={false}
      basemap
      interactive={false}
      label={platform.name}
    >
      <GeoJSONLayer id={`preview-${platform.id}`} data={data.geojson} type="fill" paint={paint} />
    </AtlasMap>
  );
}
