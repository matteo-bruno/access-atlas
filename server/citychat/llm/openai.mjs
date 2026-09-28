// Anything that speaks the OpenAI Chat Completions protocol.
//
// That is most of the field, and every local server worth running:
//
//   vLLM / SGLang        CITYCHAT_BASE_URL=http://127.0.0.1:8000/v1
//   llama.cpp            CITYCHAT_BASE_URL=http://127.0.0.1:8080/v1   (llama-server --jinja)
//   Ollama               CITYCHAT_BASE_URL=http://127.0.0.1:11434/v1
//   OpenAI, Mistral, DeepSeek, OpenRouter, Groq: their documented base URL
//
// Tool calling has to be enabled on the local servers (vLLM:
// --enable-auto-tool-choice with the model's --tool-call-parser; llama.cpp:
// --jinja), and the model has to have been trained for it. A model that
// cannot call tools will answer from memory, which is exactly what CityChat
// exists to prevent; numbers.mjs will flag it, but pick a model that can.

import { ProviderError, postSSE } from './http.mjs';

export function createOpenAIProvider({ apiKey, model, baseUrl, temperature, firstByteMs, idleMs }) {
  if (!model) throw new Error('CITYCHAT_PROVIDER=openai needs CITYCHAT_MODEL');
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const toMessages = (system, messages) => {
    const out = [{ role: 'system', content: system }];
    for (const m of messages) {
      if (m.role === 'user') out.push({ role: 'user', content: m.text });
      else if (m.role === 'assistant') {
        const msg = { role: 'assistant', content: m.text || null };
        if (m.toolCalls?.length) {
          msg.tool_calls = m.toolCalls.map((c) => ({
            id: c.id,
            type: 'function',
            function: { name: c.name, arguments: JSON.stringify(c.args ?? {}) },
          }));
        }
        out.push(msg);
      } else {
        for (const r of m.results) {
          out.push({ role: 'tool', tool_call_id: r.id, content: JSON.stringify(r.result) });
        }
      }
    }
    return out;
  };

  return {
    name: `openai:${model}@${new URL(baseUrl).host}`,
    async complete({ system, messages, tools, onProgress }) {
      const body = {
        model,
        messages: toMessages(system, messages),
        temperature,
        // Streamed, so a long answer is never cut off for being long.
        stream: true,
      };
      if (tools?.length) {
        body.tools = tools.map((t) => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.parameters },
        }));
      }

      // Deltas joined back into one message. Tool calls arrive in pieces
      // keyed by `index`: the id and name once, the arguments as fragments.
      let content = '';
      const calls = [];
      let usage = null;
      let seen = false;
      await postSSE(url, body, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        firstByteMs,
        idleMs,
        label: 'Model server',
        onData: (chunk) => {
          if (chunk.usage) usage = chunk.usage;
          const delta = chunk.choices?.[0]?.delta;
          if (!delta) return;
          seen = true;
          if (typeof delta.content === 'string') content += delta.content;
          for (const piece of delta.tool_calls ?? []) {
            const at = piece.index ?? calls.length;
            calls[at] ??= { id: '', name: '', arguments: '' };
            if (piece.id) calls[at].id = piece.id;
            if (piece.function?.name) calls[at].name += piece.function.name;
            if (piece.function?.arguments) calls[at].arguments += piece.function.arguments;
          }
          onProgress?.({ chars: content.length, calls: calls.length > 0 });
        },
      });
      if (!seen) throw new ProviderError('Model server returned no message');

      const toolCalls = calls.filter(Boolean).map((c, i) => ({
        id: c.id || `call_${i}`,
        name: c.name,
        args: parseArgs(c.arguments),
      }));
      // Reasoning models served locally often put their thinking in the
      // content between <think> tags; it is not part of the answer.
      const text = String(content).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      return {
        text,
        toolCalls,
        raw: null,
        usage: usage ? { input: usage.prompt_tokens, output: usage.completion_tokens } : null,
      };
    },
  };
}

function parseArgs(value) {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value || '{}');
  } catch {
    return {};
  }
}
