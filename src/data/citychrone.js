// CityChrone: hourly public-transport scores and isochrones on the H3 grid.
//
// Each published hour carries two per-cell scores (see the platform paper,
// doi:10.1098/rsos.190979): the *velocity score*, how fast public transport
// moves you outward from a cell (a km/h-like figure), and the *sociality
// score*, a weighted count of the people reachable — a score, not a
// headcount. The travel-time matrices behind the isochrone view are uint8
// minutes, capped at 180 upstream.
//
// Views the city layer offers. `state` names the feature-state key the paint
// expression reads — hourly values are joined at runtime, never baked into
// the mesh.

export const CITYCHRONE_VIEWS = [
  { key: 'velocity', state: 'v' },
  { key: 'sociality', state: 's' },
  { key: 'isochrone', state: 't' },
];

export const DEFAULT_HOUR = 8;

// Band edges chosen against the published Milan distributions (v_score
// 0.6–8.3 across the day, s_score up to ~650k); the last band is open-ended.
// Bands are presentation — the tooltips quote the exact values.
export const CITYCHRONE_BANDS = {
  velocity: [1, 2, 3, 4, 5, 6, 7, 8, 10],
  sociality: [50e3, 150e3, 250e3, 300e3, 350e3, 400e3, 450e3, 550e3, 700e3],
  isochrone: [10, 20, 30, 45, 60, 75, 90, 120, 180],
};

/** Share of cells per band for one hour's values. */
export function summariseCitychrone(values, bands) {
  const counts = new Array(bands.length).fill(0);
  let total = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    total++;
    let band = bands.findIndex((edge) => value <= edge);
    if (band < 0) band = bands.length - 1;
    counts[band]++;
  }
  return {
    shares: total ? counts.map((c) => Math.round((c / total) * 1000) / 10) : counts.map(() => 0),
    total,
  };
}
