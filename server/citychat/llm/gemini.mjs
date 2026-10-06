// Google Gemini, through its own REST API (generateContent).
//
// Gemini also offers an OpenAI-compatible endpoint, and openai.mjs would work
// against it. The native API is used instead because it is the one Google
// documents first for function calling, and because it carries the thought
// signatures newer Gemini models require to be sent back with each function
// call: they live on the model's own parts, which this adapter replays as-is.

import { ProviderError, getJSON, postSSE } from './http.mjs';

export function createGeminiProvider({ apiKey, model, baseUrl, temperature, firstByteMs, idleMs }) {
  if (!apiKey) throw new Error('Gemini needs CITYCHAT_API_KEY (or GEMINI_API_KEY)');
  const own = (raw) => raw?.provider === 'gemini' && raw.model === model;

  // Streamed, so a long answer is never cut off for being long: see postSSE.
  const url = `${baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;

  const toContents = (messages) =>
    messages.map((m) => {
      if (m.role === 'user') return { role: 'user', parts: [{ text: m.text }] };
      if (m.role === 'assistant') {
        if (own(m.raw)) return { role: 'model', parts: m.raw.parts };
        const parts = [];
        if (m.text) parts.push({ text: m.text });
        for (const call of m.toolCalls ?? []) parts.push({ functionCall: { name: call.name, args: call.args } });
        return { role: 'model', parts };
      }
      // Tool results go back as the user's turn, one part per call, matched
      // to its call by name (and by id, where the model gave one).
      return {
        role: 'user',
        parts: m.results.map((r) => ({
          functionResponse: {
            name: r.name,
            ...(r.id && !r.id.startsWith('call_') ? { id: r.id } : {}),
            // `response` must be an object; wrap arrays and scalars.
            response: r.result && typeof r.result === 'object' && !Array.isArray(r.result) ? r.result : { result: r.result },
          },
        })),
      };
    });

  return {
    name: `gemini:${model}`,
    async complete({ system, messages, tools, onProgress }) {
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: toContents(messages),
        generationConfig: { temperature },
      };
      if (tools?.length) {
        body.tools = [{ functionDeclarations: tools.map(toDeclaration) }];
      }

      // The stream's chunks, joined into the one answer they make up. Parts
      // are kept exactly as they came, one per chunk: a thought signature can
      // ride on any of them, and the next request has to send them back
      // untouched.
      const parts = [];
      let finishReason = null;
      let blockReason = null;
      let usageMetadata = null;
      await postSSE(url, body, {
        headers: { 'x-goog-api-key': apiKey },
        firstByteMs,
        idleMs,
        label: 'Gemini',
        onData: (chunk) => {
          const candidate = chunk.candidates?.[0];
          let text = '';
          for (const part of candidate?.content?.parts ?? []) {
            parts.push(part);
            if (typeof part.text === 'string' && !part.thought) text += part.text;
          }
          finishReason = candidate?.finishReason ?? finishReason;
          blockReason = chunk.promptFeedback?.blockReason ?? blockReason;
          usageMetadata = chunk.usageMetadata ?? usageMetadata;
          if (text) onProgress?.({ text });
        },
      });

      if (!parts.length) {
        throw new ProviderError(`Gemini returned no answer (${finishReason || blockReason || 'no content'})`);
      }
      const text = parts
        .filter((p) => typeof p.text === 'string' && !p.thought)
        .map((p) => p.text)
        .join('');
      const toolCalls = parts
        .filter((p) => p.functionCall)
        .map((p, i) => ({
          id: p.functionCall.id || `call_${i}`,
          name: p.functionCall.name,
          args: p.functionCall.args ?? {},
        }));
      return {
        text,
        toolCalls,
        raw: { provider: 'gemini', model, parts },
        usage: usageMetadata
          ? { input: usageMetadata.promptTokenCount, output: usageMetadata.candidatesTokenCount }
          : null,
      };
    },
  };
}

/**
 * The Flash models this key can call, newest first: what `CITYCHAT_MODEL=auto`
 * expands to. Asked of the API rather than written down, because Google
 * renames and retires models faster than this file would be edited.
 */
export async function listGeminiFlashModels({ apiKey, baseUrl, timeoutMs = 15000 }) {
  const names = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ pageSize: '1000', ...(pageToken ? { pageToken } : {}) });
    const data = await getJSON(`${baseUrl.replace(/\/$/, '')}/models?${q}`, {
      headers: { 'x-goog-api-key': apiKey },
      timeoutMs,
      label: 'Gemini model list',
    });
    for (const m of data.models ?? []) {
      if ((m.supportedGenerationMethods ?? []).includes('generateContent')) {
        names.push(String(m.name).replace(/^models\//, ''));
      }
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return rankFlashModels(names);
}

/**
 * Plain Flash chat models, best first: newest version first; at one version
 * the stable release before a preview; every full Flash before any Flash-Lite,
 * which is the last resort rather than the next step down. Aliases
 * (`-latest`), dated snapshots and the image, audio, TTS and live variants
 * are left out: they are either duplicates or not chat models.
 */
export function rankFlashModels(names) {
  const re = /^gemini-(\d+(?:\.\d+)?)-flash(-lite)?(?:-(preview)(?:-[a-z0-9-]*)?)?$/;
  const seen = new Set();
  const ranked = [];
  for (const name of names) {
    const m = re.exec(name);
    if (!m || /image|audio|tts|live|thinking|exp/.test(name) || seen.has(name)) continue;
    // A dated preview ("-preview-05-20") is a snapshot of the undated one.
    if (m[3] && /-preview-/.test(name) && names.includes(name.replace(/-preview-.*/, '-preview'))) continue;
    seen.add(name);
    ranked.push({ name, version: Number(m[1]), lite: !!m[2], preview: !!m[3] });
  }
  ranked.sort((a, b) => a.lite - b.lite || b.version - a.version || a.preview - b.preview || a.name.localeCompare(b.name));
  return ranked.map((r) => r.name);
}

/**
 * JSON Schema → Gemini's function declaration. Its schema is an OpenAPI
 * subset with upper-case type names, and an object with no properties has
 * to be left without a schema at all.
 */
function toDeclaration(tool) {
  const hasProps = Object.keys(tool.parameters?.properties ?? {}).length > 0;
  return {
    name: tool.name,
    description: tool.description,
    ...(hasProps ? { parameters: toSchema(tool.parameters) } : {}),
  };
}

function toSchema(schema) {
  const out = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type') out.type = String(value).toUpperCase();
    else if (key === 'properties') {
      out.properties = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toSchema(v)]));
    } else if (key === 'items') out.items = toSchema(value);
    else out[key] = value;
  }
  return out;
}
