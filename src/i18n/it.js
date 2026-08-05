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
    legendValue: 'Minuti per raggiungere',
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
    population: {
      name: 'Popolazione',
      legend: 'Residenti per cella',
      tooltip: '{count} residenti',
      about:
        'Residenti per cella, dall’esportazione di 15minCity. Colorata su scala logaritmica: la popolazione è fortemente asimmetrica, quindi una scala lineare metterebbe quasi tutte le celle nel colore più chiaro. È il contesto in cui si leggono le altre quattro misure — lo stesso spostamento conta di più dove lo compiono più persone.',
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
      proximity: 'Punteggio mediano di prossimità',
      medianCdi: 'CDI mediano (per cella)',
      weightedCdi: 'CDI per il residente medio',
      opportunity: 'Punteggio mediano di opportunità',
      population: 'Popolazione coperta',
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
