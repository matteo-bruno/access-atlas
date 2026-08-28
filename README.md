# Access Atlas

An atlas of how cities give access — the public site for the Sustainable Cities
team's research at **Sony CSL Rome**.

It brings four open research platforms under one identity:

| Platform                       | Measures                                                  | Published here |
| ------------------------------ | --------------------------------------------------------- | -------------- |
| **15min-City**                 | Proximity — travel time to ten categories of service       | Milan |
| **CityChrone++**               | Opportunity — hourly transit scores and isochrones         | Milan |
| **Car Dependency Index**       | Comparison — opportunity by car against by transit         | 22 datasets |
| **Urban Accessibility P.O.V.** | Synthesis — Proximity × Opportunity, four zones of access  | 18 cities |

Milan is published on one shared H3 grid across all four platforms, and the
**combined viewer** (`/atlas/milan`) reads them as switchable layers of a
single mesh.

"Published here" counts what is in `public/data/`, not the coverage of the
upstream research platforms.

React + Vite, MapLibre for the maps, bilingual EN/IT.

**Node 20 or newer** — the scripts are ES modules and CI builds on Node 22. On
an older Node the `.mjs` files are parsed as CommonJS and die on their first
`import` with a bare `SyntaxError: Unexpected identifier`; `npm run` checks the
version first and says so instead.

```bash
nvm use 22           # or any Node ≥ 20
npm install
npm run dev          # http://localhost:5173
npm run build        # → dist/
npm run preview
```

The scripts that drive a browser — `smoke`, `smoke:published`,
`shoot:previews` — also need Playwright, which is deliberately *not* a
dependency:

```bash
npm install --no-save playwright && npx playwright install chromium
```

## Status

**All four platforms render measurements.** 42 city datasets — 153,987 cells —
are published under `public/data/` and validated on every push. Cities the
catalogue does not list still fall back to generated stand-ins labelled as
illustrative; [`public/data/README.md`](public/data/README.md) documents the
catalogue that decides which is which.

Outstanding before launch:

- **The Italian is a first draft** and needs a native review (`src/i18n/it.js`).
- **Some editorial figures need the lab's confirmation** — the team headcount,
  the contact addresses, and the dates on the home page's news items.
- **The licence below needs confirming** with the lab.

## Screens

| Route                      | Screen |
| -------------------------- | ------ |
| `/`                        | Home — hero, metrics, coverage map, four platforms, table, quote, side projects |
| `/platforms/:slug`         | Platform landing — full-bleed world map, welcome card, legend, city search |
| `/platforms/:slug/:cityId` | City detail — P.O.V. zones, Car Dependency bands, or 15minCity's category/mode selectors |
| `/atlas/:cityId`           | Combined viewer — one mesh, all four platforms as switchable layers; state in the query string |
| `/research`                | Papers, datasets, citation |
| `/blog`, `/blog/:slug`     | Long-form writing |
| `/work-with-us`            | Open positions, PhD / thesis / internship routes |
| `/faq`                     | Six questions |
| `/contact`                 | Team, address, collaboration |

Platform slugs: `15min-city`, `citychrone`, `car-dependency-index`,
`accessibility-pov`.

## Layout

```
src/
  map/          MapLibre wrapper (AtlasMap), style construction, layer paint,
                GeoJSON + shapefile loaders
  data/         Platform definitions, seed cities, hex-mesh generator, content
  workers/      Off-main-thread compute + the hook that drives it
  i18n/         en.js · it.js · provider (t() and Intl number formatting)
  components/   Nav, Footer, Subhead, Logo, Icon, map layers
  pages/        One file per screen, each with its own stylesheet
  styles/       Design tokens + shared primitives
public/data/    Drop real datasets here — see public/data/README.md
scripts/        Data build + browser and data test suites
design/         The original Claude Design handoff — see below
```

## Maps

**World maps** draw the Atlas's own basemap: a paper background, a graticule
and simplified Natural Earth land polygons bundled at
`public/data/world-land.geojson`. No tile server, no API key, works offline,
and it matches the design's palette exactly.

**City maps** draw a real basemap underneath instead — [OpenFreeMap][ofm]'s
Positron, muted toward the paper palette. Natural Earth 110m has nothing to say
at city zoom, so without it a cell mesh floats on a blank field with no streets
or place names to locate it against. OpenFreeMap serves vector tiles with no
API key and no account, which is what the rest of this repository assumes;
attribution travels inside the style and is rendered by MapLibre's own control,
as the licence requires.

Data layers are inserted *below* the basemap's first symbol layer, so place
names stay readable above the mesh rather than under it.

```bash
VITE_BASEMAP_STYLE=none                    # no third-party basemap anywhere
VITE_BASEMAP_STYLE=https://…/style.json    # a different provider
VITE_BASE=/access-atlas/                   # serve from a sub-path
```

The deploy workflow sets `VITE_BASEMAP_STYLE` explicitly, so switching provider
or turning the basemap off for the published site is a one-line change in
`.github/workflows/pages.yml`. **CI builds with `VITE_BASEMAP_STYLE=none`**: the
browser suites assert on console and network errors, and a test that fails when
a third-party host is unreachable is testing that host. Build the same way
before running the suites locally. Reshooting the platform card stills is the
opposite case: build with the basemap **on** (the default), or the cards come
out on blank paper.

The style is fetched before the map is constructed. A host that is slow,
blocked or down therefore falls back to the paper basemap rather than leaving
the map with no style at all — and so with no data layers, since children mount
only once a style has loaded.

[ofm]: https://openfreemap.org

