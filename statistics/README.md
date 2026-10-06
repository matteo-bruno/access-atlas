# Statistics, as computed

One file per city, `cities/<city>.json.gz`, written by `npm run stats`
(`scripts/build-stats.mjs`, method in `scripts/lib/stats.mjs`):

```json
{ "format": "atlas-city-stats", "version": 1, "id": "milan",
  "current": { "method": 1, "computedAt": "…", "inputs": { "cities/milan/grid.json.gz": "1b8fdf4a4267", "…": "…" },
               "population": 3067071, "layers": { "…": "…" }, "measures": { "…": "…" } },
  "history": [ "every earlier computation, oldest first" ] }
```

`inputs` is the stored hash of every published file the figures were
computed from. A city is recomputed only when one of them, or the method
(`STATS_VERSION`), changed; the computation it replaces moves to `history`.

This folder is **not served**. The site reads `public/data/stats/stats.json.gz`,
which `buildIndex` gathers from the `current` computation of every city
whose inputs still match its published files. A city whose data changed and
was not recomputed is left out of it, so the history here is the only place
its earlier figures remain.
