#!/usr/bin/env node
// Import one city's layer from a platform's own export.
//
//   npm run import -- <platform> <source> [options]
//
//   platform   15mincity | citychrone | pov | cdi
//   source     the export as the platform hands it over (see input_data/README.md)
//
//   --city <id>          city id, when the file name does not give the right one
//   --claimed <json>     { id: source } of cities other sources already publish
//                        for this platform (update-data passes it)
//   --report <file>      write { cityId } there on success (update-data reads it)
//   --dry-run            check and report, write nothing
//   --name / --name-it   the city's name, English / Italian
//   --country <ISO>      and --region / --region-it: where it is, when the
//                        lookup from its centre is wrong
//
// Every import rebuilds the city from what is already published plus this
// layer (scripts/lib/bundle.mjs), so importing P.O.V. for a city that has
// 15minCity keeps 15minCity, and re-importing a layer replaces that layer
// only. `npm run update:data` runs this for whatever changed in input_data/.
//
// The file name proposes a city; where the layer is decides it
// (`resolveCityId` in bundle.mjs). A layer named after a published city that
// lies somewhere else is a different city with the same name, and is
// published beside it with its country as a suffix (`valencia-ve`).

import path from 'node:path';
import fs from 'node:fs';
import { publishLayer, readCatalogue, resolveCityId } from './lib/bundle.mjs';
import { displayName, slugify } from './lib/slug.mjs';
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
    if (!['dry-run'].includes(a.slice(2))) i++;
    continue;
  }
  positional.push(a);
}

const [platformArg, source] = positional;
const platformId = ALIASES[platformArg] ?? platformArg;
const importer = IMPORTERS[platformId];
if (!importer || !source) {
  console.error('usage: npm run import -- <15mincity|citychrone|pov|cdi> <source> [--city id] [--dry-run]');
  process.exit(2);
}

const sourceName = displayName(importer.cityName(path.basename(source)));
const base = slugify(sourceName);
const dryRun = flag('dry-run');
const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
let cityId = arg('city') ?? base;

try {
  const started = Date.now();
  const parsed = importer.parse(source);
  const resolved = resolveCityId(readCatalogue(), { base, requested: arg('city'), record: parsed.record });
  cityId = resolved.id;
  if (resolved.homonym) {
    const h = resolved.homonym;
    console.log(
      `  "${base}" is already ${[h.name, h.region].filter(Boolean).join(', ')}, elsewhere: ` +
        `this one is published as "${cityId}"`,
    );
  }
  // Another source of this platform already publishes this city: importing
  // this one too would overwrite it, and which survived would depend on the
  // order the files were read in.
  const claimed = arg('claimed') ? JSON.parse(arg('claimed')) : {};
  if (claimed[cityId]) {
    throw new Error(
      `${claimed[cityId]} already publishes this city for ${platformId}; ` +
        'keep one of the two sources, or pass --city if they are different places',
    );
  }
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
      sourceName,
    },
  });
  if (arg('report') && !dryRun) fs.writeFileSync(arg('report'), JSON.stringify({ cityId }));

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
} catch (error) {
  console.error(`${cityId} · ${importer.layer}: ${error.message}`);
  process.exit(1);
}
