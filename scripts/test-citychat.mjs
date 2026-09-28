// CityChat without a model: the tools, the number check, the chat loop and
// both provider adapters, against scripted stand-ins.
//
//   npm run test:citychat
//
// No network and no API key. The adapters are pointed at a local HTTP server
// that answers the way Gemini and an OpenAI-compatible server do, and the
// test asserts on what they *sent*: a malformed request is what a provider
// change breaks first, and it only shows up as a 400 in production.

import http from 'node:http';
import path from 'node:path';
import { createDataStore, createTools, TOOL_DEFINITIONS } from '../server/citychat/tools.mjs';
import { collectNumbers, unverifiedNumbers } from '../server/citychat/numbers.mjs';
import { runChat } from '../server/citychat/chat.mjs';
import { systemPrompt } from '../server/citychat/knowledge.mjs';
import { providerFromEnv } from '../server/citychat/llm/index.mjs';
import { readDataJSON } from './lib/datafile.mjs';

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const DATA = path.join(process.cwd(), 'public', 'data');
const runTool = createTools(createDataStore(DATA));

// ── Tools agree with the published summaries ─────────────────────────
const catalogue = readDataJSON(path.join(DATA, 'index.json'));
const cities = await runTool('list_cities');
check('list_cities lists every atlas city', cities.cities?.length === catalogue.atlas.cities.length, `${cities.cities?.length}`);

const cardepRows = readDataJSON(path.join(DATA, 'cardep/summary.json.gz')).cities;
const povRows = readDataJSON(path.join(DATA, 'pov/summary.json.gz')).cities;
for (const id of ['milan', 'rome', 'zurich']) {
  const overview = await runTool('city_overview', { city: id });
  const cd = cardepRows.find((r) => r.id === id);
  if (cd && overview.layers?.cardep) {
    const l = overview.layers.cardep;
    check(`${id}: CDI matches the compare row`, l.medianCdi === cd.medianCdi && l.cdiForAverageResident === cd.weightedCdi, `${l.medianCdi}/${l.cdiForAverageResident} vs ${cd.medianCdi}/${cd.weightedCdi}`);
    check(`${id}: car/transit cell shares match`, l.carAdvantaged.cellShare === cd.carShare && l.transitAdvantaged.cellShare === cd.ptShare);
  }
  const pv = povRows.find((r) => r.id === id);
  if (pv && overview.layers?.pov) {
    const got = Object.values(overview.layers.pov.zoneSharesOfCells);
    const gotPop = Object.values(overview.layers.pov.zoneSharesOfResidents);
    check(`${id}: P.O.V. zone shares of cells match`, got.every((v, i) => Math.abs(v - pv.zoneShares[i]) <= 0.1), `${got} vs ${pv.zoneShares}`);
    check(`${id}: P.O.V. zone shares of residents match`, gotPop.every((v, i) => Math.abs(v - pv.zonePopulationShares[i]) <= 0.1), `${gotPop} vs ${pv.zonePopulationShares}`);
  }
}

const byName = await runTool('city_overview', { city: 'Milano' });
check('A city resolves by its Italian name', byName.city === 'milan');
const unknown = await runTool('city_overview', { city: 'atlantis' });
check('An unknown city is an error the model can read', /list_cities/.test(unknown.error ?? ''));
const badMetric = await runTool('rank_cells', { city: 'milan', layer: 'fifteen', metric: 'nope', order: 'lowest' });
check('A bad metric names the valid ones', /healthcare/.test(badMetric.error ?? ''));

const ranked = await runTool('rank_cells', { city: 'milan', layer: 'cardep', metric: 'cdi', order: 'highest', limit: 3 });
check('rank_cells returns sorted cells', ranked.cells?.length === 3 && ranked.cells[0].value >= ranked.cells[2].value);
check('rank_cells links each cell to the city view', ranked.cells?.every((c) => c.mapUrl === `/atlas/milan?layer=cardep&cell=${c.h3}`));

