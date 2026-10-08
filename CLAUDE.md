# Working on the Accessibility Atlas

Notes for anyone — human or model — picking this up cold. `README.md` covers
structure, build and deployment; this file covers the things that are easy to
get wrong and expensive to rediscover.

## What the site claims, and the rule behind it

Every quantity on the site is either **computed from the published datasets or
omitted**. Nothing is estimated, rounded up from a mock, or carried over from
the design handoff. This is a research group publishing under its own name, so
a number that cannot be traced to a file does not go on the page.

Two consequences worth internalising before editing copy:

- **Where a measure has no unit, call it a score.** P.O.V.'s proximity and
  opportunity are weighted counts of reachable points of interest. They are not
  metres and not jobs. The site said "643 m" and "2.7 k jobs" for Rome for a
  while; the numbers were real, the units invented.
- **A platform with no published data says so.** `published: false` in
  `src/data/platforms.js` makes the UI label the map as illustrative rather
  than show a coverage count it cannot support. A generated city mesh labels
  itself as generated (`city.seeded`).

**Counts of published data are never written in the code.** How many cities
a platform publishes (the platform cards, the Research page) comes from
`usePublishedCityCounts()`, and the Atlas's totals from `atlasMetrics()` in
`src/data/home.js`, both counted from the catalogue — whose rows carry each
layer's `cells` and a metro area's `extent`, written by the importer. They used to
be numbers in `platforms.js` and `home.js` that `test:data` checked, which
made every new city fail the import until someone edited the code: adding a
city is a data change, and must stay one.

## The data layer

One idea to understand: **the catalogue decides whether the Atlas draws
measurements or seed data**, per city, per platform.

```
public/data/index.json        catalogue — what is actually published, derived from the records
public/data/cities/<city>/    one grid + one file per layer (scripts/lib/bundle.mjs)
  city.json                   the city's record: entries, figures, source hashes, createdAt
src/data/catalogue.js         parsing + normalising it
src/data/sources.js           the provider: where data comes from
src/data/grid.js              grid + layer files → the union mesh the viewer draws
src/data/adapters.js          published files → the shapes the UI consumes
src/data/useAtlasData.js      React bindings (coverage, profile, city pages)
src/data/useAtlasView.js      React bindings for the combined viewer
src/workers/useCityMesh.js    published-first, seed fallback
scripts/import-data.mjs       one platform export → its city (importers/ per platform)
scripts/update-data.mjs       whatever changed in input_data/, per the hashes in each city.json
```

**A city is one grid and one file per layer, and nothing is stored twice.**
Every platform publishes on the standard H3 grid, so a cell's polygon is not
data: the grid file holds only the H3 indices and a population per cell, and
`grid.js` draws the hexagons in the browser (h3-js, imported on demand by the
city view only). Each layer file holds that layer's values as columns keyed
to grid positions, and is fetched the first time the layer is opened —
`useAtlasMesh` loads the grid, then merges each layer in as it arrives, so the
page still receives one FeatureCollection with a layer's values as
properties and its paint expressions never noticed the change. The format,
field by field, is in `public/data/README.md`; the reasons are at the top of
`scripts/lib/bundle.mjs`.

The grid is every cell any layer covers, **sorted by H3 index**. That makes
it deterministic (the same layers always give the same bytes, so a re-import
of the same export writes nothing) and makes a layer's row order a property
of its cells alone, so adding a layer to a city never reorders another
layer's rows. CityChrone depends on that: its travel-time matrices are stored
with rows and columns in the same order, and a layer row number indexes both.
In H3 order neighbouring cells are neighbouring rows, which is also why the
matrices compress 2 to 3.5 times better than in the export's order.

A cell's **context population** — the Population layer, the city summary,
the derived cartograms — is the grid's: P.O.V. and Car Dependency share one
population model and win where they cover a cell, then 15minCity, then
CityChrone. Each layer keeps its own population too, for its own figures.

**Two geometries, one of them a companion.** The union mesh is drawn on the
true hexagons, and every layer has a cartogram to switch to, built from its
layer file: `layerCartogram` produces a `FeatureCollection` of
`{ "i": <grid position> }` and `withGeometry` in `adapters.js` re-draws the
loaded features onto it, keeping each feature's id so highlights and
feature-state do not notice.

**Cartograms come from two places, and the catalogue says which.** P.O.V. and
Car Dependency publish theirs, and those are **not** scaled hexagons — up to
~10 m off one on small cells — so they are kept as the platform drew them:
integer vertex offsets from the cell's H3 centre, in 1e-5°, the precision they
were always published at. Encoding them as a scale per cell was measured and
rejected for that reason. 15minCity and CityChrone publish none, so the Atlas
derives one by a rule it states: a cell keeps its centre and its shape, and
its **area is proportional to its population**, reaching the full hexagon at
the median over the layer's *inhabited* cells. Empty cells are not drawn, and
counting them pulled Rome's CityChrone reference (a metro-wide mask, 38%
empty) down to 4 residents, 44.6 m from CDI's cartogram. The population is the **grid's**, not the
layer's own: 15minCity's population model puts Milan's derived cartogram
38 m from the published ones, the grid's puts it at ~13 m, and the point is
that a cell of a given population is the same size whichever layer is on
screen. `test:data` fails if the rule drifts past 25 m from a published
cartogram of the same city. `cartogramSources` marks each as `published` or
`derived`, and the UI says which one is on screen. No layer reuses another's:
even the two published ones disagree by up to 9.6 m on cells they share.

Per-platform **summary files** (`<platform>/summary.json.gz`, declared as
`summary` beside `coverage`) carry one row per city for the compare view at
`/platforms/:slug/compare`, and the **coverage files** one marker per city for
the world maps. The importer writes both from the values it is publishing, so
the table and the city pages cannot disagree.

Anything the catalogue does not list falls back to generated seed data
(`src/data/cities.js`, `src/data/mesh.js`), so the site works on a fresh
checkout. Fetching goes through a **provider** — returning `null` means "not
published", throwing means "this provider failed", and both fall back. A future
scenario backend is a second provider installed with `setDataProvider()`; no
caller changes.

Adding a city is dropping its exports in `input_data/` and running
`npm run update:data`. That is the whole design.

**The catalogue, the coverage files and the summaries are derived, never
patched.** Each city's record (`cities/<city>/city.json`) holds its atlas
entry, one catalogue row, marker and compare row per layer, the SHA-256 of
each export it came from and `createdAt`. An import writes its city and
that record only; `buildIndex` then rebuilds `index.json`, every
`coverage.geojson.gz` and every `summary.json.gz` from all the records in
one pass, at the end of the run. They used to be upserted city by city,
from inside each import, so an import that died between two of them, or a
commit that carried one and not the other, left the catalogue and the world
maps describing different sites. `test:data` fails if a rebuild would change
anything; `npm run import -- --index` is the repair.

**Two boundaries, and scenarios: neither is a variant any more.** A city
can be published on its GHS core (Urban Centre, the default) and its metro
area (Functional Urban Area). The metro area is a city of its own, id
`<city>-fua`, imported from `<City>_FUA.<ext>`: own grid, layers, record and
statistics, **named as its core** ("Tokyo", not "Tokyo Fua"; `cityMeta` takes
the core's names when it has none). Its catalogue entry says
`extent: 'fua', core: '<city>'`, derived from the id (`extentOf` in
`bundle.mjs`); the city view offers "City (core) / Metro (FUA)" wherever both
exist and keeps the query string across, less `from` (a CityChrone row of
one grid). **The switch is a repaint, not a new page**, and three things keep
it one: `FadingRoutes` counts `/atlas/x` and `/atlas/x-fua` as one screen
(`screenOf`), so there is no cross-fade; `AtlasScreen` is not keyed by the
city, so the map and its WebGL context stay; and `useAtlasMesh` keeps the
last city's mesh (painted grey) until the next grid is in, then the camera
eases to the new extent (`fitDuration`). Its layer effects wait on *which*
city's grid is in, not on a ready flag: back to a cached city, "pending" and
"ready" land in one render and a flag never changes. One dot per place on the world maps: a metro area's marker is
dropped where its core publishes the same layer. Lists that set the two side
by side (compare view, CityChat) label it with `cityLabel`.

A **scenario** is an alternative run of one layer of a city (Rome's Metro D:
Car Dependency with a line that does not exist yet). It is **not a city**: it
is stored with its city, `cities/<city>/scenarios/<id>/<layer>.json.gz`,
**written against the city's own grid** (whose cells now include any a
scenario covers), listed in the record's `scenarios` and the atlas entry's
`scenarios`, and rewritten with the city whenever the grid moves. Imported
from `<city>__<scenario>` (two underscores) in any platform folder; the city
must publish that layer, because the viewer subtracts one from the other.
The viewer merges its values beside the baseline's under `<id>:<name>`
(`scenarioKey` in `grid.js`), so "Scenario" and "Difference" (`sc=`, `cmp=diff`)
are paint changes on the same features. Difference ramps are
`DELTA_RAMPS` in `ramps.js`, fixed like every other domain. Scenarios are
not statistics, have no marker and no compare row. The retired `VARIANTS`
list made `paris-fua` and `rome-metro-d` cities without markers; the first
is now a metro area, the second a scenario of Rome.

