# The published data

Everything the maps draw is served statically from this directory at
`/data/…`. It is written by the importers (`npm run update:data`, see
`input_data/README.md`), never by hand, and `npm run test:data` validates all
of it.

## What is here

| Path | What it is |
| ---- | ---------- |
| `index.json` | The **catalogue**: the one file that decides whether the Atlas draws measurements or seed data. Derived from the city records. |
| `cities/<city>/city.json` | The city's **record**: its names, catalogue entries, markers and compare rows, the hash of each export it was imported from, and when it was first published. Not read by the site. |
| `cities/<city>/grid.json.gz` | The city's cells: H3 indices and a population per cell, shared by all its layers. |
| `cities/<city>/<layer>.json.gz` | One layer's values on those cells (`fifteen`, `citychrone`, `cardep`, `pov`). |
| `cities/<city>/scenarios/<id>/<layer>.json.gz` | A scenario of that layer (Rome's `metro-d`), on the same grid, in the same format. |
| `cities/<city>/citychrone/timesHH.npy.gz` | CityChrone's travel-time matrix for each hour. |
| `<platform>/coverage.geojson.gz` | One point per city, for the platform's world map and the search. |
| `pov/summary.json.gz`, `cardep/summary.json.gz` | One row per city, for the compare view. |
| `stats/stats.json.gz` | Every city on every measure, for the Stats page. Written by `npm run stats`, gathered by `buildIndex`. |
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
  },
  "files": { "cities/zurich/grid.json.gz": "1b8fdf4a4267", "…": "…" }
}
```

- **The catalogue is derived, never edited.** `buildIndex` in
  `scripts/lib/bundle.mjs` writes it, the coverage files and the summaries
  from every city's `city.json`, in one pass at the end of an import run
  (`npm run import -- --index` on its own). `test:data` fails when
  rebuilding would change any of them.
- **`files`** is the content hash of every file the catalogue points at: the
  version of each that this catalogue describes. The site fetches the
  current version by its plain path (the server's `Cache-Control: no-cache`
  keeps it fresh); `?v=<hash>` is reserved for asking for a specific,
  possibly earlier, version. The catalogue itself carries the build id.

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

## Boundaries and scenarios

- **A metro area is a city.** `<city>-fua` is the city's GHS Functional
  Urban Area beside its core (Urban Centre): its own grid, layers and
  record. Its atlas entry and platform rows carry `"extent": "fua"` and
  `"core": "<city>"`, and its names are its core's.
- **A scenario is not.** An atlas entry lists its scenarios:

  ```json
  "scenarios": [{ "id": "metro-d", "name": "Metro D", "nameIt": "Metro D",
                  "layers": ["cardep"],
                  "layerData": { "cardep": "cities/rome/scenarios/metro-d/cardep.json.gz" },
                  "cells": { "cardep": 11409 } }]
  ```

  Each file is a layer file written against the city's grid (its `grid` is
  the city's), so its rows line up with the baseline's. The city's grid
  includes any cell only a scenario covers.

## The grid

```json
{ "format": "atlas-grid", "version": 1, "id": "45b4e684554f4443", "resolution": 9,
  "cells": ["891f8d7a0003fff", "…"],
  "population": [752, "…"] }
```

Every cell any of the city's layers covers, sorted by H3 index, so the same
layers always give the same grid. A cell's population is its context figure
(the Population layer and the city summary): P.O.V. and Car Dependency share
one population model and win where they cover the cell, then 15minCity, then
CityChrone. `id` is a hash of the cells, in order.

## A layer

```json
{ "format": "atlas-layer", "version": 1, "layer": "pov", "grid": "45b4e684554f4443", "cells": 733,
  "order": "grid", "idx": [12, 1, 1, 3, "…"],
  "fields": { "population": [], "zone": [], "proximity": [], "opportunity": [] },
  "meta": { "thresholds": { "proximity": 7358.9, "opportunity": 17314.2 } },
  "cartogram": { "source": "published", "unit": 1e-5, "rings": [[-9, 172, "…"]] } }
