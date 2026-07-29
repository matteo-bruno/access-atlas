// Blog posts. Long-form copy lives here rather than in the i18n dictionaries:
// the dictionaries are flat UI strings, and an article is a structured
// document. Each post carries both locales; `body` is a list of blocks the
// post page renders — `h2`, `p`, `ul`, or `note`.
//
// Figures quoted in the prose are computed from the published datasets in
// public/data/ — see scripts/build-data.mjs, which recomputes them.

import { BRAND } from './brand.js';

export const POSTS = [
  {
    slug: 'what-the-atlas-measures',
    date: '2026-07-29',
    readingTime: 9,
    accent: BRAND.navy,

    en: {
      title: 'What the Atlas measures, and why it matters',
      lede: 'Access is not one thing. Pulling it apart into what you can walk to, what transit can reach, and what any of it is worth turns a slogan into something you can measure — and argue with.',
      body: [
        {
          p: 'Almost every claim made about a city is, underneath, a claim about access. That a neighbourhood is liveable. That a transport project is worth its cost. That a district has been left behind. These are statements about what the people who live somewhere can reach, and how easily. They are made constantly, and usually without numbers.',
        },
        {
          p: 'The Access Atlas is an attempt to put numbers under them. It gathers four research platforms built by the Sustainable Cities team at Sony CSL Rome, each measuring a different facet of access, all sharing one framework and one spatial grid. This post is a plain description of what that framework claims, what the maps actually show, and — just as important — what they do not.',
        },

        { h2: 'Access is three things, not one' },
        {
          p: 'The framework the Atlas is built on separates access into three dimensions. Keeping them apart is the whole point, because they behave differently and can pull in opposite directions.',
        },
        {
          ul: [
            '**Proximity** — what you can reach on foot, in minutes: a pharmacy, a school, a bakery, a park. This is the dimension the “15-minute city” made famous.',
            '**Opportunity** — what public transport puts within a time budget: jobs, universities, hospitals, theatres. Things a city has few of, which therefore cannot be everywhere.',
            '**Value** — how good the reachable things actually are. A neighbourhood with four failing schools is not equivalent to one with four good ones.',
          ],
        },
        {
          p: 'The Atlas measures the first two. The third is set out in the framework and is genuinely hard: it requires judgements about quality that are neither universal nor politically neutral. Nothing on this site claims to measure value, and where you see a score it is proximity or opportunity, never quality.',
        },
        {
          note: 'The framework is described in full in Bruno et al., “The dimensions of accessibility: proximity, opportunities, values”, EPJ Data Science 15:22 (2026).',
        },

        { h2: 'Why separating them changes the answer' },
        {
          p: 'Treat access as a single number and cities that are quite different collapse into the same score. Separate proximity from opportunity and a structure appears: each cell of a city is either above or below its city’s median on each axis, which gives four situations rather than a ranking.',
        },
        {
          ul: [
            '**Inclusion** — well served locally *and* well connected. Both axes high.',
            '**Spatial isolation** — a lively neighbourhood with everything nearby, but poorly linked to the rest of the city. Local life is fine; the job market is far away.',
            '**Social isolation** — good transit into the centre, but little within walking distance. Common in post-war housing built around a station and not much else.',
            '**Total isolation** — neither. Typically the periphery, and typically where a car stops being a convenience and becomes a requirement.',
          ],
        },
        {
          p: 'These four are not a quality ranking with inclusion at the top. Spatial and social isolation are different problems with different remedies: one is solved by transport, the other by land use. A single access score would recommend the same intervention for both, and would be wrong for one of them.',
        },

        { h2: 'What the numbers look like' },
        {
          p: 'Rome, the city we know best and the one where the mesh is densest, is divided into 8,089 hexagonal cells of about 200 m. Of those, 12.9% fall in the inclusion zone and 83.0% in total isolation. Cells, not people — the isolated ones are large and thinly populated, which is exactly why the classification thresholds are weighted by population rather than taken as a plain median.',
        },
        {
          p: 'That distribution is not universal. Porto and Paris place around 37% of their cells in inclusion; Rome and Málaga sit near the bottom of the published set. The contrast is not a league table so much as a description of urban form: compact cities with dense service networks concentrate access, sprawling ones dilute it.',
        },
        {
          p: 'The Car Dependency Index makes the same point from the other direction. It compares what a car reaches with what transit reaches in the same time, as a single number from −1 (transit reaches more) through 0 (balanced) to +1 (the car reaches everything and transit almost nothing). Across the published cities, the population-weighted index is positive nearly everywhere. Central Paris is the clearest exception; Florence and Rome sit at the car-dependent end. In most of the cities we have measured, for most of the people in them, the car is not competing with public transport — it is winning.',
        },

        { h2: 'How it is measured' },
        {
          p: 'The method matters more than the maps, because the maps are only as good as it is.',
        },
        {
          ul: [
            'Cells are **H3 hexagons at resolution 9**, roughly 200 m across — small enough to distinguish neighbourhoods, large enough that population data is meaningful inside one.',
            'Street networks and points of interest come from **OpenStreetMap**; walking times are computed on the real network with **OSRM**, not as straight-line distance.',
            'Public transport uses operators’ **GTFS** schedules evaluated with the **Connection Scan Algorithm** — actual departures at actual times, including the wait, rather than an assumed average frequency.',
            'Population comes from **WorldPop** 100 m grids adjusted to UN estimates.',
          ],
        },
        {
          p: 'The choice to model timetables properly is the expensive one, and the one that matters most. A service running four times an hour and a service running twice a day can look identical on a route map. They are not the same city to live in, and a scheduled model is what tells them apart.',
        },

        { h2: 'What the maps do not show' },
        {
          p: 'Four limits worth stating plainly, because a convincing map invites over-reading.',
        },
        {
          ul: [
            '**Quality is absent.** Counting reachable schools says nothing about whether they are good. This is the missing third dimension, not an oversight.',
            '**Zones are relative to their own city.** A cell classed as inclusion in a sparse city might rank as isolated in a dense one. Zones compare places within a city; the underlying scores are what compare between cities.',
            '**Coverage follows the data.** A city needs well-mapped OpenStreetMap coverage and a usable public GTFS feed. Absence from the Atlas reflects data availability, not judgement.',
            '**An average person is assumed.** Walking speed is a single value. Someone using a wheelchair, pushing a pram, or travelling with children experiences a different city — which is why accessibility for specific needs is a separate project rather than a correction factor.',
          ],
        },

        { h2: 'Why publish it this way' },
        {
          p: 'Everything here is open: the papers are open access, the code is MIT, the datasets are downloadable under CC BY-NC 4.0. That is partly principle and partly self-interest — measurements that inform planning decisions should be checkable by the people those decisions land on, and an index nobody can audit is an index nobody should trust.',
        },
        {
          p: 'It also means the Atlas can be argued with. If a threshold looks wrong, the code that sets it is readable. If a city’s numbers look implausible, the input data is downloadable. That is a more useful contribution than another confident map.',
        },
        {
          p: 'Start with a city you know well. You will see immediately whether the classification matches your experience of it — and if it does not, we would like to hear why.',
        },
      ],
    },

    it: {
      title: 'Cosa misura l’Atlante, e perché è rilevante',
      lede: 'L’accesso non è una cosa sola. Separarlo in ciò che si raggiunge a piedi, ciò che raggiunge il trasporto pubblico e quanto vale davvero trasforma uno slogan in qualcosa di misurabile — e discutibile.',
      body: [
        {
          p: 'Quasi ogni affermazione su una città è, in fondo, un’affermazione sull’accesso. Che un quartiere sia vivibile. Che un’opera di trasporto valga il suo costo. Che una periferia sia stata abbandonata. Sono affermazioni su ciò che chi vive in un luogo riesce a raggiungere, e con quale facilità. Si fanno di continuo, quasi sempre senza numeri.',
        },
        {
          p: 'L’Access Atlas prova a metterci dei numeri sotto. Raccoglie quattro piattaforme di ricerca costruite dal team Sustainable Cities di Sony CSL Roma, ciascuna dedicata a un aspetto diverso dell’accesso, tutte con lo stesso quadro teorico e la stessa griglia spaziale. Questo articolo descrive cosa afferma quel quadro, cosa mostrano davvero le mappe e — altrettanto importante — cosa non mostrano.',
        },

        { h2: 'L’accesso è tre cose, non una' },
        {
          p: 'Il quadro su cui è costruito l’Atlante separa l’accesso in tre dimensioni. Tenerle distinte è il punto centrale, perché si comportano in modo diverso e possono tirare in direzioni opposte.',
        },
        {
          ul: [
            '**Prossimità** — ciò che si raggiunge a piedi, in minuti: una farmacia, una scuola, un forno, un parco. È la dimensione resa celebre dalla “città dei 15 minuti”.',
            '**Opportunità** — ciò che il trasporto pubblico rende raggiungibile entro un budget di tempo: lavoro, università, ospedali, teatri. Cose di cui una città ha pochi esemplari, e che quindi non possono essere ovunque.',
            '**Valore** — quanto valgono davvero le cose raggiungibili. Un quartiere con quattro scuole in difficoltà non equivale a uno con quattro scuole buone.',
          ],
        },
        {
          p: 'L’Atlante misura le prime due. La terza è definita nel quadro teorico ed è genuinamente difficile: richiede giudizi di qualità che non sono né universali né politicamente neutri. Nulla in questo sito pretende di misurare il valore: dove vedete un punteggio è prossimità o opportunità, mai qualità.',
        },
        {
          note: 'Il quadro completo è descritto in Bruno et al., “The dimensions of accessibility: proximity, opportunities, values”, EPJ Data Science 15:22 (2026).',
        },

        { h2: 'Perché separarle cambia la risposta' },
        {
          p: 'Se si tratta l’accesso come un numero solo, città molto diverse collassano sullo stesso punteggio. Separando prossimità e opportunità emerge una struttura: ogni cella è sopra o sotto la mediana della propria città su ciascun asse, e questo produce quattro situazioni invece di una classifica.',
        },
        {
          ul: [
            '**Inclusione** — ben servita localmente *e* ben collegata. Entrambi gli assi alti.',
            '**Isolamento spaziale** — un quartiere vivo, con tutto vicino, ma mal collegato al resto della città. La vita locale funziona; il mercato del lavoro è lontano.',
            '**Isolamento sociale** — buon collegamento verso il centro, ma poco a distanza pedonale. Tipico dell’edilizia costruita attorno a una stazione e poco altro.',
            '**Isolamento totale** — nessuno dei due. Di norma la periferia, e di norma il punto in cui l’automobile smette di essere una comodità e diventa un requisito.',
          ],
        },
        {
          p: 'Le quattro zone non sono una graduatoria con l’inclusione in cima. Isolamento spaziale e sociale sono problemi diversi con rimedi diversi: uno si risolve col trasporto, l’altro con l’uso del suolo. Un punteggio unico suggerirebbe lo stesso intervento per entrambi, sbagliando su uno dei due.',
        },

        { h2: 'Che aspetto hanno i numeri' },
        {
          p: 'Roma, la città che conosciamo meglio e dove la maglia è più densa, è divisa in 8.089 celle esagonali di circa 200 m. Di queste, il 12,9% ricade nella zona di inclusione e l’83,0% in isolamento totale. Celle, non persone — quelle isolate sono ampie e poco popolate, ed è esattamente per questo che le soglie di classificazione sono pesate sulla popolazione anziché prese come mediana semplice.',
        },
        {
          p: 'Questa distribuzione non è universale. Porto e Parigi collocano circa il 37% delle celle in inclusione; Roma e Málaga stanno in fondo all’insieme pubblicato. Il confronto non è una classifica quanto una descrizione della forma urbana: le città compatte con reti di servizi dense concentrano l’accesso, quelle diffuse lo diluiscono.',
        },
        {
          p: 'Il Car Dependency Index dice la stessa cosa dall’altro lato. Confronta ciò che raggiunge l’automobile con ciò che raggiunge il trasporto pubblico nello stesso tempo, in un unico numero da −1 (il trasporto pubblico raggiunge di più) a 0 (equilibrio) fino a +1 (l’auto raggiunge tutto, il trasporto pubblico quasi nulla). Nelle città pubblicate l’indice pesato sulla popolazione è positivo quasi ovunque. Parigi centrale è l’eccezione più netta; Firenze e Roma stanno all’estremo della dipendenza dall’auto. Nella maggior parte delle città che abbiamo misurato, per la maggior parte di chi ci vive, l’auto non è in competizione col trasporto pubblico — sta vincendo.',
        },

        { h2: 'Come viene misurato' },
        {
          p: 'Il metodo conta più delle mappe, perché le mappe valgono quanto vale il metodo.',
        },
        {
          ul: [
            'Le celle sono **esagoni H3 a risoluzione 9**, circa 200 m — abbastanza piccoli da distinguere i quartieri, abbastanza grandi perché il dato di popolazione al loro interno abbia senso.',
            'Rete stradale e punti di interesse vengono da **OpenStreetMap**; i tempi a piedi sono calcolati sulla rete reale con **OSRM**, non in linea d’aria.',
            'Il trasporto pubblico usa gli orari **GTFS** degli operatori, valutati con il **Connection Scan Algorithm** — partenze reali a orari reali, attesa compresa, invece di una frequenza media assunta.',
            'La popolazione viene dalle griglie **WorldPop** a 100 m, riscalate sulle stime ONU.',
          ],
        },
        {
          p: 'Modellare gli orari sul serio è la scelta costosa, ed è quella che pesa di più. Una linea che passa quattro volte all’ora e una che passa due volte al giorno sono identiche su una mappa di rete. Non sono la stessa città in cui vivere, e solo un modello a orario le distingue.',
        },

        { h2: 'Cosa le mappe non mostrano' },
        {
          p: 'Quattro limiti che vale la pena dichiarare, perché una mappa convincente invita a leggerci più di quanto ci sia.',
        },
        {
          ul: [
            '**La qualità è assente.** Contare le scuole raggiungibili non dice se siano buone. È la terza dimensione mancante, non una svista.',
            '**Le zone sono relative alla propria città.** Una cella classificata come inclusione in una città rada potrebbe risultare isolata in una densa. Le zone confrontano luoghi dentro una città; sono i punteggi a confrontare fra città.',
            '**La copertura segue i dati.** Servono una buona mappatura OpenStreetMap e un feed GTFS pubblico utilizzabile. L’assenza dall’Atlante riflette la disponibilità dei dati, non un giudizio.',
            '**Si assume una persona media.** La velocità di camminata è un valore unico. Chi usa una sedia a rotelle, spinge un passeggino o viaggia con bambini vive una città diversa — ed è per questo che l’accessibilità per esigenze specifiche è un progetto a sé e non un fattore correttivo.',
          ],
        },

        { h2: 'Perché pubblicarlo così' },
        {
          p: 'Tutto qui è aperto: gli articoli sono open access, il codice è MIT, i dati sono scaricabili con licenza CC BY-NC 4.0. In parte è un principio, in parte è interesse nostro — misure che informano decisioni di pianificazione dovrebbero essere verificabili da chi quelle decisioni le subisce, e un indice che nessuno può controllare è un indice di cui nessuno dovrebbe fidarsi.',
        },
        {
          p: 'Significa anche che con l’Atlante si può discutere. Se una soglia sembra sbagliata, il codice che la fissa è leggibile. Se i numeri di una città sembrano implausibili, i dati di partenza sono scaricabili. È un contributo più utile dell’ennesima mappa sicura di sé.',
        },
        {
          p: 'Cominciate da una città che conoscete bene. Vedrete subito se la classificazione corrisponde alla vostra esperienza — e se non corrisponde, ci farebbe piacere sapere perché.',
        },
      ],
    },
  },
];

export const POSTS_BY_SLUG = Object.fromEntries(POSTS.map((post) => [post.slug, post]));

export function postBySlug(slug) {
  return POSTS_BY_SLUG[slug] ?? null;
}