`update:data` skips an export whose hash is on record, so adding cities
touches only those cities. A published layer with no hash on record is
*adopted* (hash recorded, nothing re-imported); `--force` recomputes
everything. Hashes are written last, after `test:data` passed.

## Statistics — the Stats page

`/stats` is a dashboard over one file, `public/data/stats/stats.json.gz`,
named as `stats` in the catalogue. Nothing on the page computes a figure from
cells: `src/data/stats.js` picks one out of a published figure object, orders
it and colours it, and `StatsViews.jsx` draws it five ways (ranking, map,
scatter, matrix, curves), by city or by country. What is on screen lives in
the query string.

**The page opens on the dashboard, nothing above it.** No eyebrow, headline
or lede: the page's `<h1>` is the figure on screen (measure in ink, statistic
in the accent). It opens on 15minCity, the share of residents within 15
minutes on foot of the services on average, for cities of at least 1,000,000
residents (`DEFAULTS` in `Stats.jsx`). **Only cities that have the figure are
drawn anywhere**, on the map included: a city without the layer is not listed
as missing. The layout is **one row of buttons on top** (the layers, then the
views) and **a sidebar** with the figure, the filters and the highlighted
cities. Countries are a menu, not a row of chips, and population is one
logarithmic slider with two handles (min and max; the top end means no
maximum) and a number box under each.

**Focus is the first view, one per layer** (`StatsFocus.jsx`): the charts
each platform is read with, from the same statistics file, so the filters
and highlights apply. 15minCity: median time to every service, city by city,
on the platform's own ramp, and residents within 15 minutes on foot against
by bicycle. CityChrone: each city's 24 hours, median with the middle half as
a band, one scale per score across cities. Car Dependency: the index for the
average resident, residents by index band (from the shares above the CDI
thresholds) and reach by car against by transit. P.O.V.: residents by zone,
on the Atlas median beside the city's own, and median proximity against
opportunity with the Atlas medians drawn as the quadrant lines. Across
layers: every correlation, city by city. The per-platform compare pages for
P.O.V. and CDI are linked from their focus, not listed under the dashboard.

**Computed per city, only when its data changed, and never shown stale.**
`npm run stats` (`scripts/build-stats.mjs`, method at the top of
`scripts/lib/stats.mjs`) computes a city's figures from its published grid and
layer files and records the stored hash of each (`inputs`). It skips a city
whose hashes and `STATS_VERSION` are unchanged. The previous computation moves
into the city's history, `statistics/cities/<city>.json.gz` at the repository
root, which is **not served**. `buildIndex` then gathers the published file
from every city's current computation **whose inputs still match its files**,
and lists the rest as `omitted`. Because `buildIndex` runs at the end of every
import, an import that changes a city takes that city's figures off the site
in the same run. `update:data` then asks whether to recompute
(`--stats` / `--no-stats`; never asks outside a terminal). Declining leaves the
city absent from the Stats page, which is the point: the user decided that
out-of-date statistics are kept as history, not shown. `npm run stats` does
**not** run `test:data` (update:data has just run it on the same data, and the
next `test:data` recomputes every city's statistics anyway).

**Cities with data too thin to compare are hidden by default**, by one rule
in `scripts/lib/quality.mjs`: fewer than 10,000 residents, or a 15minCity
median walk to services over 60 minutes (the figure its marker carries).
They stay published, city view and all. `buildIndex` flags their world-map
markers `hidden` and `citiesFromPublished` skips them unless asked
(`includeHidden`); the statistics flag them too, pool them into no country
and into no Atlas median, and the Stats page never shows them: there is no
button for it, only a note counting how many it left out. The rule's numbers
travel in the stats file (`hiddenRule`) so the page never keeps a copy. Every
run that rebuilds the maps or the statistics prints how many it hid, and
`test:data` checks the markers and the statistics follow the same rule.

**`STATS_VERSION` is the method.** Add a figure, or compute one differently,
and bump it. `test:data` recomputes every published city and fails if a
figure differs from the file with the same inputs, which is what catches a
method change made without the bump.

What is easy to get wrong:

- **Weighted by the layer's own population**, the same residents its summary
  and markers weight by. So `pov.proximity`'s mean is the compare view's
  `weightedProximity`, and `test:data` checks that it is, along with the
  CDI mean, the zone shares and the 15minCity and CityChrone markers.
- **Thresholds are fixed round numbers**, chosen once against the pooled
  published range (the comment above each list says which measurements),
  like a ramp's domain. A share "within 15 minutes" means the same in every
  city. Never fit them to what is on screen.
- **P.O.V. has two kinds of zones here.** `pov.zonesCity` is the platform's
  own, at each city's medians: `comparability: 'within-city'`, so the
  ranking shows no rank numbers and says why. `pov.zonesCommon` splits every
  city at **the Atlas median**: the population-weighted median proximity and
  opportunity of every P.O.V. resident of every city shown by default,
  together, so "inclusion" reads "better than half the Atlas's residents on
  both scores". It depends on every city, so it is not computed per city: a
  city's computation keeps its inhabited P.O.V. cells (`cells.pov`, dropped
  when the computation moves into history) and `assembleStats` derives the
  medians and every city's shares when it gathers the file. The medians move
  a little with every city added, and the file states them
  (`zoneThresholds`, with the number of cities they came from).
- **A country pools, never averages.** Only means and shares of residents
  pool exactly (a population-weighted mean of population-weighted figures),
  so a country offers no median, percentile, Gini or correlation. A country
  is pooled **once per boundary**: its cores together, its metro areas
  together, never one with the other, because a metro area's residents
  include its core's. **For now only 15minCity is pooled** (`COUNTRY_LAYERS` in
  `stats.mjs`), the layer meant to cover whole countries; the page reads
  which layers have countries from the file and disables the others.
- **15minCity's `99999`** ("not reachable") stays in quantiles and shares as
  a time longer than any threshold, but makes a mean or an inequality index
  meaningless, so those are null where anyone lives in such a cell.
- **The caveats are part of the page, not decoration.** One standing note
  and the "Method and limits" dialog, notes under the view that apply only to
  what is on screen (`contextNotes` in `Stats.jsx`), and a `!` beside a row
  for a layer covering under nine in ten of its city's residents
  (`cityFlags`). New copy that would apply everywhere belongs in the
  dialog, not as another standing note.
- **Highlight colours follow the city, not its position.** `sel` in the URL
  holds four slots, possibly empty, so removing one highlighted city never
  repaints the others. The four are the first slots of the dataviz reference
  palette, validated together for lines; two are below 3:1 contrast, which
  is why every highlighted line and dot is also named.

## The grids — read this before touching the combined viewer

**One standard H3 grid per city, shared by every platform — and every
published city is on it.** Harmonisation happens **offline**, in the
importers, not in the app. The app renders whatever grid the catalogue
describes — it does not reproject, resample or reconcile anything.

