// direction-a.jsx — "Editorial Atlas" direction.
// Warm cream paper, Instrument Serif display + IBM Plex Sans body + Plex Mono captions.
// Brand colors used sparingly as accents.

const A = {
  paper:  '#F4EFE4',
  paperAlt:'#EAE3D2',
  ink:    '#1A1812',
  ink2:   '#3D372C',
  ink3:   '#6E6655',
  hair:   'rgba(26,24,18,0.12)',
  hairSoft:'rgba(26,24,18,0.06)',
  card:   '#FBF8EF',
  accent: BRAND.navy,
  hot:    BRAND.magenta,
  cool:   BRAND.cyan,
  serif:  '"Instrument Serif", "Source Serif 4", Georgia, serif',
  sans:   '"IBM Plex Sans", system-ui, sans-serif',
  mono:   '"IBM Plex Mono", "SFMono-Regular", monospace',
};

const aBase = {
  fontFamily: A.sans, color: A.ink, background: A.paper,
  WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility',
};

// ───── Chrome ─────
function ANav({ active = 'home', faint = false }) {
  const items = ['Atlas','Platforms','Research','FAQ','Contact'];
  return (
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'18px 48px',borderBottom:`1px solid ${A.hair}`,
      background:faint?'rgba(244,239,228,0.85)':A.paper,backdropFilter:'blur(6px)',
      position:'relative',zIndex:5,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <SonyMark size={26} />
        <div style={{fontFamily:A.sans,fontSize:12,letterSpacing:'0.14em',color:A.ink2,textTransform:'uppercase'}}>
          Sony&nbsp;CSL · Rome &nbsp;/&nbsp; Sustainable Cities
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:32,fontFamily:A.sans,fontSize:13.5}}>
        {items.map(i => (
          <span key={i} style={{
            color: i.toLowerCase()===active?A.ink:A.ink3,
            borderBottom: i.toLowerCase()===active?`1px solid ${A.ink}`:'1px solid transparent',
            paddingBottom:2,cursor:'pointer',
          }}>{i}</span>
        ))}
        <span style={{fontFamily:A.mono,fontSize:11,color:A.ink3,letterSpacing:'0.05em'}}>EN · IT</span>
      </div>
    </div>
  );
}

