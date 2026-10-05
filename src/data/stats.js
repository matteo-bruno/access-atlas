// ─────────────────────────────────────────────────────────────────────────
// The published statistics, as the Stats page reads them.
//
// The file is written by scripts/lib/stats.mjs (format and method at the top
// of that file): one entry per measure, one figure object per city and
// measure, the countries pooled from their cities. Nothing here computes a
// figure from cells; it reads the ones published, picks one of them out of
// a figure object, and decides how to order, colour and print it.
// ─────────────────────────────────────────────────────────────────────────

import { CATEGORIES as FIFTEEN_CATEGORIES, MODES as FIFTEEN_MODES, formatTime } from './fifteen.js';
import { RAMPS } from '../map/ramps.js';
import { BRAND } from './brand.js';

/** Null unless the file is the statistics this code knows how to read. */
export function normaliseStats(raw) {
  if (!raw || raw.format !== 'atlas-stats' || !Array.isArray(raw.measures) || !Array.isArray(raw.cities)) {
    return null;
  }
  const measures = raw.measures.filter((m) => m && typeof m.id === 'string' && Array.isArray(raw.values?.[m.id]));
  if (!measures.length || !raw.cities.length) return null;
  const computed = raw.cities.map((c) => c.computedAt).filter(Boolean).sort();
  return {
    measures,
    measuresById: Object.fromEntries(measures.map((m) => [m.id, m])),
    cities: raw.cities,
    values: raw.values,
    countries: Array.isArray(raw.countries) ? raw.countries : [],
    omitted: Array.isArray(raw.omitted) ? raw.omitted : [],
    computedAt: computed.length ? computed[computed.length - 1] : null,
  };
}

// ── the layers and measures, as the pickers list them ────────────────

export const STATS_LAYERS = ['pov', 'cardep', 'fifteen', 'citychrone', 'cross'];

/** The layers the file has any measure for, in the site's order. */
export function layersOf(stats) {
  const present = new Set(stats.measures.map((m) => m.layer));
  return STATS_LAYERS.filter((l) => present.has(l));
}

const DISTRIBUTION = new Set(['score', 'index', 'minutes']);
export const isDistribution = (measure) => DISTRIBUTION.has(measure?.kind);

/**
 * Which statistics a measure offers. For countries, only the ones that
 * pool: a mean and a share of residents are what the cities' residents give
 * together; a median or a Gini of several cities cannot be had from theirs.
 */
export function statKeys(measure, unit = 'city') {
  if (!measure) return [];
  if (measure.kind === 'zones') return ['zone'];
  if (measure.kind === 'correlation') return unit === 'city' ? ['value'] : [];
  const keys =
    unit === 'country'
      ? ['mean', 'share']
      : ['p50', 'mean', 'p10', 'p25', 'p75', 'p90', 'share', 'gini', 'theil', 'ratio'];
  if (measure.sentinel != null) keys.push('unreachable');
  return keys.filter((k) => k !== 'share' || measure.thresholds?.length);
}

export const POOLED = new Set(['mean', 'share', 'unreachable', 'zone']);

/** The default statistic for a measure. */
export function defaultStat(measure, unit = 'city') {
  const keys = statKeys(measure, unit);
  if (keys.includes('p50')) return 'p50';
  return keys[0] ?? null;
}

const Q = { p10: 0, p25: 1, p50: 2, p75: 3, p90: 4 };

/** One number out of a figure object, or null. */
export function statValue(stat, key, index = 0) {
  if (!stat) return null;
  let v = null;
  if (key in Q) v = stat.q?.[Q[key]];
  else if (key === 'share' || key === 'zone') v = stat.shares?.[index];
  else v = stat[key];
  return Number.isFinite(v) ? v : null;
}

