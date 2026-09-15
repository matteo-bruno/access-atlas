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