function AFooter() {
  return (
    <div style={{borderTop:`1px solid ${A.hair}`,padding:'40px 48px 32px',background:A.paperAlt}}>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr',gap:48,marginBottom:32}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
            <SonyMark size={24}/>
            <div style={{fontFamily:A.serif,fontSize:22,lineHeight:1}}>Access Atlas</div>
          </div>
          <div style={{fontFamily:A.sans,fontSize:13,color:A.ink3,lineHeight:1.55,maxWidth:280}}>
            A research initiative of Sony CSL — Rome, Sustainable Cities team. Open data, open code, open city.
          </div>
        </div>
        {[
          {h:'Platforms',l:['15min-City','CityChrone++','Car Dependency Index','Urban Accessibility P.O.V.']},
          {h:'Research',l:['Papers','Datasets','GitHub','Citations']},
          {h:'About',l:['Team','Methodology','FAQ','Press']},
        ].map(col => (
          <div key={col.h}>
            <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.16em',color:A.ink3,textTransform:'uppercase',marginBottom:14}}>{col.h}</div>
            {col.l.map(i => <div key={i} style={{fontSize:13,color:A.ink2,marginBottom:8}}>{i}</div>)}
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',paddingTop:20,borderTop:`1px solid ${A.hair}`,fontFamily:A.mono,fontSize:11,color:A.ink3,letterSpacing:'0.04em'}}>
        <span>© 2026 Sony Computer Science Laboratories · Rome</span>
        <span>v2.0 · Updated May 2026 · CC BY-NC 4.0</span>
      </div>
    </div>
  );
}

// ───── Home ─────
function AHome() {
  return (
    <div style={{...aBase,width:'100%',height:'100%',overflow:'hidden'}}>
      <ANav active="atlas" />

      {/* Hero */}
      <div style={{padding:'72px 48px 56px',position:'relative'}}>
        <div style={{fontFamily:A.mono,fontSize:11,letterSpacing:'0.18em',color:A.ink3,textTransform:'uppercase',marginBottom:24}}>
          Atlas&nbsp;&nbsp;·&nbsp;&nbsp;Vol. II&nbsp;&nbsp;·&nbsp;&nbsp;Cities &amp; Access
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:56,alignItems:'end'}}>
          <h1 style={{fontFamily:A.serif,fontSize:104,lineHeight:0.95,letterSpacing:'-0.025em',margin:'0 0 22px',fontWeight:400}}>
            How close <em style={{fontStyle:'italic',color:A.accent}}>is</em> your<br/>
            city to a fair, <em style={{fontStyle:'italic',color:A.hot}}>walkable</em>,<br/>
            connected life?
          </h1>
          <div style={{fontFamily:A.sans,fontSize:15,lineHeight:1.65,color:A.ink2,paddingBottom:14,maxWidth:380}}>
            The <strong>Access Atlas</strong> gathers four research platforms from the Sustainable Cities team at Sony CSL — Rome — each one mapping a different facet of how urban places give or withhold access. Open data, peer-reviewed methods, every city on the planet.
            <div style={{marginTop:18,display:'flex',gap:10,alignItems:'center',fontFamily:A.mono,fontSize:11,letterSpacing:'0.06em',color:A.ink3,textTransform:'uppercase'}}>
              <span>Begin exploring</span>
              <span style={{width:32,height:1,background:A.ink3}}/>
              <Icon name="arrowDown" size={14}/>
            </div>
          </div>
        </div>
      </div>

      {/* Atlas metrics strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',borderTop:`1px solid ${A.hair}`,borderBottom:`1px solid ${A.hair}`,background:A.paperAlt}}>
        {[
          {k:'10,142', l:'Cities mapped'},
          {k:'4', l:'Active platforms'},
          {k:'182', l:'Countries covered'},
          {k:'14', l:'Researchers'},
          {k:'2018', l:'Year founded'},
        ].map((s,i)=>(
          <div key={i} style={{padding:'24px 28px',borderRight:i<4?`1px solid ${A.hair}`:'none'}}>
            <div style={{fontFamily:A.serif,fontSize:36,lineHeight:1,marginBottom:6}}>{s.k}</div>
            <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase'}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* The journey */}
      <div style={{padding:'80px 48px 24px'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:24,marginBottom:48}}>
          <div style={{fontFamily:A.mono,fontSize:11,letterSpacing:'0.18em',color:A.ink3,textTransform:'uppercase'}}>§ 01</div>
          <div style={{fontFamily:A.serif,fontSize:44,lineHeight:1,letterSpacing:'-0.015em'}}>The four chapters of urban access</div>
        </div>
        <div style={{fontFamily:A.sans,fontSize:14,lineHeight:1.65,color:A.ink2,maxWidth:620,marginBottom:56}}>
          Access is not one thing. A neighbourhood can be rich in shops yet starved of jobs; a metro line can connect a worker to the city while leaving the next street behind. Our platforms unbundle access into three layers — <em>proximity</em>, <em>opportunity</em>, and the elusive <em>value</em> of place — and let you read them, city by city.
        </div>

        {/* The four cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:32}}>
          {[
            { idx:'01', tag:'Proximity', name:'15min-City', sub:'How walkable is your daily life?',
              body:'A high-resolution map of every world city, scored against the 15-minute-city ideal: services, schools, food, healthcare within a quarter-hour on foot.', variant:'fifteen', color:'#b94e3b' },
            { idx:'02', tag:'Opportunity', name:'CityChrone++', sub:'How far can transit take you?',
              body:'Replaces distance with travel time. Watch the city deform in your hands as public-transport speed reshapes what is reachable from anywhere.', variant:'citychrone', color:BRAND.navy },
            { idx:'03', tag:'Comparison', name:'Car Dependency Index', sub:'Transit vs. private car, cell by cell.',
              body:'For every hex of a city, how many more places can you reach with a car than with the bus? Blue cells favour transit; red cells require a car.', variant:'cardep', color:'#a04640' },
            { idx:'04', tag:'Synthesis', name:'Urban Accessibility P.O.V.', sub:'Proximity · Opportunity · Value.',
              body:'A framework that pairs walkable amenities with transit-reach, splitting the city into Inclusion, Spatial Isolation, Social Isolation, and Total Isolation.', variant:'pov', color:BRAND.navy },
          ].map(c => (
            <div key={c.idx} style={{
              background:A.card,border:`1px solid ${A.hair}`,borderRadius:2,
              padding:'28px 28px 24px',display:'grid',gridTemplateColumns:'1fr',gap:18,
              position:'relative',transition:'transform .2s ease, box-shadow .2s ease',
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase'}}>§ {c.idx} &nbsp;·&nbsp; {c.tag}</div>
                  <div style={{fontFamily:A.serif,fontSize:36,lineHeight:1.05,marginTop:8}}>{c.name}</div>
                  <div style={{fontFamily:A.serif,fontStyle:'italic',fontSize:18,color:A.ink3,marginTop:2}}>{c.sub}</div>
                </div>
                <div style={{width:8,height:8,borderRadius:'50%',background:c.color,marginTop:6,boxShadow:`0 0 0 4px ${c.color}22`}}/>
              </div>
              <div style={{height:140,borderRadius:2,overflow:'hidden',border:`1px solid ${A.hairSoft}`}}>
                <WorldMap variant={c.variant} paper="#F8F5EC" land="#E1D8C2" />
              </div>
              <div style={{fontSize:13.5,lineHeight:1.6,color:A.ink2}}>{c.body}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:10,borderTop:`1px solid ${A.hair}`,fontFamily:A.mono,fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase',color:A.accent}}>
                <span>Open platform</span>
                <Icon name="arrow" size={14} color={A.accent}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side projects */}
      <div style={{padding:'72px 48px 24px',marginTop:32,borderTop:`1px solid ${A.hair}`}}>
        <div style={{display:'flex',alignItems:'baseline',gap:24,marginBottom:36}}>
          <div style={{fontFamily:A.mono,fontSize:11,letterSpacing:'0.18em',color:A.ink3,textTransform:'uppercase'}}>§ 02</div>
          <div style={{fontFamily:A.serif,fontSize:32,lineHeight:1}}>Side projects &amp; future work</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
          {[
            { n:'whatif-machine', d:'The original modular platform — rethinking cities through what-if scenarios.', tag:'Archive' },
            { n:'Pedestrian Heat', d:'How heat-exposed are pedestrian routes? Coming Q3 2026.', tag:'Upcoming' },
            { n:'Accessibility for All', d:'Mapping the city through a wheelchair user\u2019s perspective.', tag:'In progress' },
            { n:'Soundscapes', d:'Acoustic accessibility — where can you simply hear the city?', tag:'Concept' },
          ].map(s => (
            <div key={s.n} style={{padding:'22px 20px',background:A.paperAlt,border:`1px solid ${A.hair}`,borderRadius:2}}>
              <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',marginBottom:14}}>{s.tag}</div>
              <div style={{fontFamily:A.serif,fontSize:22,lineHeight:1.1,marginBottom:10}}>{s.n}</div>
              <div style={{fontSize:13,lineHeight:1.5,color:A.ink2}}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pull quote */}
      <div style={{padding:'80px 48px 56px',display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:64,alignItems:'center'}}>
        <div style={{fontFamily:A.mono,fontSize:11,letterSpacing:'0.18em',color:A.ink3,textTransform:'uppercase'}}>From the team —</div>
        <div style={{fontFamily:A.serif,fontSize:32,lineHeight:1.25,letterSpacing:'-0.01em',color:A.ink}}>
          “A city is a promise of <em style={{color:A.hot}}>nearness</em>: that the things you need are within reach. The Atlas asks, for every place on Earth, whether that promise is being kept.”
          <div style={{marginTop:18,fontFamily:A.sans,fontStyle:'normal',fontSize:13,color:A.ink3,letterSpacing:'0.02em'}}>— Sustainable Cities team · Sony CSL Rome</div>
        </div>
      </div>

      <AFooter/>
    </div>
  );
}

// ───── Platform landing (A-style) ─────
// One shared layout, parameterised per platform.
function ALanding({ platform }) {
  const PLATFORMS = {
    fifteen:    { name:'15min-City',  tagline:'Proximity access · Every world city',
                  intro:'A platform that scores how close every neighbourhood is to the 15-minute-city ideal: services, schools, food, healthcare reachable on foot or by bike. Click a city to open its map of accessibility times, or browse the global rankings below.',
                  legend:[ ['0–3','#3b6e8f'],['3–6','#6c93b1'],['6–9','#9ab9cf'],['9–12','#cfd9da'],['12–15','#e9b6a3'],['15–18','#d57b66'],['18–21','#b94e3b'],['21–24','#8a2c1c'],['24–30','#5e1a0d'] ],
                  legendUnit:'Avg. proximity time (min)',
                  cta:'10,142 cities · Click any dot to enter',
                  variant:'fifteen' },
    citychrone: { name:'CityChrone++', tagline:'Opportunity access · Public-transport reach',
                  intro:'CityChrone++ replaces distance with travel time. Watch the city deform under your fingertips as public transport reshapes what is reachable from any point — and run "what-if" scenarios for new metro lines.',
                  legend:[ ['Slow','#d9dfe9'],['Medium',BRAND.cyan],['Fast',BRAND.navy] ],
                  legendUnit:'Velocity score',
                  cta:'42 cities · Choose one to begin',
                  variant:'citychrone' },
    cardep:     { name:'Car Dependency Index', tagline:'Public transport vs. private car',
                  intro:'A high-resolution measure of how much more reachable opportunities are by car than by public transport. Blue cells favour transit; red cells require a car. Based on Campanelli et al., 2026.',
                  legend:[ ['Transit-friendly','#4a7fb8'],['Mixed','#cfd2c8'],['Car-dependent','#a04640'],['Car-only','#7a2e29'] ],
                  legendUnit:'CDI ratio',
                  cta:'19 study cities · Compare any pair',
                  variant:'cardep' },
    pov:        { name:'Urban Accessibility P.O.V.', tagline:'Proximity · Opportunity · Value',
                  intro:'Each city is mapped across two dimensions: Proximity (walkable local services) and Opportunity (fast transit reach). A third dimension, the intrinsic Value of places, has yet to be quantified. Click any pin to explore.',
                  legend:[ ['Inclusion','#3b8a4f'],['Spatial Isolation',BRAND.cyan],['Social Isolation','#e0a23a'],['Total Isolation','#c54a3a'] ],
                  legendUnit:'Zone type',
                  cta:'19 study cities · Click a pin',
                  variant:'pov' },
  };
  const p = PLATFORMS[platform];

  return (
    <div style={{...aBase,width:'100%',height:'100%',overflow:'hidden',position:'relative'}}>
      <ANav active="platforms" faint />

      {/* Map background */}
      <div style={{position:'absolute',inset:'68px 0 0 0',zIndex:0}}>
        <WorldMap variant={p.variant} paper="#F1ECDE" land="#DDD2BA" />
      </div>

      {/* Sub-header strip */}
      <div style={{position:'relative',zIndex:2,padding:'20px 48px',background:'rgba(244,239,228,0.78)',backdropFilter:'blur(6px)',borderBottom:`1px solid ${A.hair}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:18}}>
          <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.16em',color:A.ink3,textTransform:'uppercase'}}>Platform</div>
          <div style={{fontFamily:A.serif,fontSize:32,lineHeight:1}}>{p.name}</div>
          <div style={{fontFamily:A.serif,fontStyle:'italic',fontSize:16,color:A.ink3}}>{p.tagline}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:A.card,border:`1px solid ${A.hair}`,borderRadius:2,width:320}}>
          <Icon name="search" size={14} color={A.ink3}/>
          <span style={{fontSize:13,color:A.ink3}}>Search your city…</span>
        </div>
      </div>

      {/* Floating intro */}
      <div style={{position:'absolute',top:140,left:48,zIndex:3,width:340,background:A.card,border:`1px solid ${A.hair}`,padding:'22px 24px',borderRadius:2,boxShadow:'0 16px 40px rgba(26,24,18,0.08)'}}>
        <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',marginBottom:10}}>Welcome to {p.name}</div>
        <div style={{fontSize:13.5,lineHeight:1.6,color:A.ink2,marginBottom:16}}>{p.intro}</div>
        <div style={{paddingTop:14,borderTop:`1px solid ${A.hair}`,display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:A.mono,fontSize:11,letterSpacing:'0.05em',color:A.accent}}>
          <span>{p.cta}</span>
          <Icon name="arrow" size={14} color={A.accent}/>
        </div>
      </div>

      {/* Legend */}
      <div style={{position:'absolute',top:140,right:48,zIndex:3,background:A.card,border:`1px solid ${A.hair}`,padding:'14px 16px',borderRadius:2,minWidth:180}}>
        <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',marginBottom:10}}>{p.legendUnit}</div>
        {p.legend.map(([l,c]) => (
          <div key={l} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,fontSize:12,color:A.ink2}}>
            <span style={{width:14,height:14,background:c,borderRadius:2,display:'inline-block'}}/>
            <span>{l}</span>
          </div>
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{position:'absolute',bottom:80,right:48,zIndex:3,background:A.card,border:`1px solid ${A.hair}`,borderRadius:2,display:'flex',flexDirection:'column'}}>
        <button style={{width:36,height:36,border:'none',background:'transparent',borderBottom:`1px solid ${A.hair}`,cursor:'pointer'}}><Icon name="plus" size={14} color={A.ink2}/></button>
        <button style={{width:36,height:36,border:'none',background:'transparent',cursor:'pointer'}}><Icon name="minus" size={14} color={A.ink2}/></button>
      </div>

      {/* Bottom attribution */}
      <div style={{position:'absolute',bottom:24,left:48,zIndex:3,fontFamily:A.mono,fontSize:10,letterSpacing:'0.06em',color:A.ink3}}>
        © Sony CSL Rome · Data: OpenStreetMap, GTFS · Tiles: Leaflet
      </div>
    </div>
  );
}

// ───── City detail (P.O.V. style for Rome) ─────
function ACity() {
  const summary = [
    ['Total hexagons','8,089'],['Median proximity','644 m'],['Median opportunity','2.7k jobs'],
    ['Inclusion rate','12.9%'],['Spatial isolation','2.7%'],['Social isolation','1.4%'],['Total isolation','83.0%'],
  ];
  const zones = [
    { name:'Inclusion',         c:'#3b8a4f',  desc:'High proximity · High opportunity' },
    { name:'Spatial Isolation', c:BRAND.cyan, desc:'High proximity · Low opportunity' },
    { name:'Social Isolation',  c:'#e0a23a',  desc:'Low proximity · High opportunity' },
    { name:'Total Isolation',   c:'#c54a3a',  desc:'Low proximity · Low opportunity' },
  ];

  // Procedural scatter & hex cells
  let s=42; const rand = () => { s=(s*1103515245+12345)%2147483647; return s/2147483647; };
  const scatter = Array.from({length:380},()=>{
    const r = rand(); const t = rand();
    const zone = r<0.35?0:r<0.55?1:r<0.7?2:3;
    return { x: 40+t*620, y: zones[zone].name==='Total Isolation'? 280+rand()*60 : 30+rand()*240, c:zones[zone].c };
  });

  return (
    <div style={{...aBase,width:'100%',height:'100%',overflow:'hidden'}}>
      <ANav active="platforms" />

      <div style={{padding:'20px 48px',display:'flex',alignItems:'baseline',gap:18,borderBottom:`1px solid ${A.hair}`}}>
        <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.16em',color:A.ink3,textTransform:'uppercase'}}>Urban Accessibility P.O.V.</div>
        <div style={{fontFamily:A.serif,fontSize:30}}>Rome</div>
        <div style={{fontFamily:A.serif,fontStyle:'italic',fontSize:15,color:A.ink3}}>Lazio, Italy · 8,089 hexagons</div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {['World map','Compare cities','Paper ↗','GitHub ↗'].map(t => (
            <span key={t} style={{fontSize:12,padding:'6px 12px',border:`1px solid ${A.hair}`,borderRadius:2,color:A.ink2}}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'240px 1fr 1fr',gap:0,height:'calc(100% - 132px)'}}>
        {/* Left panel */}
        <div style={{padding:'22px 22px',borderRight:`1px solid ${A.hair}`,overflowY:'hidden',background:A.paperAlt}}>
          <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',marginBottom:12}}>Zone type</div>
          {zones.map(z => (
            <div key={z.name} style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{width:14,height:14,background:z.c,borderRadius:2}}/>
                <span style={{fontFamily:A.serif,fontSize:16}}>{z.name}</span>
              </div>
              <div style={{fontSize:11,color:A.ink3,marginLeft:24,marginTop:2,fontFamily:A.mono}}>{z.desc}</div>
            </div>
          ))}

          <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',margin:'20px 0 10px'}}>City summary</div>
          <div style={{fontFamily:A.mono,fontSize:11}}>
            {summary.map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${A.hair}`,color:A.ink2}}>
                <span style={{color:A.ink3}}>{k}</span><span style={{color:A.ink,fontVariantNumeric:'tabular-nums'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cartogram */}
        <div style={{padding:'18px 24px',borderRight:`1px solid ${A.hair}`,display:'flex',flexDirection:'column'}}>
          <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',marginBottom:12}}>Cartogram · Hexagonal mesh</div>
          <div style={{flex:1,position:'relative',borderRadius:2,overflow:'hidden',background:'#FAF6E9'}}>
            <RomeCartogram zones={zones}/>
          </div>
        </div>

        {/* Scatter */}
        <div style={{padding:'18px 24px',display:'flex',flexDirection:'column'}}>
          <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',marginBottom:12}}>Scatter · Proximity vs. Opportunity</div>
          <div style={{flex:1,position:'relative'}}>
            <svg viewBox="0 0 700 360" style={{width:'100%',height:'100%'}}>
              {/* Quadrants */}
              <rect x="40" y="20" width="320" height="170" fill={BRAND.cyan} opacity="0.06"/>
              <rect x="360" y="20" width="300" height="170" fill="#3b8a4f" opacity="0.08"/>
              <rect x="40" y="190" width="320" height="140" fill="#c54a3a" opacity="0.06"/>
              <rect x="360" y="190" width="300" height="140" fill="#e0a23a" opacity="0.06"/>
              {/* Axes */}
              <line x1="40" y1="20" x2="40" y2="330" stroke={A.ink3} strokeWidth="0.5"/>
              <line x1="40" y1="330" x2="660" y2="330" stroke={A.ink3} strokeWidth="0.5"/>
              <line x1="40" y1="190" x2="660" y2="190" stroke={A.ink3} strokeDasharray="3 3" strokeWidth="0.5"/>
              <line x1="360" y1="20" x2="360" y2="330" stroke={A.ink3} strokeDasharray="3 3" strokeWidth="0.5"/>
              {/* Data */}
              {scatter.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="2.2" fill={p.c} opacity="0.85"/>)}
              {/* Quadrant labels */}
              <text x="60" y="42" fontFamily={A.mono} fontSize="10" fill={A.ink3} letterSpacing="0.1em">SPATIAL ISOLATION</text>
              <text x="380" y="42" fontFamily={A.mono} fontSize="10" fill={A.ink3} letterSpacing="0.1em">INCLUSION</text>
              <text x="60" y="320" fontFamily={A.mono} fontSize="10" fill={A.ink3} letterSpacing="0.1em">TOTAL ISOLATION</text>
              <text x="380" y="320" fontFamily={A.mono} fontSize="10" fill={A.ink3} letterSpacing="0.1em">SOCIAL ISOLATION</text>
              {/* Axis labels */}
              <text x="350" y="354" fontFamily={A.sans} fontSize="11" fill={A.ink2} textAnchor="middle" fontStyle="italic">Opportunity score</text>
              <text x="14" y="175" fontFamily={A.sans} fontSize="11" fill={A.ink2} textAnchor="middle" fontStyle="italic" transform="rotate(-90 14 175)">Proximity score</text>
            </svg>
          </div>
        </div>
      </div>

      <div style={{padding:'10px 48px',background:A.paperAlt,borderTop:`1px solid ${A.hair}`,fontFamily:A.mono,fontSize:10,color:A.ink3,letterSpacing:'0.06em',display:'flex',justifyContent:'space-between'}}>
        <span>Interactions: hover or click to cross-highlight · Scroll &amp; drag to navigate · Click legend to toggle types.</span>
        <span>Selected: — none —</span>
      </div>
    </div>
  );
}

function RomeCartogram({ zones }) {
  // Procedural hex grid for Rome footprint
  let s=11; const rand = () => { s=(s*1103515245+12345)%2147483647; return s/2147483647; };
  const hex = [];
  const cx=320, cy=190;
  for (let q=-22;q<=22;q++){
    for (let r=-14;r<=14;r++){
      const x = cx + q*8 + (r%2?4:0);
      const y = cy + r*7;
      const d = Math.hypot((x-cx)/1.4, (y-cy)/1.0);
      if (d > 130 + rand()*30) continue;
      let zone;
      if (d < 30) zone = rand() < 0.85 ? 0 : 1;
      else if (d < 55) zone = rand() < 0.55 ? 0 : rand()<0.6?1:2;
      else if (d < 85) zone = rand() < 0.3 ? 0 : 3;
      else zone = 3;
      hex.push({x,y,c:zones[zone].c});
    }
  }
  return (
    <svg viewBox="0 0 640 360" style={{width:'100%',height:'100%'}}>
      {/* Faint city base */}
      <rect x="0" y="0" width="640" height="360" fill="#F8F4E5"/>
      <g opacity="0.4" stroke="#cdbfa1" strokeWidth="0.4" fill="none">
        <path d="M 100 200 L 200 195 L 280 205 L 350 200 L 420 215 L 500 200" />
        <path d="M 150 100 L 200 150 L 250 180 L 300 190 L 350 200 L 380 250 L 420 300" />
        <circle cx="320" cy="190" r="120" />
      </g>
      {/* Place labels */}
      {[
        ['Bracciano',110,140],['Anguillara',150,180],['Cerveteri',155,230],['Fiumicino',195,270],
        ['Rome',310,200],['Fonte Nuova',390,160],['Tivoli',460,200],['Frascati',420,260],
        ['Pomezia',310,290],['Velletri',410,300],['Anzio',300,330],['Aprilia',290,320],
        ['Civita Castellana',360,90],['Monterotondo',390,135],
      ].map(([n,x,y]) => (
        <text key={n} x={x} y={y} fontFamily={A.sans} fontSize="9" fill={A.ink3} opacity="0.75">{n}</text>
      ))}
      {hex.map((h,i) => (
        <circle key={i} cx={h.x} cy={h.y} r="2.4" fill={h.c} opacity="0.85"/>
      ))}
    </svg>
  );
}

// ───── FAQ ─────
function AFAQ() {
  const faqs = [
    { q:'What does "access" mean in the Atlas?', a:'We use access as an umbrella for three measurable things: proximity (what is within walking distance), opportunity (what is reachable by transit in a given time), and value (the qualitative weight of those reachable places). Each of our four platforms touches one or more of these dimensions.' },
    { q:'Where does the data come from?', a:'Street networks and amenities are from OpenStreetMap. Public-transport networks come from open GTFS feeds. Population data is from WorldPop and JRC GHSL. All datasets and the code used to build the maps are open and citable.' },
    { q:'Why isn\u2019t my city included?', a:'Coverage depends on the quality of OSM and the availability of a usable GTFS feed. 15min-City covers ~10,000 cities; CityChrone++, the Car Dependency Index, and P.O.V. focus on a smaller set of well-documented study cities. Open an issue on GitHub and we will look into adding yours.' },
    { q:'Can I cite this work?', a:'Yes — each platform links to its underlying paper. The umbrella reference for the framework is Bruno et al., EPJ Data Science (2026); the Car Dependency Index is described in Campanelli et al., 2026.' },
    { q:'Is the Atlas free to use?', a:'Yes. The data is open under CC BY-NC 4.0; the code under MIT. Commercial use of the maps requires written permission.' },
    { q:'I found a bug / I want a feature.', a:'Each platform has a GitHub issue tracker linked in its footer. We respond to issues weekly during term time.' },
  ];

  return (
    <div style={{...aBase,width:'100%',minHeight:'100%',overflow:'hidden'}}>
      <ANav active="faq"/>

      <div style={{padding:'80px 48px 24px',display:'grid',gridTemplateColumns:'1fr 2fr',gap:48}}>
        <div>
          <div style={{fontFamily:A.mono,fontSize:11,letterSpacing:'0.18em',color:A.ink3,textTransform:'uppercase',marginBottom:18}}>§ 03 — Questions</div>
          <h1 style={{fontFamily:A.serif,fontSize:72,lineHeight:0.95,margin:'0 0 22px',fontWeight:400}}>Frequently<br/>asked.</h1>
          <div style={{fontFamily:A.sans,fontSize:14,lineHeight:1.6,color:A.ink2,maxWidth:340}}>
            Six common questions about the Atlas, its data and methods. Have something else? <span style={{borderBottom:`1px solid ${A.accent}`,color:A.accent}}>Write us</span> — we reply within a week.
          </div>
        </div>
        <div>
          {faqs.map((f,i) => (
            <details key={i} open={i===0} style={{borderTop:`1px solid ${A.hair}`,padding:'22px 0 24px'}}>
              <summary style={{listStyle:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:20}}>
                <div style={{display:'flex',gap:18,alignItems:'baseline'}}>
                  <span style={{fontFamily:A.mono,fontSize:11,color:A.ink3,letterSpacing:'0.08em'}}>{String(i+1).padStart(2,'0')}</span>
                  <span style={{fontFamily:A.serif,fontSize:24,lineHeight:1.25}}>{f.q}</span>
                </div>
                <Icon name={i===0?'minus':'plus'} size={16} color={A.ink3}/>
              </summary>
              {i===0 && <div style={{marginTop:14,paddingLeft:40,fontSize:14,lineHeight:1.65,color:A.ink2,maxWidth:560}}>{f.a}</div>}
            </details>
          ))}
          <div style={{borderTop:`1px solid ${A.hair}`,marginTop:0,padding:'22px 0',display:'flex',justifyContent:'space-between'}}>
            <span style={{fontFamily:A.mono,fontSize:11,color:A.ink3,letterSpacing:'0.08em'}}>↳ Still curious?</span>
            <span style={{fontFamily:A.serif,fontStyle:'italic',fontSize:18,color:A.accent}}>access-atlas@sonycsl.it ↗</span>
          </div>
        </div>
      </div>

      <AFooter/>
    </div>
  );
}

// ───── Contact ─────
function AContact() {
  const team = [
    { n:'Vittorio Loreto',     r:'Director · PI',         e:'vittorio.loreto@sony.com' },
    { n:'Bernardo Monechi',    r:'Senior Researcher',     e:'bernardo.monechi@sony.com' },
    { n:'Riccardo Di Clemente',r:'Senior Researcher',     e:'riccardo.diclemente@sony.com' },
    { n:'Matteo Bruno',        r:'Researcher · P.O.V.',   e:'matteo.bruno@sony.com' },
    { n:'Hygor Piaget Monteiro Melo', r:'Researcher · 15min-City', e:'hygor.melo@sony.com' },
    { n:'Indaco Biazzo',       r:'Researcher · CityChrone',e:'indaco.biazzo@sony.com' },
    { n:'Lorenzo Campanelli',  r:'Researcher · CDI',      e:'lorenzo.campanelli@sony.com' },
    { n:'You?',                r:'We hire.',              e:'careers@sony.com' },
  ];
  return (
    <div style={{...aBase,width:'100%',minHeight:'100%',overflow:'hidden'}}>
      <ANav active="contact"/>

      <div style={{padding:'80px 48px 24px',display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:64,alignItems:'start'}}>
        <div>
          <div style={{fontFamily:A.mono,fontSize:11,letterSpacing:'0.18em',color:A.ink3,textTransform:'uppercase',marginBottom:18}}>§ 04 — Contact</div>
          <h1 style={{fontFamily:A.serif,fontSize:84,lineHeight:0.92,letterSpacing:'-0.02em',margin:'0 0 24px',fontWeight:400}}>
            Talk to the<br/>team in <em style={{color:A.hot,fontStyle:'italic'}}>Rome</em>.
          </h1>
          <div style={{fontFamily:A.sans,fontSize:15,lineHeight:1.6,color:A.ink2,maxWidth:520,marginBottom:32}}>
            We collaborate with city governments, NGOs, universities and curious citizens. If your city should be on the Atlas, if you want to use our maps in a paper, or if you simply have an idea — write to us.
          </div>
          <div style={{padding:'22px 24px',background:A.card,border:`1px solid ${A.hair}`,borderRadius:2,maxWidth:520}}>
            <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',marginBottom:10}}>Sony CSL — Rome</div>
            <div style={{fontFamily:A.serif,fontSize:20,lineHeight:1.35}}>Joint Research Lab<br/>Sapienza Università di Roma<br/>Piazzale Aldo Moro, 5 — 00185 Roma, IT</div>
            <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${A.hair}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:13,color:A.ink2}}>
              <div><div style={{fontFamily:A.mono,fontSize:10,color:A.ink3,letterSpacing:'0.1em',textTransform:'uppercase'}}>Press</div>press@sony.com</div>
              <div><div style={{fontFamily:A.mono,fontSize:10,color:A.ink3,letterSpacing:'0.1em',textTransform:'uppercase'}}>Collab</div>access-atlas@sony.com</div>
              <div><div style={{fontFamily:A.mono,fontSize:10,color:A.ink3,letterSpacing:'0.1em',textTransform:'uppercase'}}>Code</div>github.com/sony-csl-rome</div>
              <div><div style={{fontFamily:A.mono,fontSize:10,color:A.ink3,letterSpacing:'0.1em',textTransform:'uppercase'}}>Tel</div>+39 06 49913333</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{fontFamily:A.mono,fontSize:10,letterSpacing:'0.14em',color:A.ink3,textTransform:'uppercase',marginBottom:14}}>The team</div>
          <div style={{borderTop:`1px solid ${A.hair}`}}>
            {team.map((m,i)=>(
              <div key={m.n} style={{padding:'18px 0',borderBottom:`1px solid ${A.hair}`,display:'grid',gridTemplateColumns:'1fr 1fr 1.2fr',gap:14,alignItems:'baseline'}}>
                <div style={{fontFamily:A.serif,fontSize:20,color:m.n==='You?'?A.hot:A.ink,fontStyle:m.n==='You?'?'italic':'normal'}}>{m.n}</div>
                <div style={{fontFamily:A.sans,fontSize:12.5,color:A.ink3}}>{m.r}</div>
                <div style={{fontFamily:A.mono,fontSize:11,color:A.ink2,textAlign:'right'}}>{m.e}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AFooter/>
    </div>
  );
}

Object.assign(window, { AHome, ALanding, ACity, AFAQ, AContact, A });
