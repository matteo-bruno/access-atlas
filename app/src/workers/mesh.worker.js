// Builds a city's hex mesh off the main thread. Generating ~8,000 polygons and
// classifying them takes long enough to drop frames if it runs inline, and this
// is the seam where heavier background computation (routing, isochrones,
// scenario runs) will slot in later.

import { buildCityMesh } from '../data/mesh.js';

self.addEventListener('message', (event) => {
  const { id, params } = event.data ?? {};
  try {
    const result = buildCityMesh(params);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message ?? String(error) });
  }
});
