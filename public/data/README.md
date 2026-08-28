# Dropping real data into the Atlas

Everything the maps draw is GeoJSON. Files in this directory are served
statically at `/data/…`, so publishing a dataset is a copy plus a catalogue
entry, not a code change.

## What is here now

| File                 | What it is                                                    |
| -------------------- | ------------------------------------------------------------- |
| `index.json`         | The **catalogue** — the one file that decides whether the Atlas draws measurements or seed data. |
| `pov/`               | Accessibility P.O.V. — 18 cities, one GeoJSON each, plus `coverage.geojson`. Measured. |
| `cardep/`            | Car Dependency Index — 22 city datasets (20 cities plus a Paris metro-area and a Rome Metro D scenario), plus `coverage.geojson`. Measured. |
| `fifteen/`           | 15minCity — Milan on the standard H3 grid, 20 measures per cell (10 service categories × foot/bicycle). Measured. |
| `citychrone/`        | CityChrone — Milan, 24 hourly `hexcoverNN.json` score files plus 24 `timesNN.npy` travel-time matrices. Measured. |
| `atlas/`             | The combined viewer's union meshes — one GeoJSON per harmonised city, every platform's values on the same H3 cells. Derived offline by `scripts/build-atlas.mjs`. |
| `world-land.geojson` | Natural Earth 110m land polygons, simplified to 2 dp. Draws the paper basemap so the Atlas needs no tile server. Public domain. |

15minCity's legacy Rome export (letter-keyed, non-H3) has been retired; its
other cities live in the legacy site's database until they are re-exported on
the standard grid.

Regenerate everything under `pov/` and `cardep/` from the upstream repositories
with:

```bash
npm run build:data -- --pov ../accessibility-pov --cdi ../CDI --fifteen ../15mincity
```

Rebuild the union meshes and the fifteen/citychrone catalogue entries from the
files already in this directory with:

```bash
npm run build:atlas
```

Both print the counts `src/data/home.js` and `src/data/platforms.js` quote, so
those stay in step with the data rather than drifting from it.

## The catalogue

`index.json` lists what has actually been published. A platform with no entry,
or a city missing from a platform's list, falls back to the seed data — so the
site works on a fresh checkout and picks up real outputs one city at a time.

```json
{
  "version": 1,
  "platforms": {
    "pov": {
      "coverage": "pov/coverage.geojson",
      "cities": [
        {
          "id": "rome",
          "name": "Rome",
          "center": [12.4964, 41.9028],
          "zoom": 10.1,
          "dataset": "pov/rome.geojson",
          "population": 2610243,
          "cell": { "h3Resolution": 9, "cellRadiusM": 200 }
        }
      ]
    }
  }
}
```

Platform keys are the `id` values in `src/data/platforms.js`: `fifteen`,
`citychrone`, `cardep`, `pov`.

Two additions beyond the per-platform lists:

- **Hourly datasets** (CityChrone): a city carries `"hourly"` instead of a
  single `dataset` — `{ "hours": 24, "cells": 1741, "hexcover":
  "citychrone/milan/hexcover{hh}.json", "times":
  "citychrone/milan/times{hh}.npy" }`, with `{hh}` standing for the
  zero-padded hour. Each hexcover is a FeatureCollection with per-cell
  `new_id`, `pop`, `v_score`, `s_score` (and `coord` as `[lat, lon]` — the one
  upstream file on that order); each `times` file is a NumPy uint8 matrix of
  minutes, `cells × cells`, row = origin `new_id`.
- **The `atlas` section** (top level, beside `platforms`) lists cities with a
  harmonised union mesh for the combined viewer, each with a `dataset`
  pointing under `atlas/` and a `layers` array naming the platforms it
  carries. A city absent here still gets a combined view — the viewer swaps
  per-platform meshes instead of repainting one. Union meshes are **derived**:
  regenerate them with `npm run build:atlas` after changing any Milan file,
  and `npm run test:data` reconciles them against the per-platform files.

- **Alternative geometry.** A city's values sit on one geometry; where the
  other one is published too, the city entry says which is which. `"geometry"`
  is `"cartogram"` or `"geographic"` and describes `dataset`'s own polygons;
  `"geoDataset"` points at the true hexagons beside a cartogram, and an
  `atlas` city's `"cartograms"` maps a platform id to the cartogram polygons
  for its cells. A companion file is a `FeatureCollection` whose every feature
  carries `{ "i": <index into dataset.features> }` and nothing else, so the
  join is stated rather than positional — and a cartogram companion covers
  only the cells its platform measures. The viewer offers the switch exactly
  where a companion exists: 15minCity and CityChrone publish no cartogram, and
  the UI says so rather than drawing one.

  The geographic companions are **derived**, not copied: every published cell
  sits on the standard H3 grid, and the cartogram preserves its centroid, so
  the centroid identifies the cell and the cell determines its hexagon.
  `build-data.mjs` refuses a centroid more than 10 m off a cell centre, and
  checks the result against the true hexagons CDI publishes in
  `hexes.geojson` — they reproduce them exactly.
- **`center` is `[lon, lat]`**, matching GeoJSON and MapLibre. The upstream CDI
  `index.json` uses `[lat, lon]` — flipping it is the exporter's job.
- **`cell`** describes the real cell geometry. It cannot be measured from a
  cartogram, whose polygons are scaled by population, so it is stated here or
  the map caption is omitted.
- A city with no `dataset` still appears in the catalogue but has no detail
  page; the landing map flies to it instead.

## Summary files

One JSON document per platform, listing every published city once — the
compare view (`/platforms/:slug/compare`) reads this instead of fetching all
22 city datasets to end up with twenty numbers each. Declared as `"summary"`
beside `"coverage"` on the platform entry, and written by `build:data` from
the same features it just published, so a figure here and the same figure on
a city page cannot drift.

