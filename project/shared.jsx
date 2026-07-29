// shared.jsx — brand tokens, world-map placeholder, dot patterns, icons.
// Loaded BEFORE direction-a.jsx and direction-b.jsx; exposes globals on window.

const BRAND = {
  navy:    '#1A1F4E',
  magenta: '#E6007E',
  cyan:    '#00A5DE',
  gray:    '#BEC0C2',
  navyDeep:'#0A1238',
  magDeep: '#A8005E',
  cyanDeep:'#007AA8',
};

// Continent blobs in viewBox 1000x500 (equirectangular-ish).
// Each is a soft ellipse; renders below the dots to evoke a world map
// without hand-drawn coastlines. Coords picked from typical centroids.
const CONTINENTS = [
  { cx: 220, cy: 170, rx: 105, ry: 80,  label: 'NA' },
  { cx: 200, cy: 240, rx: 70,  ry: 40,  label: 'NA2' }, // Mexico/CA
  { cx: 320, cy: 340, rx: 60,  ry: 90,  label: 'SA' },
  { cx: 360, cy: 200, rx: 25,  ry: 18,  label: 'Greenland' },
  { cx: 510, cy: 175, rx: 50,  ry: 35,  label: 'EU' },
  { cx: 540, cy: 290, rx: 70,  ry: 95,  label: 'AF' },
  { cx: 690, cy: 200, rx: 140, ry: 70,  label: 'AS' },
  { cx: 760, cy: 285, rx: 55,  ry: 40,  label: 'India' },
  { cx: 830, cy: 240, rx: 35,  ry: 30,  label: 'SEA' },
  { cx: 880, cy: 370, rx: 60,  ry: 32,  label: 'AU' },
];

// City coordinates as fractions of a 1000×500 world rect (eyeballed equirectangular).
// label, x, y (px in 1000×500 viewBox), region.
const CITIES = [
  // Europe (dense — most platforms cover EU well)
  { n: 'London',     x: 489, y: 173 }, { n: 'Paris',      x: 500, y: 187 },
  { n: 'Berlin',     x: 525, y: 172 }, { n: 'Madrid',     x: 480, y: 210 },
  { n: 'Rome',       x: 522, y: 210 }, { n: 'Vienna',     x: 532, y: 184 },
  { n: 'Warsaw',     x: 543, y: 173 }, { n: 'Amsterdam',  x: 506, y: 170 },
  { n: 'Barcelona',  x: 491, y: 207 }, { n: 'Milan',      x: 517, y: 195 },
  { n: 'Stockholm',  x: 533, y: 142 }, { n: 'Copenhagen', x: 522, y: 155 },
  { n: 'Zurich',     x: 514, y: 188 }, { n: 'Munich',     x: 522, y: 188 },
  { n: 'Lisbon',     x: 463, y: 213 }, { n: 'Athens',     x: 547, y: 217 },
  { n: 'Prague',     x: 530, y: 178 }, { n: 'Helsinki',   x: 548, y: 138 },
  { n: 'Oslo',       x: 521, y: 140 }, { n: 'Dublin',     x: 477, y: 168 },
  { n: 'Brussels',   x: 503, y: 173 }, { n: 'Budapest',   x: 540, y: 184 },
  // North America
  { n: 'New York',   x: 270, y: 195 }, { n: 'Los Angeles',x: 168, y: 215 },
  { n: 'Chicago',    x: 240, y: 195 }, { n: 'Toronto',    x: 261, y: 188 },
  { n: 'Mexico City',x: 215, y: 248 }, { n: 'Vancouver',  x: 160, y: 175 },
  { n: 'Seattle',    x: 168, y: 180 }, { n: 'Boston',     x: 281, y: 188 },
  { n: 'Montreal',   x: 273, y: 182 }, { n: 'San Francisco', x: 156, y: 207 },
  { n: 'Miami',      x: 256, y: 240 }, { n: 'Houston',    x: 230, y: 230 },
  // South America
  { n: 'São Paulo',  x: 340, y: 340 }, { n: 'Buenos Aires',x: 320, y: 380 },
  { n: 'Rio',        x: 348, y: 333 }, { n: 'Lima',       x: 285, y: 320 },
  { n: 'Bogotá',     x: 280, y: 285 }, { n: 'Santiago',   x: 305, y: 380 },
  // Asia
  { n: 'Tokyo',      x: 855, y: 200 }, { n: 'Seoul',      x: 832, y: 200 },
  { n: 'Beijing',    x: 800, y: 195 }, { n: 'Shanghai',   x: 818, y: 215 },
  { n: 'Mumbai',     x: 720, y: 260 }, { n: 'Delhi',      x: 740, y: 235 },
  { n: 'Bangkok',    x: 800, y: 270 }, { n: 'Jakarta',    x: 825, y: 318 },
  { n: 'Singapore',  x: 810, y: 295 }, { n: 'Hong Kong',  x: 815, y: 240 },
  { n: 'Istanbul',   x: 580, y: 200 }, { n: 'Dubai',      x: 640, y: 245 },
  { n: 'Tel Aviv',   x: 580, y: 220 }, { n: 'Tehran',     x: 635, y: 215 },
  // Africa
  { n: 'Cairo',      x: 580, y: 232 }, { n: 'Lagos',      x: 510, y: 290 },
  { n: 'Nairobi',    x: 595, y: 320 }, { n: 'Johannesburg',x: 565, y: 370 },
  { n: 'Accra',      x: 495, y: 290 }, { n: 'Addis Ababa',x: 600, y: 295 },
  // Oceania
  { n: 'Sydney',     x: 895, y: 380 }, { n: 'Melbourne',  x: 880, y: 395 },
  { n: 'Auckland',   x: 945, y: 405 }, { n: 'Perth',      x: 835, y: 380 },
];

