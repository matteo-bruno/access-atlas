# The published data

Everything the maps draw is served statically from this directory at
`/data/…`. It is written by the importers (`npm run update:data`, see
`input_data/README.md`), never by hand, and `npm run test:data` validates all
of it.

## What is here

| Path | What it is |
| ---- | ---------- |
| `index.json` | The **catalogue**: the one file that decides whether the Atlas draws measurements or seed data. |
| `cities/<city>/grid.json.gz` | The city's cells: H3 indices and a population per cell, shared by all its layers. |
| `cities/<city>/<layer>.json.gz` | One layer's values on those cells (`fifteen`, `citychrone`, `cardep`, `pov`). |
| `cities/<city>/citychrone/timesHH.npy.gz` | CityChrone's travel-time matrix for each hour. |
| `<platform>/coverage.geojson.gz` | One point per city, for the platform's world map and the search. |
| `pov/summary.json.gz`, `cardep/summary.json.gz` | One row per city, for the compare view. |
| `world-land.geojson` | Natural Earth 110m land, simplified to 2 dp: the paper basemap. Public domain. |

Every platform publishes on the standard H3 grid (resolution 9), so a city is
**one grid shared by every layer**, and a cell's polygon is not stored at all:
the browser draws it from its index. A layer's file is fetched only when that
layer is opened. Nothing is stored twice.

## The catalogue

```json
{
  "version": 2,
  "platforms": {
    "pov": {
      "coverage": "pov/coverage.geojson.gz",
      "summary": "pov/summary.json.gz",
      "cities": [
        { "id": "zurich", "name": "Zurich", "nameIt": "Zurigo",
          "region": "Switzerland", "regionIt": "Svizzera", "country": "CH",
          "center": [8.52928, 47.38479], "zoom": 10.5, "population": 404153,
          "layer": "cities/zurich/pov.json.gz",
          "cell": { "h3Resolution": 9, "cellRadiusM": 200 },
          "thresholds": { "proximity": 7358.9, "opportunity": 17314.2 } }
      ]
    }
  },
  "atlas": {
    "cities": [
      { "id": "zurich", "name": "Zurich", "…": "…",
        "grid": "cities/zurich/grid.json.gz",
        "layers": ["fifteen", "citychrone", "cardep", "pov"],
        "layerData": { "pov": "cities/zurich/pov.json.gz", "…": "…" },
        "cartogramSources": { "pov": "published", "fifteen": "derived", "…": "…" },
        "hourly": { "hours": 24, "cells": 909,
                    "times": "cities/zurich/citychrone/times{hh}.npy.gz" } }
    ]
  }
}
```

- **`atlas.cities`** is how the city view (`/atlas/:cityId`) draws a city:
  its grid, and which layer file to fetch for each layer.
- **`platforms.<id>.cities`** is one row per city that platform publishes,
  for the world maps, the search and the compare view. Its `center`, `zoom`
  and `population` are that layer's own; `layer` names the same file as the
  atlas entry.
- Platform keys are the `id` values in `src/data/platforms.js`: `fifteen`,
  `citychrone`, `cardep`, `pov`.
- **`center` is `[lon, lat]`**, matching GeoJSON and MapLibre. `{hh}` in a
  path stands for the zero-padded hour.
- A platform with no entry, or a city missing from a list, falls back to the
  seed data, so the site works on a fresh checkout.

## The grid

```json
{ "format": "atlas-grid", "version": 1, "resolution": 9,
  "cells": ["891f8d7a0003fff", "…"],
  "population": [752, "…"] }
```

Every cell any of the city's layers covers, sorted by H3 index, so the same
layers always give the same grid. A cell's population is its context figure
(the Population layer and the city summary): P.O.V. and Car Dependency share
one population model and win where they cover the cell, then 15minCity, then
CityChrone.

## A layer

```json
{ "format": "atlas-layer", "version": 1, "layer": "pov", "cells": 733,
  "order": "grid", "idx": [12, 1, 1, 3, "…"],
  "fields": { "population": [], "zone": [], "proximity": [], "opportunity": [] },
  "meta": { "thresholds": { "proximity": 7358.9, "opportunity": 17314.2 } },
  "cartogram": { "source": "published", "unit": 1e-5, "rings": [[-9, 172, "…"]] } }
```

