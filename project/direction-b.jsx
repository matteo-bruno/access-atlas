// direction-b.jsx — "Cartographic Index" — smoothed.
// Warmer cool paper, IBM Plex Sans + Mono (mono used sparingly), gentle
// rounded corners, fewer hairlines. Brand colors as accents and data swatches.

const B = {
  paper:  '#F3F0E8',
  paperAlt:'#EBE7DC',
  card:   '#FBFAF4',
  ink:    '#15171A',
  ink2:   '#3E4147',
  ink3:   '#73767D',
  ink4:   '#9D9FA4',
  hair:   '#E1DCCE',
  hairSoft:'#EAE6DA',
  navy:   BRAND.navy,
  magenta:BRAND.magenta,
  cyan:   BRAND.cyan,
  gray:   '#9CA0A6',
  sans:   '"IBM Plex Sans", system-ui, sans-serif',
  mono:   '"IBM Plex Mono", "SFMono-Regular", monospace',
  serif:  '"Instrument Serif", Georgia, serif',
  radius: '6px',
};

const bBase = {
  fontFamily: B.sans, color: B.ink, background: B.paper,
  WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility',
};

// Tiny utility: small uppercase eyebrow label (used very sparingly).
function Eyebrow({ children, color = B.ink3, mono = false }) {
  return (
    <div style={{
      fontFamily: mono ? B.mono : B.sans,
      fontSize: 11, fontWeight: mono ? 400 : 500,
      letterSpacing: '0.14em', color, textTransform: 'uppercase',
    }}>{children}</div>
  );
}

// ───── Chrome ─────
function BNav({ active = 'atlas' }) {
  const items = [
    ['atlas','Atlas'],['platforms','Platforms'],['research','Research'],
    ['faq','FAQ'],['contact','Contact'],
  ];
  return (
    <div style={{
      display:'flex',alignItems:'center',padding:'18px 32px',
      borderBottom:`1px solid ${B.hair}`,background:B.card,position:'relative',zIndex:5,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginRight:'auto'}}>
        <SonyMark size={26}/>
        <div>
          <div style={{fontFamily:B.sans,fontSize:15.5,fontWeight:600,letterSpacing:'-0.015em',lineHeight:1}}>Access&nbsp;Atlas</div>
          <div style={{fontFamily:B.sans,fontSize:11,color:B.ink3,marginTop:3,letterSpacing:'0.02em'}}>Sony CSL · Rome — Sustainable Cities</div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        {items.map(([k,l]) => (
          <span key={k} style={{
            padding:'8px 14px',borderRadius:B.radius,fontSize:13.5,
            color: k===active?B.ink:B.ink3,
            background: k===active?B.paperAlt:'transparent',
            cursor:'pointer',
          }}>{l}</span>
        ))}
        <span style={{
          marginLeft:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:6,
          fontSize:13,color:B.ink2,border:`1px solid ${B.hair}`,borderRadius:B.radius,background:B.card,
        }}>
          <Icon name="github" size={14} color={B.ink2}/> GitHub
        </span>
        <span style={{
          marginLeft:6,padding:'8px 10px',fontFamily:B.mono,fontSize:11,color:B.ink3,letterSpacing:'0.06em',
        }}>EN · IT</span>
      </div>
    </div>
  );
}

