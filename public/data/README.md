# Dropping real data into the Atlas

Everything the maps draw is GeoJSON. Files in this directory are served
statically at `/data/…`, so publishing a dataset is a copy, not a code change.

## What is here now

| File                 | What it is                                                    |
| -------------------- | ------------------------------------------------------------- |
| `world-land.geojson` | Natural Earth 110m land polygons, simplified to 2 dp. Draws the paper basemap so the Atlas needs no tile server. Public domain. |

Everything else the app renders today — the city markers, the Rome hex mesh —
is **seed data generated in the browser**. It is deterministic and plausible,
but it is not measurement. See `src/data/cities.js` and `src/data/mesh.js`.

## Adding the real city coverage

Drop a `FeatureCollection` of points at `cities.geojson`:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "rome",
      "geometry": { "type": "Point", "coordinates": [12.4964, 41.9028] },
      "properties": {
        "id": "rome",
        "name": "Rome",
        "country": "IT",
        "proximityMinutes": 11.3,
        "velocityScore": 0.42,
        "cdi": 2.7,
        "zone": 0
      }
    }
  ]
}
```

The property each platform colours by is declared in `src/data/platforms.js`
(`property`), together with its colour `scale` and its `stops`. To change what
the map shows, change that table — not the components.

Then load it with the helper that already prefers a published file and falls
back to the seed list:

```js
import { loadWithFallback } from '../map/loaders.js';
import { citiesToGeoJSON, CITIES } from '../data/cities.js';

const { data, source } = await loadWithFallback(
  { url: `${import.meta.env.BASE_URL}data/cities.geojson` },
  () => citiesToGeoJSON(CITIES),
);
```

## Adding a city's hex mesh

Per-city meshes belong at `cities/<city-id>.geojson` — one polygon per cell,
with `zone` (0–3), `walkMetres` and `jobsK` in `properties`. Register the city
in `CITY_PROFILES` (`src/data/mesh.js`) and swap `buildCityMesh` for a fetch;
the return shape (`{ geojson, stats, scatter, thresholds }`) is the contract the
city page depends on, and the classification/statistics step should stay inside
`src/workers/mesh.worker.js` so it keeps off the main thread.

## Shapefiles

`src/map/loaders.js` reads zipped shapefiles too — `loadDataset({ url:
'/data/rome.zip' })` detects the format from the extension and converts to
GeoJSON via `shpjs`, which is imported on demand so it never lands in the main
bundle. Reprojecting to WGS84 is the exporter's job; MapLibre expects lon/lat.

## Size

MapLibre parses GeoJSON in a worker, so tens of thousands of features are fine.
Past roughly 10 MB, convert to vector tiles (tippecanoe → PMTiles) and point
`VITE_MAP_STYLE` at a style that includes the tile source instead.
