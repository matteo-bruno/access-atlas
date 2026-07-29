// ─────────────────────────────────────────────────────────────────────────
// Hex-mesh builder for the city detail pages.
//
// SEED DATA: until the real P.O.V. outputs are published this synthesises a
// plausible mesh — a hexagonal grid clipped to the city's urban envelope, with
// proximity/opportunity surfaces driven by distance to the centre, a few
// transit corridors, and deterministic noise.
//
// It is deliberately a pure, dependency-free function of its parameters so it
// can run unchanged on the main thread or inside a Web Worker
// (workers/mesh.worker.js). When real data lands, swap the body for a fetch +
// classify over the published GeoJSON; the return shape is the contract the UI
// depends on.
// ─────────────────────────────────────────────────────────────────────────

const METRES_PER_DEG_LAT = 111320;

// Deterministic PRNG (mulberry32) — same seed, same mesh, every reload.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Value-noise-ish field: sine octaves, cheap and continuous. The high-frequency
// octaves matter — without them the zones classify into clean concentric rings,
// which reads as an artefact rather than a city.
function field(x, y, phase) {
  return (
    Math.sin(x * 1.7 + phase) * 0.34 +
    Math.sin(y * 2.3 - phase * 1.3) * 0.24 +
    Math.sin((x + y) * 3.1 + phase * 0.7) * 0.16 +
    Math.sin(x * 7.9 - y * 5.3 + phase * 2.1) * 0.14 +
    Math.sin((x - y) * 12.7 + phase * 3.3) * 0.08 +
    Math.sin(x * 21.3 + y * 17.1 - phase) * 0.04
  );
}

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function median(values) {
  return quantile([...values].sort((a, b) => a - b), 0.5);
}

// Average H3 edge length in metres, by resolution (res 5–11). Used to report
// the mesh's resolution honestly rather than hard-coding one in the caption.
const H3_EDGE_M = { 5: 8544, 6: 3229, 7: 1220, 8: 461, 9: 174, 10: 65.9, 11: 24.9 };

function nearestH3Resolution(edgeMetres) {
  let best = 9;
  let bestErr = Infinity;
  for (const [res, edge] of Object.entries(H3_EDGE_M)) {
    const err = Math.abs(Math.log(edgeMetres / edge));
    if (err < bestErr) {
      bestErr = err;
      best = Number(res);
    }
  }
  return best;
}

/**
 * @param {object} spec
 * @param {[number, number]} spec.center      [lon, lat] of the city centre
 * @param {number} spec.targetCells           how many hexagons to aim for
 * @param {number} spec.radiusKm              semi-major axis of the urban envelope
 * @param {number} spec.flattening            semi-minor / semi-major
 * @param {number} spec.seed
 * @param {number[][]} [spec.corridors]       transit axes as [dx, dy] unit-ish vectors
 * @param {number[]} [spec.zoneTargets]       desired share of [inclusion, spatial, social, total]
 * @returns {{ geojson, stats, scatter, cellRadiusM }}
 */
