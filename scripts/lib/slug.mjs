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

// Two underscores separate a city from a scenario of it: `rome__metro-d_cdi.zip`
// is scenario `metro-d` of `rome`. One underscore stays part of the city, so
// `Tokyo_FUA.geojson` is the city `tokyo-fua` (its metro area).
export const SCENARIO_SEPARATOR = '__';

/**
 * What a source names, from the importer's reading of its file name
 * (`importer.cityName`, extension and platform suffix already dropped).
 *
 * @returns {{ city: string, scenario: string | null }}
 */
export function parseSourceName(name) {
  const at = name.indexOf(SCENARIO_SEPARATOR);
  if (at < 0) return { city: slugify(name), scenario: null };
  return {
    city: slugify(name.slice(0, at)),
    scenario: slugify(name.slice(at + SCENARIO_SEPARATOR.length)) || null,
  };
}