- **Rows follow the grid.** `idx` gives each row's grid position,
  delta-encoded (each entry is the step from the previous one), which
  compresses to almost nothing.
- **`fields` are columns**, one value per row, `null` where the platform has
  none. Kept at the precision the platforms' own viewers show:

  | Layer | Fields |
  | ----- | ------ |
  | `pov` | `zone` (0–3), `proximity`, `opportunity` (weighted POI counts, 1 dp) |
  | `cardep` | `cdi` (3 dp, in [−1, +1]), `o_score_pt`, `o_score_car` (1 dp) |
  | `fifteen` | `<category>_<mode>` minutes, 1 dp, `99999` = unreachable |
  | `citychrone` | `hourly.v[hour][row]` (2 dp), `hourly.s[hour][row]` (integer) |

  Every layer carries its own `population` too. 15minCity's
  `proximity_time_<mode>` is the mean of the nine categories and is computed
  by the browser rather than stored.
- **The cartogram.** P.O.V. and Car Dependency publish their own, and those
  are not scaled hexagons (up to ~10 m off one on small cells), so they are
  kept: each ring as integer vertex offsets from its cell's H3 centre, in
  units of 1e-5°, the precision they were published at. 15minCity and
  CityChrone publish none; the Atlas derives one (`"source": "derived"`):
  each cell keeps its centre and shape, and its area is proportional to its
  population, reaching the full hexagon at `reference`, the median over the
  layer's cells. The population is the grid's, shared by every layer, so a
  cell of a given population is the same size whichever layer draws it.
  `test:data` checks the rule stays within 25 m of the published cartograms
  where both exist. The UI says which of the two is on screen.

CityChrone's travel-time matrices are NumPy `uint8` minutes, `cells × cells`,
capped at 180 upstream. Row and column *i* are the layer's row *i*, so they
are stored in grid order, not the export's: neighbouring cells become
neighbouring rows, and gzip finds them, 2 to 3.5 times smaller than in the
export's order.

`v_score` is a km/h-like velocity score and `s_score` a sociality score (a
weighted count of reachable people: a score, not a headcount), both defined
in the platform paper (doi:10.1098/rsos.190979).

## Coverage files

One `FeatureCollection` of points per platform, driving the world map and the
city search. Property names match what the seed list emits, so the two are
interchangeable. Each platform colours by one property, declared as
`property` in `src/data/platforms.js`:

| Platform | Property |
| -------- | -------- |
| `fifteen` | `proximityMinutes`: population-weighted median walking time to all services |
| `citychrone` | `velocityScore`: population-weighted median velocity score at 08:00 |
| `cardep` | `cdi`: the index for the average resident (population-weighted mean) |
| `pov` | `zone`: the zone most residents live in, and `inclusionShare` |

Scenario variants (`paris-fua`, `munich-fua`, `rome-metro-d`) are published
with a city view but no marker of their own.

## Summary files

One row per city, for the compare view (`/platforms/:slug/compare`), so it
does not fetch every city's layer to show twenty numbers each. Written by the
importer from the values as published.

```json
{ "platform": "cardep", "cities": [
  { "id": "milan", "cells": 1741, "population": 1201023,
    "medianCdi": 0.112, "weightedCdi": 0.063, "ptShare": 1.9, "carShare": 72.3,
    "weightedByCar": 1852.6, "weightedByTransit": 1662,
    "cdf": [[-1, 0], [-0.9, 0], "… 21 points to +1"] } ] }
```

P.O.V.'s rows carry `medianProximity` / `medianOpportunity`, the
population-weighted means, `thresholds`, and **both** `zoneShares` (per cell)
and `zonePopulationShares` (per resident). The two differ enough to be worth
publishing separately: 67.7% of Milan's cells are total isolation, but only
42.7% of its residents, because isolated cells are large and thinly
populated.

## Serving it

Every file is stored gzipped and named that way. The app sniffs the gzip
magic number and decompresses in the browser when the server has not, so no
server configuration is required; the README's Deployment section has the
nginx block that lets the browser decode natively instead.

## Where the data comes from

The Atlas reads published data through a *provider* (`src/data/sources.js`).
Today there is one, serving these static files. A scenario backend, the piece
the legacy 15minCity site had and a static host cannot replace, becomes a
second provider implementing the same methods, installed with
`setDataProvider()`. No component changes.
