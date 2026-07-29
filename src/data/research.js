// Bibliography. The two published references are transcribed from the
// upstream repositories; the two platforms whose papers are still in
// preparation carry no invented title, author list or venue — `inPreparation`
// makes the page say so instead.

export const PAPERS = [
  {
    id: 'pov',
    platform: 'pov',
    authors: 'Bruno M., Campanelli B., Monteiro Melo H. P., Rossi Mori L., Loreto V.',
    title: 'The dimensions of accessibility: proximity, opportunities, values',
    venue: 'EPJ Data Science 15:22',
    year: 2026,
    doi: '10.1140/epjds/s13688-026-00623-8',
    url: 'https://doi.org/10.1140/epjds/s13688-026-00623-8',
    openAccess: true,
  },
  {
    id: 'cardep',
    platform: 'cardep',
    authors: 'Campanelli B., Marzolla F., Bruno M., Melo H. P. M., Loreto V.',
    title: 'Car Dependency in Urban Accessibility',
    venue: 'arXiv:2604.01019',
    year: 2026,
    doi: null,
    url: 'https://arxiv.org/abs/2604.01019',
    openAccess: true,
  },
  {
    id: 'citychrone',
    platform: 'citychrone',
    authors: null,
    title: null,
    venue: null,
    year: null,
    doi: null,
    url: null,
    inPreparation: true,
  },
  {
    id: 'fifteen',
    platform: 'fifteen',
    authors: null,
    title: null,
    venue: null,
    year: null,
    doi: null,
    url: null,
    inPreparation: true,
  },
];

// Coverage counts match what is published under public/data/ — see
// src/data/platforms.js, which carries the same numbers for the maps.
export const DATASETS = [
  { id: 'pov', platform: 'pov', coverage: 18, format: 'GeoJSON', licence: 'CC BY-NC 4.0' },
  { id: 'cardep', platform: 'cardep', coverage: 22, format: 'GeoJSON', licence: 'CC BY-NC 4.0' },
  { id: 'fifteen', platform: 'fifteen', coverage: 1, format: 'GeoJSON', licence: 'CC BY-NC 4.0' },
  { id: 'citychrone', platform: 'citychrone', coverage: 0, format: '—', licence: 'CC BY-NC 4.0' },
];

export const CITATION = `Sustainable Cities team, Sony Computer Science Laboratories — Rome.
Access Atlas (2026). https://matteo-bruno.github.io/access-atlas/

The framework:
Bruno M., Campanelli B., Monteiro Melo H. P., Rossi Mori L. & Loreto V. (2026).
The dimensions of accessibility: proximity, opportunities, values.
EPJ Data Science 15:22. doi:10.1140/epjds/s13688-026-00623-8`;
