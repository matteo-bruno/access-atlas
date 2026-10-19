// Bibliography of the Sustainable Cities team, newest first.
//
// Every DOI below was looked up and matched against the publisher's own record
// — none is inferred from a volume or article number. Where a lookup did not
// return one, `doi` is null and the entry cites the venue alone rather than a
// link that might not resolve.
//
// arXiv preprints carry their canonical registered DOI (10.48550/arXiv.<id>).
//
// `platform` ties a paper to one of the four platforms where the paper is that
// platform's method; most entries have none, and the Research page simply
// omits the tag for those.

export const PAPERS = [
  {
    id: 'hefei-equity',
    authors: 'Zhou S., Bruno M., Mazzoli M., Tian J., Jiang R., Zhang E., Li Z., Loreto V.',
    title:
      'The Moving Target of Urban Equity: Spatiotemporal Demand and Double Disadvantage in Hefei, China',
    venue: 'arXiv:2606.20132',
    year: 2026,
    doi: '10.48550/arXiv.2606.20132',
    url: 'https://arxiv.org/abs/2606.20132',
    preprint: true,
  },
  {
    id: 'compact-carbon',
    authors: 'Marzolla F., Bruno M., Melo H. P. M., Loreto V.',
    title: 'Compact 15-minute cities exhibit lower carbon intensity in urban transport',
    venue: 'Cities 176, 107202',
    year: 2026,
    highlight: true,
    // The journal DOI was not found in a publisher record at the time of
    // writing, so no DOI is cited. The link is the preprint of the same
    // paper, arXiv:2409.01817 ("Compact 15-minute cities are greener").
    doi: null,
    url: 'https://arxiv.org/abs/2409.01817',
  },
  {
    id: 'cardep',
    highlight: true,
    platform: 'cardep',
    authors: 'Campanelli B., Marzolla F., Bruno M., Melo H. P. M., Loreto V.',
    title: 'Car Dependency in Urban Accessibility',
    venue: 'arXiv:2604.01019',
    year: 2026,
    doi: '10.48550/arXiv.2604.01019',
    url: 'https://arxiv.org/abs/2604.01019',
    preprint: true,
  },
  {
    id: 'museum-incentives',
    authors: 'Lerouge R., Biferale L., Bruno M.',
    title:
      'The effect of consumption incentives on museum attendance: a case study on Milan through human mobility data',
    venue: 'Journal of Cultural Economics',
    year: 2026,
    doi: '10.1007/s10824-026-09581-5',
    url: 'https://doi.org/10.1007/s10824-026-09581-5',
  },
  {
    id: 'proximity-co2',
    highlight: true,
    authors: 'Marzolla F., Melo H. P. M., Bruno M., Loreto V.',
    title: 'Proximity-based cities emit less mobility-driven CO₂',
    venue: 'npj Sustainable Mobility and Transport 3, 7',
    year: 2026,
    doi: '10.1038/s44333-025-00074-0',
    url: 'https://doi.org/10.1038/s44333-025-00074-0',
  },
  {
    id: 'pov',
    highlight: true,
    platform: 'pov',
    authors: 'Bruno M., Campanelli B., Melo H. P. M., Rossi Mori L., Loreto V.',
    title: 'The dimensions of accessibility: proximity, opportunities, values',
    venue: 'EPJ Data Science 15, 22',
    year: 2026,
    doi: '10.1140/epjds/s13688-026-00623-8',
    url: 'https://doi.org/10.1140/epjds/s13688-026-00623-8',
  },
  {
    id: 'metro-rome',
    authors: 'Marzolla F., Campanelli B., Monteiro Melo H. P., Bruno M., Loreto V.',
    title: 'The impact of a new transit infrastructure on the economic fabric of Rome',
    venue: 'Discover Cities 3 (1), 150',
    year: 2026,
    // Published version of arXiv:2510.01449 ("Increasing accessibility by
    // public transport benefits local economy…").
    doi: '10.1007/s44327-026-00330-z',
    url: 'https://doi.org/10.1007/s44327-026-00330-z',
  },
  {
    id: 'bike-lanes',
    authors: 'Basilone R., Bruno M., Monteiro Melo H. P., Avalle M., Loreto V.',
    title: 'Road-Width-Aware network optimisation for bike lane planning',
    venue: 'Journal of Physics: Complexity 6, 035008',
    year: 2025,
    doi: '10.1088/2632-072X/adf683',
    url: 'https://doi.org/10.1088/2632-072X/adf683',
  },
  {
    id: 'tech-fitness',
    authors: 'Straccamore M., Bruno M., Tacchella A.',
    title: 'Comparative analysis of technological fitness and coherence at different geographical scales',
    venue: 'PLOS ONE 20 (8), e0329746',
    year: 2025,
    doi: '10.1371/journal.pone.0329746',
    url: 'https://doi.org/10.1371/journal.pone.0329746',
  },
  {
    id: 'friction-space',
    authors: 'Biferale L., Crociata A., Rossi Mori L., Chiappetta C., Bruno M.',
    title: 'Introducing friction of space into the geography of cultural consumption',
    venue: 'Urban Science 9 (8), 316',
    year: 2025,
    doi: '10.3390/urbansci9080316',
    url: 'https://doi.org/10.3390/urbansci9080316',
  },
  {
    id: 'core-periphery',
    authors: 'Fanelli F., Melo H. P. M., Bruno M., Loreto V.',
    title: 'Revealing the core-periphery structure of cities',
    venue: 'Physical Review Research 7, 033064',
    year: 2025,
    doi: '10.1103/PhysRevResearch.7.033064',
    url: 'https://doi.org/10.1103/PhysRevResearch.7.033064',
  },
  {
    id: 'beyond-proximity',
    authors: 'Hill D., Bruno M., Melo H. P. M., Takeuchi Y., Loreto V.',
    title: 'Cities beyond proximity',
    venue: 'Philosophical Transactions of the Royal Society A 382 (2285), 20240097',
    year: 2024,
    doi: '10.1098/rsta.2024.0097',
    url: 'https://doi.org/10.1098/rsta.2024.0097',
  },
  {
    id: 'fifteen',
    highlight: true,
    platform: 'fifteen',
    authors: 'Bruno M., Monteiro Melo H. P., Campanelli B., Loreto V.',
    title: 'A universal framework for inclusive 15-minute cities',
    venue: 'Nature Cities 1 (10), 633–641',
    year: 2024,
    doi: '10.1038/s44284-024-00119-4',
    url: 'https://doi.org/10.1038/s44284-024-00119-4',
  },
  {
    id: 'urban-fitness',
    authors: 'Straccamore M., Bruno M., Monechi B., Loreto V.',
    title: 'Urban economic fitness and complexity from patent data',
    venue: 'Scientific Reports 13, 3655',
    year: 2023,
    doi: '10.1038/s41598-023-30649-1',
    url: 'https://doi.org/10.1038/s41598-023-30649-1',
  },
  {
    id: 'general-scores',
    highlight: true,
    platform: 'citychrone',
    authors: 'Biazzo I., Monechi B., Loreto V.',
    title: 'General scores for accessibility and inequality measures in urban areas',
    venue: 'Royal Society Open Science 6 (8), 190979',
    year: 2019,
    doi: '10.1098/rsos.190979',
    url: 'https://doi.org/10.1098/rsos.190979',
  },
];

