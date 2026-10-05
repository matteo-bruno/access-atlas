#!/usr/bin/env bash
#
# Build the Atlas and publish it to a static host over ssh.
#
# The two settings that matter are baked in below rather than typed per
# deploy, because both fail *silently* when they are wrong:
#
#   VITE_BASE           is compiled into the router basename, the catalogue
#                       URL and every asset path. If it does not match the URL
#                       the site is served at, the catalogue request falls into
#                       the SPA fallback, receives index.html with HTTP 200,
#                       and the data layer reads that as "nothing is published"
#                       and draws seed data. The site then renders perfectly
#                       and every layer says "Not published".
#
#   VITE_BASEMAP_STYLE  is `none` in CI, so that the browser suites do not
#                       depend on a third-party tile host. A build that
#                       inherits the CI setting looks fine until you notice the
#                       city maps have no streets under the mesh.
#
# Both are checked after the build rather than trusted, because neither
# produces an error on its own.
#
# The data is checked before the build (`npm run test:data`), and after the
# upload the catalogue, every coverage file and every compare summary on the
# server are compared byte for byte with the ones just built: an index or a
# world map that did not get replaced is exactly the failure that looks fine
# from the server's status codes.
#
# Usage:
#   scripts/deploy.sh                 build, upload, install, verify
#   scripts/deploy.sh --skip-build    publish the dist/ already on disk
#   scripts/deploy.sh --verify-only   just re-run the checks against the host
#   scripts/deploy.sh --skip-data-check   build without running test:data first
#   scripts/deploy.sh --help
#
# Every setting is overridable from the environment, so a second host needs no
# edit to this file:
#   AA_URL=https://example.org/atlas/ AA_SSH=me@example.org \
#   AA_TARGET=/var/www/example/atlas scripts/deploy.sh

set -euo pipefail

# --- settings ---------------------------------------------------------------

# Public URL the build is served at. Trailing slash required.
AA_URL="${AA_URL:-https://whatif.sonycsl.it/atlas/}"
# Path component of that URL, which is what VITE_BASE must equal.
AA_BASE="${AA_BASE:-/atlas/}"
# MapLibre style for the city basemap. `none` publishes with paper only.
AA_BASEMAP="${AA_BASEMAP:-https://tiles.openfreemap.org/styles/positron}"

# ssh destination, and where the build lands on it.
AA_SSH="${AA_SSH:-whatif.sonycsl.it}"
# Staging directory, writable without privileges.
AA_STAGE="${AA_STAGE:-/tmp/atlas-dist}"
# Final location, under the vhost's DocumentRoot.
AA_TARGET="${AA_TARGET:-/var/www/whatif/atlas}"
# Owner Apache reads as. `apache:apache` on RHEL-alikes.
AA_OWNER="${AA_OWNER:-www-data:www-data}"

# --- plumbing ---------------------------------------------------------------

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

do_build=1
do_publish=1
do_data_check=1

for arg in "$@"; do
  case "$arg" in
    --skip-build)  do_build=0 ;;
    --skip-data-check) do_data_check=0 ;;
    --verify-only) do_build=0; do_publish=0 ;;
    -h|--help)     awk 'NR>2 && /^#/ { sub(/^# ?/, ""); print; next } NR>2 { exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "deploy: unknown argument: $arg" >&2; exit 2 ;;
  esac
