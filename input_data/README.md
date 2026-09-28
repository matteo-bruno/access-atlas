# Source data staging

Drop upstream data files here to feed the Atlas's import scripts. Nothing
in this folder is served by the site directly — the scripts under
`../scripts/` read from here and write compressed, ready-to-serve copies
under `../public/data/`.

## Updating: import only what changed

```
npm run update:data                  # every platform with an importer
npm run update:data -- --15mincity   # only the platforms named
npm run update:data -- --dry-run     # list what would be imported, change nothing
npm run update:data -- --force       # re-import every file, changed or not
npm run update:data -- --baseline    # record the files as imported, import nothing
```

`update:data` hashes every file here and compares it with
`manifest.json`, which records what was imported: each file's SHA-256 and
a fingerprint of the importer that read it. A file that is new or whose
content changed is imported, one city per importer run, so a failure names
its file. Then `test:data` runs, and only if it passes is the manifest
updated. A failed or rejected run leaves the files looking unimported, and
the next run offers them again.

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

Only 15minCity has an importer so far. P.O.V., CDI and CityChrone are
recognised (`--pov` says there is no importer yet), and files dropped in
their folders are reported as skipped rather than ignored.

## 15minCity

One `*.geojson` per city, in the harmonised full-name schema (properties
like `education_foot`, `proximity_time_bicycle`, `centroid_lon`,
`population`). The filename becomes the city id: `Acilia.geojson` →
`acilia`, `New York.geojson` → `new-york`.

```
input_data/
  15mincity/
    Acilia.geojson
    Rome.geojson
    …
```

Then:

```
npm run import:fifteen                 # process every file
npm run import:fifteen -- --only rome  # subset by slug
npm run import:fifteen -- --dry-run    # show what would be written
```

The source files say nothing about where a city is, so the importer works
it out from the city's own weighted centroid — `IT` for the search
result, `Italy` / `Italia` for the city header, from Natural Earth's own
localised country names. Nothing to pass.

A city centroid is not always inside its country's drawn outline at this
generalisation (Stockholm's sits 3.9 km off Sweden's coast, on an
archipelago 1:50m does not resolve), so the lookup falls back to the
nearest coast within 25 km and says so in the output. Past that it leaves
the fields blank and warns, rather than assigning an ocean point to
whichever country is closest.

Override per run when it is wrong:

```
npm run import:fifteen -- --country FR --region France --region-it Francia
```

`region` and `regionIt` are re-derived on every run and deliberately not
preserved — that is what stops a wrong value outliving its fix. The
city's own name in Italian (`nameIt`) *is* preserved, because nothing can
derive it.

The script:

- compresses each file (rounds coordinates to 5 decimals, rounds minute
  values to 1 decimal, drops pipeline debris like `snapped_id`);
- recomputes `proximity_time_foot` and `proximity_time_bicycle` as the
  mean of the nine per-category minute values, so cities exported with a
  seconds-scale sum still land on the ramp's expected minutes scale;
- derives a population-scaled cartogram companion (`<city>.cartogram.geojson`);
- upserts the city into `public/data/index.json` and the coverage marker
  into `public/data/fifteen/coverage.geojson`.

Rerunning the script on the same input overwrites the published city
cleanly; existing cities the source does not name are left alone.
