// The tools CityChat's model can call, over the published data.
//
// The model never states a figure it did not get from here. Every number an
// answer carries is computed by this file from public/data/, with the same
// code the viewer runs (grid.js, adapters.js), so the chat and the map cannot
// disagree about a city. numbers.mjs then checks the answer against what these
// tools returned.
//
// Results are plain JSON, kept small: a model reads every byte of them.

import path from 'node:path';
import { readDataJSON } from '../../scripts/lib/datafile.mjs';
import { meshFromAtlas } from '../../src/data/adapters.js';
import { gridFeatures, layerPositions, mergeLayer } from '../../src/data/grid.js';
import { CATEGORIES, MODES } from '../../src/data/fifteen.js';
import { DEFAULT_HOUR } from '../../src/data/citychrone.js';
import { PLATFORMS_BY_ID, ZONES } from '../../src/data/platforms.js';

const LAYERS = ['fifteen', 'citychrone', 'cardep', 'pov'];
const UNREACHABLE = 99999;
const ZONE_NAMES = ['inclusion', 'spatial isolation', 'social isolation', 'total isolation'];

const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000);

/** A tool's input was wrong in a way the model can fix: it sees the message. */
export class ToolInputError extends Error {}

// ── Data access ─────────────────────────────────────────────────────────

export function createDataStore(dataDir) {
  const read = (rel) => readDataJSON(path.join(dataDir, rel));
  let catalogue = null;
  const cities = new Map(); // id → loaded city, most recent last
  const MAX_CITIES = 4;

  const getCatalogue = () => {
    catalogue ??= read('index.json');
    return catalogue;
  };

  const atlasEntry = (cityId) => {
    const key = String(cityId ?? '').trim().toLowerCase();
    const list = getCatalogue().atlas?.cities ?? [];
    const found = list.find(
      (c) => c.id === key || c.name?.toLowerCase() === key || c.nameIt?.toLowerCase() === key,
    );
    if (!found) {
      throw new ToolInputError(
        `Unknown city "${cityId}". Call list_cities for the published ids.`,
      );
    }
    return found;
  };

  /** Grid, every layer file and the merged mesh for one city, cached. */
  const loadCity = async (cityId) => {
    const entry = atlasEntry(cityId);
    if (cities.has(entry.id)) {
      const hit = cities.get(entry.id);
      cities.delete(entry.id);
      cities.set(entry.id, hit);
      return hit;
    }
    const grid = read(entry.grid);
    const files = {};
    let features = await gridFeatures(grid);
    for (const layer of entry.layers ?? []) {
      const rel = entry.layerData?.[layer];
      if (!rel) continue;
      files[layer] = read(rel);
      features = mergeLayer(features, layer, files[layer]);
    }
    const mesh = meshFromAtlas({ type: 'FeatureCollection', features }, entry);
    const city = { entry, grid, files, features, mesh };
    cities.set(entry.id, city);
    if (cities.size > MAX_CITIES) cities.delete(cities.keys().next().value);
    return city;
  };

  const summaryRows = (platformId) => {
    const rel = getCatalogue().platforms?.[platformId]?.summary;
    return rel ? read(rel).cities ?? [] : null;
  };

  return { getCatalogue, atlasEntry, loadCity, summaryRows };
}

// ── Helpers over one layer file ─────────────────────────────────────────

/** Median of plain values (the upper middle, as the viewer's summaries take it). */
function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted.length ? sorted[sorted.length >> 1] : null;
}

/** The value at which half the weight lies on each side. */
function weightedMedian(values, weights) {
  const pairs = [];
  for (let i = 0; i < values.length; i++) {
    if (Number.isFinite(values[i])) pairs.push([values[i], Math.max(0, weights[i] || 0)]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  if (!total) return null;
  let acc = 0;
  for (const [v, w] of pairs) {
    acc += w;
    if (acc >= total / 2) return v;
  }
  return pairs[pairs.length - 1][0];
}

/** Share (in %) of cells and of residents whose value passes `test`. */
function shares(values, population, test) {
  let cells = 0;
  let hit = 0;
  let pop = 0;
  let popHit = 0;
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) continue;
    const p = Math.max(0, population[i] || 0);
    cells++;
    pop += p;
    if (test(values[i])) {
      hit++;
      popHit += p;
    }
  }
  return {
    cellShare: cells ? r1((hit / cells) * 100) : null,
    residentShare: pop ? r1((popHit / pop) * 100) : null,
  };
}

