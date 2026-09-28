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

The file name proposes the city: `Zurich.geojson`, `Zurich.zip`,
`zurich_pov.zip` and `zurich_cdi.zip` are all `zurich` (the `_pov` / `_cdi`
suffix is dropped, accents and spaces become a slug: `New York` →
`new-york`). A zip can also be given unpacked, as a folder of the same name.

Where the layer's cells are decides it. The slug folds accents away, so
`San José` and `San Jose` give the same one, and there are cities with
the same name anyway (Valencia in Spain and in Venezuela):

- a published city with that slug, or with that slug and a country suffix,
  is this city if the layer shares a cell with it or lies within 30 km;
- otherwise the layer is a new city: the slug if it is free, else the slug
  with the country's ISO code (`valencia-ve`, `san-jose-cr`);
- a second same-named city **in the same country** stops the import:
  give it `--city` (and `--name`).

A new city is named as its file is written, accents included
(`são_paulo.geojson` → "São Paulo"); a name in all lower case is
capitalised word by word. The manifest records the city each source was
published as, and a second source for a city the platform already has
(`Zurich.zip` and `Zürich.zip`, or a zip and its unpacked folder) is
refused before it writes anything: keep one of the two.

## Updating: import only what changed

```
npm run update:data                  # every platform
npm run update:data -- --pov --cdi   # only the platforms named (--15mincity, --citychrone, --pov, --cdi)
npm run update:data -- --dry-run     # list what would be imported, change nothing
npm run update:data -- --force       # re-import every file, changed or not
npm run update:data -- --baseline    # record the files as imported, import nothing
```

`update:data` hashes every source here and compares it with
`manifest.json`, which records what was imported: each source's SHA-256
and a fingerprint of the importer that read it. A source that is new or
whose content changed is imported on its own, so a failure names its file.
Then `test:data` runs, and only if it passes is the manifest updated. A
failed or rejected run leaves the files looking unimported, and the next
run offers them again.

- **Content, not dates.** Copying or re-downloading a file changes its
  date, not its hash, and does not trigger an import.
- **A removed file does not unpublish its city.** It is reported and its
  manifest entry stays. Taking a city off the site is done by hand.
- **An importer change is reported, not acted on.** Files imported by an
  earlier version of the importer are counted, and `--force` re-imports
  them.
- **`--baseline`** is for data already published from these files, so the
  first run does not re-import every city just to find out it had.

The source folders are ignored by git (too large); `manifest.json` is
committed alongside the data it describes, so `git log input_data/manifest.json`
is the history of what was imported and when.

One source by hand, with the options `update:data` does not pass:

```
npm run import -- pov input_data/pov/zurich_pov.zip
npm run import -- cdi path/to/zurich/ --city zurich --dry-run
npm run import -- 15mincity Acilia.geojson --name Acilia --name-it Acilia --country IT
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

The catalogue (`public/data/index.json`), the platform's world-map marker
(`<platform>/coverage.geojson.gz`) and, for P.O.V. and CDI, the compare
view's row (`<platform>/summary.json.gz`) are updated in the same run.
Nothing in the code needs editing: the site counts cities and cells from
the catalogue.

### Where a city is

The exports say nothing about it, so a new city's country is worked out
from its own population-weighted centre, from Natural Earth's boundaries
and localised names (`IT`, `Italy` / `Italia`). A centre is not always
inside its country's drawn outline at this generalisation (Stockholm's sits
3.9 km off Sweden's coast), so the lookup falls back to the nearest coast
within 25 km and says so; past that it leaves the fields blank and warns.

A city already in the catalogue keeps its names and region, because some
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
