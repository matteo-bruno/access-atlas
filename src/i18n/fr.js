// French copy (France). Mirrors the shape of en.js; `test:data` checks it.
// Register: vous. French typography: a narrow no-break space before ? ! : ;
// and inside « », so a line never wraps leaving the mark alone. Names of the
// Atlas, its platforms and datasets, the postal address and citations stay as
// published. Blog posts have no French version and fall back to English.

export default {
  meta: {
    locale: 'fr-FR',
    name: 'Français',
  },

  nav: {
    title: 'Accessibility Atlas',
    tagline: 'Sony CSL · Rome — Villes durables',
    atlas: 'Accueil',
    platforms: 'Atlas',
    citychat: 'CityChat',
    stats: 'Statistiques',
    about: 'Villes durables',
    consulting: 'Conseil',
    research: 'Recherche',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contact',
    github: 'GitHub',
    skipToContent: 'Aller au contenu',
    openMenu: 'Ouvrir le menu',
    language: 'Langue',
  },

  home: {
    hero: {
      eyebrow: 'Plateformes de recherche ouvertes · Sony CSL Rome',
      title: 'Accessibility',
      titleAccent: 'Atlas',
      subtitle: 'Cartographier l’accès urbain, ville par ville.',
      headline: 'Un atlas pour mesurer',
      headlineAccent: 'l’accès des villes.',
      lede: 'Qu’est-ce qui est à portée de main dans une ville ? Mesurez la {proximity} : les services du quotidien accessibles à pied. Mesurez l’{opportunity} : ce que les transports en commun permettent d’atteindre en un temps donné. Mesurez la {cardep} : à quel point la voiture est nécessaire pour accéder aux opportunités de la ville. Découvrez comment l’accès propage les inégalités.',
      ledeProximity: 'proximité',
      ledeOpportunity: 'opportunité',
      ledeCardep: 'dépendance à la voiture',
      ctaPrimary: 'Explorer la plateforme',
      ctaSecondary: 'Lire l’article fondateur ↗',
    },
    news: {
      title: 'Nouvelles du laboratoire',
      kinds: { paper: 'Article', release: 'Version', data: 'Données' },
      items: {
        pov: 'The dimensions of accessibility — EPJ Data Science',
        cdi: 'Car Dependency Index : {count} villes publiées',
        atlas: 'Vue combinée : Milan publiée sur une grille unique, avec les quatre plateformes',
      },
      dates: { pov: 'avr. 2026', cdi: 'févr. 2026', atlas: 'août 2026' },
    },
    landing: {
      mapLabel: 'Toutes les villes publiées par l’Atlas',
      by: 'Un projet de Sony CSL · Rome',
    },
    premise: {
      lines: [
        'Les villes sont des lieux d’opportunités.',
        'L’accès aux opportunités réduit les inégalités.',
        'Un accès inégal crée des sociétés inégales.',
      ],
    },
    metrics: {
      cities: 'Villes publiées',
      platforms: 'Plateformes',
      countries: 'Pays',
      cells: 'Cellules hexagonales',
      researchers: 'Chercheurs',
    },
    platforms: {
      title: 'Couches d’accessibilité',
      more: 'En savoir plus',
      cityCount: '{count} villes',
      themes: {
        fifteen: 'Proximité',
        citychrone: 'Opportunité',
        cardep: 'Comparaison',
        pov: 'Synthèse',
      },
      desc: {
        fifteen:
          'Temps à pied et à vélo vers dix catégories de services du quotidien, lu au regard de la référence des 15 minutes.',
        citychrone:
          'Une géographie des temps de trajet : la ville redessinée pour que la distance se mesure en minutes de transports en commun.',
        cardep:
          'De combien l’accès aux opportunités en voiture dépasse l’accès en transports en commun, cellule par cellule.',
        pov: 'La proximité croisée avec l’opportunité, pour diviser la ville en quatre zones d’accès.',
      },
    },
    table: {
      title: 'Comparer les villes',
      statsNote:
        'Six villes sur trois mesures, issues des données P.O.V. L’écran qui compare toutes les villes publiées, sur toutes les mesures, est l’onglet Statistiques.',
      statsCta: 'Ouvrir Statistiques',
      headers: {
        city: 'Ville',
        proximity: 'Score médian de proximité',
        opportunity: 'Score médian d’opportunité',
        inclusion: 'Zone d’inclusion',
      },
      note: 'La proximité et l’opportunité sont des décomptes pondérés de points d’intérêt accessibles, comparables d’une ville à l’autre parce que chaque ville est mesurée de la même façon. L’inclusion est la part des cellules situées au-dessus des deux médianes pondérées par la population.',
    },
    side: {
      title: 'Travaux en cours',
      kinds: { live: 'En ligne', paper: 'Article' },
      items: {
        shade: {
          name: 'Le droit à l’ombre',
          desc: 'L’ombre comme infrastructure : qui peut traverser une ville en été sans marcher au soleil, et qui ne le peut pas.',
        },
        weight: {
          name: 'Le poids des inégalités urbaines',
          desc: 'Les inégalités d’accès lues en trois dimensions, ville par ville, comme une surface plutôt que comme un tableau.',
        },
        odMatrices: {
          name: 'Matrices OD à partir de données GPS',
          desc: 'Des flux origine-destination reconstitués à partir de traces GPS, pour mesurer les déplacements que les gens font réellement face à ceux que le réseau rend possibles.',
        },
        bikeLanes: {
          name: 'Planification des pistes cyclables',
          desc: 'Où le réseau cyclable devrait s’étendre, compte tenu de la largeur des rues qui doivent l’accueillir et des liaisons qu’il créerait.',
        },
        co2: {
          name: 'Émissions de CO₂ des transports',
          desc: 'Le coût en émissions de la forme urbaine : combien de carbone dépense la mobilité d’une ville, et combien la proximité change ce chiffre.',
        },
        quality: {
          name: 'L’inégalité de la qualité',
          desc: 'La troisième dimension du cadre : non pas combien est accessible, mais à quel point c’est bien, et si la qualité est aussi inégalement répartie que l’accès.',
        },
      },
    },
  },

  platform: {
    search: 'Rechercher votre ville…',
    searchHint: '⌘K',
    paper: 'Article ↗',
    welcome: 'Bienvenue sur {name}',
    dismiss: 'Fermer',
    ctaMap: 'Cliquez sur une ville de la carte',
    learnMore: 'En savoir plus →',
    attribution: 'Fond de carte : Natural Earth · Données © Sony CSL Rome · CC BY-NC 4.0',
    cityCount: '{count} villes',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    loading: 'Chargement de la couverture…',
    empty: 'Aucune ville ne correspond à cette recherche.',
    seeded: 'Valeurs illustratives : les mesures de cette plateforme ne sont pas encore publiées.',

    all: {
      name: 'Toutes les couches',
      welcome: 'Bienvenue sur l’Accessibility Atlas',
      label: 'Couverture publiée',
      pick: 'Choisir une carte',
      intro:
        'Toutes les villes publiées par l’Atlas, sur les quatre plateformes. Chaque plateforme mesure quelque chose de différent et couvre un ensemble de villes différent : choisissez-en une pour voir sa propre carte, son échelle et les villes qu’elle couvre. Plus une ville est foncée, plus elle a de mesures publiées parmi les quatre.',
      legendUnit: 'Plateformes publiées',
      legend: ['Une', 'Deux', 'Trois', 'Les quatre'],
      covered: '{count} plateformes sur 4',
    },

    fifteen: {
      label: 'Accès de proximité',
      intro:
        'Temps de trajet à pied et à vélo vers dix catégories de services du quotidien (santé, éducation, courses, restauration, culture, espaces extérieurs, activité physique, services, mobilité), calculé pour chaque cellule de la ville et lu au regard de la référence des 15 minutes.',
      legendUnit: 'Temps moyen jusqu’aux services',
      legend: ['0–3 min', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24', '24–30'],
    },
    citychrone: {
      label: 'Accès aux opportunités',
      intro:
        'CityChrone remplace la distance métrique par le temps de trajet : la carte se déforme pour que deux lieux se rapprochent quand les transports en commun les relient rapidement, aussi éloignés soient-ils sur le terrain.',
      legendUnit: 'Score de vitesse',
      legend: ['Lent', 'Moyen', 'Rapide'],
    },
    cardep: {
      label: 'Voiture ou transports en commun',
      intro:
        'Le Car Dependency Index compare les opportunités accessibles en voiture à celles accessibles en transports en commun dans le même temps : CDI = (O_voiture − O_TC) / (O_voiture + O_TC). Il va de −1, où les transports en commun atteignent davantage, à +1, où la voiture atteint tout et les transports en commun presque rien, en passant par 0, où les deux s’équilibrent.',
      legendUnit: 'Car Dependency Index',
      legend: ['Favorable aux transports en commun', 'Équilibré', 'Dépendant de la voiture', 'Très dépendant de la voiture'],
    },
    pov: {
      label: 'Proximité · Opportunité · Valeur',
      intro:
        'Chaque cellule reçoit un score sur deux axes (la proximité, les services du quotidien accessibles à pied, et l’opportunité, les destinations à l’échelle de la ville accessibles en transports en commun), puis elle est classée par rapport à la médiane de la ville pondérée par la population sur chaque axe. Un troisième axe, la valeur de ce qui est accessible, est posé dans le cadre théorique mais pas encore quantifié.',
      legendUnit: 'Zone',
      legend: ['Inclusion', 'Isolement spatial', 'Isolement social', 'Isolement total'],
    },
  },

  fifteen: {
    mapTitle: 'Temps de trajet jusqu’aux services',
    minutes: 'min',
    barsTitle: 'Toutes les catégories, depuis cette cellule',
    barsAxis: 'Les barres vont jusqu’à {max} {unit} ; au-delà, elles sont pleines.',
    legendValue: 'Temps de proximité',
    statusHint:
      'Choisissez un mode et une catégorie · survolez une tranche de la légende pour l’isoler · faites défiler et glissez pour naviguer',
    controls: {
      mode: 'Mode',
      category: 'Catégorie de services',
    },
    modes: { foot: 'À pied', bike: 'À vélo' },
    hint: 'Temps de trajet moyen depuis chaque cellule jusqu’aux services les plus proches de cette catégorie.',
    summary: { median: 'Temps de trajet médian' },
    categories: {
      average: 'Moyenne de tous les services',
      outdoor: 'Activités de plein air',
      learning: 'Éducation',
      supplies: 'Courses',
      eating: 'Restauration',
      moving: 'Mobilité',
      cultural: 'Activités culturelles',
      exercise: 'Activité physique',
      services: 'Services',
      healthcare: 'Santé',
    },
  },

  atlas: {
    label: 'Vue combinée',
    mapTitle: 'Mesuré par {name}',
    controls: {
      layer: 'Visualisation',
      view: 'Mesure',
      hour: 'Heure de la journée',
      opacity: 'Opacité de la couche',
    },
    info: 'À propos de cette couche',
    hidePanel: 'Masquer les commandes',
    showPanel: 'Commandes',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',
    population: {
      name: 'Population',
      legend: 'Habitants par cellule',
      tooltip: '{count} habitants',
      about:
        'Habitants par cellule, d’après l’export de 15-minute city, sur une échelle de couleurs logarithmique : la population est très asymétrique, et une échelle linéaire placerait presque toutes les cellules dans la couleur la plus claire. C’est le contexte dans lequel lire les quatre autres mesures : un même trajet compte davantage là où plus de gens le font.',
    },
    beyond: {
      fifteen: 'jusqu’au noir à partir de 120 min',
      isochrone: 'jusqu’au noir à 180 min, le maximum publié',
    },
    views: {
      velocity: 'Vitesse',
      sociality: 'Socialité',
      isochrone: 'Isochrones',
    },
    viewHint: {
      velocity:
        'À quelle vitesse les transports en commun vous éloignent de chaque cellule à cette heure : un score proche de km/h.',
      sociality:
        'Combien de personnes les transports en commun mettent à portée de chaque cellule à cette heure : un score, pas un nombre de personnes.',
      isochrone: 'Temps de trajet en transports en commun depuis une cellule choisie vers toutes les autres.',
    },
    legend: {
      velocity: 'Score de vitesse (km/h)',
      sociality: 'Score de socialité',
      isochrone: 'Minutes depuis la cellule sélectionnée',
    },
    summary: { weightedV: 'Vitesse pour l’habitant moyen' },
    mistake: {
      title: 'Vous avez repéré une erreur ?',
      body: 'Les erreurs arrivent ! Des données peuvent manquer ou induire en erreur. {contact} si vous savez comment la corriger.',
      contact: 'Écrivez-nous',
    },
    osmUpdate: 'Dernière mise à jour OpenStreetMap : {date}',
    layerCells: 'Cellules mesurées par {name}',
    isochroneEmpty: 'Cliquez sur une cellule pour afficher les temps de trajet depuis celle-ci',
    unavailable: 'Non publié',
    noValue: 'Non mesuré pour cette cellule',
    openPlatform: 'Page {name}',
    statusHint:
      'Une grille, quatre mesures : changer de couche repeint les mêmes cellules · faites défiler et glissez pour naviguer',
    legacyHint:
      'Cette ville n’est pas encore exportée sur la grille commune : chaque visualisation charge le maillage de sa propre plateforme.',
    error: 'Le maillage publié n’a pas pu être chargé.',
  },

  city: {
    region: '{region} · {count} cellules',
    worldMap: 'Carte du monde',
    compare: 'Comparer les villes',
    zoneType: 'Zone',
    cdiHint:
      'Négatif là où les transports en commun atteignent davantage que la voiture, positif là où la voiture atteint davantage. L’indice est une différence normalisée bornée à ±1, pas un rapport.',
    zones: {
      inclusion: {
        name: 'Inclusion',
        desc: 'Au-dessus de la médiane sur les deux axes : bien desservie localement et reliée à toute la ville',
      },
      spatial: {
        name: 'Isolement spatial',
        desc: 'Des services à proximité, mais une faible desserte vers le reste de la ville',
      },
      social: {
        name: 'Isolement social',
        desc: 'Une bonne desserte, mais peu de services accessibles à pied',
      },
      total: {
        name: 'Isolement total',
        desc: 'En dessous de la médiane sur les deux axes : le plus souvent la périphérie',
      },
    },
    summary: {
      title: 'Synthèse de la ville',
      hexagons: 'Cellules',
      area: 'Surface couverte',
      proximity: 'Score médian de proximité',
      medianCdi: 'CDI médian (par cellule)',
      weightedCdi: 'CDI de l’habitant moyen',
      opportunity: 'Score médian d’opportunité',
      population: 'Population couverte',
    },
    filter: {
      title: 'Filtrer par indice',
      reset: 'Réinitialiser',
      about: 'Restreint la carte et le nuage de points aux cellules dont l’indice se situe entre les deux curseurs. Le reste demeure sur la carte, atténué : un filtre est ici une façon de regarder, pas l’affirmation que le reste manque. Les chiffres de la synthèse ne changent pas : ils décrivent la ville entière.',
      showing: '{count} cellules sur {total}',
    },
    selected: {
      title: 'Cellule sélectionnée',
      empty: 'Cliquez sur une cellule, sur la carte ou dans le nuage de points, pour lire tout ce qui a été mesuré pour elle.',
      clear: 'Désélectionner',
    },
    cell: {
      zone: 'Zone',
      proximity: 'Score de proximité',
      opportunity: 'Score d’opportunité',
      cdi: 'Car Dependency Index',
      byCar: 'Accessible en voiture',
      byTransit: 'Accessible en transports en commun',
      population: 'Habitants',
      thresholdProximity: 'Seuil de zone, proximité',
      thresholdOpportunity: 'Seuil de zone, opportunité',
      time: 'Temps de trajet',
      velocity: 'Score de vitesse',
      sociality: 'Score de socialité',
      grid: 'Cellule H3',
    },
    explain: {
      map: {
        pov: 'Chaque cellule prend la couleur de la zone où elle se trouve : vert au-dessus de la médiane sur les deux axes, rouge en dessous sur les deux, et entre les deux les deux cas mixtes. Les seuils sont les médianes de cette ville pondérées par la population : une zone compare donc des lieux au sein d’une même ville, jamais une ville à une autre. Ce sont les scores sous-jacents qui se comparent d’une ville à l’autre.',
        cardep: 'Bleu là où les transports en commun atteignent plus d’opportunités que la voiture, blanc là où les deux s’équilibrent, rouge là où la voiture en atteint davantage. L’échelle est la même pour toutes les villes au lieu d’être ajustée à chacune : une même couleur correspond partout au même indice, et aucune ville n’est recolorée pour remplir la palette.',
        fifteen: 'Les cellules sont colorées selon le temps nécessaire pour atteindre la catégorie choisie avec le mode choisi. Le blanc correspond à 15 minutes, la référence qui donne son nom à la plateforme, et l’échelle continue de foncer au-delà de 30 jusqu’au noir à 120. La légende nomme cette queue au lieu de s’étirer jusqu’à elle, ce qui écraserait l’intervalle où se trouve presque chaque cellule. Une seule échelle vaut pour les dix catégories et les deux modes : une couleur signifie la même chose quelle que soit la sélection.',
      },
      summary: {
        pov: '« Cellules » compte celles que couvre le jeu de données publié. Chaque médiane est le score de la cellule médiane : des décomptes pondérés de points d’intérêt accessibles, d’où l’absence d’unité. Ce ne sont ni des mètres ni des emplois. La population est la somme du jeu de données sur ses cellules, et non un chiffre officiel de la ville.',
        cardep: 'Le CDI médian est l’indice de la cellule médiane. Le CDI de l’habitant moyen pondère chaque cellule par le nombre de personnes qui y vivent ; c’est le chiffre sur lequel la plateforme classe les villes. La moitié des cellules d’une ville peut dépendre de la voiture alors que la plupart de ses habitants vivent dans l’autre moitié.',
        fifteen: 'La médiane est le temps de la cellule médiane pour la catégorie et le mode affichés. Elle décrit des cellules, pas des habitants : chaque cellule compte une fois, quel que soit le nombre de personnes qui y vivent. La population est la somme du jeu de données.',
        atlas: 'Les chiffres sont recalculés pour la couche affichée. « Cellules » désigne le maillage union, c’est-à-dire toutes les cellules mesurées par au moins une plateforme : une couche qui en couvre moins l’indique sur sa propre ligne.',
      },
      more: 'Explication complète',
      platformSite: 'Le site de {name}',
      aboutTitle: 'À propos de {name}',
      sections: {
        measure: 'Ce qui est mesuré',
        map: 'Lire la carte',
        geometry: 'Les deux géométries',
        summary: 'Les chiffres du panneau',
        source: 'D’où cela vient',
      },
      methodsTitle: 'Données et méthodes',
      methods: {
        pov: 'Cellules H3 de résolution 9, d’environ 200 m de large. Temps de marche calculés avec OSRM sur OpenStreetMap ; transports en commun à partir des horaires GTFS avec le Connection Scan Algorithm ; points d’intérêt issus d’OpenStreetMap ; population issue des grilles WorldPop à 100 m, ajustées aux estimations de l’ONU.',
        cardep: 'Cellules H3 de résolution 9, d’environ 200 m de large. Temps en voiture et à pied calculés avec OSRM sur OpenStreetMap, avec une marge pour le stationnement et des retards de circulation propres à chaque ville côté voiture ; transports en commun à partir des horaires GTFS avec le Connection Scan Algorithm ; points d’intérêt issus d’OpenStreetMap ; population issue de WorldPop.',
        fifteen: 'Cellules H3 de résolution 9. Temps à pied et à vélo calculés avec OSRM sur OpenStreetMap ; services issus d’OpenStreetMap, regroupés dans les dix catégories du sélecteur ; population issue de WorldPop.',
        citychrone: 'Cellules H3 de résolution 9, un export par heure de la journée. Transports en commun à partir des horaires GTFS ; les deux scores et les isochrones sont définis dans l’article de la plateforme. Les temps de trajet sont publiés en minutes entières, plafonnés à 180.',
      },
      paperNote: 'La méthode est exposée en détail dans l’article.',
    },
    geometry: {
      label: 'Géométrie',
      map: 'Carte',
      cartogram: 'Cartogramme',
      mapTitle: 'Carte · les cellules à leur place',
      mapCaption: 'L’aire de la cellule est le terrain qu’elle couvre',
      cartogramCaption: 'L’aire de la cellule est sa population résidente',
      loading: 'Chargement de l’autre géométrie…',
      unavailable: 'Aucun cartogramme publié',
      about: {
        map: 'Chaque cellule est l’hexagone qu’elle occupe sur le terrain, de la même taille partout, quoi qu’elle contienne. L’aire ne dit rien du nombre de personnes concernées par une mesure : une frange peu peuplée de la ville occupe donc autant de place dans l’image que le centre dense.',
        cartogram: 'Chaque cellule reste à sa vraie place, mais son aire représente sa population résidente et non le terrain qu’elle couvre : une cellule peu habitée se réduit à une fraction d’hexagone, une cellule très peuplée le remplit. Elle répond à une autre question : non pas où une mesure est faible, mais pour combien de personnes elle l’est.',
        derived: 'Ce cartogramme est propre à l’Atlas : {name} n’en publie pas. L’aire y est donc proportionnelle à la population résidente de la cellule, et atteint l’hexagone entier à la population médiane des cellules habitées de la ville. La règle est calibrée sur les cartogrammes que les autres plateformes publient pour la même ville, et les reproduit à environ 12 m près sur une cellule de 200 m : une cellule d’une population donnée a ainsi la même taille quelle que soit la couche affichée.',
        missing: 'Un cartogramme est une disposition calculée par ses auteurs, pas une transformation de la carte : l’Atlas dessine donc celui que chaque plateforme a publié au lieu d’en dériver un. {name} n’en publie pas.',
      },
    },
    cartogram: {
      title: 'Cartogramme · aire de la cellule ∝ population',
      caption: 'Résolution H3 {res} · cellules de ~{size} m',
      captionSize: 'cellules de ~{size} m',
    },
    scatterCdi: {
      title: 'Opportunités en voiture et en transports en commun',
      xAxis: 'Accessible en voiture →',
      yAxis: 'Accessible en transports en commun →',
      diagonal: 'portée égale',
    },
    scatter: {
      title: 'Proximité et opportunité',
      xAxis: 'Score d’opportunité →',
      yAxis: 'Score de proximité →',
    },
    statusHint:
      'Survolez ou cliquez une cellule ou un point pour les mettre en évidence · faites défiler et glissez pour naviguer',
    computing: 'Chargement du maillage…',
    seeded:
      'Maillage illustratif : les mesures de cette ville ne sont pas encore publiées, la disposition des cellules est donc générée.',
  },

  compare: {
    label: 'Comparer les villes',
    count: '{count} villes',
    lede: 'Toutes les villes publiées par cette plateforme, côte à côte. Les chiffres sont calculés à partir des mêmes fichiers que ceux qui dessinent les pages des villes : un nombre ici est le même nombre là-bas.',
    back: 'Retour à la carte',
    openCity: 'Ouvrir {name}',
    sortBy: 'Trier par',
    sort: {
      name: 'Nom',
      population: 'Population',
      weightedCdi: 'Indice de l’habitant moyen',
      medianCdi: 'Indice médian',
      ptShare: 'Cellules favorables aux transports en commun',
      inclusion: 'Inclusion',
      proximity: 'Proximité médiane',
      opportunity: 'Opportunité médiane',
    },
    basis: { label: 'Parts', cells: 'Par cellule', residents: 'Par habitant' },
    ranking: {
      cardep: 'Villes classées par indice',
      pov: 'Répartition des zones par ville',
      aboutCardep: 'Chaque barre est l’indice de l’habitant moyen de cette ville : chaque cellule pondérée par le nombre de personnes qui y vivent. À gauche de la ligne, les villes où, pour l’habitant type, les transports en commun atteignent davantage que la voiture ; à droite, celles où c’est la voiture. Les barres utilisent la même échelle que les cartes.',
      aboutPov: 'La part de chaque ville qui tombe dans chacune des quatre zones. Les zones sont fixées par rapport aux médianes pondérées par la population de cette même ville : on compare donc ici la répartition interne, et non le niveau d’une ville à l’autre. Une ville peut être pour moitié en inclusion et rester mal desservie dans l’ensemble. Vous pouvez compter par cellules ou par habitants : les cellules isolées sont grandes et peu peuplées, et les deux lectures racontent des histoires différentes.',
    },
    scatter: {
      cardep: 'Ce que la voiture atteint face aux transports en commun',
      pov: 'Proximité et opportunité',
      aboutCardep: 'Un cercle par ville, placé selon ce que l’habitant moyen atteint de chaque façon et dimensionné selon la population. La diagonale correspond à une portée égale : les cercles situés en dessous sont des villes où la voiture atteint davantage.',
      aboutPov: 'Un cercle par ville, placé selon les scores de son habitant moyen et dimensionné selon la population. Les deux axes sont des décomptes pondérés de points d’intérêt accessibles, donc sans unité : la position compare les villes, et le nombre seul n’a de sens que face à une autre ville sur le même axe.',
    },
    distribution: {
      title: 'Où se situent les habitants de chaque ville sur l’indice',
      about: 'Chaque courbe est une ville : la part de ses habitants vivant à une valeur de l’indice inférieure ou égale. Une courbe qui monte tôt et fort est une ville où presque tout le monde est du côté des transports en commun ; une courbe qui reste plate jusqu’à droite est une ville où presque tout le monde dépend de la voiture. Là où la courbe croise la ligne centrale se lit la part des habitants pour qui la voiture et les transports en commun atteignent à peu près la même chose.',
    },
    table: { title: 'Tableau récapitulatif' },
    th: {
      city: 'Ville',
      cells: 'Cellules',
      population: 'Population',
      medianCdi: 'Médiane',
      weightedCdi: 'Habitant moyen',
      ptCells: 'Cellules TC',
      carCells: 'Cellules voiture',
      proximity: 'Proximité méd.',
      opportunity: 'Opportunité méd.',
      inclusion: 'Inclusion',
      spatial: 'Isol. spatial',
      social: 'Isol. social',
      total: 'Isol. total',
    },
    loading: 'Chargement des villes publiées…',
    empty: 'Cette plateforme n’a encore publié aucune synthèse par ville.',
    error: 'La synthèse publiée n’a pas pu être chargée.',
  },

  faq: {
    eyebrow: 'Foire aux questions',
    headline: 'Questions',
    headlineAccent: 'fréquentes.',
    lede: 'Des réponses courtes à ce que l’on nous demande le plus souvent. Une autre question ? Écrivez à {email}.',
    meta: {
      updated: 'Dernière mise à jour',
      updatedValue: 'Juillet 2026',
      entries: 'Entrées',
      languages: 'Langues',
    },
    items: [
      {
        q: 'Que signifie « accès » dans l’Atlas ?',
        a: 'Trois choses mesurables, volontairement séparées. La proximité, c’est ce que l’on atteint à pied en quelques minutes : commerces, écoles, cabinets médicaux, espaces verts. L’opportunité, c’est ce que les transports en commun mettent à portée en un temps donné : emplois, universités, hôpitaux, lieux culturels. La valeur, c’est la qualité et l’attrait de ce qui est accessible ; elle fait partie du cadre théorique mais n’est pas encore quantifiée, et rien sur ce site ne prétend la mesurer.',
      },
      {
        q: 'Comment une cellule est-elle classée dans une zone ?',
        a: 'Chaque cellule a un score de proximité et un score d’opportunité. Une cellule est considérée comme haute sur un axe lorsqu’elle se situe au-dessus de la médiane de sa ville pondérée par la population sur cet axe ; pondérée, pour que le seuil reflète l’endroit où les gens vivent réellement et non la géométrie du maillage. Les deux réponses oui/non donnent quatre zones : inclusion, isolement spatial, isolement social, isolement total. Comme les seuils sont propres à chaque ville, les zones comparent des lieux au sein d’une ville, pas des villes entre elles ; ce sont les scores sous-jacents qui se comparent d’une ville à l’autre.',
      },
      {
        q: 'D’où viennent les données ?',
        a: 'Les réseaux de rues et les points d’intérêt proviennent d’OpenStreetMap. Les temps de marche sont calculés sur ces réseaux avec OSRM. Les transports en commun utilisent les horaires GTFS ouverts des opérateurs, évalués avec le Connection Scan Algorithm plutôt qu’avec une fréquence moyenne. La population provient des grilles WorldPop à 100 m ajustées aux estimations de l’ONU. Les cellules sont des hexagones H3 de résolution 9, d’environ 200 m de large.',
      },
      {
        q: 'Pourquoi ma ville est-elle fausse ?',
        a: 'Elle l’est peut-être. Les mesures ne valent que ce que valent leurs données d’entrée : une zone peu cartographiée dans OpenStreetMap, un flux GTFS périmé, une ligne ouverte après l’export ou un service fermé avant. Tout cela produit une carte fausse mais sûre d’elle, et la carte seule ne peut pas s’en apercevoir. Si vous connaissez une ville et que quelque chose cloche, écrivez-nous en indiquant où se trouvent de meilleures données : un flux à jour, une source officielle, ou simplement quelle partie de la carte ne correspond pas au terrain. C’est le moyen le plus rapide pour qu’une ville soit réexportée. Toutes les données publiées sont téléchargeables : un désaccord peut donc se vérifier plutôt que se débattre.',
      },
      {
        q: 'Pourquoi ma ville n’y est-elle pas ?',
        a: 'La couverture est limitée par les données, pas par l’intérêt : une ville a besoin d’une bonne cartographie OpenStreetMap et d’un flux GTFS public exploitable. Les plateformes de comparaison couvrent un ensemble de villes d’étude bien documentées plutôt que de viser une couverture mondiale, parce qu’un flux mal spécifié produit des chiffres d’apparence fiable qui sont faux. Si votre ville a les deux et n’y figure pas, ouvrez une issue sur GitHub.',
      },
      {
        q: 'Puis-je citer ce travail ?',
        a: 'Oui. Le cadre théorique est Bruno M., Campanelli B., Monteiro Melo H. P., Rossi Mori L. & Loreto V. (2026), “The dimensions of accessibility: proximity, opportunities, values”, EPJ Data Science 15:22, doi:10.1140/epjds/s13688-026-00623-8. Le Car Dependency Index est Campanelli B., Marzolla F., Bruno M., Melo H. P. M. & Loreto V. (2026), “Car Dependency in Urban Accessibility”, arXiv:2604.01019. La page Recherche les présente tous deux avec les jeux de données.',
      },
      {
        q: 'L’Atlas est-il gratuit ?',
        a: 'Oui. Le code de visualisation est sous licence MIT et les données publiées sont sous CC BY-NC 4.0 : vous pouvez les utiliser, les partager et les adapter librement en citant la source, à des fins non commerciales. Toute utilisation commerciale nécessite une autorisation écrite. Les articles eux-mêmes sont en accès libre sous licence CC BY 4.0.',
      },
    ],
  },

  about: {
    eyebrow: 'Villes durables',
    headline: 'Un axe de recherche sur les villes,',
    headlineAccent: 'pas un produit.',
    lede: 'Nous sommes une équipe de recherche à but non lucratif, l’un des axes de recherche de Sony Computer Science Laboratories – Rome, et nous travaillons avec des collaborateurs de l’Université Sapienza de Rome, du Centre de recherche Enrico Fermi (CREF) et d’autres instituts. L’Atlas est l’un des fruits de ce travail.',
    labLink: 'Sony CSL ↗',
    teamLink: 'L’équipe →',

    doTitle: 'Ce que nous faisons',
    do: {
      measure: {
        tag: 'Mesurer',
        title: 'Nous mesurons ce à quoi une ville donne accès',
        desc: 'La proximité, l’opportunité et, quand cela peut se faire honnêtement, la valeur de ce qui est accessible, calculées cellule par cellule à partir de données ouvertes sur les réseaux de rues, les horaires, les services et la population.',
      },
      compare: {
        tag: 'Comparer',
        title: 'Nous rendons les villes comparables',
        desc: 'Chaque ville est mesurée de la même façon, sur la même grille, avec les mêmes échelles. C’est ce qui donne un sens au chiffre d’une ville à côté de celui d’une autre.',
      },
      publish: {
        tag: 'Publier',
        title: 'Nous publions la méthode et les données',
        desc: 'Articles évalués par les pairs, données téléchargeables et code ouvert. Une mesure qui éclaire une décision d’aménagement devrait pouvoir être vérifiée par les personnes sur qui cette décision retombe.',
      },
    },

    withTitle: 'Avec qui nous travaillons',
    withBody:
      'Le groupe fait partie de Sony CSL Rome, au sein de l’initiative conjointe avec le CREF, et mène ses recherches avec des collaborateurs de la Sapienza et d’autres universités et instituts, en Italie et à l’étranger. Doctorantes, doctorants et étudiants de master travaillent sur l’Atlas dans ce cadre, et non à côté.',
    withBody2:
      'Nous travaillons aussi avec des collectivités, des groupes de recherche et des ONG, généralement parce que quelqu’un doit défendre un argument sur l’accès avec des données à l’appui. Si c’est votre cas, la page Contact est le point de départ.',

    projectsTitle: 'Autres projets',
    projectsHint: 'au-delà des quatre couches',
    projects: {
      whatif: {
        tag: 'Plateforme',
        name: 'WhatIf',
        desc: 'La plateforme modulaire de simulation urbaine du laboratoire, qui héberge les visualiseurs d’origine de 15-minute city et de CityChrone.',
      },
      maps3d: {
        tag: 'Carte en ligne',
        name: 'Cartes 3D',
        desc: 'Les inégalités urbaines lues en trois dimensions : le poids des différences d’une ville, dessiné comme une surface.',
      },
      bikeLanes: {
        tag: 'Article',
        name: 'Planification des pistes cyclables',
        desc: 'Une optimisation du réseau qui tient compte de la largeur des rues : où le réseau cyclable devrait s’étendre, compte tenu des rues qui doivent l’accueillir.',
      },
    },
    labCta: 'Visiter Sony CSL',
  },

  citychat: {
    eyebrow: 'CityChat · bêta',
    headline: 'Interrogez l\'Atlas sur',
    headlineAccent: 'votre ville.',
    lede: 'Demandez ce que signifie une couche, comment une ville se compare ou comment se porte un lieu : CityChat répond à partir des données publiées. C\'est un modèle d\'IA qui peut appeler le même code que celui des cartes, et chaque chiffre qu\'il cite est vérifié par rapport à ce que ce code a renvoyé.',
    beta: 'bêta',
    persona: {
      label: 'Je pose la question en tant que',
      citizen: 'Habitant·e',
      policy: 'Politiques et planification',
      research: 'Recherche',
      press: 'Journaliste',
    },
    city: {
      label: 'Ville',
      any: 'N\'importe quelle ville',
    },
    suggestionsTitle: 'Essayez de demander',
    suggestions: {
      citizen: [
        'Combien de temps faut-il à pied pour aller chez un médecin à {city} ?',
        'À {city}, est-il plus facile de se déplacer en voiture ou en transports en commun ?',
        'Que signifie la couleur d\'une cellule dans la couche de la ville du quart d\'heure ?',
      ],
      policy: [
        'Où vivent à {city} beaucoup de personnes avec un faible accès aux services ?',
        'Comment {city} se compare-t-elle aux autres villes en matière de dépendance à la voiture ?',
        'Quelle part des habitants de {city} vit en isolement total, et qu\'est-ce que cela signifie ?',
      ],
      research: [
        'Comment sont calculés les seuils des zones de P.O.V. ?',
        'Quelle différence entre parts de cellules et parts d’habitants à {city} ?',
        'Comment la vitesse des transports en commun à {city} évolue-t-elle au fil de la journée ?',
      ],
      press: [
        'Quelle ville publiée est la moins dépendante de la voiture pour son habitant moyen ?',
        'Quel serait un résumé honnête, en une ligne, de l\'accessibilité à {city} ?',
        'Quelle façon de présenter ces chiffres serait trompeuse ?',
      ],
    },
    placeholder: 'Posez une question sur une couche, une ville ou un lieu…',
    send: 'Envoyer',
    stop: 'Arrêter',
    reset: 'Nouvelle conversation',
    you: 'Vous',
    assistant: 'CityChat',
    working: 'Lecture des données…',
    answeredBy: 'Réponse de {model}',
    switching: '{model} prend le relais…',
    writing: 'Rédaction de la réponse…',
    verifying: 'Chiffres en cours de vérification',
    checking: 'Vérification des chiffres…',
    consulted: 'Calculé à partir de',
    showOnMap: 'Voir sur la carte',
    cell: 'cellule',
    unverified: 'Ces chiffres ne peuvent pas être rattachés aux données et peuvent être faux : {list}.',
    tools: {
      list_cities: 'villes publiées',
      city_overview: 'vue d’ensemble de la ville',
      layer_detail: 'détail de la couche',
      rank_cells: 'classement des cellules',
      cell_at: 'une cellule',
      compare_cities: 'comparaison de villes',
    },
    status: {
      checking: 'Connexion au service…',
      online: 'Modèle : {provider}',
      reserve: '(+{count} en réserve)',
      offline: 'Le service CityChat n\'est pas joignable depuis cette copie du site.',
      disabled: 'CityChat n\'est pas activé sur cette copie du site.',
    },
    errors: {
      unavailable: 'Le service CityChat n\'est pas joignable pour le moment.',
      rate_limited: 'Trop de questions en peu de temps. Réessayez dans quelques minutes.',
      busy: 'CityChat est occupé. Réessayez dans un instant.',
      too_long: 'Cette conversation est trop longue. Commencez-en une nouvelle.',
      provider: 'Le modèle n\'a pas pu répondre. Reformulez, ou posez la question à nouveau.',
      quota: 'Tous les modèles ont épuisé leur quota gratuit pour le moment. Réessayez dans une ou deux minutes.',
      too_many_steps: 'La question demandait trop d\'étapes. Essayez une question plus ciblée.',
    },
    disclaimer: 'Expérimental. Les réponses sont rédigées par un modèle d\'IA et peuvent être fausses : les chiffres sont calculés à partir des données publiées, les mots qui les entourent ne le sont pas. Les questions sont envoyées au fournisseur du modèle ; n\'y mettez pas d\'informations personnelles.',
  },

  stats: {
    eyebrow: 'Statistiques',
    headline: 'Comparer',
    headlineAccent: 'les villes.',
    lede: 'Un seul écran pour toutes les villes publiées, sur toutes les mesures (proximité, opportunité, dépendance à la voiture, répartition des zones), côte à côte et triables.',
    emptyTitle: 'Pas encore disponible',
    emptyBody:
      'C’est dans cet onglet que les villes seront comparées sur les quatre couches à la fois. Il reste vide à dessein tant qu’il ne peut pas être rempli honnêtement : une page de chiffres d’apparence plausible serait pire qu’une page qui dit qu’il n’y en a pas. Ce qui existe déjà se trouve ci-dessous.',
    availableTitle: 'Ce que l’on peut comparer aujourd’hui',
    availableHint: 'une plateforme à la fois',
    compare: {
      fifteen: 'Toutes les villes publiées par cette plateforme, côte à côte.',
      citychrone: 'Toutes les villes publiées par cette plateforme, côte à côte.',
      cardep:
        'Les 22 villes classées selon l’indice de leur habitant moyen, avec la répartition des habitants le long de l’indice.',
      pov: 'Les 18 villes selon la répartition des quatre zones, comptée par cellule ou par habitant, avec les scores dont elle découle.',
    },
  },

  consulting: {
    eyebrow: 'Conseil',
    headline: 'Vous travaillez sur une ville ?',
    headlineAccent: 'Parlons-en.',
    lede: 'Si vous êtes une administration publique, une agence ou une entreprise qui doit mesurer l’accès (pour un plan, un service, un investissement ou une évaluation), vous pouvez nous solliciter. Dites-nous quelle est votre question, et nous vous dirons franchement si nos méthodes permettent d’y répondre.',
    cta: 'Écrivez-nous',
    whoTitle: 'Pour qui',
    who: {
      policy: {
        tag: 'Secteur public',
        title: 'Décideurs publics',
        desc: 'Villes, régions, autorités organisatrices des mobilités et agences qui doivent décider où implanter une ligne, un service ou un équipement, et savoir à l’avance qui il atteindrait vraiment.',
      },
      company: {
        tag: 'Secteur privé',
        title: 'Entreprises',
        desc: 'Organisations dont les décisions dépendent de la façon dont on accède à une ville : implantation, conception de services, mobilité, ou la base empirique d’un rapport qui doit résister à un examen attentif.',
      },
    },
    note:
      'Un mot sur la licence : les données publiées sont sous CC BY-NC 4.0, donc toute utilisation commerciale nécessite une autorisation écrite. C’est une conversation, pas un refus, et l’adresse est la même dans les deux cas.',
  },

  contact: {
    eyebrow: 'Contact et collaborations',
    headline: 'Rome, Italie.',
    headlineAccent: 'Ouverts aux collaborations.',
    lede: 'Nous travaillons avec des collectivités, des groupes de recherche, des ONG et toute personne qui cherche à défendre un argument sur l’accès avec des données à l’appui. Si votre ville devrait figurer dans l’Atlas, si vous souhaitez réutiliser les cartes dans un article ou si quelque chose ici vous semble faux, écrivez-nous.',
    fields: {
      address: 'Adresse',
      general: 'Général',
      code: 'Code',
      phone: 'Téléphone',
    },
    addressValue:
      'Sony Computer Science Laboratories, Rome\nJoint Initiative CREF-SONY\nCentro Studi e Ricerche “Enrico Fermi” – CREF\nVia Panisperna, 89/a\n00184 Roma\nEntrée : Piazza del Viminale, 1, Roma',
    teamTitle: 'L’équipe',
    roles: {
      director: 'Responsable scientifique et directeur',
      assistant: 'Assistant·e de recherche',
      staffResearcherM: 'Chercheur',
      staffResearcherF: 'Chercheuse',
      consultantM: 'Consultant et chercheur',
      consultantF: 'Consultante et chercheuse',
      sapienzaResearcherM: 'Chercheur, Sapienza',
      sapienzaResearcherF: 'Chercheuse, Sapienza',
      sapienzaPhdM: 'Doctorant, Sapienza',
      sapienzaPhdF: 'Doctorante, Sapienza',
      visitingPhdM: 'Doctorant invité',
      visitingPhdF: 'Doctorante invitée',
      communications: 'Responsable senior de la communication et des événements',
      developerM: 'Développeur logiciel full stack',
      developerF: 'Développeuse logiciel full stack',
      admin: 'Responsable administratif·ve senior',
      phdM: 'Doctorant',
      phdF: 'Doctorante',
      masterM: 'Étudiant en master',
      masterF: 'Étudiante en master',
      researcherM: 'Chercheur',
      researcherF: 'Chercheuse',
      visitingResearcherM: 'Chercheur invité',
      visitingResearcherF: 'Chercheuse invitée',
      hiring: 'Travailler avec nous',
    },
    joinName: 'Vous ?',
    formerTitle: 'Anciens membres',
  },

  research: {
    eyebrow: 'Production scientifique',
    headline: 'Articles, données',
    headlineAccent: 'et code.',
    lede: 'Les méthodes de l’Atlas sont publiées et les données sont téléchargeables. Les plateformes dont l’article est encore en préparation sont signalées comme telles : les cartes sont montrées, la citation n’est pas inventée.',
    papersTag: '01',
    papersTitle: 'Articles',
    papersHint: 'évalués par les pairs et prépublications',
    datasetsTag: '02',
    datasetsTitle: 'Données et code',
    datasetsHint: 'CC BY-NC 4.0 · MIT',
    citeTitle: 'Comment citer l’Atlas',
    inPreparation: 'En préparation',
    preprint: 'Prépublication',
    columns: { dataset: 'Jeu de données', coverage: 'Couverture', format: 'Format', licence: 'Licence' },
  },

  blog: {
    eyebrow: 'Blog',
    headline: 'Carnets',
    headlineAccent: 'de l’Atlas.',
    lede: 'Des textes plus longs sur ce que nous mesurons, comment nous le mesurons, et ce que les cartes montrent ou ne montrent pas. Les articles sont en anglais et en italien.',
    readingTime: '{count} min de lecture',
    backToBlog: '← Tous les articles',
    published: 'Publié le',
    postsLabel: 'Articles',
  },

  work: {
    eyebrow: 'Travailler avec nous',
    headline: 'Aucun poste ouvert',
    headlineAccent: 'pour le moment.',
    lede: 'Nous ne recrutons pas actuellement sur un poste financé. Nous sommes toutefois toujours heureux d’avoir des nouvelles d’étudiantes et d’étudiants qui veulent travailler sérieusement sur l’accessibilité urbaine, et ces échanges commencent généralement bien avant qu’un poste n’existe.',
    openTitle: 'Ce qui est ouvert',
    positionsTitle: 'Postes actuels',
    noPositions: 'Aucun poste financé n’est ouvert actuellement.',
    noPositionsDetail:
      'Lorsqu’un poste s’ouvrira, il sera annoncé ici et sur la page carrières de Sony CSL. Il n’y a pas de liste d’attente, et les candidatures spontanées pour des postes qui n’existent pas ne sont pas conservées.',
    routes: {
      phd: {
        title: 'Doctorat',
        desc: 'Nous co-encadrons des thèses avec des universités en Italie et à l’étranger, généralement sur la mesure de l’accessibilité, l’analyse des réseaux de transport ou la physique statistique des villes. Le financement passe normalement par l’école doctorale de l’université d’accueil et non par nous : il vaut donc mieux entamer la discussion quelques mois avant ses échéances.',
      },
      thesis: {
        title: 'Mémoires de master',
        desc: 'Nous accueillons des étudiantes et étudiants de master sur une partie bien définie de l’Atlas : une nouvelle ville, une comparaison méthodologique, la validation de l’un des indices avec des données indépendantes. Comptez environ six mois, de vraies données, et un résultat publié s’il tient.',
      },
      internship: {
        title: 'Stages',
        desc: 'Des séjours plus courts et plus ciblés, généralement de trois à six mois : chaînes de traitement de données, traitement géospatial ou développement front-end sur ces plateformes. Une expérience de Python et des outils géospatiaux, ou de JavaScript moderne et du rendu cartographique, est utile.',
      },
    },
    howTitle: 'Comment nous contacter',
    howBody:
      'Écrivez à {email} avec une brève description de ce sur quoi vous voulez travailler et pourquoi, un CV et, si vous en avez un, un lien vers quelque chose que vous avez construit ou écrit. Une proposition précise, qui s’appuie sur un article ou une plateforme, vaut bien plus qu’une marque d’intérêt générale.',
    expectTitle: 'À quoi vous attendre',
    expectBody:
      'Nous lisons tout et répondons aux propositions auxquelles nous pouvons donner suite. Nous sommes une petite équipe et ne pouvons pas faire un retour détaillé sur chaque message ; une réponse tardive n’est pas un jugement sur votre candidature.',
    cta: 'Écrivez-nous',
  },

  footer: {
    description:
      'Recherche ouverte sur l’accès urbain par l’équipe Villes durables de Sony CSL – Rome. Méthodes, cartes et données, publiées et librement réutilisables.',
    platforms: 'Plateforme',
    research: 'Recherche',
    researchLinks: ['Articles', 'Données', 'Blog', 'FAQ'],
    about: 'À propos',
    aboutLinks: ['Villes durables', 'Équipe', 'Contact', 'Conseil', 'Travailler avec nous'],
    touch: 'Rester en contact',
    touchLinks: ['GitHub', 'Lettre d’information'],
    workCta: 'Travailler avec nous →',
    copyright: '© 2026 Sony Computer Science Laboratories · Rome',
    version: 'Code MIT · Données CC BY-NC 4.0',
  },

  notFound: {
    eyebrow: 'Erreur 404',
    headline: 'Hors de la',
    headlineAccent: 'carte.',
    lede: 'Cette page ne fait pas partie de l’Atlas. Essayez les plateformes ou revenez à l’accueil.',
    cta: 'Retour à l’Atlas',
  },
};