Every import proves the grid rather than assuming it (see "The grid is
detected" below), and a mask is whatever each platform covers: in Milan
15minCity covers 7,498 cells (the whole metro), Car Dependency and CityChrone
an *identical* 1,741, P.O.V. a strict subset at 1,636, and the grid is their
7,637-cell union. Rome's P.O.V. (8,089) and Car Dependency (11,409) turned out
to be on the same grid too — 99.8% of P.O.V.'s cells sit on a CDI cell — so
every city now opens in the combined viewer with its layers on one mesh. The
retired legacy 15minCity Rome export was a different tiling (~8% overlap,
i.e. chance) and is exactly what the importer would now refuse.

`src/pages/AtlasCityPage.jsx` still carries the older path — a city with
per-platform datasets and no `atlas` entry swaps meshes instead of repainting
one — and the catalogue decides which applies. Nothing published takes it
today.

**There is one city view, and it is that page.** The per-platform city pages
were removed: everything they did, the combined viewer does on any published
city, and keeping four screens meant four places for the same measure to be
described differently. `/platforms/:slug/:cityId` still resolves — it
redirects to `/atlas/:cityId?layer=<platform>` — and `/platforms/:slug/compare`
is untouched. The cell-level scatter went with those pages; the compare
view's city-level scatter did not.

**The `cell` field is per-city and must stay honest.** `h3Resolution` is the
resolution the importer proved, and `cellRadiusM` is measured from the grid's
own hexagons. An earlier build script inferred the resolution from cell
radius, and was wrong.

## Type

Two faces, self-hosted through `@fontsource` so they render identically
offline, and one job each.

- **`--font-serif` (Instrument Serif) is the display face**, and it carries
  the titles: every page's `__headline`, the landing, and
  `.aa-section-head__title`. It **ships one weight**, so every rule that
  reaches for it also sets `font-weight: 400` — 600 on a 400-only face is a
  synthesised bold, and it looks it. Tracking is `-0.02em` rather than the
  `-0.035em` the sans took: a serif closes up at that size on its own.
- **`--font-sans` (Roboto) is everything else** — body, UI, ledes, card
  titles, the nav.
- **`--font-mono` (Roboto Mono)** is only ever used for figures, coordinates
  and counts, where digits have to line up column to column.

**Every title carries a coloured half** — `.aa-accent` in `global.css`, the
brand magenta — split in the dictionaries as `headline` / `headlineAccent`
(and `title` / `titleAccent` on the landing). The phrase that says what the
page *is* takes the colour; the run-up to it stays in ink. One class, so the
colour is decided in one place.

A title that is not on that list is a bug in one direction; a paragraph in the
serif is a bug in the other.

## Colour

`src/map/ramps.js` holds one ramp per measure, and two rules keep them
readable:

- **Continuous measures get continuous ramps.** Only P.O.V.'s four zones are
  categorical. A step scale invents boundaries the data does not have — two
  cells either side of an edge look further apart than two at opposite ends of
  one band. The legend is `RampLegend`, a gradient with its values under it;
  it cannot show a share per band, so figures that mattered (the 15minCity
  median) moved to the summary.
- **Domains are fixed, never fitted.** A ramp rescaled per city or per hour
  recolours the same value depending on what else is on screen, which is what
  makes two maps uncomparable. Each domain is a round number covering the
  published range, and the comment above it states the measurements it was
  checked against — update both together. 15minCity shares one scale across
  all ten categories and both modes for the same reason.

**A pale swatch needs an edge, and the edge is ink.** Every scale here runs
pale at one end, and on this paper the palest step has no outline of its own:
the one-platform grey on the coverage map and 15minCity's near-15-minute band
were dots you had to know were there. The white halo the markers used to
carry could not help — the marker that most needs an outline is exactly the
one white cannot draw. `MARKER_EDGE` in `map/layers.js` is ink at 0.5 alpha,
which reads against the paper and disappears into a dark dot, so one value
works at both ends of every scale; `.aa-swatch` and `.aa-picker__dot` carry
the same hairline as an inset shadow.

The hairline alone still lost the palest steps on the world maps (a slow
CityChrone city, a balanced CDI ring, a one-platform city), so a scale step
whose luminance is above 0.6 gets an edge of its own colour taken 60% of the
way to ink, and a wider one (`isPale` / `darkEdge` in `map/layers.js`). It is
derived from the scale, so a new pale colour is covered without a list.

The 15minCity ramp is centred on white at 15 minutes and keeps darkening past
30 to black at 120. The legend bar stops at 30 and draws the rest as a
**compressed tail** beside it — a quarter of the width for four times the
range, labelled `… 120+`. Stretching the bar to 120 squashes the range nearly
every cell sits in; leaving the tail off puts colours on the map that are
nowhere on the legend. The isochrone ramp does the same past 120.

## Facts that are easy to get wrong

- **CDI = (O_car − O_PT) / (O_car + O_PT)**, bounded in [−1, +1]. A normalised
  difference, *not* a ratio. The site once scaled it 1.5–6 and described it as
  "how many more places a car reaches" — a quantity the index does not measure.
- **P.O.V. zone thresholds are population-weighted medians**, not plain
  medians. Verified: classifying against them reproduces the upstream
  `cell_type` for all 47,902 published cells. The P.O.V. importer re-derives
  every cell and throws if it disagrees.
- **Zones compare places within a city, not between cities** — thresholds are
  city-specific. The underlying scores are what compare across cities.
- **The cartograms are population-scaled.** Cells sit in true positions; their
  *area* encodes population. Cell geometry therefore cannot be measured from
  the file and comes from the catalogue's `cell` field. They are **not** Dorling
  cartograms, whatever the upstream CDI copy says — a Dorling cartogram
  displaces its cells, and these do not move.
- **Cell shares and resident shares are different stories.** 67.7% of Milan's
  P.O.V. cells are total isolation, but only 42.7% of its residents: isolated
  cells are large and thinly populated. Both are published
  (`zoneShares`, `zonePopulationShares`) and the compare view switches between
  them; say which one a figure is.
- **15minCity's letter codes are retired.** The harmonised exports key
  measures with full words (`education_foot`, `proximity_time_bicycle`);
  `src/data/fifteen.js` holds the live category list. The legacy `script.php`
  contains two conflicting letter→category tables — if an old letter-keyed
  file ever resurfaces, do not take a letter's meaning from that file.
- **CityChrone's scores carry no verified unit conversion.** `v_score` is
  described as km/h-like and labelled that way after the upstream site;
  `s_score` is a weighted count of reachable people and is called a score,
  never a headcount. Hexcover `coord` is `[lat, lon]` — the one published
  file on that order.

## Traps that have already cost time

**The SPA fallback masks 404s.** A wrong asset URL is served `index.html` with
HTTP 200, not a 404. Two bugs hid behind this: a missing `dist/404.html`, and a
data URL built as `/data/data/index.json`. Both produced a working-looking page
that quietly rendered synthetic data. Never conclude a path is right because
nothing 404'd — assert on what was *fetched*.

**A cached catalogue mislabels published cities as unpublished.**
`index.json` decides what is published and sits at a stable URL, so a returning
visitor was served the previous deploy's copy — Milan's 15minCity and
CityChrone layers read "Not published" on a site where both were live. It is
now fetched as `index.json?v=<build id>` (`catalogueUrl()`, id defined in
`vite.config.js`). If a symptom is "the deployed site disagrees with
`public/data/`", suspect the cache before the code.

The files it points at had the same problem one level down, and on the
self-hosted server it showed: they sat at stable URLs, Apache sends no
`Cache-Control`, and a browser kept a coverage file or a grid from the last
deploy under the new catalogue (new cities missing from the world map; a
grid from one deploy under layers from the next). The current version of
a file is fetched by its **plain path**, on purpose (a `?v=<hash>` on every
request was tried and rejected as noise), so what keeps it current is the
server: Apache sends `Cache-Control: no-cache` on the shell and the data
(README, Apache section), and a returning browser revalidates and gets a
304. The catalogue still lists a content hash per file (`files`), which
names the version it describes; `fileUrl(catalogue, path, version)` tags a
URL with one only when asked, for a host that will serve earlier versions.
Every URL in `sources.js` goes through `fileUrl`; a new one must too.

**A shared fetch must not carry one caller's abort signal.** The catalogue is
memoised, because nearly every route reads it and it cannot change within a
session, so every consumer on the page awaits the same promise. That promise
was created with whichever consumer asked first, *including its
`AbortSignal`* — and React remounts every effect in development, so the first
consumer unmounted a tick later and aborted the fetch for all of them. The
rejection was then left in the memo, so nothing ever retried: one aborted
request per page load, and the session answered "nothing is published" from
then on. What that looks like is not an error. It is the seed city list, on a
site whose maps, panels and figures all render perfectly, in `npm run dev`
only — the built site was always fine, which is exactly what makes it read as
"my newly imported cities did not import". The catalogue is fetched with no
caller's signal now; a caller's own abort ends only its own wait
(`whenAborted` in `sources.js`), and a failed fetch clears the memo so the
next caller retries.

The dataset cache had the same shape and one extra edge, and it cost the
whole city view: `loadDataset` keyed its promise on the URL, created it with
the first caller's signal, and could hand that promise to the next caller
*before* the rejection cleared the entry — which is exactly the sequence a
remount produces. The abort was then wrapped in a `DatasetError`, so every
`error.name === 'AbortError'` guard downstream read it as a broken file and
drew the fallback. In development that meant every published city mesh became
the seed mesh, with the real file sitting right there answering 200 to nobody:
`/atlas/rome` reported 8,115 cells and no median rather than P.O.V.'s 8,089.
Shared work now carries no caller's signal, an abort keeps its own name, and
`whenAborted` in `loaders.js` is what ends one caller's wait. `test:data`
pins all three, and the browser suites cannot: they run against a build,
where React does not double-mount.

**The seed data reproduces the real Rome figures.** The generated mesh was
calibrated to match 8,089 cells and 12.9/2.7/1.4/83.0. Any test that checks
those values passes whether the real file loaded or not. Tests on this data
path must assert **provenance** (which URL was requested, `source === 'published'`),
not values.

**`pkill -f "vite preview"` kills the calling shell** (exit 144). Expected, not
a failure.

**`curl … | head -c 1` under `set -o pipefail` ends a script.** Once the body
is larger than a pipe buffer, `head` closes the pipe, curl exits 23, and the
assignment fails `set -e` with no message. `deploy.sh`'s catalogue check did
exactly that once `index.json` grew. Read the body whole.

**A decorative source must never gate the data layers.** `AtlasMap` mounts its
children only once the map is ready, and readiness used to wait on MapLibre's
`load` — which waits for *every* source, including the raster basemap. With
the tile host slow or blocked, `load` never fired, so the mesh was never added
and the map rendered blank while the panel showed correct figures. Readiness
now also fires on `styledata` once `isStyleLoaded()`, which is all a child
needs. Check this whenever a new source joins the style.

**The suites run with `VITE_BASEMAP_STYLE=none`.** City maps draw a
third-party basemap, and a test that fails when that host is unreachable is
testing the host. CI builds with it off; the Pages workflow builds with it on.
Chromium's own `net::ERR_*` console errors are not something the app can
suppress, so this is a build flag rather than a filter in `smoke.mjs`.

**The basemap provider is one env var, and has changed once already.** CARTO's
keyless raster tiles started requiring an API key, so the default moved to
OpenFreeMap's vector Positron — keyless, accountless, and therefore consistent
with a static build that cannot hold a secret. `resolveStyle` fetches the style
itself rather than handing MapLibre a URL, so an unreachable provider degrades
to paper instead of leaving the map style-less and, therefore, layer-less.

**A map must be framed before its first frame, not on `load`.** The camera the
constructor is given is only a starting point: a world view's real zoom depends
on how wide its container turned out to be, and a city's on the extent of its
mesh. Applying that on `load` painted the map once at the constructor's framing
and then jumped — visible on every cold open of the front door. `AtlasMap` now
frames immediately after construction *and* again on load (the second is not
redundant: MapLibre's centre clamp before a style is not the one that holds).
Nothing renders before the style arrives, so the first camera is the one the
reader sees.

**The scrollbar is part of the map's framing.** The world spans the container's
width exactly, so a page that scrolls and a page that does not were handing the
backdrop two different widths, and the world stepped sideways by a scrollbar
between one tab and the next. `html { scrollbar-gutter: stable }` reserves the
track on every page; `smoke.mjs` asserts the width is the same with and without
one. Anything that changes how the document scrolls has to keep that true.

**A metro area is 120,000 cells, and everything that copies the mesh
shows.** Tokyo's FUA took ~20 s to colour in a headless browser, and froze
the page for seconds on every hover. Three things did it, and each is easy
to bring back: hover and selection outlines were `GeoJSONLayer`s over the
whole mesh (each one the whole collection copied to MapLibre's worker and
re-indexed; as filters on the mesh's own source, every pointer move
re-tiled every cell), so they are one-cell sources now; `setData` ran once
more right after `addSource` with the same collection; and `mergeLayer`
added properties one by one, which past a couple of dozen drops V8 objects
into dictionary mode (930 ms against 50 ms with a literal per shape,
`builderFor` in `grid.js`). The page also says so while it loads ("Large
cities can take a while…", above `LARGE_CITY_CELLS`) and draws the grid
faintly before the layer's colours arrive. And the mesh's source has
`tolerance: 0`: MapLibre's default simplification *drops* polygons smaller
than a fraction of a pixel, so at a metro area's own opening zoom on a
laptop screen every 200 m cell went, and the map was empty. What is left is
`cellToBoundary` on every cell (~0.6 s) and MapLibre's own copy and tiling;
vector tiles made at import would remove both, at the cost of the
FeatureCollection every panel reads.

**GitHub Pages deep links return HTTP 404 with a rendered page.** Inherent to
the `404.html` fallback. Users see the right page; crawlers and uptime checks
see a 404.

## Testing

Three suites, all in CI, fastest first:

```bash
npm run test:data          # no browser, no build — validates every published file
npm run smoke              # every route in a real browser
npm run smoke:published    # stages a dataset, asserts it is read instead of seed
```

`test:data` runs the viewer's own code (`grid.js`, `meshFromAtlas`) over
every published city — grid to hexagons, every layer merged in, all 24
CityChrone hours included — and checks the grid is sorted and unique, every
layer's rows land on grid cells, shares sum to 100, no CDI is outside
[−1, +1], every 15minCity category × mode is present, the derived
cartogram rule stays within 25 m of the published ones, every CityChrone
matrix has the right header and decoded length, the compare rows agree with the layers, the catalogue's own `cells`
and `extent` fields match the files, every scenario sits on its city's grid, the statistics are what recomputing them gives
and agree with the summaries and markers, and that Rome still reports the figures the copy
quotes. Run it after any data change — `update:data` does — it catches in
seconds what the browser suites take minutes to reach.

Playwright is deliberately **not** a dependency; CI installs it on the fly.
Locally: `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`, and build with
`VITE_BASEMAP_STYLE=none` first so no check depends on the basemap host.

## Explaining the measures

Two levels, and the split matters. Anything a reader could misread carries an
`Explain` — a "?" that shows a **tooltip** on hover or focus and drops it when
the pointer leaves, so reading one costs nothing and dismissing it is not a
second decision. **The tooltip is drawn in a portal on the body, positioned
against its button**: most of them live in the city view's controls column,
which scrolls, and a scrolling box clips what its children paint outside it
whatever their z-index — so the half with the method in it was cut off at the
map's edge. Fixed and portalled, it is bounded by the window instead, flips
above the button when there is no room below, and closes on a short delay so
the pointer can cross the gap into it. The long form — what the platform measures, how its colours
read, the two geometries, the panel's figures, the method, the sources — is
one dialog behind "about this layer" (`PlatformAbout`), never a growing block
in the panel. Both draw on the same `city.explain.*` copy, so a tooltip and
the dialog cannot say different things, and the dialog's colour key is the
same `RampLegend` the map uses.

The copy was ported from the two upstream viewers, **minus two claims of
theirs that are wrong here**: CDI calls its cartogram a Dorling one, and
P.O.V. calls its thresholds plain medians when they are population-weighted.
Do not re-import either when adding copy from upstream.

## The front door

`/` is the landing (`src/pages/AtlasHome.jsx`): the Atlas's own coverage map,
with the copy over it. **One centred column, read straight down** — the name,
one line under it, the premise, one way in — on the centre line of that
viewport, so the map is symmetrical around the words rather than pushed to one
side. The premise used to be a second block off to the right under its own
heading, which made the screen two things to read; it is now where the title
arrives, three sentences under a short rule in the brand's **cyan**, closing on
a line in **navy**, which the way in then repeats. The magenta half of the
title is unchanged — that rule holds for every page.

The screen **counts nothing**: the list of cities, platforms, countries, cells
and researchers that sat at its foot, and again a screen below it, is gone from
both. `atlasMetrics()` in `src/data/home.js` still counts them from the
catalogue — nothing renders it, and putting it back is one block of JSX. What is in the
corner instead is the credit: the Sony CSL mark and one line, bottom right.

Two ways past the copy, answering different questions: **scrolling** reads the
rest of the home page, directly underneath (`HomeSections`, exported from
`Home.jsx` and mounted in both places, so the two cannot drift);
**"explore the platform"** is an ordinary `<Link>` to `/platforms`, so it
changes the URL, lights that tab and opens in a new one like any other link.

**The map behind the copy is the site's backdrop, not this page's.**
`Backdrop` (in the shell, beside the nav) is one coverage map fixed to the
viewport, behind every page: it never scrolls, never remounts on navigation,
and is the Atlas's own data rather than a texture that resembles it. The
landing only leaves it a viewport of clear space; its own sections scroll over
it as before.

**The world maps are Equal Earth, drawn with d3-geo, not MapLibre.** The
backdrop, the platform screen and the platform cards' world thumbnails are
`WorldMap` (`src/map/WorldMap.jsx`): one canvas, paper, the projection's own
outline, a 30° graticule, Natural Earth's land and the markers, in
`geoEqualEarth` on the Greenwich meridian. Mercator drew Europe and North
America twice the size of Africa on the map whose job is to say where in the
world the Atlas has data. The central meridian is fixed, not fitted: a world
that rotates as cities are added is a different map each time. Pan and zoom
are d3-zoom on top of the frame (`MAX_ZOOM` 6, about a region: a city is
opened, not zoomed into), the tooltip is a positioned `.aa-map-popup`, and
hit-testing is a quadtree over the drawn markers. Marker styles are plain
functions of the city and the zoom (`cityMarkerStyle`,
`coverageMarkerStyle` in `map/layers.js`), at the sizes the MapLibre
expressions had, through `worldZoom`. Only the city view is MapLibre now.

**The coverage frame is derived from the coverage, not written down.**
`coverageFraming()` in `map/framing.js` takes the merged city list and
returns the centre and zoom boost both coverage maps use, measured on the
cities' projected positions (Equal Earth's meridians bend, so degrees are
the wrong ruler). The world is `2^boost` container widths wide, so the
arithmetic is exact: it fits the projected span of every city, pads it by
1.25, and clamps the result to at most 2.4 so an Atlas publishing one city
still draws a world rather than that city's rooftops. `worldProjection(size,
frame)` turns a frame into the projection for a box: it also backs off if
the coverage would not fit the box's height, and clamps the centre the way a
map does (an axis where the world is smaller than the box is centred; one
where it is larger shows no paper past the world's edge). It is the one
place a pose is computed: `WorldMap` draws with it and `smoke.mjs`
reprojects with it. Coverage straddling the antimeridian is framed the long
way round: a flat map with one seam cannot do otherwise.

A pose written down once goes wrong in both directions as coverage grows:
too tight crops new continents off the sides, too loose shrinks the cities
that *are* published to specks on an empty ocean. **Both failures pass a
test that only asks whether the markers are inside the frame** — the second
one shipped exactly that way, at `WORLD_ZOOM_BOOST = 0`, and read as "the
cities aren't loading". `WORLD_ZOOM_BOOST` and `WORLD_CENTER` still exist,
but they are a *cache of the function's output* for the coverage published
today, used only for the frame or two before the catalogue answers — keeping
them equal to the derived pose is what stops a cold load from re-framing.
Do not hand-tune them; change the padding or the clamp instead.

Both callers pass the **merged** coverage (`all.cities`), never the open
tab's, so switching platform never moves the world — and so the backdrop and
the platform screen stay one map. `smoke.mjs` reprojects the published
coverage and fails if any marker lands outside, hovers the pixel Milan
projects to (which pins centre and zoom together: a MapLibre centre clamp
once pulled a map asked for 47°N down to 19°N, and nothing else could see
it), and checks the cached `WORLD_CENTER` / `WORLD_ZOOM_BOOST` still equal
the pose the published coverage gives.

**The backdrop and the platform screen are one map, and must stay one.** Same
centre and same zoom past the world-width fit (`WORLD_CENTER` and
`WORLD_ZOOM_BOOST` in `map/framing.js`, passed by both), and the same box:
`.aa-backdrop` starts at `--nav-h` rather than at the top of the viewport,
because the platform map fills the viewport less the bar. `--nav-h` is
published unrounded for the same reason — rounding a 74.5 px bar to 75 leaves
the two worlds half a pixel apart, which reads as a jump when you step from
one to the other. Changing any of the three without the others is what makes
the front door and the platform tab look like different maps.

**What floats over a map fades in** (`.aa-fadein`, `global.css`): a map paints
in two steps, and controls that snap on over a half-drawn one read as a page
that has not loaded. Opacity only, never transform — `.aa-picker` centres
itself with `translateX`, and animating transform would throw it across the
screen.

One veil, the same on every page and at every scroll position: a gradient,
densest where a page's copy sits and nearly clear on the far side. Nothing
above it may paint it out — the map is the site's subject, not a watermark, so
what scrolls over it is transparent between its own cards and the map is as
visible on a page of text as on the front door. If a block turns out to be
unreadable over it, give that block a background; do not reach for the veil.

**The backdrop is dismissed by the map that replaces it, never by the route.**
The two screens that *are* a full-bleed map — `/platforms` and
`/atlas/:cityId` — end up with a second map drawing nothing behind an opaque
one, so the backdrop does go; but dropping it the moment the URL
changed emptied the frame while the new map was still being built, and the
world left and came back on a step that is meant to be one world throughout.
So a covering map reports itself once it has painted (`useCoversBackdrop` in
`src/map/backdrop.js`, passed as `coversBackdrop` to `WorldMap` and
`AtlasMap`) and only then
is the backdrop let go — hidden with `visibility`, not unmounted, so stepping
back out returns the same map instead of building a second one, and the box
stays measurable so the world-width fit survives a resize it cannot see. The
veil goes earlier, on the route, so what the incoming map fades up over is the
bare world it is about to be. Opening the site straight onto one of those two
screens still builds one map, not two: the backdrop is created the first
time a page actually wants it.

**Holding the backdrop is not enough on its own: nothing may paint over it
either.** The rule above was in place and the handover still went blank, for a
reason no computed style can show. A map's container carries the paper the map
is drawn on, and the incoming screen commits with that paper up and its canvas
empty — so `.aa-mapstage`, `.aa-city__canvas` and `.aa-map` itself were an
opaque sheet the size of the viewport, laid over a backdrop that was still
dutifully `visible` underneath, for the ~350 ms MapLibre took to build. Three
things keep it honest now: a map with no style yet is `.aa-map--blank`, which
paints nothing and lets what is behind it stand in, then fades up over 320 ms
once it has something to show; the two containers bring no paper of their own,
so the box is the world until the map fills it; and the backdrop's own fade out
is timed to start *after* that fade in has finished, so the two overlap rather
than trade places.

**A map is painted when its own sources are, not when its style is.** For
`WorldMap` that is simple: it is painted once it has drawn the land and the
markers it was given, synchronously, in the same commit. For `AtlasMap`: style
load is the paper and the *declaration* of everything else; the data behind it
arrives after. The city markers landed about 200 ms behind the world, so a map
that faded in on style load covered the backdrop's markers with its own empty
world and popped the same dots back a moment later — a blink with no cause a
reader could see. `AtlasMap` now waits for the sources it draws itself: the
paper basemap's `land` and `graticule`, and the `-src` GeoJSON sources its
children add. **Never the third-party basemap** — that is context, it may be
slow or blocked, and gating the data on it is the trap that once left the map
blank whenever the tile host was unreachable. A failsafe timer covers a source
that never resolves; it is a failsafe, not a schedule.

**The merged coverage is derived once and remembered** (`useAllCoverage`), held
against the provider it came from so a `setDataProvider()` swap needs no hook
into this file. Both the backdrop and the platform world map draw it, and
deriving it twice meant the second one mounted on the *seed* city list and
swapped to the published set a beat later — the markers changing under a map
that had just said it was the same world.

**A route cross-fade counts as nothing covering.** The screen being left is
still mounted, and still counted, for the length of the fade — which is right
when it is dissolving to a page, and wrong when it is dissolving to another
map: stepping from `/platforms` to a city, the outgoing map was the only thing
holding the backdrop down, so the frame emptied for exactly the fade's length.
`FadingRoutes` therefore reports its own state (`useRouteFading`), and the
world comes back underneath the outgoing map rather than after it.

`smoke.mjs` asserts all of it — the world holds through the handover, the map
that comes back is the one that left, and, sampling frames off the compositor
across two handovers, that none of them is a blank sheet where the world was
and that Milan's marker never lightens once it is on screen. Those last two are
the checks that would have caught the flash and the blink: the DOM-level one
passed the whole time both were happening. Both are measured against what the
frame settles at rather than a number written down here, and both fail on the
build before the fix — worth re-confirming if you change either.

The landing once became the platform in place, on the same URL, because
navigating remounted the map and flashed. The route cross-fade below removed
that reason, and with it the phase machinery: one screen, one link.

The previous home page is **not deleted** — it is routed at `/overview`, so
the landing can be reverted by pointing `/` back at it.

The world map at `/platforms` has no bar above it either: the search
(`CitySearch`, which owns its own ⌘K and its own CSS so it can sit anywhere)
and the source link float on the map, the platform's paper and comparison
moved into the welcome card that introduces it, and the legend sits below the
search rather than under it.

**The search looks through every published city, whatever tab is open**, with
the catalogue's names in both languages, its region and its boundary (a metro
area has no marker where its core has one, and still has to be findable).
Accents are folded, a name prefix beats a word prefix beats a substring beats
a country, and a city opens on the open layer only if it has it. It is an
ARIA combobox: arrows, Enter, Escape (clear, then leave), and the highlighted
result is drawn large on the map. **It must not sit in a `.aa-mapui` box**:
those scroll when short of room, a scrolling box clips what its children
paint outside it, and the results menu opens outside it. That is how the
menu went unseen for a while: typing produced nothing on screen at all.

**It opens on a layer, not on a count of layers.** `/platforms` is the first
layer — 15-minute city — and the merged map has its own address at
`/platforms/all`, which an unknown slug also lands on. The picker lists the
four layers in platform order and puts "All layers" last, because it is the
whole rather than a fifth lens, and it introduces itself as the Atlas
(`platform.all.welcome`) rather than through `platform.welcome`, which would
say "Welcome to All layers". Each entry's dot is a **miniature of the scale
that map draws with** — the layer's own ramp, P.O.V.'s four zones as hard
quarters, the coverage scale for the merged map. Solid accents could not do
that job: two of the four layers are navy and two are terracotta, so half the
row was two pairs of identical dots.

**Every marker opens its city, whatever the open layer covers.** The city
view opens on the first layer that city actually carries, so a Car
Dependency city needs no 15minCity to be worth a click. `useCityPageIds()`
asks the catalogue for cities published by *any* platform when no platform is
named; asking only the open tab meant the merged map fell back to the bundled
seed profiles, of which there is one, and twenty of the twenty-two published
cities were inert. `smoke.mjs` clicks Rome on the merged map and expects
`/atlas/rome`.

**Routes cross-fade** (`FadingRoutes` in `App.jsx`), which is why it keeps
rendering the *old* location until the fade finishes — swapping first would
show the new page at full opacity behind the fading one. It compares the
**path only**: the city view keeps its layer, hour and selection in the query
string, and fading the map on every dropdown would be worse than not fading
at all.

Two things make the fade *in* actually run, and both are easy to undo by
accident. `Suspense` sits **inside** the faded element: with the boundary
outside, a route whose lazy chunk had not arrived replaced that element with
the fallback and took the fade with it — which is why new content used to
appear as a cut. And the swap runs in a `startTransition`, so React holds the
old screen until the new one can be shown rather than flashing a blank.

**The nav is the shell's, not any page's** (`Chrome` in `App.jsx`), and sits
outside the faded region, so navigating never rebuilds it: the bar stays put
while the page under it fades, and only the lit tab changes — derived from
the path by `activeTab`. Three consequences to keep in mind:

- The first two tabs are **Home** (`/`) and **Atlas** (`/platforms`): what
  they lead to, not what the site is called. The site's name is already on
  the bar, to the left, and a tab repeating it said nothing about where it
  went. `smoke.mjs` clicks them by those names.
- It publishes its measured height as `--nav-h`, and the full-height screens
  size against `calc(100vh - var(--nav-h))`. Measuring beats a constant: the
  bar wraps on narrow screens.
- `#root` is `min-height: 100%`, never `height`. A sticky element can only
  travel inside its parent's box, and a root pinned to one viewport let the
  bar scroll away with it.
- A page cannot unmount what it does not own, so the city view's full screen
  marks the document (`.aa-chromeless`) and the shell's own rule answers.

## The home page

Three sections under the landing, and none of them numbered: **Accessibility
layers** (the four platform cards), **Compare cities** (the six-city table,
which hands off to `/stats`) and **Work in progress** (`WORK_IN_PROGRESS` in
`src/data/home.js`). The coverage-map section that used to open the page went
when the backdrop became the site's map — it was the same map twice — and the
pull quote went when the premise moved onto the front door. The metrics strip
went with the landing's copy of it, and `SectionHeading` no longer takes a
`hint`: the italic note at the far right of a heading restated the section
under it in three words.

**A platform card opens the Atlas's own introduction to that layer, not the
upstream viewer.** Each of the four has a post in `src/data/blog.js` carrying
`layer: '<platform id>'`, which `postForLayer` resolves; a post's `links`
block is where the platform and its paper are handed over. A card labelled
"More info" that dropped a first-time reader straight into someone else's
viewer was the thing this replaced.

Two tabs exist mostly to be filled in: `/sustainable-cities` says who the
group is and `/consulting` gives an address. `/stats` is the statistics
dashboard (see "Statistics" above), with the per-platform comparisons linked
under it. They share `Prose.css`.

## The map is the page

The city view is a full-bleed map with a controls column and floating boxes
(`MapBox`) in its corners: the geometry switch top left, the city summary and
the selected cell top right, opacity bottom left, full screen bottom right.
Full screen hides the chrome and keeps the column, and Escape leaves it.

**The column is closed from its own edge**, not from a button on the map: a
small chevron (`.aa-city__panelbtn`) sits astride the seam between the column
and the map, halfway down, and says which way it moves with its direction
rather than a word. It was a labelled button in the map's top-left corner,
where it read as a control on the map and crowded the geometry switch.

Two things that are easy to get wrong here:

- **A cell where nobody lives is not drawn**, on every layer but
  Population: the mesh's fill layer carries a filter on the grid's
  population (`POPULATED` in `AtlasCityPage.jsx`), so the cell cannot be
  hovered or selected either. The summary's cell count is still the layer's
  whole mask.
- **The summary describes the layer, not the mesh.** Its cell count and area
  are the layer's own mask — 1,636 cells over 170 km² for Milan's P.O.V., not
  the union's 7,637 — because the count beside a figure has to be the count
  that figure came from. Area comes from `meshFromAtlas`, measured on the
  true hexagons. Until the layer's own file has arrived the count reads "—":
  a zero there would be a claim, not a placeholder. **Population too** is
  the layer's own, from its catalogue row: the mesh's cells carry the grid's
  population, and summing those gave Rome's P.O.V. 2.7 M (the grid, grown by
  15minCity's cells) beside P.O.V.'s 8,089 cells, whose residents are 2.6 M.
  Only the Population layer shows the grid's total.
- **The basemap's terms are MapLibre's own control, and they are not compact.**
  OpenFreeMap serves the tiles keylessly and asks to be credited with
  OpenMapTiles and OpenStreetMap; the credit travels inside the style's
  sources and `AtlasMap` renders it with `attributionControl: { compact: false }`,
  bottom right and permanently open. A second copy of the same line used to sit
  under the map as `.aa-city__caption` — one credit, in one corner, is the
  whole of it now.
- **"Notice a mistake?" is the corner of the controls column** — a toggle that
  opens two sentences and a `mailto:`. It is pinned with `margin-top: auto`,
  which is why `.aa-atlas .aa-city__panel` is a flex column.

15-minute city's times are shown as a clock — `formatTime`, `m:ss` or `mm:ss`
— everywhere a reader meets one: the map's tooltip, the inspector, the bars.
Decimal minutes read as a quantity; nobody says "three point nine nine
minutes to the shops". The legend keeps plain numbers, because it is a scale
rather than a reading.

## Copy and i18n

Ten languages: English, Italian, Spanish, French, German, Portuguese
(Brazil), Chinese (Simplified), Japanese, Korean and Arabic, one dictionary
each in `src/i18n/`. Every dictionary must keep `en.js`'s key shape and every
English string's `{placeholders}`. `t()` warns on a missing key in
development only, and falls back to English silently in a build, so
`test:data` checks the shape and the placeholders of every `<code>.js` it
finds there, and that `locales.js` agrees with each `meta.locale`. Adding a
language is a dictionary, a line in `DICTS` and one in `locales.js`.

**The languages are a menu, not a row.** `LangMenu` in `Nav.jsx` shows the
current code and lists the rest, each in its own script (`meta.name`), on
demand; ten codes always on the bar were noise, and pushed the tabs off it.
With the longest labels (Spanish, Arabic) the bar overlapped its tagline up to
~1110 px, so the compact menu takes over below 1112 px rather than 1080.

**Arabic is right to left, and three things make that work.** `index.jsx`
sets `<html dir="rtl">`, and the CSS uses logical properties
(`margin-inline-start`, `inset-inline-end`, `text-align: start`…) so the page
mirrors itself; a physical `left`/`right` is a bug unless it is a centring
`left: 50%` or a chart. Values inside sentences are wrapped in Unicode
isolates by `t()` and in `<bdi>` by `<Interpolate>`, or bidi reorders them
("15-minute city" reads "minute city-15", "2.6 M" reads "M 2.6"). Names and
figures that stand alone take `unicode-bidi: plaintext` from a list in
`global.css`: add a class there when a new one shows a Latin name or a
number. Icons that point along the text (`arrow`, the chevrons) carry
`.aa-icon--dir` and turn round. Charts and the ramps are not mirrored, so
axis arrows keep pointing the way values grow. Arabic uses Western digits
(`ar-u-nu-latn`), as every legend does, and `letter-spacing` is zeroed for it:
tracking breaks the joins of a cursive script.

**What stays in English, in every language**: the Atlas's name, platform and
dataset names, the postal address and the citations. City and country names
come from the catalogue, which carries English and Italian only. Blog posts
have no versions beyond English and Italian; the fallback copy is marked
`lang="en" dir="ltr"` (`postCopy` in `Blog.jsx`) so it is not laid out right
to left in Arabic, and each blog lede says the posts are in English and
Italian. Roboto and Instrument Serif have no CJK or Arabic glyphs: `tokens.css`
puts the system's faces behind them per language, and downloads nothing.
Numbers never appear in the dictionaries; they are formatted with `Intl` from
`src/data/*.js`, so `156,627` becomes `156.627` in Italian for free.

Italian role labels in `contact.roles` carry **a `M`/`F` key per gendered agent
noun** — `sapienzaPhdM` is "Dottorando", `sapienzaPhdF` "Dottoranda", and both
are "PhD student, Sapienza" in English, which does not inflect. `src/data/team.js`
says which form each person takes, and the team stated them: a name is not
evidence of anyone's gender, so a new member needs asking rather than guessing.
Japanese also leaves `city.explain.methods` in English; the other languages
translate it. Its nav labels are the short forms (持続可能な都市, 連絡先).

Roles whose Italian is invariable ("Assistente di ricerca") or names a function
("Amministrazione, senior") keep a single key.

## Regenerating things

```bash
npm run update:data        # import whatever changed in input_data/, then test:data, then offers stats
npm run stats              # recompute the statistics of every city whose data changed (--status, --force)
npm run import -- pov input_data/pov/zurich_pov.zip   # one export by hand (--dry-run, --city, --country …)
npm run shoot:previews     # platform-card stills, from the running site
```

`input_data/README.md` has the four export formats and the options. The
importers read the platforms' exports as they hand them over — P.O.V.'s two
GeoJSONs (the cartogram in EPSG:3857), CDI's city folder, 15minCity's
harmonised GeoJSON, CityChrone's zip of per-hour zips — straight from the zip.
`scripts/lib/zip.mjs` is a small reader for exactly that (stored and
deflated members, zip64), because Node has none. It reads the archive from
disk member by member, never whole: Node will not read a file past 2 GiB
into one buffer, and Rome's CityChrone export is 3.2 GB. For the same
reason the importer hands the 24 travel-time matrices to the writer as
readers, one hour in memory at a time.

`npm run build` also runs `scripts/postbuild-compress.mjs`, which writes
`<file>.gz` companions for every text-ish file in `dist/` above 4 KB.
Static hosts with `gzip_static on` (nginx) or `encode gzip` (Caddy) pick
them up automatically; GitHub Pages does its own on-the-fly gzip and
ignores them harmlessly. `npm run build:nogzip` skips the step.

**A pre-compressed file nothing serves is not compression.** The
companions shipped for a while with no server reading them: Vite's
preview is plain sirv, which sends a file whole whether or not its `.gz`
sits beside it, so `npm run preview` looked byte-for-byte like a build
with the step turned off. `aa-serve-precompressed` in `vite.config.js` is
`gzip_static` in fifteen lines, so preview now matches what nginx or Caddy
will do. It sets `Content-Type` explicitly (the file it opens ends in
`.gz`, so the type would otherwise sniff as gzip) and `Vary:
Accept-Encoding` (one URL, two encodings). If you measure compression,
measure a response, never a directory listing.

**The same companions shadow a staged file.** `smoke:published` stages a
catalogue by overwriting `dist/data/index.json`, and the preview kept
serving the build's `index.json.gz` beside it — so the suite read the real
catalogue and failed on every push without the staging ever being seen. It
moves the twin aside while staged now. Anything that edits a file in
`dist/` after the build has the same trap.

**Every published file is stored gzipped** and named that way in the
catalogue, because the Atlas is served from a machine where the size of the
data tree is the binding constraint. With the per-city layout, `public/data/`
went from 38.6 MB to 15.4 MB with Zurich's four layers added; everything but
CityChrone's travel times is under 3 MB.

**An import rebuilds what it cannot read, so it must not fail to read
quietly.** Every import is additive — the city is rebuilt from what is
already published plus the new layer, and its record is rewritten — and
every one of those starts by reading what is there. An earlier importer returned null for *any* failed read, so a file
truncated by an interrupted run looked the same as no file, and was answered
by writing a fresh one: a coverage file holding one city, which on the site
read as "importing one city deleted all the others". Only an absent file is
empty now; a file that is there but unreadable stops the run and says how to
put it back. `writeDataFile` renames a temporary file into place rather than
writing over the target, so an interrupted import cannot leave a truncated
file behind.

**A layer file is meaningless without the grid it was written against —
commit them together.** A layer's rows are grid positions. Adding 15minCity
to Rome grew the grid by the cells outside CDI's mask and rewrote every
layer against it; the commit carried the *new* files (`fifteen.json.gz`,
the CityChrone ones) and not the *rewritten* ones (`grid.json.gz`,
`index.json`). On the server, deployed from the working tree, Rome was
right; on GitHub Pages every 15minCity value sat on another cell — its
population correlated 0.10 with the grid's, against ~0.9 in Milan and
Zurich — and `test:data` passed, because every position still fell inside
the smaller grid. It was taken off (`npm run import -- 15mincity --remove
rome`) and re-imported from the export, which grew the grid to 11,685 cells
and rewrote every Rome layer, exactly the files the first commit lacked;
its population now correlates 0.74 with the grid's. The grid now
carries `id`, a hash of its cells, and every layer the `grid` it was
written for; the importer, `test:data` and the viewer (`checkGrid`) refuse a
mismatch, and Pages and `deploy.sh` run `test:data` before building.

**The grid is detected, never assumed — and centroid proximity cannot
detect it.** An H3 cell's centre coincides with the centre of its central
child, so a mesh on r9 matches r9, r10 and r11 centres equally well. Every
importer checks both: the centre within 10 m of an r9 cell centre **and** the
polygon within 10 m of that cell's own boundary (r9 gives a 0.0 m vertex
mismatch on a real export, r10 gives 138.7 m). An earlier importer hard-coded
`h3Resolution: null` with a comment claiming these exports are not H3 —
carried over from the *legacy letter-coded* Rome data, which is not. The
harmonised exports are, exactly.