const first = ranked.cells[0];
const cell = await runTool('cell_at', { city: 'milan', lat: first.lat, lon: first.lon });
check('cell_at finds the cell a ranking returned', cell.h3 === first.h3 && cell.layers?.cardep?.cdi?.value === first.value, `${cell.h3} ${cell.layers?.cardep?.cdi?.value}`);
const sea = await runTool('cell_at', { city: 'milan', lat: 0, lon: 0 });
check('cell_at off the grid says so', sea.covered === false);

// ── Number check ─────────────────────────────────────────────────────
const allowed = collectNumbers({ share: 42.7, population: 1201023, minutes: 8.8, cdi: 0.063 });
const cases = [
  ['42,7% dei residenti', []],
  ['about 43% of residents', []],
  ['1,2 milioni di abitanti', []],
  ['1.201.023 abitanti', []],
  ['8:48 a piedi', []],
  ['CDI di 0,063', []],
  ['il 64% delle celle', ['64%']],
  ['nel 2019, 3 zone', []],
  ['cella `891f99cdd4fffff`', []],
];
for (const [text, expected] of cases) {
  const got = unverifiedNumbers(text, allowed);
  check(`numbers: "${text}"`, JSON.stringify(got) === JSON.stringify(expected), JSON.stringify(got));
}
check('The system prompt carries the rules and the copy', /normalised difference/.test(systemPrompt()) && /15-minute city: the layer/.test(systemPrompt()));

// ── The loop, with a scripted model ──────────────────────────────────
function scripted(turns) {
  const seen = [];
  return {
    seen,
    name: 'scripted',
    async complete(request) {
      seen.push(structuredClone(request.messages));
      return turns.shift();
    },
  };
}
const collect = async (gen) => {
  const out = [];
  for await (const e of gen) out.push(e);
  return out;
};

{
  const provider = scripted([
    { text: '', toolCalls: [{ id: 'a', name: 'city_overview', args: { city: 'milan' } }] },
    { text: 'Il 81,37% delle celle favorisce l\'auto.', toolCalls: [] },
    { text: 'Il 72,3% delle celle favorisce l\'auto, ma solo il 52,6% dei residenti.', toolCalls: [] },
  ]);
  const events = await collect(runChat({ provider, runTool, messages: [{ role: 'user', text: 'Milano dipende dall\'auto?' }], lang: 'it' }));
  const answer = events.find((e) => e.type === 'answer');
  check('Loop: the tool call is reported', events[0]?.type === 'tool' && events[0].name === 'city_overview');
  check('Loop: an invented figure triggers one correction', events.some((e) => e.type === 'status') && /81,37%/.test(provider.seen[2].at(-1).text));
  check('Loop: the corrected answer passes', answer && answer.unverified.length === 0, answer?.text);
  check('Loop: the answer carries the map link', answer?.links?.some((l) => l.href === '/atlas/milan'));
}
{
  // The check matches values, not meanings: a rounded figure that happens to
  // equal a different figure in the results passes. Pinned so nobody reads
  // more into a clean answer than it proves.
  const provider = scripted([
    { text: '', toolCalls: [{ id: 'a', name: 'city_overview', args: { city: 'milan' } }] },
    { text: 'Il 99% delle celle favorisce l\'auto.', toolCalls: [] },
  ]);
  const events = await collect(runChat({ provider, runTool, messages: [{ role: 'user', text: 'Milano?' }] }));
  check('Loop: a coincidental match is not caught (known limit)', events.at(-1)?.unverified?.length === 0);
}
{
  const provider = scripted([
    { text: 'Sono il 64%.', toolCalls: [] },
    { text: 'Sono sempre il 64%.', toolCalls: [] },
  ]);
  const events = await collect(runChat({ provider, runTool, messages: [{ role: 'user', text: 'Quanti?' }] }));
  const answer = events.find((e) => e.type === 'answer');
  check('Loop: a figure that survives the correction is flagged, not hidden', answer?.unverified?.[0] === '64%');
}

