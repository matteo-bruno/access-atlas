#!/usr/bin/env node
// Import one city's layer from a platform's own export.
//
//   npm run import -- <platform> <source> [options]
//
//   platform   15mincity | citychrone | pov | cdi
//   source     the export as the platform hands it over (see input_data/README.md)
//
//   npm run import -- <platform> --remove <city>    take a city's layer off the site
//   npm run import -- --index                       rebuild the catalogue only
//
//   platform   15mincity | citychrone | pov | cdi
//   source     the export as the platform hands it over (see input_data/README.md)
//
//   --city <id>          city id, when the file name does not give the right one
//   --dry-run            check and report, write nothing
//   --name / --name-it   the city's name, English / Italian
//   --country <ISO>      and --region / --region-it: where it is, when the
//                        lookup from its centre is wrong
//   --no-index           leave the catalogue, coverage and summaries alone
//                        (update-data rebuilds them once, after every import)
//
// Every import rebuilds the city from what is already published plus this
// layer (scripts/lib/bundle.mjs), so importing P.O.V. for a city that has
// 15minCity keeps 15minCity, and re-importing a layer replaces that layer
// only. The city's own record (cities/<city>/city.json) is written with it;
// the catalogue and the world maps' files are then rebuilt from every
// city's record. `npm run update:data` runs this for whatever changed in
// input_data/.

import path from 'node:path';
import { buildIndex, publishLayer, unpublishLayer } from './lib/bundle.mjs';
import { slugify } from './lib/slug.mjs';
import * as pov from './importers/pov.mjs';
import * as cdi from './importers/cdi.mjs';
import * as fifteen from './importers/fifteen.mjs';
import * as citychrone from './importers/citychrone.mjs';

export const IMPORTERS = { '15mincity': fifteen, citychrone, pov, cdi };
const ALIASES = { fifteen: '15mincity', cardep: 'cdi' };

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name) => process.argv.includes(`--${name}`);

const positional = [];
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) {
    if (!['dry-run', 'no-index', 'index'].includes(a.slice(2))) i++;
    continue;
  }
  positional.push(a);
}

const dryRun = flag('dry-run');
const kb = (n) => `${(n / 1024).toFixed(0)} kB`;

function reindex() {
  const report = buildIndex({ dryRun });
  const changed = report.files.filter((f) => f?.changed);
  console.log(
    `catalogue: ${report.cities} cities on ${report.platforms.length} platforms, ` +
      `${changed.length ? `${changed.length} file(s) ${dryRun ? 'would change' : 'rewritten'}` : 'unchanged'}`,
  );
  for (const f of changed) console.log(`    ${f.rel}${f.removed ? '  (removed)' : ''}`);
  // A city whose files changed has left the Stats page until its figures
  // are recomputed; update:data asks, a hand import only says so.
  const left = report.stats.omitted.map((o) => o.id);
  if (left.length) console.log(`statistics: ${left.join(', ')} not on the Stats page until \`npm run stats\``);
}

if (flag('index')) {
  reindex();
  process.exit(0);
}

const [platformArg, source] = positional;
const platformId = ALIASES[platformArg] ?? platformArg;
const importer = IMPORTERS[platformId];
const removing = arg('remove');
if (!importer || (!source && !removing)) {
  console.error(
    'usage: npm run import -- <15mincity|citychrone|pov|cdi> <source> [--city id] [--dry-run]\n' +
      '       npm run import -- <15mincity|citychrone|pov|cdi> --remove <city> [--dry-run]\n' +
      '       npm run import -- --index',
  );
  process.exit(2);
}

if (removing) {
  try {
    const report = unpublishLayer({ cityId: removing, layer: importer.layer, dryRun });
    console.log(
      `${removing} · ${importer.layer}: removed${dryRun ? ' (dry run)' : ''} — ` +
        (report.layers.length ? `layers left ${report.layers.join(', ')}` : 'no layers left, city removed'),
    );
    for (const f of report.files.filter((f) => f?.changed)) console.log(`    ${f.rel}${f.removed ? '  (removed)' : ''}`);
    reindex();
  } catch (error) {
    console.error(`${removing} · ${importer.layer}: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
}

const cityId = arg('city') ?? slugify(importer.cityName(path.basename(source)));

try {
  const started = Date.now();
  const parsed = importer.parse(source);
  const report = publishLayer({
    cityId,
    record: parsed.record,
    rows: parsed.rows,
    dryRun,
    overrides: {
      name: arg('name'),
      nameIt: arg('name-it'),
      country: arg('country'),
      region: arg('region'),
      regionIt: arg('region-it'),
    },
  });

  console.log(
    `${cityId} · ${importer.layer}: ${report.cells} cells${report.replaced ? ' (replaced)' : ''} — ` +
      `city grid ${report.gridCells} cells, layers ${report.layers.join(', ')}${dryRun ? ' (dry run)' : ''}`,
  );
  console.log(`  ${report.meta.name} · ${report.meta.region ?? 'no region'} (${report.meta.country ?? '--'})`);
  if (report.derived && !report.derived.exact) {
    console.warn(
      report.derived.iso
        ? `  ~ country matched ${report.derived.distanceKm} km off the coast, not contained: check it`
        : '  ! no country near the city centre: pass --country / --region',
    );
  }
  for (const note of parsed.notes ?? []) console.log(`  ${note}`);
  const changed = report.files.filter((f) => f?.changed);
  const stored = changed.reduce((s, f) => s + (f.stored ?? 0), 0);
  console.log(
    `  ${changed.length} file(s) ${dryRun ? 'would change' : 'written'}` +
      (stored ? `, ${kb(stored)} on disk` : '') +
      ` · ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
  for (const f of changed) console.log(`    ${f.rel}${f.stored ? `  ${kb(f.stored)}` : ''}`);
  if (!flag('no-index')) reindex();
} catch (error) {
  console.error(`${cityId} · ${importer.layer}: ${error.message}`);
  process.exit(1);
}
