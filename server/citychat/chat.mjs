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

const MAX_STEPS = 8;
const MAX_LINKS = 6;

const CORRECTION = (bad) =>
  `These figures in your answer do not appear in any tool result or in the site copy: ${bad.join(', ')}. ` +
  'Call a tool that computes them, or rewrite the answer without them. Reply with the corrected answer only.';

/**
 * @param {object} p
 * @param {{ complete: Function }} p.provider
 * @param {(name: string, args: object) => Promise<object>} p.runTool
 * @param {{ role: 'user'|'assistant', text: string }[]} p.messages  the visible conversation, ending with the user's question
 * @param {string} [p.persona]
 * @param {string} [p.city]
 * @param {string} [p.lang]
 * @returns {AsyncGenerator<object>}  events: tool, status, answer
 */
export async function* runChat({ provider, runTool, messages, persona, city, lang }) {
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
    const res = await provider.complete({ system, messages: convo, tools: TOOL_DEFINITIONS });
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
