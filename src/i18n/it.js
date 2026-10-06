// Italian copy. Draft translation of en.js — reviewed by the Rome team before
// launch. Keep the key shape identical to en.js.

export default {
  meta: {
    locale: 'it-IT',
    name: 'Italiano',
  },

  nav: {
    // Il nome è il nome, anche in italiano: è così che l'Atlante si chiama.
    title: 'Accessibility Atlas',
    tagline: 'Sony CSL · Roma — Città Sostenibili',
    atlas: 'Home',
    platforms: 'Atlante',
    stats: 'Statistiche',
    about: 'Città sostenibili',
    consulting: 'Consulenza',
    research: 'Ricerca',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contatti',
    github: 'GitHub',
    skipToContent: 'Vai al contenuto',
    openMenu: 'Apri il menu',
    language: 'Lingua',
  },

  home: {
    hero: {
      eyebrow: 'Piattaforme di ricerca aperte · Sony CSL Roma',
      // La pagina d'ingresso: il nome dell'Atlante e una riga su cosa fa.
      title: 'Accessibility',
      // La metà colorata del nome; vedi .aa-accent in global.css.
      titleAccent: 'Atlas',
      subtitle: 'Mappiamo l’accesso urbano, città per città.',
      // La home precedente (/overview) apre ancora sulla forma lunga.
      headline: 'Un atlante per misurare',
      headlineAccent: 'l’accesso delle città.',
      lede: 'Che cosa si può raggiungere in una città? Misura la {proximity}: i servizi quotidiani raggiungibili a piedi. Misura l’{opportunity}: ciò che il trasporto pubblico rende raggiungibile entro un tempo dato. Misura la {cardep}: quanto serve l’automobile per accedere alle opportunità della città. Scopri come l’accesso alimenta le disuguaglianze.',
      ledeProximity: 'prossimità',
      ledeOpportunity: 'opportunità',
      ledeCardep: 'dipendenza dall’auto',
      ctaPrimary: 'Esplora la piattaforma',
      ctaSecondary: 'Leggi l’articolo sul quadro teorico ↗',
    },
    news: {
      title: 'Novità dal laboratorio',
      kinds: { paper: 'Articolo', release: 'Rilascio', data: 'Dati' },
      items: {
        pov: 'The dimensions of accessibility — EPJ Data Science',
        cdi: 'Car Dependency Index — {count} città pubblicate',
        atlas: 'Vista combinata — Milano pubblicata su un’unica griglia, tutte e quattro le piattaforme',
      },
      dates: { pov: 'Apr 2026', cdi: 'Feb 2026', atlas: 'Ago 2026' },
    },
    // La pagina d’ingresso: la mappa di copertura con le parole sopra.
    landing: {
      mapLabel: 'Tutte le città pubblicate dall’Atlante',
      by: 'Un progetto Sony CSL · Roma',
    },
    // Perché tutto questo viene misurato. Tre frasi, in quest'ordine: sono una
    // sequenza, e l'argomento della pagina poggia sull'ultima.
    premise: {
      lines: [
        'Le città sono luoghi di opportunità.',
        'L’accesso alle opportunità riduce le disuguaglianze.',
        'Un accesso diseguale crea società diseguali.',
      ],
    },
    metrics: {
      cities: 'Città pubblicate',
      platforms: 'Piattaforme',
      countries: 'Paesi',
      cells: 'Celle esagonali',
      researchers: 'Ricercatori',
    },
    platforms: {
      title: 'Livelli di accessibilità',
      // Ogni scheda apre l'introduzione dell'Atlante a quel livello, non il
      // viewer originale: la piattaforma è un link più avanti, da lì.
      more: 'Maggiori informazioni',
      cityCount: '{count} città',
      themes: {
        fifteen: 'Prossimità',
        citychrone: 'Opportunità',
        cardep: 'Confronto',
        pov: 'Sintesi',
      },
      desc: {
        fifteen:
          'Tempo a piedi e in bicicletta verso dieci categorie di servizi quotidiani, letto rispetto al riferimento dei 15 minuti.',
        citychrone:
          'Geografia dei tempi di viaggio — la città ridisegnata misurando la distanza in minuti di trasporto pubblico.',
        cardep:
          'Di quanto l’accesso alle opportunità in automobile supera quello in trasporto pubblico, cella per cella.',
        pov: 'Prossimità e opportunità a confronto, per dividere la città in quattro zone di accesso.',
      },
    },
    table: {
      title: 'Confronta le città',
      statsNote:
        'Sei città su tre misure, dai dataset P.O.V. La schermata che confronta ogni città pubblicata, su ogni misura, è la scheda Statistiche.',
      statsCta: 'Apri Statistiche',
      headers: {
        city: 'Città',
        proximity: 'Punteggio mediano di prossimità',
        opportunity: 'Punteggio mediano di opportunità',
        inclusion: 'Zona di inclusione',
      },
      note: 'Prossimità e opportunità sono conteggi pesati di punti di interesse raggiungibili, confrontabili fra città perché ogni città è misurata allo stesso modo. L’inclusione è la quota di celle sopra entrambe le mediane pesate sulla popolazione.',
    },
    side: {
      title: 'Lavori in corso',
      // Solo per una scheda che ha qualcosa da aprire; le altre non dicono
      // nulla invece di dichiarare uno stato che nessuno può verificare.
      kinds: { live: 'Online', paper: 'Articolo' },
      items: {
        shade: {
          name: 'Il diritto all’ombra',
          desc: 'L’ombra come infrastruttura: chi può attraversare una città d’estate senza camminare al sole, e chi no.',
        },
        weight: {
          name: 'Il peso delle disuguaglianze urbane',
          desc: 'La disuguaglianza di accesso letta in tre dimensioni, città per città, come superficie invece che come tabella.',
        },
        odMatrices: {
          name: 'Matrici OD da dati GPS',
          desc: 'Flussi origine–destinazione ricostruiti da tracce GPS, per misurare gli spostamenti che le persone fanno davvero contro quelli che la rete rende possibili.',
        },
        bikeLanes: {
          name: 'Pianificazione delle piste ciclabili',
          desc: 'Dove far crescere la rete ciclabile, data la larghezza delle strade in cui deve stare e i collegamenti che creerebbe.',
        },
        co2: {
          name: 'Emissioni di CO₂ dei trasporti',
          desc: 'Il costo in emissioni della forma urbana: quanta anidride carbonica spende la mobilità di una città, e quanto la prossimità cambia il conto.',
        },
        quality: {
          name: 'La disuguaglianza della qualità',
          desc: 'La terza dimensione del quadro teorico: non quanto è raggiungibile, ma quanto è buono — e se la qualità sia distribuita in modo diseguale quanto l’accesso.',
        },
      },
    },
  },

  platform: {
    search: 'Cerca la tua città…',
    searchHint: '⌘K',
    paper: 'Articolo ↗',
    welcome: 'Benvenuti in {name}',
    dismiss: 'Chiudi',
    ctaMap: 'Clicca su una città nella mappa',
    learnMore: 'Scopri di più →',
    attribution: 'Cartografia di base: Natural Earth · Dati © Sony CSL Roma · CC BY-NC 4.0',
    cityCount: '{count} città',
    zoomIn: 'Ingrandisci',
    zoomOut: 'Riduci',
    loading: 'Caricamento della copertura…',
    empty: 'Nessuna città corrisponde alla ricerca.',
    seeded: 'Valori illustrativi — le misure di questa piattaforma non sono ancora pubblicate.',

    all: {
      name: 'Tutti i livelli',
      // La mappa unita è l'Atlante stesso, non uno dei suoi livelli: si
      // presenta con il proprio nome invece che tramite `platform.welcome`.
      welcome: 'Benvenuti nell’Accessibility Atlas',
      label: 'Copertura pubblicata',
      pick: 'Scegli una mappa',
      intro:
        'Tutte le città pubblicate dall’Atlante, sulle quattro piattaforme. Ogni piattaforma misura qualcosa di diverso e copre un insieme di città diverso — scegline una per vedere la sua mappa, la sua scala e le città che copre. Le città più scure hanno più misure pubblicate fra le quattro.',
      legendUnit: 'Piattaforme pubblicate',
      legend: ['Una', 'Due', 'Tre', 'Tutte e quattro'],
      covered: '{count} piattaforme su 4',
    },

    fifteen: {
      label: 'Accesso di prossimità',
      intro:
        'Tempo di viaggio a piedi e in bicicletta verso dieci categorie di servizi quotidiani — sanità, istruzione, spesa, ristorazione, cultura, spazi aperti, attività fisica, servizi, mobilità — calcolato per ogni cella della città e letto rispetto al riferimento dei 15 minuti.',
      legendUnit: 'Tempo medio verso i servizi',
      legend: ['0–3 min', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24', '24–30'],
    },
    citychrone: {
      label: 'Accesso alle opportunità',
      intro:
        'CityChrone sostituisce la distanza metrica con il tempo di viaggio: la mappa si deforma così che due luoghi risultino vicini quando il trasporto pubblico li collega rapidamente, per quanto distanti siano sul terreno.',
      legendUnit: 'Punteggio di velocità',
      legend: ['Lento', 'Medio', 'Veloce'],
    },
    cardep: {
      label: 'Auto e trasporto pubblico',
      intro:
        'Il Car Dependency Index confronta le opportunità raggiungibili in automobile con quelle raggiungibili in trasporto pubblico nello stesso tempo: CDI = (O_auto − O_TP) / (O_auto + O_TP). Va da −1, dove il trasporto pubblico raggiunge di più, passando per 0 dove i due si equivalgono, fino a +1 dove l’auto raggiunge tutto e il trasporto pubblico quasi nulla.',
      legendUnit: 'Car Dependency Index',
      legend: [
        'A favore dei mezzi pubblici',
        'In equilibrio',
        'Dipendente dall’auto',
        'Fortemente dipendente dall’auto',
      ],
    },
    pov: {
      label: 'Prossimità · Opportunità · Valore',
      intro:
        'Ogni cella riceve un punteggio su due assi — prossimità, i servizi quotidiani raggiungibili a piedi, e opportunità, le destinazioni di scala urbana raggiungibili in trasporto pubblico — e viene poi classificata rispetto alla mediana cittadina pesata sulla popolazione di ciascun asse. Un terzo asse, il valore di ciò che è raggiungibile, è definito nel quadro teorico ma non ancora quantificato.',
      legendUnit: 'Zona',
      legend: ['Inclusione', 'Isolamento spaziale', 'Isolamento sociale', 'Isolamento totale'],
    },
  },

  // Vista città di 15minCity: dieci categorie × due modi, scelti a runtime.
  fifteen: {
    mapTitle: 'Tempo di viaggio verso i servizi',
    minutes: 'min',
    // Le dieci categorie della cella selezionata, tutte insieme.
    barsTitle: 'Tutte le categorie, da questa cella',
    barsAxis: 'Le barre arrivano a {max} {unit}; oltre, la riempiono.',
    legendValue: 'Tempo di prossimità',
    statusHint:
      'Scegli mezzo e categoria · passa il mouse su una fascia della legenda per isolarla · scorri e trascina per navigare',
    controls: {
      mode: 'Mezzo',
      category: 'Categoria di servizi',
    },
    modes: { foot: 'A piedi', bike: 'In bicicletta' },
    hint: 'Tempo medio di viaggio da ogni cella ai servizi più vicini di questa categoria.',
    summary: { median: 'Tempo di viaggio mediano' },
    categories: {
      average: 'Media su tutti i servizi',
      outdoor: 'Attività all’aperto',
      learning: 'Istruzione',
      supplies: 'Spesa',
      eating: 'Ristorazione',
      moving: 'Mobilità',
      cultural: 'Attività culturali',
      exercise: 'Attività fisica',
      services: 'Servizi',
      healthcare: 'Sanità',
    },
  },

  // La vista combinata: una città, un interruttore fra le visualizzazioni
  // delle quattro piattaforme.
  atlas: {
    label: 'Vista combinata',
    mapTitle: 'Misurato da {name}',
    controls: {
      layer: 'Visualizzazione',
      view: 'Misura',
      hour: 'Ora del giorno',
      opacity: 'Opacità del livello',
    },
    info: 'Informazioni su questo livello',
    hidePanel: 'Nascondi controlli',
    showPanel: 'Controlli',
    fullscreen: 'Schermo intero',
    exitFullscreen: 'Esci dallo schermo intero',
    population: {
      name: 'Popolazione',
      legend: 'Residenti per cella',
      tooltip: '{count} residenti',
      about:
        'Residenti per cella, dall’export di 15-minute city, su scala di colore logaritmica: la popolazione è molto sbilanciata, e una scala lineare metterebbe quasi tutte le celle nel colore più chiaro. È il contesto in cui leggere le altre quattro misure: lo stesso spostamento pesa di più dove lo fanno più persone.',
    },
    beyond: {
      fifteen: 'fino al nero a 120 min e oltre',
      isochrone: 'fino al nero a 180 min, il massimo pubblicato',
    },
    views: {
      velocity: 'Velocità',
      sociality: 'Socialità',
      isochrone: 'Isocrone',
    },
    viewHint: {
      velocity:
        'Quanto velocemente il trasporto pubblico ti porta lontano da ogni cella a quest’ora — un punteggio simile a km/h.',
      sociality:
        'Quante persone il trasporto pubblico mette a portata di ogni cella a quest’ora — un punteggio, non un conteggio.',
      isochrone:
        'Tempo di viaggio in trasporto pubblico da una cella scelta verso tutte le altre.',
    },
    legend: {
      velocity: 'Punteggio di velocità (km/h)',
      sociality: 'Punteggio di socialità',
      isochrone: 'Minuti dalla cella selezionata',
    },
    summary: { weightedV: 'Velocità per il residente medio' },
    // L'angolo della colonna dei controlli in cui il viewer ammette di poter
    // sbagliare. {contact} è l'indirizzo, reso come link.
    mistake: {
      title: 'Hai notato un errore?',
      body: 'Gli errori capitano! I dati possono mancare o essere fuorvianti. {contact} se sai come correggerli.',
      contact: 'Scrivici',
    },
    // {date} è la data dell'estratto OpenStreetMap, formattata da src/data/osm.js.
    osmUpdate: 'Ultimo aggiornamento OpenStreetMap: {date}',
    layerCells: 'Celle misurate da {name}',
    isochroneEmpty: 'Clicca su una cella per vedere i tempi di viaggio a partire da lì',
    unavailable: 'Non pubblicato',
    noValue: 'Non misurato per questa cella',
    openPlatform: 'Pagina {name}',
    statusHint:
      'Una griglia, quattro misure: cambiando visualizzazione si ricolorano le stesse celle · scorri e trascina per navigare',
    legacyHint:
      'Questa città non è ancora esportata sulla griglia condivisa: ogni visualizzazione carica la maglia della propria piattaforma.',
    error: 'Non è stato possibile caricare la maglia pubblicata.',
  },

  city: {
    region: '{region} · {count} celle',
    worldMap: 'Mappa mondiale',
    compare: 'Confronta le città',
    zoneType: 'Zona',
    cdiHint:
      'Negativo dove il trasporto pubblico raggiunge più dell’auto, positivo dove è l’auto a raggiungere di più. L’indice è una differenza normalizzata limitata a ±1, non un rapporto.',
    zones: {
      inclusion: {
        name: 'Inclusione',
        desc: 'Sopra la mediana su entrambi gli assi — servita localmente e collegata alla città',
      },
      spatial: {
        name: 'Isolamento spaziale',
        desc: 'Servizi vicini, ma debole collegamento verso il resto della città',
      },
      social: {
        name: 'Isolamento sociale',
        desc: 'Buon collegamento, ma pochi servizi a distanza pedonale',
      },
      total: {
        name: 'Isolamento totale',
        desc: 'Sotto la mediana su entrambi gli assi — tipicamente la periferia',
      },
    },
    summary: {
      title: 'Sintesi della città',
      hexagons: 'Celle',
      area: 'Area coperta',
      proximity: 'Punteggio mediano di prossimità',
      medianCdi: 'CDI mediano (per cella)',
      weightedCdi: 'CDI per il residente medio',
      opportunity: 'Punteggio mediano di opportunità',
      population: 'Popolazione coperta',
    },
    // Il controllo tipico del Car Dependency: restringere l’indice a una fetta
    // e leggere la città attraverso quella. Le celle fuori sono attenuate, non
    // rimosse: fanno comunque parte della città descritta.
    filter: {
      title: 'Filtra per indice',
      reset: 'Reimposta',
      about: 'Limita mappa e grafico a dispersione alle celle il cui indice cade fra i due cursori. Il resto rimane sulla mappa, attenuato: il filtro è un modo di guardare, non un’affermazione che il resto manchi. I valori della sintesi non cambiano, perché descrivono la città intera.',
      showing: '{count} celle su {total}',
    },
    // Le righe dell’ispettore. In un tooltip sta un numero solo; qui si legge
    // tutto quello che è stato misurato per una cella.
    selected: {
      title: 'Cella selezionata',
      empty: 'Clicca su una cella, nella mappa o nel grafico a dispersione, per leggere tutto ciò che è stato misurato.',
      clear: 'Deseleziona',
    },
    cell: {
      zone: 'Zona',
      proximity: 'Punteggio di prossimità',
      opportunity: 'Punteggio di opportunità',
      cdi: 'Car Dependency Index',
      byCar: 'Raggiungibile in auto',
      byTransit: 'Raggiungibile con i mezzi',
      population: 'Residenti',
      // Le mediane pesate per popolazione con cui è stata decisa la zona —
      // i `thresholds` del catalogo, non le mediane semplici del riepilogo.
      thresholdProximity: 'Soglia di zona, prossimità',
      thresholdOpportunity: 'Soglia di zona, opportunità',
      time: 'Tempo di viaggio',
      velocity: 'Punteggio di velocità',
      sociality: 'Punteggio di socialità',
      grid: 'Cella H3',
    },
    // ── Spiegazioni ────────────────────────────────────────────────
    // Riprese dai due viewer originali, che mettono un "?" accanto a tutto ciò
    // che si può fraintendere. Due loro frasi non sono state riportate: CDI
    // chiamava il proprio cartogramma "di Dorling" (qui le celle restano nella
    // posizione vera e cambiano solo area) e P.O.V. chiamava le soglie mediane
    // semplici (sono pesate per popolazione — vedi CLAUDE.md).
    explain: {
      map: {
        pov: 'Ogni cella prende il colore della zona in cui ricade: verde sopra la mediana su entrambi gli assi, rosso sotto su entrambi, e nel mezzo i due casi misti. Le soglie sono le mediane pesate per popolazione di quella città, quindi una zona confronta luoghi dentro una città e mai una città con un’altra — a confrontarsi fra città sono i punteggi sottostanti.',
        cardep: 'Blu dove il trasporto pubblico raggiunge più opportunità dell’auto, bianco dove le due si equivalgono, rosso dove l’auto ne raggiunge di più. La scala è fissa per tutte le città invece di essere adattata a ciascuna, così lo stesso colore è lo stesso indice ovunque: una città non viene mai ricolorata per riempire la tavolozza.',
        fifteen: 'Le celle sono colorate per il tempo che serve a raggiungere la categoria scelta con la modalità scelta. Il bianco sta a 15 minuti, il riferimento da cui la piattaforma prende il nome, e la scala continua a scurirsi oltre i 30 fino al nero a 120 — la legenda nomina quella coda invece di allungarsi fino a lì, cosa che schiaccerebbe l’intervallo in cui sta quasi ogni cella. Una sola scala vale per tutte e dieci le categorie ed entrambe le modalità, così un colore significa la stessa cosa qualunque sia la selezione.',
      },
      summary: {
        pov: '«Celle» conta quelle coperte dal dataset pubblicato. Ogni mediana è il punteggio della cella mediana: conteggi pesati di punti di interesse raggiungibili, ed è per questo che nessuna delle due porta un’unità: non sono metri e non sono posti di lavoro. La popolazione è la somma del dataset sulle sue celle, non un dato ufficiale della città.',
        cardep: 'Il CDI mediano è l’indice della cella mediana. Il CDI per il residente medio pesa ogni cella per le persone che ci vivono, ed è il valore con cui la piattaforma ordina le città: metà delle celle di una città può essere dipendente dall’auto mentre la maggior parte dei residenti vive nell’altra metà.',
        fifteen: 'La mediana è il tempo della cella mediana per la categoria e la modalità a schermo. Descrive celle, non residenti: ogni cella conta una volta, per quante persone ci vivano. La popolazione è la somma del dataset.',
        atlas: 'I valori sono ricalcolati per il livello a schermo. «Celle» è la maglia unione, cioè ogni cella misurata da almeno una piattaforma: un livello che ne copre meno lo indica in una riga a parte.',
      },
      more: 'Spiegazione completa',
      platformSite: 'Il sito di {name}',
      aboutTitle: 'Che cos’è {name}',
      sections: {
        measure: 'Che cosa misura',
        map: 'Leggere la mappa',
        geometry: 'Le due geometrie',
        summary: 'I valori nel pannello',
        source: 'Da dove viene',
      },
      methodsTitle: 'Dati e metodi',
      methods: {
        pov: 'Celle H3 di risoluzione 9, larghe circa 200 m. Tempi a piedi da OSRM su OpenStreetMap; trasporto pubblico da orari GTFS con il Connection Scan Algorithm; punti di interesse da OpenStreetMap; popolazione dalle griglie WorldPop a 100 m, riscalate sulle stime ONU.',
        cardep: 'Celle H3 di risoluzione 9, larghe circa 200 m. Tempi in auto e a piedi da OSRM su OpenStreetMap, con un margine per il parcheggio e ritardi da traffico specifici per città sul lato auto; trasporto pubblico da orari GTFS con il Connection Scan Algorithm; punti di interesse da OpenStreetMap; popolazione da WorldPop.',
        fifteen: 'Celle H3 di risoluzione 9. Tempi a piedi e in bicicletta da OSRM su OpenStreetMap; servizi da OpenStreetMap, raggruppati nelle dieci categorie elencate nel selettore; popolazione da WorldPop.',
        citychrone: 'Celle H3 di risoluzione 9, un export per ogni ora del giorno. Trasporto pubblico da orari GTFS; entrambi i punteggi e le isocrone sono definiti nell’articolo della piattaforma. I tempi di viaggio sono pubblicati in minuti interi con un tetto a 180.',
      },
      paperNote: 'Il metodo è esposto per esteso nell’articolo.',
    },
    // Le due geometrie su cui una città può essere pubblicata. Il passaggio
    // cambia il significato del poligono, non i dati: la didascalia sotto la
    // mappa dice quale delle due affermazioni è a schermo.
    geometry: {
      label: 'Geometria',
      map: 'Mappa',
      cartogram: 'Cartogramma',
      mapTitle: 'Mappa · celle dove si trovano',
      mapCaption: 'L’area della cella è il territorio che copre',
      cartogramCaption: 'L’area della cella è la sua popolazione residente',
      loading: 'Caricamento dell’altra geometria…',
      unavailable: 'Nessun cartogramma pubblicato',
      about: {
        map: 'Ogni cella è l’esagono che occupa sul terreno, della stessa dimensione ovunque, qualunque cosa contenga. L’area non dice nulla su quante persone una misura riguardi, quindi una periferia poco abitata occupa nell’immagine lo stesso spazio del centro denso.',
        cartogram: 'Ogni cella sta dove si trova davvero, ma la sua area è la popolazione residente e non il territorio che copre: una cella con pochi abitanti si riduce a una frazione di esagono, una affollata lo riempie. Risponde a un’altra domanda — non dove una misura è bassa, ma per quante persone lo è.',
        derived: 'Questo cartogramma è dell’Atlante: {name} non ne pubblica, quindi l’area qui è proporzionale alla popolazione residente della cella e raggiunge l’esagono pieno alla popolazione mediana delle celle abitate della città. La regola è tarata sui cartogrammi che le altre piattaforme pubblicano per la stessa città e li riproduce entro circa 12 m su una cella da 200 m — così una cella con una data popolazione appare della stessa dimensione su qualunque livello.',
        missing: 'Un cartogramma è una disposizione calcolata dai suoi autori, non una trasformazione della mappa: l’Atlante disegna quello che ogni piattaforma ha pubblicato invece di derivarne uno. {name} non ne pubblica.',
      },
    },
    cartogram: {
      title: 'Cartogramma · area della cella ∝ popolazione',
      caption: 'Risoluzione H3 {res} · celle di ~{size} m',
      captionSize: 'celle di ~{size} m',
    },
    scatterCdi: {
      title: 'Opportunità in auto e con i mezzi pubblici',
      xAxis: 'Raggiungibile in auto →',
      yAxis: 'Raggiungibile con i mezzi →',
      diagonal: 'pari raggiungibilità',
    },
    scatter: {
      title: 'Prossimità e opportunità a confronto',
      xAxis: 'Punteggio di opportunità →',
      yAxis: 'Punteggio di prossimità →',
    },
    statusHint:
      'Passa il mouse o clicca su una cella o un punto per evidenziarli · scorri e trascina per navigare',
    computing: 'Caricamento della maglia…',
    seeded:
      'Maglia illustrativa — le misure di questa città non sono ancora pubblicate, quindi la disposizione delle celle è generata.',
  },

  // La vista di confronto: una riga per città invece che una per cella.
  // Entrambi i viewer originali finiscono su questa schermata; l’Atlante aveva
  // il pulsante ma non la pagina.
  compare: {
    label: 'Confronta le città',
    // Il titolo del sottotitolo non va a capo — è dimensionato per i nomi di
    // città — quindi il conteggio sta con l’occhiello sotto, non nel titolo.
    count: '{count} città',
    lede: 'Tutte le città pubblicate da questa piattaforma, una accanto all’altra. I valori sono calcolati dagli stessi file che disegnano le pagine città: un numero qui è il numero lì.',
    back: 'Torna alla mappa',
    openCity: 'Apri {name}',
    sortBy: 'Ordina per',
    sort: {
      name: 'Nome',
      population: 'Popolazione',
      weightedCdi: 'Indice per il residente medio',
      medianCdi: 'Indice mediano',
      ptShare: 'Celle a favore dei mezzi pubblici',
      inclusion: 'Inclusione',
      proximity: 'Prossimità mediana',
      opportunity: 'Opportunità mediana',
    },
    basis: { label: 'Quote', cells: 'Per cella', residents: 'Per residente' },
    ranking: {
      cardep: 'Città ordinate per indice',
      pov: 'Composizione delle zone per città',
      aboutCardep: 'Ogni barra è l’indice del residente medio di quella città: ogni cella pesata per le persone che ci vivono. A sinistra della linea ci sono le città in cui, per il residente tipico, il trasporto pubblico raggiunge più dell’auto; a destra quelle in cui è l’auto a raggiungere di più. Le barre usano la stessa scala delle mappe.',
      aboutPov: 'La quota di ogni città che ricade in ciascuna delle quattro zone. Le zone sono decise sulle mediane pesate per popolazione di quella stessa città, quindi qui si confronta la composizione interna e non il livello fra città: una città può essere per metà inclusione ed essere comunque servita male. Si può contare per celle o per residenti: le celle isolate sono grandi e poco abitate, e le due letture raccontano cose diverse.',
    },
    scatter: {
      cardep: 'Quanto raggiunge l’auto rispetto ai mezzi',
      pov: 'Prossimità e opportunità a confronto',
      aboutCardep: 'Un cerchio per città, posizionato per quanto il residente medio raggiunge nei due modi e dimensionato per popolazione. La diagonale è dove i due raggiungono la stessa quantità: i cerchi sotto sono città in cui l’auto raggiunge di più.',
      aboutPov: 'Un cerchio per città, posizionato sui punteggi del suo residente medio e dimensionato per popolazione. Entrambi gli assi sono conteggi pesati di punti di interesse raggiungibili, quindi non hanno unità: è la posizione a confrontare le città, e il numero da solo ha senso solo rispetto a un’altra città sullo stesso asse.',
    },
    distribution: {
      title: 'Dove stanno i residenti di ogni città sull’indice',
      about: 'Ogni curva è una città: la quota dei suoi residenti che vive a un valore dell’indice pari o inferiore. Una curva che sale presto e ripida è una città in cui quasi tutti stanno dalla parte del trasporto pubblico; una che resta piatta fino a destra è una città in cui quasi tutti dipendono dall’auto. Dove la curva attraversa la linea centrale c’è la quota di residenti per cui auto e mezzi raggiungono più o meno lo stesso.',
    },
    table: { title: 'Tabella riassuntiva' },
    th: {
      city: 'Città',
      cells: 'Celle',
      population: 'Popolazione',
      medianCdi: 'Mediano',
      weightedCdi: 'Residente medio',
      ptCells: 'Celle mezzi',
      carCells: 'Celle auto',
      proximity: 'Prossimità med.',
      opportunity: 'Opportunità med.',
      inclusion: 'Inclusione',
      spatial: 'Isol. spaziale',
      social: 'Isol. sociale',
      total: 'Isol. totale',
    },
    loading: 'Caricamento delle città pubblicate…',
    empty: 'Questa piattaforma non ha ancora pubblicato riepiloghi per città.',
    error: 'Non è stato possibile caricare il riepilogo pubblicato.',
  },

  faq: {
    eyebrow: 'Domande frequenti',
    headline: 'Domande',
    headlineAccent: 'ricorrenti.',
    lede: 'Risposte brevi a ciò che ci viene chiesto più spesso. Avete un’altra domanda? Scrivete a {email}.',
    meta: {
      updated: 'Ultimo aggiornamento',
      updatedValue: 'Luglio 2026',
      entries: 'Voci',
      languages: 'Lingue',
    },
    items: [
      {
        q: 'Cosa significa “accesso” nell’Atlante?',
        a: 'Tre cose misurabili, tenute deliberatamente separate. La prossimità è ciò che si raggiunge a piedi in pochi minuti — negozi, scuole, ambulatori, verde. L’opportunità è ciò che il trasporto pubblico rende raggiungibile entro un tempo dato — lavoro, università, ospedali, luoghi di cultura. Il valore è la qualità di ciò che è raggiungibile: fa parte del quadro teorico ma non è ancora quantificato, e nulla in questo sito pretende di misurarlo.',
      },
      {
        q: 'Come viene classificata una cella in una zona?',
        a: 'Ogni cella ha un punteggio di prossimità e uno di opportunità. Una cella è considerata alta su un asse quando sta sopra la mediana cittadina pesata sulla popolazione per quell’asse — pesata, così che la soglia rifletta dove le persone vivono davvero e non la geometria della maglia. Le due risposte sì/no danno quattro zone: inclusione, isolamento spaziale, isolamento sociale, isolamento totale. Poiché le soglie sono specifiche di ogni città, le zone confrontano luoghi dentro una città, non fra città; a confrontare fra città sono i punteggi.',
      },
      {
        q: 'Da dove vengono i dati?',
        a: 'Rete stradale e punti di interesse vengono da OpenStreetMap. I tempi a piedi sono calcolati su quelle reti con OSRM. Il trasporto pubblico usa gli orari GTFS aperti degli operatori, valutati con il Connection Scan Algorithm invece che con una frequenza media. La popolazione viene dalle griglie WorldPop a 100 m riscalate sulle stime ONU. Le celle sono esagoni H3 a risoluzione 9, larghi circa 200 m.',
      },
      {
        q: 'Perché la mia città è sbagliata?',
        a: 'Può benissimo esserlo. Le misure valgono quanto valgono i dati che le producono: un’area mappata poco su OpenStreetMap, un feed GTFS non aggiornato, una linea aperta dopo l’export o un servizio chiuso prima — tutto questo produce una mappa sbagliata ma dall’aria sicura, e la mappa, da sola, non può accorgersene. Se conoscete una città e qualcosa non torna, scriveteci indicando dove stanno i dati migliori: un feed aggiornato, una fonte ufficiale, o semplicemente quale parte della mappa non corrisponde a ciò che c’è sul territorio. È il modo più rapido perché una città venga riesportata. Ogni dataset pubblicato è scaricabile, quindi il disaccordo si può verificare invece che discutere.',
      },
      {
        q: 'Perché la mia città non c’è?',
        a: 'La copertura è limitata dai dati, non dall’interesse: servono una buona mappatura OpenStreetMap e un feed GTFS pubblico utilizzabile. Le piattaforme di confronto coprono un insieme di città di studio ben documentate invece di puntare alla copertura globale, perché un feed mal specificato produce numeri sbagliati dall’aria affidabile. Se la vostra città ha entrambi e manca, aprite una issue su GitHub.',
      },
      {
        q: 'Posso citare questo lavoro?',
        a: 'Sì. Il quadro teorico è Bruno M., Campanelli B., Monteiro Melo H. P., Rossi Mori L. & Loreto V. (2026), “The dimensions of accessibility: proximity, opportunities, values”, EPJ Data Science 15:22, doi:10.1140/epjds/s13688-026-00623-8. Il Car Dependency Index è Campanelli B., Marzolla F., Bruno M., Melo H. P. M. & Loreto V. (2026), “Car Dependency in Urban Accessibility”, arXiv:2604.01019. La pagina Ricerca li elenca insieme ai dataset.',
      },
      {
        q: 'L’Atlante è gratuito?',
        a: 'Sì. Il codice di visualizzazione è sotto licenza MIT e i dataset pubblicati sono CC BY-NC 4.0: si possono usare, condividere e adattare liberamente citando la fonte, per scopi non commerciali. L’uso commerciale richiede autorizzazione scritta. Gli articoli sono open access con licenza CC BY 4.0.',
      },
    ],
  },

  // Chi siamo — la linea di ricerca di cui l'Atlante è uno dei risultati.
  about: {
    eyebrow: 'Città sostenibili',
    headline: 'Una linea di ricerca sulle città,',
    headlineAccent: 'non un prodotto.',
    lede: 'Siamo un gruppo di ricerca senza scopo di lucro, una delle linee di ricerca di Sony Computer Science Laboratories – Roma, e lavoriamo con collaboratori della Sapienza Università di Roma, del Centro Ricerche Enrico Fermi (CREF) e di altri istituti. L’Atlante è una delle cose che nascono da questo lavoro.',
    labLink: 'Sony CSL ↗',
    teamLink: 'Le persone →',

    doTitle: 'Cosa facciamo',
    do: {
      measure: {
        tag: 'Misuriamo',
        title: 'Misuriamo a cosa dà accesso una città',
        desc: 'Prossimità, opportunità e — dove si può fare onestamente — il valore di ciò che è raggiungibile, calcolati cella per cella a partire da dati aperti su rete stradale, orari, servizi e popolazione.',
      },
      compare: {
        tag: 'Confrontiamo',
        title: 'Rendiamo le città confrontabili',
        desc: 'Ogni città è misurata allo stesso modo, sulla stessa griglia, con le stesse scale — è questo che permette a un numero di una città di significare qualcosa accanto al numero di un’altra.',
      },
      publish: {
        tag: 'Pubblichiamo',
        title: 'Pubblichiamo metodo e dati',
        desc: 'Articoli sottoposti a revisione, dataset scaricabili e codice aperto. Una misura che informa una decisione di pianificazione dovrebbe essere verificabile da chi quella decisione la subisce.',
      },
    },

    withTitle: 'Con chi lavoriamo',
    withBody:
      'Il gruppo sta dentro Sony CSL Roma, ospitato nell’iniziativa congiunta con il CREF, e la sua ricerca procede con collaboratori della Sapienza e di altre università e istituti, in Italia e all’estero. Dottorande, dottorandi, tesiste e tesisti lavorano sull’Atlante all’interno di questo assetto, non al suo fianco.',
    withBody2:
      'Lavoriamo anche con amministrazioni cittadine, gruppi di ricerca e associazioni — di solito perché qualcuno deve sostenere una tesi sull’accesso con i dati alla mano. Se è il vostro caso, la pagina dei contatti è il punto da cui partire.',

    projectsTitle: 'Altri progetti',
    projectsHint: 'oltre i quattro livelli',
    projects: {
      whatif: {
        tag: 'Piattaforma',
        name: 'WhatIf',
        desc: 'La piattaforma modulare di simulazione urbana del laboratorio, che ospita i viewer originali di 15-minute city e CityChrone.',
      },
      maps3d: {
        tag: 'Mappa online',
        name: 'Mappe 3D',
        desc: 'La disuguaglianza urbana letta in tre dimensioni — il peso delle differenze di una città, disegnato come superficie.',
      },
      bikeLanes: {
        tag: 'Articolo',
        name: 'Pianificazione delle piste ciclabili',
        desc: 'Ottimizzazione di rete che tiene conto della larghezza stradale: dove far crescere la rete ciclabile, date le strade in cui deve stare.',
      },
    },
    labCta: 'Visita Sony CSL',
  },

  // La pagina Statistiche: ogni città pubblicata su ogni misura, dal file
  // che scrive `npm run stats`. Qui il testo spiega e avverte; nessun numero
  // vi è scritto.
  stats: {
    loading: 'Caricamento delle statistiche…',
    error: 'Non è stato possibile caricare le statistiche.',
    emptyTitle: 'Nessuna statistica pubblicata',
    emptyBody:
      'Le statistiche sono calcolate dai dati pubblicati da uno script, città per città, e su questo sito non ne è ancora stata pubblicata nessuna. Qui sotto c’è ciò che si può già confrontare.',
    availableTitle: 'Una piattaforma alla volta',
    compare: {
      fifteen: 'Tutte le città pubblicate da questa piattaforma, affiancate.',
      citychrone: 'Tutte le città pubblicate da questa piattaforma, affiancate.',
      cardep: 'Tutte le città ordinate per l’indice del loro residente medio, con la distribuzione dei residenti lungo l’indice.',
      pov: 'Tutte le città per composizione delle quattro zone, contate per cella o per residente, con i punteggi da cui derivano.',
    },
    caveat: {
      title: 'Da leggere prima di confrontare.',
      body: 'Le città sono misurate con dati di fonti, completezza e date diverse, su perimetri tracciati in modi diversi. Uno scarto tra due città è una domanda da approfondire, non un verdetto.',
      open: 'Metodo e limiti',
    },
    method: {
      title: 'Metodo e limiti',
      sections: {
        completeness: {
          title: 'I dati non sono ugualmente completi ovunque',
          body: 'I punti di interesse vengono da OpenStreetMap, la cui copertura dipende da quanto sono attivi i suoi mappatori in ogni città e paese. Il trasporto pubblico viene dagli orari GTFS, che differiscono per quanti operatori includono e per la settimana che descrivono. Una città può risultare peggiore perché è mappata meno, non perché ci sia meno.',
        },
        perimeter: {
          title: 'Ogni città è un perimetro tracciato da qualcuno',
          body: 'Una piattaforma misura l’area scelta dai suoi autori: un comune, un’area metropolitana, un’area urbana funzionale. La stessa città tracciata più larga include più periferia e di solito ottiene valori più bassi. Dove un livello copre solo una parte dei residenti che l’Atlas ha per una città, la riga porta un avviso con la quota coperta.',
        },
        oneNumber: {
          title: 'Un solo numero per una città nasconde i suoi residenti',
          body: 'Una mediana dice dove si trova il residente di mezzo, non quanto sono distanti tra loro i residenti della città. La classifica disegna la dispersione dietro ogni città (la metà centrale come un riquadro, dal 10° al 90° percentile come una linea), e gli indici di disuguaglianza la misurano direttamente. Due città con la stessa mediana possono essere luoghi molto diversi in cui vivere.',
        },
        population: {
          title: 'Ogni valore riguarda i residenti, come li conta ciascuna piattaforma',
          body: 'I valori sono pesati per la popolazione che ogni piattaforma indica per ogni cella, quindi descrivono persone e non territorio. Le piattaforme non usano tutte lo stesso modello di popolazione, quindi i residenti di un livello sono i suoi: due livelli della stessa città possono contare totali leggermente diversi.',
        },
        thresholds: {
          title: 'Le soglie sono fisse, mai adattate',
          body: 'Una quota di residenti «sopra 5.000» o «entro 15 minuti» significa la stessa cosa in ogni città. Le soglie sono numeri tondi che coprono l’intervallo pubblicato, scelte una volta e non adattate alle città sullo schermo.',
        },
        zones: {
          title: 'Le zone di P.O.V. confrontano luoghi dentro una città',
          body: 'P.O.V. divide ogni città alle sue mediane pesate per popolazione, quindi le sue quattro zone dicono come un luogo si confronta con il resto della sua città, e ogni città ha circa metà dei residenti sopra ciascuna linea. Per confrontare le città, l’Atlas classifica anche ogni cella rispetto a una coppia di soglie uguale per tutte (le zone su soglie comuni).',
        },
        countries: {
          title: 'Un paese è l’insieme delle sue città pubblicate',
          body: 'Il valore di un paese è quello che danno insieme i residenti delle sue città pubblicate: una media pesata per popolazione o una quota di residenti, che si combinano in modo esatto. Mediane, percentili e indici di disuguaglianza non si possono ricavare da quelli delle città, quindi i paesi non li hanno. Descrive quelle città, mai il paese nel suo insieme, e un secondo perimetro di una città già contata viene escluso.',
        },
        units: {
          title: 'I punteggi non hanno unità di misura',
          body: 'Prossimità, opportunità e raggiungibilità sono conteggi pesati di punti di interesse raggiungibili: non metri, non posti di lavoro. Il punteggio di velocità di CityChrone è descritto dai suoi autori come simile a km/h, e quello di socialità è un conteggio pesato di persone raggiungibili, non un numero di abitanti. Confrontateli tra città, non con dati esterni all’Atlas.',
        },
        freshness: {
          title: 'Si mostrano solo valori aggiornati',
          body: 'Le statistiche sono calcolate da uno script ogni volta che i dati cambiano. Una città i cui dati sono cambiati da quando sono stati calcolati i suoi valori viene esclusa finché non vengono ricalcolati, ed è elencata in fondo alla pagina, invece di comparire con valori che non corrispondono più alla sua mappa.',
        },
        hidden: {
          title: 'Alcune città sono nascoste di default',
          body: 'Una città con meno di {population} residenti, o i cui residenti camminerebbero in mediana più di {minutes} minuti per raggiungere i servizi, non compare nella pagina Statistiche né sulle mappe del mondo, a meno che non lo chiediate. I suoi valori sono calcolati fedelmente ma dicono più dei dati che del luogo: la città è molto piccola, o OpenStreetMap ha appena mappato i suoi servizi. La città resta pubblicata e la sua mappa si apre come prima.',
        },
      },
    },
    unit: {
      label: 'Confronta',
      city: 'Città',
      country: 'Paesi',
      about: 'I paesi riuniscono i residenti delle loro città pubblicate, per ora solo per la città dei 15 minuti. Solo le medie e le quote di residenti si combinano in modo esatto, quindi le altre statistiche non sono disponibili per i paesi.',
      onlyFifteen: 'Per ora i paesi si confrontano solo sulla città dei 15 minuti.',
    },
    countries: {
      label: 'Paesi',
      all: 'Tutti i paesi',
      some: '{count} paesi',
      search: 'Cerca un paese…',
      clear: 'Azzera',
    },
    filters: {
      population: 'Residenti',
      populationAbout: 'Mostra solo le città con almeno questo numero di residenti, contati sull’intera città come la pubblica l’Atlas. Trascina, o scrivi un numero.',
      any: 'qualsiasi',
      hidden: 'Mostra le città nascoste ({count})',
      hiddenAbout: 'Nascoste di default: le città con meno di {population} residenti, o dove il tempo mediano a piedi verso i servizi supera i {minutes} minuti. Lì i dati sono troppo scarsi per un confronto: il luogo è molto piccolo, o i suoi servizi sono appena mappati.',
    },
    kpi: {
      cities: 'Città',
      countries: 'Paesi',
      best: 'Migliore',
      worst: 'Peggiore',
      highest: 'Più alto',
      lowest: 'Più basso',
      residents: 'Residenti misurati',
    },
    layer: 'Livello',
    measure: 'Misura',
    statistic: 'Statistica',
    threshold: 'Soglia',
    zone: 'Zona',
    score: 'Punteggio',
    hour: 'Ora',
    layers: { cross: 'Tra livelli' },
    day: 'Tutto il giorno',
    measures: {
      proximity: 'Punteggio di prossimità',
      opportunity: 'Punteggio di opportunità',
      zonesCommon: 'Zone su soglie comuni',
      zonesCity: 'Zone sulle mediane di ogni città',
      cdi: 'Indice di dipendenza dall’auto',
      car: 'Raggiungibilità in auto',
      pt: 'Raggiungibilità con il trasporto pubblico',
      velocity: 'Punteggio di velocità',
      sociality: 'Punteggio di socialità',
    },
    about: {
      proximity: 'Quanti punti di interesse un residente raggiunge a piedi dalla sua cella, pesati. Un punteggio, non una distanza.',
      opportunity: 'Quanti punti di interesse un residente raggiunge in tutta la città a piedi e con il trasporto pubblico, pesati. Un punteggio, non un numero di posti di lavoro.',
      zonesCommon: 'Le quattro zone di P.O.V., tracciate con una sola coppia di soglie per tutte le città invece delle mediane di ciascuna, così la quota di residenti in ogni zona confronta una città con un’altra.',
      zonesCity: 'Le quattro zone di P.O.V. come le pubblica la piattaforma, divise alle mediane pesate per popolazione di ogni città. Descrivono luoghi dentro una città: ogni città ha circa metà dei residenti da ciascun lato di ogni linea.',
      cdi: 'La differenza normalizzata tra ciò che raggiungono da una cella l’auto e il trasporto pubblico, da −1 (il trasporto pubblico raggiunge di più) a +1 (l’auto raggiunge di più). Non un rapporto.',
      car: 'Le opportunità raggiungibili in auto da una cella, come le conta Car Dependency: un punteggio pesato.',
      pt: 'Le opportunità raggiungibili con il trasporto pubblico da una cella, come le conta Car Dependency: un punteggio pesato.',
      fifteen: 'Il tempo di viaggio da una cella ai servizi più vicini della categoria, a piedi o in bicicletta. «Media di tutti i servizi» è la media delle nove categorie.',
      velocity: 'Quanto velocemente il trasporto pubblico porta un residente lontano dalla sua cella, all’ora scelta. Descritto dai suoi autori come simile a km/h. «Tutto il giorno» è la media di ogni cella sulle 24 ore.',
      sociality: 'Quante persone un residente raggiunge con il trasporto pubblico dalla sua cella, pesate: un punteggio, non un numero di abitanti. «Tutto il giorno» è la media di ogni cella sulle 24 ore.',
      correlation: 'Come le misure di due livelli vanno insieme dentro una città, cella per cella, sulle celle abitate coperte da entrambi: la correlazione di rango di Spearman, da −1 a +1.',
    },
    statLabels: {
      p50: 'Mediana',
      mean: 'Media',
      p10: '10° percentile',
      p25: '25° percentile',
      p75: '75° percentile',
      p90: '90° percentile',
      share: 'Residenti',
      gini: 'Indice di Gini',
      theil: 'Indice di Theil',
      ratio: 'Rapporto 90/10',
      unreachable: 'Residenti senza nulla raggiungibile',
      zone: 'Residenti nella zona',
      value: 'Correlazione di rango',
    },
    statAbout: {
      p50: 'Il valore del residente di mezzo: metà dei residenti della città vive in celle sopra, metà sotto.',
      mean: 'La media sui residenti: ogni cella conta tante volte quante persone ci vivono. Le medie si combinano in modo esatto, quindi i paesi ne hanno una.',
      p10: 'Il valore sotto cui vive il decimo dei residenti con i valori più bassi.',
      p25: 'Il valore sotto cui vive un quarto dei residenti.',
      p75: 'Il valore sotto cui vivono tre quarti dei residenti.',
      p90: 'Il valore sotto cui vivono nove decimi dei residenti.',
      share: 'La quota di residenti la cui cella supera la soglia scelta. Le soglie sono le stesse in ogni città.',
      gini: 'Quanto la misura è distribuita in modo diseguale tra i residenti, da 0 (tutti hanno lo stesso) a 1. Più basso è più uniforme; l’ordine non è un giudizio.',
      theil: 'Un’altra misura di disuguaglianza tra residenti, più sensibile alla parte alta della distribuzione rispetto al Gini. 0 è perfettamente uniforme.',
      ratio: 'Il 90° percentile diviso il 10°: quante volte di più hanno i residenti vicini alla cima rispetto a quelli vicini al fondo.',
      unreachable: 'La quota di residenti senza alcun servizio della categoria alla portata della piattaforma.',
      zone: 'La quota di residenti che vive in celle della zona scelta.',
      value: 'La correlazione di rango di Spearman tra le due misure, sulle celle abitate coperte da entrambi i livelli. +1: crescono insieme; −1: una cresce mentre l’altra cala.',
    },
    side: {
      atLeast: 'almeno {value}',
      atMost: 'entro {value}',
      above: 'sopra {value}',
    },
    sideShort: {
      atLeast: 'residenti pari o sopra',
      atMost: 'residenti entro',
      above: 'residenti sopra',
    },
    views: {
      label: 'Viste',
      ranking: 'Classifica',
      map: 'Mappa',
      scatter: 'Dispersione',
      matrix: 'Matrice',
      curves: 'Curve',
    },
    viewAbout: {
      ranking: 'Una riga per città, in ordine. Dietro un livello, il riquadro è dove vive la metà centrale dei residenti e la linea va dal 10° al 90° percentile: la dispersione che un solo numero nasconde. Il ! segnala un valore da leggere con cautela.',
      map: 'Dove sono le città, colorate per il valore scelto su una scala fissa e dimensionate per residenti. Clicca una città per evidenziarla.',
      scatter: 'Due valori a confronto, un punto per città, dimensionato per residenti. Scegli il secondo valore nella riga che compare sopra.',
      matrix: 'Ogni città rispetto ai valori principali. La tonalità è la posizione della città tra quelle mostrate, più scura è migliore, perché le colonne non condividono un’unità; il valore è scritto nella cella. Clicca una colonna per sceglierla.',
      curves: 'La quota di residenti a ogni soglia, o per CityChrone il valore a ogni ora del giorno. Le città evidenziate sono colorate e con il nome; le altre sono grigie.',
    },
    order: {
      best: 'dalla migliore',
      worst: 'dalla peggiore',
      high: 'dal valore più alto',
      low: 'dal valore più basso',
      reverse: 'Inverti',
    },
    cityCount: 'n = {count}',
    noValues: 'Nessuna città mostrata ha questo valore.',
    noPairs: 'Nessuna città mostrata ha entrambi i valori.',
    selection: {
      label: 'In evidenza',
      add: 'Evidenzia una città…',
      addCountry: 'Evidenzia un paese…',
      remove: 'Togli {name} dall’evidenza',
      full: 'Al massimo quattro: togline prima una.',
      toggle: 'Evidenzia in ogni vista',
    },
    openCity: 'Apri {name} sulla mappa',
    yAxis: 'Asse verticale',
    unreachableValue: 'non raggiungibile',
    flag: {
      variant: 'Un secondo perimetro di una città già elencata, tracciato diversamente. I suoi residenti non entrano nel paese.',
      coverage: 'Questo livello copre il {share}% dei residenti che l’Atlas ha per questa città: il valore descrive quella parte.',
      single: 'Una sola città pubblicata: il valore del paese è quello della città.',
      hiddenPopulation: 'Meno di {population} residenti: nascosta di default, troppo piccola per un confronto.',
      hiddenProximity: 'Tempo mediano a piedi verso i servizi oltre {minutes} minuti: nascosta di default, i suoi servizi sono probabilmente appena mappati.',
    },
    note: {
      withinCity: 'Queste zone sono tracciate alle mediane di ogni città, quindi confrontano luoghi dentro una città, non città tra loro. Per confrontare le città usa le zone su soglie comuni.',
      zonesCommon: 'Zone comuni: prossimità a {proximity}, opportunità a {opportunity}, uguali per tutte le città.',
      thresholds: 'Le soglie sono fisse e uguali in ogni città.',
      correlation: 'Una correlazione descrive come due misure vanno insieme dentro una città. Non dice quale città sia servita meglio.',
      citychrone: 'I punteggi di CityChrone non hanno una conversione di unità verificata: confrontali tra città, non con dati esterni.',
      unreachable: 'Dove alcuni residenti non hanno nulla della categoria alla loro portata, la media e gli indici di disuguaglianza non sono calcolati.',
      inequality: 'La disuguaglianza è ordinata dalla più uniforme; se più uniforme sia meglio dipende dalla misura.',
      countries: 'Un paese è l’insieme delle sue città pubblicate, non il paese nel suo insieme, e per ora si combina solo la città dei 15 minuti. Mediane, percentili e indici di disuguaglianza non si combinano.',
      oneNumber: 'Un valore per città: la dispersione dei suoi residenti è nella classifica e nei tooltip.',
      matrix: 'La tonalità confronta le città mostrate, quindi cambia con il filtro; i valori no.',
      curvesThresholds: 'Misurato solo alle soglie: le linee uniscono quei punti e non dicono nulla di ciò che sta in mezzo.',
      curvesNone: 'Una correlazione non ha soglie né ore lungo cui tracciare una curva.',
    },
    footer: {
      computed: 'Statistiche calcolate il {date} dai file pubblicati.',
    },
    tooltip: {
      population: 'residenti',
      cells: 'celle',
      cities: 'città',
      range: '10°–90° percentile',
      iqr: 'metà centrale',
    },
    mapCaption: 'La dimensione del punto è il numero di residenti.',
    matrixPick: 'Mostra questo valore in ogni vista',
    curvesTop: 'Gli otto più alti; evidenzia le città per seguirle.',
    curvesPick: 'Evidenziane alcune per vederne il nome',
  },

  // Consulenza — breve, perché non c'è altro che si possa dire onestamente.
  consulting: {
    eyebrow: 'Consulenza',
    headline: 'Lavorate su una città?',
    headlineAccent: 'Parliamone.',
    lede: 'Se siete un’amministrazione pubblica, un’agenzia o un’azienda che ha bisogno di misurare l’accesso — per un piano, un servizio, un investimento o una valutazione — potete chiedercelo. Diteci qual è la domanda e vi diremo con franchezza se i nostri metodi sono in grado di rispondere.',
    cta: 'Scriveteci',
    whoTitle: 'A chi è rivolta',
    who: {
      policy: {
        tag: 'Settore pubblico',
        title: 'Decisori pubblici',
        desc: 'Città, regioni, enti per la mobilità e agenzie che devono decidere dove mettere una linea, un servizio o una struttura — e sapere prima chi raggiungerebbe davvero.',
      },
      company: {
        tag: 'Settore privato',
        title: 'Aziende',
        desc: 'Organizzazioni le cui decisioni dipendono da come si raggiunge una città: localizzazione, progettazione di servizi, mobilità, o una base empirica per un rapporto che deve reggere a una verifica attenta.',
      },
    },
    note:
      'Una nota sulla licenza: i dataset pubblicati sono CC BY-NC 4.0, quindi l’uso commerciale richiede un permesso scritto. È una conversazione, non un rifiuto — l’indirizzo è comunque lo stesso.',
  },

  contact: {
    eyebrow: 'Contatti e collaborazioni',
    headline: 'Roma, Italia.',
    headlineAccent: 'Aperti a collaborare.',
    lede: 'Lavoriamo con amministrazioni cittadine, gruppi di ricerca, associazioni e chiunque voglia sostenere una tesi sull’accesso con i dati alla mano. Se la vostra città dovrebbe essere nell’Atlante, se volete riusare le mappe in un articolo, o se qui qualcosa vi sembra sbagliato — scriveteci.',
    fields: {
      address: 'Indirizzo',
      general: 'Generale',
      code: 'Codice',
      phone: 'Telefono',
    },
    addressValue:
      'Sony Computer Science Laboratories, Roma\nIniziativa congiunta CREF-SONY\nCentro Studi e Ricerche “Enrico Fermi” – CREF\nVia Panisperna, 89/a\n00184 Roma\nIngresso: Piazza del Viminale, 1, Roma',
    teamTitle: 'Il team',
    // Agent nouns agree in gender; each person's form is stated in team.js.
    // "Assistente" and "manager" are invariable, and the two function-named
    // roles below do not inflect, so those take a single key.
    roles: {
      director: 'PI e direttore',
      assistant: 'Assistente di ricerca',
      staffResearcherM: 'Ricercatore',
      staffResearcherF: 'Ricercatrice',
      consultantM: 'Consulente e ricercatore',
      consultantF: 'Consulente e ricercatrice',
      sapienzaResearcherM: 'Ricercatore, Sapienza',
      sapienzaResearcherF: 'Ricercatrice, Sapienza',
      sapienzaPhdM: 'Dottorando, Sapienza',
      sapienzaPhdF: 'Dottoranda, Sapienza',
      visitingPhdM: 'Dottorando in visita',
      visitingPhdF: 'Dottoranda in visita',
      communications: 'Comunicazione aziendale ed eventi, senior',
      developerM: 'Sviluppatore software full stack',
      developerF: 'Sviluppatrice software full stack',
      admin: 'Amministrazione, senior',
      phdM: 'Dottorando',
      phdF: 'Dottoranda',
      masterM: 'Studente magistrale',
      masterF: 'Studentessa magistrale',
      researcherM: 'Ricercatore',
      researcherF: 'Ricercatrice',
      visitingResearcherM: 'Ricercatore in visita',
      visitingResearcherF: 'Ricercatrice in visita',
      hiring: 'Lavora con noi',
    },
    joinName: 'Tu?',
    formerTitle: 'Ex membri',
  },

  research: {
    eyebrow: 'Produzione scientifica',
    headline: 'Articoli, dati',
    headlineAccent: 'e codice.',
    lede: 'I metodi dietro l’Atlante sono pubblicati e i dataset sono scaricabili. Le piattaforme il cui articolo è ancora in preparazione sono indicate come tali — le mappe si mostrano, la citazione non si inventa.',
    papersTag: '01',
    papersTitle: 'Articoli',
    papersHint: 'peer-reviewed e preprint',
    datasetsTag: '02',
    datasetsTitle: 'Dataset e codice',
    datasetsHint: 'CC BY-NC 4.0 · MIT',
    citeTitle: 'Come citare l’Atlante',
    inPreparation: 'In preparazione',
    preprint: 'Preprint',
    columns: { dataset: 'Dataset', coverage: 'Copertura', format: 'Formato', licence: 'Licenza' },
  },

  blog: {
    eyebrow: 'Blog',
    headline: 'Appunti',
    headlineAccent: 'dall’Atlante.',
    lede: 'Approfondimenti su cosa misuriamo, come lo misuriamo, e su cosa le mappe mostrano e non mostrano.',
    readingTime: '{count} min di lettura',
    backToBlog: '← Tutti gli articoli',
    published: 'Pubblicato',
    postsLabel: 'Articoli',
  },

  work: {
    eyebrow: 'Lavora con noi',
    headline: 'Nessuna posizione',
    headlineAccent: 'aperta al momento.',
    lede: 'Al momento non ci sono selezioni aperte per posizioni finanziate. Siamo però sempre felici di sentire studenti e studentesse che vogliono lavorare seriamente sull’accessibilità urbana — e quelle conversazioni cominciano di solito molto prima che una posizione esista.',
    openTitle: 'Cosa è aperto',
    positionsTitle: 'Posizioni aperte',
    noPositions: 'Nessuna posizione finanziata è aperta al momento.',
    noPositionsDetail:
      'Quando se ne aprirà una sarà pubblicata qui e nella pagina delle carriere di Sony CSL. Non esiste una lista d’attesa, e le candidature spontanee per ruoli inesistenti non vengono conservate.',
    routes: {
      phd: {
        title: 'Dottorato',
        desc: 'Co-supervisioniamo lavori di dottorato con università italiane ed estere, di norma sulla misura dell’accessibilità, sull’analisi delle reti di trasporto o sulla fisica statistica delle città. Il finanziamento arriva normalmente dal programma di dottorato dell’università ospitante e non da noi, quindi conviene iniziare la conversazione qualche mese prima delle sue scadenze.',
      },
      thesis: {
        title: 'Tesi magistrali',
        desc: 'Ospitiamo tesi magistrali su una porzione ben definita dell’Atlante — una nuova città, un confronto metodologico, la validazione di uno degli indici con dati indipendenti. Aspettatevi circa sei mesi, dati veri, e un risultato che viene pubblicato se regge.',
      },
      internship: {
        title: 'Tirocini',
        desc: 'Periodi più brevi e mirati, di norma da tre a sei mesi: pipeline di dati, elaborazione geospaziale, o sviluppo front-end su queste piattaforme. Sono utili Python e strumenti geospaziali, oppure JavaScript moderno e rendering cartografico.',
      },
    },
    howTitle: 'Come mettersi in contatto',
    howBody:
      'Scrivete a {email} con una breve descrizione di cosa vorreste fare e perché, un CV e — se ce l’avete — un link a qualcosa che avete costruito o scritto. Una proposta specifica, che parta da un articolo o da una piattaforma, vale molto più di una manifestazione di interesse generica.',
    expectTitle: 'Cosa aspettarsi',
    expectBody:
      'Leggiamo tutto e rispondiamo alle proposte a cui possiamo dare seguito. Siamo un gruppo piccolo, quindi non riusciamo a dare un riscontro dettagliato a ogni messaggio, e una risposta lenta non è un giudizio sulla candidatura.',
    cta: 'Scriveteci',
  },

  footer: {
    description:
      'Ricerca aperta sull’accesso urbano dal team Città Sostenibili di Sony CSL — Roma. Metodi, mappe e dati, pubblicati e liberamente riutilizzabili.',
    platforms: 'Piattaforma',
    research: 'Ricerca',
    researchLinks: ['Articoli', 'Dataset', 'Blog', 'FAQ'],
    about: 'Chi siamo',
    aboutLinks: ['Città sostenibili', 'Team', 'Contatti', 'Consulenza', 'Lavora con noi'],
    touch: 'Resta in contatto',
    touchLinks: ['GitHub', 'Newsletter'],
    workCta: 'Lavora con noi →',
    copyright: '© 2026 Sony Computer Science Laboratories · Roma',
    version: 'Codice MIT · Dati CC BY-NC 4.0',
  },

  notFound: {
    eyebrow: 'Errore 404',
    headline: 'Fuori',
    headlineAccent: 'mappa.',
    lede: 'Questa pagina non fa parte dell’Atlante. Prova le piattaforme, o torna alla home.',
    cta: 'Torna all’Atlante',
  },
};
