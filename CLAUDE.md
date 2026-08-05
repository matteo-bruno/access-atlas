# Working on the Access Atlas

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

`src/data/home.js` regenerates its figures from `npm run build:data`, which
prints the counts to paste in. Don't hand-edit them.

## The data layer

One idea to understand: **the catalogue decides whether the Atlas draws
measurements or seed data**, per city, per platform.

```
public/data/index.json        catalogue — what is actually published
src/data/catalogue.js         parsing + normalising it
src/data/sources.js           the provider: where data comes from
src/data/adapters.js          published files → the shapes the UI consumes
src/data/useAtlasData.js      React bindings (coverage, profile, city pages)
src/data/useAtlasView.js      React bindings for the combined viewer
src/workers/useCityMesh.js    published-first, seed fallback
scripts/build-atlas.mjs       offline: joins platform files → atlas/ union meshes
```

Anything the catalogue does not list falls back to generated seed data
(`src/data/cities.js`, `src/data/mesh.js`), so the site works on a fresh
checkout. Fetching goes through a **provider** — returning `null` means "not
published", throwing means "this provider failed", and both fall back. A future
scenario backend is a second provider installed with `setDataProvider()`; no
caller changes.

Adding a city is a file copy plus a catalogue entry. That is the whole design.

## The grids — read this before touching the combined viewer

**Target state: one standard H3 grid per city, shared by every platform.**
Harmonisation happens **offline**, in the export pipeline, not in the app.
The app's job is to render whatever grid the catalogue describes — it does not
reproject, resample or reconcile anything.

**Milan is harmonised, and the combined viewer ships.** Verified by H3 index
(not centroid rounding — `scripts/build-atlas.mjs` refuses any centroid more
than 10 m off an H3 r9 cell centre): all four platforms sit on one grid, with
nested masks — 15minCity covers 7,498 cells (the whole metro), Car Dependency
and CityChrone an *identical* 1,741, P.O.V. a strict subset at 1,636.
`build-atlas.mjs` joins them into `public/data/atlas/milan.geojson` (7,637
union cells) and `/atlas/:cityId` repaints that one mesh per layer. Rerun
`npm run build:atlas` after changing any Milan file — the union is derived,
and `test:data` fails if it drifts from the per-platform files.

Rome is the legacy state and shows what it costs. Measured cell by cell:

| Platform | Rome cells | Grid |
| --- | --- | --- |
| P.O.V. | 8,089 | same H3 grid as CDI — 99.8% of its cells sit on a CDI cell |
| Car Dependency | 11,409 | same grid, wider urban mask |
| 15minCity (retired) | 11,879 | **a different tiling** — ~8% overlap, i.e. chance |

**Both paths live in `src/pages/AtlasCityPage.jsx` from day one.** A city with
an `atlas` catalogue entry loads one union mesh and repaints; a city without
one swaps per-platform meshes. Do not assume one city implies one mesh; ask
the catalogue.

A practical check when new data arrives: map both platforms' cell centroids to
H3 at the claimed resolution and compare the sets (`build-atlas.mjs` does this
with a hard 10 m tolerance). Above ~99% overlap of the tighter mask means one
grid; single digits means two.

**The `cell` field is per-city and must stay honest.** `h3Resolution` is
`null` for meshes we cannot confirm are H3 — the legacy 15minCity Rome data is
one, and its map caption states the measured cell size (~201 m) without naming
a grid. Cities exported onto the standard H3 grid should set the resolution.
The build script no longer infers it from cell radius; an earlier version did,
and was wrong.

## Facts that are easy to get wrong

- **CDI = (O_car − O_PT) / (O_car + O_PT)**, bounded in [−1, +1]. A normalised
  difference, *not* a ratio. The site once scaled it 1.5–6 and described it as
  "how many more places a car reaches" — a quantity the index does not measure.
- **P.O.V. zone thresholds are population-weighted medians**, not plain
  medians. Verified: classifying against them reproduces the upstream
  `cell_type` for all 47,902 published cells. `build-data.mjs` re-derives every
  cell and throws if it disagrees.
- **Zones compare places within a city, not between cities** — thresholds are
  city-specific. The underlying scores are what compare across cities.
- **The cartograms are population-scaled.** Cells sit in true positions; their
  *area* encodes population. Cell geometry therefore cannot be measured from
  the file and comes from the catalogue's `cell` field.
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

**The seed data reproduces the real Rome figures.** The generated mesh was
calibrated to match 8,089 cells and 12.9/2.7/1.4/83.0. Any test that checks
those values passes whether the real file loaded or not. Tests on this data
path must assert **provenance** (which URL was requested, `source === 'published'`),
not values.

**`pkill -f "vite preview"` kills the calling shell** (exit 144). Expected, not
a failure.

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

`test:data` runs the real adapters over every published dataset (all 24
CityChrone hours included) and checks shares sum to 100, no CDI outside
[−1, +1], every 15minCity category × mode present, that Rome still reports
the figures the copy quotes, and that each `atlas/` union mesh reconciles —
same counts, same shares, same weighted CDI — with the per-platform files it
was built from. Run it after any data change — it catches in seconds what the
browser suites take minutes to reach.

Playwright is deliberately **not** a dependency; CI installs it on the fly.
Locally: `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`.

## Copy and i18n

`src/i18n/en.js` and `it.js` must keep an identical key shape — `t()` warns on
missing keys in development, and the smoke suite fails if a locale drifts.
Numbers never appear in the dictionaries; they are formatted with `Intl` from
`src/data/*.js`, so `156,627` becomes `156.627` in Italian for free.

Italian role labels in `contact.roles` name the **function** ("Dottorato",
"Ricerca associata") rather than the person. Italian agent nouns agree in
gender and a shared translation key cannot know anyone's — naming the function
avoids guessing rather than defaulting to masculine forms.

## Regenerating things

```bash
npm run build:data -- --pov ../accessibility-pov --cdi ../CDI --fifteen ../15mincity
npm run build:atlas        # union meshes + fifteen/citychrone catalogue entries
npm run shoot:previews     # platform-card stills, from the running site
```

The upstream repos are inputs, not dependencies — nothing at runtime reaches
back to them. `mat701/CDI` and `mat701/accessibility-pov` are public and can be
cloned directly; `add_repo` refuses them when the session is scoped to a
different owner.

## CityChrone

The fourth platform, published for Milan and rendered **only through the
combined viewer** — it has no `/platforms/citychrone/:cityId` page; its
landing map routes city clicks to `/atlas/:cityId?layer=citychrone`.

- **The paper** — Biazzo, Monechi & Loreto, *General scores for accessibility
  and inequality measures in urban areas*, R. Soc. Open Sci. 6(8) 190979
  (2019), `doi:10.1098/rsos.190979` — defines both scores and the isochrone
  method; it is tagged to this platform on the Research page.
- **The published form is hourly**: 24 hexcover FeatureCollections (per-cell
  `v_score`/`s_score`) plus 24 `times*.npy` matrices (uint8 minutes, row =
  origin cell). The catalogue's `hourly` entry describes them as `{hh}` path
  templates; hourly values are joined onto the mesh as MapLibre feature-state
  at runtime, never baked into a GeoJSON.
- Its card still is shot from the combined viewer's CityChrone layer
  (`scripts/shoot-previews.mjs`).

## Open, and needing the lab rather than more code
- **The Italian is a first draft** and wants a native review.
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
