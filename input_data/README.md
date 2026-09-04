# Source data staging

Drop upstream data files here to feed the Atlas's import scripts. Nothing
in this folder is served by the site directly — the scripts under
`../scripts/` read from here and write compressed, ready-to-serve copies
under `../public/data/`.

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

The source files say nothing about where a city is, and the UI shows it in
two places — the city header prints the region, the search result prints
the country — so state it per run. It defaults to Italy:

```
npm run import:fifteen -- --country FR --region France --region-it Francia
```

A city needing different copy from the rest of its batch is a hand edit to
`public/data/index.json` afterwards: reruns preserve `nameIt`, `region` and
`regionIt` on a row that already has them.

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
