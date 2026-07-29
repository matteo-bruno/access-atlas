// English source copy. `it.js` mirrors this shape exactly — if you add a key
// here, add it there too (see i18n/index.jsx, which warns on missing keys in
// development).

export default {
  meta: {
    locale: 'en-GB',
    name: 'English',
  },

  nav: {
    title: 'Access Atlas',
    tagline: 'Sony CSL · Rome — Sustainable Cities',
    atlas: 'Atlas',
    platforms: 'Platforms',
    research: 'Research',
    faq: 'FAQ',
    contact: 'Contact',
    github: 'GitHub',
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
  },

  home: {
    hero: {
      eyebrow: 'Volume II · 2026 edition',
      headline: 'An atlas of how cities',
      headlineAccent: 'give access',
      lede: 'Four open platforms, one framework. Measure {proximity} — what is within walking distance. Measure {opportunity} — what transit can reach. Compare them, find the gap. Every city on Earth, open data, open code.',
      ledeProximity: 'proximity',
      ledeOpportunity: 'opportunity',
      ctaPrimary: 'Explore the platforms',
      ctaSecondary: 'Read the framework paper ↗',
    },
    news: {
      title: 'Latest from the lab',
      kinds: { paper: 'Paper', release: 'Release', data: 'Data' },
      items: {
        pov: 'Bruno et al. — the P.O.V. framework',
        cdi: 'Car Dependency Index v1.0 ({count} cities)',
        fifteen: '15min-City refreshed — +{count} cities',
      },
      dates: { pov: 'Apr 2026', cdi: 'Feb 2026', fifteen: 'Jan 2026' },
    },
    metrics: {
      cities: 'Cities mapped',
      platforms: 'Active platforms',
      countries: 'Countries covered',
      researchers: 'Researchers',
      founded: 'Founded',
    },
    coverage: {
      tag: '01',
      title: 'A single map of access, four lenses.',
      hint: 'hover any platform to preview',
      badge: 'Global coverage · {count} cities',
      legend: {
        opportunity: 'Opportunity',
        proximity: 'Proximity',
        comparison: 'Comparison',
      },
    },
    platforms: {
      tag: '02',
      title: 'The four platforms',
      hint: 'proximity → opportunity → value',
      open: 'Open',
      cityCount: '{count} cities',
      themes: {
        fifteen: 'Proximity',
        citychrone: 'Opportunity',
        cardep: 'Comparison',
        pov: 'Synthesis',
      },
      desc: {
        fifteen: 'Walkable services, scored against the 15-minute ideal — every city on Earth.',
        citychrone: 'Travel-time geography — watch the city deform as transit reshapes reach.',
        cardep: 'How many more places does a car reach than transit, cell by cell?',
        pov: 'Proximity × Opportunity, splitting the city into four zones of access.',
      },
    },
    table: {
      tag: '03',
      title: 'By the numbers',
      hint: 'six cities, three measures',
      headers: {
        city: 'City',
        proximity: 'Proximity (min walk)',
        opportunity: 'Opportunity (jobs, k)',
        inclusion: 'Inclusion rate',
      },
    },
    quote: {
      eyebrow: 'From the team',
      before: '“A city is a promise of ',
      accent: 'nearness',
      after: ': that the things you need are within reach. The Atlas asks, for every place on Earth, whether that promise is being kept.”',
      attribution: '— Sustainable Cities team · Sony CSL Rome',
    },
    side: {
      tag: '04',
      title: 'Side projects & future work',
      items: {
        whatif: {
          status: 'Archive',
          desc: 'The original modular platform that seeded the Atlas.',
        },
        heat: {
          name: 'Pedestrian Heat',
          status: 'Upcoming · Q3 2026',
          desc: 'Heat-exposure of every pedestrian route in the city.',
        },
        a11y: {
          name: 'Accessibility for All',
          status: 'In progress',
          desc: 'Mapping the city through a wheelchair user’s perspective.',
        },
        sound: {
          name: 'Soundscapes',
          status: 'Concept',
          desc: 'Acoustic accessibility — where can you simply hear the city?',
        },
      },
    },
  },

  platform: {
    search: 'Search your city…',
    searchHint: '⌘K',
    paper: 'Paper ↗',
    github: 'GitHub ↗',
    welcome: 'Welcome to {name}',
    dismiss: 'Dismiss',
    ctaMap: 'Click a city on the map',
    learnMore: 'Learn more →',
    attribution: 'Tiles © OpenStreetMap · Data © Sony CSL Rome',
    cityCount: '{count} cities',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    loading: 'Loading coverage…',
    empty: 'No cities match that search.',

    fifteen: {
      label: 'Proximity access',
      intro:
        'A platform that scores how close every neighbourhood is to the 15-minute-city ideal: services, schools, food, healthcare reachable on foot or by bike. Click any city to enter its accessibility map.',
      legendUnit: 'Average proximity time',
      legend: ['0–3 min', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24', '24–30'],
    },
    citychrone: {
      label: 'Opportunity access',
      intro:
        'CityChrone++ replaces distance with travel time. Watch the city deform under your fingertips as public transport reshapes what is reachable — and run what-if scenarios on new lines and stations.',
      legendUnit: 'Velocity score',
      legend: ['Slow', 'Medium', 'Fast'],
    },
    cardep: {
      label: 'Transit vs. private car',
      intro:
        'A high-resolution measure of how much more reachable opportunities are by car than by public transport. Blue cells favour transit; red cells require a car. Based on Campanelli et al., 2026.',
      legendUnit: 'CDI ratio',
      legend: ['Transit-friendly', 'Mixed', 'Car-dependent', 'Car-only'],
    },
    pov: {
      label: 'Proximity · Opportunity · Value',
      intro:
        'Each city is mapped across two dimensions: Proximity (walkable local services) and Opportunity (fast transit reach). A third dimension, the intrinsic Value of places, has yet to be quantified.',
      legendUnit: 'Zone type',
      legend: ['Inclusion', 'Spatial isolation', 'Social isolation', 'Total isolation'],
    },
  },

  city: {
    region: '{region} · {count} hexagons',
    worldMap: 'World map',
    compare: 'Compare cities',
    zoneType: 'Zone type',
    zones: {
      inclusion: { name: 'Inclusion', desc: 'High proximity · High opportunity' },
      spatial: { name: 'Spatial isolation', desc: 'High proximity · Low opportunity' },
      social: { name: 'Social isolation', desc: 'Low proximity · High opportunity' },
      total: { name: 'Total isolation', desc: 'Low proximity · Low opportunity' },
    },
    summary: {
      title: 'City summary',
      hexagons: 'Hexagons',
      proximity: 'Median proximity',
      opportunity: 'Median opportunity',
      population: 'Population',
    },
    cartogram: {
      title: 'Cartogram · Hexagonal mesh',
      caption: 'H3 resolution {res} · ~{size} m cells',
    },
    scatter: {
      title: 'Scatter · Proximity vs. opportunity',
      xAxis: 'Opportunity score →',
      yAxis: 'Proximity score →',
    },
    statusHint:
      'Hover or click any hexagon or scatter point to cross-highlight · scroll & drag to navigate',
    computing: 'Computing the mesh…',
  },

  faq: {
    eyebrow: 'Frequently asked',
    headline: 'Six common\nquestions.',
    lede: 'Quick answers to what people ask us most. Have a different question? Write to {email} — we reply within a week.',
    meta: {
      updated: 'Last updated',
      updatedValue: 'May 14, 2026',
      entries: 'Entries',
      languages: 'Languages',
      languagesValue: 'EN · IT',
    },
    items: [
      {
        q: 'What does “access” mean in the Atlas?',
        a: 'We use access as an umbrella for three measurable things: proximity (what is within walking distance), opportunity (what transit can reach in a fixed time budget), and value (the qualitative weight of those reachable places). Each platform measures one or more.',
      },
      {
        q: 'Where does the data come from?',
        a: 'Street networks and amenities are from OpenStreetMap. Public-transport networks come from open GTFS feeds. Population data is from WorldPop and JRC GHSL. Everything used to build the maps is open and citable.',
      },
      {
        q: 'Why isn’t my city included?',
        a: 'Coverage depends on the quality of OSM and the availability of a usable GTFS feed. 15min-City covers ~10,000 cities; the comparison platforms focus on a smaller set of well-documented study cities. Open a GitHub issue and we will look into adding yours.',
      },
      {
        q: 'Can I cite this work?',
        a: 'Yes — each platform links to its underlying paper. The framework reference is Bruno et al., EPJ Data Science (2026); the Car Dependency Index is described in Campanelli et al., 2026.',
      },
      {
        q: 'Is the Atlas free to use?',
        a: 'Yes. The data is open under CC BY-NC 4.0; the code under MIT. Commercial use of the maps requires written permission.',
      },
      {
        q: 'I found a bug / I want a feature.',
        a: 'Each platform has a GitHub issue tracker linked in its footer. We respond to issues weekly during term time.',
      },
    ],
  },

  contact: {
    eyebrow: 'Contact & collaborations',
    headline: 'Rome, Italy.',
    headlineAccent: 'Open for collab.',
    lede: 'We collaborate with city governments, NGOs, universities and curious citizens. If your city should be on the Atlas, if you want to use our maps in a paper, or if you simply have an idea — write to us.',
    fields: {
      address: 'Address',
      general: 'General',
      press: 'Press',
      code: 'Code',
      phone: 'Phone',
    },
    addressValue: 'Sapienza Università di Roma\nPiazzale Aldo Moro, 5 — 00185 Roma, IT',
    teamTitle: 'The team',
    roles: {
      director: 'Director · Principal Investigator',
      senior: 'Senior Researcher',
      pov: 'Researcher · P.O.V.',
      fifteen: 'Researcher · 15min-City',
      citychrone: 'Researcher · CityChrone',
      cardep: 'Researcher · Car Dependency',
      hiring: 'We are hiring.',
    },
    joinName: 'You?',
  },

  research: {
    eyebrow: 'Research output',
    headline: 'Papers, data and code.',
    lede: 'Everything behind the Atlas is published. Each platform is documented in a peer-reviewed paper, ships its dataset under CC BY-NC 4.0, and keeps its analysis code on GitHub under MIT.',
    papersTag: '01',
    papersTitle: 'Papers',
    papersHint: 'peer-reviewed, open access',
    datasetsTag: '02',
    datasetsTitle: 'Datasets & code',
    datasetsHint: 'CC BY-NC 4.0 · MIT',
    citeTitle: 'How to cite the Atlas',
    columns: { dataset: 'Dataset', coverage: 'Coverage', format: 'Format', licence: 'Licence' },
  },

  footer: {
    description:
      'Open research on urban access from the Sustainable Cities team at Sony CSL — Rome. Maps, methods and data, free to use.',
    platforms: 'Platforms',
    research: 'Research',
    researchLinks: ['Papers', 'Datasets', 'GitHub', 'Citations'],
    about: 'About',
    aboutLinks: ['Team', 'Methods', 'FAQ', 'Press'],
    touch: 'Stay in touch',
    touchLinks: ['Newsletter', 'Mastodon', 'Twitter / X', 'BlueSky'],
    copyright: '© 2026 Sony Computer Science Laboratories · Rome',
    version: 'v2.0 · Updated May 2026 · CC BY-NC 4.0',
  },

  notFound: {
    eyebrow: 'Error 404',
    headline: 'Off the map.',
    lede: 'That page is not part of the Atlas. Try the platforms, or head back to the home page.',
    cta: 'Back to the Atlas',
  },
};
