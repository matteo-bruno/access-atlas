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
import { createChain } from '../server/citychat/llm/chain.mjs';
import { ProviderError } from '../server/citychat/llm/http.mjs';
import { rankFlashModels } from '../server/citychat/llm/gemini.mjs';
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
/** Answer as Server-Sent Events, as both APIs do when asked to stream. */
function sse(res, events) {
  res.setHeader('Content-Type', 'text/event-stream');
  for (const e of events) res.write(`data: ${typeof e === 'string' ? e : JSON.stringify(e)}\n\n`);
  res.end();
}

const requests = [];
const mock = http.createServer(async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const parsed = JSON.parse(body);
  requests.push({ url: req.url, headers: req.headers, body: parsed });
  if (req.url.includes(':streamGenerateContent')) {
    const hasResponse = parsed.contents.at(-1).parts.some((p) => p.functionResponse);
    // The answer in three chunks, the way Gemini streams it; usage on the last.
    sse(res, hasResponse
      ? [
          { candidates: [{ content: { role: 'model', parts: [{ text: 'Milano: ' }] } }] },
          { candidates: [{ content: { role: 'model', parts: [{ text: '72,3% delle ' }] } }] },
          { candidates: [{ content: { role: 'model', parts: [{ text: 'celle.' }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } },
        ]
      : [{ candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'city_overview', args: { city: 'milan' } }, thoughtSignature: 'SIG' }] } }] }]);
  } else {
    const last = parsed.messages.at(-1);
    // Deltas, with the tool call's arguments split across two of them, and
    // the [DONE] sentinel OpenAI-compatible servers end on.
    sse(res, last.role === 'tool'
      ? [
          { choices: [{ delta: { role: 'assistant', content: '<think>hm</think>Milano: ' } }] },
          { choices: [{ delta: { content: '72,3% delle celle.' } }] },
          '[DONE]',
        ]
      : [
          { choices: [{ delta: { role: 'assistant', tool_calls: [{ index: 0, id: 't1', type: 'function', function: { name: 'city_overview', arguments: '{"city":' } }] } }] },
          { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"milan"}' } }] } }] },
          '[DONE]',
        ]);
  }
});
await new Promise((r) => mock.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${mock.address().port}`;

{
  requests.length = 0;
  const provider = providerFromEnv({ CITYCHAT_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: base, CITYCHAT_MODEL: 'm' });
  const events = await collect(runChat({ provider, runTool, messages: [{ role: 'user', text: 'Milano?' }] }));
  const [one, two] = requests;
  check('Gemini: key sent as x-goog-api-key, streamed from the model in the path', one?.headers['x-goog-api-key'] === 'k' && one.url === '/models/m:streamGenerateContent?alt=sse');
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
  check('OpenAI-compatible: streams from /chat/completions with a bearer key', one?.url === '/v1/chat/completions' && one.headers.authorization === 'Bearer x' && one.body.stream === true);
  check('OpenAI-compatible: system prompt first, tools as functions', one?.body.messages[0].role === 'system' && one.body.tools.every((t) => t.type === 'function'));
  check('OpenAI-compatible: tool result keyed to its call id', two?.body.messages.at(-1)?.role === 'tool' && two.body.messages.at(-1).tool_call_id === 't1');
  check('OpenAI-compatible: <think> never reaches a draft', !events.some((e) => e.type === 'draft' && /think|hm/.test(e.text)), JSON.stringify(events.filter((e) => e.type === 'draft')));
  check('OpenAI-compatible: <think> is stripped from the answer', events.at(-1)?.text === 'Milano: 72,3% delle celle.', events.at(-1)?.text);
}
mock.close();

// ── Falling back through the models ──────────────────────────────────
// A stand-in for Gemini where each model fails its own way, as the free
// tier does: over quota with a stated delay, retired, overloaded, fine.
{
  const calls = [];
  const behaviour = {
    'gemini-9-flash': () => [429, { error: { code: 429, status: 'RESOURCE_EXHAUSTED', details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '37s' }] } }],
    'gemini-8-flash': () => [404, { error: { code: 404, status: 'NOT_FOUND' } }],
    'gemini-7-flash': () => [503, { error: { code: 503, status: 'UNAVAILABLE' } }],
    'gemini-6-flash': () => [200, [{ candidates: [{ content: { role: 'model', parts: [{ text: 'Risposta.' }] } }] }]],
    'gemini-bad-flash': () => [400, { error: { code: 400, status: 'INVALID_ARGUMENT' } }],
  };
  const google = http.createServer(async (req, res) => {
    for await (const _ of req);
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'GET') {
      calls.push('list');
      return res.end(JSON.stringify({ models: [
        { name: 'models/gemini-6-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-9-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-9-flash-lite', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-9-flash-image', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-9-pro', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-9', supportedGenerationMethods: ['embedContent'] },
      ] }));
    }
    const model = decodeURIComponent(req.url.match(/models\/([^:]+):/)[1]);
    calls.push(model);
    const [status, body] = (behaviour[model] ?? behaviour['gemini-6-flash'])();
    if (status === 200) return sse(res, body);
    res.statusCode = status;
    res.end(JSON.stringify(body));
  });
  await new Promise((r) => google.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${google.address().port}`;
  const ask = (provider) => collect(runChat({ provider, runTool, messages: [{ role: 'user', text: 'Ciao' }] }));

  const chain = providerFromEnv({ GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: url, CITYCHAT_MODEL: 'gemini-9-flash, gemini-8-flash,gemini-7-flash,gemini-6-flash' });
  let events = await ask(chain);
  let answer = events.at(-1);
  check('Fallback: 429, 404 and 503 each hand the turn on', calls.join(' ') === 'gemini-9-flash gemini-8-flash gemini-7-flash gemini-6-flash', calls.join(' '));
  check('Fallback: the page is told at each step', events.filter((e) => e.status === 'fallback').map((e) => e.to).join(',') === 'gemini:gemini-8-flash,gemini:gemini-7-flash,gemini:gemini-6-flash');
  check('Fallback: the answer names the model that gave it', answer?.type === 'answer' && answer.model === 'gemini:gemini-6-flash', answer?.model);

  calls.length = 0;
  await ask(chain);
  check('Fallback: failed models are set aside for the next question', calls[0] === 'gemini-6-flash' && calls.length === 1, calls.join(' '));

  calls.length = 0;
  const bad = providerFromEnv({ GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: url, CITYCHAT_MODEL: 'gemini-bad-flash,gemini-6-flash' });
  let threw = null;
  try {
    await ask(bad);
  } catch (error) {
    threw = error;
  }
  check('Fallback: a malformed request (400) is not retried on another model', threw?.status === 400 && calls.join(' ') === 'gemini-bad-flash', calls.join(' '));

  calls.length = 0;
  const quota = providerFromEnv({ GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: url, CITYCHAT_MODEL: 'gemini-9-flash' });
  threw = null;
  try {
    await ask(quota);
  } catch (error) {
    threw = error;
  }
  check('Fallback: every model over quota is reported as quota', threw?.quota === true && threw.status === 429);

  calls.length = 0;
  const auto = providerFromEnv({ GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: url });
  events = await ask(auto);
  check('auto: lists the models once, then tries them newest first', calls.join(' ') === 'list gemini-9-flash gemini-6-flash', calls.join(' '));
  check('auto: the chain is what the API listed, Flash only, Lite last', auto.name === 'gemini:gemini-9-flash > gemini:gemini-6-flash > gemini:gemini-9-flash-lite', auto.name);
  google.close();
}

