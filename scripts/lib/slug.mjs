// A source file's city id, from its name: `New York.geojson` → `new-york`.
//
// Shared by the importer and by `update-data.mjs`, which passes the importer
// `--only <slug>`: two copies of this function are two opinions on which
// file a slug names, and the first time they differ a city is skipped with
// nothing said.
export function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// A source is named after its city and nothing else: `Rome.geojson` is the
// city `rome` (its GHS core), `Rome_FUA.geojson` its metro area `rome-fua`,
// and `Rome_scenario_metro-d.geojson` the scenario `metro-d` of Rome
// (`Paris_FUA_scenario_new-line.geojson`: of Paris's metro area).
export const SCENARIO_SEPARATOR = /_scenario_/i;

/**
 * What a source names, from the importer's reading of its file name
 * (`importer.cityName`, extension already dropped).
 *
 * @returns {{ city: string, scenario: string | null }}
 */
export function parseSourceName(name) {
  const match = name.match(SCENARIO_SEPARATOR);
  if (!match) return { city: slugify(name), scenario: null };
  return {
    city: slugify(name.slice(0, match.index)),
    scenario: slugify(name.slice(match.index + match[0].length)) || null,
  };
}
