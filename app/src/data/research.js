// PLACEHOLDER BIBLIOGRAPHY — the two references the design's FAQ already
// names, plus one row per platform so the page has its full shape. Confirm
// authors, venues and DOIs with the team before this goes public.

export const PAPERS = [
  {
    id: 'pov',
    platform: 'pov',
    authors: 'Bruno et al.',
    title: 'Proximity, Opportunity and Value: a framework for urban access',
    venue: 'EPJ Data Science',
    year: 2026,
    doi: null,
  },
  {
    id: 'cardep',
    platform: 'cardep',
    authors: 'Campanelli et al.',
    title: 'A high-resolution index of car dependency',
    venue: 'Preprint',
    year: 2026,
    doi: null,
  },
  {
    id: 'citychrone',
    platform: 'citychrone',
    authors: 'Biazzo et al.',
    title: 'Travel-time geography and the velocity score',
    venue: 'Preprint',
    year: 2025,
    doi: null,
  },
  {
    id: 'fifteen',
    platform: 'fifteen',
    authors: 'Melo et al.',
    title: 'Scoring the 15-minute city at global scale',
    venue: 'Preprint',
    year: 2025,
    doi: null,
  },
];

export const DATASETS = [
  { id: 'fifteen', platform: 'fifteen', coverage: 10142, format: 'GeoJSON · Parquet', licence: 'CC BY-NC 4.0' },
  { id: 'citychrone', platform: 'citychrone', coverage: 42, format: 'GeoJSON · GTFS', licence: 'CC BY-NC 4.0' },
  { id: 'cardep', platform: 'cardep', coverage: 19, format: 'GeoJSON · CSV', licence: 'CC BY-NC 4.0' },
  { id: 'pov', platform: 'pov', coverage: 19, format: 'GeoJSON · CSV', licence: 'CC BY-NC 4.0' },
];

export const CITATION = `Sustainable Cities team, Sony Computer Science Laboratories — Rome.
Access Atlas (Volume II, 2026). https://access-atlas.sonycsl.example`;
