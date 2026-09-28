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