/** 15minCity's per-row values for one measure, unreachable as null. */
function fifteenColumn(file, category, mode) {
  if (category !== 'proximity_time') {
    return (file.fields[`${category}_${mode}`] ?? []).map((v) =>
      Number.isFinite(v) && v !== UNREACHABLE ? v : null,
    );
  }
  // The average over the nine categories, rounded as grid.js rounds it.
  const keys = CATEGORIES.filter((c) => c.key !== 'proximity_time').map((c) => `${c.key}_${mode}`);
  const rows = file.idx.length;
  const out = new Array(rows);
  for (let row = 0; row < rows; row++) {
    let sum = 0;
    let n = 0;
    for (const key of keys) {
      const v = file.fields[key]?.[row];
      if (Number.isFinite(v) && v !== UNREACHABLE) {
        sum += v;
        n++;
      }
    }
    out[row] = n ? Math.round((sum / n) * 10) / 10 : (file.fields[`proximity_time_${mode}`]?.[row] ?? null);
  }
  return out;
}

const FIFTEEN_CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
const FIFTEEN_MODE_KEYS = MODES.map((m) => m.key);

/**
 * One measure of one layer as a column over the layer's rows.
 * Returns { values, unit, direction } where direction says which end is
 * "better" for a reader, or null when the measure has no such reading.
 */
function measureColumn(city, layer, metric, { hour = DEFAULT_HOUR } = {}) {
  const file = city.files[layer];
  if (!file) throw new ToolInputError(`${city.entry.id} has no published ${layer} layer.`);
  if (layer === 'fifteen') {
    const [category, mode] = splitFifteen(metric);
    return {
      values: fifteenColumn(file, category, mode),
      unit: 'minutes',
      direction: 'lower means closer to services',
      label: `${category}_${mode}`,
    };
  }
  if (layer === 'citychrone') {
    const hours = file.hourly?.hours ?? 0;
    const h = clampHour(hour, hours);
    if (metric === 'velocity') {
      return { values: file.hourly.v[h], unit: 'km/h-like velocity score', direction: 'higher means faster public transport', label: `velocity at ${pad(h)}:00` };
    }
    if (metric === 'sociality') {
      return { values: file.hourly.s[h], unit: 'score (weighted count of reachable people, not a headcount)', direction: 'higher means more people reachable', label: `sociality at ${pad(h)}:00` };
    }
    throw new ToolInputError('citychrone metrics are "velocity" and "sociality".');
  }
  if (layer === 'cardep') {
    if (metric === 'cdi') return { values: file.fields.cdi, unit: 'index in [-1, +1]', direction: 'lower means transit competes better with the car', label: 'CDI' };
    if (metric === 'o_score_car') return { values: file.fields.o_score_car, unit: 'score', direction: 'higher means more opportunities by car', label: 'opportunities by car' };
    if (metric === 'o_score_pt') return { values: file.fields.o_score_pt, unit: 'score', direction: 'higher means more opportunities by transit', label: 'opportunities by transit' };
    throw new ToolInputError('cardep metrics are "cdi", "o_score_car" and "o_score_pt".');
  }
  if (layer === 'pov') {
    if (metric === 'proximity' || metric === 'opportunity') {
      return { values: file.fields[metric], unit: 'score (weighted count of points of interest, no unit)', direction: 'higher is better', label: metric };
    }
    throw new ToolInputError('pov metrics are "proximity" and "opportunity".');
  }
  throw new ToolInputError(`Unknown layer "${layer}".`);
}

