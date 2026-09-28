# Accessibility Atlas

An atlas that measures how accessible cities are — the public site for the
Sustainable Cities team's research at **Sony CSL Rome**.

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
version first and says so instead. The same preflight checks that the packages
a script imports are installed: the data scripts need `h3-js`, a
devDependency, so a tree installed with `--omit=dev` or installed before that
dependency was added answers `ERR_MODULE_NOT_FOUND` instead of running, and
`npm install` is the fix.

```bash
nvm use 22           # or any Node ≥ 20
npm install
npm run dev          # http://localhost:5173
npm run build        # → dist/ (also pre-gzips text files; see Deployment)
npm run preview
```

## Adding data

Drop upstream files under `input_data/<platform>/` and run the matching
import script. See [`input_data/README.md`](input_data/README.md) for the
per-platform schema.

```bash
npm run import:fifteen           # input_data/15mincity/*.geojson → public/data/fifteen/
npm run test:data                # validate what was just written
```

Each import script rounds coordinates and values, drops pipeline debris,
derives the population-scaled cartogram companion, and upserts the city
into `public/data/index.json` + the platform's `coverage.geojson`.

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
| `/`                        | Landing — the name and the premise over the coverage backdrop, then metrics, the four accessibility layers, the city comparison and work in progress |
| `/platforms/:slug`         | Platform landing — full-bleed world map, welcome card, legend, city search |
| `/platforms/:slug/:cityId` | City detail — P.O.V. zones, Car Dependency bands, or 15minCity's category/mode selectors |
| `/atlas/:cityId`           | Combined viewer — one mesh, all four platforms as switchable layers; state in the query string |
| `/research`                | Papers, datasets, citation |
| `/blog`, `/blog/:slug`     | Long-form writing |
| `/work-with-us`            | Open positions, PhD / thesis / internship routes |
| `/faq`                     | Common questions |
| `/contact`                 | Team, address, collaboration |
| `/sustainable-cities`      | Who we are — the research line, the lab, other projects |
| `/stats`                   | Where cities will be compared; links the per-platform comparisons |
| `/consulting`              | For policy makers and companies who want to ask |

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
opposite case: they want the basemap **on** (the default), or the cards come
out on blank paper — and taking them needs a browser, a build and a reachable
basemap host at once. **Actions → Reshoot platform previews → Run workflow**
does all three and commits the result, so no local setup is needed;
`npm run shoot:previews` against a default build does the same thing locally.

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

A static build; `dist/` can be served by anything.

### Compression

Two mechanisms, and they stack.

**1. Content reduction, in the import scripts.** Coordinates to 5 decimal
places (~1 m), values to 1 decimal, pipeline fields nothing reads
dropped. Roughly 30 % off before anything is compressed.

**2. gzip.** A platform can store its published files gzipped, and the
server sends them with `Content-Encoding: gzip` so the browser decodes
them transparently.

**Every platform is stored gzipped** — `fifteen/milan.geojson.gz`, named
that way in the catalogue — because the Atlas is served from a machine
where the size of the data tree is the binding constraint.
`public/data/` went **176 MB → 41 MB**:

| | before | after |
| --- | ---: | ---: |
| citychrone | 83.63 MB | 23.89 MB |
| cardep | 47.53 MB | 8.77 MB |
| pov | 25.28 MB | 4.48 MB |
| fifteen | 9.72 MB | 1.93 MB |
| atlas | 9.23 MB | 1.34 MB |

Converting a platform either way:

```bash
npm run compress:data -- --platform cardep          # convert + repoint catalogue
npm run compress:data -- --platform cardep --dry-run
npm run compress:data -- --platform cardep --decompress   # back out
npm run compress:data -- --all
```

It rewrites every path the catalogue names — `dataset`, `geoDataset`,
`cartogramDataset`, `cartograms`, `coverage`, `summary`, scenarios and
CityChrone's `{hh}` hourly templates — so nothing is left pointing at a
file that moved. Run `npm run test:data` after.

Separately, `npm run build` writes `.gz` companions beside every *other*
text file in `dist/` above 4 KB (`scripts/postbuild-compress.mjs`), which
is the `gzip_static` convention. `npm run build:nogzip` skips it.

**Serving it — no server configuration is required.** The loaders sniff
the first two bytes of every dataset and decompress in the browser
(`DecompressionStream`) when the body is still gzipped, so a stored `.gz`
works on a host that knows nothing about it. GitHub Pages serves these as
an opaque `application/gzip` download and cannot be configured otherwise;
that path is covered.

Configuring the server is still worth doing where you can — the browser
then decodes natively as the response streams, rather than the app
buffering the whole file and decoding after:

| Where | Mechanism |
| --- | --- |
| `npm run dev` / `npm run preview` | `aa-serve-precompressed` in `vite.config.js` |
| nginx | see below |
| Caddy | `encode gzip` — prefers precompressed automatically |
| GitHub Pages / Netlify / Vercel | nothing to do; the app decompresses |

nginx, serving a tree where some files are stored `.gz` and others have
`.gz` companions:

```nginx
server {
    root /srv/access-atlas/dist;

    # Companions beside a plain file (case 2 above).
    gzip_static on;

    # Files whose only copy is compressed: send the encoding, and the
    # content type of what it decodes to rather than application/gzip.
    location ~ \.geojson\.gz$ {
        add_header Content-Encoding gzip;
        add_header Vary Accept-Encoding;
        default_type application/geo+json;
    }
    location ~ \.json\.gz$ {
        add_header Content-Encoding gzip;
        add_header Vary Accept-Encoding;
        default_type application/json;
    }
    # CityChrone's hourly travel-time matrices.
    location ~ \.npy\.gz$ {
        add_header Content-Encoding gzip;
        add_header Vary Accept-Encoding;
        default_type application/octet-stream;
    }

    # SPA fallback — deep links must serve the shell.
    location / { try_files $uri /index.html; }
}
```