// The paper that defines each platform's method, keyed by platform id. The
// maps link here rather than carrying their own URLs, so a "Paper" link and
// the Research page can never drift apart — and a platform whose paper is
// still in preparation gets no link instead of a wrong one.
export const PAPER_BY_PLATFORM = Object.fromEntries(
  PAPERS.filter((paper) => paper.platform).map((paper) => [paper.platform, paper]),
);

export function paperForPlatform(platformId) {
  const paper = PAPER_BY_PLATFORM[platformId];
  return paper?.url ? paper : null;
}

// The published datasets, in platform order. A platform whose data is not
// public yet has no `url`, and the page says it is coming soon.
export const DATASETS = [
  { id: 'fifteen', platform: 'fifteen', url: null },
  { id: 'citychrone', platform: 'citychrone', url: null },
  { id: 'cardep', platform: 'cardep', url: 'https://github.com/mat701/CDI' },
  { id: 'pov', platform: 'pov', url: 'https://github.com/mat701/accessibility-pov' },
];

// How to cite: every layer by the paper that defines it (taken from PAPERS,
// so a citation cannot drift from the bibliography), and the Atlas itself
// by its link and the lab.
export const CITED_LAYERS = ['fifteen', 'citychrone', 'cardep', 'pov'];

// The citation without its DOI, which the page prints as a link after it.
export function citationFor(paper) {
  return `${paper.authors} (${paper.year}). ${paper.title}. ${paper.venue}.`;
}

export const ATLAS_URL = 'https://whatif.sonycsl.it/atlas/';

export const ATLAS_CITATION = `Accessibility Atlas, Sustainable Cities team, Sony Computer Science Laboratories - Rome (2026). ${ATLAS_URL}`;