```json
{
  "platform": "cardep",
  "cities": [
    {
      "id": "milan",
      "cells": 1741,
      "population": 1201023,
      "medianCdi": 0.112,
      "weightedCdi": 0.063,
      "ptShare": 1.9,
      "carShare": 72.3,
      "weightedByCar": 1852.6,
      "weightedByTransit": 1662,
      "cdf": [[-1, 0], [-0.9, 0], "… 21 points to +1"]
    }
  ]
}
```

P.O.V.'s rows carry `medianProximity`/`medianOpportunity`, the
population-weighted means, `thresholds`, and **both** `zoneShares` (per cell)
and `zonePopulationShares` (per resident). The two differ enough to be worth
publishing separately: 67.7% of Milan's cells are total isolation, but only
42.7% of its residents — isolated cells are large and thinly populated.

`cdf` is the cumulative share of a city's *population* at or below each index
value, 21 points from −1 to +1: enough to draw the distribution curve, small
enough to publish for every city.

## Coverage files

One `FeatureCollection` of points per platform, driving the world map and the
city search. Property names match what the seed list emits, so the two are
interchangeable:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [12.4964, 41.9028] },
      "properties": {
        "id": "rome",
        "name": "Rome",
        "country": "IT",
        "isStudy": true,
        "proximityMinutes": 11.3,
        "velocityScore": 0.42,
        "cdi": 2.7,
        "zone": 0
      }
    }
  ]
}
```

Each platform reads one property, declared as `property` in
`src/data/platforms.js` together with its colour `scale` and `stops`. To change
what the map shows, change that table — not the components.

## Per-city datasets

### Accessibility P.O.V.

The upstream `accessibility-pov` repo ships one self-contained file per city
(`data/<city>_cartogram.geojson`). Its properties are read directly:

| Property | Meaning |
| -------- | ------- |
| `proximity` | walkable access to everyday services, weighted POI count |
| `opportunity` | access to city-scale resources by transit, weighted POI count |
| `cell_type` | `inclusion` · `spatial isolation` · `social isolation` · `total isolation` |
| `population` | people in the cell |
| `proximity_median_city`, `opportunity_median_city` | city-wide medians, used as the scatter's quadrant thresholds |

`src/data/adapters.js` maps `cell_type` onto the four zones the UI renders and
normalises the two axes for the scatter plot. A numeric `zone` (0–3) is
accepted in place of `cell_type`.

Note these files are **population-scaled cartograms**: cells sit in their true
positions but their area encodes population, so a low-population cell shrinks
to a fraction of a full hexagon. The true hexagons are published beside them as
`pov/<city>.geo.geojson` and named by the entry's `geoDataset`, which is what
the city page's map/cartogram switch draws.

### Car Dependency Index

The upstream `CDI` repo splits each city across three files — `hexes.geojson`
(true geography), `cartogram.geojson` (population-scaled, and carrying the
values) and `cdi.csv`, joined on `properties.id` ⇄ `hexagon_id`. The CSV
duplicates both the geometry and the values that are already in
`cartogram.geojson`, so a single merged GeoJSON per city is the form to publish
here.

Values: `o_score_pt`, `o_score_car`, `CDI` (−1 PT-favoured → +1 car-dependent),
`population`.

### 15minCity

The harmonised exports (Milan onward) key each measure as
`<category>_<mode>`, in minutes, with full words: categories
`proximity_time` (the average across all services), `outdoor`, `education`,
`supplies`, `restaurant`, `transport`, `culture`, `physical`, `services`,
`healthcare`; modes `foot` and `bicycle`. Each cell also carries
`centroid_lon`/`centroid_lat`, `radius`, `population`, and `internal_id` —
the cell's H3 index as a decimal integer (resolution 9).

The legacy letter scheme (`a_f`, with `d_*` ideal-city differences) and its
two conflicting letter→category tables are retired with the Rome export; no
published file uses it and `src/data/fifteen.js` no longer knows the letters.

### CityChrone

Published as hourly file pairs rather than one dataset — see the `hourly`
catalogue entry above. `v_score` is a km/h-like velocity score, `s_score` a
sociality score (a weighted count of reachable people — a score, not a
headcount); both are defined in the platform paper (doi:10.1098/rsos.190979).
The `times` matrices power click-to-draw isochrones in the combined viewer;
values are capped at 180 minutes upstream.

## Shapefiles

`src/map/loaders.js` reads zipped shapefiles too — `loadDataset({ url:
'/data/rome.zip' })` detects the format from the extension and converts to
GeoJSON via `shpjs`, which is imported on demand so it never lands in the main
bundle. Reprojecting to WGS84 is the exporter's job; MapLibre expects lon/lat.

## Size

Do not zip GeoJSON — every static host, GitHub Pages included, compresses it in
transit. Rome's P.O.V. cartogram is 5.2 MB on disk but ~0.4 MB over the wire,
and trimming coordinates to 5 dp roughly halves the raw file with no visible
change at any zoom the Atlas offers.

MapLibre parses GeoJSON in a worker, so tens of thousands of features are fine.
Past roughly 10 MB *compressed*, convert to vector tiles (tippecanoe → PMTiles)
and point `VITE_MAP_STYLE` at a style that includes the tile source instead.

## Where the data comes from

The Atlas reads published data through a *provider* (`src/data/sources.js`).
Today there is one, serving these static files. A scenario backend — the piece
the legacy 15minCity site had, which a static host cannot replace — becomes a
second provider implementing the same three methods, installed with
`setDataProvider()`. No component changes.
