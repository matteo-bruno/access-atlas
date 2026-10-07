# Source data staging

Drop each platform's export here, exactly as the platform hands it over,
and run `npm run update:data`. Nothing in this folder is served by the
site: the importers read from here and write compact, ready-to-serve files
under `../public/data/cities/<city>/`.

```
input_data/
  15mincity/    Zurich.geojson
  citychrone/   Zurich.zip
  pov/          zurich_pov.zip
  cdi/          zurich_cdi.zip
```

The file name gives the city: `Zurich.geojson`, `Zurich.zip`,
`zurich_pov.zip` and `zurich_cdi.zip` are all `zurich` (the `_pov` / `_cdi`
suffix is dropped, accents and spaces become a slug: `New York` →
`new-york`). A zip can also be given unpacked, as a folder of the same name.

### Metro areas and scenarios

```
15mincity/  Tokyo.geojson            the city: its GHS core (Urban Centre)
            Tokyo_FUA.geojson        its metro area (GHS Functional Urban Area)
cdi/        rome_cdi.zip             Rome
            rome__metro-d_cdi.zip    scenario "metro-d" of Rome's Car Dependency
```

- **`<City>_FUA`** is the city's metro area, published as the city
  `<city>-fua` beside the core, with the core's names: the city view
  switches between "City (core)" and "Metro (FUA)", and the Stats page
  compares one boundary at a time. Either can be published without the other.
- **`<city>__<scenario>`** (two underscores) is a scenario of that layer of
  the city: stored with the city, on its grid, shown in the city view on its
  own or as the difference from the current layer. The city must already
  publish the layer (a scenario of a metro area: `paris_FUA__new-line_cdi.zip`).
  Its name is the id, title-cased ("Metro D"); to name it otherwise import it
  by hand with `--scenario-name` / `--scenario-name-it`. Scenarios are not in
  the statistics. CityChrone scenarios are not supported yet.

```
npm run import -- cdi input_data/cdi/rome__metro-d_cdi.zip --scenario-name "Metro D"
npm run import -- cdi --remove rome --scenario metro-d
```

## Updating: import only what changed

```
npm run update:data                  # every platform
npm run update:data -- --pov --cdi   # only the platforms named (--15mincity, --citychrone, --pov, --cdi)
npm run update:data -- --dry-run     # list what would be imported, change nothing
npm run update:data -- --force       # re-import and recompute every file, changed or not
```

Each city keeps its own record, `public/data/cities/<city>/city.json`, and
in it, per layer, the SHA-256 of the export it was imported from, the
file's name, a fingerprint of the importer that read it and when. The
record also keeps `createdAt`, the date the city was first published, which
never moves, and `updatedAt`, the last time anything in it changed.

`update:data` hashes every source here and compares it with those records:

- **New** (the city or the layer is not published): imported.
- **Changed** (a different hash on record): imported again.
- **Same hash**: skipped. Adding a few new cities touches only those.
- **Published, no hash on record** (cities published before records kept
  one): *adopted*. The hash is recorded and nothing is re-imported, so the
  cities already on the site stay exactly as they are.
- **`--force`**: everything is re-imported and recomputed.

Each import runs on its own, so a failure names its file, and writes its
city only. Then, **once, at the end**, the catalogue (`public/data/index.json`),
the world maps' coverage files and the compare summaries are rebuilt from
every city's record, and `test:data` runs. Only if it passes are the hashes
recorded; a failed or rejected run leaves the files looking unimported, and
the next run offers them again.

- **Content, not dates.** Copying or re-downloading a file changes its
  date, not its hash, and does not trigger an import.
- **A removed file does not unpublish its city.** It is reported and its
  record stays. Taking a layer off the site is a command of its own:
  `npm run import -- 15mincity --remove rome`.
- **An importer change is reported, not acted on.** Files imported by an
  earlier version of the importer are counted, and `--force` re-imports
  them.
- **The catalogue is derived, so it can always be rebuilt**:
  `npm run import -- --index`. `update:data` does it on every run, which
  also repairs an index or a coverage file edited or reverted by hand.

The source folders are ignored by git (too large); the records are
committed with the data they describe, so `git log public/data/cities/<city>/city.json`
is the history of what was imported for that city and when.