{
  // A model that goes down mid-turn, after a tool call: the next one starts
  // the turn over, never inheriting the first one's parts.
  let aCalls = 0;
  const seenByB = [];
  const a = {
    name: 'a',
    async complete() {
      if (aCalls++ === 0) return { text: '', toolCalls: [{ id: 'x', name: 'list_cities', args: {} }], raw: { provider: 'gemini', model: 'a', parts: ['A'] } };
      throw new ProviderError('down', { status: 503 });
    },
  };
  const b = {
    name: 'b',
    async complete({ messages }) {
      seenByB.push(messages.length);
      return { text: 'Ok.', toolCalls: [] };
    },
  };
  const events = await collect(runChat({ provider: createChain(async () => [a, b]), runTool, messages: [{ role: 'user', text: 'Città?' }] }));
  check('Fallback mid-turn: the next model starts from the question alone', seenByB[0] === 1 && events.at(-1)?.model === 'b', `${seenByB} ${events.at(-1)?.model}`);
}

// ── Long answers are not cut off; silence is ─────────────────────────
// Scaled down: a 300 ms wait for the first byte and 300 ms of allowed
// silence stand for the real 90 s and 120 s.
{
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const slow = http.createServer(async (req, res) => {
    for await (const _ of req);
    const model = decodeURIComponent(req.url.match(/models\/([^:]+):/)[1]);
    res.setHeader('Content-Type', 'text/event-stream');
    const chunk = (text) => res.write(`data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text }] } }] })}\n\n`);
    if (model === 'mute') {
      await sleep(600); // thinks past the first-byte wait, never writes
      return res.end();
    }
    await sleep(200); // thinking, inside the first-byte wait
    if (model === 'stall') {
      chunk('Inizio ');
      await sleep(700); // then goes quiet past the allowed silence
      return res.end();
    }
    // Writes for ~1.8 s in all, six times the first-byte wait, but never
    // silent for longer than 150 ms at a stretch.
    for (let i = 0; i < 12; i++) {
      chunk('parola ');
      await sleep(150);
    }
    res.end();
  });
  await new Promise((r) => slow.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${slow.address().port}`;
  const env = (model) => ({ GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: url, CITYCHAT_MODEL: model, CITYCHAT_FIRST_BYTE_MS: '300', CITYCHAT_IDLE_MS: '300' });
  const ask = (model) => collect(runChat({ provider: providerFromEnv(env(model)), runTool, messages: [{ role: 'user', text: 'Ciao' }] }));

  const t0 = Date.now();
  const events = await ask('long');
  const answer = events.at(-1);
  check(
    'Streaming: an answer that keeps writing is not cut off, however long it takes',
    answer?.type === 'answer' && answer.text === 'parola '.repeat(12).trim() && Date.now() - t0 > 1500,
    `${Date.now() - t0} ms`,
  );
  const drafts = events.filter((e) => e.type === 'draft');
  check(
    'Streaming: the answer reaches the page as it is written, and the drafts add up to it',
    drafts.length >= 3 && drafts.map((d) => d.text).join('').trim() === answer?.text,
    `${drafts.length} drafts`,
  );

  const fallback = await ask('mute,long');
  check('Streaming: a model silent past the first-byte wait hands over to the next', fallback.at(-1)?.model === 'gemini:long' && fallback.some((e) => e.status === 'fallback'));

  let stalled = null;
  try {
    await ask('stall');
  } catch (error) {
    stalled = error;
  }
  check('Streaming: a stream that goes quiet mid-answer is a stall, not an answer', stalled?.failures?.[0]?.model === 'gemini:stall' && /stalled/.test(stalled.failures[0].reason) && stalled.failures[0].started, stalled?.failures?.[0]?.reason);
  slow.close();
}

// ── A local model beside, or instead of, Gemini ──────────────────────
{
  const hits = [];
  const both = http.createServer(async (req, res) => {
    for await (const _ of req);
    if (req.url.includes(':streamGenerateContent')) {
      hits.push('gemini');
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: { code: 429 } }));
    }
    hits.push('local');
    sse(res, [{ choices: [{ delta: { role: 'assistant', content: 'Dal modello locale.' } }] }, '[DONE]']);
  });
  await new Promise((r) => both.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${both.address().port}`;
  const local = { CITYCHAT_LOCAL_URL: `${url}/v1`, CITYCHAT_LOCAL_MODEL: 'qwen3:8b' };
  const ask = (provider) => collect(runChat({ provider, runTool, messages: [{ role: 'user', text: 'Ciao' }] }));

  const alone = providerFromEnv({ ...local });
  let events = await ask(alone);
  check('Local: with no Gemini key, the local model answers alone', hits.join() === 'local' && events.at(-1)?.model?.startsWith('local:qwen3:8b@'), `${hits} ${events.at(-1)?.model}`);

  hits.length = 0;
  const backup = providerFromEnv({ ...local, GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: url, CITYCHAT_MODEL: 'gemini-9-flash' });
  events = await ask(backup);
  check('Local: Gemini over quota hands the turn to the local model', hits.join() === 'gemini,local' && events.at(-1)?.text === 'Dal modello locale.', hits.join());

  hits.length = 0;
  const first = providerFromEnv({ ...local, CITYCHAT_LOCAL_FIRST: '1', GEMINI_API_KEY: 'k', CITYCHAT_BASE_URL: url, CITYCHAT_MODEL: 'gemini-9-flash' });
  await ask(first);
  check('Local: CITYCHAT_LOCAL_FIRST puts it before Gemini', hits.join() === 'local' && /^local:.* > gemini:/.test(first.name), first.name);
  both.close();
}

{
  // The wait a 429 states is the wait it gets; without one, a minute.
  let t = 0;
  const p = (name) => ({ name });
  const chain = createChain(async () => [p('a'), p('b')], { now: () => t });
  chain.failed(p('a'), new ProviderError('x', { status: 429, retryAfterMs: 37000 }));
  const order = async () => (await chain.candidates()).map((c) => c.name).join('');
  check('Cooldown: a model resting goes to the back', (await order()) === 'ba');
  t = 36000;
  check('Cooldown: still resting before its stated delay', (await order()) === 'ba');
  t = 38000;
  check('Cooldown: back in front after it', (await order()) === 'ab');
}

check(
  'auto ranking: newest Flash first, stable before preview, Lite last, variants out',
  JSON.stringify(rankFlashModels(['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash-image', 'gemini-2.5-pro', 'gemini-2.0-flash-001'])) ===
    JSON.stringify(['gemini-3-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']),
);

check('Every tool has a description and an object schema', TOOL_DEFINITIONS.every((t) => t.description && t.parameters?.type === 'object'));

console.log(failures ? `\n${failures} failed` : '\nAll passed');
process.exit(failures ? 1 : 0);
