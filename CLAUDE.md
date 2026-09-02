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

A city can be published on **two geometries**. The values sit on one — a
population-scaled cartogram for P.O.V. and Car Dependency, true hexagons for
15minCity and the atlas union meshes — and a companion file carries the other
for the same cells, joined by the index it states (`{ "i": n }`) rather than
by position. The catalogue says which is which (`geometry`, `geoDataset`,
`cartograms`), and the viewer offers the switch exactly where a companion
exists. `withGeometry` in `adapters.js` re-draws the loaded features onto the
other geometry, keeping each feature's id so highlights and feature-state do
not notice.

**Geographic geometry is derived, and checked.** Every published cell sits on
the standard H3 grid and the cartogram preserves its centroid, so the hexagon
is recoverable — and `build-data.mjs` checks the derived hexagons against the
ones CDI publishes in `hexes.geojson`, which they reproduce exactly.

**Cartograms come from two places, and the catalogue says which.** P.O.V. and
Car Dependency publish theirs. 15minCity and CityChrone publish none, so
`build-atlas.mjs` derives one by a rule it states: a cell keeps its centre and
its shape, and its **area is proportional to its resident population**,
reaching the full hexagon at the city's median cell population. The median is
not arbitrary — it is where the rule best reproduces the two published
cartograms, which it matches to ~12 m on a ~200 m cell, and `build-atlas.mjs`
fails if that drifts past 25 m. `cartogramSource` / `cartogramSources` mark a
cartogram as `published` or `derived`, and the UI says which one is on screen.
No layer reuses another's: even the two published ones disagree by up to 9.6 m
on cells they share, on a 9–201 m range.

Per-platform **summary files** (`<platform>/summary.json`, declared as
`summary` beside `coverage`) carry one row per city for the compare view at
`/platforms/:slug/compare`. They are written by `build:data` from the features
it just published, so the table and the city pages cannot disagree.

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

**There is one city view, and it is that page.** The per-platform city pages
were removed: everything they did, the combined viewer does on any published
city, and keeping four screens meant four places for the same measure to be
described differently. `/platforms/:slug/:cityId` still resolves — it
redirects to `/atlas/:cityId?layer=<platform>` — and `/platforms/:slug/compare`
is untouched. The cell-level scatter went with those pages; the compare
view's city-level scatter did not.

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
  `cell_type` for all 47,902 published cells. `build-data.mjs` re-derives every
  cell and throws if it disagrees.
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
`vite.config.js`); the datasets it points at still cache freely. If a symptom
is "the deployed site disagrees with `public/data/`", suspect the cache before
the code.

**The seed data reproduces the real Rome figures.** The generated mesh was
calibrated to match 8,089 cells and 12.9/2.7/1.4/83.0. Any test that checks
those values passes whether the real file loaded or not. Tests on this data
path must assert **provenance** (which URL was requested, `source === 'published'`),
not values.

**`pkill -f "vite preview"` kills the calling shell** (exit 144). Expected, not
a failure.

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
the figures the copy quotes, that each geometry companion joins to a cell
centred within 10 m of it, and that each `atlas/` union mesh reconciles —
same counts, same shares, same weighted CDI — with the per-platform files it
was built from. Run it after any data change — it catches in seconds what the
browser suites take minutes to reach.

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
both. `ATLAS_METRICS` in `src/data/home.js` is still derived and still correct
— nothing renders it, and putting it back is one block of JSX. What is in the
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

**The coverage frame has a floor: every published city stays in it.** The
longitude span is `360 / 2^WORLD_ZOOM_BOOST` at any width, so the arithmetic
is exact — Seattle at −122.3° to Stockholm at +18.0° needs 140.3°, the boost
gives 173.9°, and the centre sits at −40° (the middle of the *data*, not of
the world). Past ~1.15 the west coast goes over the edge. `smoke.mjs`
reprojects the published coverage and fails if any marker lands outside.

**A world view must re-apply its centre with its zoom** (`applyWorldWidthZoom`).
MapLibre clamps the centre latitude so a viewport cannot show past the poles,
and at the construction zoom the whole world is barely taller than the box —
the clamp there is about ±18.6°. A map given `center: [-40, 47]` was quietly
pulled to 19°N and never let back when `setZoom` arrived, which is a bug
nothing else could see: the map rendered, had markers, and passed every other
check. The smoke suite now hovers the pixel a known city projects to, which
pins centre and zoom together.

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
`/atlas/:cityId` — end up with a second WebGL context drawing nothing behind
an opaque one, so the backdrop does go; but dropping it the moment the URL
changed emptied the frame while the new map was still being built, and the
world left and came back on a step that is meant to be one world throughout.
So a covering map reports itself once it has painted (`useCoversBackdrop` in
`src/map/backdrop.js`, passed as `coversBackdrop` to `AtlasMap`) and only then
is the backdrop let go — hidden with `visibility`, not unmounted, so stepping
back out returns the same map instead of building a second one, and the box
stays measurable so the world-width fit survives a resize it cannot see. The
veil goes earlier, on the route, so what the incoming map fades up over is the
bare world it is about to be. Opening the site straight onto one of those two
screens still builds one context, not two: the backdrop is created the first
time a page actually wants it. `smoke.mjs` asserts both halves — the world
holds through the handover, and the map that comes back is the one that left.

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

Three tabs exist mostly to be filled in: `/sustainable-cities` says who the
group is, `/stats` says the all-city comparison is not built and links the two
per-platform ones that are, and `/consulting` gives an address. They share
`Prose.css`.

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

- **The summary describes the layer, not the mesh.** Its cell count and area
  are the layer's own mask — 1,636 cells over 170 km² for Milan's P.O.V., not
  the union's 7,637 — because the count beside a figure has to be the count
  that figure came from. Area comes from `meshFromAtlas`, measured on the
  union mesh's true hexagons, and is omitted for a legacy city whose mesh is a
  cartogram: a cartogram's polygons are a population, not a place.
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

`src/i18n/en.js` and `it.js` must keep an identical key shape — `t()` warns on
missing keys in development, and the smoke suite fails if a locale drifts.
Numbers never appear in the dictionaries; they are formatted with `Intl` from
`src/data/*.js`, so `156,627` becomes `156.627` in Italian for free.

Italian role labels in `contact.roles` carry **a `M`/`F` key per gendered agent
noun** — `sapienzaPhdM` is "Dottorando", `sapienzaPhdF` "Dottoranda", and both
are "PhD student, Sapienza" in English, which does not inflect. `src/data/team.js`
says which form each person takes, and the team stated them: a name is not
evidence of anyone's gender, so a new member needs asking rather than guessing.
Roles whose Italian is invariable ("Assistente di ricerca") or names a function
("Amministrazione, senior") keep a single key.

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