/**
 * Which way is better for a statistic: 'up', 'down' or null.
 *
 * A level follows its measure. A share of residents is better high when the
 * residents it counts are the well-served ones. Inequality is ordered least
 * unequal first, which is a convention rather than a finding, and the page
 * labels the order as "lowest first" there rather than "best first".
 */
export function statDirection(measure, key, index = 0) {
  if (!measure) return null;
  if (key in Q || key === 'mean') return measure.direction;
  if (key === 'share') {
    if (!measure.direction) return null;
    const countsHigh = measure.side !== 'atMost';
    return countsHigh === (measure.direction === 'up') ? 'up' : 'down';
  }
  if (key === 'zone') return index === 0 ? 'up' : index === 3 ? 'down' : null;
  if (key === 'unreachable') return 'down';
  return null;
}

/** Whether a statistic's order is a judgement ("best first") or only an order. */
export const isJudged = (key) => key in Q || ['mean', 'share', 'zone', 'unreachable'].includes(key);

/**
 * The rows a view draws: one per city, or one per country.
 * Each row is `{ id, kind, name, nameIt, country, stat, population, cities? }`.
 */
export function statRows(stats, unit, measureId) {
  const column = stats.values[measureId] ?? [];
  if (unit === 'country') {
    return stats.countries.map((c) => ({
      id: c.iso,
      kind: 'country',
      name: c.name,
      nameIt: c.nameIt,
      country: c.iso,
      stat: c.values?.[measureId] ?? null,
      cities: c.cities,
      center: countryCentre(stats, c),
      population: c.values?.[measureId]?.population ?? null,
    }));
  }
  return stats.cities.map((c, i) => ({
    id: c.id,
    kind: 'city',
    name: c.name,
    nameIt: c.nameIt,
    country: c.country,
    stat: column[i] ?? null,
    city: c,
    center: c.center,
    population: column[i]?.population ?? null,
  }));
}

/** A country's centre for the map: its cities' centres weighted by their residents. */
function countryCentre(stats, country) {
  const members = stats.cities.filter((c) => country.cities.includes(c.id) && Array.isArray(c.center));
  const total = members.reduce((s, c) => s + (c.population || 0), 0);
  if (!members.length || !total) return members[0]?.center ?? null;
  return [0, 1].map((k) => members.reduce((s, c) => s + c.center[k] * (c.population || 0), 0) / total);
}

/** Rows that have a value, ordered best first (or highest first where nothing is better). */
export function orderRows(rows, measure, key, index, reverse = false) {
  const direction = statDirection(measure, key, index) ?? 'up';
  const sign = (direction === 'up' ? -1 : 1) * (reverse ? -1 : 1);
  const withValue = rows.filter((r) => statValue(r.stat, key, index) != null);
  return withValue.sort((a, b) => sign * (statValue(a.stat, key, index) - statValue(b.stat, key, index)));
}

// ── names ────────────────────────────────────────────────────────────

/** A city's name: Italian where the catalogue has one, English otherwise. */
export function rowName(row, lang) {
  if (row.kind === 'country') return countryName(row.country, lang, row);
  return lang === 'it' ? row.nameIt ?? row.name : row.name;
}

const displayNames = new Map();
/** A country's name in the reader's language, from the browser, falling back to the file's. */
export function countryName(iso, lang, fallback) {
  try {
    if (!displayNames.has(lang)) displayNames.set(lang, new Intl.DisplayNames([lang], { type: 'region' }));
    const name = displayNames.get(lang).of(iso);
    if (name && name !== iso) return name;
  } catch {
    /* an engine without DisplayNames: the file's names below */
  }
  return lang === 'it' ? fallback?.nameIt ?? fallback?.name ?? iso : fallback?.name ?? iso;
}

const MEASURE_KEYS = {
  'pov.proximity': 'proximity',
  'pov.opportunity': 'opportunity',
  'pov.zonesCommon': 'zonesCommon',
  'pov.zonesCity': 'zonesCity',
  'cardep.cdi': 'cdi',
  'cardep.car': 'car',
  'cardep.pt': 'pt',
};