function splitFifteen(metric = 'proximity_time_foot') {
  const mode = FIFTEEN_MODE_KEYS.find((m) => metric.endsWith(`_${m}`));
  const category = mode ? metric.slice(0, -(mode.length + 1)) : null;
  if (!mode || !FIFTEEN_CATEGORY_KEYS.includes(category)) {
    throw new ToolInputError(
      `fifteen metrics are <category>_<mode> with category in ${FIFTEEN_CATEGORY_KEYS.join(', ')} and mode in ${FIFTEEN_MODE_KEYS.join(', ')}.`,
    );
  }
  return [category, mode];
}

const pad = (h) => String(h).padStart(2, '0');
const clampHour = (hour, hours) => Math.min(Math.max(0, Number.parseInt(hour, 10) || 0), Math.max(0, hours - 1));

/** Where the chat's "show on map" buttons go: the city view, on that layer. */
function mapUrl(cityId, { layer, metric, hour, cell } = {}) {
  const q = new URLSearchParams();
  if (layer) q.set('layer', layer);
  if (layer === 'fifteen' && metric) {
    const [category, mode] = splitFifteen(metric);
    q.set('cat', category);
    q.set('mode', mode);
  }
  if (layer === 'citychrone') {
    if (metric === 'sociality') q.set('view', 'sociality');
    if (hour != null) q.set('hour', String(hour));
  }
  if (cell) q.set('cell', cell);
  const qs = q.toString();
  return `/atlas/${cityId}${qs ? `?${qs}` : ''}`;
}

function layerFigures(city, layer) {
  const file = city.files[layer];
  const own = city.mesh.layers[layer];
  const pop = file.fields.population ?? [];
  const base = {
    platform: PLATFORMS_BY_ID[layer]?.name,
    cells: own.cells,
    areaKm2: own.areaKm2,
    population: Math.round(pop.reduce((s, p) => s + (p || 0), 0)),
  };
  if (layer === 'pov') {
    const zone = file.fields.zone;
    const zoneShares = {};
    const zonePopulationShares = {};
    const total = pop.reduce((s, p) => s + (p || 0), 0);
    ZONES.forEach((z, i) => {
      zoneShares[ZONE_NAMES[i]] = own.zoneShares?.[i] ?? null;
      const zp = zone.reduce((s, v, row) => s + (v === i ? pop[row] || 0 : 0), 0);
      zonePopulationShares[ZONE_NAMES[i]] = total ? r1((zp / total) * 100) : null;
    });
    return {
      ...base,
      medianProximity: r1(median(file.fields.proximity)),
      medianOpportunity: r1(median(file.fields.opportunity)),
      zoneThresholds: file.meta?.thresholds ?? null,
      zoneSharesOfCells: zoneShares,
      zoneSharesOfResidents: zonePopulationShares,
    };
  }
  if (layer === 'cardep') {
    const cdi = file.fields.cdi;
    return {
      ...base,
      medianCdi: own.medianCdi,
      cdiForAverageResident: own.weightedCdi,
      transitAdvantaged: shares(cdi, pop, (v) => v < -0.05),
      balanced: shares(cdi, pop, (v) => v >= -0.05 && v <= 0.05),
      carAdvantaged: shares(cdi, pop, (v) => v > 0.05),
    };
  }
  if (layer === 'fifteen') {
    const out = { ...base };
    for (const mode of FIFTEEN_MODE_KEYS) {
      const values = fifteenColumn(file, 'proximity_time', mode);
      out[`average_${mode}`] = {
        medianMinutesPerCell: r1(median(values)),
        medianMinutesPerResident: r1(weightedMedian(values, pop)),
        within15Minutes: shares(values, pop, (v) => v <= 15),
      };
    }
    return out;
  }
  if (layer === 'citychrone') {
    const h = clampHour(DEFAULT_HOUR, file.hourly?.hours ?? 0);
    return {
      ...base,
      hour: `${pad(h)}:00`,
      medianVelocityPerCell: r2(median(file.hourly.v[h])),
      medianVelocityPerResident: r2(weightedMedian(file.hourly.v[h], pop)),
      medianSocialityPerResident: Math.round(weightedMedian(file.hourly.s[h], pop) ?? 0) || null,
    };
  }
  return base;
}

// ── The tools ───────────────────────────────────────────────────────────

