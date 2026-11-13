// Blog posts. Long-form copy lives here rather than in the i18n dictionaries:
// the dictionaries are flat UI strings, and an article is a structured
// document. The posts are in English only (`en`); the page marks them as
// English in every other language (`postCopy` in Blog.jsx).
//
// The four `layer-…` posts are what the home page's cards open. Each one
// introduces a single layer of the Atlas, with examples, maps and charts,
// and hands the reader on to the city view and to the paper behind it.
//
// No number in a post is typed here. A paragraph names a value as `{key}`
// and a block `{ figure: id }` names a map or chart; both come from
// public/blog-figures/figures.json, which `npm run blog`
// (scripts/build-blog.mjs) computes from the published data and draws the
// maps for. Re-run it after a data change; `test:data` fails if a post names
// a key or a figure the file does not have.
//
// Blocks: `p` (with **bold** and {key}), `h2` (with `badge`), `ul`, `note`,
// `pull` (a quote set large), `formula`, `facts` (three figures in a row),
// `figure` (`title`, `sub`, `caption`, `wide`, `bare`, `badge`), and `links`
// (onward: `to` for a page of the site, `url` for another site).

// Whether the site points readers at the blog: the nav tab, the footer link
// and the home page's layer cards. Turning it off hides all three; the
// routes and the posts stay, so a direct link still opens.
export const BLOG_LISTED = true;

