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

import { ProviderError, postJSON } from './http.mjs';

export function createOpenAIProvider({ apiKey, model, baseUrl, temperature, timeoutMs }) {
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
    async complete({ system, messages, tools }) {
      const body = {
        model,
        messages: toMessages(system, messages),
        temperature,
      };
      if (tools?.length) {
        body.tools = tools.map((t) => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.parameters },
        }));
      }
      const data = await postJSON(url, body, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        timeoutMs,
        label: 'Model server',
      });
      const message = data.choices?.[0]?.message;
      if (!message) throw new ProviderError('Model server returned no message');

      const toolCalls = (message.tool_calls ?? []).map((c, i) => ({
        id: c.id || `call_${i}`,
        name: c.function?.name,
        args: parseArgs(c.function?.arguments),
      }));
      // Reasoning models served locally often put their thinking in the
      // content between <think> tags; it is not part of the answer.
      const text = String(message.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      return {
        text,
        toolCalls,
        raw: null,
        usage: data.usage ? { input: data.usage.prompt_tokens, output: data.usage.completion_tokens } : null,
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
