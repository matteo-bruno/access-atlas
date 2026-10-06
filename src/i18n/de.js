// German copy (Germany). Mirrors the shape of en.js; `test:data` checks it.
// Register: Sie. Neutral forms where German has them (Forschende,
// Studierende); the team roles take the form each person stated (team.js).
// Names of the Atlas, its platforms and datasets, the postal address and
// citations stay as published. Blog posts have no German version and fall
// back to English.

export default {
  meta: {
    locale: 'de-DE',
    name: 'Deutsch',
  },

  nav: {
    title: 'Accessibility Atlas',
    tagline: 'Sony CSL · Rom — Nachhaltige Städte',
    atlas: 'Start',
    platforms: 'Atlas',
    citychat: 'CityChat',
    stats: 'Statistik',
    about: 'Nachhaltige Städte',
    consulting: 'Beratung',
    research: 'Forschung',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Kontakt',
    github: 'GitHub',
    skipToContent: 'Zum Inhalt springen',
    openMenu: 'Menü öffnen',
    language: 'Sprache',
  },

  home: {
    hero: {
      eyebrow: 'Offene Forschungsplattformen · Sony CSL Rom',
      title: 'Accessibility',
      titleAccent: 'Atlas',
      subtitle: 'Wir kartieren städtische Erreichbarkeit, Stadt für Stadt.',
      headline: 'Ein Atlas, der misst,',
      headlineAccent: 'was Städte erreichbar machen.',
      lede: 'Was ist in einer Stadt erreichbar? Messen Sie die {proximity}: die Dienste des Alltags, die zu Fuß erreichbar sind. Messen Sie die {opportunity}: was der öffentliche Verkehr in einer bestimmten Zeit erreichbar macht. Messen Sie die {cardep}: wie sehr man das Auto braucht, um die Möglichkeiten der Stadt zu nutzen. Entdecken Sie, wie Erreichbarkeit Ungleichheit fortschreibt.',
      ledeProximity: 'Nähe',
      ledeOpportunity: 'Chancen',
      ledeCardep: 'Autoabhängigkeit',
      ctaPrimary: 'Plattform erkunden',
      ctaSecondary: 'Das Grundlagenpapier lesen ↗',
    },
    news: {
      title: 'Neues aus dem Labor',
      kinds: { paper: 'Artikel', release: 'Version', data: 'Daten' },
      items: {
        pov: 'The dimensions of accessibility — EPJ Data Science',
        cdi: 'Car Dependency Index: {count} Städte veröffentlicht',
        atlas: 'Kombinierte Ansicht: Mailand auf einem gemeinsamen Raster veröffentlicht, mit allen vier Plattformen',
      },
      dates: { pov: 'Apr. 2026', cdi: 'Feb. 2026', atlas: 'Aug. 2026' },
    },
    landing: {
      mapLabel: 'Alle vom Atlas veröffentlichten Städte',
      by: 'Ein Projekt von Sony CSL · Rom',
    },
    premise: {
      lines: [
        'Städte sind Orte der Möglichkeiten.',
        'Zugang zu Möglichkeiten verringert Ungleichheit.',
        'Ungleicher Zugang schafft ungleiche Gesellschaften.',
      ],
    },
    metrics: {
      cities: 'Veröffentlichte Städte',
      platforms: 'Plattformen',
      countries: 'Länder',
      cells: 'Sechseckzellen',
      researchers: 'Forschende',
    },
    platforms: {
      title: 'Ebenen der Erreichbarkeit',
      more: 'Mehr erfahren',
      cityCount: '{count} Städte',
      themes: {
        fifteen: 'Nähe',
        citychrone: 'Chancen',
        cardep: 'Vergleich',
        pov: 'Synthese',
      },
      desc: {
        fifteen:
          'Fuß- und Radwege zu zehn Kategorien alltäglicher Dienste, gelesen am Maßstab der 15 Minuten.',
        citychrone:
          'Eine Geografie der Reisezeiten: die Stadt so neu gezeichnet, dass Entfernung in Minuten mit dem öffentlichen Verkehr gemessen wird.',
        cardep:
          'Wie weit die Erreichbarkeit mit dem Auto die mit dem öffentlichen Verkehr übertrifft, Zelle für Zelle.',
        pov: 'Nähe und Chancen gegeneinander gelesen, um die Stadt in vier Zonen der Erreichbarkeit zu teilen.',
      },
    },
    table: {
      title: 'Städte vergleichen',
      statsNote:
        'Sechs Städte, drei Maße, aus den P.O.V.-Daten. Der Bildschirm, der alle veröffentlichten Städte in allen Maßen vergleicht, ist der Reiter Statistik.',
      statsCta: 'Statistik öffnen',
      headers: {
        city: 'Stadt',
        proximity: 'Medianer Nähe-Wert',
        opportunity: 'Medianer Chancen-Wert',
        inclusion: 'Inklusionszone',
      },
      note: 'Nähe und Chancen sind gewichtete Zählungen erreichbarer Orte von Interesse. Sie sind zwischen Städten vergleichbar, weil jede Stadt auf dieselbe Weise gemessen wird. Inklusion ist der Anteil der Zellen, die über beiden bevölkerungsgewichteten Medianen liegen.',
    },
    side: {
      title: 'In Arbeit',
      kinds: { live: 'Online', paper: 'Artikel' },
      items: {
        shade: {
          name: 'Das Recht auf Schatten',
          desc: 'Schatten als Infrastruktur: Wer kann eine Stadt im Sommer durchqueren, ohne in der Sonne zu gehen, und wer nicht?',
        },
        weight: {
          name: 'Das Gewicht städtischer Ungleichheit',
          desc: 'Ungleiche Erreichbarkeit in drei Dimensionen gelesen, Stadt für Stadt, als Fläche statt als Tabelle.',
        },
        odMatrices: {
          name: 'OD-Matrizen aus GPS-Daten',
          desc: 'Quell-Ziel-Ströme, rekonstruiert aus GPS-Spuren, um die Wege, die Menschen tatsächlich zurücklegen, mit denen zu vergleichen, die das Netz möglich macht.',
        },
        bikeLanes: {
          name: 'Radwegeplanung',
          desc: 'Wo ein Radnetz als Nächstes wachsen sollte, gegeben die Breite der Straßen, in die es passen muss, und die Verbindungen, die es schaffen würde.',
        },
        co2: {
          name: 'CO₂-Emissionen des Verkehrs',
          desc: 'Die Emissionskosten der Stadtform: wie viel Kohlenstoff die Mobilität einer Stadt verbraucht und wie sehr Nähe diese Zahl verändert.',
        },
        quality: {
          name: 'Die Ungleichheit der Qualität',
          desc: 'Die dritte Dimension des Ansatzes: nicht wie viel erreichbar ist, sondern wie gut es ist, und ob Qualität so ungleich verteilt ist wie Erreichbarkeit.',
        },
      },
    },
  },

  platform: {
    search: 'Ihre Stadt suchen…',
    searchHint: '⌘K',
    paper: 'Artikel ↗',
    welcome: 'Willkommen bei {name}',
    dismiss: 'Schließen',
    ctaMap: 'Klicken Sie auf eine Stadt in der Karte',
    learnMore: 'Mehr erfahren →',
    attribution: 'Grundkarte: Natural Earth · Daten © Sony CSL Rom · CC BY-NC 4.0',
    cityCount: '{count} Städte',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    loading: 'Abdeckung wird geladen…',
    empty: 'Keine Stadt entspricht dieser Suche.',
    seeded: 'Beispielwerte: Die Messungen dieser Plattform sind noch nicht veröffentlicht.',

    all: {
      name: 'Alle Ebenen',
      welcome: 'Willkommen im Accessibility Atlas',
      label: 'Veröffentlichte Abdeckung',
      pick: 'Karte wählen',
      intro:
        'Alle Städte, die der Atlas veröffentlicht hat, über alle vier Plattformen. Jede Plattform misst etwas anderes und deckt andere Städte ab: Wählen Sie eine aus, um ihre eigene Karte, ihre Skala und ihre Städte zu sehen. Je dunkler eine Stadt, desto mehr der vier Maße sind für sie veröffentlicht.',
      legendUnit: 'Veröffentlichte Plattformen',
      legend: ['Eine', 'Zwei', 'Drei', 'Alle vier'],
      covered: '{count} von 4 Plattformen',
    },

    fifteen: {
      label: 'Erreichbarkeit im Nahbereich',
      intro:
        'Reisezeit zu Fuß und mit dem Rad zu zehn Kategorien alltäglicher Dienste (Gesundheit, Bildung, Einkauf, Essen, Kultur, Freiflächen, Bewegung, Dienstleistungen, Mobilität), berechnet für jede Zelle der Stadt und gelesen am Maßstab der 15 Minuten.',
      legendUnit: 'Mittlere Zeit zu den Diensten',
      legend: ['0–3 Min.', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24', '24–30'],
    },
    citychrone: {
      label: 'Erreichbarkeit von Chancen',
      intro:
        'CityChrone ersetzt die metrische Entfernung durch die Reisezeit: Die Karte verformt sich so, dass zwei Orte nah beieinander liegen, wenn der öffentliche Verkehr sie schnell verbindet, wie weit sie im Gelände auch auseinander liegen.',
      legendUnit: 'Geschwindigkeitswert',
      legend: ['Langsam', 'Mittel', 'Schnell'],
    },
    cardep: {
      label: 'Auto oder öffentlicher Verkehr',
      intro:
        'Der Car Dependency Index vergleicht die Chancen, die mit dem Auto erreichbar sind, mit denen, die im gleichen Zeitbudget mit dem öffentlichen Verkehr erreichbar sind: CDI = (O_Auto − O_ÖV) / (O_Auto + O_ÖV). Er reicht von −1, wo der öffentliche Verkehr mehr erreicht, über 0, wo beide ausgeglichen sind, bis +1, wo das Auto alles und der öffentliche Verkehr fast nichts erreicht.',
      legendUnit: 'Car Dependency Index',
      legend: ['ÖV-begünstigt', 'Ausgeglichen', 'Autoabhängig', 'Stark autoabhängig'],
    },
    pov: {
      label: 'Nähe · Chancen · Wert',
      intro:
        'Jede Zelle erhält einen Wert auf zwei Achsen (Nähe, die zu Fuß erreichbaren Dienste des Alltags, und Chancen, die mit dem öffentlichen Verkehr erreichbaren Ziele auf Stadtebene) und wird dann auf jeder Achse am bevölkerungsgewichteten Median der Stadt eingeordnet. Eine dritte Achse, der Wert des Erreichbaren, ist im Ansatz angelegt, aber noch nicht quantifiziert.',
      legendUnit: 'Zone',
      legend: ['Inklusion', 'Räumliche Isolation', 'Soziale Isolation', 'Vollständige Isolation'],
    },
  },

  fifteen: {
    mapTitle: 'Reisezeit zu den Diensten',
    minutes: 'Min.',
    barsTitle: 'Alle Kategorien, von dieser Zelle aus',
    barsAxis: 'Die Balken reichen bis {max} {unit}; alles darüber füllt den Balken.',
    legendValue: 'Zeit im Nahbereich',
    statusHint:
      'Verkehrsmittel und Kategorie wählen · über ein Legendenband fahren, um es hervorzuheben · scrollen und ziehen zum Navigieren',
    controls: {
      mode: 'Verkehrsmittel',
      category: 'Dienstkategorie',
    },
    modes: { foot: 'Zu Fuß', bike: 'Mit dem Rad' },
    hint: 'Mittlere Reisezeit von jeder Zelle zu den nächstgelegenen Diensten dieser Kategorie.',
    summary: { median: 'Mediane Reisezeit' },
    categories: {
      average: 'Mittel über alle Dienste',
      outdoor: 'Aktivitäten im Freien',
      learning: 'Bildung',
      supplies: 'Einkauf',
      eating: 'Essen',
      moving: 'Mobilität',
      cultural: 'Kultur',
      exercise: 'Bewegung',
      services: 'Dienstleistungen',
      healthcare: 'Gesundheit',
    },
  },

  atlas: {
    label: 'Kombinierte Ansicht',
    mapTitle: 'Gemessen von {name}',
    controls: {
      layer: 'Darstellung',
      view: 'Maß',
      hour: 'Tageszeit',
      opacity: 'Deckkraft der Ebene',
    },
    info: 'Über diese Ebene',
    hidePanel: 'Steuerung ausblenden',
    showPanel: 'Steuerung',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    population: {
      name: 'Bevölkerung',
      legend: 'Einwohner je Zelle',
      tooltip: '{count} Einwohner',
      about:
        'Einwohner je Zelle aus dem Export von 15-minute city, auf einer logarithmischen Farbskala: Die Bevölkerung ist stark ungleich verteilt, und eine lineare Skala würde fast jede Zelle in die hellste Farbe setzen. Sie ist der Kontext, in dem die anderen vier Maße zu lesen sind: Derselbe Weg zählt mehr, wo mehr Menschen ihn zurücklegen.',
    },
    beyond: {
      fifteen: 'ab 120 Min. bis ins Schwarze dunkler werdend',
      isochrone: 'bis ins Schwarze bei 180 Min., dem veröffentlichten Höchstwert',
    },
    views: {
      velocity: 'Geschwindigkeit',
      sociality: 'Sozialität',
      isochrone: 'Isochronen',
    },
    viewHint: {
      velocity:
        'Wie schnell der öffentliche Verkehr Sie zu dieser Stunde von jeder Zelle wegbringt: ein Wert ähnlich km/h.',
      sociality:
        'Wie viele Menschen der öffentliche Verkehr zu dieser Stunde für jede Zelle erreichbar macht: ein Wert, keine Personenzahl.',
      isochrone: 'Reisezeit mit dem öffentlichen Verkehr von einer gewählten Zelle zu allen anderen.',
    },
    legend: {
      velocity: 'Geschwindigkeitswert (km/h)',
      sociality: 'Sozialitätswert',
      isochrone: 'Minuten ab der gewählten Zelle',
    },
    summary: { weightedV: 'Geschwindigkeit für die durchschnittliche Einwohnerschaft' },
    mistake: {
      title: 'Fehler entdeckt?',
      body: 'Fehler passieren! Daten können fehlen oder irreführen. {contact}, wenn Sie wissen, wie er sich beheben lässt.',
      contact: 'Schreiben Sie uns',
    },
    osmUpdate: 'Letzte OpenStreetMap-Aktualisierung: {date}',
    layerCells: 'Von {name} gemessene Zellen',
    isochroneEmpty: 'Klicken Sie auf eine Zelle, um die Reisezeiten von dort zu zeigen',
    unavailable: 'Nicht veröffentlicht',
    noValue: 'Für diese Zelle nicht gemessen',
    openPlatform: 'Seite von {name}',
    statusHint:
      'Ein Raster, vier Messungen: Beim Wechsel der Ebene werden dieselben Zellen neu eingefärbt · scrollen und ziehen zum Navigieren',
    legacyHint:
      'Diese Stadt ist noch nicht auf dem gemeinsamen Raster exportiert: Jede Darstellung lädt das Netz ihrer eigenen Plattform.',
    error: 'Das veröffentlichte Netz konnte nicht geladen werden.',
  },

  city: {
    region: '{region} · {count} Zellen',
    worldMap: 'Weltkarte',
    compare: 'Städte vergleichen',
    zoneType: 'Zone',
    cdiHint:
      'Negativ, wo der öffentliche Verkehr mehr erreicht als das Auto, positiv, wo das Auto mehr erreicht. Der Index ist eine normierte Differenz zwischen −1 und +1, kein Verhältnis.',
    zones: {
      inclusion: {
        name: 'Inklusion',
        desc: 'Über dem Median auf beiden Achsen: gut versorgt vor Ort und stadtweit angebunden',
      },
      spatial: {
        name: 'Räumliche Isolation',
        desc: 'Dienste in der Nähe, aber schwache ÖV-Anbindung an den Rest der Stadt',
      },
      social: {
        name: 'Soziale Isolation',
        desc: 'Gute ÖV-Anbindung, aber wenige Dienste zu Fuß erreichbar',
      },
      total: {
        name: 'Vollständige Isolation',
        desc: 'Unter dem Median auf beiden Achsen: meist der Stadtrand',
      },
    },
    summary: {
      title: 'Stadtübersicht',
      hexagons: 'Zellen',
      area: 'Abgedeckte Fläche',
      proximity: 'Medianer Nähe-Wert',
      medianCdi: 'Medianer CDI (je Zelle)',
      weightedCdi: 'CDI der durchschnittlichen Einwohnerschaft',
      opportunity: 'Medianer Chancen-Wert',
      population: 'Abgedeckte Bevölkerung',
    },
    filter: {
      title: 'Nach Index filtern',
      reset: 'Zurücksetzen',
      about: 'Beschränkt Karte und Streudiagramm auf Zellen, deren Index zwischen den beiden Reglern liegt. Alles andere bleibt abgeblendet auf der Karte: Ein Filter ist hier eine Sichtweise, nicht die Behauptung, der Rest fehle. Die Werte der Übersicht ändern sich nicht, denn sie beschreiben die ganze Stadt.',
      showing: '{count} von {total} Zellen',
    },
    selected: {
      title: 'Gewählte Zelle',
      empty: 'Klicken Sie auf eine Zelle, in der Karte oder im Streudiagramm, um alles zu sehen, was für sie gemessen wurde.',
      clear: 'Auswahl aufheben',
    },
    cell: {
      zone: 'Zone',
      proximity: 'Nähe-Wert',
      opportunity: 'Chancen-Wert',
      cdi: 'Car Dependency Index',
      byCar: 'Mit dem Auto erreichbar',
      byTransit: 'Mit dem ÖV erreichbar',
      population: 'Einwohner',
      thresholdProximity: 'Zonenschwelle, Nähe',
      thresholdOpportunity: 'Zonenschwelle, Chancen',
      time: 'Reisezeit',
      velocity: 'Geschwindigkeitswert',
      sociality: 'Sozialitätswert',
      grid: 'H3-Zelle',
    },
    explain: {
      map: {
        pov: 'Jede Zelle nimmt die Farbe ihrer Zone an: grün über dem Median auf beiden Achsen, rot darunter auf beiden, dazwischen die beiden gemischten Fälle. Die Schwellen sind die bevölkerungsgewichteten Mediane der jeweiligen Stadt. Eine Zone vergleicht also Orte innerhalb einer Stadt und nie eine Stadt mit einer anderen: Zwischen Städten vergleichbar sind die zugrunde liegenden Werte.',
        cardep: 'Blau, wo der öffentliche Verkehr mehr Chancen erreicht als das Auto, weiß, wo beide ausgeglichen sind, rot, wo das Auto mehr erreicht. Die Skala ist für alle Städte gleich, statt an jede angepasst zu werden: Dieselbe Farbe bedeutet überall denselben Index, und keine Stadt wird umgefärbt, um die Palette zu füllen.',
        fifteen: 'Die Zellen sind danach gefärbt, wie lange es dauert, die gewählte Kategorie mit dem gewählten Verkehrsmittel zu erreichen. Weiß liegt bei 15 Minuten, dem Maßstab, der der Plattform ihren Namen gibt, und die Skala wird über 30 hinaus weiter dunkler bis Schwarz bei 120. Die Legende benennt diesen Ausläufer, statt sich bis dorthin zu strecken, was den Bereich stauchen würde, in dem fast jede Zelle liegt. Eine einzige Skala gilt für alle zehn Kategorien und beide Verkehrsmittel: Eine Farbe bedeutet dasselbe, was auch gewählt ist.',
      },
      summary: {
        pov: '„Zellen“ zählt die vom veröffentlichten Datensatz abgedeckten. Jeder Median ist der Wert der mittleren Zelle: gewichtete Zählungen erreichbarer Orte von Interesse, weshalb keiner eine Einheit trägt. Es sind weder Meter noch Arbeitsplätze. Die Bevölkerung ist die Summe des Datensatzes über seine Zellen, keine amtliche Zahl der Stadt.',
        cardep: 'Der mediane CDI ist der Index der mittleren Zelle. Der CDI der durchschnittlichen Einwohnerschaft gewichtet jede Zelle nach den Menschen, die dort leben, und ist die Zahl, nach der die Plattform die Städte ordnet: Die Hälfte der Zellen einer Stadt kann autoabhängig sein, während die meisten Einwohner in der anderen Hälfte leben.',
        fifteen: 'Der Median ist die Zeit der mittleren Zelle für die angezeigte Kategorie und das angezeigte Verkehrsmittel. Er beschreibt Zellen, nicht Menschen: Jede Zelle zählt einmal, gleich wie viele dort wohnen. Die Bevölkerung ist die Summe des Datensatzes.',
        atlas: 'Die Werte werden für die angezeigte Ebene neu berechnet. „Zellen“ ist das Vereinigungsnetz, also jede Zelle, die mindestens eine Plattform misst: Eine Ebene, die weniger abdeckt, weist das in ihrer eigenen Zeile aus.',
      },
      more: 'Ausführliche Erklärung',
      platformSite: 'Website von {name}',
      aboutTitle: 'Über {name}',
      sections: {
        measure: 'Was gemessen wird',
        map: 'Die Karte lesen',
        geometry: 'Die zwei Geometrien',
        summary: 'Die Werte im Bereich',
        source: 'Woher es stammt',
      },
      methodsTitle: 'Daten und Methoden',
      methods: {
        pov: 'H3-Zellen der Auflösung 9, etwa 200 m breit. Gehzeiten mit OSRM auf OpenStreetMap; öffentlicher Verkehr aus GTFS-Fahrplänen mit dem Connection Scan Algorithm; Orte von Interesse aus OpenStreetMap; Bevölkerung aus den 100-m-Rastern von WorldPop, angepasst an UN-Schätzungen.',
        cardep: 'H3-Zellen der Auflösung 9, etwa 200 m breit. Fahr- und Gehzeiten mit OSRM auf OpenStreetMap, auf der Autoseite mit einem Zuschlag für die Parkplatzsuche und stadtspezifischen Verkehrsverzögerungen; öffentlicher Verkehr aus GTFS-Fahrplänen mit dem Connection Scan Algorithm; Orte von Interesse aus OpenStreetMap; Bevölkerung aus WorldPop.',
        fifteen: 'H3-Zellen der Auflösung 9. Geh- und Radzeiten mit OSRM auf OpenStreetMap; Dienste aus OpenStreetMap, gruppiert in die zehn Kategorien der Auswahl; Bevölkerung aus WorldPop.',
        citychrone: 'H3-Zellen der Auflösung 9, ein Export pro Tagesstunde. Öffentlicher Verkehr aus GTFS-Fahrplänen; beide Werte und die Isochronen sind im Artikel der Plattform definiert. Reisezeiten werden in ganzen Minuten veröffentlicht, gedeckelt bei 180.',
      },
      paperNote: 'Die Methode ist im Artikel vollständig beschrieben.',
    },
    geometry: {
      label: 'Geometrie',
      map: 'Karte',
      cartogram: 'Kartogramm',
      mapTitle: 'Karte · Zellen an ihrem Ort',
      mapCaption: 'Die Zellfläche ist die Fläche, die sie abdeckt',
      cartogramCaption: 'Die Zellfläche ist ihre Wohnbevölkerung',
      loading: 'Die andere Geometrie wird geladen…',
      unavailable: 'Kein Kartogramm veröffentlicht',
      about: {
        map: 'Jede Zelle ist das Sechseck, das sie im Gelände einnimmt, überall gleich groß, was immer darin liegt. Die Fläche sagt nichts darüber, wie viele Menschen ein Maß betrifft: Ein dünn besiedelter Stadtrand nimmt im Bild so viel Platz ein wie das dichte Zentrum.',
        cartogram: 'Jede Zelle bleibt an ihrem wirklichen Ort, aber ihre Fläche steht für ihre Wohnbevölkerung und nicht für das Gelände, das sie abdeckt: Eine Zelle mit wenigen Einwohnern schrumpft auf einen Bruchteil eines Sechsecks, eine dicht besiedelte füllt es. Sie beantwortet eine andere Frage: nicht, wo ein Maß niedrig ist, sondern für wie viele Menschen.',
        derived: 'Dieses Kartogramm stammt vom Atlas selbst: {name} veröffentlicht keines. Die Fläche ist hier proportional zur Wohnbevölkerung der Zelle und erreicht das volle Sechseck bei der medianen Bevölkerung der bewohnten Zellen der Stadt. Die Regel ist an den Kartogrammen kalibriert, die die anderen Plattformen für dieselbe Stadt veröffentlichen, und gibt sie auf einer 200-m-Zelle auf etwa 12 m genau wieder. So wirkt eine Zelle mit gegebener Bevölkerung auf jeder Ebene gleich groß.',
        missing: 'Ein Kartogramm ist eine von seinen Autoren berechnete Anordnung, keine Umformung der Karte. Der Atlas zeichnet daher das Kartogramm, das jede Plattform veröffentlicht hat, statt selbst eines abzuleiten. {name} veröffentlicht keines.',
      },
    },
    cartogram: {
      title: 'Kartogramm · Zellfläche ∝ Bevölkerung',
      caption: 'H3-Auflösung {res} · Zellen von ~{size} m',
      captionSize: 'Zellen von ~{size} m',
    },
    scatterCdi: {
      title: 'Chancen mit dem Auto und mit dem öffentlichen Verkehr',
      xAxis: 'Mit dem Auto erreichbar →',
      yAxis: 'Mit dem ÖV erreichbar →',
      diagonal: 'gleiche Reichweite',
    },
    scatter: {
      title: 'Nähe und Chancen',
      xAxis: 'Chancen-Wert →',
      yAxis: 'Nähe-Wert →',
    },
    statusHint:
      'Über eine Zelle oder einen Punkt fahren oder klicken, um sie hervorzuheben · scrollen und ziehen zum Navigieren',
    computing: 'Netz wird geladen…',
    seeded:
      'Beispielnetz: Die Messungen dieser Stadt sind noch nicht veröffentlicht, die Anordnung der Zellen ist daher generiert.',
  },

  compare: {
    label: 'Städte vergleichen',
    count: '{count} Städte',
    lede: 'Alle Städte, die diese Plattform veröffentlicht hat, nebeneinander. Die Werte werden aus denselben Dateien berechnet, die die Stadtseiten zeichnen: Eine Zahl hier ist dieselbe Zahl dort.',
    back: 'Zurück zur Karte',
    openCity: '{name} öffnen',
    sortBy: 'Sortieren nach',
    sort: {
      name: 'Name',
      population: 'Bevölkerung',
      weightedCdi: 'Index der durchschnittlichen Einwohnerschaft',
      medianCdi: 'Medianer Index',
      ptShare: 'ÖV-begünstigte Zellen',
      inclusion: 'Inklusion',
      proximity: 'Mediane Nähe',
      opportunity: 'Mediane Chancen',
    },
    basis: { label: 'Anteile', cells: 'Nach Zellen', residents: 'Nach Einwohnern' },
    ranking: {
      cardep: 'Städte nach Index geordnet',
      pov: 'Zonenmischung je Stadt',
      aboutCardep: 'Jeder Balken ist der Index der durchschnittlichen Einwohnerschaft dieser Stadt: jede Zelle gewichtet nach den Menschen, die dort leben. Links der Linie stehen Städte, in denen der öffentliche Verkehr für typische Einwohner mehr erreicht als das Auto; rechts davon die, in denen das Auto mehr erreicht. Die Balken verwenden dieselbe Skala wie die Karten.',
      aboutPov: 'Der Anteil jeder Stadt, der in jede der vier Zonen fällt. Die Zonen werden an den bevölkerungsgewichteten Medianen derselben Stadt bestimmt: Verglichen wird hier also die Mischung innerhalb der Städte, nicht das Niveau zwischen ihnen. Eine Stadt kann zur Hälfte Inklusion sein und insgesamt doch schlecht versorgt. Sie können nach Zellen oder nach Einwohnern zählen: Isolierte Zellen sind groß und dünn besiedelt, und die beiden Lesarten erzählen Verschiedenes.',
    },
    scatter: {
      cardep: 'Was das Auto erreicht, gegenüber dem öffentlichen Verkehr',
      pov: 'Nähe und Chancen',
      aboutCardep: 'Ein Kreis pro Stadt, platziert danach, was die durchschnittliche Einwohnerschaft auf beiden Wegen erreicht, und skaliert nach der Bevölkerung. Die Diagonale markiert gleiche Reichweite: Kreise darunter sind Städte, in denen das Auto mehr erreicht.',
      aboutPov: 'Ein Kreis pro Stadt, platziert nach den Werten ihrer durchschnittlichen Einwohnerschaft und skaliert nach der Bevölkerung. Beide Achsen sind gewichtete Zählungen erreichbarer Orte von Interesse und haben daher keine Einheit: Die Position vergleicht Städte, und die Zahl allein hat nur im Vergleich mit einer anderen Stadt auf derselben Achse Bedeutung.',
    },
    distribution: {
      title: 'Wo die Einwohner jeder Stadt auf dem Index liegen',
      about: 'Jede Kurve ist eine Stadt: der Anteil ihrer Einwohner, die bei einem Indexwert oder darunter leben. Eine Kurve, die früh und steil ansteigt, ist eine Stadt, in der fast alle auf der Seite des öffentlichen Verkehrs stehen; eine, die bis weit nach rechts flach bleibt, ist eine Stadt, in der fast alle vom Auto abhängen. Wo die Kurve die Mittellinie kreuzt, liegt der Anteil der Einwohner, für die Auto und öffentlicher Verkehr etwa gleich viel erreichen.',
    },
    table: { title: 'Übersichtstabelle' },
    th: {
      city: 'Stadt',
      cells: 'Zellen',
      population: 'Bevölkerung',
      medianCdi: 'Median',
      weightedCdi: 'Ø Einwohner',
      ptCells: 'ÖV-Zellen',
      carCells: 'Auto-Zellen',
      proximity: 'Med. Nähe',
      opportunity: 'Med. Chancen',
      inclusion: 'Inklusion',
      spatial: 'Räuml. Isol.',
      social: 'Soz. Isol.',
      total: 'Vollst. Isol.',
    },
    loading: 'Veröffentlichte Städte werden geladen…',
    empty: 'Diese Plattform hat noch keine Stadtübersichten veröffentlicht.',
    error: 'Die veröffentlichte Übersicht konnte nicht geladen werden.',
  },

  faq: {
    eyebrow: 'Häufige Fragen',
    headline: 'Häufige',
    headlineAccent: 'Fragen.',
    lede: 'Kurze Antworten auf das, was wir am häufigsten gefragt werden. Haben Sie eine andere Frage? Schreiben Sie an {email}.',
    meta: {
      updated: 'Zuletzt aktualisiert',
      updatedValue: 'Juli 2026',
      entries: 'Einträge',
      languages: 'Sprachen',
    },
    items: [
      {
        q: 'Was bedeutet „Erreichbarkeit“ im Atlas?',
        a: 'Drei messbare Dinge, bewusst getrennt gehalten. Nähe ist, was man in wenigen Minuten zu Fuß erreicht: Geschäfte, Schulen, Arztpraxen, Grünflächen. Chancen sind, was der öffentliche Verkehr in einem bestimmten Zeitbudget erreichbar macht: Arbeitsplätze, Universitäten, Krankenhäuser, Kulturorte. Wert ist die Qualität und Attraktivität des Erreichbaren; er gehört zum Ansatz, ist aber noch nicht quantifiziert, und nichts auf dieser Website behauptet, ihn zu messen.',
      },
      {
        q: 'Wie wird eine Zelle einer Zone zugeordnet?',
        a: 'Jede Zelle hat einen Nähe-Wert und einen Chancen-Wert. Eine Zelle gilt auf einer Achse als hoch, wenn sie über dem bevölkerungsgewichteten Median ihrer Stadt für diese Achse liegt; gewichtet, damit die Schwelle widerspiegelt, wo Menschen tatsächlich wohnen, und nicht die Geometrie des Netzes. Die zwei Ja/Nein-Antworten ergeben vier Zonen: Inklusion, räumliche Isolation, soziale Isolation, vollständige Isolation. Weil die Schwellen stadtspezifisch sind, vergleichen die Zonen Orte innerhalb einer Stadt, nicht zwischen Städten; zwischen Städten vergleichbar sind die zugrunde liegenden Werte.',
      },
      {
        q: 'Woher stammen die Daten?',
        a: 'Straßennetze und Orte von Interesse stammen aus OpenStreetMap. Gehzeiten werden auf diesen Netzen mit OSRM berechnet. Der öffentliche Verkehr nutzt die offenen GTFS-Fahrpläne der Verkehrsbetriebe, ausgewertet mit dem Connection Scan Algorithm statt mit einem mittleren Takt. Die Bevölkerung stammt aus den 100-m-Rastern von WorldPop, angepasst an UN-Schätzungen. Die Zellen sind H3-Sechsecke der Auflösung 9, etwa 200 m breit.',
      },
      {
        q: 'Warum ist meine Stadt falsch dargestellt?',
        a: 'Das kann gut sein. Die Messungen sind nur so gut wie ihre Eingangsdaten: ein in OpenStreetMap lückenhaft erfasstes Gebiet, ein veralteter GTFS-Feed, eine Linie, die nach dem Export eröffnet wurde, oder ein Angebot, das vorher eingestellt wurde. All das erzeugt eine Karte, die selbstsicher falsch ist, und die Karte allein kann das nicht erkennen. Wenn Sie eine Stadt kennen und etwas nicht stimmt, schreiben Sie uns, wo es bessere Daten gibt: einen aktuellen Feed, eine amtliche Quelle oder einfach, welcher Teil der Karte nicht der Wirklichkeit entspricht. So wird eine Stadt am schnellsten neu exportiert. Jeder veröffentlichte Datensatz ist herunterladbar, sodass sich ein Widerspruch prüfen statt nur behaupten lässt.',
      },
      {
        q: 'Warum fehlt meine Stadt?',
        a: 'Die Abdeckung ist durch Daten begrenzt, nicht durch Interesse: Eine Stadt braucht eine gute Erfassung in OpenStreetMap und einen brauchbaren öffentlichen GTFS-Feed. Die Vergleichsplattformen decken eine Reihe gut dokumentierter Untersuchungsstädte ab, statt eine weltweite Abdeckung anzustreben, denn ein schlecht spezifizierter Feed erzeugt Zahlen, die verlässlich aussehen und falsch sind. Wenn Ihre Stadt beides hat und fehlt, eröffnen Sie ein Issue auf GitHub.',
      },
      {
        q: 'Darf ich diese Arbeit zitieren?',
        a: 'Ja. Der Ansatz ist Bruno M., Campanelli B., Monteiro Melo H. P., Rossi Mori L. & Loreto V. (2026), “The dimensions of accessibility: proximity, opportunities, values”, EPJ Data Science 15:22, doi:10.1140/epjds/s13688-026-00623-8. Der Car Dependency Index ist Campanelli B., Marzolla F., Bruno M., Melo H. P. M. & Loreto V. (2026), “Car Dependency in Urban Accessibility”, arXiv:2604.01019. Die Seite Forschung führt beide zusammen mit den Datensätzen auf.',
      },
      {
        q: 'Ist der Atlas kostenlos?',
        a: 'Ja. Der Visualisierungscode steht unter der MIT-Lizenz, die veröffentlichten Daten unter CC BY-NC 4.0: Sie dürfen sie mit Quellenangabe für nicht kommerzielle Zwecke frei nutzen, teilen und bearbeiten. Kommerzielle Nutzung erfordert eine schriftliche Genehmigung. Die Artikel selbst sind Open Access unter CC BY 4.0.',
      },
    ],
  },

  about: {
    eyebrow: 'Nachhaltige Städte',
    headline: 'Eine Forschungslinie zu Städten,',
    headlineAccent: 'kein Produkt.',
    lede: 'Wir sind ein gemeinnütziges Forschungsteam, eine der Forschungslinien von Sony Computer Science Laboratories – Rom, und arbeiten mit Partnern an der Universität Sapienza in Rom, am Forschungszentrum Enrico Fermi (CREF) und an weiteren Instituten. Der Atlas ist eines der Ergebnisse dieser Arbeit.',
    labLink: 'Sony CSL ↗',
    teamLink: 'Das Team →',

    doTitle: 'Was wir tun',
    do: {
      measure: {
        tag: 'Messen',
        title: 'Wir messen, wozu eine Stadt Zugang gibt',
        desc: 'Nähe, Chancen und, wo es sich redlich machen lässt, den Wert des Erreichbaren, Zelle für Zelle berechnet aus offenen Daten zu Straßennetzen, Fahrplänen, Diensten und Bevölkerung.',
      },
      compare: {
        tag: 'Vergleichen',
        title: 'Wir machen Städte vergleichbar',
        desc: 'Jede Stadt wird auf dieselbe Weise gemessen, auf demselben Raster, mit denselben Skalen. Erst das gibt einer Zahl aus einer Stadt neben der Zahl aus einer anderen eine Bedeutung.',
      },
      publish: {
        tag: 'Veröffentlichen',
        title: 'Wir veröffentlichen Methode und Daten',
        desc: 'Begutachtete Artikel, herunterladbare Daten und offener Code. Eine Messung, die eine Planungsentscheidung begründet, sollte von den Menschen überprüft werden können, die diese Entscheidung trifft.',
      },
    },

    withTitle: 'Mit wem wir arbeiten',
    withBody:
      'Die Gruppe gehört zu Sony CSL Rom und ist in der gemeinsamen Initiative mit dem CREF angesiedelt; ihre Forschung entsteht mit Partnern an der Sapienza und anderen Universitäten und Instituten in Italien und im Ausland. Promovierende und Masterstudierende arbeiten im Rahmen dieser Zusammenarbeit am Atlas, nicht neben ihr.',
    withBody2:
      'Wir arbeiten auch mit Stadtverwaltungen, Forschungsgruppen und NGOs, meist weil jemand ein Argument über Erreichbarkeit mit Belegen untermauern muss. Wenn das auf Sie zutrifft, ist die Kontaktseite der richtige Ausgangspunkt.',

    projectsTitle: 'Weitere Projekte',
    projectsHint: 'über die vier Ebenen hinaus',
    projects: {
      whatif: {
        tag: 'Plattform',
        name: 'WhatIf',
        desc: 'Die modulare Plattform des Labors für Stadtsimulation, auf der auch die ursprünglichen Viewer von 15-minute city und CityChrone liegen.',
      },
      maps3d: {
        tag: 'Online-Karte',
        name: '3D-Karten',
        desc: 'Städtische Ungleichheit in drei Dimensionen gelesen: das Gewicht der Unterschiede einer Stadt, als Fläche gezeichnet.',
      },
      bikeLanes: {
        tag: 'Artikel',
        name: 'Radwegeplanung',
        desc: 'Netzoptimierung unter Berücksichtigung der Straßenbreite: wo ein Radnetz als Nächstes wachsen sollte, gegeben die Straßen, in die es passen muss.',
      },
    },
    labCta: 'Sony CSL besuchen',
  },

  citychat: {
    eyebrow: 'CityChat · Beta',
    headline: 'Frag den Atlas nach',
    headlineAccent: 'deiner Stadt.',
    lede: 'Frag, was eine Ebene bedeutet, wie eine Stadt im Vergleich dasteht oder wie es um einen Ort steht, und CityChat antwortet aus den veröffentlichten Daten. Es ist ein KI-Modell, das denselben Code aufrufen kann, mit dem die Karten laufen, und jede Zahl, die es nennt, wird mit dem abgeglichen, was dieser Code geliefert hat.',
    beta: 'Beta',
    persona: {
      label: 'Ich frage als',
      citizen: 'Bewohner·in',
      policy: 'Politik und Planung',
      research: 'Forschung',
      press: 'Journalist·in',
    },
    city: {
      label: 'Stadt',
      any: 'Beliebige Stadt',
    },
    suggestionsTitle: 'Frag zum Beispiel',
    suggestions: {
      citizen: [
        'Wie lange braucht man in {city} zu Fuß zu einer Arztpraxis?',
        'Kommt man in {city} leichter mit dem Auto oder mit dem ÖPNV voran?',
        'Was bedeutet die Farbe einer Zelle in der Ebene der 15-Minuten-Stadt?',
      ],
      policy: [
        'Wo in {city} leben viele Menschen mit schlechtem Zugang zu Versorgung?',
        'Wie steht {city} beim Autoabhängigkeitsindex im Vergleich zu den anderen Städten da?',
        'Welcher Anteil der Bewohner von {city} lebt in vollständiger Isolation, und was heißt das?',
      ],
      research: [
        'Wie werden die Schwellenwerte der P.O.V.-Zonen berechnet?',
        'Was ist in {city} der Unterschied zwischen Zellanteilen und Bewohneranteilen?',
        'Wie verändert sich die ÖPNV-Geschwindigkeit in {city} im Tagesverlauf?',
      ],
      press: [
        'Welche veröffentlichte Stadt ist für ihre durchschnittlichen Bewohner am wenigsten autoabhängig?',
        'Was wäre eine faire Zusammenfassung der Erreichbarkeit in {city} in einem Satz?',
        'Wie wäre es irreführend, diese Zahlen zu berichten?',
      ],
    },
    placeholder: 'Frag nach einer Ebene, einer Stadt oder einem Ort…',
    send: 'Senden',
    stop: 'Stopp',
    reset: 'Neues Gespräch',
    you: 'Du',
    assistant: 'CityChat',
    working: 'Lese die Daten…',
    answeredBy: 'Antwort von {model}',
    switching: '{model} übernimmt…',
    writing: 'Schreibe die Antwort…',
    verifying: 'Zahlen werden geprüft',
    checking: 'Prüfe die Zahlen…',
    consulted: 'Berechnet aus',
    showOnMap: 'Auf der Karte zeigen',
    cell: 'Zelle',
    unverified: 'Diese Zahlen lassen sich nicht auf die Daten zurückführen und könnten falsch sein: {list}.',
    tools: {
      list_cities: 'veröffentlichte Städte',
      city_overview: 'Stadtüberblick',
      layer_detail: 'Ebenendetail',
      rank_cells: 'Zellen-Rangfolge',
      cell_at: 'eine Zelle',
      compare_cities: 'Städtevergleich',
    },
    status: {
      checking: 'Verbinde mit dem Dienst…',
      online: 'Modell: {provider}',
      reserve: '(+{count} in Reserve)',
      offline: 'Der CityChat-Dienst ist von dieser Kopie der Website aus nicht erreichbar.',
      disabled: 'CityChat ist auf dieser Kopie der Website nicht aktiviert.',
    },
    errors: {
      unavailable: 'Der CityChat-Dienst ist gerade nicht erreichbar.',
      rate_limited: 'Zu viele Fragen in kurzer Zeit. Versuch es in ein paar Minuten noch einmal.',
      busy: 'CityChat ist ausgelastet. Versuch es gleich noch einmal.',
      too_long: 'Dieses Gespräch ist zu lang. Beginne ein neues.',
      provider: 'Das Modell konnte nicht antworten. Formuliere die Frage um oder stell sie noch einmal.',
      quota: 'Alle Modelle haben ihr kostenloses Kontingent gerade aufgebraucht. Versuch es in ein, zwei Minuten noch einmal.',
      too_many_steps: 'Die Frage brauchte zu viele Schritte. Versuch eine engere.',
    },
    disclaimer: 'Experimentell. Die Antworten schreibt ein KI-Modell, und sie können falsch sein: Die Zahlen werden aus den veröffentlichten Daten berechnet, die Worte darum herum nicht. Fragen werden an den Anbieter des Modells gesendet; gib keine persönlichen Daten ein.',
  },

  stats: {
    eyebrow: 'Statistik',
    headline: 'Städte',
    headlineAccent: 'vergleichen.',
    lede: 'Ein Bildschirm für alle veröffentlichten Städte in allen Maßen (Nähe, Chancen, Autoabhängigkeit, Zonenmischung), nebeneinander und sortierbar.',
    emptyTitle: 'Noch nicht verfügbar',
    emptyBody:
      'Hier werden Städte über alle vier Ebenen zugleich verglichen werden. Der Reiter bleibt bewusst leer, bis er das redlich leisten kann: Eine Seite mit plausibel wirkenden Zahlen wäre schlechter als eine Seite, die sagt, dass es keine gibt. Was schon existiert, steht unten.',
    availableTitle: 'Was sich heute vergleichen lässt',
    availableHint: 'jeweils eine Plattform',
    compare: {
      fifteen: 'Alle Städte, die diese Plattform veröffentlicht hat, nebeneinander.',
      citychrone: 'Alle Städte, die diese Plattform veröffentlicht hat, nebeneinander.',
      cardep:
        'Alle 22 Städte nach dem Index ihrer durchschnittlichen Einwohnerschaft geordnet, mit der Verteilung der Einwohner entlang des Index.',
      pov: 'Alle 18 Städte nach ihrer Mischung der vier Zonen, gezählt nach Zellen oder Einwohnern, mit den Werten, aus denen sie sich ergibt.',
    },
  },

  consulting: {
    eyebrow: 'Beratung',
    headline: 'Sie arbeiten an einer Stadt?',
    headlineAccent: 'Sprechen wir darüber.',
    lede: 'Wenn Sie eine öffentliche Verwaltung, eine Behörde oder ein Unternehmen sind und Erreichbarkeit messen müssen (für einen Plan, ein Angebot, eine Investition oder eine Evaluation), können Sie uns ansprechen. Nennen Sie uns Ihre Frage, und wir sagen Ihnen offen, ob unsere Methoden sie beantworten können.',
    cta: 'Schreiben Sie uns',
    whoTitle: 'Für wen',
    who: {
      policy: {
        tag: 'Öffentlicher Sektor',
        title: 'Politik und Verwaltung',
        desc: 'Städte, Regionen, Verkehrsverbünde und Behörden, die entscheiden müssen, wohin eine Linie, ein Angebot oder eine Einrichtung kommt, und vorher wissen müssen, wen sie tatsächlich erreichen würde.',
      },
      company: {
        tag: 'Privatwirtschaft',
        title: 'Unternehmen',
        desc: 'Organisationen, deren Entscheidungen davon abhängen, wie eine Stadt erreichbar ist: Standortwahl, Angebotsgestaltung, Mobilität oder die Datengrundlage für einen Bericht, der einer genauen Prüfung standhalten muss.',
      },
    },
    note:
      'Ein Hinweis zur Lizenz: Die veröffentlichten Daten stehen unter CC BY-NC 4.0, kommerzielle Nutzung erfordert daher eine schriftliche Genehmigung. Das ist der Beginn eines Gesprächs, keine Absage, und die Adresse ist in beiden Fällen dieselbe.',
  },

  contact: {
    eyebrow: 'Kontakt und Zusammenarbeit',
    headline: 'Rom, Italien.',
    headlineAccent: 'Offen für Zusammenarbeit.',
    lede: 'Wir arbeiten mit Stadtverwaltungen, Forschungsgruppen, NGOs und allen, die ein Argument über Erreichbarkeit mit Belegen untermauern wollen. Wenn Ihre Stadt in den Atlas gehört, wenn Sie die Karten in einem Artikel verwenden möchten oder wenn Ihnen hier etwas falsch erscheint, schreiben Sie uns.',
    fields: {
      address: 'Adresse',
      general: 'Allgemein',
      code: 'Code',
      phone: 'Telefon',
    },
    addressValue:
      'Sony Computer Science Laboratories, Rome\nJoint Initiative CREF-SONY\nCentro Studi e Ricerche “Enrico Fermi” – CREF\nVia Panisperna, 89/a\n00184 Roma\nEingang: Piazza del Viminale, 1, Roma',
    teamTitle: 'Das Team',
    roles: {
      director: 'Projektleitung und Direktor',
      assistant: 'Wissenschaftliche Assistenz',
      staffResearcherM: 'Wissenschaftler',
      staffResearcherF: 'Wissenschaftlerin',
      consultantM: 'Berater und Wissenschaftler',
      consultantF: 'Beraterin und Wissenschaftlerin',
      sapienzaResearcherM: 'Wissenschaftler, Sapienza',
      sapienzaResearcherF: 'Wissenschaftlerin, Sapienza',
      sapienzaPhdM: 'Doktorand, Sapienza',
      sapienzaPhdF: 'Doktorandin, Sapienza',
      visitingPhdM: 'Gastdoktorand',
      visitingPhdF: 'Gastdoktorandin',
      communications: 'Senior-Leitung Unternehmenskommunikation und Veranstaltungen',
      developerM: 'Full-Stack-Softwareentwickler',
      developerF: 'Full-Stack-Softwareentwicklerin',
      admin: 'Senior-Verwaltung',
      phdM: 'Doktorand',
      phdF: 'Doktorandin',
      masterM: 'Masterstudent',
      masterF: 'Masterstudentin',
      researcherM: 'Wissenschaftler',
      researcherF: 'Wissenschaftlerin',
      visitingResearcherM: 'Gastwissenschaftler',
      visitingResearcherF: 'Gastwissenschaftlerin',
      hiring: 'Arbeiten Sie mit uns',
    },
    joinName: 'Sie?',
    formerTitle: 'Ehemalige',
  },

  research: {
    eyebrow: 'Forschungsergebnisse',
    headline: 'Artikel, Daten',
    headlineAccent: 'und Code.',
    lede: 'Die Methoden hinter dem Atlas sind veröffentlicht, die Daten herunterladbar. Plattformen, deren Artikel noch in Vorbereitung ist, sind als solche gekennzeichnet: Die Karten werden gezeigt, das Zitat wird nicht erfunden.',
    papersTag: '01',
    papersTitle: 'Artikel',
    papersHint: 'begutachtet und Preprints',
    datasetsTag: '02',
    datasetsTitle: 'Daten und Code',
    datasetsHint: 'CC BY-NC 4.0 · MIT',
    citeTitle: 'Den Atlas zitieren',
    inPreparation: 'In Vorbereitung',
    preprint: 'Preprint',
    columns: { dataset: 'Datensatz', coverage: 'Abdeckung', format: 'Format', licence: 'Lizenz' },
  },

  blog: {
    eyebrow: 'Blog',
    headline: 'Notizen',
    headlineAccent: 'aus dem Atlas.',
    lede: 'Längere Texte darüber, was wir messen, wie wir es messen und was die Karten zeigen und was nicht. Die Beiträge sind auf Englisch und Italienisch.',
    readingTime: '{count} Min. Lesezeit',
    backToBlog: '← Alle Beiträge',
    published: 'Veröffentlicht',
    postsLabel: 'Beiträge',
  },

  work: {
    eyebrow: 'Mit uns arbeiten',
    headline: 'Derzeit keine',
    headlineAccent: 'offenen Stellen.',
    lede: 'Wir besetzen im Moment keine finanzierte Stelle. Wir freuen uns aber immer, von Studierenden zu hören, die ernsthaft zur städtischen Erreichbarkeit arbeiten möchten, und solche Gespräche beginnen meist lange bevor es eine Stelle gibt.',
    openTitle: 'Was offen ist',
    positionsTitle: 'Aktuelle Stellen',
    noPositions: 'Derzeit sind keine finanzierten Stellen offen.',
    noPositionsDetail:
      'Wenn eine Stelle frei wird, wird sie hier und auf der Karriereseite von Sony CSL ausgeschrieben. Es gibt keine Warteliste, und Initiativbewerbungen für nicht existierende Stellen werden nicht aufbewahrt.',
    routes: {
      phd: {
        title: 'Promotion',
        desc: 'Wir betreuen Promotionen gemeinsam mit Universitäten in Italien und im Ausland, meist zur Messung von Erreichbarkeit, zur Analyse von Verkehrsnetzen oder zur statistischen Physik von Städten. Die Finanzierung läuft in der Regel über das Promotionsprogramm der aufnehmenden Universität und nicht über uns, daher sollte das Gespräch einige Monate vor dessen Fristen beginnen.',
      },
      thesis: {
        title: 'Masterarbeiten',
        desc: 'Wir betreuen Masterarbeiten zu einem klar umrissenen Teil des Atlas: eine neue Stadt, ein Methodenvergleich, die Validierung eines der Indizes mit unabhängigen Daten. Rechnen Sie mit etwa sechs Monaten, echten Daten und einem Ergebnis, das veröffentlicht wird, wenn es trägt.',
      },
      internship: {
        title: 'Praktika',
        desc: 'Kürzere, fokussierte Aufenthalte, meist drei bis sechs Monate: Datenpipelines, Geodatenverarbeitung oder Frontend-Entwicklung an diesen Plattformen. Hilfreich sind Kenntnisse in Python und Geodatenwerkzeugen oder in modernem JavaScript und Kartendarstellung.',
      },
    },
    howTitle: 'So nehmen Sie Kontakt auf',
    howBody:
      'Schreiben Sie an {email} mit einer kurzen Beschreibung, woran Sie arbeiten möchten und warum, einem Lebenslauf und, falls vorhanden, einem Link zu etwas, das Sie gebaut oder geschrieben haben. Ein konkreter Vorschlag, der an einem Artikel oder einer Plattform ansetzt, ist weit mehr wert als eine allgemeine Interessensbekundung.',
    expectTitle: 'Was Sie erwarten können',
    expectBody:
      'Wir lesen alles und antworten auf Vorschläge, die wir aufgreifen können. Wir sind ein kleines Team und können nicht jede Nachricht ausführlich kommentieren; eine späte Antwort ist kein Urteil über Ihre Bewerbung.',
    cta: 'Schreiben Sie uns',
  },

  footer: {
    description:
      'Offene Forschung zur städtischen Erreichbarkeit vom Team Nachhaltige Städte bei Sony CSL – Rom. Methoden, Karten und Daten, veröffentlicht und frei nachnutzbar.',
    platforms: 'Plattform',
    research: 'Forschung',
    researchLinks: ['Artikel', 'Daten', 'Blog', 'FAQ'],
    about: 'Über uns',
    aboutLinks: ['Nachhaltige Städte', 'Team', 'Kontakt', 'Beratung', 'Mit uns arbeiten'],
    touch: 'In Verbindung bleiben',
    touchLinks: ['GitHub', 'Newsletter'],
    workCta: 'Mit uns arbeiten →',
    copyright: '© 2026 Sony Computer Science Laboratories · Rom',
    version: 'Code MIT · Daten CC BY-NC 4.0',
  },

  notFound: {
    eyebrow: 'Fehler 404',
    headline: 'Nicht auf',
    headlineAccent: 'der Karte.',
    lede: 'Diese Seite gehört nicht zum Atlas. Versuchen Sie es mit den Plattformen oder kehren Sie zur Startseite zurück.',
    cta: 'Zurück zum Atlas',
  },
};