/** The key under `stats.about` that explains a measure. */
export function aboutKey(measure) {
  if (measure.layer === 'fifteen') return 'fifteen';
  if (measure.layer === 'citychrone') return measure.facets.score;
  if (measure.kind === 'correlation') return 'correlation';
  return MEASURE_KEYS[measure.id];
}

export function hourLabel(hour, t) {
  return hour === 'day' ? t('stats.day') : `${String(hour).padStart(2, '0')}:00`;
}

/** A measure's name, in full. */
export function measureLabel(measure, t, byId = {}) {
  if (!measure) return '';
  if (measure.layer === 'fifteen') {
    const category = FIFTEEN_CATEGORIES.find((c) => c.key === measure.facets.category);
    const mode = FIFTEEN_MODES.find((m) => m.key === measure.facets.mode);
    return `${t(`fifteen.categories.${category?.i18n}`)} · ${t(`fifteen.modes.${mode?.i18n}`)}`;
  }
  if (measure.layer === 'citychrone') {
    return `${t(`stats.measures.${measure.facets.score}`)} · ${hourLabel(measure.facets.hour, t)}`;
  }
  if (measure.kind === 'correlation') {
    return measure.pair.map((id) => measureLabel(byId[id] ?? { id, facets: {} }, t, byId) || id).join(' ↔ ');
  }
  return t(`stats.measures.${MEASURE_KEYS[measure.id]}`);
}

/** A threshold as a reader meets it: minutes, a signed index, a score. */
export function formatThreshold(measure, value, n) {
  if (measure.kind === 'minutes') return `${n(value)} min`;
  if (measure.signed) return signed(value, n, 1);
  return n(value);
}

/** What a statistic is called, with its threshold or zone where it has one. */
export function statLabel(measure, key, index, t, n) {
  if (key === 'share') {
    const value = measure.thresholds?.[index];
    return `${t('stats.statLabels.share')} ${t(`stats.side.${measure.side}`, { value: formatThreshold(measure, value, n) })}`;
  }
  if (key === 'zone') return `${t('stats.statLabels.zone')}: ${t(`city.zones.${ZONE_KEYS[index]}.name`)}`;
  return t(`stats.statLabels.${key}`);
}

export const ZONE_KEYS = ['inclusion', 'spatial', 'social', 'total'];

// ── printing a value ─────────────────────────────────────────────────

