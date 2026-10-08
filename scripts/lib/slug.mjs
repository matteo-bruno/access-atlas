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
 * `name` is the city's name as the file writes it, accents and all, for a
 * city the catalogue does not know yet: `Al 'Azīzīyah.geojson` is shown as
 * "Al 'Azīzīyah", not as its id. A name written all in lower case
 * (`zurich.geojson`) is title-cased, since that is a file name, not a choice.
 *
 * @returns {{ city: string, scenario: string | null, name: string }}
 */
export function parseSourceName(name) {
  const match = name.match(SCENARIO_SEPARATOR);
  const cityPart = match ? name.slice(0, match.index) : name;
  return {
    city: slugify(cityPart),
    scenario: match ? slugify(name.slice(match.index + match[0].length)) || null : null,
    name: displayName(cityPart),
  };
}

function displayName(cityPart) {
  const name = cityPart.replace(/[_ -]fua$/i, '').trim().replace(/\s+/g, ' ');
  if (name !== name.toLowerCase()) return name;
  return name.replace(/(^|[\s-])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase());
}