done

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\033[31mdeploy: %s\033[0m\n' "$*" >&2; exit 1; }

# Both directories below are mirrored into with `rsync --delete`, one of them
# under sudo, so a typo in either is destructive rather than merely wrong.
# Refuse anything shallower than two components: /var/www/whatif/atlas passes,
# /var and / do not.
safe_path() {
  local p="$1" n
  case "$p" in /*) ;; *) return 1 ;; esac
  n=$(printf '%s\n' "$p" | tr '/' '\n' | grep -c . || true)
  [ "$n" -ge 2 ]
}

warn() { printf '\033[33mdeploy: %s\033[0m\n' "$*" >&2; }

# --- check the data ---------------------------------------------------------
#
# The server gets whatever is in public/data on this machine, committed or
# not, and GitHub Pages gets what is committed. Rome's 15minCity layer went
# out right here and wrong on Pages because an import's new files were
# committed without the files it had rewritten. Say so before deploying a
# tree that differs from the repository.

if [ "$do_build" = 1 ]; then
  if [ "$do_data_check" = 1 ]; then
    say "Checking the published data"
    npm run --silent test:data >/tmp/atlas-test-data.log 2>&1 || {
      grep -E '^FAIL' /tmp/atlas-test-data.log >&2 || tail -20 /tmp/atlas-test-data.log >&2
      fail "test:data failed (full output in /tmp/atlas-test-data.log); fix the data or pass --skip-data-check"
    }
    printf '  test:data passed\n'
  fi
  if command -v git >/dev/null && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    dirty="$(git status --porcelain -- public/data | wc -l | tr -d ' ')"
    if [ "$dirty" != 0 ]; then
      warn "$dirty file(s) under public/data are not committed: the server will get them, GitHub will not."
      warn "commit them all (git add -A public/data), not only the new ones."
    fi
  fi
fi

# --- build ------------------------------------------------------------------

if [ "$do_build" = 1 ]; then
  say "Building with VITE_BASE=$AA_BASE"
  VITE_BASE="$AA_BASE" VITE_BASEMAP_STYLE="$AA_BASEMAP" npm run build
fi

# --- check what was built ---------------------------------------------------
#
# These run whether or not this script did the building, so that --skip-build
# cannot publish a dist/ left behind by a CI-shaped or Pages-shaped build.

if [ "$do_publish" = 1 ]; then
  say "Checking the build"

  [ -f dist/index.html ] || fail "dist/index.html is missing; run without --skip-build"

  # The SPA fallback copy. Hosts without a rewrite rule serve this for unknown
  # paths; `vite preview` has its own fallback and so cannot catch its absence.
  [ -f dist/404.html ] || fail "dist/404.html was not emitted (spaFallback in vite.config.js)"

  # The catalogue decides what is published. Without it every city is seed data.
  [ -f dist/data/index.json ] || fail "dist/data/index.json is missing"

  # An exact prefix match, not a substring: with AA_BASE=/ a substring test
  # would happily accept a /atlas/ build and vice versa.
  asset="$(grep -o 'src="[^"]*assets/[^"]*"' dist/index.html | head -1 | sed 's/^src="//; s/"$//')"
  case "$asset" in
    "${AA_BASE}assets/"*) ;;
    *) fail "built for the wrong base: index.html loads '$asset', expected it under '${AA_BASE}assets/'" ;;
  esac

  printf '  base      %s (assets at %s)\n' "$AA_BASE" "$asset"
  printf '  size      %s\n' "$(du -sh dist | cut -f1)"
fi

# --- publish ----------------------------------------------------------------

if [ "$do_publish" = 1 ]; then
  safe_path "$AA_TARGET" || fail "AA_TARGET ($AA_TARGET) is too shallow to mirror into with --delete"
  safe_path "$AA_STAGE"  || fail "AA_STAGE ($AA_STAGE) is too shallow to mirror into with --delete"

  say "Uploading to $AA_SSH:$AA_STAGE"
  rsync -az --delete dist/ "$AA_SSH:$AA_STAGE/"

  # Two rsyncs rather than one: the login user can write the staging directory,
  # and only the second half needs privileges. `ssh -t` so sudo can prompt.
  #
  # --checksum: compare content, never size and mtime, so no file can be
  # skipped as "the same" when it is not. --delay-updates: every changed file
  # is put in place at the end, together, so a visitor mid-deploy does not
  # get a new catalogue pointing at files that are still the old ones.
  say "Installing into $AA_TARGET (sudo on $AA_SSH)"
  remote=$(cat <<EOF
set -e
sudo mkdir -p "$AA_TARGET"
sudo rsync -a --checksum --delay-updates --delete "$AA_STAGE/" "$AA_TARGET/"
sudo chown -R "$AA_OWNER" "$AA_TARGET"
sudo find "$AA_TARGET" -type d -exec chmod 755 {} +
sudo find "$AA_TARGET" -type f -exec chmod 644 {} +
rm -rf "$AA_STAGE"
EOF
)
  ssh -t "$AA_SSH" "$remote"
fi

# --- verify -----------------------------------------------------------------
#
# Against the live URL, because everything above can succeed while the server
# still answers the wrong thing.

say "Verifying $AA_URL"

status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

checks_failed=0
check() {
  local url="$1" want="$2" label="$3" got
  got="$(status "$url")"
  if [ "$got" = "$want" ]; then
    printf '  \033[32m%s\033[0m  %s\n' "$got" "$label"
  else
    printf '  \033[31m%s\033[0m  %s (wanted %s)\n' "$got" "$label" "$want"
    checks_failed=1
  fi
}

check "$AA_URL"               200 "landing"
check "${AA_URL}faq"          200 "deep link (needs the server's SPA fallback)"
check "${AA_URL}atlas/milan"  200 "city view, reloaded"

# The one that catches a VITE_BASE mismatch. A wrong base does not 404: the
# fallback answers with index.html and HTTP 200, so the status is useless here
# and only the body tells the truth.
# Read whole, not piped into `head -c 1`: under pipefail, head closing the
# pipe early makes curl exit 23 and ends the script here without a word once
# the catalogue is larger than a pipe buffer.
catalogue_body="$(curl -s "${AA_URL}data/index.json?deploycheck=$(date +%s)" || true)"
head="${catalogue_body:0:1}"
if [ "$head" = "{" ]; then
  printf '  \033[32mJSON\033[0m  catalogue is real JSON\n'
else
  printf '  \033[31mHTML\033[0m  catalogue returned the SPA shell: VITE_BASE does not match %s\n' "$AA_URL"
  checks_failed=1
fi

# What the server now holds must be what was built: the catalogue and every
# file whose name does not change from one deploy to the next (coverage,
# summaries). A random query keeps any cache between here and the files out
# of the comparison. Skipped with --verify-only when there is no build here.
if [ -f dist/data/index.json ]; then
  sha() { if command -v sha256sum >/dev/null; then sha256sum | cut -d' ' -f1; else shasum -a 256 | cut -d' ' -f1; fi; }
  stamp="deploycheck=$(date +%s)"
  mismatched=0
  checked=0
  for rel in index.json $(node -e '
    const c = JSON.parse(require("fs").readFileSync("dist/data/index.json", "utf8"));
    for (const p of Object.values(c.platforms ?? {})) for (const f of [p.coverage, p.summary]) if (f) console.log(f);
  '); do
    checked=$((checked + 1))
    here="$(sha < "dist/data/$rel")"
    there="$(curl -s "${AA_URL}data/${rel}?${stamp}" | sha)"
    if [ "$here" != "$there" ]; then
      printf '  \033[31mSTALE\033[0m %s differs from the build\n' "$rel"
      mismatched=1
    fi
  done
  if [ "$mismatched" = 0 ]; then
    printf '  \033[32mSAME\033[0m  catalogue, coverage and summaries match the build (%s files)\n' "$checked"
  else
    checks_failed=1
  fi
fi

# The shell names the build, and the build names the catalogue: an index.html
# a browser keeps from the last deploy keeps asking for the last catalogue.
if ! curl -sI "$AA_URL" | grep -qi '^cache-control:.*no-cache'; then
  warn "index.html is served without Cache-Control: no-cache, so browsers may keep the previous deploy;"
  warn "see the Apache section of README.md"
fi

[ "$checks_failed" = 0 ] || fail "some checks failed; see above"

say "Deployed to $AA_URL"
