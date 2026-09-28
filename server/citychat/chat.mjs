// One CityChat turn: the model calls tools until it can answer, then the
// answer's figures are checked against what the tools returned.
//
// Stateless. The browser sends the conversation's visible text each time;
// tool results are not carried between turns, so a follow-up that needs a
// figure calls the tool again rather than trusting a figure the client says
// it was given.

import { systemPrompt } from './knowledge.mjs';
import { TOOL_DEFINITIONS } from './tools.mjs';
import { collectNumbers, unverifiedNumbers } from './numbers.mjs';
import { asChain } from './llm/chain.mjs';
import { ProviderError } from './llm/http.mjs';

const MAX_STEPS = 8;
const MAX_LINKS = 6;

const CORRECTION = (bad) =>
  `These figures in your answer do not appear in any tool result or in the site copy: ${bad.join(', ')}. ` +
  'Call a tool that computes them, or rewrite the answer without them. Reply with the corrected answer only.';

/**
 * One turn, on the first model in the chain that answers.
 *
 * A model that fails in a way the next one might not (over quota, down,
 * retired: ProviderError.retryable) hands the turn over, and the turn starts
 * again on it. The page is told with a `fallback` event, so it can clear the
 * tool calls it was showing; the answer says which model gave it.
 *
 * @param {object} p
 * @param {object} p.provider  a chain (llm/chain.mjs) or a single provider
 * @param {(name: string, args: object) => Promise<object>} p.runTool
 * @param {{ role: 'user'|'assistant', text: string }[]} p.messages  the visible conversation, ending with the user's question
 * @param {string} [p.persona]
 * @param {string} [p.city]
 * @param {string} [p.lang]
 * @returns {AsyncGenerator<object>}  events: tool, status, answer
 */
export async function* runChat({ provider, ...turn }) {
  const chain = asChain(provider);
  const candidates = await chain.candidates();
  const failures = [];
  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    try {
      for await (const event of runTurn({ ...turn, provider: model })) {
        yield event.type === 'answer' ? { ...event, model: model.name, fallbacks: failures } : event;
      }
      chain.succeeded(model);
      return;
    } catch (error) {
      if (!(error instanceof ProviderError) || !error.retryable) throw error;
      chain.failed(model, error);
      failures.push({ model: model.name, status: error.status ?? null, reason: error.message, started: !!error.started });
      console.error(`[citychat] ${model.name} failed (${error.message})${i + 1 < candidates.length ? `, trying ${candidates[i + 1].name}` : ''}`);
      if (i + 1 < candidates.length) yield { type: 'status', status: 'fallback', from: model.name, to: candidates[i + 1].name };
    }
  }
  // Every model refused. Over quota everywhere is worth saying as such: it
  // passes on its own, and the reader should wait rather than rephrase.
  const quota = failures.length > 0 && failures.every((f) => f.status === 429);
  throw Object.assign(new ProviderError(`every model failed: ${failures.map((f) => `${f.model} ${f.status ?? 'error'}`).join(', ')}`, { status: quota ? 429 : 503 }), {
    exhausted: true,
    quota,
    failures,
  });
}

