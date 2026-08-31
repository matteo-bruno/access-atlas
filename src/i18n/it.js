// Italian copy. Draft translation of en.js — reviewed by the Rome team before
// launch. Keep the key shape identical to en.js.

export default {
  meta: {
    locale: 'it-IT',
    name: 'Italiano',
  },

  nav: {
    title: 'Access Atlas',
    tagline: 'Sony CSL · Roma — Città Sostenibili',
    atlas: 'Atlante',
    platforms: 'Piattaforme',
    research: 'Ricerca',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contatti',
    github: 'GitHub',
    skipToContent: 'Vai al contenuto',
    openMenu: 'Apri il menu',
  },

  home: {
    hero: {
      eyebrow: 'Piattaforme di ricerca aperte · Sony CSL Roma',
      headline: 'Un atlante per misurare',
      headlineAccent: 'l’accesso delle città.',
      lede: 'Che cosa è a portata in una città? Misura la {proximity} — i servizi quotidiani raggiungibili a piedi. Misura l’{opportunity} — ciò a cui il trasporto pubblico può arrivare entro un budget di tempo. Misura la {cardep} — quanto serve l’automobile per accedere alle opportunità della città. Scopri come l’accesso propaga le disuguaglianze.',
      ledeProximity: 'prossimità',
      ledeOpportunity: 'opportunità',
      ledeCardep: 'dipendenza dall’auto',
      ctaPrimary: 'Esplora le piattaforme',
      ctaSecondary: 'Leggi l’articolo sul framework ↗',
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
    metrics: {
      cities: 'Città pubblicate',
      platforms: 'Piattaforme',
      countries: 'Paesi',
      cells: 'Celle esagonali',
      researchers: 'Ricercatori',
    },
    coverage: {
      tag: '01',
      title: 'Una sola mappa dell’accesso, quattro lenti.',
      hint: 'passa sopra una piattaforma per l’anteprima',
      badge: 'Copertura pubblicata · {count} città',
      combined:
        'Dove tutte le piattaforme sono state esportate su un’unica griglia condivisa, le quattro prospettive diventano livelli di una sola mappa:',
      legend: {
        opportunity: 'Opportunità',
        proximity: 'Prossimità',
        comparison: 'Confronto',
      },
    },
    platforms: {
      tag: '02',
      title: 'Le quattro piattaforme',
      hint: 'prossimità → opportunità → confronto',
      open: 'Apri',
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
        pov: 'Prossimità contro opportunità, dividendo la città in quattro zone di accesso.',
      },
    },
    table: {
      tag: '03',
      title: 'I numeri',
      hint: 'sei città · framework P.O.V.',
      headers: {
        city: 'Città',
        proximity: 'Punteggio mediano di prossimità',
        opportunity: 'Punteggio mediano di opportunità',
        inclusion: 'Zona di inclusione',
      },
      note: 'Prossimità e opportunità sono conteggi pesati di punti di interesse raggiungibili, confrontabili fra città perché ogni città è misurata allo stesso modo. L’inclusione è la quota di celle sopra entrambe le mediane pesate sulla popolazione.',
    },
    quote: {
      eyebrow: 'La premessa',
      before: 'Una città è una promessa di ',
      accent: 'vicinanza',
      after: ': che le cose di cui hai bisogno siano a portata. L’Atlante chiede, città per città e cella per cella, se quella promessa venga mantenuta — e per chi.',
      attribution: '— Team Città Sostenibili · Sony CSL Roma',
    },
    side: {
      tag: '04',
      title: 'Progetti collaterali e sviluppi futuri',
      items: {
        maps3d: {
          name: 'Mappe 3D',
          status: 'Online',
          desc: 'Mappe tridimensionali interattive della struttura urbana.',
        },
        whatif: {
          status: 'Archivio',
          desc: 'La piattaforma modulare originale da cui è nato l’Atlante.',
        },
        heat: {
          name: 'Pedestrian Heat',
          status: 'In programma',
          desc: 'Esposizione al calore lungo i percorsi pedonali.',
        },
        a11y: {
          name: 'Accessibility for All',
          status: 'In corso',
          desc: 'Raggiungibilità misurata per chi usa una sedia a rotelle, non per un pedone medio.',
        },
        sound: {
          name: 'Soundscapes',
          status: 'Concept',
          desc: 'L’esposizione acustica come dimensione della qualità urbana.',
        },
      },
    },
  },

  // Termini della mappa di base. OpenFreeMap serve le tile senza chiave e
  // chiede di essere citata insieme a OpenMapTiles e OpenStreetMap; senza di
  // loro la mappa non esiste, quindi il credito sta sulla mappa.
  map: {
    attribution:
      'Mappa di base © OpenFreeMap · tile vettoriali © OpenMapTiles · dati © contributori di OpenStreetMap',
  },

  platform: {
    search: 'Cerca la tua città…',
    searchHint: '⌘K',
    paper: 'Articolo ↗',
    github: 'GitHub ↗',
    welcome: 'Benvenuto in {name}',
    dismiss: 'Chiudi',
    ctaMap: 'Clicca una città sulla mappa',
    learnMore: 'Scopri di più →',
    attribution: 'Cartografia di base: Natural Earth · Dati © Sony CSL Roma · CC BY-NC 4.0',
    cityCount: '{count} città',
    zoomIn: 'Ingrandisci',
    zoomOut: 'Riduci',
    loading: 'Caricamento della copertura…',
    empty: 'Nessuna città corrisponde alla ricerca.',
    seeded: 'Valori illustrativi — le misure di questa piattaforma non sono ancora pubblicate.',

    all: {
      name: 'Tutte le piattaforme',
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
      label: 'Auto contro trasporto pubblico',
      intro:
        'Il Car Dependency Index confronta le opportunità raggiungibili in automobile con quelle raggiungibili in trasporto pubblico nello stesso tempo: CDI = (O_auto − O_TP) / (O_auto + O_TP). Va da −1, dove il trasporto pubblico raggiunge di più, passando per 0 dove i due si equivalgono, fino a +1 dove l’auto raggiunge tutto e il trasporto pubblico quasi nulla.',
      legendUnit: 'Car Dependency Index',
      legend: [
        'Favorevole al TP',
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
      'Scegli modo e categoria · passa su una fascia della legenda per isolarla · scorri e trascina per navigare',
    controls: {
      mode: 'Modo',
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
    info: 'Su questo livello',
    hidePanel: 'Nascondi controlli',
    showPanel: 'Controlli',
    fullscreen: 'Schermo intero',
    exitFullscreen: 'Esci da schermo intero',
    population: {
      name: 'Popolazione',
      legend: 'Residenti per cella',
      tooltip: '{count} residenti',
      about:
        'Residenti per cella, dall’esportazione di 15-minute city. Colorata su scala logaritmica: la popolazione è fortemente asimmetrica, quindi una scala lineare metterebbe quasi tutte le celle nel colore più chiaro. È il contesto in cui si leggono le altre quattro misure — lo stesso spostamento conta di più dove lo compiono più persone.',
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
    summary: { weightedV: 'Velocità per la persona media' },
    layerCells: 'Celle misurate da {name}',
    isochroneEmpty: 'Clicca una cella per disegnare i tempi di viaggio da lì',
    unavailable: 'Non pubblicato',
    noValue: 'Non misurato per questa cella',
    openPlatform: 'Pagina {name}',
    statusHint:
      'Una griglia, quattro misure — cambiare visualizzazione ricolora le stesse celle · scorri e trascina per navigare',
    legacyHint:
      'Questa città non è ancora esportata sulla griglia condivisa — ogni visualizzazione carica la mesh della propria piattaforma.',
    error: 'La mesh pubblicata non si è potuta caricare.',
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
      about: 'Restringe mappa e scatter alle celle il cui indice cade fra i due cursori. Tutto il resto rimane sulla mappa, attenuato: qui un filtro è un modo di guardare, non l’affermazione che il resto manchi. I valori del riepilogo non cambiano — descrivono la città intera.',
      showing: '{count} celle su {total}',
    },
    // Le righe dell’ispettore. In un tooltip sta un numero solo; qui si legge
    // tutto quello che è stato misurato per una cella.
    selected: {
      title: 'Cella selezionata',
      empty: 'Clicca una cella — sulla mappa o sullo scatter — per leggere tutto ciò che è stato misurato.',
      clear: 'Deseleziona',
    },
    cell: {
      zone: 'Zona',
      proximity: 'Punteggio di prossimità',
      opportunity: 'Punteggio di opportunità',
      cdi: 'Indice di dipendenza dall’auto',
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
        fifteen: 'Le celle sono colorate per il tempo che serve a raggiungere la categoria scelta con la modalità scelta. Il bianco sta a 15 minuti, il riferimento da cui la piattaforma prende il nome, e la scala continua a scurirsi oltre i 30 fino al nero a 120 — la legenda nomina quella coda invece di allungarsi fino a lì, cosa che schiaccerebbe l’intervallo in cui sta quasi ogni cella. Una sola scala serve tutte e dieci le categorie e entrambe le modalità, così un colore significa la stessa cosa qualunque sia la selezione.',
      },
      summary: {
        pov: 'Celle conta quelle coperte dal dataset pubblicato. Ogni mediana è il punteggio della cella di mezzo — conteggi pesati di punti di interesse raggiungibili, ed è per questo che nessuna delle due porta un’unità: non sono metri e non sono posti di lavoro. La popolazione è la somma del dataset sulle sue celle, non un dato ufficiale della città.',
        cardep: 'Il CDI mediano è l’indice della cella di mezzo. Il CDI per il residente medio pesa ogni cella per le persone che ci vivono, ed è il valore con cui la piattaforma ordina le città: metà delle celle di una città può essere dipendente dall’auto mentre la maggior parte dei residenti vive nell’altra metà.',
        fifteen: 'La mediana è il tempo della cella di mezzo per la categoria e la modalità a schermo. Descrive celle, non residenti: ogni cella conta una volta, per quante persone ci vivano. La popolazione è la somma del dataset.',
        atlas: 'I valori sono ricalcolati per il layer a schermo. Celle è la maglia unione — ogni cella misurata da almeno una piattaforma — quindi un layer che ne copre meno lo dichiara in una riga a parte.',
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
        pov: 'Celle H3 di risoluzione 9, circa 200 m di lato. Tempi a piedi da OSRM su OpenStreetMap; trasporto pubblico da orari GTFS con il Connection Scan Algorithm; punti di interesse da OpenStreetMap; popolazione dalle griglie WorldPop a 100 m, riscalate sulle stime ONU.',
        cardep: 'Celle H3 di risoluzione 9, circa 200 m di lato. Tempi in auto e a piedi da OSRM su OpenStreetMap, con un margine per il parcheggio e ritardi da traffico specifici per città sul lato auto; trasporto pubblico da orari GTFS con il Connection Scan Algorithm; punti di interesse da OpenStreetMap; popolazione da WorldPop.',
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
        map: 'Ogni cella è l’esagono che è sul terreno, della stessa dimensione ovunque qualunque cosa contenga. L’area non dice nulla su quante persone una misura riguardi, quindi una periferia poco abitata occupa nell’immagine lo stesso spazio del centro denso.',
        cartogram: 'Ogni cella sta dove si trova davvero, ma la sua area è la popolazione residente e non il territorio che copre: una cella con pochi abitanti si riduce a una frazione di esagono, una affollata lo riempie. Risponde a un’altra domanda — non dove una misura è bassa, ma per quante persone lo è.',
        derived: 'Questo cartogramma è dell’Atlante: {name} non ne pubblica, quindi l’area qui è proporzionale alla popolazione residente della cella e raggiunge l’esagono pieno alla popolazione mediana della città. La regola è tarata sui cartogrammi che le altre piattaforme pubblicano per la stessa città e li riproduce entro circa 12 m su una cella da 200 m — così una cella con una data popolazione appare della stessa dimensione su qualunque layer.',
        missing: 'Un cartogramma è una disposizione calcolata dai suoi autori, non una trasformazione della mappa: l’Atlante disegna quello che ogni piattaforma ha pubblicato invece di derivarne uno. {name} non ne pubblica.',
      },
    },
    cartogram: {
      title: 'Cartogramma · area della cella ∝ popolazione',
      caption: 'Risoluzione H3 {res} · celle di ~{size} m',
      captionSize: 'celle di ~{size} m',
    },
    scatterCdi: {
      title: 'Opportunità in auto contro trasporto pubblico',
      xAxis: 'Raggiungibile in auto →',
      yAxis: 'Raggiungibile in TP →',
      diagonal: 'pari raggiungibilità',
    },
    scatter: {
      title: 'Prossimità contro opportunità',
      xAxis: 'Punteggio di opportunità →',
      yAxis: 'Punteggio di prossimità →',
    },
    statusHint:
      'Passa sopra o clicca una cella o un punto per evidenziarli · scorri e trascina per navigare',
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
      ptShare: 'Celle pro trasporto pubblico',
      inclusion: 'Inclusione',
      proximity: 'Prossimità mediana',
      opportunity: 'Opportunità mediana',
    },
    basis: { label: 'Quote', cells: 'Per cella', residents: 'Per residente' },
    ranking: {
      cardep: 'Città ordinate per indice',
      pov: 'Composizione delle zone per città',
      aboutCardep: 'Ogni barra è l’indice del residente medio di quella città: ogni cella pesata per le persone che ci vivono. A sinistra della linea ci sono le città in cui, per il residente tipico, il trasporto pubblico raggiunge più dell’auto; a destra quelle in cui è l’auto a raggiungere di più. Le barre usano la stessa scala delle mappe.',
      aboutPov: 'La quota di ogni città che ricade in ciascuna delle quattro zone. Le zone sono decise sulle mediane pesate per popolazione di quella stessa città, quindi qui si confronta la *composizione* interna e non il livello fra città: una città può essere per metà inclusione ed essere comunque servita male. Si può contare per celle o per residenti: le celle isolate sono grandi e poco abitate, e le due letture raccontano cose diverse.',
    },
    scatter: {
      cardep: 'Quanto raggiunge l’auto rispetto ai mezzi',
      pov: 'Prossimità rispetto a opportunità',
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
      ptCells: 'Celle TP',
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
    headline: 'Sei domande\nricorrenti.',
    lede: 'Risposte brevi a ciò che ci viene chiesto più spesso. Avete un’altra domanda? Scrivete a {email}.',
    meta: {
      updated: 'Ultimo aggiornamento',
      updatedValue: 'Luglio 2026',
      entries: 'Voci',
      languages: 'Lingue',
      languagesValue: 'EN · IT',
    },
    items: [
      {
        q: 'Cosa significa “accesso” nell’Atlante?',
        a: 'Tre cose misurabili, tenute deliberatamente separate. La prossimità è ciò che si raggiunge a piedi in pochi minuti — negozi, scuole, ambulatori, verde. L’opportunità è ciò che il trasporto pubblico rende raggiungibile entro un budget di tempo — lavoro, università, ospedali, luoghi di cultura. Il valore è la qualità di ciò che è raggiungibile: fa parte del quadro teorico ma non è ancora quantificato, e nulla in questo sito pretende di misurarlo.',
      },
      {
        q: 'Come viene classificata una cella in una zona?',
        a: 'Ogni cella ha un punteggio di prossimità e uno di opportunità. Una cella è considerata alta su un asse quando sta sopra la mediana cittadina pesata sulla popolazione per quell’asse — pesata, così che la soglia rifletta dove le persone vivono davvero e non la geometria della maglia. Le due risposte sì/no danno quattro zone: inclusione, isolamento spaziale, isolamento sociale, isolamento totale. Poiché le soglie sono specifiche di ogni città, le zone confrontano luoghi dentro una città, non fra città; a confrontare fra città sono i punteggi.',
      },
      {
        q: 'Da dove vengono i dati?',
        a: 'Rete stradale e punti di interesse vengono da OpenStreetMap. I tempi a piedi sono calcolati su quelle reti con OSRM. Il trasporto pubblico usa gli orari GTFS aperti degli operatori, valutati con il Connection Scan Algorithm invece che con una frequenza media. La popolazione viene dalle griglie WorldPop a 100 m riscalate sulle stime ONU. Le celle sono esagoni H3 a risoluzione 9, circa 200 m.',
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
        a: 'Sì. Il codice di visualizzazione è sotto licenza MIT e i dataset pubblicati sono CC BY-NC 4.0 — liberi di usare, condividere e adattare con attribuzione, per scopi non commerciali. L’uso commerciale richiede autorizzazione scritta. Gli articoli sono open access con licenza CC BY 4.0.',
      },
    ],
  },

  contact: {
    eyebrow: 'Contatti e collaborazioni',
    headline: 'Roma, Italia.',
    headlineAccent: 'Aperti a collaborare.',
    lede: 'Lavoriamo con amministrazioni cittadine, gruppi di ricerca, associazioni e chiunque provi a sostenere una tesi sull’accesso con dei dati alle spalle. Se la vostra città dovrebbe essere nell’Atlante, se volete riusare le mappe in un articolo, o se qui qualcosa vi sembra sbagliato — scriveteci.',
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
    formerTitle: 'Membri passati',
  },

  research: {
    eyebrow: 'Produzione scientifica',
    headline: 'Articoli, dati e codice.',
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
    headline: 'Appunti\ndall’Atlante.',
    lede: 'Testi più lunghi su cosa misuriamo, come lo misuriamo, e cosa le mappe mostrano e non mostrano.',
    readingTime: '{count} min di lettura',
    backToBlog: '← Tutti gli articoli',
    published: 'Pubblicato',
    postsLabel: 'Articoli',
  },

  work: {
    eyebrow: 'Lavora con noi',
    headline: 'Nessuna posizione\naperta al momento.',
    lede: 'Al momento non stiamo selezionando per un ruolo finanziato. Siamo però sempre contenti di sentire studenti e studentesse che vogliano lavorare seriamente sull’accessibilità urbana — e quelle conversazioni cominciano di solito molto prima che una posizione esista.',
    openTitle: 'Cosa è aperto',
    positionsTitle: 'Posizioni aperte',
    noPositions: 'Nessuna posizione finanziata è aperta al momento.',
    noPositionsDetail:
      'Quando se ne aprirà una sarà pubblicata qui e sulla pagina careers di Sony CSL. Non esiste una lista d’attesa, e le candidature spontanee per ruoli inesistenti non vengono conservate.',
    routes: {
      phd: {
        title: 'Dottorandi',
        desc: 'Co-seguiamo lavori di dottorato con università italiane ed estere, di norma sulla misura dell’accessibilità, sull’analisi delle reti di trasporto o sulla fisica statistica delle città. Il finanziamento arriva normalmente dal programma di dottorato dell’università ospitante e non da noi, quindi conviene iniziare la conversazione qualche mese prima delle sue scadenze.',
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
      'Leggiamo tutto e rispondiamo alle proposte su cui possiamo agire. Siamo un gruppo piccolo, quindi non riusciamo a dare un riscontro dettagliato a ogni messaggio, e una risposta lenta non è un giudizio sulla candidatura.',
    cta: 'Scrivici',
  },

  footer: {
    description:
      'Ricerca aperta sull’accesso urbano dal team Città Sostenibili di Sony CSL — Roma. Metodi, mappe e dati, pubblicati e liberamente riutilizzabili.',
    platforms: 'Piattaforme',
    research: 'Ricerca',
    researchLinks: ['Articoli', 'Dataset', 'Blog', 'FAQ'],
    about: 'Chi siamo',
    aboutLinks: ['Team', 'Contatti', 'Lavora con noi'],
    touch: 'Resta in contatto',
    touchLinks: ['GitHub', 'Newsletter'],
    workCta: 'Lavora con noi →',
    copyright: '© 2026 Sony Computer Science Laboratories · Roma',
    version: 'Codice MIT · Dati CC BY-NC 4.0',
  },

  notFound: {
    eyebrow: 'Errore 404',
    headline: 'Fuori mappa.',
    lede: 'Questa pagina non fa parte dell’Atlante. Prova le piattaforme, o torna alla home.',
    cta: 'Torna all’Atlante',
  },
};
