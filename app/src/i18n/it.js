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
    faq: 'FAQ',
    contact: 'Contatti',
    github: 'GitHub',
    skipToContent: 'Vai al contenuto',
    openMenu: 'Apri il menu',
  },

  home: {
    hero: {
      eyebrow: 'Volume II · edizione 2026',
      headline: 'Un atlante di come le città',
      headlineAccent: 'danno accesso',
      lede: 'Quattro piattaforme aperte, un unico quadro di riferimento. Misuriamo la {proximity} — ciò che si raggiunge a piedi. Misuriamo l’{opportunity} — ciò a cui arriva il trasporto pubblico. Le confrontiamo e troviamo il divario. Ogni città della Terra, dati aperti, codice aperto.',
      ledeProximity: 'prossimità',
      ledeOpportunity: 'opportunità',
      ctaPrimary: 'Esplora le piattaforme',
      ctaSecondary: 'Leggi l’articolo sul framework ↗',
    },
    news: {
      title: 'Novità dal laboratorio',
      kinds: { paper: 'Articolo', release: 'Rilascio', data: 'Dati' },
      items: {
        pov: 'Bruno et al. — il framework P.O.V.',
        cdi: 'Car Dependency Index v1.0 ({count} città)',
        fifteen: '15min-City aggiornato — +{count} città',
      },
      dates: { pov: 'Apr 2026', cdi: 'Feb 2026', fifteen: 'Gen 2026' },
    },
    metrics: {
      cities: 'Città mappate',
      platforms: 'Piattaforme attive',
      countries: 'Paesi coperti',
      researchers: 'Ricercatori',
      founded: 'Fondato nel',
    },
    coverage: {
      tag: '01',
      title: 'Una sola mappa dell’accesso, quattro lenti.',
      hint: 'passa sopra una piattaforma per l’anteprima',
      badge: 'Copertura globale · {count} città',
      legend: {
        opportunity: 'Opportunità',
        proximity: 'Prossimità',
        comparison: 'Confronto',
      },
    },
    platforms: {
      tag: '02',
      title: 'Le quattro piattaforme',
      hint: 'prossimità → opportunità → valore',
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
          'Servizi raggiungibili a piedi, misurati sull’ideale dei 15 minuti — in ogni città della Terra.',
        citychrone:
          'Geografia dei tempi di viaggio — guarda la città deformarsi mentre il trasporto pubblico ridisegna ciò che è raggiungibile.',
        cardep:
          'Quanti luoghi in più raggiunge l’auto rispetto al trasporto pubblico, cella per cella?',
        pov: 'Prossimità × Opportunità, per dividere la città in quattro zone di accesso.',
      },
    },
    table: {
      tag: '03',
      title: 'I numeri',
      hint: 'sei città, tre misure',
      headers: {
        city: 'Città',
        proximity: 'Prossimità (min a piedi)',
        opportunity: 'Opportunità (impieghi, mgl.)',
        inclusion: 'Tasso di inclusione',
      },
    },
    quote: {
      eyebrow: 'Dal gruppo di ricerca',
      before: '«Una città è una promessa di ',
      accent: 'vicinanza',
      after: ': che le cose di cui hai bisogno siano a portata di mano. L’Atlante chiede, per ogni luogo della Terra, se quella promessa venga mantenuta.»',
      attribution: '— Gruppo Città Sostenibili · Sony CSL Roma',
    },
    side: {
      tag: '04',
      title: 'Progetti collaterali e sviluppi futuri',
      items: {
        whatif: {
          status: 'Archivio',
          desc: 'La piattaforma modulare originale da cui è nato l’Atlante.',
        },
        heat: {
          name: 'Pedestrian Heat',
          status: 'In arrivo · Q3 2026',
          desc: 'Esposizione al calore di ogni percorso pedonale della città.',
        },
        a11y: {
          name: 'Accessibility for All',
          status: 'In corso',
          desc: 'Mappare la città dal punto di vista di chi usa la sedia a rotelle.',
        },
        sound: {
          name: 'Soundscapes',
          status: 'Concept',
          desc: 'Accessibilità acustica — dove si riesce davvero ad ascoltare la città?',
        },
      },
    },
  },

  platform: {
    search: 'Cerca la tua città…',
    searchHint: '⌘K',
    paper: 'Articolo ↗',
    github: 'GitHub ↗',
    welcome: 'Benvenuto su {name}',
    dismiss: 'Chiudi',
    ctaMap: 'Clicca una città sulla mappa',
    learnMore: 'Scopri di più →',
    attribution: 'Tile © OpenStreetMap · Dati © Sony CSL Roma',
    cityCount: '{count} città',
    zoomIn: 'Ingrandisci',
    zoomOut: 'Riduci',
    loading: 'Caricamento della copertura…',
    empty: 'Nessuna città corrisponde alla ricerca.',

    fifteen: {
      label: 'Accesso di prossimità',
      intro:
        'Una piattaforma che misura quanto ogni quartiere si avvicina all’ideale della città in 15 minuti: servizi, scuole, cibo e sanità raggiungibili a piedi o in bicicletta. Clicca una città per entrare nella sua mappa di accessibilità.',
      legendUnit: 'Tempo medio di prossimità',
      legend: ['0–3 min', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24', '24–30'],
    },
    citychrone: {
      label: 'Accesso alle opportunità',
      intro:
        'CityChrone++ sostituisce la distanza con il tempo di viaggio. Guarda la città deformarsi sotto le tue dita mentre il trasporto pubblico ridisegna ciò che è raggiungibile — e simula scenari con nuove linee e nuove fermate.',
      legendUnit: 'Punteggio di velocità',
      legend: ['Lento', 'Medio', 'Veloce'],
    },
    cardep: {
      label: 'Trasporto pubblico vs. auto privata',
      intro:
        'Una misura ad alta risoluzione di quanto le opportunità siano più raggiungibili in auto che con il trasporto pubblico. Le celle blu favoriscono il trasporto pubblico, quelle rosse richiedono l’auto. Basato su Campanelli et al., 2026.',
      legendUnit: 'Rapporto CDI',
      legend: ['Favorevole al TP', 'Misto', 'Dipendente dall’auto', 'Solo auto'],
    },
    pov: {
      label: 'Prossimità · Opportunità · Valore',
      intro:
        'Ogni città è mappata lungo due dimensioni: la Prossimità (i servizi locali raggiungibili a piedi) e l’Opportunità (ciò che il trasporto pubblico raggiunge rapidamente). Una terza dimensione, il Valore intrinseco dei luoghi, resta ancora da quantificare.',
      legendUnit: 'Tipo di zona',
      legend: ['Inclusione', 'Isolamento spaziale', 'Isolamento sociale', 'Isolamento totale'],
    },
  },

  city: {
    region: '{region} · {count} esagoni',
    worldMap: 'Mappa mondiale',
    compare: 'Confronta città',
    zoneType: 'Tipo di zona',
    zones: {
      inclusion: { name: 'Inclusione', desc: 'Alta prossimità · Alta opportunità' },
      spatial: { name: 'Isolamento spaziale', desc: 'Alta prossimità · Bassa opportunità' },
      social: { name: 'Isolamento sociale', desc: 'Bassa prossimità · Alta opportunità' },
      total: { name: 'Isolamento totale', desc: 'Bassa prossimità · Bassa opportunità' },
    },
    summary: {
      title: 'Sintesi della città',
      hexagons: 'Esagoni',
      proximity: 'Prossimità mediana',
      opportunity: 'Opportunità mediana',
      population: 'Popolazione',
    },
    cartogram: {
      title: 'Cartogramma · Maglia esagonale',
      caption: 'Risoluzione H3 {res} · celle da ~{size} m',
    },
    scatter: {
      title: 'Dispersione · Prossimità vs. opportunità',
      xAxis: 'Punteggio di opportunità →',
      yAxis: 'Punteggio di prossimità →',
    },
    statusHint:
      'Passa sopra o clicca un esagono o un punto per evidenziarli insieme · scorri e trascina per navigare',
    computing: 'Calcolo della maglia…',
  },

  faq: {
    eyebrow: 'Domande frequenti',
    headline: 'Sei domande\nricorrenti.',
    lede: 'Risposte rapide a ciò che ci viene chiesto più spesso. Hai un’altra domanda? Scrivi a {email} — rispondiamo entro una settimana.',
    meta: {
      updated: 'Ultimo aggiornamento',
      updatedValue: '14 maggio 2026',
      entries: 'Voci',
      languages: 'Lingue',
      languagesValue: 'EN · IT',
    },
    items: [
      {
        q: 'Cosa significa «accesso» nell’Atlante?',
        a: 'Usiamo la parola accesso come ombrello per tre cose misurabili: la prossimità (ciò che si raggiunge a piedi), l’opportunità (ciò a cui arriva il trasporto pubblico entro un tempo dato) e il valore (il peso qualitativo di quei luoghi raggiungibili). Ogni piattaforma ne misura una o più.',
      },
      {
        q: 'Da dove vengono i dati?',
        a: 'Le reti stradali e i servizi vengono da OpenStreetMap. Le reti di trasporto pubblico da feed GTFS aperti. I dati di popolazione da WorldPop e dal JRC GHSL. Tutto ciò che usiamo per costruire le mappe è aperto e citabile.',
      },
      {
        q: 'Perché la mia città non c’è?',
        a: 'La copertura dipende dalla qualità di OSM e dalla disponibilità di un feed GTFS utilizzabile. 15min-City copre circa 10.000 città; le piattaforme di confronto si concentrano su un insieme più ristretto di città di studio ben documentate. Apri una issue su GitHub e valuteremo di aggiungere la tua.',
      },
      {
        q: 'Posso citare questo lavoro?',
        a: 'Sì — ogni piattaforma rimanda all’articolo che la descrive. Il riferimento del framework è Bruno et al., EPJ Data Science (2026); il Car Dependency Index è descritto in Campanelli et al., 2026.',
      },
      {
        q: 'L’Atlante è gratuito?',
        a: 'Sì. I dati sono aperti con licenza CC BY-NC 4.0, il codice con licenza MIT. L’uso commerciale delle mappe richiede un’autorizzazione scritta.',
      },
      {
        q: 'Ho trovato un bug / vorrei una funzionalità.',
        a: 'Ogni piattaforma ha un tracker di issue su GitHub, linkato nel suo footer. Rispondiamo alle issue con cadenza settimanale durante l’anno accademico.',
      },
    ],
  },

  contact: {
    eyebrow: 'Contatti e collaborazioni',
    headline: 'Roma, Italia.',
    headlineAccent: 'Aperti a collaborare.',
    lede: 'Collaboriamo con amministrazioni comunali, ONG, università e cittadini curiosi. Se la tua città dovrebbe essere sull’Atlante, se vuoi usare le nostre mappe in un articolo, o se semplicemente hai un’idea — scrivici.',
    fields: {
      address: 'Indirizzo',
      general: 'Generale',
      press: 'Stampa',
      code: 'Codice',
      phone: 'Telefono',
    },
    addressValue: 'Sapienza Università di Roma\nPiazzale Aldo Moro, 5 — 00185 Roma, IT',
    teamTitle: 'Il gruppo',
    roles: {
      director: 'Direttore · Principal Investigator',
      senior: 'Ricercatore senior',
      pov: 'Ricercatore · P.O.V.',
      fifteen: 'Ricercatore · 15min-City',
      citychrone: 'Ricercatore · CityChrone',
      cardep: 'Ricercatore · Car Dependency',
      hiring: 'Stiamo assumendo.',
    },
    joinName: 'Tu?',
  },

  research: {
    eyebrow: 'Prodotti della ricerca',
    headline: 'Articoli, dati e codice.',
    lede: 'Tutto ciò che sta dietro all’Atlante è pubblicato. Ogni piattaforma è documentata in un articolo sottoposto a revisione, distribuisce il suo dataset con licenza CC BY-NC 4.0 e mantiene il codice di analisi su GitHub con licenza MIT.',
    papersTag: '01',
    papersTitle: 'Articoli',
    papersHint: 'peer-reviewed, ad accesso aperto',
    datasetsTag: '02',
    datasetsTitle: 'Dataset e codice',
    datasetsHint: 'CC BY-NC 4.0 · MIT',
    citeTitle: 'Come citare l’Atlante',
    columns: { dataset: 'Dataset', coverage: 'Copertura', format: 'Formato', licence: 'Licenza' },
  },

  footer: {
    description:
      'Ricerca aperta sull’accesso urbano dal gruppo Città Sostenibili di Sony CSL — Roma. Mappe, metodi e dati, liberamente utilizzabili.',
    platforms: 'Piattaforme',
    research: 'Ricerca',
    researchLinks: ['Articoli', 'Dataset', 'GitHub', 'Citazioni'],
    about: 'Informazioni',
    aboutLinks: ['Gruppo', 'Metodi', 'FAQ', 'Stampa'],
    touch: 'Resta in contatto',
    touchLinks: ['Newsletter', 'Mastodon', 'Twitter / X', 'BlueSky'],
    copyright: '© 2026 Sony Computer Science Laboratories · Roma',
    version: 'v2.0 · Aggiornato maggio 2026 · CC BY-NC 4.0',
  },

  notFound: {
    eyebrow: 'Errore 404',
    headline: 'Fuori dalla mappa.',
    lede: 'Questa pagina non fa parte dell’Atlante. Prova con le piattaforme, oppure torna alla home.',
    cta: 'Torna all’Atlante',
  },
};
