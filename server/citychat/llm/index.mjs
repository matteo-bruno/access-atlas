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

import { createGeminiProvider } from './gemini.mjs';
import { createOpenAIProvider } from './openai.mjs';

export function providerFromEnv(env = process.env) {
  const kind = (env.CITYCHAT_PROVIDER || 'gemini').toLowerCase();
  const temperature = env.CITYCHAT_TEMPERATURE ? Number(env.CITYCHAT_TEMPERATURE) : 0.3;
  const timeoutMs = Number(env.CITYCHAT_TIMEOUT_MS || 60000);

  if (kind === 'gemini') {
    return createGeminiProvider({
      apiKey: env.CITYCHAT_API_KEY || env.GEMINI_API_KEY,
      // An alias Google keeps pointed at its current Flash model, so the
      // prototype does not break when a dated version is retired. Pin a
      // specific model in production, where answers should not change under you.
      model: env.CITYCHAT_MODEL || 'gemini-flash-latest',
      baseUrl: env.CITYCHAT_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      temperature,
      timeoutMs,
    });
  }
  if (kind === 'openai') {
    if (!env.CITYCHAT_BASE_URL) {
      throw new Error(
        'CITYCHAT_PROVIDER=openai needs CITYCHAT_BASE_URL, e.g. http://127.0.0.1:8000/v1 for vLLM, http://127.0.0.1:11434/v1 for Ollama, https://api.openai.com/v1',
      );
    }
    return createOpenAIProvider({
      apiKey: env.CITYCHAT_API_KEY || '',
      model: env.CITYCHAT_MODEL,
      baseUrl: env.CITYCHAT_BASE_URL,
      temperature,
      timeoutMs,
    });
  }
  throw new Error(`Unknown CITYCHAT_PROVIDER "${kind}" (expected gemini or openai)`);
}