// ── Adapters, against a local stand-in for each API ──────────────────
const requests = [];
const mock = http.createServer(async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const parsed = JSON.parse(body);
  requests.push({ url: req.url, headers: req.headers, body: parsed });
  res.setHeader('Content-Type', 'application/json');
  if (req.url.includes(':generateContent')) {
    const lastRole = parsed.contents.at(-1).role;
    const hasResponse = parsed.contents.at(-1).parts.some((p) => p.functionResponse);
    res.end(JSON.stringify(
      hasResponse || lastRole !== 'user' || parsed.contents.length > 1
        ? { candidates: [{ content: { role: 'model', parts: [{ text: 'Milano: 72,3% delle celle.' }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } }
        : { candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'city_overview', args: { city: 'milan' } }, thoughtSignature: 'SIG' }] } }] },
    ));
  } else {
    const last = parsed.messages.at(-1);
    res.end(JSON.stringify(
      last.role === 'tool'
        ? { choices: [{ message: { role: 'assistant', content: '<think>hm</think>Milano: 72,3% delle celle.' } }] }
        : { choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 't1', type: 'function', function: { name: 'city_overview', arguments: '{"city":"milan"}' } }] } }] },
    ));
  }
});
await new Promise((r) => mock.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${mock.address().port}`;

{
  requests.length = 0;
  const provider = providerFromEnv({ CITYCHAT_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: base, CITYCHAT_MODEL: 'm' });
  const events = await collect(runChat({ provider, runTool, messages: [{ role: 'user', text: 'Milano?' }] }));
  const [one, two] = requests;
  check('Gemini: key sent as x-goog-api-key, model in the path', one?.headers['x-goog-api-key'] === 'k' && one.url === '/models/m:generateContent');
  check('Gemini: tools declared with upper-case schema types', one?.body.tools?.[0]?.functionDeclarations?.find((d) => d.name === 'city_overview')?.parameters?.type === 'OBJECT');
  check('Gemini: a tool with no parameters has no schema', !('parameters' in (one?.body.tools?.[0]?.functionDeclarations?.find((d) => d.name === 'list_cities') ?? { parameters: 1 })));
  check('Gemini: the model turn is replayed with its thought signature', two?.body.contents?.[1]?.parts?.[0]?.thoughtSignature === 'SIG');
  check('Gemini: the tool result goes back as a functionResponse', two?.body.contents?.[2]?.parts?.[0]?.functionResponse?.name === 'city_overview');
  check('Gemini: the answer arrives', events.at(-1)?.type === 'answer' && events.at(-1).unverified.length === 0, events.at(-1)?.text);
}
{
  requests.length = 0;
  const provider = providerFromEnv({ CITYCHAT_PROVIDER: 'openai', CITYCHAT_BASE_URL: `${base}/v1`, CITYCHAT_MODEL: 'local', CITYCHAT_API_KEY: 'x' });
  const events = await collect(runChat({ provider, runTool, messages: [{ role: 'user', text: 'Milano?' }] }));
  const [one, two] = requests;
  check('OpenAI-compatible: posts to /chat/completions with a bearer key', one?.url === '/v1/chat/completions' && one.headers.authorization === 'Bearer x');
  check('OpenAI-compatible: system prompt first, tools as functions', one?.body.messages[0].role === 'system' && one.body.tools.every((t) => t.type === 'function'));
  check('OpenAI-compatible: tool result keyed to its call id', two?.body.messages.at(-1)?.role === 'tool' && two.body.messages.at(-1).tool_call_id === 't1');
  check('OpenAI-compatible: <think> is stripped from the answer', events.at(-1)?.text === 'Milano: 72,3% delle celle.', events.at(-1)?.text);
}
mock.close();

check('Every tool has a description and an object schema', TOOL_DEFINITIONS.every((t) => t.description && t.parameters?.type === 'object'));

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