**The mean of a cell's vertices is not its centre everywhere.** H3 cells
that cross an edge of its icosahedron come back from `cellToBoundary` with
seven or more vertices, the extra ones on one side, so the vertex mean sits
up to 28 m off the true centre. No European city is near such an edge;
Xiapu (Fujian) is, and a test that took the vertex mean as the centre failed
there on a correct cartogram. Measure from `cellToLatLng`. The P.O.V. and
CDI importers still locate a polygon's cell by `ringCentroid`, the vertex
mean, so an export from such a region may be refused as off the grid;
15minCity is spared only because its export states each cell's centroid.

**Imports gzip at level 6, not 9.** On a CityChrone matrix 9 took 5.3 s an
hour for 1% less than 6's 0.8 s. An import compares content, not bytes, so
files written at 9 are not rewritten for it.

**Where a city is, is derived from its centroid, not passed in.**
`scripts/lib/country.mjs` answers it from Natural Earth admin-0 1:50m,
vendored beside it as `countries.geojson.gz` (551 kB, stripped to `iso` /
`name` / `nameIt`, rounded to 3 dp) — a **build-time** asset the importer
reads and nothing ships. Natural Earth carries localised country names,
so `regionIt` comes from `NAME_IT` rather than a hand-kept table that
would drift from the English.

