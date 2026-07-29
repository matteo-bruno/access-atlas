# Access Atlas

The Sustainable Cities team's Atlas of urban access — Sony CSL Rome.

Implementation of the approved **Direction B, "Cartographic Index" (smoothed)**
design from the Claude Design handoff in `../project/`. React + Vite, MapLibre
for the maps, bilingual EN/IT.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # → dist/
npm run preview
```

## Screens

| Route                             | Screen                                        |
| --------------------------------- | --------------------------------------------- |
| `/`                               | Home — hero, metrics, coverage map, four platforms, table, quote, side projects |
| `/platforms/:slug`                | Platform landing — full-bleed world map, welcome card, legend, search |
| `/platforms/:slug/:cityId`        | City detail — zone panel, hex cartogram, scatter (Rome) |
| `/research`                       | Papers, datasets, citation                     |
| `/faq`                            | Six questions                                  |
| `/contact`                        | Team, address, collaboration                   |

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
```

## Maps

The Atlas draws its **own basemap**: a paper background, a graticule and
simplified Natural Earth land polygons bundled at
`public/data/world-land.geojson`. No tile server, no API key, works offline, and
it matches the design's palette exactly.

To use a real basemap instead, set either environment variable and rebuild:

```bash
VITE_MAP_STYLE=https://…/style.json        # a full MapLibre style
VITE_TILE_URL=https://…/{z}/{x}/{y}.png    # raster tiles, auto-tinted to paper
VITE_TILE_ATTRIBUTION="© …"                # required with VITE_TILE_URL
VITE_BASE=/access-atlas/                   # serve from a sub-path
```

Layers are declarative — `<AtlasMap>` owns the map, `<GeoJSONLayer>` children
add a source and a layer and keep them in sync with props. A platform's colours
come from its entry in `src/data/platforms.js`, so adding a fifth platform needs
no new component code.

> **maplibre-gl v6 note.** v6 finds its worker with
> `new URL('./maplibre-gl-worker.mjs', import.meta.url)`, which resolves beside
> the *bundled* chunk — a path Vite doesn't emit. `src/map/AtlasMap.jsx` imports
> it with `?worker&url` and calls `setWorkerUrl()`; `vite.config.js` sets
> `worker.format: 'es'`. Without both, the worker 404s (behind an SPA fallback
> it silently loads `index.html`) and every map hangs blank with its style stuck
> loading. Keep them together if you upgrade.

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

**The Italian is a first draft and needs a native review before launch.**

## Data status

⚠️ **The measurements are placeholders.** City coordinates are real; every
*value* (proximity minutes, velocity score, CDI, P.O.V. zone, the Rome mesh) is
deterministically synthesised so the maps look and behave right before the real
outputs are published. Both `src/data/cities.js` and `src/data/mesh.js` say so
at the top. `public/data/README.md` documents how to swap in real data without
touching component code.

The Rome generator is calibrated to reproduce the figures the design was signed
off with — 8,089 hexagons, 12.9 / 2.7 / 1.4 / 83.0 % zone split, 644 m median
proximity, 2.7 k median opportunity — so the page reads as designed until it is
replaced. `src/data/research.js` holds placeholder citations to confirm.

## Deliberate departures from the design

- **Home coverage map is 400 px tall, not 280.** The design's illustration
  compressed the globe; a real Mercator map at page width needs the extra height
  to show the same span, Helsinki to Melbourne. Everything else keeps the
  design's dimensions.
- **Cartogram caption reads "H3 resolution 9 · ~186 m cells"**, derived from the
  mesh rather than the design's hard-coded "resolution 10 · scale 1:80 000" —
  8,089 cells over Rome is resolution 9, and shipping the wrong number in a
  research context seemed worse than editing the caption.
- **`/research` had no artboard.** The nav has always listed it, so rather than
  leave a dead link the page is assembled only from existing design patterns.
  Content is placeholder.
- **Footer link columns other than Platforms don't navigate**, matching the
  design, which renders them as plain labels. They are ready for hrefs.

## Verification

`scripts/smoke.mjs` loads every route in a real browser and checks the pages
render without console or network errors, the maps rasterise, the Rome mesh
matches its published figures, search navigates, and EN ⇄ IT swaps copy and
number formatting. Playwright is not a project dependency:

```bash
npm install --no-save playwright && npx playwright install chromium
npm run build && npm run preview -- --port 4321 &
npm run smoke
```

## Assets

Sony CSL marks in `src/assets/logos/` are the originals supplied with the
handoff. `<Logo>` exposes `symbol` / `horizontal` / `twoLine` in `color`,
`dark` and `light` — the nav and footer use the colour symbol; the others are
wired up and ready for dark backgrounds and print.
