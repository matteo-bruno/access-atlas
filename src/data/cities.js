// ─────────────────────────────────────────────────────────────────────────
// SEED CITY LIST — placeholder until the real platform outputs are wired in.
//
// Coordinates are real (WGS84 lon/lat), so the markers land in the right place
// on a real basemap. The per-platform *values* (proximity minutes, velocity,
// CDI, P.O.V. zone) are deterministic pseudo-random stand-ins, seeded from the
// city name so colours never flicker between renders.
//
// To replace with real data you should not need to touch this file: publish a
// coverage FeatureCollection and list it in public/data/index.json (see
// public/data/README.md). `useCityCoverage()` prefers it whenever the
// catalogue offers one, and falls back to this list when it does not.
// ─────────────────────────────────────────────────────────────────────────

// The 19 cities studied by Car Dependency Index and Urban Accessibility P.O.V.
export const STUDY_CITIES = [
  'Barcelona',
  'Berlin',
  'Bordeaux',
  'Boston',
  'Chicago',
  'Florence',
  'Karlsruhe',
  'Málaga',
  'Milan',
  'Munich',
  'Nantes',
  'New York',
  'Paris',
  'Porto',
  'Rome',
  'Seattle',
  'Stockholm',
  'Vienna',
  'Zurich',
];

// [name, longitude, latitude, country]
const RAW = [
  // Europe
  ['London', -0.1276, 51.5072, 'GB'],
  ['Paris', 2.3522, 48.8566, 'FR'],
  ['Berlin', 13.405, 52.52, 'DE'],
  ['Madrid', -3.7038, 40.4168, 'ES'],
  ['Rome', 12.4964, 41.9028, 'IT'],
  ['Vienna', 16.3738, 48.2082, 'AT'],
  ['Warsaw', 21.0122, 52.2297, 'PL'],
  ['Amsterdam', 4.9041, 52.3676, 'NL'],
  ['Barcelona', 2.1686, 41.3874, 'ES'],
  ['Milan', 9.19, 45.4642, 'IT'],
  ['Stockholm', 18.0686, 59.3293, 'SE'],
  ['Copenhagen', 12.5683, 55.6761, 'DK'],
  ['Zurich', 8.5417, 47.3769, 'CH'],
  ['Munich', 11.582, 48.1351, 'DE'],
  ['Lisbon', -9.1393, 38.7223, 'PT'],
  ['Athens', 23.7275, 37.9838, 'GR'],
  ['Prague', 14.4378, 50.0755, 'CZ'],
  ['Helsinki', 24.9384, 60.1699, 'FI'],
  ['Oslo', 10.7522, 59.9139, 'NO'],
  ['Dublin', -6.2603, 53.3498, 'IE'],
  ['Brussels', 4.3517, 50.8503, 'BE'],
  ['Budapest', 19.0402, 47.4979, 'HU'],
  ['Bordeaux', -0.5792, 44.8378, 'FR'],
  ['Florence', 11.2558, 43.7696, 'IT'],
  ['Karlsruhe', 8.4037, 49.0069, 'DE'],
  ['Málaga', -4.4214, 36.7213, 'ES'],
  ['Nantes', -1.5536, 47.2184, 'FR'],
  ['Porto', -8.6291, 41.1579, 'PT'],
  // North America
  ['New York', -74.006, 40.7128, 'US'],
  ['Los Angeles', -118.2437, 34.0522, 'US'],
  ['Chicago', -87.6298, 41.8781, 'US'],
  ['Toronto', -79.3832, 43.6532, 'CA'],
  ['Mexico City', -99.1332, 19.4326, 'MX'],
  ['Vancouver', -123.1207, 49.2827, 'CA'],
  ['Seattle', -122.3321, 47.6062, 'US'],
  ['Boston', -71.0589, 42.3601, 'US'],
  ['Montreal', -73.5673, 45.5017, 'CA'],
  ['San Francisco', -122.4194, 37.7749, 'US'],
  ['Miami', -80.1918, 25.7617, 'US'],
  ['Houston', -95.3698, 29.7604, 'US'],
  // South America
  ['São Paulo', -46.6333, -23.5505, 'BR'],
  ['Buenos Aires', -58.3816, -34.6037, 'AR'],
  ['Rio de Janeiro', -43.1729, -22.9068, 'BR'],
  ['Lima', -77.0428, -12.0464, 'PE'],
  ['Bogotá', -74.0721, 4.711, 'CO'],
  ['Santiago', -70.6693, -33.4489, 'CL'],
  // Asia
  ['Tokyo', 139.6503, 35.6762, 'JP'],
  ['Seoul', 126.978, 37.5665, 'KR'],
  ['Beijing', 116.4074, 39.9042, 'CN'],
  ['Shanghai', 121.4737, 31.2304, 'CN'],
  ['Mumbai', 72.8777, 19.076, 'IN'],
  ['Delhi', 77.209, 28.6139, 'IN'],
  ['Bangkok', 100.5018, 13.7563, 'TH'],
  ['Jakarta', 106.8456, -6.2088, 'ID'],
  ['Singapore', 103.8198, 1.3521, 'SG'],
  ['Hong Kong', 114.1694, 22.3193, 'HK'],
  ['Istanbul', 28.9784, 41.0082, 'TR'],
  ['Dubai', 55.2708, 25.2048, 'AE'],
  ['Tel Aviv', 34.7818, 32.0853, 'IL'],
  ['Tehran', 51.389, 35.6892, 'IR'],
  // Africa
  ['Cairo', 31.2357, 30.0444, 'EG'],
  ['Lagos', 3.3792, 6.5244, 'NG'],
  ['Nairobi', 36.8172, -1.2864, 'KE'],
  ['Johannesburg', 28.0473, -26.2041, 'ZA'],
  ['Accra', -0.187, 5.6037, 'GH'],
  ['Addis Ababa', 38.7469, 9.032, 'ET'],
  // Oceania
  ['Sydney', 151.2093, -33.8688, 'AU'],
  ['Melbourne', 144.9631, -37.8136, 'AU'],
  ['Auckland', 174.7633, -36.8485, 'NZ'],
  ['Perth', 115.8605, -31.9505, 'AU'],
];

