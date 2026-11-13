// Blog posts. Long-form copy lives here rather than in the i18n dictionaries:
// the dictionaries are flat UI strings, and an article is a structured
// document. Each post carries both locales; `body` is a list of blocks the
// post page renders — `h2`, `p`, `ul`, `note`, or `links` (a row of outward
// links: the platform itself, the paper behind it).
//
// The four `layer-…` posts are what the home page's cards open. Each one
// introduces a single layer of the Atlas and hands the reader on to the
// platform and to the paper that defines its method — so a card can say
// "More info" and mean it, rather than dropping a first-time visitor
// straight into someone else's viewer.
//
// Figures quoted in the prose are computed from the published datasets in
// public/data/ — the compare rows in <platform>/summary.json.gz, written by
// the importers (scripts/lib/bundle.mjs, describeLayer).

import { BRAND } from './brand.js';

// Whether the site points readers at the blog: the nav tab, the footer link
// and the home page's layer cards. Turning it off hides all three; the
// routes and the posts stay, so a direct link still opens.
export const BLOG_LISTED = true;

export const POSTS = [
  {
    slug: 'layer-15-minute-city',
    date: '2026-08-04',
    readingTime: 4,
    accent: '#b94e3b',
    // Which platform card opens this post; see src/data/platforms.js.
    layer: 'fifteen',

    en: {
      title: '15-minute city: the layer that measures proximity',
      lede: 'How long it takes to walk or cycle to the things a day is made of — nine categories of everyday service, cell by cell, read against the 15-minute reference.',
      body: [
        {
          p: 'The proximity layer answers one question for every 200 m cell of a city: how long does it take, from here, to reach the nearest pharmacy, school, bakery, park, gym, bus stop? It answers it nine times over — once per category of service — and twice again, on foot and by bicycle.',
        },
        {
          p: 'The times are not straight-line distances. They are computed on the real street network from OpenStreetMap with OSRM, so a river without a bridge, a railway without a crossing, or a motorway with no pavement all cost what they cost in practice.',
        },
        { h2: 'Reading the map' },
        {
          p: 'White sits at 15 minutes — the reference the idea is named after. Cooler colours are quicker than that, warmer ones slower, and the scale keeps darkening past 30 minutes rather than stopping there, because in most cities a real share of cells sit well beyond half an hour from some category of service.',
        },
        {
          p: 'One scale serves all nine categories and both modes. That is deliberate: a colour means the same number of minutes whatever is selected, so switching from healthcare to schools shows you a difference rather than recolouring the same city.',
        },
        { h2: 'What it does not say' },
        {
          ul: [
            'It counts what is reachable, never how good it is. Four schools within ten minutes is not a claim about those schools.',
            'It assumes an average walker. Someone with a pram, a wheelchair or a heavy shopping bag is in a different city, which is a separate project rather than a correction factor.',
            'Coverage follows the data: a city needs good OpenStreetMap coverage before any of this is worth publishing.',
          ],
        },
        {
          note: 'Proximity is one of the three dimensions of the framework — the other two are opportunity and value. What a city can offer within walking distance is not the same as what it can offer at all.',
        },
        {
          links: [
            { label: 'Open the 15-minute city platform ↗', url: 'https://whatif.sonycsl.it/15mincity' },
            {
              label: 'A universal framework for inclusive 15-minute cities — Nature Cities (2024) ↗',
              url: 'https://doi.org/10.1038/s44284-024-00119-4',
            },
          ],
        },
      ],
    },

    it: {
      title: 'Città dei 15 minuti: il layer che misura la prossimità',
      lede: 'Quanto ci vuole, a piedi o in bicicletta, per raggiungere le cose di cui è fatta una giornata — nove categorie di servizi quotidiani, cella per cella, lette rispetto al riferimento dei 15 minuti.',
      body: [
        {
          p: 'Il layer della prossimità risponde a una domanda per ogni cella da 200 m di una città: quanto ci vuole, da qui, per raggiungere la farmacia, la scuola, il forno, il parco, la palestra, la fermata più vicini? Risponde nove volte — una per categoria di servizio — e altre due, a piedi e in bicicletta.',
        },
        {
          p: 'I tempi non sono distanze in linea d’aria: sono calcolati sulla rete stradale reale di OpenStreetMap con OSRM, quindi un fiume senza ponte, una ferrovia senza attraversamento o una tangenziale senza marciapiede costano quello che costano davvero.',
        },
        { h2: 'Come si legge la mappa' },
        {
          p: 'Il bianco sta a 15 minuti — il riferimento da cui l’idea prende il nome. I colori freddi sono più rapidi, quelli caldi più lenti, e la scala continua a scurirsi oltre i 30 minuti invece di fermarsi lì: nella maggior parte delle città una quota reale di celle sta ben oltre la mezz’ora da qualche categoria di servizio.',
        },
        {
          p: 'Una sola scala vale per tutte e nove le categorie e per entrambe le modalità. È voluto: un colore significa lo stesso numero di minuti qualunque cosa sia selezionata, così passare dalla sanità alle scuole mostra una differenza invece di ricolorare la stessa città.',
        },
        { h2: 'Cosa non dice' },
        {
          ul: [
            'Conta ciò che è raggiungibile, mai quanto sia buono. Quattro scuole a dieci minuti non sono un giudizio su quelle scuole.',
            'Assume una persona che cammina a velocità media. Chi spinge un passeggino, usa una sedia a rotelle o porta la spesa vive un’altra città: è un progetto a sé, non un fattore correttivo.',
            'La copertura segue i dati: serve una buona mappatura OpenStreetMap prima che valga la pena pubblicare qualcosa.',
          ],
        },
        {
          note: 'La prossimità è una delle tre dimensioni del quadro teorico — le altre sono opportunità e valore. Ciò che una città offre a distanza pedonale non è ciò che una città offre.',
        },
        {
          links: [
            { label: 'Apri la piattaforma 15-minute city ↗', url: 'https://whatif.sonycsl.it/15mincity' },
            {
              label: 'A universal framework for inclusive 15-minute cities — Nature Cities (2024) ↗',
              url: 'https://doi.org/10.1038/s44284-024-00119-4',
            },
          ],
        },
      ],
    },
  },

  {
    slug: 'layer-citychrone',
    date: '2026-08-03',
    readingTime: 4,
    accent: BRAND.navy,
    layer: 'citychrone',

    en: {
      title: 'CityChrone++: the layer that measures opportunity',
      lede: 'A city measured in minutes of public transport rather than in kilometres — hour by hour, because a timetable is not a map.',
      body: [
        {
          p: 'Some things a city has few of: hospitals, universities, concert halls, most jobs. They cannot be within walking distance of everyone, so what matters is not how near they are but how quickly public transport gets you to them. That is opportunity, and it is what this layer measures.',
        },
        {
          p: 'Two scores per cell. The velocity score describes how fast transport moves you outward from that cell — a km/h-like figure, and the one this layer opens on. The sociality score is a weighted count of the people transport puts within reach of it; it is a score, never a headcount.',
        },
        { h2: 'Why the hour matters' },
        {
          p: 'The layer is published once per hour of the day, all twenty-four. A network is not a fixed object: the same cell can be twenty minutes from the centre at 8 a.m. and an hour from it at 11 p.m., and a single daily average hides exactly the difference that decides whether a night shift is reachable without a car.',
        },
        {
          p: 'Timetables are read as timetables — actual departures from GTFS feeds, evaluated with the Connection Scan Algorithm, waiting time included. A line running four times an hour and one running twice a day look identical on a route map and are not the same city to live in.',
        },
        { h2: 'Isochrones' },
        {
          p: 'The third view drops the scores and answers a simpler question: from this cell, at this hour, how long does it take to reach everywhere else? Click a cell and the city redraws itself in minutes from it.',
        },
        {
          links: [
            { label: 'Open the CityChrone platform ↗', url: 'https://whatif.sonycsl.it/citychrone' },
            {
              label:
                'General scores for accessibility and inequality measures in urban areas — R. Soc. Open Sci. (2019) ↗',
              url: 'https://doi.org/10.1098/rsos.190979',
            },
          ],
        },
      ],
    },

    it: {
      title: 'CityChrone++: il layer che misura le opportunità',
      lede: 'Una città misurata in minuti di trasporto pubblico invece che in chilometri — ora per ora, perché un orario non è una mappa.',
      body: [
        {
          p: 'Di alcune cose una città ha pochi esemplari: ospedali, università, teatri, gran parte dei posti di lavoro. Non possono essere a distanza pedonale da tutti, quindi non conta quanto siano vicini ma quanto in fretta il trasporto pubblico ci porti. Questa è l’opportunità, ed è ciò che misura questo layer.',
        },
        {
          p: 'Due punteggi per cella. Il punteggio di velocità descrive quanto rapidamente il trasporto pubblico ti allontana da quella cella — una grandezza simile a dei km/h, ed è quella con cui il layer si apre. Il punteggio di socialità è un conteggio pesato delle persone che il trasporto pubblico mette alla sua portata: è un punteggio, mai un numero di persone.',
        },
        { h2: 'Perché conta l’ora' },
        {
          p: 'Il layer è pubblicato una volta per ogni ora del giorno, tutte e ventiquattro. Una rete non è un oggetto fisso: la stessa cella può stare a venti minuti dal centro alle 8 e a un’ora alle 23, e una media giornaliera nasconde proprio la differenza che decide se un turno di notte sia raggiungibile senza auto.',
        },
        {
          p: 'Gli orari sono letti come orari — partenze reali dai feed GTFS, valutate con il Connection Scan Algorithm, attesa compresa. Una linea che passa quattro volte all’ora e una che passa due volte al giorno sono identiche su una mappa di rete e non sono la stessa città in cui vivere.',
        },
        { h2: 'Isocrone' },
        {
          p: 'La terza vista lascia da parte i punteggi e risponde a una domanda più semplice: da questa cella, a quest’ora, quanto ci vuole per raggiungere tutto il resto? Si clicca una cella e la città si ridisegna in minuti da lì.',
        },
        {
          links: [
            { label: 'Apri la piattaforma CityChrone ↗', url: 'https://whatif.sonycsl.it/citychrone' },
            {
              label:
                'General scores for accessibility and inequality measures in urban areas — R. Soc. Open Sci. (2019) ↗',
              url: 'https://doi.org/10.1098/rsos.190979',
            },
          ],
        },
      ],
    },
  },

  {
    slug: 'layer-car-dependency',
    date: '2026-08-02',
    readingTime: 4,
    accent: '#a04640',
    layer: 'cardep',

    en: {
      title: 'Car Dependency Index: the layer that compares the two',
      lede: 'One number per cell for a question everyone in a city has an opinion about: does the car reach more than public transport does, and by how much?',
      body: [
        {
          p: 'The index compares what a car can reach with what public transport can reach from the same cell in the same time budget, and writes the comparison as a single number:',
        },
        {
          p: 'CDI = (O_car − O_PT) / (O_car + O_PT)',
        },
        {
          p: 'It runs from −1, where transit reaches everything and the car almost nothing, through 0 where the two are balanced, to +1 where the car reaches everything and transit almost nothing. It is a normalised difference, not a ratio: it does not say "the car reaches three times as much", and it cannot be read that way.',
        },
        { h2: 'Reading the map' },
        {
          p: 'Blue is transit-favoured, white is balanced, red is car-dependent. The scale is fixed across every published city rather than fitted to each, so the same colour is the same index in Paris and in Palermo — a city is never recoloured to fill the palette.',
        },
        {
          p: 'The car side is not a straight-line optimum either: driving times carry city-specific traffic delays and a parking buffer, because a car journey ends with finding somewhere to leave the car.',
        },
        { h2: 'Cells and people are different stories' },
        {
          p: 'Half a city’s cells can be car-dependent while most of its residents are not, because the car-dependent ones are large and thinly populated. The panel therefore reports the index for the average resident — every cell weighted by the people in it — alongside the median cell, and the two are worth reading together.',
        },
        {
          links: [
            { label: 'Open the Car Dependency Index platform ↗', url: 'https://mat701.github.io/CDI' },
            {
              label: 'Car Dependency in Urban Accessibility — arXiv:2604.01019 ↗',
              url: 'https://arxiv.org/abs/2604.01019',
            },
          ],
        },
      ],
    },

    it: {
      title: 'Car Dependency Index: il layer che mette a confronto i due',
      lede: 'Un numero per cella su una domanda su cui in città hanno tutti un’opinione: l’auto raggiunge più cose del trasporto pubblico, e di quanto?',
      body: [
        {
          p: 'L’indice confronta ciò che raggiunge un’auto con ciò che raggiunge il trasporto pubblico dalla stessa cella nello stesso tempo, e scrive il confronto come un numero solo:',
        },
        {
          p: 'CDI = (O_auto − O_TP) / (O_auto + O_TP)',
        },
        {
          p: 'Va da −1, dove il trasporto pubblico raggiunge tutto e l’auto quasi nulla, passa per lo 0 dell’equilibrio e arriva a +1, dove l’auto raggiunge tutto e il trasporto pubblico quasi nulla. È una differenza normalizzata, non un rapporto: non dice “l’auto raggiunge tre volte tanto”, e non si può leggere così.',
        },
        { h2: 'Come si legge la mappa' },
        {
          p: 'Il blu è a favore del trasporto pubblico, il bianco è equilibrio, il rosso è dipendenza dall’auto. La scala è fissa su tutte le città pubblicate invece di essere adattata a ciascuna: lo stesso colore è lo stesso indice a Parigi e a Palermo, e nessuna città viene ricolorata per riempire la tavolozza.',
        },
        {
          p: 'Nemmeno il lato auto è un ottimo teorico: i tempi di guida includono i ritardi da traffico specifici della città e un margine per il parcheggio, perché un viaggio in auto finisce quando si trova dove lasciarla.',
        },
        { h2: 'Celle e persone raccontano cose diverse' },
        {
          p: 'Metà delle celle di una città possono essere car-dependent mentre la maggior parte di chi ci vive non lo è, perché quelle celle sono ampie e poco popolate. Il pannello riporta perciò l’indice per l’abitante medio — ogni cella pesata per le persone che ci vivono — accanto alla cella mediana: vanno letti insieme.',
        },
        {
          links: [
            { label: 'Apri la piattaforma Car Dependency Index ↗', url: 'https://mat701.github.io/CDI' },
            {
              label: 'Car Dependency in Urban Accessibility — arXiv:2604.01019 ↗',
              url: 'https://arxiv.org/abs/2604.01019',
            },
          ],
        },
      ],
    },
  },

  {
    slug: 'layer-accessibility-pov',
    date: '2026-08-01',
    readingTime: 5,
    accent: BRAND.navy,
    layer: 'pov',

    en: {
      title: 'Urban Accessibility P.O.V.: the layer that puts them together',
      lede: 'Proximity on one axis, opportunity on the other, and four zones instead of a ranking — because being cut off from the shops and being cut off from the city are different problems.',
      body: [
        {
          p: 'P.O.V. stands for Proximity, Opportunity, Value: the three dimensions of the framework the Atlas is built on. This layer measures the first two for every cell and classifies each one against the city’s own thresholds.',
        },
        {
          p: 'A cell is counted as high on an axis when it sits above that city’s population-weighted median — weighted, so the threshold reflects where people actually live rather than the geometry of the mesh. Two yes/no answers give four zones.',
        },
        {
          ul: [
            '**Inclusion** — served locally and connected city-wide.',
            '**Spatial isolation** — everything nearby, but poorly linked to the rest of the city.',
            '**Social isolation** — good transit into the centre, little within walking distance.',
            '**Total isolation** — neither. Typically the periphery, and typically where a car stops being a convenience.',
          ],
        },
        { h2: 'Why four zones and not one score' },
        {
          p: 'Collapse access into a single number and spatial isolation and social isolation come out the same. They are not: one is solved by transport, the other by land use. A single score would recommend the same intervention for both and be wrong for one of them.',
        },
        { h2: 'Zones compare within a city, not between cities' },
        {
          p: 'The thresholds are city-specific, so a cell classed as inclusion in a sparse city might rank as isolated in a dense one. Comparing cities is what the underlying scores are for — and they are weighted counts of reachable points of interest, which is why they carry no unit: not metres, not jobs.',
        },
        {
          note: 'The third dimension, value, is set out in the framework and is not yet quantified. Nothing in this layer claims to measure how good the reachable things are.',
        },
        {
          links: [
            {
              label: 'Open the Urban Accessibility P.O.V. platform ↗',
              url: 'https://mat701.github.io/accessibility-pov',
            },
            {
              label:
                'The dimensions of accessibility: proximity, opportunities, values — EPJ Data Science (2026) ↗',
              url: 'https://doi.org/10.1140/epjds/s13688-026-00623-8',
            },
          ],
        },
      ],
    },

    it: {
      title: 'Urban Accessibility P.O.V.: il layer che li mette insieme',
      lede: 'Prossimità su un asse, opportunità sull’altro, e quattro zone invece di una classifica — perché essere tagliati fuori dai negozi ed essere tagliati fuori dalla città sono problemi diversi.',
      body: [
        {
          p: 'P.O.V. sta per Proximity, Opportunity, Value: le tre dimensioni del quadro teorico su cui è costruito l’Atlante. Questo layer misura le prime due per ogni cella e classifica ciascuna rispetto alle soglie della sua città.',
        },
        {
          p: 'Una cella è considerata alta su un asse quando sta sopra la mediana pesata sulla popolazione di quella città — pesata, così la soglia riflette dove le persone vivono davvero e non la geometria della maglia. Due risposte sì/no danno quattro zone.',
        },
        {
          ul: [
            '**Inclusione** — servita localmente e collegata al resto della città.',
            '**Isolamento spaziale** — tutto vicino, ma mal collegata al resto della città.',
            '**Isolamento sociale** — buon collegamento verso il centro, poco a distanza pedonale.',
            '**Isolamento totale** — nessuno dei due. Di norma la periferia, e di norma dove l’auto smette di essere una comodità.',
          ],
        },
        { h2: 'Perché quattro zone e non un punteggio' },
        {
          p: 'Se si riduce l’accesso a un numero solo, isolamento spaziale e isolamento sociale risultano uguali. Non lo sono: uno si risolve col trasporto, l’altro con l’uso del suolo. Un punteggio unico suggerirebbe lo stesso intervento per entrambi, sbagliando su uno dei due.',
        },
        { h2: 'Le zone confrontano dentro una città, non fra città' },
        {
          p: 'Le soglie sono specifiche di ogni città, quindi una cella classificata come inclusione in una città rada potrebbe risultare isolata in una densa. A confrontare le città servono i punteggi — che sono conteggi pesati di punti di interesse raggiungibili, ed è per questo che non portano unità: non metri, non posti di lavoro.',
        },
        {
          note: 'La terza dimensione, il valore, è definita nel quadro teorico e non è ancora quantificata. Nulla in questo layer pretende di misurare quanto siano buone le cose raggiungibili.',
        },
        {
          links: [
            {
              label: 'Apri la piattaforma Urban Accessibility P.O.V. ↗',
              url: 'https://mat701.github.io/accessibility-pov',
            },
            {
              label:
                'The dimensions of accessibility: proximity, opportunities, values — EPJ Data Science (2026) ↗',
              url: 'https://doi.org/10.1140/epjds/s13688-026-00623-8',
            },
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