```

- **Rows follow the grid.** `idx` gives each row's grid position,
  delta-encoded (each entry is the step from the previous one), which
  compresses to almost nothing.
- **`grid` is the id of the grid the layer was written against.** Positions
  mean nothing on any other grid, yet decode and draw there, every value on
  the wrong cell: that is what Rome's 15minCity layer did when it was
  committed without the grid its import had grown. The importer, `test:data`
  and the viewer all refuse a layer whose `grid` is not its city's.
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
  layer's inhabited cells (empty cells are never drawn). The population is the grid's, shared by every layer, so a
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

A metro area (`<city>-fua`) has no marker of its own where its core publishes
the same layer: it is reached from the core's city view. Scenarios have none.

## Summary files

One row per city, for the compare view (`/platforms/:slug/compare`), so it
does not fetch every city's layer to show twenty numbers each. Computed by the
importer from the values as published, kept in each city's record, and
gathered here by `buildIndex`.

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

## Statistics

`stats/stats.json.gz`, listed in the catalogue as `stats`, is what the Stats
page (`/stats`) reads, whole. The method is at the top of
`scripts/lib/stats.mjs`; the shape:

```json
{ "format": "atlas-stats", "version": 1,
  "measures": [{ "id": "pov.proximity", "layer": "pov", "kind": "score",
                 "direction": "up", "comparability": "cross-city", "decimals": 1,
                 "thresholds": [1000, 2500, 5000, 10000, 20000], "side": "atLeast" }],
  "quantiles": [0.1, 0.25, 0.5, 0.75, 0.9],
  "cities": [{ "id": "milan", "name": "Milan", "country": "IT", "population": 3067071,
               "layers": { "pov": { "cells": 1636, "population": 1201023,
                                    "coverage": 39.2, "empty": 5.7 } },
               "computedAt": "…" }],
  "values": { "pov.proximity": [{ "cells": 1636, "population": 1201023,
                                  "mean": 6093.45, "q": [3034.4, 4334.2, 6157.8, 7863.8, 9158],
                                  "gini": 0.212, "theil": 0.073, "ratio": 3.02,
                                  "shares": [99.7, 94.3, 67, 3.2, 0] }, "… one per city, or null"] },
  "countries": [{ "iso": "IT", "cities": ["florence", "milan", "rome"],
                  "values": { "pov.proximity": { "cities": 2, "population": 3811189,
                                                 "mean": 3979.279, "shares": ["…"] } } }],
  "hiddenRule": { "population": 10000, "minutes": 60 },
  "omitted": [{ "id": "zurich", "reason": "data" }] }
```

- **Every figure is about residents**, weighted by the layer's own
  population per cell. `shares[i]` is the share of residents on the
  `side` of `thresholds[i]`; thresholds are fixed, never fitted.
- **`values[m][i]` is `cities[i]`'s figure**, `null` where the city does not
  publish that layer.
- **A country pools its cities' residents**, for means and shares only,
  which pool exactly, and for now for 15minCity only, once per boundary
  (`extent: "fua"` on a metro areas' pool); hidden cities are left out.
- **`extent: "fua"`** on a city marks a metro area, with its `core`. The page
  shows one boundary at a time.
- **`pov.zonesCommon`** splits every city at the Atlas median: the
  population-weighted medians of all P.O.V. residents of the cities shown by
  default, together, stated as the measure's `zoneThresholds`
  (`proximity`, `opportunity`, `cities`).
- **`hidden`** on a city (`"population"` or `"proximity"`) marks data too
  thin to compare, by the rule in `scripts/lib/quality.mjs`, whose numbers
  are `hiddenRule`. The page never shows such a city. The same
  rule flags its markers in the coverage files with the same `hidden`
  property, and the world maps skip them.
- **Only current figures are published.** A city whose grid or layer files
  changed since its figures were computed is listed in `omitted` and has no
  values. Every computation, current and earlier, is kept in
  `statistics/cities/<city>.json.gz` at the repository root, which is not
  served.

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