**Commit all of `public/data` after an import** (`git add -A public/data`).
An import rewrites files that were already there (a new layer can grow the
city's grid, and every other layer is rewritten against it), and committing
only the files it created publishes layers against a grid that is not in
the commit. That is what scrambled Rome's 15minCity layer on GitHub Pages;
`test:data`, which now runs before every Pages deploy and every
`scripts/deploy.sh`, fails on it.

One source by hand, with the options `update:data` does not pass:

```
npm run import -- pov input_data/pov/zurich_pov.zip
npm run import -- cdi path/to/zurich/ --city zurich --dry-run
npm run import -- 15mincity Acilia.geojson --name Acilia --name-it Acilia --country IT
npm run import -- 15mincity --remove rome      # take a layer off the site
npm run import -- --index                      # rebuild the catalogue from the records
```

## What an import does

Every platform publishes on the standard H3 grid (resolution 9), and every
import proves it: each cell's centre must be within 10 m of an H3 cell
centre **and** its outline must match that cell's own boundary. Centres
alone cannot tell r9 from r10, because a cell's centre is also its central
child's. An export that is not on the grid is refused, not forced onto it.

A city is then rebuilt from what is already published plus the new layer:
one grid (every cell any layer covers, sorted by H3 index) and one file per
layer. Importing P.O.V. for a city that has 15minCity keeps 15minCity;
re-importing a layer replaces that layer only. Files whose content did not
change are not rewritten, so re-importing the same export changes nothing.

The city's record (`cities/<city>/city.json`) is written with it: the
city's catalogue entries, and the layer's world-map marker and compare-view
row, computed from the values as imported. The catalogue
(`public/data/index.json`), the world maps (`<platform>/coverage.geojson.gz`)
and, for P.O.V. and CDI, the compare view (`<platform>/summary.json.gz`) are
then rebuilt from all the records. Nothing in the code needs editing: the
site counts cities and cells from the catalogue.

### Where a city is

The exports say nothing about it, so a new city's country is worked out
from its own population-weighted centre, from Natural Earth's boundaries
and localised names (`IT`, `Italy` / `Italia`). A centre is not always
inside its country's drawn outline at this generalisation (Stockholm's sits
3.9 km off Sweden's coast), so the lookup falls back to the nearest coast
within 25 km and says so; past that it leaves the fields blank and warns.

A city already published keeps the names and region in its record, because some
were written by hand. Override when either is wrong:

```
npm run import -- 15mincity Paris.geojson --country FR --region France --region-it Francia --name-it Parigi
```

## The four formats

### 15minCity: `15mincity/<City>.geojson`

One FeatureCollection per city in the harmonised full-name schema:
`<category>_<mode>` minutes for nine categories × `foot` / `bicycle`
(`education_foot`, …), `population`, and optionally `centroid_lon` /
`centroid_lat`. Minutes are kept to 1 decimal; the `99999` "unreachable"
sentinel is kept as is. Pipeline fields (`snapped_id`, `closest_waypoint`,
`internal_id`, `component`, `radius`) are dropped.

`proximity_time_<mode>` is not read: some exports store it in seconds. It
is the mean of the nine categories, and since that is exactly derivable it
is not stored either; the browser computes it. The cartogram is the Atlas's
own (area ∝ the grid's population, full hexagon at the median over the
layer's cells).

### CityChrone: `citychrone/<City>.zip`

The platform's hourly files, each one plain or zipped on its own:

```
Zurich/hexcover00.zip … hexcover23.zip   (or hexcoverHH.json)
Zurich/times00.zip    … times23.zip      (or timesHH.npy)
```

Every hour must be there, with the same cells in the same order (`new_id`,
`coord` checked hour by hour), and every matrix must be `uint8`, `n × n`.
All 24 hours of scores go into one layer file of a few hundred kB, so the
hour selector is instant. The matrices stay one file per hour, fetched only
for isochrones, with rows and columns re-ordered to grid order: lossless,
and 2 to 3.5 times smaller.

### P.O.V.: `pov/<city>_pov.zip`

The two files the platform exports:

```
zurich.geojson             true hexagons
zurich_cartogram.geojson   the platform's cartogram (EPSG:3857 metres)
```

both with `hexagon_id`, `population`, `proximity`, `opportunity` and
`cell_type`. The hexagons give each cell its H3 index; the cartogram is
kept as the platform drew it. The zone thresholds are recomputed as
population-weighted medians, and the import stops if classifying any cell
against them does not reproduce its `cell_type`.

### Car Dependency Index: `cdi/<city>_cdi.zip`

The city's folder as the CDI repository publishes it:

```
zurich/cartogram.geojson   values (CDI, o_score_pt, o_score_car, population) and the cartogram
zurich/hexes.geojson       true hexagons (any hexes*.geojson)
zurich/cdi.csv             the same values again, not read
```

Cells with no CDI are left out, as the upstream viewer does. A CDI outside
[−1, +1] stops the import.