/** One turn on one model. */
async function* runTurn({ provider, runTool, messages, persona, city, lang }) {
  const system = systemPrompt({ persona, city, lang });
  const convo = messages.map((m) => ({ role: m.role, text: m.text }));

  // Figures the answer may quote without a tool: the site's copy, and
  // anything already said in the conversation.
  const allowed = collectNumbers(system);
  for (const m of messages) collectNumbers(m.text, allowed);

  const links = new Map();
  const toolsUsed = [];
  let corrected = false;
  let usage = { input: 0, output: 0 };

  for (let step = 0; step < MAX_STEPS; step++) {
    // The model streams; while it does, the page hears that it is writing,
    // which is also what keeps every proxy between here and it from closing
    // a connection that has gone quiet.
    let res;
    for await (const item of whileWaiting((onProgress) =>
      provider.complete({ system, messages: convo, tools: TOOL_DEFINITIONS, onProgress }),
    )) {
      if (item.done) res = item.value;
      else yield item.value;
    }
    if (res.usage) {
      usage.input += res.usage.input ?? 0;
      usage.output += res.usage.output ?? 0;
    }

    if (res.toolCalls.length) {
      convo.push({ role: 'assistant', text: res.text, toolCalls: res.toolCalls, raw: res.raw });
      const results = [];
      for (const call of res.toolCalls) {
        yield { type: 'tool', name: call.name, args: call.args };
        const result = await runTool(call.name, call.args);
        collectNumbers(result, allowed);
        collectLinks(result, links);
        toolsUsed.push({ name: call.name, args: call.args, ok: !result?.error });
        results.push({ id: call.id, name: call.name, result });
      }
      convo.push({ role: 'tool', results });
      continue;
    }

    const answer = (res.text || '').trim();
    const bad = unverifiedNumbers(answer, allowed);
    if (bad.length && !corrected) {
      // One chance to fix it. The draft is kept in the conversation so the
      // model corrects its own text rather than starting over.
      corrected = true;
      yield { type: 'status', status: 'checking' };
      convo.push({ role: 'assistant', text: answer, raw: res.raw });
      convo.push({ role: 'user', text: CORRECTION(bad) });
      continue;
    }

    yield {
      type: 'answer',
      text: answer,
      unverified: bad,
      links: [...links.values()].slice(0, MAX_LINKS),
      tools: toolsUsed,
      usage,
    };
    return;
  }

  yield { type: 'error', code: 'too_many_steps' };
}

/** "Show on map" targets: every mapUrl a tool returned, with what it shows. */
function collectLinks(result, links) {
  const visit = (node, city, layer) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item, city, layer);
      return;
    }
    const c = node.city ?? city;
    const l = node.layer ?? layer;
    if (typeof node.mapUrl === 'string' && node.mapUrl.startsWith('/atlas/') && !links.has(node.mapUrl)) {
      const q = new URLSearchParams(node.mapUrl.split('?')[1] ?? '');
      links.set(node.mapUrl, {
        href: node.mapUrl,
        city: c ?? node.mapUrl.split('/')[2]?.split('?')[0],
        layer: q.get('layer') ?? null,
        cell: q.get('cell') ?? null,
        // Where the cell is, so two buttons for two cells read differently.
        ...(Number.isFinite(node.lat) && Number.isFinite(node.lon) ? { lat: node.lat, lon: node.lon } : {}),
      });
    }
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'mapUrl') visit(value, c, l);
    }
  };
  visit(result);
}

// How often the page may be told the answer has grown, at most.
const PROGRESS_EVERY_MS = 700;

/**
 * Run `start(onProgress)` and yield its progress as `progress` events while
 * it runs, then its result as `{ done: true, value }`. Writing progress is
 * throttled, and only reported once the model is writing prose rather than
 * calling a tool: a tool call is announced by its own event.
 */
async function* whileWaiting(start) {
  const queue = [];
  let wake = null;
  let settled = null;
  let lastAt = 0;
  const notify = () => {
    wake?.();
    wake = null;
  };
  start(({ chars, calls }) => {
    const now = Date.now();
    if (calls || !chars || now - lastAt < PROGRESS_EVERY_MS) return;
    lastAt = now;
    queue.push({ done: false, value: { type: 'progress', phase: 'writing', chars } });
    notify();
  }).then(
    (value) => {
      settled = { value };
      notify();
    },
    (error) => {
      settled = { error };
      notify();
    },
  );
  for (;;) {
    if (queue.length) {
      yield queue.shift();
      continue;
    }
    if (settled) break;
    await new Promise((resolve) => {
      wake = resolve;
    });
  }
  if (settled.error) throw settled.error;
  yield { done: true, value: settled.value };
}