function signed(value, n, digits) {
  const text = n(Math.abs(value), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (value === 0) return text;
  return value < 0 ? `−${text}` : `+${text}`;
}

/**
 * A figure as text. Travel times read as a clock (CLAUDE.md: nobody says
 * "three point nine nine minutes"); a share carries its sign; a score has no
 * unit, because it has none.
 */
export function formatStat(measure, key, value, { n, t }) {
  if (value == null) return '—';
  if (['share', 'zone', 'unreachable'].includes(key)) {
    return `${n(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }
  if (key === 'gini' || key === 'theil') return n(value, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  if (key === 'ratio') return `${n(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
  if (key === 'value') return signed(value, n, 2);
  if (measure.kind === 'minutes') {
    if (measure.sentinel != null && value >= measure.sentinel) return t('stats.unreachableValue');
    return formatTime(value);
  }
  if (measure.signed) return signed(value, n, key === 'mean' ? 3 : 2);
  const digits = Math.min(measure.decimals ?? 1, value >= 1000 ? 0 : 2);
  return n(value, { maximumFractionDigits: digits });
}

// ── colour ───────────────────────────────────────────────────────────
//
// Domains are fixed, never fitted to what is on screen (CLAUDE.md, "Colour"):
// a city keeps its colour whatever the filter shows beside it. A level uses
// the ramp its layer is drawn with on the city view where it has one.

const SEQUENTIAL = (to) => ({
  stops: [
    [0, '#eef1f2'],
    [to * 0.25, '#bccfdc'],
    [to * 0.5, '#7fa3bf'],
    [to * 0.75, '#3b6e8f'],
    [to, BRAND.navy],
  ],
  ticks: [0, to / 2, to],
});

export const STAT_RAMPS = {
  share: SEQUENTIAL(100),
  // Published Ginis run 0.03 (Porto, reach by car) to 0.47 (Rome, CityChrone
  // sociality at night); Theils 0.002 to 0.38; 90/10 ratios 1.2 to 54, the
  // tail all night-time sociality, so the ramp stops at 10 and saturates.
  gini: SEQUENTIAL(0.5),
  theil: SEQUENTIAL(0.4),
  ratio: { ...SEQUENTIAL(10), stops: SEQUENTIAL(10).stops.map(([v, c], i) => [i === 0 ? 1 : v, c]), ticks: [1, 5, 10] },
  correlation: {
    stops: [
      [-1, '#2b5f86'],
      [0, '#eae6da'],
      [1, '#a04640'],
    ],
    ticks: [-1, 0, 1],
    signed: true,
  },
  // Pooled population-weighted p90 across published cities: proximity
  // 15,349, opportunity 48,509, reach by car 8,761 and by transit 6,488.
  proximity: SEQUENTIAL(20000),
  opportunity: SEQUENTIAL(60000),
  reach: SEQUENTIAL(10000),
};

/** The ramp a statistic is coloured with, or null where colour would mean nothing. */
export function statRamp(measure, key) {
  if (!measure) return null;
  if (['share', 'zone', 'unreachable'].includes(key)) return STAT_RAMPS.share;
  if (key === 'gini' || key === 'theil' || key === 'ratio') return STAT_RAMPS[key];
  if (key === 'value') return STAT_RAMPS.correlation;
  if (measure.layer === 'fifteen') return RAMPS.fifteen;
  if (measure.id === 'cardep.cdi') return RAMPS.cdi;
  if (measure.layer === 'citychrone') return measure.facets.score === 'velocity' ? RAMPS.velocity : RAMPS.sociality;
  if (measure.id === 'pov.proximity') return STAT_RAMPS.proximity;
  if (measure.id === 'pov.opportunity') return STAT_RAMPS.opportunity;
  if (measure.layer === 'cardep') return STAT_RAMPS.reach;
  return null;
}

/**
 * Highlight colours, one per slot. A city keeps its slot while it is
 * highlighted, so removing one never repaints the others. The first four
 * slots of the reference categorical palette, validated together for lines
 * (worst adjacent CVD ΔE 9.1); the two below 3:1 contrast are why every
 * highlighted line carries its name.
 */
export const HIGHLIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
export const MAX_HIGHLIGHT = HIGHLIGHT.length;

/** The measures the matrix shows by default, where published. */
export const HEADLINES = [
  ['pov.proximity', 'p50'],
  ['pov.opportunity', 'p50'],
  ['pov.zonesCommon', 'zone', 0],
  ['cardep.cdi', 'mean'],
  ['cardep.pt', 'p50'],
  ['fifteen.proximity_time.foot', 'p50'],
  ['fifteen.proximity_time.foot', 'share', 2],
  ['citychrone.velocity.day', 'p50'],
  ['citychrone.sociality.day', 'p50'],
];

/** Every city flag worth a warning beside its row, for one layer. */
export function cityFlags(row, layer) {
  if (row.kind === 'country') return row.cities?.length === 1 ? [{ key: 'single' }] : [];
  const flags = [];
  if (row.city?.variant) flags.push({ key: 'variant' });
  const coverage = row.city?.layers?.[layer]?.coverage;
  // A layer that covers less than nine in ten of the residents the Atlas has
  // for its city describes a part of it; the figure says which share.
  if (Number.isFinite(coverage) && coverage < 90) flags.push({ key: 'coverage', share: coverage });
  return flags;
}
