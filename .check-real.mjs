import { chromium } from 'playwright';
const BASE='http://localhost:4321/access-atlas';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1280,height:900}});
let fail=0; const check=(n,ok,d='')=>{if(!ok)fail++;console.log(`${ok?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`)};

async function city(url,name){
  const page=await ctx.newPage();
  const errs=[],bad=[],hits=[];
  page.on('console',m=>m.type()==='error'&&errs.push(m.text()));
  page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  page.on('response',r=>r.status()>=400&&bad.push(`${r.status()} ${r.url()}`));
  page.on('request',r=>{const[,t]=r.url().split('/data/'); if(t)hits.push(t)});
  await page.goto(url,{waitUntil:'load'}); await page.waitForTimeout(6000);
  const zones=await page.$$eval('.aa-zones__pct',e=>e.map(x=>x.textContent.trim()));
  const sum=await page.$$eval('.aa-summary__row dd',e=>e.map(x=>x.textContent.trim()));
  const pts=await page.$$eval('.aa-scatter circle',e=>e.length);
  const status=await page.$eval('.aa-statusbar span',e=>e.textContent.trim()).catch(()=>'');
  await page.close();
  return {zones,sum,pts,errs,bad,hits,status,name};
}

// P.O.V. Rome — real data
{
  const r=await city(`${BASE}/platforms/accessibility-pov/rome`,'POV Rome');
  check('POV Rome loads published dataset', r.hits.includes('pov/rome.geojson'), r.hits.join(', '));
  check('POV Rome: no errors', r.errs.length===0&&r.bad.length===0, [...r.errs,...r.bad].slice(0,2).join(' | '));
  check('POV Rome zone shares are the published ones', r.zones.join(' ')==='12.9% 2.7% 1.4% 83.0%', r.zones.join(' / '));
  check('POV Rome cells + population from file', r.sum[0]==='8,089'&&r.sum[3]==='2.6 M', r.sum.join(' | '));
  check('POV Rome scatter drawn', r.pts>400, `${r.pts}`);
  check('POV Rome not labelled as generated', !/generated/i.test(r.status), r.status.slice(0,60));
}
// A second POV city proves it is not Rome-only
{
  const r=await city(`${BASE}/platforms/accessibility-pov/porto`,'POV Porto');
  check('POV Porto renders from its own file', r.hits.includes('pov/porto.geojson')&&r.sum[0]==='360', `${r.sum[0]} cells`);
  check('POV Porto zone shares differ from Rome', r.zones.join(' ')!=='12.9% 2.7% 1.4% 83.0%', r.zones.join(' / '));
}
// CDI city page
{
  const r=await city(`${BASE}/platforms/car-dependency-index/rome`,'CDI Rome');
  check('CDI Rome loads published dataset', r.hits.includes('cardep/rome.geojson'), r.hits.join(', '));
  check('CDI Rome: no errors', r.errs.length===0&&r.bad.length===0, [...r.errs,...r.bad].slice(0,2).join(' | '));
  check('CDI Rome cells from file', r.sum[0]==='11,409', r.sum[0]);
  check('CDI Rome shows signed index values', /^[+−]/.test(r.sum[1])&&/^[+−]/.test(r.sum[2]), `${r.sum[1]} | ${r.sum[2]}`);
  check('CDI Rome weighted index matches build (+0.335)', r.sum[2]==='+0.34'||r.sum[2]==='+0.33', r.sum[2]);
  check('CDI Rome bands sum to 100%', Math.abs(r.zones.map(z=>parseFloat(z)).reduce((a,c)=>a+c,0)-100)<0.5, r.zones.join(' / '));
  check('CDI Rome scatter drawn', r.pts>400, `${r.pts}`);
}
// Coverage maps
{
  const page=await ctx.newPage();
  await page.goto(`${BASE}/platforms/car-dependency-index`,{waitUntil:'load'});
  await page.waitForTimeout(3000);
  await page.fill('.aa-search__input','flor');
  await page.waitForTimeout(400);
  const hits=await page.$$eval('.aa-search__result',e=>e.map(x=>x.textContent.trim()));
  check('CDI coverage includes Florence (real data only)', hits.some(h=>/Florence/.test(h)), hits.join(','));
  await page.click('.aa-search__result'); await page.waitForTimeout(3000);
  check('Clicking a CDI city opens its page', /car-dependency-index\/florence$/.test(page.url()), page.url());
  await page.close();
}
await b.close();
console.log(fail?`\n${fail} check(s) failed`:'\nAll real-data checks passed');
process.exit(fail?1:0);