Without those `location` blocks the browser receives gzip bytes labelled
`application/gzip`, and the app decompresses them itself — slower, but
correct. What the blocks buy is native streaming decode.

The catalogue names the `.gz` explicitly rather than relying on the
server to rewrite `.geojson` → `.geojson.gz`. A rewrite a host does not
perform would 404 into the SPA fallback, which returns `index.html` with
HTTP 200 — and the data layer reads that as "not published" and quietly
renders seed data. Naming the real file means a host that cannot serve it
fails visibly instead.

Two requirements:

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

### Deploying to your own server

`scripts/deploy.sh` builds, uploads and verifies in one command. It exists
because the two settings that decide whether a deploy works are both compiled
in at build time and both fail silently when wrong, so typing them by hand
once per deploy is the failure mode rather than the safeguard.

```bash
scripts/deploy.sh                 # build, upload, install, verify
scripts/deploy.sh --skip-build    # publish the dist/ already on disk
scripts/deploy.sh --verify-only   # re-run the checks against the live URL
```

Its defaults are the live deployment: `https://whatif.sonycsl.it/atlas/`,
served from `/var/www/whatif/atlas`. Every one of them is an environment
variable, so a second host needs no edit to the file.

| | |
| --- | --- |
| `AA_URL` | public URL, trailing slash required |
| `AA_BASE` | its path component, which is what `VITE_BASE` is set to |
| `AA_BASEMAP` | MapLibre style for the city basemap |
| `AA_SSH` | ssh destination |
| `AA_STAGE` | staging directory, writable without privileges |
| `AA_TARGET` | final location, under the vhost's DocumentRoot |
| `AA_OWNER` | user Apache reads as (`apache:apache` on RHEL-alikes) |

It uploads in two steps, to `AA_STAGE` as the login user and then into
`AA_TARGET` with `sudo`, because only the second half needs privileges.

**The checks are the point of it.** It refuses to publish a `dist/` whose
assets are not under `AA_BASE`, which is the one mistake that produces a
working-looking site. A base that does not match the URL sends the catalogue
request into the SPA fallback, which answers with `index.html` and HTTP 200,
and the data layer reads that as "nothing is published" and draws seed data.
Every map, panel and figure then renders perfectly and every layer reads "Not
published". That is also why the post-deploy check reads the *body* of
`data/index.json` rather than its status code, which is 200 either way. It
refuses a build with no `404.html` too, and one carrying no catalogue at all.

The script copies files. The rewrite rule is the server's own, and has to be
installed once by hand.

### Apache

Deep links like `/atlas/faq` must serve the shell, or they 404 on reload.
`dist/404.html` does not cover this: that is for hosts with no rewrite rule at
all. Put this inside the `<VirtualHost>` that actually serves the site. On a
certbot setup that is the `:443` vhost in `<name>-le-ssl.conf`, not the `:80`
one, which does nothing but redirect to HTTPS:

```apache
<Directory /var/www/whatif/atlas>
    Options -Indexes -MultiViews
    AllowOverride None
    Require all granted

    RewriteEngine On
    RewriteBase /atlas/

    # Real files and directories are served as-is.
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # Everything else is a client-side route: hand it the shell.
    RewriteRule ^ index.html [L]
</Directory>
```

Then `sudo a2enmod rewrite`, `sudo apachectl configtest`, `sudo systemctl
reload apache2`. The configtest before the reload is not optional on a vhost
that also serves something else.

Three things that cost time here:

- **In the vhost, not in `.htaccess`.** An `.htaccess` under `AA_TARGET` is
  deleted by the next deploy, because `rsync --delete` mirrors `dist/` and
  `dist/` contains no such file. It also needs `AllowOverride` to permit it,
  which a stock vhost does not. Whether overrides are on at all is one test:
  write an invalid directive into one and request the path. A 500 means it is
  read, a 200 means it is ignored.
- **`Options -MultiViews`.** With MultiViews on, Apache resolves extensionless
  URLs against files on disk before `mod_rewrite` runs, which breaks the
  routes unpredictably.
- **certbot can rewrite `<name>-le-ssl.conf`.** Not on an ordinary renewal,
  but a re-run of `certbot --apache` for that host will. Keep a copy of the
  block and check it survived any certificate work.

The gzipped datasets need no configuration. Apache serves a `.gz` as
`application/x-gzip` with no `Content-Encoding`, and `fetchDecoded` in
`src/map/loaders.js` sniffs the magic number and decompresses in the browser.
Declaring the encoding server-side is a speed optimisation, and it breaks
outright if `mime.conf` already has `AddEncoding x-gzip .gz` active: two
`Content-Encoding` headers, double decode, nothing loads.


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

- **The home's coverage map became the site's backdrop.** The design put a
  400 px map inside the page; it is now one fixed map behind every screen,
  framed exactly as the platform screen frames it, and the page's own copy of
  it went rather than showing the same map twice.
- **Cartogram caption reads "H3 resolution 9 · ~186 m cells"**, derived from the
  mesh rather than the design's hard-coded "resolution 10 · scale 1:80 000" —
  8,089 cells over Rome is resolution 9, and shipping a wrong number in a
  research context seemed worse than editing the caption.
- **`/research` had no artboard.** The nav has always listed it, so rather than
  leave a dead link the page is assembled only from existing design patterns.

Everything else keeps the design's dimensions, tokens and scale; the type is
Poppins throughout (figures keep a monospace, so digits line up). Footer
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
