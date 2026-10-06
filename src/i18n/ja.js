// Japanese copy. Mirrors the shape of `en.js` exactly; `test:data` fails if
// the three dictionaries drift apart.
//
// What stays in English, on purpose: the Atlas's own name, platform and
// dataset names, the data-and-methods notes (`city.explain.methods`), the
// postal address and the citations. Blog posts have no Japanese version and
// fall back to English (`post[lang] ?? post.en`). City names come from the
// catalogue, which has English and Italian only.
//
// Copy rule: as in English, every quantity is computed from the published
// datasets or omitted, and a measure without a unit is called a score (スコア).

export default {
  meta: {
    locale: 'ja-JP',
    name: '日本語',
  },

  nav: {
    title: 'Accessibility Atlas',
    tagline: 'Sony CSL · Rome · 持続可能な都市',
    atlas: 'ホーム',
    platforms: 'アトラス',
    citychat: 'CityChat',
    stats: '統計',
    about: '持続可能な都市',
    consulting: 'コンサルティング',
    research: '研究',
    blog: 'ブログ',
    faq: 'FAQ',
    contact: '連絡先',
    github: 'GitHub',
    skipToContent: '本文へスキップ',
    openMenu: 'メニューを開く',
    language: '言語',
  },

  home: {
    hero: {
      eyebrow: 'オープンな研究プラットフォーム · Sony CSL Rome',
      // The Atlas's name stays in English, as on the landing in every locale.
      title: 'Accessibility',
      titleAccent: 'Atlas',
      subtitle: '都市ごとに、アクセスを地図にする。',
      headline: '都市のアクセスを',
      headlineAccent: '測るためのアトラス。',
      lede: '都市では、何に手が届くのでしょうか。徒歩圏内にある日常のサービス、つまり{proximity}を測ります。公共交通で一定の時間内に行ける場所、つまり{opportunity}を測ります。都市の機会にたどり着くのにどれだけ車が必要か、つまり{cardep}を測ります。そして、アクセスの差が不平等をどう広げているのかを明らかにします。',
      ledeProximity: '近接性',
      ledeOpportunity: '機会',
      ledeCardep: '自動車依存',
      ctaPrimary: 'プラットフォームを見る',
      ctaSecondary: 'フレームワーク論文を読む ↗',
    },
    news: {
      title: 'ラボの最新情報',
      kinds: { paper: '論文', release: 'リリース', data: 'データ' },
      items: {
        pov: 'The dimensions of accessibility (EPJ Data Science)',
        cdi: 'Car Dependency Index：{count}都市を公開',
        atlas: '統合ビューア：ミラノを共通グリッド上に、4つのプラットフォームすべてで公開',
      },
      dates: { pov: '2026年4月', cdi: '2026年2月', atlas: '2026年8月' },
    },
    landing: {
      mapLabel: 'アトラスが公開したすべての都市',
      by: 'Sony CSL · Rome のプロジェクト',
    },
    premise: {
      lines: [
        '都市は機会にあふれた場所です。',
        '機会へのアクセスは、不平等を減らします。',
        'アクセスの不平等は、不平等な社会を生みます。',
      ],
    },
    metrics: {
      cities: '公開都市数',
      platforms: 'プラットフォーム',
      countries: '国',
      cells: '六角形セル',
      researchers: '研究者',
    },
    platforms: {
      title: 'アクセシビリティのレイヤー',
      more: '詳しく見る',
      cityCount: '{count}都市',
      themes: {
        fifteen: '近接性',
        citychrone: '機会',
        cardep: '比較',
        pov: '統合',
      },
      desc: {
        fifteen:
          '10種類の日常サービスまでの徒歩・自転車での所要時間を、15分という基準に照らして読み解きます。',
        citychrone:
          '所要時間の地理学。距離を公共交通での所要分数で測るように、都市を描き直します。',
        cardep:
          '車による機会へのアクセスが、公共交通によるアクセスをどれだけ上回るかを、セルごとに示します。',
        pov: '近接性と機会を対比し、都市をアクセスの4つのゾーンに分けます。',
      },
    },
    table: {
      title: '都市を比較する',
      statsNote:
        'P.O.V. のデータセットから、6つの都市を3つの指標で比較しています。公開済みのすべての都市をすべての指標で比べる画面は「統計」タブです。',
      statsCta: '統計を開く',
      headers: {
        city: '都市',
        proximity: '近接性スコアの中央値',
        opportunity: '機会スコアの中央値',
        inclusion: '包摂ゾーン',
      },
      note: '近接性と機会は、到達可能な地点（POI）の重み付き件数です。どの都市も同じ方法で測っているため、都市間で比較できます。包摂は、人口で重み付けした2つの中央値をともに上回るセルの割合です。',
    },
    side: {
      title: '進行中の研究',
      kinds: { live: '公開中', paper: '論文' },
      items: {
        shade: {
          name: '日陰への権利',
          desc: 'インフラとしての日陰。夏に日なたを歩かずに都市を横断できるのは誰で、できないのは誰か。',
        },
        weight: {
          name: '都市の不平等の重さ',
          desc: 'アクセスの不平等を、表ではなく面として、都市ごとに3次元で読み解きます。',
        },
        odMatrices: {
          name: 'GPS データによる OD 行列',
          desc: 'GPS の軌跡から起点・終点の流れを再構成し、ネットワークが可能にする移動と、人々が実際に行う移動を比べます。',
        },
        bikeLanes: {
          name: '自転車レーンの計画',
          desc: '収まるべき道路の幅と、生まれる接続を踏まえて、自転車ネットワークを次にどこへ広げるべきかを考えます。',
        },
        co2: {
          name: '交通による CO₂ 排出',
          desc: '都市の形がもたらす排出コスト。都市の移動がどれだけの炭素を使い、近接性がその数字をどう変えるか。',
        },
        quality: {
          name: '質の不平等',
          desc: 'フレームワークの第3の次元。どれだけ到達できるかではなく、到達できるものがどれだけ良いか。そして質がアクセスと同じほど不平等に分布しているか。',
        },
      },
    },
  },

  platform: {
    search: '都市を検索…',
    searchHint: '⌘K',
    paper: '論文 ↗',
    welcome: '{name} へようこそ',
    dismiss: '閉じる',
    ctaMap: '地図上の都市をクリック',
    learnMore: '詳しく見る →',
    attribution: 'ベースマップ：Natural Earth · データ © Sony CSL Rome · CC BY-NC 4.0',
    cityCount: '{count}都市',
    zoomIn: '拡大',
    zoomOut: '縮小',
    loading: 'カバー範囲を読み込み中…',
    empty: '検索に一致する都市はありません。',
    seeded: '説明用の値です。このプラットフォームの測定値はまだ公開されていません。',

    all: {
      name: 'すべてのレイヤー',
      welcome: 'Accessibility Atlas へようこそ',
      label: '公開済みのカバー範囲',
      pick: '地図を選ぶ',
      intro:
        '4つのプラットフォームを通じて、アトラスが公開したすべての都市です。プラットフォームごとに測る対象も、カバーする都市も異なります。1つを選ぶと、その地図、その尺度、その都市が表示されます。色が濃い都市ほど、4つの指標のうち多くが公開されています。',
      legendUnit: '公開済みプラットフォーム',
      legend: ['1つ', '2つ', '3つ', '4つすべて'],
      covered: '全4プラットフォーム中{count}',
    },

    fifteen: {
      label: '近接性アクセス',
      intro:
        '医療、学習、買い物、飲食、文化、屋外空間、運動、各種サービス、移動など、10種類の日常サービスまでの徒歩と自転車での所要時間を、都市のすべてのセルについて計算し、15分という基準に照らして読み解きます。',
      legendUnit: 'サービスまでの平均時間',
      legend: ['0–3分', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24', '24–30'],
    },
    citychrone: {
      label: '機会アクセス',
      intro:
        'CityChrone は距離の代わりに所要時間を使います。地上では離れていても、公共交通で素早く結ばれている2つの場所が近くに来るように、地図が変形します。',
      legendUnit: '速度スコア',
      legend: ['遅い', '中程度', '速い'],
    },
    cardep: {
      label: '車と公共交通',
      intro:
        'Car Dependency Index（自動車依存指数）は、同じ時間内に車で到達できる機会と公共交通で到達できる機会を比べます：CDI = (O_car − O_PT) / (O_car + O_PT)。公共交通の方が多く到達できる −1から、両者が釣り合う0を経て、車ならすべてに届き公共交通ではほとんど届かない +1までの値をとります。',
      legendUnit: 'Car Dependency Index',
      legend: ['公共交通優位', '均衡', '自動車依存', '強い自動車依存'],
    },
    pov: {
      label: 'Proximity · Opportunity · Value',
      intro:
        '各セルを2つの軸で評価します。徒歩で到達できる日常サービスである近接性と、公共交通で到達できる都市スケールの目的地である機会です。そのうえで、それぞれの軸について都市の人口重み付き中央値と比べて分類します。第3の軸である到達先の価値は、フレームワークでは定義されていますが、まだ数値化されていません。',
      legendUnit: 'ゾーン',
      legend: ['包摂', '空間的孤立', '社会的孤立', '完全な孤立'],
    },
  },

  fifteen: {
    mapTitle: 'サービスまでの所要時間',
    minutes: '分',
    barsTitle: 'このセルから見た全カテゴリー',
    barsAxis: 'バーの最大は{max} {unit}。それより長い場合はバーがいっぱいになります。',
    legendValue: '近接時間',
    statusHint:
      '移動手段とカテゴリーを選択 · 凡例の帯にカーソルを合わせると強調表示 · スクロールとドラッグで移動',
    controls: {
      mode: '移動手段',
      category: 'サービスのカテゴリー',
    },
    modes: { foot: '徒歩', bike: '自転車' },
    hint: '各セルから、このカテゴリーの最寄りのサービスまでの平均所要時間。',
    summary: { median: '所要時間の中央値' },
    categories: {
      average: '全サービスの平均',
      outdoor: '屋外活動',
      learning: '学習',
      supplies: '買い物',
      eating: '飲食',
      moving: '移動',
      cultural: '文化活動',
      exercise: '運動',
      services: '各種サービス',
      healthcare: '医療',
    },
  },

  atlas: {
    label: '統合ビュー',
    mapTitle: '{name} による測定',
    controls: {
      layer: '表示',
      view: '指標',
      hour: '時間帯',
      opacity: 'レイヤーの不透明度',
    },
    info: 'このレイヤーについて',
    hidePanel: 'コントロールを隠す',
    showPanel: 'コントロール',
    fullscreen: '全画面表示',
    exitFullscreen: '全画面表示を終了',
    population: {
      name: '人口',
      legend: 'セルあたりの居住者数',
      tooltip: '居住者{count}人',
      about:
        '15-minute city のエクスポートによる、セルあたりの居住者数です。対数スケールで色付けしています。人口の分布は大きく偏っているため、線形スケールではほぼすべてのセルが最も薄い色になってしまいます。これは他の4つの指標を読むための文脈です。同じ移動でも、それを行う人が多い場所ほど重みが増します。',
    },
    beyond: {
      fifteen: 'さらに濃くなり、120分以上で黒',
      isochrone: 'さらに濃くなり、公開データの上限である180分で黒',
    },
    views: {
      velocity: '速度',
      sociality: '社会性',
      isochrone: '等時線',
    },
    viewHint: {
      velocity:
        'この時間帯に、公共交通が各セルからどれだけ速く外へ運んでくれるか。km/h に近いスコアです。',
      sociality:
        'この時間帯に、公共交通が各セルからどれだけ多くの人に届かせてくれるか。人数ではなくスコアです。',
      isochrone: '選んだ1つのセルから他のすべての場所までの、公共交通での所要時間。',
    },
    legend: {
      velocity: '速度スコア（km/h）',
      sociality: '社会性スコア',
      isochrone: '選択したセルからの所要分数',
    },
    summary: { weightedV: '平均的な居住者にとっての速度' },
    mistake: {
      title: '間違いを見つけましたか？',
      body: '間違いは起こりえます。データが欠けていたり、誤解を招いたりすることもあります。修正できる点をご存じでしたら、{contact}。',
      contact: 'ご連絡ください',
    },
    osmUpdate: 'OpenStreetMap の最終更新：{date}',
    layerCells: '{name} が測定したセル',
    isochroneEmpty: 'セルをクリックすると、そこからの所要時間を表示します',
    unavailable: '未公開',
    noValue: 'このセルでは未測定',
    openPlatform: '{name} のページ',
    statusHint:
      '1つのグリッドに4つの測定。レイヤーを切り替えると同じセルが塗り直されます · スクロールとドラッグで移動',
    legacyHint:
      'この都市はまだ共通グリッドでエクスポートされていません。各表示は、そのプラットフォーム独自のメッシュを読み込みます。',
    error: '公開されたメッシュを読み込めませんでした。',
  },

  city: {
    region: '{region} · {count}セル',
    worldMap: '世界地図',
    compare: '都市を比較する',
    zoneType: 'ゾーン',
    cdiHint:
      '公共交通が車より多く到達できる場所では負、車の方が多く到達できる場所では正になります。この指数は ±1 の範囲に収まる正規化差であり、比率ではありません。',
    zones: {
      inclusion: {
        name: '包摂',
        desc: '両方の軸で中央値を上回る：身近にサービスがあり、都市全体ともつながっている',
      },
      spatial: {
        name: '空間的孤立',
        desc: '近くにサービスはあるが、都市全体への公共交通のつながりが弱い',
      },
      social: {
        name: '社会的孤立',
        desc: '公共交通のつながりは良いが、徒歩圏内のサービスが少ない',
      },
      total: {
        name: '完全な孤立',
        desc: '両方の軸で中央値を下回る：多くは周縁部',
      },
    },
    summary: {
      title: '都市の概要',
      hexagons: 'セル',
      area: '対象面積',
      proximity: '近接性スコアの中央値',
      medianCdi: 'CDI の中央値（セル単位）',
      weightedCdi: '平均的な居住者の CDI',
      opportunity: '機会スコアの中央値',
      population: '対象人口',
    },
    filter: {
      title: '指数で絞り込む',
      reset: 'リセット',
      about: '地図と散布図を、指数が2つのつまみの間にあるセルに絞り込みます。範囲外のセルも地図には薄く残ります。ここでの絞り込みは見方の1つであり、それ以外が存在しないという主張ではありません。概要の数値は影響を受けず、都市全体を表します。',
      showing: '{total}セル中{count}セル',
    },
    selected: {
      title: '選択したセル',
      empty: '地図上または散布図上のセルをクリックすると、そのセルで測定されたすべての値を表示します。',
      clear: '解除',
    },
    cell: {
      zone: 'ゾーン',
      proximity: '近接性スコア',
      opportunity: '機会スコア',
      cdi: 'Car Dependency Index',
      byCar: '車で到達可能',
      byTransit: '公共交通で到達可能',
      population: '居住者',
      thresholdProximity: 'ゾーンの閾値（近接性）',
      thresholdOpportunity: 'ゾーンの閾値（機会）',
      time: '所要時間',
      velocity: '速度スコア',
      sociality: '社会性スコア',
      grid: 'H3 セル',
    },
    explain: {
      map: {
        pov: '各セルは、属するゾーンの色で塗られます。両方の軸で中央値を上回れば緑、両方で下回れば赤、その中間が2つの混合ケースです。閾値はその都市自身の人口重み付き中央値なので、ゾーンは1つの都市の中の場所どうしを比べるものであり、都市どうしを比べるものではありません。都市間で比べられるのは、もとになるスコアの方です。',
        cardep: '公共交通の方が車より多くの機会に到達できる場所は青、両者が釣り合う場所は白、車の方が多く到達できる場所は赤です。尺度は都市ごとに合わせず全都市で固定しているため、同じ色はどこでも同じ指数を意味します。パレットを埋めるために都市の色を塗り直すことはありません。',
        fifteen: 'セルは、選んだカテゴリーに選んだ移動手段で到達するのにかかる時間で色付けされます。プラットフォームの名前の由来である15分が白で、尺度は30分を過ぎても濃くなり続け、120分で黒になります。凡例はこの延長部分を伸ばさずに名前で示します。伸ばすと、ほぼすべてのセルが収まる範囲が押しつぶされてしまうからです。10のカテゴリーと2つの移動手段で同じ尺度を使うため、何を選んでも同じ色は同じ意味です。',
      },
      summary: {
        pov: 'セル数は、公開データセットがカバーする範囲を数えたものです。各中央値は真ん中のセルのスコアで、到達可能な地点の重み付き件数です。そのためどちらにも単位はなく、メートルでも雇用数でもありません。人口はデータセット自身のセルの合計であり、その都市の公式な数字ではありません。',
        cardep: 'CDI の中央値は真ん中のセルの指数です。平均的な居住者の CDI は各セルをそこに住む人数で重み付けしたもので、プラットフォームが都市を順位付けする数字です。都市のセルの半分が自動車依存でも、居住者の大半は残りの半分に住んでいることがあります。',
        fifteen: '中央値は、画面上のカテゴリーと移動手段について、真ん中のセルの所要時間です。居住者ではなくセルを表します。何人住んでいても、各セルは1回だけ数えられます。人口はデータセット自身の合計です。',
        atlas: '数値は画面上のレイヤーについて再計算されます。セル数は統合メッシュ（いずれかのプラットフォームが測定するすべてのセル）なので、より少ない範囲しかカバーしないレイヤーはその行で示します。',
      },
      more: '詳しい説明',
      platformSite: '{name} のサイト',
      aboutTitle: '{name} について',
      sections: {
        measure: '何を測るか',
        map: '地図の読み方',
        geometry: '2つのジオメトリ',
        summary: 'パネルの数値',
        source: '出典',
      },
      methodsTitle: 'データと手法',
      // Technical notes: kept in English, as the platforms publish them.
      methods: {
        pov: 'H3 resolution-9 cells, roughly 200 m across. Walking times from OSRM over OpenStreetMap; public transport from GTFS schedules with the Connection Scan Algorithm; points of interest from OpenStreetMap; population from WorldPop’s 100 m grids, adjusted to UN estimates.',
        cardep: 'H3 resolution-9 cells, roughly 200 m across. Driving and walking times from OSRM over OpenStreetMap, with a parking buffer and city-specific traffic delays on the car side; public transport from GTFS schedules with the Connection Scan Algorithm; points of interest from OpenStreetMap; population from WorldPop.',
        fifteen: 'H3 resolution-9 cells. Walking and cycling times from OSRM over OpenStreetMap; services from OpenStreetMap, grouped into the ten categories the selector lists; population from WorldPop.',
        citychrone: 'H3 resolution-9 cells, one export per hour of the day. Public transport from GTFS schedules; both scores and the isochrones are defined in the platform’s paper. Travel times are published as whole minutes capped at 180.',
      },
      paperNote: '手法の詳細は論文に記載されています。',
    },
    geometry: {
      label: 'ジオメトリ',
      map: '地図',
      cartogram: 'カルトグラム',
      mapTitle: '地図 · 実際の位置のセル',
      mapCaption: 'セルの面積は、カバーする土地の広さ',
      cartogramCaption: 'セルの面積は、そこに住む人口',
      loading: 'もう一方のジオメトリを読み込み中…',
      unavailable: 'カルトグラムは未公開',
      about: {
        map: '各セルは地上の六角形そのもので、何があっても大きさはどこでも同じです。面積は、ある指標が何人に影響するかを示しません。そのため、人口の少ない都市の縁も、密集した中心部と同じだけの面積を占めます。',
        cartogram: '各セルは実際の位置にありますが、面積はカバーする土地ではなく居住人口を表します。居住者の少ないセルは六角形のごく一部に縮み、人の多いセルは六角形いっぱいになります。答える問いが違うのです。指標がどこで低いかではなく、何人にとって低いか。',
        derived: 'このカルトグラムはアトラス独自のものです。{name} はカルトグラムを公開していないため、ここでの面積はセルの居住人口に比例し、その都市の居住セルの人口中央値で六角形の大きさに達します。この規則は、他のプラットフォームが同じ都市について公開しているカルトグラムに合わせて調整されており、200 m のセルで約12 m の差で再現します。そのため、同じ人口のセルは、どのレイヤーでも同じ大きさに見えます。',
        missing: 'カルトグラムは作成者が計算したレイアウトであり、地図の変換ではありません。そのためアトラスは、独自に導くのではなく、各プラットフォームが公開したものを描きます。{name} はカルトグラムを公開していません。',
      },
    },
    cartogram: {
      title: 'カルトグラム · セルの面積 ∝ 人口',
      caption: 'H3 解像度{res} · 約{size} m のセル',
      captionSize: '約{size} m のセル',
    },
    scatterCdi: {
      title: '車による機会と公共交通による機会',
      xAxis: '車で到達可能 →',
      yAxis: '公共交通で到達可能 →',
      diagonal: '到達範囲が同じ',
    },
    scatter: {
      title: '近接性と機会',
      xAxis: '機会スコア →',
      yAxis: '近接性スコア →',
    },
    statusHint:
      'セルや点にカーソルを合わせるかクリックすると相互に強調表示 · スクロールとドラッグで移動',
    computing: 'メッシュを読み込み中…',
    seeded:
      '説明用のメッシュです。この都市の測定値はまだ公開されていないため、セルの配置は生成されたものです。',
  },

  compare: {
    label: '都市を比較する',
    count: '{count}都市',
    lede: 'このプラットフォームが公開したすべての都市を並べています。数値は都市ページが描くのと同じファイルから計算しているため、ここの数字はあちらの数字と同じです。',
    back: '地図に戻る',
    openCity: '{name} を開く',
    sortBy: '並べ替え',
    sort: {
      name: '名前',
      population: '人口',
      weightedCdi: '平均的な居住者の指数',
      medianCdi: '指数の中央値',
      ptShare: '公共交通優位のセル',
      inclusion: '包摂',
      proximity: '近接性の中央値',
      opportunity: '機会の中央値',
    },
    basis: { label: '割合', cells: 'セル単位', residents: '居住者単位' },
    ranking: {
      cardep: '指数による都市の順位',
      pov: '都市ごとのゾーン構成',
      aboutCardep: '各バーは、その都市の平均的な居住者の指数です。各セルをそこに住む人数で重み付けしています。線の左側は、典型的な居住者にとって公共交通の方が車より多く到達できる都市、右側は車の方が多く到達できる都市です。バーは地図と同じ尺度を使っています。',
      aboutPov: '各都市のうち、4つのゾーンそれぞれに入る割合です。ゾーンはその都市自身の人口重み付き中央値で決まるため、これは都市間の水準ではなく、都市内の構成を比べるものです。包摂が半分でも、全体としてはサービスが乏しい都市もありえます。セルで数えるか居住者で数えるかを切り替えられます。孤立したセルは大きく人口が少ないため、両者は異なる姿を示します。',
    },
    scatter: {
      cardep: '車で到達できるものと公共交通で到達できるもの',
      pov: '近接性と機会',
      aboutCardep: '都市ごとに1つの円を、平均的な居住者がそれぞれの手段で到達できる量の位置に置き、大きさは人口を表します。対角線は両者が同じだけ到達できる位置で、その下の円は車の方が多く到達できる都市です。',
      aboutPov: '都市ごとに1つの円を、平均的な居住者のスコアの位置に置き、大きさは人口を表します。どちらの軸も到達可能な地点の重み付き件数で、単位はありません。位置は都市どうしを比べるもので、数値そのものは同じ軸上の別の都市と比べてはじめて意味を持ちます。',
    },
    distribution: {
      title: '各都市の居住者が指数のどこにいるか',
      about: '各曲線は1つの都市で、ある指数以下に住む居住者の割合を示します。早く急に立ち上がる曲線は、ほぼ全員が公共交通側にいる都市です。右端まで平らな曲線は、ほぼ全員が車に頼っている都市です。曲線が中央の線と交わる位置は、車と公共交通の到達範囲がほぼ同じである居住者の割合です。',
    },
    table: { title: '概要表' },
    th: {
      city: '都市',
      cells: 'セル',
      population: '人口',
      medianCdi: '中央値',
      weightedCdi: '平均的な居住者',
      ptCells: '公共交通セル',
      carCells: '自動車セル',
      proximity: '近接性中央値',
      opportunity: '機会中央値',
      inclusion: '包摂',
      spatial: '空間的孤立',
      social: '社会的孤立',
      total: '完全な孤立',
    },
    loading: '公開済みの都市を読み込み中…',
    empty: 'このプラットフォームはまだ都市の概要を公開していません。',
    error: '公開された概要を読み込めませんでした。',
  },

  faq: {
    eyebrow: 'よくある質問',
    headline: 'よくある',
    headlineAccent: '質問。',
    lede: 'よく寄せられる質問への短い回答です。ほかにご質問があれば、{email} までお寄せください。',
    meta: {
      updated: '最終更新',
      updatedValue: '2026年7月',
      entries: '項目数',
      languages: '言語',
    },
    items: [
      {
        q: 'アトラスでいう「アクセス」とは何ですか？',
        a: '測定可能な3つのことで、意図的に分けています。近接性は、徒歩数分で到達できるもの（店舗、学校、診療所、緑地）です。機会は、公共交通が一定の時間内に届けてくれるもの（職場、大学、病院、文化施設）です。価値は、到達できるものの質と魅力です。これはフレームワークの一部ですが、まだ数値化されておらず、このサイトのどこにもそれを測っているという主張はありません。',
      },
      {
        q: 'セルはどのようにゾーンに分類されますか？',
        a: '各セルは近接性スコアと機会スコアを持ちます。ある軸について、その都市の人口重み付き中央値を上回るとき、そのセルはその軸で高いとみなします。重み付けにより、閾値はメッシュの形ではなく人々が実際に住む場所を反映します。2つの「はい・いいえ」から、包摂、空間的孤立、社会的孤立、完全な孤立の4つのゾーンが生まれます。閾値は都市ごとに異なるため、ゾーンは都市の中の場所どうしを比べるものであり、都市どうしを比べるものではありません。都市間で比べられるのは、もとになるスコアです。',
      },
      {
        q: 'データはどこから来ていますか？',
        a: '道路網と地点（POI）は OpenStreetMap から取得しています。徒歩の所要時間は、その道路網上で OSRM を使って計算しています。公共交通は事業者が公開する GTFS の時刻表を使い、平均的な運行頻度ではなく Connection Scan Algorithm で評価しています。人口は、国連の推計に合わせて調整した WorldPop の100 m グリッドによるものです。セルは解像度9の H3 六角形で、差し渡し約200 m です。',
      },
      {
        q: '自分の都市のデータが間違っているのはなぜですか？',
        a: '実際に間違っているかもしれません。測定はその入力と同じ程度にしか正確ではありません。OpenStreetMap の地図が十分に描かれていない地域、古くなった GTFS フィード、エクスポート後に開業した路線、その前に閉鎖されたサービス。これらはすべて、地図自身では気づけない形で、自信ありげに間違った地図を生みます。ある都市をよく知っていて、何かおかしいと感じたら、より良いデータがどこにあるかを添えてご連絡ください。最新のフィード、公式の情報源、あるいは単に地図のどの部分が現地と合わないか。それが都市を再エクスポートしてもらう最も早い方法です。公開データセットはすべてダウンロードできるので、意見の違いは議論ではなく確認で解決できます。',
      },
      {
        q: '自分の都市が含まれていないのはなぜですか？',
        a: 'カバー範囲を決めているのは関心ではなくデータです。都市には、よく整備された OpenStreetMap の地図と、使える公開 GTFS フィードが必要です。比較プラットフォームは、世界全体を目指すのではなく、よく記録された研究対象都市を扱っています。仕様の悪いフィードは、もっともらしく見えて間違った数字を生むからです。あなたの都市に両方がそろっているのに含まれていない場合は、GitHub で issue を作成してください。',
      },
      {
        q: 'この研究を引用できますか？',
        a: 'はい。フレームワークは Bruno M., Campanelli B., Monteiro Melo H. P., Rossi Mori L. & Loreto V. (2026), “The dimensions of accessibility: proximity, opportunities, values”, EPJ Data Science 15:22, doi:10.1140/epjds/s13688-026-00623-8 です。Car Dependency Index は Campanelli B., Marzolla F., Bruno M., Melo H. P. M. & Loreto V. (2026), “Car Dependency in Urban Accessibility”, arXiv:2604.01019 です。「研究」ページに、データセットとあわせて両方を掲載しています。',
      },
      {
        q: 'アトラスは無料で使えますか？',
        a: 'はい。可視化のコードは MIT ライセンス、公開データセットは CC BY-NC 4.0 で、非営利目的であれば、出典を明記したうえで自由に利用、共有、改変できます。商用利用には書面による許可が必要です。論文自体は CC BY 4.0 のオープンアクセスです。',
      },
    ],
  },

  about: {
    eyebrow: '持続可能な都市',
    headline: '都市についての研究です。',
    headlineAccent: '製品ではありません。',
    lede: '私たちは非営利の研究チームであり、Sony Computer Science Laboratories（ローマ）の研究ラインの1つです。ローマ・ラ・サピエンツァ大学、エンリコ・フェルミ研究センター（CREF）などの研究機関の共同研究者とともに活動しています。アトラスは、その研究から生まれたものの1つです。',
    labLink: 'Sony CSL ↗',
    teamLink: 'メンバー →',

    doTitle: '私たちの活動',
    do: {
      measure: {
        tag: '測る',
        title: '都市が何へのアクセスを与えているかを測ります',
        desc: '近接性、機会、そして誠実にできる場合には到達先の価値を、道路網、時刻表、サービス、人口に関するオープンデータから、セルごとに計算します。',
      },
      compare: {
        tag: '比べる',
        title: '都市を比較可能にします',
        desc: 'どの都市も、同じ方法、同じグリッド、同じ尺度で測ります。だからこそ、ある都市の数字が別の都市の数字と並べて意味を持つのです。',
      },
      publish: {
        tag: '公開する',
        title: '手法とデータを公開します',
        desc: '査読付き論文、ダウンロード可能なデータセット、オープンなコード。都市計画の判断に使われる測定は、その判断の影響を受ける人々が確かめられるものであるべきです。',
      },
    },

    withTitle: '協働する相手',
    withBody:
      'このグループは Sony CSL Rome の中にあり、CREF との共同イニシアティブに置かれています。研究は、サピエンツァ大学をはじめとする国内外の大学や研究機関の共同研究者とともに進めています。博士課程と修士課程の学生は、その枠組みの一部としてアトラスに取り組んでいます。',
    withBody2:
      '自治体、研究グループ、NGO とも協働しています。多くの場合、誰かがアクセスについて根拠のある議論をする必要があるからです。あなたがそうであれば、お問い合わせページから始めてください。',

    projectsTitle: 'その他のプロジェクト',
    projectsHint: '4つのレイヤー以外',
    projects: {
      whatif: {
        tag: 'プラットフォーム',
        name: 'WhatIf',
        desc: 'ラボのモジュール型都市シミュレーション・プラットフォームで、15-minute city と CityChrone のオリジナルのビューアもここにあります。',
      },
      maps3d: {
        tag: 'ライブマップ',
        name: '3D マップ',
        desc: '都市の不平等を3次元で読み解きます。都市の格差の重さを、面として描いたものです。',
      },
      bikeLanes: {
        tag: '論文',
        name: '自転車レーンの計画',
        desc: '道路幅を考慮したネットワーク最適化。収まるべき道路を踏まえて、自転車ネットワークを次にどこへ広げるべきか。',
      },
    },
    labCta: 'Sony CSL を見る',
  },

  citychat: {
    eyebrow: 'CityChat · ベータ',
    headline: 'アトラスに聞く',
    headlineAccent: 'あなたの街のこと。',
    lede: 'レイヤーの意味、都市どうしの比較、ある場所の状況などを質問すると、CityChat が公開データに基づいて答えます。地図と同じコードを呼び出せる AI モデルで、引用する数値はすべて、そのコードが返した結果と照合されます。',
    beta: 'ベータ',
    persona: {
      label: '質問する立場',
      citizen: '住民',
      policy: '政策・計画',
      research: '研究者',
      press: '記者',
    },
    city: {
      label: '都市',
      any: 'すべての都市',
    },
    suggestionsTitle: '質問の例',
    suggestions: {
      citizen: [
        '{city}で歩いて医者に行くにはどれくらいかかりますか？',
        '{city}では車と公共交通、どちらが移動しやすいですか？',
        '15分都市レイヤーのセルの色は何を表していますか？',
      ],
      policy: [
        '{city}で、サービスへのアクセスが悪い人が多く住んでいるのはどこですか？',
        '車への依存度について、{city}は他の都市と比べてどうですか？',
        '{city}の住民のうち完全な孤立状態にある人の割合は？それは何を意味しますか？',
      ],
      research: [
        'P.O.V. のゾーンの閾値はどのように計算されていますか？',
        '{city}における「セルの割合」と「住民の割合」の違いは何ですか？',
        '{city}の公共交通の速度は一日の中でどう変わりますか？',
      ],
      press: [
        '平均的な住民にとって、最も車への依存が低い公開都市はどこですか？',
        '{city}のアクセシビリティを一文で公平にまとめると？',
        'これらの数値を報じるとき、誤解を招く書き方とはどんなものですか？',
      ],
    },
    placeholder: 'レイヤー、都市、場所について質問…',
    send: '送信',
    stop: '停止',
    reset: '新しい会話',
    you: 'あなた',
    assistant: 'CityChat',
    working: 'データを読み込んでいます…',
    answeredBy: '回答モデル：{model}',
    switching: '{model} に切り替えています…',
    writing: '回答を書いています…',
    verifying: '数値を確認中',
    checking: '数値を確認しています…',
    consulted: '計算元',
    showOnMap: '地図で見る',
    cell: 'セル',
    unverified: '次の数値はデータまでたどれず、誤っている可能性があります：{list}。',
    tools: {
      list_cities: '公開都市',
      city_overview: '都市の概要',
      layer_detail: 'レイヤーの詳細',
      rank_cells: 'セルの順位',
      cell_at: '1つのセル',
      compare_cities: '都市の比較',
    },
    status: {
      checking: 'サービスに接続しています…',
      online: 'モデル：{provider}',
      reserve: '（予備 {count} 件）',
      offline: 'このサイトのコピーからは CityChat サービスに接続できません。',
      disabled: 'このサイトのコピーでは CityChat が有効になっていません。',
    },
    errors: {
      unavailable: '現在 CityChat サービスに接続できません。',
      rate_limited: '短時間に質問が多すぎます。数分後にもう一度お試しください。',
      busy: 'CityChat が混み合っています。少し待ってからお試しください。',
      too_long: '会話が長くなりすぎました。新しい会話を始めてください。',
      provider: 'モデルが回答できませんでした。言い換えるか、もう一度質問してください。',
      quota: '現在、すべてのモデルが無料枠を使い切っています。1〜2分後にもう一度お試しください。',
      too_many_steps: 'この質問は手順が多すぎました。もっと絞った質問をお試しください。',
    },
    disclaimer: '試験運用中です。回答は AI モデルが書いており、誤りを含むことがあります。数値は公開データから計算されていますが、その周りの文章はそうではありません。質問はモデルの提供元に送信されます。個人情報は含めないでください。',
  },

  stats: {
    eyebrow: '統計',
    headline: '都市を',
    headlineAccent: '比較する。',
    lede: '公開済みのすべての都市を、すべての指標（近接性、機会、自動車依存、ゾーン構成）で並べて並べ替えられる1つの画面です。',
    emptyTitle: 'まだ準備中です',
    emptyBody:
      'このタブでは、4つのレイヤーを通じて都市を一度に比較する予定です。それができるまでは、あえて空にしています。もっともらしい数字が並ぶページは、数字がないと正直に言うページより悪いからです。すでにあるものは以下のとおりです。',
    availableTitle: '現在比較できるもの',
    availableHint: '一度に1つのプラットフォーム',
    compare: {
      fifteen: 'このプラットフォームが公開したすべての都市を並べて表示します。',
      citychrone: 'このプラットフォームが公開したすべての都市を並べて表示します。',
      cardep:
        '22の都市すべてを平均的な居住者の指数で順位付けし、指数に沿った居住者の分布もあわせて示します。',
      pov: '18の都市すべてを4つのゾーンの構成で示します。セル単位でも居住者単位でも数えられ、もとになるスコアも表示します。',
    },
  },

  consulting: {
    eyebrow: 'コンサルティング',
    headline: '都市の課題に取り組んでいますか？',
    headlineAccent: 'ご相談ください。',
    lede: '計画、サービス、投資判断、評価のためにアクセスを測る必要がある行政機関、公的機関、企業の方は、ご相談ください。問いを教えていただければ、私たちの手法で答えられるものかどうかを率直にお伝えします。',
    cta: 'メールで問い合わせる',
    whoTitle: '対象',
    who: {
      policy: {
        tag: '公共部門',
        title: '政策立案者',
        desc: '路線、サービス、施設をどこに置くべきかを決め、それが実際に誰に届くのかを事前に知る必要がある都市、地域、交通当局、公的機関。',
      },
      company: {
        tag: '民間部門',
        title: '企業',
        desc: '立地、サービス設計、モビリティなど、都市への到達のしやすさに判断が左右される組織。あるいは、厳しい検証に耐える報告書の根拠を必要とする組織。',
      },
    },
    note:
      'ライセンスについて：公開データセットは CC BY-NC 4.0 のため、商用利用には書面による許可が必要です。それは断りではなく話し合いの始まりで、連絡先はどちらの場合も同じです。',
  },

  contact: {
    eyebrow: 'お問い合わせと協働',
    headline: 'イタリア、ローマ。',
    headlineAccent: '協働を歓迎します。',
    lede: '私たちは、自治体、研究グループ、NGO、そしてアクセスについて根拠のある議論をしようとするすべての人と協働しています。あなたの都市をアトラスに載せたい、論文で地図を再利用したい、あるいはここに何か間違いがありそうだ。そんなときはご連絡ください。',
    fields: {
      address: '住所',
      general: '一般',
      code: 'コード',
      phone: '電話',
    },
    // A postal address: kept as it is written, in English.
    addressValue:
      'Sony Computer Science Laboratories, Rome\nJoint Initiative CREF-SONY\nCentro Studi e Ricerche “Enrico Fermi” – CREF\nVia Panisperna, 89/a\n00184 Rome\nEntrance: Piazza del Viminale, 1, Rome',
    teamTitle: 'チーム',
    // Japanese has no gender agreement either; the M/F pairs keep the shape.
    roles: {
      director: '研究代表者・ディレクター',
      assistant: 'アシスタント研究員',
      staffResearcherM: '研究員',
      staffResearcherF: '研究員',
      consultantM: 'コンサルタント・研究員',
      consultantF: 'コンサルタント・研究員',
      sapienzaResearcherM: '研究員（サピエンツァ大学）',
      sapienzaResearcherF: '研究員（サピエンツァ大学）',
      sapienzaPhdM: '博士課程学生（サピエンツァ大学）',
      sapienzaPhdF: '博士課程学生（サピエンツァ大学）',
      visitingPhdM: '客員博士課程学生',
      visitingPhdF: '客員博士課程学生',
      communications: 'シニア・コーポレートコミュニケーション＆イベントマネージャー',
      developerM: 'フルスタック・ソフトウェア開発者',
      developerF: 'フルスタック・ソフトウェア開発者',
      admin: 'シニア事務担当',
      phdM: '博士課程学生',
      phdF: '博士課程学生',
      masterM: '修士課程学生',
      masterF: '修士課程学生',
      researcherM: '研究員',
      researcherF: '研究員',
      visitingResearcherM: '客員研究員',
      visitingResearcherF: '客員研究員',
      hiring: '一緒に働きませんか',
    },
    joinName: 'あなたも？',
    formerTitle: '元メンバー',
  },

  research: {
    eyebrow: '研究成果',
    headline: '論文、データ',
    headlineAccent: 'そしてコード。',
    lede: 'アトラスの手法は公開されており、データセットはダウンロードできます。論文が準備中のプラットフォームはその旨を記しています。地図は表示しますが、引用を作り上げることはしません。',
    papersTag: '01',
    papersTitle: '論文',
    papersHint: '査読付き論文とプレプリント',
    datasetsTag: '02',
    datasetsTitle: 'データセットとコード',
    datasetsHint: 'CC BY-NC 4.0 · MIT',
    citeTitle: 'アトラスの引用方法',
    inPreparation: '準備中',
    preprint: 'プレプリント',
    columns: { dataset: 'データセット', coverage: '対象範囲', format: '形式', licence: 'ライセンス' },
  },

  blog: {
    eyebrow: 'ブログ',
    headline: 'アトラスからの',
    headlineAccent: 'ノート。',
    lede: '私たちが何を測り、どう測り、地図が何を示し何を示さないかについての長めの文章です。記事は英語とイタリア語で書かれています。',
    readingTime: '約{count}分で読めます',
    backToBlog: '← すべての記事',
    published: '公開日',
    postsLabel: '記事',
  },

  work: {
    eyebrow: '一緒に働く',
    headline: '現在、募集中の',
    headlineAccent: 'ポジションはありません。',
    lede: '現時点では、資金のあるポジションの募集は行っていません。ただし、都市のアクセシビリティに本気で取り組みたい学生からの連絡はいつでも歓迎しています。そうした対話は、たいていポジションが生まれるずっと前から始まります。',
    openTitle: '受け入れていること',
    positionsTitle: '現在の募集',
    noPositions: '現在、資金のあるポジションの募集はありません。',
    noPositionsDetail:
      '募集が始まったら、ここと Sony CSL の採用ページに掲載します。順番待ちのリストはなく、存在しない職への応募書類は保管しません。',
    routes: {
      phd: {
        title: '博士課程学生',
        desc: 'イタリア国内外の大学と博士課程の研究を共同指導しています。テーマは多くの場合、アクセシビリティの測定、交通ネットワーク分析、都市の統計物理学です。資金は通常、私たちではなく受け入れ大学の博士課程を通じて提供されるため、その課程の締め切りの数か月前に相談を始めるのが最適です。',
      },
      thesis: {
        title: '修士論文',
        desc: 'アトラスの明確な一部分に取り組む修士課程の学生を受け入れています。新しい都市、手法の比較、独立したデータによる指数の検証などです。期間はおよそ6か月、実際のデータセットを使い、結果が確かなものであれば公開されます。',
      },
      internship: {
        title: 'インターンシップ',
        desc: 'より短く焦点を絞った受け入れで、通常3〜6か月です。データパイプライン、地理空間処理、これらのプラットフォームのフロントエンド開発など。役立つ経験は、Python と地理空間ツール、あるいはモダンな JavaScript と地図描画です。',
      },
    },
    howTitle: '連絡の方法',
    howBody:
      '取り組みたい内容とその理由の短い説明、CV、そして（あれば）自分で作ったものや書いたもののリンクを添えて、{email} までご連絡ください。論文やプラットフォームに具体的に踏み込んだ提案は、一般的な関心の表明よりはるかに価値があります。',
    expectTitle: '連絡後の流れ',
    expectBody:
      'すべてのメッセージに目を通し、取り組める提案には返信します。小さなチームのため、すべてのメッセージに詳しいフィードバックはできません。返信が遅くても、それはあなたの応募への評価ではありません。',
    cta: 'メールで問い合わせる',
  },

  footer: {
    description:
      'Sony CSL（ローマ）の「持続可能な都市」チームによる、都市のアクセスについてのオープンな研究。手法、地図、データを公開し、自由に再利用できます。',
    platforms: 'プラットフォーム',
    research: '研究',
    researchLinks: ['論文', 'データセット', 'ブログ', 'FAQ'],
    about: '概要',
    aboutLinks: ['持続可能な都市', 'チーム', '連絡先', 'コンサルティング', '一緒に働く'],
    touch: 'つながる',
    touchLinks: ['GitHub', 'ニュースレター'],
    workCta: '一緒に働く →',
    copyright: '© 2026 Sony Computer Science Laboratories · Rome',
    version: 'コード MIT · データ CC BY-NC 4.0',
  },

  notFound: {
    eyebrow: 'エラー404',
    headline: '地図の',
    headlineAccent: '外です。',
    lede: 'そのページはアトラスにはありません。プラットフォームを見るか、ホームページに戻ってください。',
    cta: 'アトラスに戻る',
  },
};