const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
const num = (description) => ({ type: 'number', description });
const int = (description) => ({ type: 'integer', description });

const FIFTEEN_METRIC_HELP =
  `For "fifteen": <category>_<mode>, category one of ${FIFTEEN_CATEGORY_KEYS.join(', ')} ` +
  `(proximity_time is the average of the other nine), mode one of ${FIFTEEN_MODE_KEYS.join(', ')}. ` +
  'For "citychrone": velocity | sociality. For "cardep": cdi | o_score_car | o_score_pt. ' +
  'For "pov": proximity | opportunity.';

export const TOOL_DEFINITIONS = [
  {
    name: 'list_cities',
    description:
      'Lists every published city with its id, names, country and which layers it carries. Call this first whenever the user names a city, to get its id.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'city_overview',
    description:
      'Headline figures for one city on every layer it carries: cells, area, population and each layer\'s summary (P.O.V. zone shares of cells and of residents, CDI median and for the average resident, 15-minute medians and shares within 15 minutes, CityChrone medians at 08:00).',
    parameters: {
      type: 'object',
      properties: { city: str('City id from list_cities, e.g. "milan".') },
      required: ['city'],
    },
  },
  {
    name: 'layer_detail',
    description:
      'Deeper figures for one layer of one city. fifteen: median minutes and share within 15 minutes for every category and mode. citychrone: the daily profile, medians for each hour. cardep: opportunities by car and by transit. pov: thresholds and both kinds of zone share.',
    parameters: {
      type: 'object',
      properties: {
        city: str('City id.'),
        layer: str('Layer id.', { enum: LAYERS }),
      },
      required: ['city', 'layer'],
    },
  },
  {
    name: 'rank_cells',
    description:
      'The cells with the highest or lowest value of a measure in a city, among populated cells. Use it to find where a city does best or worst. Each result has coordinates and its population; results are 200 m cells, not named neighbourhoods.',
    parameters: {
      type: 'object',
      properties: {
        city: str('City id.'),
        layer: str('Layer id.', { enum: LAYERS }),
        metric: str(`Measure. ${FIFTEEN_METRIC_HELP}`),
        order: str('Which end.', { enum: ['highest', 'lowest'] }),
        limit: int('How many cells, 1 to 10. Default 5.'),
        minPopulation: num('Skip cells with fewer residents than this. Default 1.'),
        hour: int('CityChrone only: hour of day, 0 to 23. Default 8.'),
      },
      required: ['city', 'layer', 'metric', 'order'],
    },
  },
  {
    name: 'cell_at',
    description:
      'Everything published for the 200 m cell at a coordinate: every layer\'s values, its residents, and where it stands in its city (share of the layer\'s residents living in cells with a lower value). Use it when the user asks about a specific place. If you derive the coordinate from a place name yourself, say that the location is approximate.',
    parameters: {
      type: 'object',
      properties: {
        city: str('City id.'),
        lat: num('Latitude, WGS84.'),
        lon: num('Longitude, WGS84.'),
      },
      required: ['city', 'lat', 'lon'],
    },
  },
  {
    name: 'compare_cities',
    description:
      'One row per published city for a platform, from its summary file. Available for "cardep" (CDI, shares of cells favouring car or transit) and "pov" (zone shares of cells and of residents, medians). For the other layers call city_overview per city.',
    parameters: {
      type: 'object',
      properties: { platform: str('Platform id.', { enum: ['cardep', 'pov'] }) },
      required: ['platform'],
    },
  },
];