Layers are declarative — `<AtlasMap>` owns the map, `<GeoJSONLayer>` children
add a source and a layer and keep them in sync with props. A platform's colours,
scale and the property it paints by all come from its entry in
`src/data/platforms.js`, so adding a fifth platform needs no new component code.

> **maplibre-gl v6 note.** v6 finds its worker with
> `new URL('./maplibre-gl-worker.mjs', import.meta.url)`, which resolves beside
> the *bundled* chunk — a path Vite doesn't emit. `src/map/AtlasMap.jsx` imports
> it with `?worker&url` and calls `setWorkerUrl()`; `vite.config.js` sets
> `worker.format: 'es'`. Without both, the worker 404s (behind an SPA fallback
> it silently loads `index.html` instead) and every map hangs blank with its
> style stuck loading. Keep them together if you upgrade.

## Background computation

`src/workers/mesh.worker.js` builds Rome's ~8,000-hexagon mesh, classifies it
into P.O.V. zones and computes the summary statistics and scatter sample off the
main thread; `useCityMesh` drives it and falls back to inline computation where
Workers are unavailable. This is the seam for the heavier work to come —
isochrones, scenario runs, CDI recomputation. Keep `buildCityMesh` a pure
function of its arguments and it can move between contexts freely.

## Language

EN and IT ship in `src/i18n/`. The dictionaries share a key shape; `t()` falls
back to English and warns in development when a key is missing. Numbers are
never written into the copy — they are formatted with `Intl` from the active
locale, so `10,142` becomes `10.142` in Italian. The choice persists to
`localStorage` and sets `<html lang>`.

## Deployment

A static build; `dist/` can be served by anything. Two requirements:

- **SPA fallback.** Deep links like `/platforms/citychrone` must serve
  `index.html`. On Netlify/Vercel this is the default; on nginx use
  `try_files $uri /index.html`. `vite build` also emits `dist/404.html` as a
  copy of the shell, which is how static hosts without a rewrite rule —
  GitHub Pages among them — end up serving the router for an unknown path.
  Note the tradeoff: on such a host a deep link renders correctly but carries
  an HTTP 404 *status*, since the host has no way to know the router resolved
  it. Anything that reads the status rather than the page — crawlers, uptime
  checks, link checkers — will see a 404. A host with a real rewrite rule, or
  pre-rendering the routes, is the way out if that matters.
- **Sub-path hosting.** Set `VITE_BASE=/your-path/` at build time.

### GitHub Pages

`.github/workflows/pages.yml` builds the site with `VITE_BASE` set to the
repository name and deploys `dist/`. It only takes effect once **Settings →
Pages → Source** is set to **GitHub Actions** — the default "Deploy from a
branch" publishes the repository source instead, which serves an `index.html`
pointing at `/src/main.jsx` and renders a blank page.

## Verification

`scripts/smoke.mjs` loads every route in a real browser and checks the pages
render without console or network errors, the maps rasterise, the Rome mesh
matches its published figures, search navigates, and EN ⇄ IT swaps copy and
number formatting. Playwright is intentionally not a project dependency:

```bash
npm install --no-save playwright && npx playwright install chromium
npm run build
npm run preview -- --port 4321 &
SMOKE_URL=http://localhost:4321 npm run smoke
```

That suite runs against whatever is published. `npm run smoke:published`
covers the fallback machinery from the other side: it stages a dataset in the
upstream schema, asserts the Atlas reads it instead of the seed, and removes it
again. `npm run test:data` needs no browser at all — it runs the real adapters
over every file in `public/data/` and fails on a malformed one in seconds. All
three run in CI — see `.github/workflows/ci.yml`.

## Data

The Atlas renders published data when `public/data/index.json` lists it and
generated seed data when it does not, one city at a time. The catalogue format,
the upstream schemas for each platform, and the provider seam a scenario
backend would plug into are documented in `public/data/README.md`.

## Design provenance

`design/` holds the original Claude Design handoff this site was built from —
the HTML/JS prototypes (`design/project/`), the conversation that produced them
(`design/chats/`), and the agent brief (`design/HANDOFF.md`). The implemented
direction is **B, "Cartographic Index" (smoothed)**, in
`design/project/direction-b.jsx`. Direction A was not chosen.

Three deliberate departures from the artboards:

- **Home coverage map is 400 px tall, not 280.** The design's illustration
  compressed the globe; a real Mercator map at page width needs the extra height
  to show the same span, Helsinki to Melbourne.
- **Cartogram caption reads "H3 resolution 9 · ~186 m cells"**, derived from the
  mesh rather than the design's hard-coded "resolution 10 · scale 1:80 000" —
  8,089 cells over Rome is resolution 9, and shipping a wrong number in a
  research context seemed worse than editing the caption.
- **`/research` had no artboard.** The nav has always listed it, so rather than
  leave a dead link the page is assembled only from existing design patterns.

Everything else keeps the design's dimensions, tokens and type scale. Footer
link columns other than Platforms don't navigate — matching the design, which
renders them as plain labels; they are ready for hrefs.

## Assets

Sony CSL marks in `src/assets/logos/` are the originals supplied with the
handoff. `<Logo>` exposes `symbol` / `horizontal` / `twoLine` in `color`, `dark`
and `light` — the nav and footer use the colour symbol; the others are wired up
and ready for dark backgrounds and print.

## Licence

Code under **MIT** (see [LICENSE](LICENSE)); data and maps under
**CC BY-NC 4.0**, matching what the site itself states in its FAQ and footer.

⚠️ Added to match the design copy — **confirm with the lab before publishing.**