export const POSTS = [
  {
    slug: 'layer-15-minute-city',
    date: '2026-08-04',
    readingTime: 7,
    accent: '#b94e3b',
    // Which platform card opens this post; see src/data/platforms.js.
    layer: 'fifteen',
    en: {
      kicker: 'Layer · Proximity',
      title: 'The 15-minute city:',
      titleAccent: 'how close is what you need',
      lede: 'Nine categories of everyday service, cell by cell, on foot and by bicycle, read against the threshold the idea is named after. From Paris to Houston, the same question gets opposite answers.',
      body: [
        { figure: 'fifteen.hero', wide: true, bare: true },
        {
          p: 'For every cell of about 200 metres the layer asks one question: how long does it take, from here, to reach the nearest pharmacy, school, supermarket, park? It answers nine times, once per category, and twice more, on foot and by bicycle. Times run on the real street network from OpenStreetMap, so a river with no bridge, a rail yard with no crossing or a highway with no pavement cost what they cost in practice.',
        },
        {
          facts: [
            { value: '{fifteen.paris.15}%', text: 'of Paris’s residents reach the services within 15 minutes on foot, on average' },
            { value: '{fifteen.bogota.15}%', text: 'in Bogotá, a city of {fifteen.bogota.millions} million' },
            { value: '{fifteen.houston.15}%', text: 'in Houston, where the median resident is {fifteen.houston.median} away on foot' },
          ],
        },
        { h2: 'Reading the map' },
        {
          p: 'White sits at 15 minutes. Blue is quicker, red slower, and the scale keeps darkening past half an hour instead of stopping there. A colour means the same number of minutes in every city and for every category, so moving from Bogotá to Houston, or from healthcare to groceries, shows a difference rather than a new scale.',
        },
        {
          figure: 'fifteen.six',
          wide: true,
          title: 'Six cities, six continents, one scale',
          sub: 'Average walk to the nine services, a 34 km window, inhabited cells only',
          caption: 'Paris and Tokyo are almost entirely blue. In Houston blue survives in a few islands of a city measured in half hours. Where OpenStreetMap is less complete, times grow for that reason too, which is worth keeping in mind when reading Nairobi.',
        },
        { h2: 'One city, two lives' },
        {
          p: 'An average hides almost everything. Take two cells in Rome. The first is the most populated within 2 km of the centre, {fifteen.rome.in.residents} residents: its furthest service is {fifteen.rome.in.furthest} away. The second is the most populated between 12 and 16 km out, {fifteen.rome.out.residents} residents {fifteen.rome.out.km} km from the centre: here the furthest category, {fifteen.rome.out.category}, takes {fifteen.rome.out.furthest} on foot.',
        },
        {
          figure: 'fifteen.romeCells',
          title: 'Minutes on foot, category by category',
          sub: 'Two cells in Rome, values from the layer file',
          caption: 'Open them on the map: [the central cell](/atlas/rome?layer=fifteen&cell={fifteen.rome.in.cell}) and [the outer one](/atlas/rome?layer=fifteen&cell={fifteen.rome.out.cell}).',
        },
        { h2: 'Not every service is equally close' },
        {
          p: 'The same resident lives at very different distances depending on what they are looking for, and the gap between cities changes from one category to the next. In Paris the median resident walks {fifteen.paris.healthcare} to healthcare, in Houston {fifteen.houston.healthcare}.',
        },
        {
          figure: 'fifteen.categories',
          title: 'The median resident’s walk, by category',
          sub: 'Minutes; the dashed line is the 15-minute threshold',
          caption: 'Hover a dot for the exact value.',
        },
        { h2: 'From the compact city to the suburb' },
        {
          p: 'Counting people rather than cells is what makes cities of different shapes comparable. The curves below rise with the minutes: at 15 minutes Paris already has {fifteen.paris.15}% of its residents, Tokyo {fifteen.tokyo.15}%. Sydney sits halfway, at {fifteen.sydney.15}%. In cities built around the car the curve flattens: Phoenix reaches {fifteen.phoenix.15}%, Houston {fifteen.houston.15}%, and in Houston not even 30 minutes covers half the residents ({fifteen.houston.30}%).',
        },
        {
          figure: 'fifteen.curves',
          title: 'Residents within N minutes on foot',
          sub: 'Average of the nine categories, % of residents',
          caption: 'These are the five published points, joined by a line: between two points the data says nothing.',
        },
        {
          p: 'Widen the view to all {fifteen.big.count} cities of over a million residents and the picture by continent is stark. The middle European city has {fifteen.big.europe}% of its residents within 15 minutes; the middle North American one, {fifteen.big.northAmerica}%.',
        },
        {
          figure: 'fifteen.world',
          title: 'Residents within 15 minutes on foot, cities of over a million',
          sub: 'One dot per city; the cities in this post are marked',
          caption: 'Cities on their urban-centre boundary (GHS Urban Centre). {fifteen.big.hidden} cities of over a million are left out, as everywhere on the site: fewer than 10,000 residents covered, or a median walk over 60 minutes, a sign of data too thin to compare. A share near zero can also reflect incomplete OpenStreetMap mapping.',
        },
        {
          links: [
            { label: 'Open Bogotá', to: '/atlas/bogota?layer=fifteen' },
            { label: 'Compare cities', to: '/stats' },
            { label: 'A universal framework for inclusive 15-minute cities · Nature Cities (2024) ↗', url: 'https://doi.org/10.1038/s44284-024-00119-4' },
          ],
        },
      ],
    },
  },

  {
    slug: 'layer-citychrone',
    date: '2026-08-03',
    readingTime: 6,
    accent: '#1A1F4E',
    layer: 'citychrone',
    en: {
      kicker: 'Layer · Opportunity',
      title: 'CityChrone++:',
      titleAccent: 'the city hour by hour',
      lede: 'How far public transport takes you from every cell, and how many people it puts within reach. Two scores, twenty-four hours.',
      body: [
        { figure: 'citychrone.hero', wide: true, bare: true },
        {
          p: 'CityChrone gives every cell two scores for every hour of the day. **Velocity** says how quickly you get away from there by public transport, waits included. **Sociality** counts, with a weight, the people within reach. Neither is a time nor an exact number of people: they are scores, and the site calls them that.',
        },
        {
          p: 'Transit runs on the operators’ real timetables (GTFS). A line every fifteen minutes and a line twice a day look the same on a network map; here they do not.',
        },
        {
          facts: [
            { value: '{citychrone.tokyo.8}', text: 'the median Tokyo resident’s velocity at 8:00, against {citychrone.paris.8} in Paris' },
            { value: '{citychrone.newYork.peak}', text: 'in New York at {citychrone.newYork.peakHour}, the peak of its day' },
            { value: '{citychrone.newYork.low}', text: 'in New York at {citychrone.newYork.lowHour}, when service is thinnest' },
          ],
        },
        { h2: 'One city at four hours' },
        {
          figure: 'citychrone.hours',
          wide: true,
          title: 'New York, public transport velocity',
          sub: 'One scale for every hour: a colour means the same score at any time',
        },
        { h2: 'A whole day in one curve' },
        {
          p: 'Every city has a day of its own. New York’s median resident goes from {citychrone.newYork.low} at {citychrone.newYork.lowHour} to {citychrone.newYork.peak} at {citychrone.newYork.peakHour}. The band around New York’s curve is the middle half of its residents: where it widens, the city splits between the well served and the rest.',
        },
        {
          figure: 'citychrone.day',
          title: 'The median resident’s velocity, hour by hour',
          sub: 'The band is New York’s 25th to 75th percentile of residents',
        },
        { h2: 'Three cities at 8 in the morning' },
        {
          figure: 'citychrone.three',
          wide: true,
          title: 'Velocity at 8:00, one scale and one 36 km window',
        },
        { h2: 'Try it: isochrones' },
        {
          p: 'On a city’s map, **Isochrones** picks a cell and colours the rest of the city by travel time, up to 120 minutes. Change the hour and watch the reachable area shrink.',
        },
        {
          links: [
            { label: 'Open Tokyo', to: '/atlas/tokyo?layer=citychrone' },
            { label: 'General scores for accessibility and inequality measures in urban areas · R. Soc. Open Sci. (2019) ↗', url: 'https://doi.org/10.1098/rsos.190979' },
          ],
        },
      ],
    },
  },

  {
    slug: 'layer-car-dependency',
    date: '2026-08-02',
    readingTime: 8,
    accent: '#a04640',
    layer: 'cardep',
    en: {
      kicker: 'Layer · Car against public transport',
      title: 'Car Dependency Index:',
      titleAccent: 'how many times more a car reaches',
      lede: 'From the same doorstep, in the same time, how much can you reach by car and how much by public transport? The index reads as one ratio: 1 where the two are even, 2 where the car reaches twice as much.',
      body: [
        { figure: 'cardep.hero', wide: true, bare: true },
        { h2: 'Two scores, compared' },
        {
          p: 'The layer starts from two opportunity scores for every cell: how many points of interest, of many kinds, can be reached **by car** within a time budget, and how many **by public transport** in the same time, added up with weights. Both are on the map as views of their own. Side by side, New York shows why the comparison matters: the car’s map is dark almost everywhere, while transit’s is paler throughout and fades further toward the city’s edges. The median resident reaches {cardep.newYork.car} by car and {cardep.newYork.transit} by transit.',
        },
        {
          figure: 'cardep.carTransit',
          wide: true,
          badge: 'New view',
          title: 'New York, opportunities by car and by transit',
          sub: 'One logarithmic scale for both, 100 to 10,000, so the two read against each other',
          caption: 'Weighted counts of reachable places: scores, not metres or jobs.',
        },
        { h2: 'From −1 to +1, or from 0 to infinity' },
        {
          p: 'The index divides one by the other: **car ÷ transit**. It is 1 where the two reach the same, 2 where a car reaches twice as much, ½ where transit does, and it grows without limit where transit reaches almost nothing. Read on a logarithmic scale, twice as much either way is the same distance from 1.',
        },
        {
          p: 'Its normalised form, (car − transit) ÷ (car + transit), runs from −1 to +1 and says the same thing in other units. The site still offers it, a switch away, and the conversion is exact:',
        },
        {
          figure: 'cardep.ratioTable',
          title: 'The ratio and the normalised index',
          caption: 'Normalised = (ratio − 1) ÷ (ratio + 1).',
        },
        { h2: 'An example in numbers' },
        {
          p: 'In Midtown Manhattan, the most populated cell within 1.5 km of Times Square, car and subway reach similar amounts: the ratio is {cardep.newYork.in.ratio}. In the most populated cell between 22 and 30 km out, {cardep.newYork.out.km} km away, transit reaches {cardep.newYork.out.transit} against the car’s {cardep.newYork.out.car}: the car reaches {cardep.newYork.out.ratio} times as much.',
        },
        {
          figure: 'cardep.nyCells',
          title: 'Two New York cells',
          caption: 'The ratio from the published, rounded scores; the normalised column is the published index.',
        },
        {
          figure: 'cardep.six',
          wide: true,
          title: 'Six cities on one scale',
          sub: 'Car ÷ transit, a 34 km window, inhabited cells',
        },
        { h2: 'The picture across {cardep.cities} cities' },
        {
          p: 'For the median resident the car reaches more than transit in {cardep.carWins} of {cardep.cities} cities: almost everywhere the car is not competing with public transport, it is winning. {cardep.exceptions} The middle European city sits at {cardep.europe}, the middle North American one at {cardep.northAmerica}; Tokyo’s median resident is at {cardep.tokyo.median}. The spread matters as much as the median: in Rome the tenth of residents most dependent on a car live where it reaches more than {cardep.rome.p90} times as much.',
        },
        {
          figure: 'cardep.cities',
          title: 'Car ÷ transit, the residents of each city',
          sub: 'Dot: median resident · thick bar: middle half · thin line: 10th to 90th percentile · logarithmic',
          caption: 'Cities on their urban-centre boundary (GHS Urban Centre).',
        },
        { pull: 'In {cardep.carWins} cities out of {cardep.cities}, the typical resident can reach more by car than by public transport.' },
        {
          links: [
            { label: 'Open New York', to: '/atlas/new-york?layer=cardep' },
            { label: 'Compare cities', to: '/platforms/cardep/compare' },
            { label: 'Car Dependency in Urban Accessibility · arXiv:2604.01019 ↗', url: 'https://arxiv.org/abs/2604.01019' },
          ],
        },
      ],
    },
  },

  {
    slug: 'layer-accessibility-pov',
    date: '2026-08-01',
    readingTime: 8,
    accent: '#3b8a4f',
    layer: 'pov',
    en: {
      kicker: 'Layer · Proximity and opportunity together',
      title: 'Close & Connected:',
      titleAccent: 'what is near, and what transit reaches',
      lede: 'A lively street a long way from the metro. A station with nothing around it. Close & Connected keeps the two kinds of access apart, and shows where a city has both.',
      body: [
        { figure: 'pov.hero', wide: true, bare: true },
        {
          p: 'The layer, until now called Urban Accessibility P.O.V., puts the Atlas’s two dimensions side by side. **Proximity** is what is close by on foot, the dimension of the 15-minute city. **Opportunity** is what public transport connects you to across the city, the dimension of CityChrone. Both are scored on the same cells by the P.O.V. framework: how many services a person reaches by walking in a short time, and by public transport in a longer one.',
        },
        { h2: 'Four zones, new names' },
        {
          p: 'Split at the city’s medians, every cell falls in one of four zones. The names now say what a place has rather than what it lacks.',
        },
        {
          figure: 'pov.quadrants',
          caption: 'The medians are weighted by residents, not taken over cells: in Rome, proximity {pov.rome.proximity} and opportunity {pov.rome.opportunity}. The paper’s names were inclusion, spatial isolation, social isolation and total isolation.',
        },
        {
          p: 'The four are not a ranking with Close & Connected on top. A place that is Close needs transit; a place that is Connected needs shops, schools and services where today there is only a station. One score for both would prescribe the same cure to each.',
        },
        { h2: 'Both scores at once', badge: 'New view' },
        {
          p: 'Zones draw hard edges: a cell just above the median and one far above it get the same colour. The **Both** view drops the edges. Each score is ranked among the city’s residents, and the two ranks mix into one colour: light blue where a place has more close by than most of the city, pink where transit connects it to more, deep indigo where it has both, pale where it has little of either.',
        },
        {
          figure: 'pov.zonesBoth',
          wide: true,
          title: 'New York, zones and Both',
          sub: 'The same cells, a 30 km window',
          caption: 'The dashed lines across the square are the city’s medians, where the zones split it. Like the zones, the colours compare places within a city, not cities.',
        },
        { h2: 'The plot', badge: 'New view' },
        {
          p: 'The map shows where; the plot shows how far. It places every inhabited cell by its two scores instead of its location: opportunity along the bottom, proximity up the side, each dot sized by its residents and coloured by its zone. The dashed lines are the city’s medians, so each quarter of the plot is one zone. Here are Rome’s {pov.rome.cells} inhabited cells.',
        },
        {
          figure: 'pov.scatter',
          title: 'Rome, every inhabited cell by its two scores',
          sub: 'Dot area proportional to residents; dashed lines at the city’s medians',
          caption: 'On the site the plot is a view of the city map, on a computer: hovering a dot reads it, clicking selects its cell on the map.',
        },
        { h2: 'Cells and residents tell different stories' },
        {
          p: 'In Rome {pov.rome.totalCells}% of cells are in total isolation, but only {pov.rome.totalResidents}% of residents live in them: isolated cells are large and thinly settled. In New York the figures are {pov.newYork.totalCells}% of cells and {pov.newYork.totalResidents}% of residents, in Paris {pov.paris.totalCells}% and {pov.paris.totalResidents}%. The site always publishes both and says which one it shows.',
        },
        {
          figure: 'pov.cellsResidents',
          title: 'Shares of cells and of residents by zone',
          sub: 'Zones at each city’s own medians',
        },
        {
          figure: 'pov.six',
          wide: true,
          title: 'Six cities, each on its own medians',
          sub: 'A 34 km window. Zones compare places within a city, not cities with each other.',
          caption: 'In all six, Close & Connected holds the centre and total isolation the edges. In Chicago the core follows the lakefront; in Seattle it stretches between the two shores; Paris, which stops at the city limits, is nearly all core.',
        },
        {
          links: [
            { label: 'Open Paris', to: '/atlas/paris?layer=pov' },
            { label: 'Compare cities', to: '/platforms/pov/compare' },
            { label: 'The dimensions of accessibility: proximity, opportunities, values · EPJ Data Science (2026) ↗', url: 'https://doi.org/10.1140/epjds/s13688-026-00623-8' },
          ],
        },
      ],
    },
  },
];

// The post that introduces one layer, by platform id — what the home page's
// cards link to.
export const POST_BY_LAYER = Object.fromEntries(
  POSTS.filter((post) => post.layer).map((post) => [post.layer, post]),
);

export function postForLayer(layerId) {
  return POST_BY_LAYER[layerId] ?? null;
}

export const POSTS_BY_SLUG = Object.fromEntries(POSTS.map((post) => [post.slug, post]));

export function postBySlug(slug) {
  return POSTS_BY_SLUG[slug] ?? null;
}
