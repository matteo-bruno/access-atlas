// Which published cities are hidden by default, because their data is too
// thin to compare.
//
// Some exports describe places where there is next to nothing to measure: a
// town of a few thousand people, or a city whose services OpenStreetMap has
// barely mapped, so every resident appears to be an hour's walk from
// everything. Their figures are computed faithfully and still mean nothing
// beside the others. They stay published (their city view opens as before),
// but the world maps and the Stats page leave them out unless asked.
//
// One rule, used by buildIndex (the world-map markers) and by the statistics,
// so the two can never disagree about which cities are hidden. The values it
// reads are ones already published: the city's residents (its grid) and
// 15minCity's population-weighted median walking time to the nine
// categories, the figure its world-map marker carries.

export const MIN_POPULATION = 10000;
export const MAX_PROXIMITY_MINUTES = 60;

/**
 * Why a city is hidden by default, or null.
 *
 * @param {{ population?: number, proximityMinutes?: number }} figures
 * @returns {'population'|'proximity'|null}
 */
export function hiddenReason({ population, proximityMinutes }) {
  if (Number.isFinite(population) && population < MIN_POPULATION) return 'population';
  if (Number.isFinite(proximityMinutes) && proximityMinutes > MAX_PROXIMITY_MINUTES) return 'proximity';
  return null;
}

/**
 * The rule applied to a city's record. A variant has no marker of its own, so
 * its walking time comes from the statistics when the caller has them.
 */
export function recordHiddenReason(record, fallbackMinutes = null) {
  const marker = record.platforms?.fifteen?.marker?.properties?.proximityMinutes;
  return hiddenReason({
    population: record.atlas?.population,
    proximityMinutes: Number.isFinite(marker) ? marker : fallbackMinutes,
  });
}

/** "2 hidden (lagos: proximity, …)" for a run's log. */
export function describeHidden(hidden) {
  if (!hidden.length) return 'none hidden';
  return `${hidden.length} hidden (${hidden.map((h) => `${h.id}: ${h.reason}`).join(', ')})`;
}
