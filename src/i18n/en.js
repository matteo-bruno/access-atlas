// English source copy. `it.js` and `ja.js` mirror this shape exactly — if you add a key
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
    title: 'Accessibility Atlas',
    tagline: 'Sony CSL · Rome — Sustainable Cities',
    atlas: 'Home',
    platforms: 'Atlas',
    citychat: 'CityChat',
    stats: 'Stats',
    about: 'Sustainable cities',
    consulting: 'Consulting',
    research: 'Research',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contact',
    github: 'GitHub',
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
    language: 'Language',
  },

  home: {
    hero: {
      eyebrow: 'Open research platforms · Sony CSL Rome',
      // The landing: the Atlas's name, and one line saying what it does.
      title: 'Accessibility',
      // The coloured half of the name; see .aa-accent in global.css.
      titleAccent: 'Atlas',
      subtitle: 'Mapping urban access, city by city.',
      // The previous home page (/overview) still opens on the long form.
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
      // The corner of the first screen, beside the Sony CSL mark.
      by: 'A Sony CSL · Rome project',
    },
    // Why any of this is measured. Three sentences, in this order: they are a
    // sequence, and the page's argument rests on the last one.
    premise: {
      lines: [
        'Cities are places of opportunities.',
        'Access to opportunities reduces inequalities.',
        'Unequal access creates unequal societies.',
      ],
    },
    metrics: {
      cities: 'Cities published',
      platforms: 'Platforms',
      countries: 'Countries',
      cells: 'Hexagonal cells',
      researchers: 'Researchers',
    },
    platforms: {
      title: 'Accessibility layers',
      // Each card opens the Atlas's own introduction to that layer, not the
      // upstream viewer — the platform is one link further on, from there.
      more: 'More info',
      explore: 'Explore the layer',
      cityCount: '{count} cities',
      themes: {
        fifteen: 'Proximity',
        citychrone: 'Opportunity',
        cardep: 'Comparison',
        pov: 'Synthesis',
      },
      desc: {
        fifteen:
          'Walking and cycling time to nine categories of everyday service, read against the 15-minute reference.',
        citychrone:
          'Travel-time geography — the city redrawn so that distance is measured in minutes of public transport.',
        cardep:
          'How far opportunity access by car exceeds access by public transport, cell by cell.',
        pov: 'Proximity against opportunity, splitting the city into four zones of access.',
      },
    },
    table: {
      title: 'Compare cities',
      statsCta: 'Open Stats',
      within: 'Within {minutes} min',
      onFoot: 'on foot',
      note: 'Share of residents whose walk to the services, on average across them, is within that time. Cities of at least {population} residents.',
    },
    side: {
      title: 'Work in progress',
      // Only for a card that has something to open; the rest say nothing
      // rather than claiming a status nobody can check.
      kinds: { live: 'Live', paper: 'Paper' },
      items: {
        shade: {
          name: 'The right to the shade',
          desc: 'Shade as infrastructure: who can cross a city in summer without walking in the sun, and who cannot.',
        },
        weight: {
          name: 'The weight of urban inequalities',
          desc: 'Inequality in access read in three dimensions, city by city, as a surface rather than a table.',
        },
        odMatrices: {
          name: 'OD matrices from GPS data',
          desc: 'Origin–destination flows reconstructed from GPS traces, to measure the journeys people actually make against the ones a network makes possible.',
        },
        bikeLanes: {
          name: 'Bike lane planning',
          desc: 'Where a cycle network should grow next, given the width of the roads it has to fit into and the connections it would create.',
        },
        co2: {
          name: 'Transport CO₂ emissions',
          desc: 'The emissions cost of urban form: how much carbon a city’s mobility spends, and how proximity changes the figure.',
        },
        quality: {
          name: 'The inequality of quality',
          desc: 'The framework’s third dimension: not how much is reachable, but how good it is — and whether quality is distributed as unequally as access.',
        },
      },
    },
  },

  platform: {
    search: 'Search your city…',
    searchHint: '⌘K',
    searchClear: 'Clear search',
    paper: 'Paper ↗',
    welcome: 'Welcome to {name}',
    dismiss: 'Dismiss',
    learnMore: 'Learn more →',
    attribution: 'Basemap: Natural Earth · Data © Sony CSL Rome · CC BY-NC 4.0',
    cityCount: '{count} cities',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    loading: 'Loading coverage…',
    empty: 'No cities match that search.',
    seeded: 'Illustrative values — this platform’s measurements are not yet published.',

    all: {
      name: 'All layers',
      // The merged map is the Atlas itself rather than one of its layers, so
      // it introduces itself by name instead of through `platform.welcome`.
      welcome: 'Welcome to the Accessibility Atlas',
      label: 'Published coverage',
      pick: 'Choose a map',
      intro:
        'Every city the Atlas has published, across all four platforms. Each platform measures something different and covers a different set of cities — pick one to see its own map, its own scale and the cities it covers. Cities shaded darker have more of the four measures published.',
      legendUnit: 'Platforms published',
      legend: ['One', 'Two', 'Three', 'All four'],
      covered: '{count} of 4 platforms',
      // The merged map's filter: cities with at least this many layers.
      filter: 'Show cities with',
      filterOptions: ['Any layer', 'Two or more', 'Three or more', 'All four layers'],
    },

    fifteen: {
      label: 'Proximity access',
      intro:
        'Travel time on foot and by bicycle to nine categories of everyday service — healthcare, learning, supplies, eating, culture, outdoor space, exercise, services, mobility — computed for every cell of the city and read against the 15-minute reference.',
      // The welcome card on the world map: shorter than `intro`, which the
      // "about this layer" dialog and the city view's panel still use.
      welcomeIntro:
        'See the travel times to everyday services from any place in any city and see how it compares to the 15-minute benchmark.',
      legendUnit: 'Median walk to services',
      // The world map's tooltip: the median resident's figure.
      tooltip: '{name} – {time} min',
      legend: ['0–3 min', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24', '24–30'],
    },
    citychrone: {
      label: 'Opportunity access',
      intro:
        'CityChrone++ measures the speed of public transport from any point in the city and at any time during a working day, in terms of absolute speed (velocity score) and of social opportunities (sociality score).',
      legendUnit: 'Public transport speed (km/h)',
      tooltip: '{name} · {value} km/h by public transport (median resident)',
      legend: ['Slow', 'Medium', 'Fast'],
    },
    cardep: {
      label: 'Car vs. public transport',
      intro:
        'The Car Dependency Index compares the opportunities reachable by car with those reachable by public transport in the same time budget: CDI = (O_car − O_PT) / (O_car + O_PT). It runs from −1, where transit reaches more, through 0 where the two are balanced, to +1 where the car reaches everything and transit almost nothing.',
      legendUnit: 'Car Dependency Index (median resident)',
      tooltip: '{name} · CDI {value} (median resident)',
      legend: ['Transit-favoured', 'Balanced', 'Car-dependent'],
    },
    pov: {
      label: 'Proximity · Opportunity · Value',
      intro:
        'Bridging Proximity and Opportunity, this framework combines the measurement of an active neighbourhood (high proximity) with a fast public transit node (high opportunity). Scores are computed by measuring how many services a person has access to, by public transport in a long time (opportunity score) or by walking in a short time (proximity score). High density places can have both and are labeled as Inclusion places, while spatial isolation in public transport or social isolation of an empty neighbourhood are still better than the total isolation of places disconnected from the rest of the city and with few local opportunities. A third axis would be the elusive Value of places.',
      legendUnit: 'Zone',
      legend: ['Inclusion', 'Spatial isolation', 'Social isolation', 'Total isolation'],
    },
  },

  // 15minCity's city view: nine categories × two modes, chosen at runtime.
  fifteen: {
    mapTitle: 'Travel time to services',
    minutes: 'min',
    legendValue: 'Proximity time',
    statusHint:
      'Pick a mode and a category · hover a legend band to isolate it · scroll & drag to navigate',
    controls: {
      mode: 'Mode',
      category: 'Service category',
    },
    modes: { foot: 'On foot', bike: 'By bicycle' },
    hint: 'Average travel time from each cell to the nearest services in this category.',
    summary: { median: 'Median proximity time' },
    categories: {
      average: 'Proximity time (average)',
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
    back: 'Back to the Atlas',
    people: 'ppl',
    settings: 'Settings',
    // Where a city's outline comes from, at the foot of the city view's column.
    boundaries: {
      title: 'City boundaries',
      body: 'City boundaries are either from the {ghsl} or from the city’s municipality.',
      ghsl: 'Global Human Settlement Layer (GHSL)',
    },
    extent: {
      label: 'Boundary',
      core: 'City (core)',
      fua: 'Metro (FUA)',
      about: 'Two boundaries from the Global Human Settlement Layer (GHS): the city\'s core, its Urban Centre, and its metro area, the Functional Urban Area, which adds the commuting zone around it. Each is published and measured on its own; switching opens the same view on the other.',
    },
    scenario: {
      label: 'Scenario',
      current: 'Current',
      view: { scenario: 'Scenario', diff: 'Difference' },
      about: 'An alternative run of this layer with something changed (a new metro line, say), on the same cells. Show it on its own, or its difference from the current measurement.',
      legendDiff: 'Change: {scenario} minus current',
      change: 'Change',
      diffAbout: {
        cardep: 'Below zero the scenario makes a cell less car dependent: public transport reaches relatively more of what a car does. White cells do not change.',
        fifteen: 'Below zero the scenario brings the services closer: minutes saved. Above zero they are further away. White cells do not change.',
      },
    },
    loading: { large: 'Large cities can take a while to load…', layer: 'Loading {name}…' },
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
      isochrone: 'every time over 120 min in one darker colour',
    },
    views: {
      velocity: 'Velocity',
      sociality: 'Sociality',
      isochrone: 'Isochrones',
    },
    viewHint: {
      velocity: 'How fast public transport moves you outward from each cell at this hour, in km/h.',
      sociality:
        'How many people public transport puts within reach of each cell at this hour — a score, not a headcount.',
      isochrone: 'Travel time by public transport from one chosen cell to everywhere else.',
    },
    legend: {
      velocity: 'Velocity score (km/h)',
      sociality: 'Sociality score',
      isochrone: 'Minutes from the selected cell',
    },
    summary: { weightedV: 'Median PT velocity score', weightedS: 'Median sociality score' },
    // The corner of the controls column where the viewer admits it can be
    // wrong. {contact} is the address, rendered as a link.
    mistake: {
      title: 'Notice a mistake?',
      body: 'Mistakes can happen! Data could be missing or misleading. {contact} if you know this can be fixed.',
      contact: 'Contact us',
    },
    // {date} is the OpenStreetMap extract's date, formatted from src/data/osm.js.
    osmUpdate: 'Last OpenStreetMap update: {date}',
    layerCells: 'Cells measured by {name}',
    isochroneEmpty: 'Click a cell to draw travel times from it',
    isochroneUnavailable: 'Travel times are not published for this city, so its isochrones are not available.',
    isochroneNoOrigin: 'Nobody lives in this cell, so no travel times start from it. Click another cell.',
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
        desc: 'Above the median on both axes, served locally and connected city-wide',
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
        desc: 'Below the median on both axes, excluded from the city’s life',
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
      empty: 'Click any cell to inspect it.',
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
      velocity: 'PT velocity score',
      sociality: 'Sociality score',
      grid: 'H3 cell',
      gridAbout: 'A Standard Hexagonal Hierarchical Spatial Index.',
    },
    // ── Explanations ───────────────────────────────────────────────
    // Ported from the two upstream viewers, which put a "?" beside anything a
    // reader could misread. Two of their sentences are not carried over: CDI
    // called its cartogram a Dorling one (cells here keep their true position
    // and only change area), and P.O.V. called its thresholds plain medians
    // (they are population-weighted — see CLAUDE.md).
    explain: {
      map: {
        pov:
          'Each cell takes the colour of the zone it falls in: green above the city median on both Proximity and Opportunity, red below on both, and the two mixed cases between.',
        cardep:
          'Blue where public transport reaches more opportunities than a car, white where the two are balanced, red where the car reaches more.',
        fifteen:
          'The colour of the cells represents the time needed to reach services belonging to the selected category, on foot or by bike. Blue areas are 15-minute places, where the 15-minute city is realized; in red areas services are on average further than 15 minutes away; white cells are near the 15-minute mark.',
        citychrone:
          'The velocity score colours a cell based on how fast public transport is from that specific area, moving in plausible directions. The sociality score tells us how many people one can meet in a reasonable time moving only by public transport. Isochrones show the times needed to go from a cell in the city to any other cell.',
      },
      // The legend's "?": the colours, then what a white and a blue area mean.
      legend: {
        pov:
          'Bridging Proximity and Opportunity, this framework combines the measurement of an active neighbourhood (high proximity) with a fast public transit node (high opportunity). High density places can have both and are labeled as Inclusion places, while spatial isolation in public transport or social isolation of an empty neighbourhood are still better than the total isolation of places disconnected from the rest of the city and with few local opportunities. A third axis would be the elusive Value of places.',
        cardep:
          'Blue where public transport reaches more opportunities than a car, white where the two are balanced, red where the car reaches more. A white area gives equal opportunities and it is already sufficient to live without a car; a blue area is less common, and happens when public transport is optimal and traffic, pedestrian zones and parking times make a car inconvenient.',
      },
      summary: {
        pov: 'Cells counts what the published dataset covers. Each median is the median resident’s score: half the city’s residents live in cells scoring lower, half higher. The scores are weighted counts of reachable points of interest, which is why neither carries a unit: they are not metres and not jobs. Population is the dataset’s own sum over its cells, not an official figure for the city.',
        cardep: 'Median CDI is the index of the median resident: half the city’s residents live in cells with a lower one. CDI for the average resident weights every cell by the people living in it, and is the figure the platform ranks cities on. Both count residents, not cells: half a city’s cells can be car-dependent while most of its residents live in the other half.',
        fifteen: 'The median is the median resident’s time for the category and mode on screen: half the residents live in cells reached faster, half slower. Every cell counts as many times as people live in it, so thinly settled outer cells do not outvote the places most people live. Population is the dataset’s own sum.',
        atlas: 'Figures are recomputed for the layer on screen. Cells is the union mesh — every cell any platform measures — so a layer that covers fewer says so on its own row.',
      },
      more: 'Full explanation',
      platformSite: 'Previous {name} site',
      aboutTitle: 'About {name}',
      sections: {
        measure: 'What it measures',
        map: 'Reading the map',
        geometry: 'The two geometries',
        summary: 'The figures in the panel',
        source: 'Where this comes from',
      },
      // The 15-minute city's categories, in the "about this layer" dialog.
      categoriesTitle: 'The nine categories',
      categoriesIntro: 'Services are grouped into nine categories. A cell’s time for a category is the average travel time, on foot or by bicycle, to the 20 nearest services of that kind.',
      categories: {
        outdoor: 'parks, gardens, river banks, beaches and the like',
        learning: 'schools, universities and the like',
        supplies: 'supermarkets, grocery stores and the like',
        eating: 'bars, restaurants, pubs and the like',
        moving: 'the nearest public transport stops',
        cultural: 'theatres, cinemas and the like',
        exercise: 'gyms, sports courts and facilities',
        services: 'post offices, banks, public offices, the municipality and the like',
        healthcare: 'hospitals, pharmacies and the like',
        average: 'a simple average of the nine categories',
      },
      weighted: 'Medians and means are weighted by population.',
      methodsTitle: 'Data & methods',
      methods: {
        pov:
          'H3 resolution-9 cells. Walking times from OSRM over OpenStreetMap. Public transport from GTFS schedules. Opportunity scores computed with OSRM. Points of interest from OpenStreetMap. Population from WorldPop.',
        cardep:
          'H3 resolution-9 cells. Driving and walking times from OSRM over OpenStreetMap, with a parking buffer time and city-specific traffic delays on the car side from TomTom Traffic Index. Public transport from GTFS schedules. Opportunity scores computed with OSRM. Points of interest from OpenStreetMap. Population from WorldPop.',
        fifteen: 'H3 resolution-9 cells. Walking and cycling times from OSRM over OpenStreetMap; services from OpenStreetMap, grouped into the nine categories the selector lists; population from WorldPop.',
        citychrone:
          'H3 resolution-9 cells. Public transport from GTFS schedules. Isochrones computed with OSRM. Cells where nobody lives are left out.',
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
        cartogram:
          'A cartogram deforms the cells according to the resident population, so that empty cells shrink until they disappear. Accessibility measures their offer of services, while population represents the demand: in a cartogram inequalities are more evident.',
        derived: 'This cartogram is the Atlas’s own, drawn by one rule for every layer: the area is proportional to the cell’s resident population, reaching the full hexagon at the median population of the city’s inhabited cells. The population is the one every layer of the city shares, so a cell of a given population looks the same size whichever layer you are on.',
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
      medianCdi: 'Index for the median resident',
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
      aboutPov: 'The share of each city that falls in each of the four zones. Zones are decided against that city’s own population-weighted medians, so this compares the mix within cities and not the level between them — a city can be half inclusion and still be poorly served overall. Switch between counting cells and counting residents: isolated cells are large and thinly populated, so the two tell different stories.',
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
      medianCdi: 'Median resident',
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
    headline: 'Common',
    headlineAccent: 'questions.',
    lede: 'Short answers to what we are asked most. Something else on your mind? Write to {email}.',
    links: {
      contact: 'contact us',
      write: 'send us a message',
      research: 'Research page',
    },
    items: [
      {
        q: 'What does “accessibility” mean in the Atlas?',
        a: 'Accessibility is defined as the ease of reaching valuable opportunities: in simple terms, how many places and people that are meaningful for you are within reach from where you live. Many different activities need to be accessible: a job, a park, a relative, a service. Quantifying this concept is complex and is the main mission of the Atlas.',
      },
      {
        q: 'Where does the data come from?',
        a: 'Most of the visualizations are based on open data, unless otherwise specified. Street networks and points of interest come from OpenStreetMap. Routing times are computed on those networks with OSRM. Public transport uses operators’ open GTFS schedules, evaluated with the Connection Scan Algorithm. Population comes from WorldPop 100 m grids adjusted to UN estimates. Cells are H3 hexagons at resolution 9, roughly 200 m across.',
      },
      {
        q: 'Why is my city wrong?',
        a: 'It might well be: this is a worldwide comparative analysis based on open data. The measurements are only as good as their inputs: an OpenStreetMap area that is thinly mapped, a GTFS feed that is out of date, a line that opened after the export was run, or a service that closed before it, all of these produce a map that is confidently wrong in a way the map itself cannot detect. If you know a city and something looks off, write to us and say where the better data is: an up-to-date feed, an official source, or simply which part of the map does not match what is on the ground. That is the fastest way for a city to be re-exported. Every published dataset is downloadable, so the disagreement can be checked rather than argued about. If you are interested in developing a more detailed platform for a single city, {contact}.',
      },
      {
        q: 'Why isn’t my city included?',
        a: 'We will be adding more cities over time. However, coverage is limited by data, not by interest: a city needs well-mapped OpenStreetMap coverage and a usable public GTFS feed. The comparison platforms cover a set of well-documented study cities rather than attempting global coverage, because a badly specified feed produces confident-looking numbers that are wrong. If your city has both and is missing, {write}.',
      },
      {
        q: 'Can I cite this work?',
        a: 'Yes. Every layer must be cited with the paper it comes from. If you cite the Atlas as a whole, cite the Atlas and its author, Sony CSL - Rome. Every citation is on the {research}.',
      },
    ],
  },

  // Who we are — the research line the Atlas is one output of.
  about: {
    headline: 'Scenarios for',
    headlineAccent: 'sustainable cities',
    lede: 'We are a non-profit research team and a research line of Sony Computer Science Laboratories - Rome, working with collaborators at Sapienza University of Rome, the Enrico Fermi Research Centre (CREF) and other institutes. The Atlas is one of the things that comes out of that work.',
    labLink: 'Sony CSL ↗',
    teamLink: 'The people →',

    doTitle: 'What we do',
    do: {
      research: {
        title: 'Research',
        desc: 'We employ frontier models and algorithms to analyse, understand and compare cities. We push the frontier further.',
      },
      platform: {
        title: 'Platform',
        desc: 'We replicate the research on several cities. We publish our research and make the results available on online platforms.',
      },
      useCase: {
        title: 'Use case',
        desc: 'We create refined versions of our platforms for cities, to be used for informed urban and transport planning.',
        cta: 'Ask us about it.',
      },
    },

    topicsTitle: 'Topics',
    topics: {
      accessibility: 'Accessibility and mobility',
      justice: 'Transport Justice',
      sustainability: 'Sustainability and emissions',
      green: 'Green spaces',
      walkability: 'Walkability',
      bikeability: 'Bikeability',
    },
    topicsNote: 'Interested in one of these topics? See more in the {research} section or {contact} us.',
    topicsResearch: 'research',
    topicsContact: 'contact',
  },

  citychat: {
    headline: 'Ask the Atlas about',
    headlineAccent: 'your city.',
    beta: 'beta',
    aboutTitle: 'About CityChat',
    about: 'CityChat is an LLM-assistant that can be inquired about the results and the meaning of the maps in the Atlas. It is powered by Gemini API and can be fine tuned to be much more informed about a single city. {ask} if you are interested.',
    aboutAsk: 'Ask us',
    betaNote: 'CityChat is in beta: it can make mistakes, and at times it may not work properly.',
    phoneOff: 'CityChat is turned off on phones. Open it from a computer to ask the Atlas about a city.',
    phoneBack: 'Explore the maps',
    persona: {
      label: 'I am asking as',
      citizen: 'A resident',
      policy: 'Policy & planning',
      research: 'A researcher',
      press: 'A journalist',
    },
    city: {
      label: 'City',
      any: 'Any city',
    },
    suggestionsTitle: 'Try asking',
    suggestions: {
      citizen: [
        'How long does it take to walk to a doctor in {city}?',
        'In {city}, is it easier to get around by car or by public transport?',
        'What does the colour of a cell mean on the 15-minute city layer?',
      ],
      policy: [
        'Where in {city} do many people live with poor access to services?',
        'How does {city} compare with the other cities on car dependency?',
        'What share of residents in {city} live in total isolation, and what does that mean?',
      ],
      research: [
        'How are the P.O.V. zone thresholds computed?',
        'What is the difference between cell shares and resident shares in {city}?',
        'How does public transport velocity in {city} change through the day?',
      ],
      press: [
        'Which published city is the least car-dependent for its average resident?',
        'What is a fair one-line summary of accessibility in {city}?',
        'What would be a misleading way to report these figures?',
      ],
    },
    placeholder: 'Ask about a layer, a city or a place…',
    send: 'Send',
    stop: 'Stop',
    reset: 'New conversation',
    you: 'You',
    assistant: 'CityChat',
    working: 'Reading the data…',
    answeredBy: 'Answered by {model}',
    switching: '{model} is taking over…',
    verifying: 'Figures being checked',
    checking: 'Checking the figures…',
    consulted: 'Computed from',
    showOnMap: 'Show on map',
    cell: 'cell',
    unverified: 'These figures could not be traced to the data and may be wrong: {list}.',
    tools: {
      list_cities: 'published cities',
      city_overview: 'city overview',
      layer_detail: 'layer detail',
      rank_cells: 'cell ranking',
      cell_at: 'one cell',
      compare_cities: 'city comparison',
    },
    status: {
      checking: 'Connecting to the service…',
      online: 'Model: {provider}',
      reserve: '(+{count} in reserve)',
      offline: 'The CityChat service is not reachable from this copy of the site.',
      disabled: 'CityChat is not enabled on this copy of the site.',
    },
    errors: {
      unavailable: 'The CityChat service is not reachable right now.',
      rate_limited: 'Too many questions in a short time. Try again in a few minutes.',
      busy: 'CityChat is busy. Try again in a moment.',
      too_long: 'This conversation is too long. Start a new one.',
      provider: 'The model could not answer. Try rephrasing, or ask again.',
      quota: 'Every model is over its free quota right now. Try again in a minute or two.',
      too_many_steps: 'The question needed too many steps. Try a narrower one.',
    },
    disclaimer: 'Experimental. Answers are written by an AI model and can be wrong: figures are computed from the published data, the wording around them is not. Questions are sent to the model provider; do not include personal information.',
  },

  // The Stats page: every published city on every measure, from the file
  // `npm run stats` writes. Copy here explains and warns; no figure is ever
  // written into it.
  stats: {
    loading: 'Loading the statistics…',
    error: 'The statistics could not be loaded.',
    emptyTitle: 'No statistics published yet',
    emptyBody:
      'Statistics are computed from the published data by a script, city by city, and none have been published on this site yet. What can already be compared is below.',
    caveat: {
      title: 'Read before comparing.',
      body: 'Cities are measured from data of different sources, completeness and dates, over perimeters drawn in different ways. A gap between two cities is a question to look into, not a verdict.',
      open: 'Method and limits',
    },
    method: {
      title: 'Method and limits',
      sections: {
        completeness: {
          title: 'The data is not equally complete everywhere',
          body: 'Points of interest come from OpenStreetMap, whose coverage depends on how active its mappers are in each city and country. Public transport comes from GTFS timetables, which differ in how many operators they include and which week they describe. A city can score lower because less of it is mapped, not because less of it is there.',
        },
        perimeter: {
          title: 'Each city is a perimeter someone drew',
          body: 'A platform measures the area its authors chose: a municipality, a metropolitan area, a functional urban area. The same city drawn wider takes in more periphery and usually scores lower. Where a layer covers only part of the residents the Atlas has for a city, its rows carry a warning with the share it covers.',
        },
        oneNumber: {
          title: 'One number for a whole city hides its residents',
          body: 'A median says where the middle resident stands, not how far apart the city’s residents are. The ranking draws the spread behind every city (the middle half as a box, the 10th to 90th percentile as a line), and the inequality indices measure it directly. Two cities with the same median can be very different places to live.',
        },
        population: {
          title: 'Every figure is about residents, as each platform counts them',
          body: 'Figures are weighted by the population each platform states for each cell, so they describe people rather than ground. The platforms do not all use the same population model, so a layer’s residents are its own: two layers of the same city can count slightly different totals.',
        },
        thresholds: {
          title: 'Thresholds are fixed, never fitted',
          body: 'A share of residents “above 5,000” or “within 15 minutes” means the same thing in every city. The thresholds are round numbers spanning the published range, chosen once, not adjusted to the cities on screen.',
        },
        zones: {
          title: 'P.O.V.’s own zones compare places within a city',
          body: 'P.O.V. splits each city at its own population-weighted medians, so its four zones say how a place compares with the rest of its city, and every city has about half its residents above each line. To compare cities, the Atlas also splits every city at the medians of all its P.O.V. residents together (the zones on the Atlas median): a resident in “inclusion” there is better off than half the Atlas’s residents on both scores.',
        },
        countries: {
          title: 'A country is its published cities, pooled',
          body: 'A country’s figure is what the residents of its published cities give together: a population-weighted mean or a share of residents, which pool exactly. Medians, percentiles and inequality indices cannot be combined from the cities’ own, so countries have none. It describes those cities, never the country as a whole, and a second perimeter of a city already counted is left out.',
        },
        units: {
          title: 'Scores have no unit',
          body: 'Proximity, opportunity and reach are weighted counts of reachable points of interest: not metres, not jobs. CityChrone’s velocity score is described as km/h-like by its authors, and its sociality score is a weighted count of reachable people, not a headcount. Compare them between cities, not with anything outside the Atlas.',
        },
        freshness: {
          title: 'Only current figures are shown',
          body: 'Statistics are computed by a script whenever the data changes. A city whose data has changed since its figures were computed is left out until they are recomputed, and listed at the foot of the page, rather than shown with figures that no longer match its map.',
        },
        hidden: {
          title: 'Some cities are hidden by default',
          body: 'A city with fewer than {population} residents, or whose residents would walk a median of more than {minutes} minutes to reach services, is left off the Stats page and the world maps. Its figures are computed faithfully but say more about the data than about the place: the city is very small, or OpenStreetMap has barely mapped its services. The city stays published, and its map opens as before.',
        },
      },
    },
    extent: {
      label: 'Boundary',
      core: 'Cities (core)',
      fua: 'Metro areas (FUA)',
      about: 'Cities are compared on one boundary at a time, both from the GHS: their cores (Urban Centres) or their metro areas (Functional Urban Areas). A metro area includes its core, so the two are never mixed, nor pooled into one country.',
    },
    unit: {
      label: 'Compare',
      city: 'Cities',
      country: 'Countries',
      about: 'Countries pool the residents of their published cities, for the 15-minute city only for now. Only means and shares of residents pool exactly, so the other statistics are not offered for countries.',
    },
    countries: {
      label: 'Countries',
      all: 'All countries',
      some: '{count} countries',
      search: 'Search a country…',
      clear: 'Clear',
    },
    filters: {
      population: 'Residents',
      populationAbout: 'Shows only the cities whose residents fall between the two handles, counted over the whole city as the Atlas publishes it. Drag them, or type the numbers; the right end means no maximum.',
      any: 'any',
      popMin: 'Min',
      popMax: 'Max',
    },
    kpi: {
      cities: 'Cities',
      countries: 'Countries',
      best: 'Best',
      worst: 'Worst',
      highest: 'Highest',
      lowest: 'Lowest',
      residents: 'Residents measured',
    },
    layer: 'Layer',
    measure: 'Measure',
    statistic: 'Statistic',
    threshold: 'Threshold',
    zone: 'Zone',
    score: 'Score',
    hour: 'Hour',
    layers: { cross: 'Across layers' },
    day: 'Whole day',
    measures: {
      proximity: 'Proximity score',
      opportunity: 'Opportunity score',
      zonesCommon: 'Zones on the Atlas median',
      zonesCity: 'Zones on each city’s medians',
      cdi: 'Car Dependency Index',
      car: 'Reach by car',
      pt: 'Reach by public transport',
      velocity: 'Velocity score',
      sociality: 'Sociality score',
    },
    about: {
      proximity: 'How many points of interest a resident can reach on foot from their cell, weighted. A score, not a distance.',
      opportunity: 'How many points of interest a resident can reach across the city by walking and public transport, weighted. A score, not a count of jobs.',
      zonesCommon: 'P.O.V.’s four zones, split for every city at the same two lines: the median proximity and the median opportunity of all the Atlas’s P.O.V. residents together. “Inclusion” means better than half the Atlas’s residents on both scores, so the share of residents in each zone compares one city with another.',
      zonesCity: 'P.O.V.’s four zones as the platform publishes them, split at each city’s own population-weighted medians. They describe places within a city: every city has about half its residents on each side of each line.',
      cdi: 'The normalised difference between what a car and public transport reach from a cell, from −1 (transit reaches more) to +1 (the car reaches more). Not a ratio.',
      car: 'Opportunities reachable by car from a cell, as Car Dependency counts them: a weighted score.',
      pt: 'Opportunities reachable by public transport from a cell, as Car Dependency counts them: a weighted score.',
      fifteen: 'Travel time from a cell to the nearest services of the category, on foot or by bicycle. “Average across all services” is the mean of the nine categories.',
      velocity: 'How fast public transport carries a resident outward from their cell, at the hour picked. Described as km/h-like by its authors. “Whole day” is each cell’s mean over the 24 hours.',
      sociality: 'How many people a resident can reach by public transport from their cell, weighted: a score, not a headcount. “Whole day” is each cell’s mean over the 24 hours.',
      correlation: 'How two layers’ measures go together within one city, cell by cell, over the inhabited cells both cover: Spearman’s rank correlation, from −1 to +1.',
    },
    statLabels: {
      p50: 'Median',
      mean: 'Mean',
      p10: '10th percentile',
      p25: '25th percentile',
      p75: '75th percentile',
      p90: '90th percentile',
      share: 'Residents',
      gini: 'Gini index',
      theil: 'Theil index',
      ratio: '90/10 ratio',
      unreachable: 'Residents with nothing reachable',
      zone: 'Residents in zone',
      value: 'Rank correlation',
    },
    statAbout: {
      p50: 'The value of the middle resident: half the city’s residents live in cells above it, half below.',
      mean: 'The average over residents: every cell counts as many times as people live in it. Means pool exactly, so countries have one.',
      p10: 'The value below which the tenth of residents with the lowest values live.',
      p25: 'The value below which a quarter of residents live.',
      p75: 'The value below which three quarters of residents live.',
      p90: 'The value below which nine tenths of residents live.',
      share: 'The share of residents whose cell passes the threshold picked. The thresholds are the same in every city.',
      gini: 'How unevenly the measure is spread across residents, from 0 (everyone has the same) to 1. Lower is more even; the order is not a judgement.',
      theil: 'Another measure of unevenness across residents, more sensitive to the top of the distribution than the Gini. 0 is perfectly even.',
      ratio: 'The 90th percentile divided by the 10th: how many times more the residents near the top have than those near the bottom.',
      unreachable: 'The share of residents with no service of the category within the platform’s reach.',
      zone: 'The share of residents living in cells of the zone picked.',
      value: 'Spearman’s rank correlation between the two measures, over the inhabited cells both layers cover. +1: they rise together; −1: one rises as the other falls.',
    },
    side: {
      atLeast: 'at least {value}',
      atMost: 'within {value}',
      above: 'above {value}',
    },
    sideShort: {
      atLeast: 'residents at or above',
      atMost: 'residents at or within',
      above: 'residents above',
    },
    views: {
      label: 'Views',
      focus: 'Focus',
      ranking: 'Ranking',
      map: 'Map',
      scatter: 'Scatter',
      matrix: 'Matrix',
      curves: 'Curves',
    },
    viewAbout: {
      focus: 'One layer on its own terms: the charts its platform is read with, for every city the filters leave.',
      ranking: 'One row per city, in order. Behind a level, the box is where the middle half of its residents live and the line runs from the 10th to the 90th percentile: the spread one number hides. The ! marks a figure to read with care.',
      map: 'Where the cities are, coloured by the figure picked on a fixed scale and sized by residents. Click a city to highlight it.',
      scatter: 'Two figures against each other, one dot per city, sized by residents. Pick the second figure in the row that appears above.',
      matrix: 'Every city against the headline figures. Shading is the city’s position among the cities shown, darker for better, because the columns share no unit; the value is printed in the cell. Click a column to pick it.',
      curves: 'Each line is a city: for a distribution, the share of its residents at or within each value, from its published percentiles and thresholds; for CityChrone, the figure at each hour. Type a name to add a city, hover a line to name it.',
    },
    sidebar: {
      label: 'Figure and filters',
      figure: 'Figure',
      filters: 'Filters',
    },
    focus: {
      more: 'Full comparison',
      showAll: 'Show all {count}',
      showFewer: 'Show fewer',
      fifteen: {
        title: 'Services within reach',
        profile: 'Median time to each service',
        profileAbout: 'Each cell is the time the middle resident of the city takes to reach the nearest service of the category. The colour is the 15-minute city’s own scale: white at 15 minutes, blue below, red above.',
        within: 'Residents within 15 min',
        modes: 'Residents within 15 minutes, on foot and by bicycle',
        modesAbout: 'The share of residents who reach the services of all categories on average within 15 minutes, walking (blue) and cycling (red). The gap between the two dots is what a bicycle adds.',
        rankings: 'Who lives within {value} of the services',
        rankingsAbout: 'The share of each city’s residents who reach the services of the nine categories within the time picked, on average. Each board ranks the cities of its size, counted over the whole city as the Atlas publishes it: the residents filter beside does not apply here, the countries and the boundary do.',
        over: 'Cities over {count} residents',
        countries: 'Countries',
        cityCount: '{count} ranked',
        noneOfSize: 'No city of this size is on screen.',
        curves: 'Residents reached, minute by minute',
        curvesAbout: 'Each line is a city: the share of its residents who reach the services within the time on the axis, on average. Its points are the published percentiles and the shares at each threshold, and the line only joins them. The grey lines are the other cities the filters leave: hover one to name it, click it to draw it in colour.',
      },
      citychrone: {
        title: 'A day of public transport',
        day: 'The day, hour by hour',
        dayAbout: 'The line is the median resident’s score at each hour; the band runs from the 25th to the 75th percentile. Every city shares one scale per score, so the curves compare directly.',
        peak: 'peak',
        low: 'lowest',
      },
      cardep: {
        title: 'Car or public transport',
        index: 'The index for the average resident',
        indexAbout: 'The population-weighted mean of the Car Dependency Index: below zero public transport reaches more, above zero the car does.',
        bands: 'Residents by index band',
        bandsAbout: 'The share of each city’s residents in each band of the index, from strongly transit-favoured (blue) to strongly car-favoured (red).',
        reach: 'Reach by car against reach by public transport',
        reachAbout: 'The average resident’s reach by car and by public transport, as weighted scores. Cities on the dashed line reach as much either way.',
        equal: 'equal reach',
      },
      pov: {
        title: 'Proximity and opportunity',
        zones: 'Residents by zone',
        zonesAbout: 'Left, the zones on the Atlas median: every city split at the same two lines, proximity {proximity} and opportunity {opportunity}, the medians of all {count} cities’ residents. Right, the platform’s own zones, split at each city’s medians.',
        scores: 'Median proximity against median opportunity',
        scoresAbout: 'Each city’s middle resident on the two scores. The dashed lines are the Atlas medians the common zones are split at.',
        atlasMedian: 'Atlas median',
      },
      cross: {
        title: 'How the layers go together',
        about: 'Spearman’s rank correlation over the inhabited cells both layers cover: blue where the two fall together, red where one rises as the other falls.',
      },
    },
    order: {
      best: 'best first',
      worst: 'worst first',
      high: 'highest first',
      low: 'lowest first',
      reverse: 'Reverse',
    },
    cityCount: 'n = {count}',
    noValues: 'No city shown has this figure.',
    noPairs: 'No city shown has both figures.',
    selection: {
      label: 'Highlighted',
      remove: 'Stop highlighting {name}',
      full: 'Eight at most: remove one first.',
      toggle: 'Highlight in every view',
    },
    openCity: 'Open {name} on the map',
    yAxis: 'Vertical axis',
    unreachableValue: 'not reachable',
    flag: {
      coverage: 'This layer covers {share}% of the residents the Atlas has for this city: the figure describes that part.',
      single: 'One published city: the country’s figure is that city’s.',
    },
    note: {
      withinCity: 'These zones are drawn at each city’s own medians, so they compare places within a city, not cities. For a comparison between cities use the zones on common thresholds.',
      zonesCommon: 'Common zones are split at the median of all {count} cities’ P.O.V. residents: proximity {proximity}, opportunity {opportunity}. They move a little whenever a city is added.',
      thresholds: 'Thresholds are fixed and the same in every city.',
      correlation: 'A correlation describes how two measures go together inside one city. It says nothing about which city is better served.',
      citychrone: 'CityChrone’s scores have no verified unit conversion: compare them between cities, not with outside figures.',
      unreachable: 'Where some residents have nothing of the category within reach, the mean and the inequality indices are not computed.',
      inequality: 'Inequality is ordered from the most even; whether more even is better depends on the measure.',
      countries: 'A country is its published cities pooled, not the country as a whole, and only the 15-minute city is pooled for now. Medians, percentiles and inequality indices do not pool.',
      oneNumber: 'One figure per city: the spread of its residents is in the ranking and in the tooltips.',
      matrix: 'Shading compares the cities shown, so it changes with the filter; the values do not.',
      curvesThresholds: 'Each line joins a city’s published points: its 10th, 25th, 50th, 75th and 90th percentiles and its share at each threshold. Nothing between them is measured.',
      curvesHours: 'One figure per hour, joined by straight lines: nothing between two hours is measured.',
      curvesNone: 'A correlation has no threshold or hour to draw a curve along.',
      hidden: '{count} cities with this figure are left out: their data is too thin to compare.',
    },
    footer: {
      computed: 'Statistics computed on {date} from the published files.',
    },
    tooltip: {
      population: 'residents',
      cells: 'cells',
      cities: 'cities',
      range: '10th–90th percentile',
      iqr: 'middle half',
    },
    mapCaption: 'Dot size is residents.',
    matrixPick: 'Show this figure in every view',
    picker: {
      add: 'Add a city by name…',
      addCountry: 'Add a country by name…',
      full: 'Eight at most: remove one to add another',
      none: 'Nothing by that name has this figure.',
      clickToAdd: 'Click to draw it in colour.',
      suggested: 'To start with, the {count} largest cities on screen. Type a name to add a city; × removes one.',
      suggestedCountries: 'To start with, the {count} largest countries on screen. Type a name to add a country; × removes one.',
    },
    curves: {
      title: 'Residents, cumulative',
      yAxis: {
        atMost: 'Residents within',
        atLeast: 'Residents at or above',
        above: 'Residents above',
      },
    },
  },

  // Consulting — short, because there is nothing else that can honestly be said.
  consulting: {
    headline: 'Working on a city?',
    headlineAccent: 'Talk to us.',
    lede: 'Interested in having a platform fine-tuned and enriched for your city, developing scenarios and forecasting interventions? Need a digital twin that is easy to interpret?',
    cta: 'Write to us',
    whoTitle: 'Who this is for',
    whoBody: 'If you are a public administration, an agency or a company that needs to measure access, mobility, sustainability and inequality, we can be asked. Tell us the question and we will say plainly whether it is one our methods can answer. We are interested in developing novel research while helping cities thrive.',
    services: {
      digitalTwins: 'Digital twins',
      inequalities: 'Accessibility inequalities',
      mobilityForecasting: 'Mobility forecasting',
      demand: 'Demand estimation',
      emissions: 'Emissions forecasting',
      bikeLanes: 'Bike lane planning',
      busLanes: 'Protected bus lanes',
      pedestrianization: 'Pedestrianization',
      originDestination: 'Origin Destination estimation',
    },
  },

  contact: {
    headline: 'Rome, Italy.',
    headlineAccent: 'Open for collab.',
    lede: 'We work with city administrations, research groups, NGOs and anyone trying to make an argument about access with evidence behind it. If your city should be on the Atlas, if you want to reuse the maps in a paper, or if something here looks wrong — write to us.',
    fields: {
      address: 'Address',
      general: 'General',
      phone: 'Phone',
    },
    addressValue:
      'Sony Computer Science Laboratories, Rome\nJoint Initiative CREF-SONY\nCentro Studi e Ricerche “Enrico Fermi” – CREF\nVia Panisperna, 89/a\n00184 Rome\nEntrance: Piazza del Viminale, 1, Rome',
    teamTitle: 'The team',
    // English has no gender agreement, so the M/F pairs the Italian needs are
    // the same string here. They stay as pairs rather than collapsing to one
    // key so both dictionaries keep an identical shape.
    roles: {
      director: 'Co-PI and Director',
      assistant: 'Assistant researcher',
      staffResearcherM: 'Researcher',
      staffResearcherF: 'Researcher',
      coPiResearcherM: 'Co-PI and Researcher',
      coPiResearcherF: 'Co-PI and Researcher',
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
    headline: 'Open',
    headlineAccent: 'Research',
    papersTitle: 'Papers',
    highlights: 'Highlights',
    allPapers: 'All papers',
    preprint: 'Preprint',
    datasetsTitle: 'Datasets',
    comingSoon: 'Coming soon',
    citeTitle: 'How to cite the Atlas',
    citeLayers: 'Every layer must be cited according to its source.',
    citeAtlas: 'If you cite the Atlas itself, please give its link and the attribution to Sony CSL - Rome.',
  },

  blog: {
    eyebrow: 'Blog',
    headline: 'Notes from',
    headlineAccent: 'the Atlas.',
    lede: 'Longer-form writing about what we measure, how we measure it, and what the maps do and do not show.',
    readingTime: '{count} min read',
    backToBlog: '← All posts',
    published: 'Published',
    postsLabel: 'Posts',
  },

  work: {
    eyebrow: 'Work with us',
    headline: 'No open positions',
    headlineAccent: 'right now.',
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
    description: 'Open research on urban accessibility and mobility from the Sustainable Cities team at Sony CSL\u00a0-\u2060\u00a0Rome.',
    platforms: 'Platform',
    platformLinks: ['Atlas', 'CityChat', 'Statistics'],
    research: 'Research',
    researchLinks: ['Papers', 'Datasets', 'Blog', 'FAQ'],
    about: 'About',
    aboutLinks: ['Sustainable cities', 'Team', 'Consulting'],
    touch: 'Stay in touch',
    touchLinks: ['Contact', 'Work with us'],
    workCta: 'Work with us',
    copyright: '© 2026 Sony Computer Science Laboratories · Rome',
  },

  notFound: {
    eyebrow: 'Error 404',
    headline: 'Off the',
    headlineAccent: 'map.',
    lede: 'That page is not part of the Atlas. Try the platforms, or head back to the home page.',
    cta: 'Back to the Atlas',
  },
};
