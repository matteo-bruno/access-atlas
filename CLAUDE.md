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
src/workers/useCityMesh.js    published-first, seed fallback
```

Anything the catalogue does not list falls back to generated seed data
(`src/data/cities.js`, `src/data/mesh.js`), so the site works on a fresh
checkout. Fetching goes through a **provider** — returning `null` means "not
published", throwing means "this provider failed", and both fall back. A future
scenario backend is a second provider installed with `setDataProvider()`; no
caller changes.

Adding a city is a file copy plus a catalogue entry. That is the whole design.

## The grids — read this before building the unified viewer

Three platforms publish Rome. They do **not** share one mesh:

| Platform | Rome cells | Grid |
| --- | --- | --- |
| P.O.V. | 8,089 | same H3 grid as CDI (99.8% of its cells sit on a CDI cell) |
| Car Dependency | 11,409 | same grid, wider urban mask |
| 15minCity | 11,879 | **a different tiling** — ~8% overlap, i.e. coincidental |

So P.O.V. and CDI can share one loaded mesh and switch by repainting. 15minCity
cannot — switching to it means swapping the mesh. A viewer that toggles
visualisations has to treat "same grid, different layer" and "different grid"
as two distinct cases.

**Unverified:** `scripts/build-data.mjs` records `h3Resolution: 9` for
15minCity, inferred from its ~201 m cell radius. The non-alignment above
suggests it is not H3 at all. The Rome 15minCity page currently captions "H3
resolution 9" — confirm with the team before trusting it.

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
- **15minCity's letter codes**: the legacy `script.php` contains two conflicting
  letter→category tables. The live one is in `src/data/fifteen.js` (`d` is
  Healthcare, not Supplies). Do not take a letter's meaning from that file.

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

`test:data` runs the real adapters over all 41 datasets and checks shares sum
to 100, no CDI outside [−1, +1], every 15minCity category × mode present, and
that Rome still reports the figures the copy quotes. Run it after any data
change — it catches in seconds what the browser suites take minutes to reach.

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
npm run shoot:previews     # platform-card stills, from the running site
```

The upstream repos are inputs, not dependencies — nothing at runtime reaches
back to them. `mat701/CDI` and `mat701/accessibility-pov` are public and can be
cloned directly; `add_repo` refuses them when the session is scoped to a
different owner.

## Open, and needing the lab rather than more code

- **CityChrone has no published data and no paper.** Both are marked pending
  rather than filled with a guess.
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
