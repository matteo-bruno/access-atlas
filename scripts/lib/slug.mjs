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

// A source file's city name as written, for display: `São_Paulo` → `São Paulo`.
//
// The slug folds accents and punctuation away because it is a URL, and that
// makes it a poor name — `sao-paulo` title-cased is "Sao Paulo". The file
// name is the only place the accents survive, so a new city takes its name
// from there. Underscores are spaces; hyphens stay (`Aix-en-Provence`). A
// name written all in lower case is capitalised word by word, and one with
// any capital is kept exactly as written.
export function displayName(name) {
  const text = name.normalize('NFC').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
  if (text !== text.toLocaleLowerCase()) return text;
  return text.replace(/(^|\s)(\p{L})/gu, (_, gap, letter) => gap + letter.toLocaleUpperCase());
}
