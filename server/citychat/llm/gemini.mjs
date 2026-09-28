// Google Gemini, through its own REST API (generateContent).
//
// Gemini also offers an OpenAI-compatible endpoint, and openai.mjs would work
// against it. The native API is used instead because it is the one Google
// documents first for function calling, and because it carries the thought
// signatures newer Gemini models require to be sent back with each function
// call: they live on the model's own parts, which this adapter replays as-is.

import { ProviderError, postJSON } from './http.mjs';

export function createGeminiProvider({ apiKey, model, baseUrl, temperature, timeoutMs }) {
  if (!apiKey) throw new Error('Gemini needs CITYCHAT_API_KEY (or GEMINI_API_KEY)');

  const url = `${baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:generateContent`;

  const toContents = (messages) =>
    messages.map((m) => {
      if (m.role === 'user') return { role: 'user', parts: [{ text: m.text }] };
      if (m.role === 'assistant') {
        if (m.raw?.provider === 'gemini') return { role: 'model', parts: m.raw.parts };
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
    async complete({ system, messages, tools }) {
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: toContents(messages),
        generationConfig: { temperature },
      };
      if (tools?.length) {
        body.tools = [{ functionDeclarations: tools.map(toDeclaration) }];
      }
      const data = await postJSON(url, body, {
        headers: { 'x-goog-api-key': apiKey },
        timeoutMs,
        label: 'Gemini',
      });

      const candidate = data.candidates?.[0];
      if (!candidate?.content?.parts) {
        const reason = candidate?.finishReason || data.promptFeedback?.blockReason || 'no content';
        throw new ProviderError(`Gemini returned no answer (${reason})`);
      }
      const parts = candidate.content.parts;
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
        raw: { provider: 'gemini', parts },
        usage: data.usageMetadata
          ? { input: data.usageMetadata.promptTokenCount, output: data.usageMetadata.candidatesTokenCount }
          : null,
      };
    },
  };
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
