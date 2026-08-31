// English source copy. `it.js` mirrors this shape exactly — if you add a key
// here, add it there too (see i18n/index.jsx, which warns on missing keys in
// development).
//
// Copy rule: every quantity on the site is either computed from the published
// datasets (src/data/home.js, src/data/platforms.js) or omitted. Where a
// measure has no unit — the P.O.V. axes are weighted counts of reachable
// points of interest, not minutes or jobs — it is called a score, not a
// distance or a headcount.

export default {
  meta: {
    locale: 'en-GB',
    name: 'English',
  },

  nav: {
    title: 'Access Atlas',
    tagline: 'Sony CSL · Rome — Sustainable Cities',
    atlas: 'Accessibility Atlas',
    platforms: 'Platforms',
    research: 'Research',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contact',
    github: 'GitHub',
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
  },

  home: {
    hero: {
      eyebrow: 'Open research platforms · Sony CSL Rome',
      headline: 'An atlas to measure',
      headlineAccent: 'cities’ access.',
      lede: 'What is within reach in a city? Measure {proximity} — the everyday services within walking distance. Measure {opportunity} — what public transport can reach within a time budget. Measure {cardep} — how much you need a car to access opportunities in the city. Discover how access propagates inequalities.',
      ledeProximity: 'proximity',
      ledeOpportunity: 'opportunity',
      ledeCardep: 'car dependency',
      ctaPrimary: 'Explore the platform',
      ctaSecondary: 'Read the framework paper ↗',
    },
    news: {
      title: 'Latest from the lab',
      kinds: { paper: 'Paper', release: 'Release', data: 'Data' },
      items: {
        pov: 'The dimensions of accessibility — EPJ Data Science',
        cdi: 'Car Dependency Index — {count} cities published',
        atlas: 'Combined viewer — Milan published on one shared grid, all four platforms',
      },
      dates: { pov: 'Apr 2026', cdi: 'Feb 2026', atlas: 'Aug 2026' },
    },
    // The landing: the coverage map with the words over it.
    landing: {
      mapLabel: 'Every city the Atlas has published',
      scrollHint: 'Or read on',
      back: 'Back',
    },
    metrics: {
      cities: 'Cities published',
      platforms: 'Platforms',
      countries: 'Countries',
      cells: 'Hexagonal cells',
      researchers: 'Researchers',
    },
    coverage: {
      tag: '01',
      title: 'A single map of access, four lenses.',
      hint: 'hover any platform to preview',
      badge: 'Published coverage · {count} cities',
      combined:
        'Where every platform has been exported onto one shared grid, the four lenses become layers of a single map:',
      legend: {
        opportunity: 'Opportunity',
        proximity: 'Proximity',
        comparison: 'Comparison',
      },
    },
    platforms: {
      tag: '02',
      title: 'The four platforms',
      hint: 'proximity → opportunity → comparison',
      open: 'Open',
      cityCount: '{count} cities',
      themes: {
        fifteen: 'Proximity',
        citychrone: 'Opportunity',
        cardep: 'Comparison',
        pov: 'Synthesis',
      },
      desc: {
        fifteen:
          'Walking and cycling time to ten categories of everyday service, read against the 15-minute reference.',
        citychrone:
          'Travel-time geography — the city redrawn so that distance is measured in minutes of public transport.',
        cardep:
          'How far opportunity access by car exceeds access by public transport, cell by cell.',
        pov: 'Proximity against opportunity, splitting the city into four zones of access.',
      },
    },
    table: {
      tag: '03',
      title: 'By the numbers',
      hint: 'six cities · P.O.V. framework',
      headers: {
        city: 'City',
        proximity: 'Median proximity score',
        opportunity: 'Median opportunity score',
        inclusion: 'Inclusion zone',
      },
      note: 'Proximity and opportunity are weighted counts of reachable points of interest, comparable between cities because every city is measured the same way. Inclusion is the share of cells above both population-weighted medians.',
    },
    quote: {
      eyebrow: 'The premise',
      before: 'A city is a promise of ',
      accent: 'nearness',
      after: ': that the things you need are within reach. The Atlas asks, city by city and cell by cell, whether that promise is being kept — and for whom.',
      attribution: '— Sustainable Cities team · Sony CSL Rome',
    },
    side: {
      tag: '04',
      title: 'Side projects & future work',
      items: {
        maps3d: {
          name: '3D Maps',
          status: 'Live',
          desc: 'Interactive three-dimensional maps of urban structure.',
        },
        whatif: {
          status: 'Archive',
          desc: 'The original modular platform that seeded the Atlas.',
        },
        heat: {
          name: 'Pedestrian Heat',
          status: 'Planned',
          desc: 'Heat exposure along pedestrian routes.',
        },
        a11y: {
          name: 'Accessibility for All',
          status: 'In progress',
          desc: 'Reachability measured for wheelchair users rather than an average pedestrian.',
        },
        sound: {
          name: 'Soundscapes',
          status: 'Concept',
          desc: 'Acoustic exposure as a dimension of urban quality.',
        },
      },
    },
  },

  // Basemap terms. OpenFreeMap serves the tiles keylessly and asks to be
  // credited alongside OpenMapTiles and OpenStreetMap; the map is unusable
  // without them, so the credit is on the map rather than in a colophon.
  map: {
    attribution:
      'Basemap © OpenFreeMap · vector tiles © OpenMapTiles · map data © OpenStreetMap contributors',
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
    attribution: 'Basemap: Natural Earth · Data © Sony CSL Rome · CC BY-NC 4.0',
    cityCount: '{count} cities',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    loading: 'Loading coverage…',
    empty: 'No cities match that search.',
    seeded: 'Illustrative values — this platform’s measurements are not yet published.',

    all: {
      name: 'All platforms',
      label: 'Published coverage',
      pick: 'Choose a map',
      intro:
        'Every city the Atlas has published, across all four platforms. Each platform measures something different and covers a different set of cities — pick one to see its own map, its own scale and the cities it covers. Cities shaded darker have more of the four measures published.',
      legendUnit: 'Platforms published',
      legend: ['One', 'Two', 'Three', 'All four'],
      covered: '{count} of 4 platforms',
    },

    fifteen: {
      label: 'Proximity access',
      intro:
        'Travel time on foot and by bicycle to ten categories of everyday service — healthcare, learning, supplies, eating, culture, outdoor space, exercise, services, mobility — computed for every cell of the city and read against the 15-minute reference.',
      legendUnit: 'Average time to services',
      legend: ['0–3 min', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24', '24–30'],
    },
    citychrone: {
      label: 'Opportunity access',
      intro:
        'CityChrone replaces metric distance with travel time: the map deforms so that two places sit close together when public transport connects them quickly, however far apart they are on the ground.',
      legendUnit: 'Velocity score',
      legend: ['Slow', 'Medium', 'Fast'],
    },
    cardep: {
      label: 'Car vs. public transport',
      intro:
        'The Car Dependency Index compares the opportunities reachable by car with those reachable by public transport in the same time budget: CDI = (O_car − O_PT) / (O_car + O_PT). It runs from −1, where transit reaches more, through 0 where the two are balanced, to +1 where the car reaches everything and transit almost nothing.',
      legendUnit: 'Car Dependency Index',
      legend: ['Transit-favoured', 'Balanced', 'Car-dependent', 'Strongly car-dependent'],
    },
    pov: {
      label: 'Proximity · Opportunity · Value',
      intro:
        'Each cell is scored on two axes — proximity, the everyday services reachable on foot, and opportunity, the city-scale destinations reachable by public transport — then classified against the city’s population-weighted median on each. A third axis, the value of what is reachable, is set out in the framework but not yet quantified.',
      legendUnit: 'Zone',
      legend: ['Inclusion', 'Spatial isolation', 'Social isolation', 'Total isolation'],
    },
  },

  // 15minCity's city view: ten categories × two modes, chosen at runtime.
  fifteen: {
    mapTitle: 'Travel time to services',
    minutes: 'min',
    // The selected cell's ten categories at once, as bars.
    barsTitle: 'Every category, from this cell',
    barsAxis: 'Bars run to {max} {unit}; anything longer fills the bar.',
    legendValue: 'Proximity time',
    statusHint:
      'Pick a mode and a category · hover a legend band to isolate it · scroll & drag to navigate',
    controls: {
      mode: 'Mode',
      category: 'Service category',
    },
    modes: { foot: 'On foot', bike: 'By bicycle' },
    hint: 'Average travel time from each cell to the nearest services in this category.',
    summary: { median: 'Median travel time' },
    categories: {
      average: 'Average across all services',
      outdoor: 'Outdoor activities',
      learning: 'Learning',
      supplies: 'Supplies',
      eating: 'Eating',
      moving: 'Moving',
      cultural: 'Cultural activities',
      exercise: 'Physical exercise',
      services: 'Services',
      healthcare: 'Healthcare',
    },
  },

  // The combined viewer: one city, a switch between the four platforms'
  // visualisations.
  atlas: {
    label: 'Combined view',
    mapTitle: 'Measured by {name}',
    controls: {
      layer: 'Visualisation',
      view: 'Measure',
      hour: 'Time of day',
      opacity: 'Layer opacity',
    },
    info: 'About this layer',
    hidePanel: 'Hide controls',
    showPanel: 'Controls',
    fullscreen: 'Full screen',
    exitFullscreen: 'Exit full screen',
    population: {
      name: 'Population',
      legend: 'Residents per cell',
      tooltip: '{count} residents',
      about:
        'Residents per cell, from the 15-minute city export. Coloured on a logarithmic scale: population is heavily skewed, so a linear scale would put nearly every cell in the lightest colour. This is the context the other four measures are read against — the same journey matters more where more people make it.',
    },
    beyond: {
      fifteen: 'darkening to black at 120 min and beyond',
      isochrone: 'darkening to black at 180 min, the published maximum',
    },
    views: {
      velocity: 'Velocity',
      sociality: 'Sociality',
      isochrone: 'Isochrones',
    },
    viewHint: {
      velocity:
        'How fast public transport moves you outward from each cell at this hour — a km/h-like score.',
      sociality:
        'How many people public transport puts within reach of each cell at this hour — a score, not a headcount.',
      isochrone: 'Travel time by public transport from one chosen cell to everywhere else.',
    },
    legend: {
      velocity: 'Velocity score (km/h)',
      sociality: 'Sociality score',
      isochrone: 'Minutes from the selected cell',
    },
    summary: { weightedV: 'Velocity for the average resident' },
    layerCells: 'Cells measured by {name}',
    isochroneEmpty: 'Click a cell to draw travel times from it',
    unavailable: 'Not published',
    noValue: 'Not measured for this cell',
    openPlatform: '{name} page',
    statusHint:
      'One grid, four measurements — switching layers repaints the same cells · scroll & drag to navigate',
    legacyHint:
      'This city is not yet exported on the shared grid — each visualisation loads that platform’s own mesh.',
    error: 'The published mesh could not be loaded.',
  },

  city: {
    region: '{region} · {count} cells',
    worldMap: 'World map',
    compare: 'Compare cities',
    zoneType: 'Zone',
    cdiHint:
      'Negative where public transport reaches more than a car, positive where the car reaches more. The index is a normalised difference bounded at ±1, not a ratio.',
    zones: {
      inclusion: {
        name: 'Inclusion',
        desc: 'Above the median on both axes — served locally and connected city-wide',
      },
      spatial: {
        name: 'Spatial isolation',
        desc: 'Services nearby, but weak transit reach to the wider city',
      },
      social: {
        name: 'Social isolation',
        desc: 'Good transit reach, but few services within walking distance',
      },
      total: {
        name: 'Total isolation',
        desc: 'Below the median on both axes — typically the periphery',
      },
    },
    summary: {
      title: 'City summary',
      hexagons: 'Cells',
      area: 'Area covered',
      proximity: 'Median proximity score',
      medianCdi: 'Median CDI (per cell)',
      weightedCdi: 'CDI for the average resident',
      opportunity: 'Median opportunity score',
      population: 'Population covered',
    },
    // Car Dependency's own control: narrow the index to a slice and read the
    // city through it. Cells outside are dimmed rather than removed — they are
    // still part of the city being described.
    filter: {
      title: 'Filter by index',
      reset: 'Reset',
      about: 'Narrows the map and the scatter to cells whose index falls between the two thumbs. Everything outside stays on the map, dimmed: a filter here is a way of looking, not a claim that the rest is missing. The summary figures are unaffected — they describe the whole city.',
      showing: '{count} of {total} cells',
    },
    // The inspector's rows. A tooltip has room for one number; this is where
    // everything measured for a cell is read.
    selected: {
      title: 'Selected cell',
      empty: 'Click any cell — on the map or on the scatter — to read everything measured for it.',
      clear: 'Clear',
    },
    cell: {
      zone: 'Zone',
      proximity: 'Proximity score',
      opportunity: 'Opportunity score',
      cdi: 'Car Dependency Index',
      byCar: 'Reachable by car',
      byTransit: 'Reachable by transit',
      population: 'Residents',
      // The population-weighted medians the zone was decided against — the
      // catalogue's `thresholds`, not the plain medians in the summary.
      thresholdProximity: 'Zone threshold, proximity',
      thresholdOpportunity: 'Zone threshold, opportunity',
      time: 'Travel time',
      velocity: 'Velocity score',
      sociality: 'Sociality score',
      grid: 'H3 cell',
    },
    // ── Explanations ───────────────────────────────────────────────
    // Ported from the two upstream viewers, which put a "?" beside anything a
    // reader could misread. Two of their sentences are not carried over: CDI
    // called its cartogram a Dorling one (cells here keep their true position
    // and only change area), and P.O.V. called its thresholds plain medians
    // (they are population-weighted — see CLAUDE.md).
    explain: {
      map: {
        pov: 'Each cell takes the colour of the zone it falls in: green above the median on both axes, red below on both, and the two mixed cases between. The thresholds are that city’s own population-weighted medians, so a zone compares places within one city and never one city against another — the underlying scores are what compare across cities.',
        cardep: 'Blue where public transport reaches more opportunities than a car, white where the two are balanced, red where the car reaches more. The scale is fixed across every city rather than fitted to each, so the same colour is the same index everywhere; a city is never recoloured to fill the palette.',
        fifteen: 'Cells are coloured by how long the selected category takes to reach by the selected mode. White sits at 15 minutes, the reference the platform is named for, and the scale keeps darkening past 30 to black at 120 — the legend names that tail rather than stretching to it, which would squash the range nearly every cell sits in. One scale serves all ten categories and both modes, so a colour means the same thing whatever is selected.',
      },
      summary: {
        pov: 'Cells counts what the published dataset covers. Each median is the middle cell’s score — weighted counts of reachable points of interest, which is why neither carries a unit: they are not metres and not jobs. Population is the dataset’s own sum over its cells, not an official figure for the city.',
        cardep: 'Median CDI is the middle cell’s index. CDI for the average resident weights every cell by the people living in it, and is the figure the platform ranks cities on — half a city’s cells can be car-dependent while most of its residents live in the other half.',
        fifteen: 'The median is the middle cell’s time for the category and mode on screen. It describes cells rather than residents: every cell counts once, however many people live in it. Population is the dataset’s own sum.',
        atlas: 'Figures are recomputed for the layer on screen. Cells is the union mesh — every cell any platform measures — so a layer that covers fewer says so on its own row.',
      },
      more: 'Full explanation',
      platformSite: 'The {name} site',
      aboutTitle: 'About {name}',
      sections: {
        measure: 'What it measures',
        map: 'Reading the map',
        geometry: 'The two geometries',
        summary: 'The figures in the panel',
        source: 'Where this comes from',
      },
      methodsTitle: 'Data & methods',
      methods: {
        pov: 'H3 resolution-9 cells, roughly 200 m across. Walking times from OSRM over OpenStreetMap; public transport from GTFS schedules with the Connection Scan Algorithm; points of interest from OpenStreetMap; population from WorldPop’s 100 m grids, adjusted to UN estimates.',
        cardep: 'H3 resolution-9 cells, roughly 200 m across. Driving and walking times from OSRM over OpenStreetMap, with a parking buffer and city-specific traffic delays on the car side; public transport from GTFS schedules with the Connection Scan Algorithm; points of interest from OpenStreetMap; population from WorldPop.',
        fifteen: 'H3 resolution-9 cells. Walking and cycling times from OSRM over OpenStreetMap; services from OpenStreetMap, grouped into the ten categories the selector lists; population from WorldPop.',
        citychrone: 'H3 resolution-9 cells, one export per hour of the day. Public transport from GTFS schedules; both scores and the isochrones are defined in the platform’s paper. Travel times are published as whole minutes capped at 180.',
      },
      paperNote: 'The method is set out in full in the paper.',
    },
    // The two geometries a city can be published on. Switching is a change of
    // what the polygon means, not a change of data, so the caption under the
    // map states which claim is on screen.
    geometry: {
      label: 'Geometry',
      map: 'Map',
      cartogram: 'Cartogram',
      mapTitle: 'Map · cells where they are',
      mapCaption: 'Cell area is the ground it covers',
      cartogramCaption: 'Cell area is its resident population',
      loading: 'Loading the other geometry…',
      unavailable: 'No cartogram published',
      about: {
        map: 'Every cell is the hexagon it is on the ground, the same size everywhere whatever lives in it. Area says nothing about how many people a measure affects, so a thinly populated edge of the city takes up as much of the picture as the dense centre does.',
        cartogram: 'Every cell sits where it really is, but its area is its resident population rather than the ground it covers: a cell with few residents shrinks to a fraction of a hexagon, a crowded one fills it. It answers a different question — not where a measure is low, but how many people it is low for.',
        derived: 'This cartogram is the Atlas’s own: {name} publishes none, so the area here is proportional to the cell’s resident population, reaching the full hexagon at the city’s median cell population. The rule is calibrated against the cartograms the other platforms do publish for the same city, and reproduces them to about 12 m on a 200 m cell — so a cell of a given population looks the same size whichever layer you are on.',
        missing: 'A cartogram is a layout its authors computed, not a transformation of the map, so the Atlas draws the one each platform published rather than deriving one. {name} publishes none.',
      },
    },
    cartogram: {
      title: 'Cartogram · cell area ∝ population',
      caption: 'H3 resolution {res} · ~{size} m cells',
      // Used when the cell size is known but the grid is not H3.
      captionSize: '~{size} m cells',
    },
    scatterCdi: {
      title: 'Opportunity by car against by transit',
      xAxis: 'Reachable by car →',
      yAxis: 'Reachable by transit →',
      diagonal: 'equal reach',
    },
    scatter: {
      title: 'Proximity against opportunity',
      xAxis: 'Opportunity score →',
      yAxis: 'Proximity score →',
    },
    statusHint:
      'Hover or click any cell or point to cross-highlight · scroll & drag to navigate',
    computing: 'Loading the mesh…',
    seeded:
      'Illustrative mesh — this city’s measurements are not yet published, so the arrangement of cells is generated.',
  },

  // The compare view: one row per city rather than one per cell. Both upstream
  // viewers end on this screen, and the Atlas had the chip for it but no page.
  compare: {
    label: 'Compare cities',
    // The subhead's title does not wrap — it is sized for city names — so the
    // count travels with the lede underneath rather than in the title.
    count: '{count} cities',
    lede: 'Every city this platform has published, side by side. Figures are computed from the same files the city pages draw, so a number here is the number there.',
    back: 'Back to the map',
    openCity: 'Open {name}',
    sortBy: 'Sort by',
    sort: {
      name: 'Name',
      population: 'Population',
      weightedCdi: 'Index for the average resident',
      medianCdi: 'Median index',
      ptShare: 'Transit-favoured cells',
      inclusion: 'Inclusion',
      proximity: 'Median proximity',
      opportunity: 'Median opportunity',
    },
    basis: { label: 'Shares', cells: 'By cell', residents: 'By resident' },
    ranking: {
      cardep: 'Cities ranked by index',
      pov: 'Zone mix by city',
      aboutCardep: 'Each bar is the index for that city’s average resident: every cell weighted by the people living in it. Left of the line is a city where public transport reaches more than a car for the typical resident; right of it, one where the car does. Bars use the same scale as the maps.',
      aboutPov: 'The share of each city that falls in each of the four zones. Zones are decided against that city’s own population-weighted medians, so this compares the *mix* within cities and not the level between them — a city can be half inclusion and still be poorly served overall. Switch between counting cells and counting residents: isolated cells are large and thinly populated, so the two tell different stories.',
    },
    scatter: {
      cardep: 'What a car reaches against what transit reaches',
      pov: 'Proximity against opportunity',
      aboutCardep: 'One circle per city, placed by what the average resident can reach each way and sized by population. The diagonal is where the two reach the same amount: circles below it are cities where the car reaches more.',
      aboutPov: 'One circle per city, placed by the scores its average resident sits on and sized by population. Both axes are weighted counts of reachable points of interest, so they carry no unit — position compares cities, and the number itself is only meaningful against another city on the same axis.',
    },
    distribution: {
      title: 'Where each city’s residents sit on the index',
      about: 'Each curve is one city: the share of its residents living at or below a given index. A curve that rises early and steeply is a city where almost everyone is on the transit side; one that stays flat until the right is a city where almost everyone depends on a car. Where a curve crosses the middle line is the share of residents for whom a car and public transport reach about the same.',
    },
    table: { title: 'Summary table' },
    th: {
      city: 'City',
      cells: 'Cells',
      population: 'Population',
      medianCdi: 'Median',
      weightedCdi: 'Avg. resident',
      ptCells: 'Transit cells',
      carCells: 'Car cells',
      proximity: 'Med. proximity',
      opportunity: 'Med. opportunity',
      inclusion: 'Inclusion',
      spatial: 'Spatial isol.',
      social: 'Social isol.',
      total: 'Total isol.',
    },
    loading: 'Loading the published cities…',
    empty: 'This platform has published no city summaries yet.',
    error: 'The published summary could not be loaded.',
  },

  faq: {
    eyebrow: 'Frequently asked',
    headline: 'Six common\nquestions.',
    lede: 'Short answers to what we are asked most. Something else on your mind? Write to {email}.',
    meta: {
      updated: 'Last updated',
      updatedValue: 'July 2026',
      entries: 'Entries',
      languages: 'Languages',
      languagesValue: 'EN · IT',
    },
    items: [
      {
        q: 'What does “access” mean in the Atlas?',
        a: 'Three measurable things, kept deliberately separate. Proximity is what you can reach on foot in a few minutes — shops, schools, clinics, green space. Opportunity is what public transport puts within a time budget — jobs, universities, hospitals, cultural venues. Value is the quality and desirability of what is reachable; it is part of the framework but is not yet quantified, and nothing on this site claims to measure it.',
      },
      {
        q: 'How is a cell classified into a zone?',
        a: 'Each cell carries a proximity score and an opportunity score. A cell is counted as high on an axis when it sits above that city’s population-weighted median for the axis — weighted, so the threshold reflects where people actually live rather than the geometry of the mesh. The two yes/no answers give four zones: inclusion, spatial isolation, social isolation, total isolation. Because the thresholds are city-specific, zones compare places within a city, not between cities; the underlying scores are what compare across cities.',
      },
      {
        q: 'Where does the data come from?',
        a: 'Street networks and points of interest come from OpenStreetMap. Walking times are computed on those networks with OSRM. Public transport uses operators’ open GTFS schedules, evaluated with the Connection Scan Algorithm rather than an average frequency. Population comes from WorldPop 100 m grids adjusted to UN estimates. Cells are H3 hexagons at resolution 9, roughly 200 m across.',
      },
      {
        q: 'Why isn’t my city included?',
        a: 'Coverage is limited by data, not by interest: a city needs well-mapped OpenStreetMap coverage and a usable public GTFS feed. The comparison platforms cover a set of well-documented study cities rather than attempting global coverage, because a badly specified feed produces confident-looking numbers that are wrong. If your city has both and is missing, open a GitHub issue.',
      },
      {
        q: 'Can I cite this work?',
        a: 'Yes. The framework is Bruno M., Campanelli B., Monteiro Melo H. P., Rossi Mori L. & Loreto V. (2026), “The dimensions of accessibility: proximity, opportunities, values”, EPJ Data Science 15:22, doi:10.1140/epjds/s13688-026-00623-8. The Car Dependency Index is Campanelli B., Marzolla F., Bruno M., Melo H. P. M. & Loreto V. (2026), “Car Dependency in Urban Accessibility”, arXiv:2604.01019. The Research page lists both alongside the datasets.',
      },
      {
        q: 'Is the Atlas free to use?',
        a: 'Yes. The visualisation code is MIT-licensed and the published datasets are CC BY-NC 4.0 — free to use, share and adapt with attribution, for non-commercial purposes. Commercial use needs written permission. The papers themselves are open access under CC BY 4.0.',
      },
    ],
  },

  contact: {
    eyebrow: 'Contact & collaborations',
    headline: 'Rome, Italy.',
    headlineAccent: 'Open for collab.',
    lede: 'We work with city administrations, research groups, NGOs and anyone trying to make an argument about access with evidence behind it. If your city should be on the Atlas, if you want to reuse the maps in a paper, or if something here looks wrong — write to us.',
    fields: {
      address: 'Address',
      general: 'General',
      code: 'Code',
      phone: 'Phone',
    },
    addressValue:
      'Sony Computer Science Laboratories, Rome\nJoint Initiative CREF-SONY\nCentro Studi e Ricerche “Enrico Fermi” – CREF\nVia Panisperna, 89/a\n00184 Rome\nEntrance: Piazza del Viminale, 1, Rome',
    teamTitle: 'The team',
    // English has no gender agreement, so the M/F pairs the Italian needs are
    // the same string here. They stay as pairs rather than collapsing to one
    // key so both dictionaries keep an identical shape.
    roles: {
      director: 'PI and Director',
      assistant: 'Assistant researcher',
      staffResearcherM: 'Researcher',
      staffResearcherF: 'Researcher',
      consultantM: 'Consultant, researcher',
      consultantF: 'Consultant, researcher',
      sapienzaResearcherM: 'Researcher, Sapienza',
      sapienzaResearcherF: 'Researcher, Sapienza',
      sapienzaPhdM: 'PhD student, Sapienza',
      sapienzaPhdF: 'PhD student, Sapienza',
      visitingPhdM: 'Visiting PhD student',
      visitingPhdF: 'Visiting PhD student',
      communications: 'Senior corporate communication and events manager',
      developerM: 'Full stack software developer',
      developerF: 'Full stack software developer',
      admin: 'Senior admin officer',
      phdM: 'PhD student',
      phdF: 'PhD student',
      masterM: 'Master student',
      masterF: 'Master student',
      researcherM: 'Researcher',
      researcherF: 'Researcher',
      visitingResearcherM: 'Visiting researcher',
      visitingResearcherF: 'Visiting researcher',
      hiring: 'Work with us',
    },
    joinName: 'You?',
    formerTitle: 'Former members',
  },

  research: {
    eyebrow: 'Research output',
    headline: 'Papers, data and code.',
    lede: 'The methods behind the Atlas are published and the datasets are downloadable. Platforms whose paper is still in preparation are marked as such — the maps are shown, the citation is not invented.',
    papersTag: '01',
    papersTitle: 'Papers',
    papersHint: 'peer-reviewed & preprints',
    datasetsTag: '02',
    datasetsTitle: 'Datasets & code',
    datasetsHint: 'CC BY-NC 4.0 · MIT',
    citeTitle: 'How to cite the Atlas',
    inPreparation: 'In preparation',
    preprint: 'Preprint',
    columns: { dataset: 'Dataset', coverage: 'Coverage', format: 'Format', licence: 'Licence' },
  },

  blog: {
    eyebrow: 'Blog',
    headline: 'Notes from\nthe Atlas.',
    lede: 'Longer-form writing about what we measure, how we measure it, and what the maps do and do not show.',
    readingTime: '{count} min read',
    backToBlog: '← All posts',
    published: 'Published',
    postsLabel: 'Posts',
  },

  work: {
    eyebrow: 'Work with us',
    headline: 'No open positions\nright now.',
    lede: 'We are not recruiting for a funded role at the moment. We are, however, always glad to hear from students who want to do serious work on urban accessibility — and those conversations usually start long before a position exists.',
    openTitle: 'What is open',
    positionsTitle: 'Current openings',
    noPositions: 'No funded positions are open at present.',
    noPositionsDetail:
      'When one opens it will be posted here and on the Sony CSL careers page. There is no waiting list, and speculative applications for roles that do not exist are not kept on file.',
    routes: {
      phd: {
        title: 'PhD students',
        desc: 'We co-supervise doctoral work with universities in Italy and abroad, usually on measurement of accessibility, transport network analysis, or the statistical physics of cities. Funding normally comes through the host university’s doctoral programme rather than from us, so the conversation is best started a few months before that programme’s deadlines.',
      },
      thesis: {
        title: 'Master’s theses',
        desc: 'We host master’s students working on a defined piece of the Atlas — a new city, a methodological comparison, a validation of one of the indices against independent data. Expect roughly six months, a real dataset, and a result that is published if it holds up.',
      },
      internship: {
        title: 'Internships',
        desc: 'Shorter, more focused placements, typically three to six months: data pipelines, geospatial processing, or front-end work on these platforms. Useful background is Python and geospatial tooling, or modern JavaScript and map rendering.',
      },
    },
    howTitle: 'How to get in touch',
    howBody:
      'Write to {email} with a short description of what you want to work on and why, a CV, and — if you have one — a link to something you have built or written. A specific proposal that engages with a paper or a platform is worth far more than a general expression of interest.',
    expectTitle: 'What to expect',
    expectBody:
      'We read everything and reply to proposals we can act on. We are a small team, so we cannot give detailed feedback on every message, and a slow reply is not a judgement on your application.',
    cta: 'Write to us',
  },

  footer: {
    description:
      'Open research on urban access from the Sustainable Cities team at Sony CSL — Rome. Methods, maps and data, published and free to reuse.',
    platforms: 'Platforms',
    research: 'Research',
    researchLinks: ['Papers', 'Datasets', 'Blog', 'FAQ'],
    about: 'About',
    aboutLinks: ['Team', 'Contact', 'Work with us'],
    touch: 'Stay in touch',
    touchLinks: ['GitHub', 'Newsletter'],
    workCta: 'Work with us →',
    copyright: '© 2026 Sony Computer Science Laboratories · Rome',
    version: 'Code MIT · Data CC BY-NC 4.0',
  },

  notFound: {
    eyebrow: 'Error 404',
    headline: 'Off the map.',
    lede: 'That page is not part of the Atlas. Try the platforms, or head back to the home page.',
    cta: 'Back to the Atlas',
  },
};