export function buildCityMesh({
  center,
  targetCells = 8089,
  radiusKm = 18,
  flattening = 0.68,
  seed = 42,
  corridors = [
    [1, 0.25],
    [0.2, 1],
    [-0.8, 0.6],
  ],
  zoneTargets = [0.129, 0.027, 0.014, 0.83],
  scatterSample = 520,
  // How strongly the two surfaces are allowed to disagree. Raising these
  // decorrelates proximity from opportunity, which shrinks the Inclusion zone
  // (both-high) and grows the two single-axis isolation zones.
  corridorStrength = 0.195,
  noiseProximity = 0.105,
  noiseOpportunity = 0.095,
  // Maps the normalised surfaces onto reportable units. Calibrated so the
  // medians reproduce the published Rome figures (644 m, 2.7 k jobs); re-solve
  // these when the real mesh lands.
  walk = { base: 180, exponent: 3.2, scale: 2012 },
  jobs = { base: 0.2, exponent: 2.68, scale: 34 },
}) {
  const [lon0, lat0] = center;
  const rand = rng(seed);

  const a = radiusKm * 1000; // semi-major, metres
  const b = a * flattening; // semi-minor, metres

  // Hex area from the ellipse area / target count → centre-to-vertex radius.
  const cellArea = (Math.PI * a * b) / targetCells;
  const R = Math.sqrt((2 * cellArea) / (3 * Math.sqrt(3)));

  // Pointy-top axial layout, in local metres before projection to lon/lat.
  const stepX = Math.sqrt(3) * R;
  const stepY = 1.5 * R;
  const cols = Math.ceil((2 * a) / stepX) + 2;
  const rows = Math.ceil((2 * b) / stepY) + 2;

  const metresPerDegLon = METRES_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  const toLon = (dx) => lon0 + dx / metresPerDegLon;
  const toLat = (dy) => lat0 + dy / METRES_PER_DEG_LAT;

  // Hex vertices for a pointy-top cell, as offsets in metres.
  const VERTS = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return [R * Math.cos(angle), R * Math.sin(angle)];
  });

  const cells = [];
  for (let row = -Math.ceil(rows / 2); row <= Math.ceil(rows / 2); row++) {
    for (let col = -Math.ceil(cols / 2); col <= Math.ceil(cols / 2); col++) {
      const dx = col * stepX + (row & 1 ? stepX / 2 : 0);
      const dy = row * stepY;

      // Clip to an ellipse with a slightly ragged edge, like a real urban mask.
      const norm = Math.hypot(dx / a, dy / b);
      if (norm > 0.94 + rand() * 0.12) continue;

      // Proximity: services cluster in the centre, plus smooth local variation.
      const nx = dx / a;
      const ny = dy / b;
      const noiseP = field(nx * 3, ny * 3, 0.8) * noiseProximity;
      const proximity = clamp01(1 - Math.pow(norm, 1.35) + noiseP);

      // Opportunity: centre-driven too, but stretched along transit corridors,
      // which is what makes the two surfaces disagree in interesting places.
      let corridorBoost = 0;
      for (const [cx, cy] of corridors) {
        const len = Math.hypot(cx, cy) || 1;
        const ux = cx / len;
        const uy = cy / len;
        const along = nx * ux + ny * uy;
        const across = Math.abs(nx * -uy + ny * ux);
        if (along > -0.15)
          corridorBoost = Math.max(corridorBoost, Math.exp(-across * 9) * corridorStrength);
      }
      const noiseO = field(nx * 2.2 + 4, ny * 2.6 - 2, 1.9) * noiseOpportunity;
      const opportunity = clamp01(1 - Math.pow(norm, 1.15) + corridorBoost + noiseO);

      cells.push({ dx, dy, proximity, opportunity });
    }
  }

  // Zone thresholds as quantiles, so the classified shares land on the
  // published distribution instead of drifting with the noise.
  const [incT, spatialT, socialT] = zoneTargets;
  const proxSorted = cells.map((c) => c.proximity).sort((x, y) => x - y);
  const oppSorted = cells.map((c) => c.opportunity).sort((x, y) => x - y);
  const proxCut = quantile(proxSorted, 1 - (incT + spatialT));
  const oppCut = quantile(oppSorted, 1 - (incT + socialT));

  const counts = [0, 0, 0, 0];
  const features = new Array(cells.length);

  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const highP = c.proximity >= proxCut;
    const highO = c.opportunity >= oppCut;
    // 0 inclusion · 1 spatial isolation · 2 social isolation · 3 total isolation
    const zone = highP && highO ? 0 : highP ? 1 : highO ? 2 : 3;
    counts[zone]++;

    // Human-readable measures derived from the normalised surfaces.
    const walkMetres = Math.round(walk.base + Math.pow(1 - c.proximity, walk.exponent) * walk.scale);
    const jobsK =
      Math.round((jobs.base + Math.pow(c.opportunity, jobs.exponent) * jobs.scale) * 10) / 10;

    const ring = new Array(7);
    for (let v = 0; v < 6; v++) {
      ring[v] = [
        round6(toLon(c.dx + VERTS[v][0])),
        round6(toLat(c.dy + VERTS[v][1])),
      ];
    }
    ring[6] = ring[0];

    c.zone = zone;
    c.walkMetres = walkMetres;
    c.jobsK = jobsK;

    features[i] = {
      type: 'Feature',
      id: i,
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {
        zone,
        proximity: Math.round(c.proximity * 1000) / 1000,
        opportunity: Math.round(c.opportunity * 1000) / 1000,
        walkMetres,
        jobsK,
      },
    };
  }

  const total = cells.length || 1;
  const stats = {
    cellCount: cells.length,
    cellRadiusM: Math.round(R),
    h3Resolution: nearestH3Resolution(R),
    zoneShares: counts.map((n) => Math.round((n / total) * 1000) / 10),
    zoneCounts: counts,
    medianWalkMetres: Math.round(median(cells.map((c) => c.walkMetres))),
    medianJobsK: Math.round(median(cells.map((c) => c.jobsK)) * 10) / 10,
  };

  // Even sample across the mesh for the scatter plot — plotting 8k points is
  // slower and no more legible than plotting ~500.
  const stride = Math.max(1, Math.floor(cells.length / scatterSample));
  const scatter = [];
  for (let i = 0; i < cells.length; i += stride) {
    const c = cells[i];
    scatter.push({
      // `i` is the feature id of the hexagon this point came from, so hovering
      // a point can highlight its cell on the map.
      i,
      x: Math.round(c.opportunity * 1000) / 1000,
      y: Math.round(c.proximity * 1000) / 1000,
      z: c.zone,
    });
  }

  return {
    geojson: { type: 'FeatureCollection', features },
    stats,
    scatter,
    thresholds: { proximity: proxCut, opportunity: oppCut },
  };
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function round6(v) {
  return Math.round(v * 1e6) / 1e6;
}

// City metadata for the detail pages. Population and region are editorial;
// everything else is computed from the mesh.
export const CITY_PROFILES = {
  rome: {
    id: 'rome',
    name: 'Rome',
    nameIt: 'Roma',
    region: 'Lazio, Italy',
    regionIt: 'Lazio, Italia',
    center: [12.4964, 41.9028],
    population: 4300000,
    zoom: 10.1,
    mesh: {
      targetCells: 8112,
      radiusKm: 18,
      flattening: 0.72,
      seed: 1871,
      corridors: [
        [1, 0.2],
        [0.15, 1],
        [-0.9, 0.5],
        [0.8, -0.7],
      ],
    },
  },
};
