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
# Usage:
#   scripts/deploy.sh                 build, upload, install, verify
#   scripts/deploy.sh --skip-build    publish the dist/ already on disk
#   scripts/deploy.sh --verify-only   just re-run the checks against the host
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

for arg in "$@"; do
  case "$arg" in
    --skip-build)  do_build=0 ;;
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
  say "Installing into $AA_TARGET (sudo on $AA_SSH)"
  remote=$(cat <<EOF
set -e
sudo mkdir -p "$AA_TARGET"
sudo rsync -a --delete "$AA_STAGE/" "$AA_TARGET/"
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
head="$(curl -s "${AA_URL}data/index.json" | head -c 1)"
if [ "$head" = "{" ]; then
  printf '  \033[32mJSON\033[0m  catalogue is real JSON\n'
else
  printf '  \033[31mHTML\033[0m  catalogue returned the SPA shell: VITE_BASE does not match %s\n' "$AA_URL"
  checks_failed=1
fi

[ "$checks_failed" = 0 ] || fail "some checks failed; see above"

say "Deployed to $AA_URL"