**A city centroid is not reliably inside its own country.** Stockholm's
sits 3.9 km off Sweden's drawn coast — the archipelago is below 1:50m —
and New York's 3 km off, so plain point-in-polygon answers "nowhere" for
two obviously-placed cities. The lookup is containment first, then the
nearest boundary within 25 km, and past that it returns null and warns
rather than handing an ocean point to whichever country is nearest. The
importer prints which happened, because the nearest-coast case is the one
that can be wrong.

The lookup only runs for a city the catalogue does not know. A known city
keeps its names and region, because several were written by hand ("United
States", not Natural Earth's "United States of America") and a new layer
should not rename a city. `--name`, `--name-it`, `--country`, `--region`,
`--region-it` override.

**MapLibre 6 has no Equal Earth**, which is why the world maps are not
MapLibre (see "The front door"). `createProjectionFromName` registers
exactly `mercator`, `globe` and `vertical-perspective`; the style spec's
projection type takes those names or a zoom interpolation between them,
not an arbitrary projection. Pre-projecting the GeoJSON and feeding
MapLibre the result as lon/lat is the trap: every geographic operation
downstream would keep working and quietly give wrong positions.

**Git already stores every blob zlib-compressed**, so gzipping does not
shrink the *repository* much, and it costs delta compression, since a
re-import rewrites the whole gzip stream. What it shrinks is the tree on the
server's disk, which is the reason it is on.

Two consequences that bite silently:

- **Everything that reads published data goes through
  `scripts/lib/datafile.mjs`** (`readDataJSON` / `readDataBuffer` /
  `writeDataFile`). `fs.readFileSync` on a catalogue path is a bug — it will
  hand you gzip bytes. So is `fs.statSync`: `test-data.mjs` once checked
  CityChrone's matrices were at least `cells²` bytes *on disk*, which a
  compressed matrix is not, so 24 good files read as truncated. It reads
  the decoded size from the gzip trailer (ISIZE) and the `.npy` header from
  the first few kB instead, and never decodes a matrix whole: doing that for
  Rome's 24 (130 MB each) was most of the suite's run time.
- **`.gz` is a transport wrapper, not a format.** `formatFor` in
  `map/loaders.js` strips it before deciding, or a compressed
  `times00.npy` would be parsed as GeoJSON. The grid and layer files are
  plain JSON, not GeoJSON, and are loaded with an explicit `format: 'json'`.

**Who decompresses is not the app's business to assume, and assuming it
broke the deployed site.** Storing the tree gzipped was verified against
the dev and preview servers, which set `Content-Encoding: gzip` — so the
browser decoded before the loaders saw anything, and every check passed.
GitHub Pages, which is what `/` actually deploys to, serves a `.gz` as an
opaque `application/gzip` download with no such header and cannot be
configured otherwise. Every layer went to "The published mesh could not
be loaded" the moment it shipped, because `response.json()` was handed
gzip bytes.

`fetchDecoded` in `map/loaders.js` now sniffs the gzip magic number
(`1f 8b`) on the body and decompresses with `DecompressionStream` when
it is still compressed. Two bytes is unambiguous here — JSON starts `{`
or `[`, a `.npy` starts `\x93NUMPY` — and it deliberately does *not*
consult `Content-Encoding`, which the fetch spec lets the browser strip
once it has decoded. So the same file works on a configured server and on
a host that has never heard of it. Test any change to this against a host
that does **not** set the header; `npm run preview` does set it and will
tell you everything is fine.

The catalogue names the `.gz` **explicitly** rather than letting the
server rewrite `.geojson` → `.geojson.gz`. A rewrite is tidier, and it is
the wrong trade here: a server that has not been configured for it would
404, and a 404 under the SPA fallback is `index.html` with HTTP 200,
which the data layer reads as "not published" and silently answers with
seed data. Naming the real file makes a misconfigured server fail loudly
at `JSON.parse` instead. The nginx block for it is in the README; without
it the browser gets gzip bytes labelled `application/gzip`.

The upstream repos are inputs, not dependencies — nothing at runtime reaches
back to them. `mat701/CDI` and `mat701/accessibility-pov` are public and can be
cloned directly; `add_repo` refuses them when the session is scoped to a
different owner.

## CityChrone

The fourth platform, published for Milan and Zurich and rendered **only
through the combined viewer** — it has no `/platforms/citychrone/:cityId` page; its
landing map routes city clicks to `/atlas/:cityId?layer=citychrone`.

- **The paper** — Biazzo, Monechi & Loreto, *General scores for accessibility
  and inequality measures in urban areas*, R. Soc. Open Sci. 6(8) 190979
  (2019), `doi:10.1098/rsos.190979` — defines both scores and the isochrone
  method; it is tagged to this platform on the Research page.
- **The export is hourly**: 24 hexcover FeatureCollections (per-cell
  `v_score`/`s_score`) plus 24 `times*.npy` matrices (uint8 minutes, row =
  origin cell). Published, all 24 hours of scores are one layer file, so the
  hour selector recomputes rather than fetches; the matrices stay one file
  per hour (`hourly.times`, a `{hh}` template), fetched only for isochrones
  and stored in grid order. Hourly values are joined onto the mesh as
  MapLibre feature-state at runtime, never baked into the features. The
  isochrone origin in the URL (`from=`) is a layer row, i.e. grid order.
- Its card still is shot from the combined viewer's CityChrone layer
  (`scripts/shoot-previews.mjs`).

## CityChat (beta)

`/citychat` is a chat over the published data; the service is
`server/citychat/` and its README has the configuration, the deploy and the
model choices. The site's rule applies to it unchanged, and the design
follows from that:

- **The model states no figure it was not handed.** It calls tools
  (`tools.mjs`) that run `grid.js` and `adapters.js` over `public/data/`, so
  the chat and the map compute every figure with the same code. `numbers.mjs`
  then checks each number in an answer against the tool results, the site
  copy and the conversation; one correction round, and whatever survives is
  shown to the reader as possibly wrong. It matches values, not meanings: a
  rounded figure equal to some *other* figure in the results passes. Do not
  describe it as proof.
- **What it knows is the site's own copy.** `knowledge.mjs` puts the English
  `city.explain.*`, platform and FAQ strings and the four layer posts in the
  system prompt, plus the rules from "Facts that are easy to get wrong"
  above. New copy reaches the chat for free; a correction to a measure's
  description belongs in the dictionary, not in the prompt.
- **The provider is one environment variable.** `llm/` has Gemini (native
  API, default) and any OpenAI-compatible server, which covers vLLM,
  llama.cpp, Ollama and most hosted APIs. Gemini's newer models refuse a
  follow-up that drops the thought signatures on their function calls, so
  the adapter replays the model's own parts verbatim: do not rebuild them.
- **It is configured with a list of models, not a model** (`CITYCHAT_MODEL`,
  default `auto`: every Flash the key can call, newest first, from the
  API's own model list). A 429, 404, 403, 5xx or timeout hands the turn to
  the next model, which starts it **over**: another model refuses the first
  one's thought signatures, which is also why `gemini.mjs` replays `raw`
  only when it carries its own model name. A failed model rests for as long
  as the 429 said (`llm/chain.mjs`). A 400 is never retried elsewhere.
- **No answer is timed out for being long.** Every model call streams, and
  the deadline is on silence (`postSSE`): 90 s for the first byte, which is
  the model's thinking time, then 120 s between chunks. A non-streamed call
  with one deadline on the whole cut off exactly the answers that took the
  most work. The service also writes a `ping` line every 10 s so no proxy
  closes the page's connection.
- **The answer streams as a draft, and the page says so.** `draft` events
  carry the text as it is written; the page shows it under "Figures being
  checked" and replaces it with the answer event, the checked text. A tool
  call or a correction round drops the draft. Keep the mark: a draft is the
  text the figure check has not seen yet, so it may show a figure the
  answer will not.
- **A local model is one more segment of the chain** (`CITYCHAT_LOCAL_URL`,
  `CITYCHAT_LOCAL_MODEL`): last resort by default, first with
  `CITYCHAT_LOCAL_FIRST=1`, alone with no Gemini key. `deploy/compose.yaml`
  runs it with Ollama. The system prompt puts what never changes first,
  because local servers cache a prompt by its prefix: a persona ahead of the
  copy made every change of persona re-read ~7,500 tokens, minutes on a CPU.
  Ollama's default context is shorter than that prompt and cuts it from the
  front, where the rules are, without an error; `compose.yaml` raises it.
- **The static site does not depend on it.** A build talks to the service
  only when built with `VITE_CITYCHAT=1` (always in `npm run dev`); without
  it the tab says CityChat is not enabled and sends nothing, which is what
  the CI build and GitHub Pages get, and what `smoke.mjs` asserts. With it,
  the tab probes `<base>api/citychat/health` and accepts only JSON with `ok`
  (the SPA fallback answers a missing service with index.html and a 200),
  and a chat response counts only if it is NDJSON. `vite preview` proxies to
  the service only with `CITYCHAT_PREVIEW=1`: a proxy with nothing behind it
  answers 500.
- **`?cell=<h3>` on the city view** selects that cell and frames the ground
  around it. It is how the chat's "show on map" buttons land, and works for
  any link.

The nav gained a tab with it, and the tabs only fit above 1240 px with the
closer spacing in `Nav.css`; below that the drawer takes over (main's sweep
put it at 1112 px before the tab). Spanish, Portuguese, Arabic and Japanese
are wider still, up to ~1340 px, and there the tagline ends in an ellipsis
rather than running under the first tab: a drawer at 1340 px for every
language would have hidden the tabs on ordinary laptops.

## Open, and needing the lab rather than more code
- **The Italian is a first draft** and wants a native review. So do the
  other eight translations, which were machine-drafted; Arabic most of all,
  since it also tests the right-to-left layout.
- **One DOI is missing** — "Compact 15-minute cities exhibit lower carbon
  intensity in urban transport" (Cities 176, 107202). Elsevier DOIs embed a
  year that cannot be derived from the citation, so it is left blank rather
  than guessed.
- **Editorial figures that cannot be computed**: team headcount, contact
  addresses, and the dates on the home page news items all came from the design
  mock.
- **`CC BY-NC` on the data.** NC blocks commercial journalists, consultancies
  advising cities, and anyone building a product. If the goal is reach, this is
  worth revisiting with the lab.