// 18 study cities used by P.O.V. + Car Dependency Index
const STUDY_CITIES = [
  'Barcelona','Berlin','Bordeaux','Boston','Chicago','Florence','Karlsruhe',
  'Málaga','Milan','Munich','Nantes','New York','Paris','Porto','Rome',
  'Seattle','Stockholm','Vienna','Zurich',
];

// Quantized average-proximity-time bucket per city for 15min-City.
// (We seed by name so colors are stable across re-renders.)
function hash(s){ let h=0; for(const c of s) h=((h<<5)-h+c.charCodeAt(0))|0; return Math.abs(h); }

// ────────────────────────────────────────────────────────────────────────
// WorldMap — placeholder with continent silhouettes + dotted cities.
// Variants tune the look to mimic each platform.
//   variant: 'fifteen' | 'citychrone' | 'cardep' | 'pov' | 'atlas'
// ────────────────────────────────────────────────────────────────────────
function WorldMap({ variant = 'atlas', dense = false, style, paper = '#eaf3f8', land = '#d6e5ed' }) {
  // Palette tuned per platform (matches screenshots).
  const palettes = {
    fifteen: ['#3b6e8f','#6c93b1','#9ab9cf','#cfd9da','#e9b6a3','#d57b66','#b94e3b','#8a2c1c','#5e1a0d'],
    citychrone: [BRAND.navy, BRAND.navyDeep],
    cardep: ['#c8746e','#b85a52','#a04640','#7a2e29'],
    pov: ['#5a8fd8','#3a6fb8','#2a5598','#1a3a78'],
    atlas: [BRAND.navy, BRAND.cyan, BRAND.magenta],
  };
  const pal = palettes[variant] || palettes.atlas;

  // 15min-City has thousands of points; CityChrone/CarDep/POV have ~20–40 highlighted study cities.
  const showAll = variant === 'fifteen' || dense;
  const cityList = showAll ? CITIES : CITIES.filter(c => STUDY_CITIES.includes(c.n));

  // For 15min variant, scatter extra micro-dots around each city for density.
  const scatterPerCity = variant === 'fifteen' ? 14 : 0;
  const microDots = [];
  if (scatterPerCity) {
    let s = 1;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    cityList.forEach(c => {
      for (let i=0;i<scatterPerCity;i++){
        microDots.push({
          x: c.x + (rand()-0.5)*30,
          y: c.y + (rand()-0.5)*18,
          c: pal[Math.floor(rand()*pal.length)],
        });
      }
    });
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: paper, overflow: 'hidden', ...style }}>
      <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Subtle graticule */}
        <g stroke="rgba(0,0,0,0.04)" strokeWidth="0.5">
          {[100,200,300,400].map(y => <line key={'h'+y} x1="0" y1={y} x2="1000" y2={y} />)}
          {[200,400,600,800].map(x => <line key={'v'+x} x1={x} y1="0" x2={x} y2="500" />)}
        </g>
        {/* Continent blobs */}
        <g fill={land} opacity="0.85">
          {CONTINENTS.map((c,i) => <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} />)}
        </g>
        {/* Soft second-layer texture */}
        <g fill={land} opacity="0.45">
          {CONTINENTS.map((c,i) => <ellipse key={'b'+i} cx={c.cx+8} cy={c.cy-4} rx={c.rx*0.85} ry={c.ry*0.9} />)}
        </g>
        {/* Micro-dots for 15min-City density */}
        {microDots.map((d,i) => (
          <circle key={'m'+i} cx={d.x} cy={d.y} r="1.6" fill={d.c} opacity="0.85" />
        ))}
        {/* Study-city pins */}
        {cityList.map((c,i) => {
          const colorIdx = hash(c.n) % pal.length;
          const color = pal[colorIdx];
          const r = variant === 'fifteen' ? 2.4 : 3.6;
          if (variant === 'cardep' || variant === 'pov') {
            // Ring marker like the screenshots
            return (
              <g key={c.n}>
                <circle cx={c.x} cy={c.y} r={r+2} fill={color} opacity="0.18" />
                <circle cx={c.x} cy={c.y} r={r} fill="none" stroke={color} strokeWidth="1.5" />
              </g>
            );
          }
          return <circle key={c.n} cx={c.x} cy={c.y} r={r} fill={color} opacity="0.9" />;
        })}
      </svg>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Sony CSL geometric mark — recreated from the official symbol (light gray
// quarter-circle + four triangle tiles forming a square). Used inline where
// raster logos would feel heavy.
// ────────────────────────────────────────────────────────────────────────
function SonyMark({ size = 28, mono = false }) {
  const s = size;
  const c = mono
    ? { a:'#bdbdbd', b:'#888', c:'#444', d:'#666', e:'#222', f:'#aaa' }
    : { a:'#B6B7B8', b:BRAND.cyan, c:BRAND.navyDeep, d:BRAND.navyDeep, e:BRAND.magenta, f:BRAND.cyan };
  return (
    <svg width={s} height={s*0.83} viewBox="0 0 60 50" aria-label="Sony CSL">
      {/* Quarter circle top-left */}
      <path d={`M 0 0 L 30 0 L 30 25 A 25 25 0 0 1 0 25 Z`} fill={c.a} transform="translate(0 0)" />
      {/* Top middle/right tile: navy with cyan triangle */}
      <rect x="30" y="0" width="15" height="25" fill={c.b} />
      <polygon points="30,0 45,0 45,25" fill={c.c} />
      {/* Top right tile: dark navy with cyan corner */}
      <rect x="45" y="0" width="15" height="25" fill={c.c} />
      <polygon points="45,25 60,25 60,0" fill={c.b} />
      {/* Bottom left: dark navy with magenta corner */}
      <rect x="0" y="25" width="15" height="25" fill={c.d} />
      <polygon points="0,25 15,25 15,50" fill={c.e} />
      {/* Bottom middle: magenta */}
      <rect x="15" y="25" width="15" height="25" fill={c.e} />
      {/* Bottom right: cyan with navy triangle */}
      <rect x="30" y="25" width="15" height="25" fill={c.f} />
      <polygon points="30,25 45,25 45,50" fill={c.c} />
      <rect x="45" y="25" width="15" height="25" fill={c.c} />
      <polygon points="45,50 60,50 60,25" fill={c.f} />
    </svg>
  );
}

// Small reusable icons (stroke style, look fine in both directions).
function Icon({ name, size = 18, color = 'currentColor' }) {
  const p = { stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const paths = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" {...p} />,
    arrowDown: <path d="M12 5v14M6 13l6 6 6-6" {...p} />,
    map: <g {...p}><path d="M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2-6-2z" /><path d="M9 4v16M15 6v16"/></g>,
    walk: <g {...p}><circle cx="13" cy="4" r="1.6" /><path d="M9 21l3-6 2 2 3 4M11 8l-3 3 1 4 4-2"/></g>,
    bus: <g {...p}><rect x="4" y="5" width="16" height="13" rx="2"/><path d="M4 12h16M8 18v2M16 18v2"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></g>,
    car: <g {...p}><path d="M5 16h14l-2-6H7l-2 6zM5 16v3M19 16v3"/><circle cx="8" cy="16" r="1.4"/><circle cx="16" cy="16" r="1.4"/></g>,
    layers: <g {...p}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/></g>,
    search: <g {...p}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></g>,
    close: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    minus: <path d="M5 12h14" {...p} />,
    paper: <g {...p}><path d="M14 3H6v18h12V7l-4-4z"/><path d="M14 3v4h4"/></g>,
    github: <path fill={color} stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
}

Object.assign(window, { BRAND, CONTINENTS, CITIES, STUDY_CITIES, WorldMap, SonyMark, Icon, hash });
