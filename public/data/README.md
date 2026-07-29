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
| `fifteen/`           | 15minCity — Rome, 20 measures per cell (10 service categories × foot/bike) plus their difference against the ideal-city scenario. Measured. |
| `world-land.geojson` | Natural Earth 110m land polygons, simplified to 2 dp. Draws the paper basemap so the Atlas needs no tile server. Public domain. |

**CityChrone is not published yet.** It still renders seed data generated in
the browser — deterministic and plausible, but not measurement (see
`src/data/cities.js` and `src/data/mesh.js`). The UI labels it as illustrative
rather than presenting it as measured. 15minCity is published for Rome only;
its other cities live in the legacy site's database.

Regenerate everything under `pov/` and `cardep/` from the upstream repositories
with:

```bash
npm run build:data -- --pov ../accessibility-pov --cdi ../CDI --fifteen ../15mincity
```

It prints the counts `src/data/home.js` and `src/data/platforms.js` quote, so
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

- **`center` is `[lon, lat]`**, matching GeoJSON and MapLibre. The upstream CDI
  `index.json` uses `[lat, lon]` — flipping it is the exporter's job.
- **`cell`** describes the real cell geometry. It cannot be measured from a
  cartogram, whose polygons are scaled by population, so it is stated here or
  the map caption is omitted.
- A city with no `dataset` still appears in the catalogue but has no detail
  page; the landing map flies to it instead.

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
to a fraction of a full hexagon. A true-geography export would render with the
same code.

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

The legacy site stores one `hexes.geojson` per city, carrying 20 accessibility
metrics — 10 service categories × 2 travel modes, in minutes:

| Key | Category | | Suffix | Mode |
| --- | -------- | - | ------ | ---- |
| `a` | average accessibility | | `_f` | foot |
| `b` | cultural activities | | `_b` | bike |
| `c` | learning | | | |
| `d` | healthcare | | | |
| `e` | outdoor activities | | | |
| `f` | physical exercise | | | |
| `g` | eating | | | |
| `h` | services | | | |
| `i` | supplies | | | |
| `l` | moving | | | |

A matching `d_<key>_<mode>` field holds the precomputed difference against the
"ideal city" scenario.

> **Careful with the legend.** The legacy `script.php` contains two conflicting
> letter→category mappings; the stale one assigns different categories to the
> same letters (`d` is Supplies there, Healthcare in the live one). The table
> above matches the live dropdowns.

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
