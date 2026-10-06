// Which model CityChat talks to, chosen by environment variables.
//
// Every provider implements one method and speaks one neutral conversation
// format, so the chat loop (chat.mjs) never knows which model is behind it:
//
//   complete({ system, messages, tools }) → { text, toolCalls, raw }
//
//   messages: { role: 'user', text }
//           | { role: 'assistant', text, toolCalls: [{ id, name, args }], raw }
//           | { role: 'tool', results: [{ id, name, result }] }
//   tools:    [{ name, description, parameters }]   (JSON Schema)
//
// `raw` is whatever the provider needs replayed verbatim on the next call
// (Gemini's thought signatures ride on its function-call parts, and a request
// that drops them is refused). Only the provider that produced it reads it.
//
// Two adapters cover the field:
//   gemini  Google's own API, the default.
//   openai  anything speaking the OpenAI Chat Completions protocol: OpenAI,
//           Mistral, DeepSeek, OpenRouter, Groq, and every local server worth
//           running (vLLM, SGLang, llama.cpp's llama-server, Ollama, LM Studio).
// A third protocol is one more file with the same method.
//
// What the server holds is not one provider but a chain of them, one per
// configured model (chain.mjs), so a model that will not answer hands the
// turn to the next.

import { createGeminiProvider, listGeminiFlashModels } from './gemini.mjs';
import { createOpenAIProvider } from './openai.mjs';
import { createChain } from './chain.mjs';

// How long `auto` trusts its list of models before asking again.
const AUTO_REFRESH_MS = 6 * 60 * 60 * 1000;

/**
 * The models to use, as a chain (llm/chain.mjs): tried in order, each one
 * falling through to the next when it is over quota, overloaded or gone.
 *
 * CITYCHAT_MODEL is a comma-separated list, most preferred first:
 *
 *   CITYCHAT_MODEL=gemini-3.8-flash,gemini-3-flash,gemini-2.5-flash
 *
 * For Gemini, an entry `auto` stands for every Flash model the key can call,
 * newest first, as the API lists them; it is the default, so a model Google
 * adds is used without a config change and one it retires is dropped.
 * Names may be mixed with it: `gemini-2.5-flash,auto` puts one model first.
 *
 * A local model joins the chain with CITYCHAT_LOCAL_URL and
 * CITYCHAT_LOCAL_MODEL: after the remote ones by default, as a last resort;
 * first with CITYCHAT_LOCAL_FIRST=1; alone when there is no Gemini key.
 */