// Same string hash the design prototype used, so seeded values match the
// colours the design was reviewed with.
export function hash(s) {
  let h = 0;
  for (const c of s) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// A second, decorrelated draw from the same seed — otherwise every platform
// would colour the cities in exactly the same order.
function draw(name, salt) {
  const h = hash(`${name}#${salt}`);
  return (h % 10000) / 10000;
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const CITIES = RAW.map(([name, lon, lat, country]) => {
  const isStudy = STUDY_CITIES.includes(name);
  const velocityRank = draw(name, 'velocity');
  return {
    id: slugify(name),
    name,
    lon,
    lat,
    country,
    isStudy,
    // 15min-City — average time to reach the basket of daily services.
    proximityMinutes: Math.round((3 + draw(name, 'prox') * 24) * 10) / 10,
    // CityChrone++ — normalised velocity score, 0 slow … 1 fast.
    velocityScore: Math.round(velocityRank * 1000) / 1000,
    // Car Dependency Index — how many times more a car reaches than transit.
    cdi: Math.round((1.1 + draw(name, 'cdi') * 4.4) * 100) / 100,
    // Urban Accessibility P.O.V. — dominant zone, index into ZONES.
    zone: [0, 1, 2, 3][Math.floor(draw(name, 'zone') * 4)],
  };
});

// CityChrone++ covers 42 cities; take the 42 with the strongest transit data
// coverage (here: the top 42 by seeded velocity rank, deterministic).
const CITYCHRONE_SET = new Set(
  [...CITIES]
    .sort((a, b) => b.velocityScore - a.velocityScore)
    .slice(0, 42)
    .map((c) => c.id),
);

export function citiesForPlatform(platform) {
  if (platform.studyOnly) return CITIES.filter((c) => c.isStudy);
  if (platform.id === 'citychrone') return CITIES.filter((c) => CITYCHRONE_SET.has(c.id));
  return CITIES;
}

// GeoJSON is the interchange format everywhere in the map layer, so the seed
// list is exposed the same way a real dataset would be.
export function citiesToGeoJSON(cities = CITIES) {
  return {
    type: 'FeatureCollection',
    features: cities.map((c) => ({
      type: 'Feature',
      id: c.id,
      geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
      properties: {
        id: c.id,
        name: c.name,
        country: c.country,
        isStudy: c.isStudy,
        proximityMinutes: c.proximityMinutes,
        velocityScore: c.velocityScore,
        cdi: c.cdi,
        zone: c.zone,
      },
    })),
  };
}

export const CITIES_BY_ID = Object.fromEntries(CITIES.map((c) => [c.id, c]));