function BFooter() {
  return (
    <div style={{borderTop:`1px solid ${B.hair}`,background:B.card}}>
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr',gap:0}}>
        <div style={{padding:'36px 32px 28px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <SonyMark size={22}/>
            <span style={{fontFamily:B.sans,fontWeight:600,fontSize:16}}>Access Atlas</span>
          </div>
          <div style={{fontSize:13,color:B.ink3,lineHeight:1.6,maxWidth:300}}>
            Open research on urban access from the Sustainable Cities team at Sony CSL — Rome. Maps, methods and data, free to use.
          </div>
        </div>
        {[
          {h:'Platforms',l:['15min-City','CityChrone++','Car Dependency','Accessibility P.O.V.']},
          {h:'Research',l:['Papers','Datasets','GitHub','Citations']},
          {h:'About',l:['Team','Methods','FAQ','Press']},
          {h:'Stay in touch',l:['Newsletter','Mastodon','Twitter / X','BlueSky']},
        ].map((c,i) => (
          <div key={c.h} style={{padding:'36px 24px 28px'}}>
            <Eyebrow>{c.h}</Eyebrow>
            <div style={{marginTop:14}}>
              {c.l.map(x => <div key={x} style={{fontSize:13,color:B.ink2,marginBottom:8,cursor:'pointer'}}>{x}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',padding:'18px 32px',borderTop:`1px solid ${B.hair}`,fontSize:12,color:B.ink3}}>
        <span>© 2026 Sony Computer Science Laboratories · Rome</span>
        <span style={{fontFamily:B.mono,fontSize:11,letterSpacing:'0.04em'}}>v2.0 · Updated May 2026 · CC&nbsp;BY-NC&nbsp;4.0</span>
      </div>
    </div>
  );
}

// Reusable section heading
function Section({ tag, title, hint }) {
  return (
    <div style={{display:'flex',alignItems:'baseline',gap:18,marginBottom:24}}>
      <Eyebrow color={B.ink3}>§ {tag}</Eyebrow>
      <div style={{fontFamily:B.sans,fontSize:26,fontWeight:600,letterSpacing:'-0.02em',color:B.ink}}>{title}</div>
      {hint && <div style={{flex:1,textAlign:'right',fontSize:13,color:B.ink3,fontStyle:'italic'}}>{hint}</div>}
    </div>
  );
}

// ───── Home ─────
function BHome() {
  return (
    <div style={{...bBase,width:'100%',height:'100%',overflow:'hidden'}}>
      <BNav active="atlas" />

      {/* Hero */}
      <div style={{padding:'68px 56px 48px',display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:56,alignItems:'end'}}>
        <div>
          <Eyebrow color={B.ink3}>Volume II · 2026 edition</Eyebrow>
          <h1 style={{
            fontFamily:B.sans,fontSize:78,lineHeight:0.98,letterSpacing:'-0.04em',
            fontWeight:500,margin:'18px 0 22px',color:B.ink,maxWidth:920,
            textWrap:'pretty',
          }}>
            An atlas of how cities <span style={{color:B.magenta}}>give access</span>
          </h1>
          <div style={{fontSize:16,lineHeight:1.6,color:B.ink2,maxWidth:660}}>
            Four open platforms, one framework. Measure <strong>proximity</strong> — what is within walking distance. Measure <strong>opportunity</strong> — what transit can reach. Compare them, find the gap. Every city on Earth, open data, open code.
          </div>
          <div style={{marginTop:28,display:'flex',gap:12}}>
            <span style={{padding:'12px 20px',background:B.ink,color:B.card,borderRadius:B.radius,fontSize:13.5,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              Explore the platforms <Icon name="arrow" size={14} color={B.card}/>
            </span>
            <span style={{padding:'12px 20px',background:'transparent',color:B.ink2,border:`1px solid ${B.hair}`,borderRadius:B.radius,fontSize:13.5,cursor:'pointer'}}>
              Read the framework paper ↗
            </span>
          </div>
        </div>
        <div style={{paddingBottom:8}}>
          <div style={{
            border:`1px solid ${B.hair}`,background:B.card,borderRadius:B.radius,padding:'18px 22px',
          }}>
            <Eyebrow>Latest from the lab</Eyebrow>
            <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:12}}>
              {[
                ['Apr 2026','Paper', 'Bruno et al. — the P.O.V. framework', B.navy],
                ['Feb 2026','Release','Car Dependency Index v1.0 (19 cities)', B.magenta],
                ['Jan 2026','Data',   '15min-City refreshed — +428 cities', B.cyan],
              ].map(([d,k,t,c]) => (
                <div key={t} style={{display:'flex',alignItems:'flex-start',gap:12,paddingBottom:10,borderBottom:`1px solid ${B.hairSoft}`}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:c,marginTop:7,flex:'0 0 auto'}}/>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:B.ink3,fontFamily:B.mono,letterSpacing:'0.04em'}}>
                      <span>{d}</span><span>{k}</span>
                    </div>
                    <div style={{fontSize:13,color:B.ink,marginTop:3}}>{t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Atlas metrics strip */}
      <div style={{margin:'0 56px 56px',padding:'24px 28px',background:B.card,border:`1px solid ${B.hair}`,borderRadius:B.radius,display:'grid',gridTemplateColumns:'repeat(5,1fr)'}}>
        {[
          ['10,142','Cities mapped'],
          ['4','Active platforms'],
          ['182','Countries covered'],
          ['14','Researchers'],
          ['2018','Founded'],
        ].map((s,i)=>(
          <div key={i} style={{padding:'0 12px',borderRight:i<4?`1px solid ${B.hair}`:'none'}}>
            <div style={{fontFamily:B.sans,fontSize:34,lineHeight:1,fontWeight:500,letterSpacing:'-0.025em',color:B.ink}}>{s[0]}</div>
            <div style={{fontSize:12,color:B.ink3,marginTop:8}}>{s[1]}</div>
          </div>
        ))}
      </div>

      {/* Coverage map */}
      <div style={{padding:'0 56px 56px'}}>
        <Section tag="01" title="A single map of access, four lenses." hint="hover any platform to preview"/>
        <div style={{border:`1px solid ${B.hair}`,background:B.card,borderRadius:B.radius,overflow:'hidden'}}>
          <div style={{height:280,position:'relative'}}>
            <WorldMap variant="atlas" paper="#F0EDE4" land="#DBD5C5" />
            <div style={{position:'absolute',top:14,left:18,padding:'8px 12px',background:'rgba(251,250,244,0.92)',border:`1px solid ${B.hair}`,borderRadius:B.radius,fontSize:12,color:B.ink2,backdropFilter:'blur(4px)'}}>
              Global coverage · 10,142 cities
            </div>
            <div style={{position:'absolute',top:14,right:18,padding:'10px 14px',background:'rgba(251,250,244,0.92)',border:`1px solid ${B.hair}`,borderRadius:B.radius,fontSize:11.5,color:B.ink2,backdropFilter:'blur(4px)',display:'flex',gap:14}}>
              <span style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:B.navy}}/>Opportunity</span>
              <span style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:B.magenta}}/>Proximity</span>
              <span style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:B.cyan}}/>Comparison</span>
            </div>
          </div>
        </div>
      </div>

      {/* Four platforms grid */}
      <div style={{padding:'0 56px 56px'}}>
        <Section tag="02" title="The four platforms" hint="proximity → opportunity → value"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20}}>
          {[
            { idx:'01', tag:'Proximity',   name:'15min-City',                sub:'Walkable services, scored against the 15-minute ideal — every city on Earth.',
              metric:'10,142 cities', variant:'fifteen', dot:'#b94e3b' },
            { idx:'02', tag:'Opportunity', name:'CityChrone++',              sub:'Travel-time geography — watch the city deform as transit reshapes reach.',
              metric:'42 cities', variant:'citychrone', dot:B.navy },
            { idx:'03', tag:'Comparison',  name:'Car Dependency Index',      sub:'How many more places does a car reach than transit, cell by cell?',
              metric:'19 cities', variant:'cardep', dot:'#a04640' },
            { idx:'04', tag:'Synthesis',   name:'Urban Accessibility P.O.V.', sub:'Proximity × Opportunity, splitting the city into four zones of access.',
              metric:'19 cities', variant:'pov', dot:B.navy },
          ].map((c) => (
            <div key={c.idx} className="b-card" style={{
              border:`1px solid ${B.hair}`,background:B.card,borderRadius:B.radius,
              padding:'22px 24px',display:'grid',gridTemplateColumns:'1fr 1.1fr',gap:22,alignItems:'center',
              transition:'transform .18s, box-shadow .18s, border-color .18s',cursor:'pointer',
            }}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:c.dot}}/>
                  <span style={{fontSize:12,color:B.ink3,letterSpacing:'0.02em'}}>{c.idx} · {c.tag}</span>
                </div>
                <div style={{fontFamily:B.sans,fontSize:26,fontWeight:600,letterSpacing:'-0.025em',marginTop:8,lineHeight:1.1}}>{c.name}</div>
                <div style={{fontSize:13.5,color:B.ink2,lineHeight:1.55,marginTop:10}}>{c.sub}</div>
                <div style={{marginTop:18,display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:12,borderTop:`1px solid ${B.hairSoft}`}}>
                  <span style={{fontFamily:B.mono,fontSize:11.5,color:B.ink3,letterSpacing:'0.04em'}}>{c.metric}</span>
                  <span style={{fontSize:12.5,color:c.dot,display:'flex',alignItems:'center',gap:6,fontWeight:500}}>Open <Icon name="arrow" size={13} color={c.dot}/></span>
                </div>
              </div>
              <div style={{height:160,border:`1px solid ${B.hairSoft}`,borderRadius:B.radius,overflow:'hidden'}}>
                <WorldMap variant={c.variant} paper="#F0EDE4" land="#DBD5C5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By the numbers */}
      <div style={{padding:'0 56px 56px'}}>
        <Section tag="03" title="By the numbers" hint="six cities, three measures"/>
        <div style={{border:`1px solid ${B.hair}`,background:B.card,borderRadius:B.radius,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1.4fr',padding:'14px 22px',borderBottom:`1px solid ${B.hair}`,fontSize:12,color:B.ink3,background:B.paperAlt}}>
            <div>City</div><div>Proximity (min walk)</div><div>Opportunity (jobs, k)</div><div>Inclusion rate</div>
          </div>
          {[
            { c:'Paris', p:8.2, o:14.6, i:38 },
            { c:'Barcelona', p:9.1, o:11.2, i:34 },
            { c:'Vienna', p:8.8, o:12.4, i:36 },
            { c:'Berlin', p:10.4, o:10.8, i:28 },
            { c:'New York', p:12.1, o:13.5, i:22 },
            { c:'Rome', p:11.3, o:8.7, i:18 },
          ].map((r,i) => (
            <div key={r.c} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1.4fr',padding:'14px 22px',borderBottom:i<5?`1px solid ${B.hairSoft}`:'none',alignItems:'center',fontSize:14}}>
              <div style={{color:B.ink,fontWeight:500}}>{r.c}</div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{flex:1,height:6,background:B.hairSoft,borderRadius:3,position:'relative',maxWidth:140}}>
                  <div style={{position:'absolute',inset:0,width:`${Math.min(r.p*7,100)}%`,background:B.magenta,borderRadius:3}}/>
                </div>
                <span style={{fontFamily:B.mono,fontSize:12,color:B.ink2,minWidth:32,fontVariantNumeric:'tabular-nums'}}>{r.p}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{flex:1,height:6,background:B.hairSoft,borderRadius:3,position:'relative',maxWidth:140}}>
                  <div style={{position:'absolute',inset:0,width:`${r.o*5}%`,background:B.navy,borderRadius:3}}/>
                </div>
                <span style={{fontFamily:B.mono,fontSize:12,color:B.ink2,minWidth:32,fontVariantNumeric:'tabular-nums'}}>{r.o}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{flex:1,height:6,background:B.hairSoft,borderRadius:3,position:'relative',maxWidth:200}}>
                  <div style={{position:'absolute',inset:0,width:`${r.i*2.4}%`,background:B.cyan,borderRadius:3}}/>
                </div>
                <span style={{fontFamily:B.mono,fontSize:12,color:B.ink2,minWidth:36,fontVariantNumeric:'tabular-nums'}}>{r.i}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pull quote */}
      <div style={{padding:'24px 56px 48px',display:'grid',gridTemplateColumns:'1fr 2fr',gap:48,alignItems:'center'}}>
        <Eyebrow>From the team</Eyebrow>
        <div style={{fontFamily:B.serif,fontSize:30,lineHeight:1.25,letterSpacing:'-0.005em',color:B.ink}}>
          “A city is a promise of <em style={{color:B.magenta}}>nearness</em>: that the things you need are within reach. The Atlas asks, for every place on Earth, whether that promise is being kept.”
          <div style={{marginTop:16,fontFamily:B.sans,fontStyle:'normal',fontSize:13,color:B.ink3}}>— Sustainable Cities team · Sony CSL Rome</div>
        </div>
      </div>

      {/* Side projects */}
      <div style={{padding:'0 56px 56px'}}>
        <Section tag="04" title="Side projects & future work"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
          {[
            { n:'whatif-machine', t:'Archive', d:'The original modular platform that seeded the Atlas.', c:B.gray },
            { n:'Pedestrian Heat', t:'Upcoming · Q3 2026', d:'Heat-exposure of every pedestrian route in the city.', c:'#d57b66' },
            { n:'Accessibility for All', t:'In progress', d:'Mapping the city through a wheelchair user\u2019s perspective.', c:B.cyan },
            { n:'Soundscapes', t:'Concept', d:'Acoustic accessibility — where can you simply hear the city?', c:B.magenta },
          ].map((s) => (
            <div key={s.n} style={{padding:'20px 22px',background:B.card,border:`1px solid ${B.hair}`,borderRadius:B.radius,cursor:'pointer'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:s.c}}/>
                <span style={{fontSize:11,color:B.ink3,letterSpacing:'0.02em'}}>{s.t}</span>
              </div>
              <div style={{fontFamily:B.sans,fontSize:18,fontWeight:600,letterSpacing:'-0.015em',marginBottom:8}}>{s.n}</div>
              <div style={{fontSize:13,color:B.ink2,lineHeight:1.55}}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <BFooter/>
    </div>
  );
}

// ───── Platform landing — full-bleed map, no sidebar ─────
function BLanding({ platform }) {
  const PLATFORMS = {
    fifteen: {
      name:'15min-City', tag:'01', label:'Proximity access', accent:'#b94e3b',
      intro:'A platform that scores how close every neighbourhood is to the 15-minute-city ideal: services, schools, food, healthcare reachable on foot or by bike. Click any city to enter its accessibility map.',
      coverage:'10,142 cities',
      legend:[ ['0–3 min','#3b6e8f'],['3–6','#6c93b1'],['6–9','#9ab9cf'],['9–12','#cfd9da'],['12–15','#e9b6a3'],['15–18','#d57b66'],['18–21','#b94e3b'],['21–24','#8a2c1c'],['24–30','#5e1a0d'] ],
      legendUnit:'Average proximity time',
      variant:'fifteen',
    },
    citychrone: {
      name:'CityChrone++', tag:'02', label:'Opportunity access', accent:B.navy,
      intro:'CityChrone++ replaces distance with travel time. Watch the city deform under your fingertips as public transport reshapes what is reachable — and run what-if scenarios on new lines and stations.',
      coverage:'42 cities',
      legend:[ ['Slow','#d9dfe9'],['Medium',B.cyan],['Fast',B.navy] ],
      legendUnit:'Velocity score',
      variant:'citychrone',
    },
    cardep: {
      name:'Car Dependency Index', tag:'03', label:'Transit vs. private car', accent:'#a04640',
      intro:'A high-resolution measure of how much more reachable opportunities are by car than by public transport. Blue cells favour transit; red cells require a car. Based on Campanelli et al., 2026.',
      coverage:'19 cities',
      legend:[ ['Transit-friendly','#4a7fb8'],['Mixed','#cfd2c8'],['Car-dependent','#a04640'],['Car-only','#7a2e29'] ],
      legendUnit:'CDI ratio',
      variant:'cardep',
    },
    pov: {
      name:'Urban Accessibility P.O.V.', tag:'04', label:'Proximity · Opportunity · Value', accent:B.navy,
      intro:'Each city is mapped across two dimensions: Proximity (walkable local services) and Opportunity (fast transit reach). A third dimension, the intrinsic Value of places, has yet to be quantified.',
      coverage:'19 cities',
      legend:[ ['Inclusion','#3b8a4f'],['Spatial isolation',B.cyan],['Social isolation','#e0a23a'],['Total isolation','#c54a3a'] ],
      legendUnit:'Zone type',
      variant:'pov',
    },
  };
  const p = PLATFORMS[platform];

  return (
    <div style={{...bBase,width:'100%',height:'100%',overflow:'hidden',display:'flex',flexDirection:'column',position:'relative'}}>
      <BNav active="platforms"/>

      {/* Platform sub-header */}
      <div style={{padding:'16px 32px',display:'flex',alignItems:'center',gap:18,borderBottom:`1px solid ${B.hair}`,background:B.card,position:'relative',zIndex:3}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:p.accent}}/>
        <span style={{fontSize:12,color:B.ink3,letterSpacing:'0.02em'}}>§ {p.tag} · {p.label}</span>
        <span style={{fontFamily:B.sans,fontSize:22,fontWeight:600,letterSpacing:'-0.02em',marginLeft:6}}>{p.name}</span>
        <span style={{marginLeft:14,fontFamily:B.mono,fontSize:11.5,color:B.ink3,letterSpacing:'0.04em'}}>{p.coverage}</span>
        <div style={{flex:1}}/>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',background:B.paper,border:`1px solid ${B.hair}`,borderRadius:B.radius,minWidth:300}}>
          <Icon name="search" size={14} color={B.ink3}/>
          <span style={{fontSize:13,color:B.ink3}}>Search your city…</span>
          <span style={{marginLeft:'auto',fontFamily:B.mono,fontSize:11,color:B.ink3,padding:'2px 7px',background:B.card,border:`1px solid ${B.hair}`,borderRadius:4}}>⌘K</span>
        </div>
        {['Paper ↗','GitHub ↗'].map(t => (
          <span key={t} style={{fontSize:13,color:B.ink2,padding:'8px 14px',border:`1px solid ${B.hair}`,borderRadius:B.radius,background:B.card}}>{t}</span>
        ))}
      </div>

      {/* Full-bleed map */}
      <div style={{flex:1,position:'relative',background:B.paper,overflow:'hidden'}}>
        <WorldMap variant={p.variant} paper="#EEEAE0" land="#D9D3C2" />

        {/* Welcome card */}
        <div style={{
          position:'absolute',top:24,left:32,width:360,
          background:B.card,border:`1px solid ${B.hair}`,borderRadius:B.radius,
          padding:'22px 24px',boxShadow:'0 14px 40px rgba(20,20,15,0.06)',
        }}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <Eyebrow>Welcome to {p.name}</Eyebrow>
            <Icon name="close" size={13} color={B.ink3}/>
          </div>
          <div style={{fontSize:14,lineHeight:1.6,color:B.ink2,marginBottom:18}}>{p.intro}</div>
          <div style={{display:'flex',gap:8,alignItems:'center',paddingTop:14,borderTop:`1px solid ${B.hairSoft}`}}>
            <span style={{padding:'9px 14px',background:p.accent,color:B.card,borderRadius:B.radius,fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              Click a city on the map <Icon name="arrow" size={13} color={B.card}/>
            </span>
            <span style={{padding:'9px 14px',color:B.ink2,fontSize:13,cursor:'pointer'}}>Learn more →</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          position:'absolute',top:24,right:32,
          background:B.card,border:`1px solid ${B.hair}`,borderRadius:B.radius,
          padding:'16px 18px',minWidth:200,boxShadow:'0 14px 40px rgba(20,20,15,0.06)',
        }}>
          <Eyebrow>{p.legendUnit}</Eyebrow>
          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:7}}>
            {p.legend.map(([l,c]) => (
              <div key={l} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:B.ink2}}>
                <span style={{width:14,height:14,background:c,borderRadius:3,display:'inline-block'}}/>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div style={{
          position:'absolute',bottom:32,right:32,
          background:B.card,border:`1px solid ${B.hair}`,borderRadius:B.radius,
          display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 8px 20px rgba(20,20,15,0.06)',
        }}>
          <button style={{width:36,height:36,border:'none',background:'transparent',borderBottom:`1px solid ${B.hairSoft}`,cursor:'pointer'}}><Icon name="plus" size={14} color={B.ink2}/></button>
          <button style={{width:36,height:36,border:'none',background:'transparent',cursor:'pointer'}}><Icon name="minus" size={14} color={B.ink2}/></button>
        </div>

        {/* Subtle attribution */}
        <div style={{position:'absolute',bottom:14,left:32,fontFamily:B.mono,fontSize:10.5,color:B.ink3,letterSpacing:'0.04em'}}>
          Tiles © OpenStreetMap · Data © Sony CSL Rome
        </div>
      </div>
    </div>
  );
}

// ───── City detail (Rome) ─────
function BCity() {
  const zones = [
    { name:'Inclusion',         c:'#3b8a4f',  desc:'High proximity · High opportunity', pct:12.9 },
    { name:'Spatial isolation', c:B.cyan,     desc:'High proximity · Low opportunity',  pct:2.7 },
    { name:'Social isolation',  c:'#e0a23a',  desc:'Low proximity · High opportunity',  pct:1.4 },
    { name:'Total isolation',   c:'#c54a3a',  desc:'Low proximity · Low opportunity',   pct:83.0 },
  ];

  let s=42; const rand = () => { s=(s*1103515245+12345)%2147483647; return s/2147483647; };
  const scatter = Array.from({length:520},()=>{
    const r = rand(); const zone = r<0.35?0:r<0.5?1:r<0.65?2:3;
    return { x: 40+rand()*620, y: zones[zone].name==='Total isolation'? 250+rand()*80 : 30+rand()*210, c:zones[zone].c };
  });

  return (
    <div style={{...bBase,width:'100%',height:'100%',overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <BNav active="platforms"/>

      <div style={{borderBottom:`1px solid ${B.hair}`,background:B.card,padding:'14px 32px',display:'flex',alignItems:'center',gap:14}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:B.navy}}/>
        <span style={{fontSize:12,color:B.ink3}}>Urban Accessibility P.O.V.</span>
        <span style={{fontFamily:B.sans,fontSize:22,fontWeight:600,letterSpacing:'-0.02em',marginLeft:6}}>Rome</span>
        <span style={{fontSize:13,color:B.ink3,fontStyle:'italic'}}>Lazio, Italy · 8,089 hexagons</span>
        <div style={{flex:1}}/>
        {[['World map',true],['Compare cities',false],['Paper ↗',false],['GitHub ↗',false]].map(([t,active]) => (
          <span key={t} style={{
            fontSize:13,padding:'7px 14px',
            background:active?B.paperAlt:'transparent',color:active?B.ink:B.ink2,
            border:`1px solid ${B.hair}`,borderRadius:B.radius,
          }}>{t}</span>
        ))}
      </div>

      <div style={{flex:1,display:'grid',gridTemplateColumns:'260px 1.1fr 1fr',minHeight:0}}>
        {/* Left zone panel */}
        <div style={{borderRight:`1px solid ${B.hair}`,background:B.card,padding:'20px 22px'}}>
          <Eyebrow>Zone type</Eyebrow>
          <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:14}}>
            {zones.map((z) => (
              <div key={z.name}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{width:14,height:14,background:z.c,borderRadius:3}}/>
                  <span style={{fontSize:14,fontWeight:500,color:B.ink}}>{z.name}</span>
                  <span style={{marginLeft:'auto',fontFamily:B.mono,fontSize:12,color:B.ink}}>{z.pct}%</span>
                </div>
                <div style={{fontSize:12,color:B.ink3,marginLeft:24,marginTop:3}}>{z.desc}</div>
                <div style={{marginLeft:24,marginTop:8,height:4,background:B.hairSoft,borderRadius:2,position:'relative'}}>
                  <div style={{position:'absolute',inset:0,width:`${z.pct}%`,background:z.c,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:24,paddingTop:18,borderTop:`1px solid ${B.hair}`}}>
            <Eyebrow>City summary</Eyebrow>
            <div style={{marginTop:12,fontSize:13,color:B.ink2}}>
              {[['Hexagons','8,089'],['Median proximity','644 m'],['Median opportunity','2.7 k jobs'],['Population','4.3 M']].map(([k,v]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${B.hairSoft}`}}>
                  <span style={{color:B.ink3}}>{k}</span>
                  <span style={{color:B.ink,fontFamily:B.mono,fontSize:12,fontVariantNumeric:'tabular-nums'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cartogram */}
        <div style={{borderRight:`1px solid ${B.hair}`,position:'relative',padding:'20px 22px',display:'flex',flexDirection:'column'}}>
          <Eyebrow>Cartogram · Hexagonal mesh</Eyebrow>
          <div style={{flex:1,marginTop:12,borderRadius:B.radius,overflow:'hidden',position:'relative',background:'#F0EDE4',border:`1px solid ${B.hairSoft}`}}>
            <RomeCartogramB zones={zones}/>
            <div style={{position:'absolute',bottom:10,left:14,fontSize:11,color:B.ink3,fontStyle:'italic'}}>H3 resolution 10 · scale 1:80 000</div>
          </div>
        </div>

        {/* Scatter */}
        <div style={{padding:'20px 22px',display:'flex',flexDirection:'column'}}>
          <Eyebrow>Scatter · Proximity vs. opportunity</Eyebrow>
          <div style={{flex:1,marginTop:12,position:'relative'}}>
            <svg viewBox="0 0 700 360" style={{width:'100%',height:'100%'}}>
              <rect x="40" y="20" width="320" height="170" fill={B.cyan} opacity="0.06"/>
              <rect x="360" y="20" width="300" height="170" fill="#3b8a4f" opacity="0.08"/>
              <rect x="40" y="190" width="320" height="140" fill="#c54a3a" opacity="0.07"/>
              <rect x="360" y="190" width="300" height="140" fill="#e0a23a" opacity="0.06"/>
              <line x1="40" y1="20" x2="40" y2="330" stroke={B.ink3} strokeWidth="0.5"/>
              <line x1="40" y1="330" x2="660" y2="330" stroke={B.ink3} strokeWidth="0.5"/>
              <line x1="40" y1="190" x2="660" y2="190" stroke={B.ink3} strokeDasharray="3 3" strokeWidth="0.5"/>
              <line x1="360" y1="20" x2="360" y2="330" stroke={B.ink3} strokeDasharray="3 3" strokeWidth="0.5"/>
              {scatter.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill={p.c} opacity="0.85"/>)}
              <text x="60" y="40" fontFamily={B.sans} fontSize="11" fill={B.ink3} fontStyle="italic">Spatial isolation</text>
              <text x="380" y="40" fontFamily={B.sans} fontSize="11" fill={B.ink3} fontStyle="italic">Inclusion</text>
              <text x="60" y="320" fontFamily={B.sans} fontSize="11" fill={B.ink3} fontStyle="italic">Total isolation</text>
              <text x="380" y="320" fontFamily={B.sans} fontSize="11" fill={B.ink3} fontStyle="italic">Social isolation</text>
              <text x="350" y="354" fontFamily={B.sans} fontSize="11" fill={B.ink2} textAnchor="middle">Opportunity score →</text>
              <text x="14" y="175" fontFamily={B.sans} fontSize="11" fill={B.ink2} textAnchor="middle" transform="rotate(-90 14 175)">Proximity score →</text>
            </svg>
          </div>
        </div>
      </div>

      <div style={{padding:'10px 32px',background:B.paperAlt,borderTop:`1px solid ${B.hair}`,fontSize:11.5,color:B.ink3,display:'flex',justifyContent:'space-between'}}>
        <span>Hover or click any hexagon or scatter point to cross-highlight · scroll &amp; drag to navigate</span>
        <span style={{fontFamily:B.mono,letterSpacing:'0.04em'}}>41.879°N 12.481°E</span>
      </div>
    </div>
  );
}

function RomeCartogramB({ zones }) {
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
      <rect x="0" y="0" width="640" height="360" fill="#F0EDE4"/>
      <g opacity="0.5" stroke="#c2bcaa" strokeWidth="0.4" fill="none">
        <circle cx="320" cy="190" r="120"/>
        <path d="M 100 200 L 200 195 L 280 205 L 350 200 L 420 215 L 500 200" />
        <path d="M 200 100 L 300 200 L 400 290" />
      </g>
      {hex.map((h,i) => <circle key={i} cx={h.x} cy={h.y} r="2.6" fill={h.c} opacity="0.9"/>)}
    </svg>
  );
}

// ───── FAQ ─────
function BFAQ() {
  const faqs = [
    { q:'What does “access” mean in the Atlas?',
      a:'We use access as an umbrella for three measurable things: proximity (what is within walking distance), opportunity (what transit can reach in a fixed time budget), and value (the qualitative weight of those reachable places). Each platform measures one or more.' },
    { q:'Where does the data come from?',
      a:'Street networks and amenities are from OpenStreetMap. Public-transport networks come from open GTFS feeds. Population data is from WorldPop and JRC GHSL. Everything used to build the maps is open and citable.' },
    { q:'Why isn\u2019t my city included?',
      a:'Coverage depends on the quality of OSM and the availability of a usable GTFS feed. 15min-City covers ~10,000 cities; the comparison platforms focus on a smaller set of well-documented study cities. Open a GitHub issue and we will look into adding yours.' },
    { q:'Can I cite this work?',
      a:'Yes — each platform links to its underlying paper. The framework reference is Bruno et al., EPJ Data Science (2026); the Car Dependency Index is described in Campanelli et al., 2026.' },
    { q:'Is the Atlas free to use?',
      a:'Yes. The data is open under CC BY-NC 4.0; the code under MIT. Commercial use of the maps requires written permission.' },
    { q:'I found a bug / I want a feature.',
      a:'Each platform has a GitHub issue tracker linked in its footer. We respond to issues weekly during term time.' },
  ];
  return (
    <div style={{...bBase,width:'100%',minHeight:'100%',overflow:'hidden'}}>
      <BNav active="faq"/>
      <div style={{display:'grid',gridTemplateColumns:'380px 1fr',minHeight:'calc(100% - 67px)'}}>
        <div style={{borderRight:`1px solid ${B.hair}`,background:B.card,padding:'52px 36px'}}>
          <Eyebrow>Frequently asked</Eyebrow>
          <h1 style={{fontFamily:B.sans,fontSize:54,fontWeight:600,letterSpacing:'-0.035em',lineHeight:1,margin:'18px 0 22px'}}>
            Six common<br/>questions.
          </h1>
          <div style={{fontSize:14.5,color:B.ink2,lineHeight:1.6,marginBottom:28,maxWidth:300}}>
            Quick answers to what people ask us most. Have a different question? Write to <span style={{color:B.magenta,borderBottom:`1px solid ${B.magenta}`,cursor:'pointer'}}>access-atlas@sony.com</span> — we reply within a week.
          </div>
          <div style={{borderTop:`1px solid ${B.hair}`,paddingTop:18,fontSize:12.5,color:B.ink3}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0'}}><span>Last updated</span><span style={{color:B.ink}}>May 14, 2026</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0'}}><span>Entries</span><span style={{color:B.ink}}>6</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0'}}><span>Languages</span><span style={{color:B.ink}}>EN · IT</span></div>
          </div>
        </div>
        <div style={{padding:'30px 40px 60px'}}>
          {faqs.map((f,i) => (
            <details key={i} open={i===0||i===2} style={{borderBottom:`1px solid ${B.hair}`,padding:'22px 0'}}>
              <summary style={{listStyle:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:20}}>
                <div style={{display:'flex',gap:20,alignItems:'baseline'}}>
                  <span style={{fontFamily:B.mono,fontSize:12,color:B.ink3}}>{String(i+1).padStart(2,'0')}</span>
                  <span style={{fontFamily:B.sans,fontSize:20,fontWeight:600,letterSpacing:'-0.015em',color:B.ink}}>{f.q}</span>
                </div>
                <Icon name={i===0||i===2?'minus':'plus'} size={15} color={B.ink3}/>
              </summary>
              {(i===0||i===2) && (
                <div style={{marginTop:14,paddingLeft:42,fontSize:14.5,lineHeight:1.65,color:B.ink2,maxWidth:680}}>{f.a}</div>
              )}
            </details>
          ))}
        </div>
      </div>
      <BFooter/>
    </div>
  );
}

// ───── Contact ─────
function BContact() {
  const team = [
    { n:'Vittorio Loreto',       r:'Director · Principal Investigator', e:'vittorio.loreto@sony.com' },
    { n:'Bernardo Monechi',      r:'Senior Researcher',                  e:'bernardo.monechi@sony.com' },
    { n:'Riccardo Di Clemente',  r:'Senior Researcher',                  e:'riccardo.diclemente@sony.com' },
    { n:'Matteo Bruno',          r:'Researcher · P.O.V.',                e:'matteo.bruno@sony.com' },
    { n:'Hygor P. M. Melo',      r:'Researcher · 15min-City',            e:'hygor.melo@sony.com' },
    { n:'Indaco Biazzo',         r:'Researcher · CityChrone',            e:'indaco.biazzo@sony.com' },
    { n:'Lorenzo Campanelli',    r:'Researcher · Car Dependency',        e:'lorenzo.campanelli@sony.com' },
    { n:'You?',                  r:'We are hiring.',                     e:'careers@sony.com' },
  ];
  return (
    <div style={{...bBase,width:'100%',minHeight:'100%',overflow:'hidden'}}>
      <BNav active="contact"/>
      <div style={{display:'grid',gridTemplateColumns:'1.1fr 1fr'}}>
        <div style={{padding:'56px 40px 40px',borderRight:`1px solid ${B.hair}`}}>
          <Eyebrow>Contact &amp; collaborations</Eyebrow>
          <h1 style={{fontFamily:B.sans,fontSize:60,fontWeight:600,letterSpacing:'-0.035em',lineHeight:1,margin:'18px 0 24px'}}>
            Rome, Italy.<br/><span style={{color:B.magenta}}>Open for collab.</span>
          </h1>
          <div style={{fontSize:15,color:B.ink2,lineHeight:1.6,maxWidth:560,marginBottom:32}}>
            We collaborate with city governments, NGOs, universities and curious citizens. If your city should be on the Atlas, if you want to use our maps in a paper, or if you simply have an idea — write to us.
          </div>
          <div style={{border:`1px solid ${B.hair}`,background:B.card,borderRadius:B.radius,padding:'22px 24px',maxWidth:560}}>
            <div style={{display:'grid',gridTemplateColumns:'130px 1fr',gap:'14px 18px',fontSize:13.5,color:B.ink2}}>
              <div style={{color:B.ink3}}>Address</div>
              <div>Sapienza Università di Roma<br/>Piazzale Aldo Moro, 5 — 00185 Roma, IT</div>
              <div style={{color:B.ink3}}>General</div>
              <div style={{color:B.ink}}>access-atlas@sony.com</div>
              <div style={{color:B.ink3}}>Press</div>
              <div style={{color:B.ink}}>press@sony.com</div>
              <div style={{color:B.ink3}}>Code</div>
              <div style={{color:B.ink}}>github.com/sony-csl-rome</div>
              <div style={{color:B.ink3}}>Phone</div>
              <div style={{color:B.ink}}>+39 06 4991 3333</div>
            </div>
          </div>
        </div>
        <div style={{padding:'56px 40px',background:B.paperAlt}}>
          <Eyebrow>The team</Eyebrow>
          <div style={{marginTop:16,border:`1px solid ${B.hair}`,background:B.card,borderRadius:B.radius,overflow:'hidden'}}>
            {team.map((m,i)=>(
              <div key={m.n} style={{
                padding:'14px 18px',borderBottom:i<team.length-1?`1px solid ${B.hairSoft}`:'none',
                display:'grid',gridTemplateColumns:'1.2fr 1fr 1.2fr',gap:10,alignItems:'center',
                background:m.n==='You?'?B.paperAlt:'transparent',
              }}>
                <div style={{fontSize:14.5,fontWeight:500,color:m.n==='You?'?B.magenta:B.ink}}>{m.n}</div>
                <div style={{fontSize:12.5,color:B.ink3}}>{m.r}</div>
                <div style={{fontFamily:B.mono,fontSize:11.5,color:B.ink2,textAlign:'right'}}>{m.e}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BFooter/>
    </div>
  );
}

Object.assign(window, { BHome, BLanding, BCity, BFAQ, BContact, B });