export function providerFromEnv(env = process.env) {
  const kind = (env.CITYCHAT_PROVIDER || 'gemini').toLowerCase();
  const temperature = env.CITYCHAT_TEMPERATURE ? Number(env.CITYCHAT_TEMPERATURE) : 0.3;
  // No limit on how long an answer takes, only on silence (llm/http.mjs,
  // postSSE): how long to wait for a model to start, which covers its
  // thinking, and how long a stream may then stall before it is given up.
  const firstByteMs = Number(env.CITYCHAT_FIRST_BYTE_MS || env.CITYCHAT_TIMEOUT_MS || 90000);
  const idleMs = Number(env.CITYCHAT_IDLE_MS || 120000);
  const list = (value) =>
    String(value || '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

  const segments = []; // each: { label, resolve: async () => providers[] }
  const geminiKey = env.CITYCHAT_API_KEY || env.GEMINI_API_KEY;

  if (kind === 'gemini' && (geminiKey || !env.CITYCHAT_LOCAL_URL)) {
    if (!geminiKey) throw new Error('Gemini needs CITYCHAT_API_KEY (or GEMINI_API_KEY), or set CITYCHAT_LOCAL_URL to run on a local model alone');
    segments.push(geminiSegment({ env, apiKey: geminiKey, entries: list(env.CITYCHAT_MODEL || 'auto'), temperature, firstByteMs, idleMs }));
  } else if (kind === 'openai') {
    if (!env.CITYCHAT_BASE_URL) {
      throw new Error(
        'CITYCHAT_PROVIDER=openai needs CITYCHAT_BASE_URL, e.g. http://127.0.0.1:8000/v1 for vLLM, http://127.0.0.1:11434/v1 for Ollama, https://api.openai.com/v1',
      );
    }
    const entries = list(env.CITYCHAT_MODEL);
    if (!entries.length) throw new Error('CITYCHAT_PROVIDER=openai needs CITYCHAT_MODEL');
    segments.push(openaiSegment({ baseUrl: env.CITYCHAT_BASE_URL, apiKey: env.CITYCHAT_API_KEY, entries, temperature, firstByteMs, idleMs }));
  } else if (kind !== 'gemini') {
    throw new Error(`Unknown CITYCHAT_PROVIDER "${kind}" (expected gemini or openai)`);
  }

  // A model on this machine or cluster, beside or instead of the one above:
  // any OpenAI-compatible server (Ollama, llama.cpp, vLLM). It comes after
  // the remote models unless CITYCHAT_LOCAL_FIRST=1, and it gets a longer
  // wait for its first byte, because a model on a CPU reads a long prompt
  // slowly before it writes anything.
  if (env.CITYCHAT_LOCAL_URL) {
    const entries = list(env.CITYCHAT_LOCAL_MODEL);
    if (!entries.length) throw new Error('CITYCHAT_LOCAL_URL needs CITYCHAT_LOCAL_MODEL, e.g. qwen3:8b');
    const local = openaiSegment({
      baseUrl: env.CITYCHAT_LOCAL_URL,
      apiKey: env.CITYCHAT_LOCAL_API_KEY,
      entries,
      temperature,
      firstByteMs: Number(env.CITYCHAT_LOCAL_FIRST_BYTE_MS || 300000),
      idleMs,
      prefix: 'local',
    });
    if (env.CITYCHAT_LOCAL_FIRST === '1') segments.unshift(local);
    else segments.push(local);
  }

  return createChain(
    async () => {
      const all = [];
      for (const segment of segments) all.push(...(await segment.resolve()));
      return all;
    },
    { label: segments.map((g) => g.label).join(',') },
  );
}

function geminiSegment({ apiKey, entries, temperature, firstByteMs, idleMs, env }) {
  const baseUrl = env.CITYCHAT_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
  const providers = new Map(); // one provider per model name, kept across refreshes
  const get = (model) => {
    if (!providers.has(model)) providers.set(model, createGeminiProvider({ apiKey, model, baseUrl, temperature, firstByteMs, idleMs }));
    return providers.get(model);
  };
  let auto = null; // { names, at }
  const expandAuto = async () => {
    if (auto && Date.now() - auto.at < AUTO_REFRESH_MS) return auto.names;
    try {
      const names = await listGeminiFlashModels({ apiKey, baseUrl });
      if (!names.length) throw new Error('no Flash models listed for this key');
      auto = { names, at: Date.now() };
      console.log(`[citychat] auto: ${names.join(', ')}`);
    } catch (error) {
      // Keep the last good list; with none, fall back to the alias Google
      // keeps pointed at its current Flash model.
      console.error(`[citychat] could not list Gemini models: ${error.message}`);
      if (!auto) return ['gemini-flash-latest'];
    }
    return auto.names;
  };
  return {
    label: `gemini:${entries.join(',')}`,
    async resolve() {
      const names = [];
      for (const entry of entries) {
        for (const name of entry === 'auto' ? await expandAuto() : [entry]) {
          if (!names.includes(name)) names.push(name);
        }
      }
      return names.map(get);
    },
  };
}

function openaiSegment({ baseUrl, apiKey, entries, temperature, firstByteMs, idleMs, prefix = 'openai' }) {
  const providers = entries.map((model) =>
    createOpenAIProvider({ apiKey: apiKey || '', model, baseUrl, temperature, firstByteMs, idleMs, prefix }),
  );
  return { label: `${prefix}:${entries.join(',')}`, resolve: async () => providers };
}
