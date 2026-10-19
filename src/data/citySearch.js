// Finding a city by what someone types. One rule for the site's search box
// (CitySearch) and CityChat's find_cities tool, so the two answer a name the
// same way.

// Lower case, accents off: "zurich" finds Zürich, "sao" São Paulo.
export const fold = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

/** What a city can be found by: its names in every language, then its place. */
export function searchEntry(city) {
  return {
    city,
    names: [...new Set([city.name, city.nameIt].filter(Boolean).map(fold))],
    places: [city.region, city.regionIt, city.country].filter(Boolean).map(fold),
  };
}

/**
 * How well one city answers a query, lower is better, or null for no match.
 *
 * A name that starts with the query beats one with a word that does, which
 * beats one that merely contains it; a country or region match comes last,
 * so "ber" puts Berlin before every city in Bermuda would. Every name the
 * catalogue has counts (English and Italian), whichever language is on.
 */
export function matchScore(entry, query) {
  let best = null;
  for (const name of entry.names) {
    let s = null;
    if (name.startsWith(query)) s = 0;
    else if (name.split(/[\s\-'’.]+/).some((word) => word.startsWith(query))) s = 1;
    else if (name.includes(query)) s = 2;
    if (s != null && (best == null || s < best)) best = s;
  }
  if (best != null) return best;
  if (entry.places.some((place) => place.startsWith(query))) return 3;
  return null;
}

/**
 * The cities matching a query, best first: by how well they match, a core
 * before its metro area, then the larger city first.
 *
 * @param {object[]} index   `searchEntry` of every city
 * @param {string} query
 * @param {number} [limit]
 */
export function searchCities(index, query, limit = Infinity) {
  const q = fold(String(query ?? '').trim());
  if (!q) return [];
  return index
    .map((entry) => ({ entry, s: matchScore(entry, q) }))
    .filter(({ s }) => s != null)
    .sort(
      (a, b) =>
        a.s - b.s ||
        (a.entry.city.extent === 'fua') - (b.entry.city.extent === 'fua') ||
        (b.entry.city.population ?? 0) - (a.entry.city.population ?? 0) ||
        a.entry.city.name.localeCompare(b.entry.city.name),
    )
    .slice(0, limit)
    .map(({ entry }) => entry.city);
}