export function createTools(store) {
  const list_cities = () => {
    const cat = store.getCatalogue();
    return {
      cities: (cat.atlas?.cities ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        nameIt: c.nameIt,
        country: c.region,
        layers: c.layers,
      })),
      platforms: LAYERS.map((id) => ({ id, name: PLATFORMS_BY_ID[id]?.name })),
    };
  };

  const city_overview = async ({ city }) => {
    const c = await store.loadCity(city);
    const layers = {};
    for (const layer of c.entry.layers ?? []) if (c.files[layer]) layers[layer] = layerFigures(c, layer);
    return {
      city: c.entry.id,
      name: c.entry.name,
      country: c.entry.region,
      gridCells: c.mesh.stats.cellCount,
      gridAreaKm2: c.mesh.stats.areaKm2,
      gridPopulation: Math.round(c.mesh.stats.population ?? 0),
      note: 'Each layer covers its own set of cells; a layer\'s figures describe its own cells and population, not the whole grid.',
      layers,
      mapUrl: mapUrl(c.entry.id),
    };
  };

  const layer_detail = async ({ city, layer }) => {
    const c = await store.loadCity(city);
    const file = c.files[layer];
    if (!file) throw new ToolInputError(`${c.entry.id} has no published ${layer} layer.`);
    const out = { city: c.entry.id, layer, ...layerFigures(c, layer) };
    const pop = file.fields.population ?? [];
    if (layer === 'fifteen') {
      out.byCategory = {};
      for (const category of FIFTEEN_CATEGORY_KEYS) {
        for (const mode of FIFTEEN_MODE_KEYS) {
          const values = fifteenColumn(file, category, mode);
          out.byCategory[`${category}_${mode}`] = {
            medianMinutesPerResident: r1(weightedMedian(values, pop)),
            within15Minutes: shares(values, pop, (v) => v <= 15),
          };
        }
      }
    }
    if (layer === 'citychrone') {
      out.byHour = file.hourly.v.map((v, h) => ({
        hour: `${pad(h)}:00`,
        medianVelocityPerResident: r2(weightedMedian(v, pop)),
        medianSocialityPerResident: Math.round(weightedMedian(file.hourly.s[h], pop) ?? 0) || null,
      }));
    }
    if (layer === 'cardep') {
      out.opportunitiesForAverageResident = {
        byCar: r1(weighted(file.fields.o_score_car, pop)),
        byTransit: r1(weighted(file.fields.o_score_pt, pop)),
      };
    }
    out.mapUrl = mapUrl(c.entry.id, { layer });
    return out;
  };

  const rank_cells = async ({ city, layer, metric, order, limit = 5, minPopulation = 1, hour = DEFAULT_HOUR }) => {
    const c = await store.loadCity(city);
    const col = measureColumn(c, layer, metric, { hour });
    const file = c.files[layer];
    const positions = layerPositions(file);
    const pop = c.grid.population;
    const n = Math.min(10, Math.max(1, Number.parseInt(limit, 10) || 5));
    const rows = [];
    for (let row = 0; row < positions.length; row++) {
      const v = col.values[row];
      const p = pop[positions[row]] ?? 0;
      if (Number.isFinite(v) && p >= minPopulation) rows.push([v, row, p]);
    }
    rows.sort((a, b) => (order === 'lowest' ? a[0] - b[0] : b[0] - a[0]));
    const h3 = await import('h3-js');
    return {
      city: c.entry.id,
      layer,
      measure: col.label,
      unit: col.unit,
      reading: col.direction,
      cellsConsidered: rows.length,
      cells: rows.slice(0, n).map(([value, row, p]) => {
        const cell = c.grid.cells[positions[row]];
        const [lat, lon] = h3.cellToLatLng(cell);
        return {
          h3: cell,
          lat: r3(lat),
          lon: r3(lon),
          value: layer === 'cardep' && metric === 'cdi' ? r3(value) : r2(value),
          residents: Math.round(p),
          mapUrl: mapUrl(c.entry.id, { layer, metric, hour: layer === 'citychrone' ? hour : undefined, cell }),
        };
      }),
    };
  };

  const cell_at = async ({ city, lat, lon }) => {
    const c = await store.loadCity(city);
    const h3 = await import('h3-js');
    const cell = h3.latLngToCell(Number(lat), Number(lon), c.grid.resolution ?? 9);
    const at = c.grid.cells.indexOf(cell);
    if (at < 0) {
      return { city: c.entry.id, h3: cell, covered: false, note: 'No published layer covers this point.' };
    }
    const out = {
      city: c.entry.id,
      h3: cell,
      covered: true,
      residents: Math.round(c.grid.population[at] ?? 0),
      layers: {},
      mapUrl: mapUrl(c.entry.id, { cell }),
    };
    const standing = (layer, metric, row) => {
      const col = measureColumn(c, layer, metric);
      const pop = c.files[layer].fields.population ?? [];
      const v = col.values[row];
      if (!Number.isFinite(v)) return { value: null };
      const below = shares(col.values, pop, (x) => x < v);
      return {
        value: layer === 'cardep' && metric === 'cdi' ? r3(v) : r2(v),
        residentsInCellsWithLowerValue: below.residentShare,
        reading: col.direction,
      };
    };
    for (const layer of c.entry.layers ?? []) {
      const file = c.files[layer];
      if (!file) continue;
      const row = layerPositions(file).indexOf(at);
      if (row < 0) {
        out.layers[layer] = { covered: false };
        continue;
      }
      if (layer === 'pov') {
        out.layers.pov = {
          zone: ZONE_NAMES[file.fields.zone[row]],
          proximity: standing('pov', 'proximity', row),
          opportunity: standing('pov', 'opportunity', row),
          zoneThresholds: file.meta?.thresholds ?? null,
        };
      } else if (layer === 'cardep') {
        out.layers.cardep = {
          cdi: standing('cardep', 'cdi', row),
          opportunitiesByCar: r1(file.fields.o_score_car[row]),
          opportunitiesByTransit: r1(file.fields.o_score_pt[row]),
        };
      } else if (layer === 'fifteen') {
        const minutes = {};
        for (const category of FIFTEEN_CATEGORY_KEYS) {
          for (const mode of FIFTEEN_MODE_KEYS) {
            const v = fifteenColumn(file, category, mode)[row];
            minutes[`${category}_${mode}`] = v == null ? 'unreachable' : v;
          }
        }
        out.layers.fifteen = {
          minutes,
          averageOnFoot: standing('fifteen', 'proximity_time_foot', row),
          averageByBicycle: standing('fifteen', 'proximity_time_bicycle', row),
        };
      } else if (layer === 'citychrone') {
        out.layers.citychrone = {
          hour: `${pad(DEFAULT_HOUR)}:00`,
          velocity: standing('citychrone', 'velocity', row),
          sociality: standing('citychrone', 'sociality', row),
        };
      }
    }
    return out;
  };

  const compare_cities = ({ platform }) => {
    const rows = store.summaryRows(platform);
    if (!rows) throw new ToolInputError(`${platform} publishes no comparison summary.`);
    const names = new Map((store.getCatalogue().atlas?.cities ?? []).map((c) => [c.id, c.name]));
    return {
      platform,
      cities: rows.map(({ cdf, ...row }) => {
        const out = { ...row, name: names.get(row.id) ?? row.id };
        if (platform === 'pov') {
          // Zone arrays → named objects, so the model cannot misread an index.
          for (const key of ['zoneShares', 'zonePopulationShares']) {
            if (Array.isArray(row[key])) {
              out[key] = Object.fromEntries(ZONE_NAMES.map((z, i) => [z, row[key][i]]));
            }
          }
        }
        return out;
      }),
      note: platform === 'pov'
        ? 'zoneShares are shares of cells, zonePopulationShares shares of residents. Zones compare places within a city only.'
        : 'ptShare / carShare are shares of cells with CDI below -0.05 / above +0.05. weightedCdi is the CDI for the average resident.',
    };
  };

  const handlers = { list_cities, city_overview, layer_detail, rank_cells, cell_at, compare_cities };

  /** Run one tool call. Errors come back as results, so the model can recover. */
  return async function runTool(name, args = {}) {
    const handler = handlers[name];
    if (!handler) return { error: `Unknown tool "${name}".` };
    try {
      return await handler(args ?? {});
    } catch (error) {
      if (error instanceof ToolInputError) return { error: error.message };
      console.error(`[citychat] tool ${name} failed`, error);
      return { error: 'The tool failed on the server.' };
    }
  };
}

function weighted(values, weights) {
  let sum = 0;
  let w = 0;
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) continue;
    const p = Math.max(0, weights[i] || 0);
    sum += values[i] * p;
    w += p;
  }
  return w ? sum / w : null;
}
