// The browser's side of CityChat: where the service is, and how to read it.
//
// The static site does not need the service. It sits behind the web server at
// `<base>api/citychat` (or VITE_CITYCHAT_URL, for a service on another host),
// and when nothing answers there the CityChat tab says so; no other page
// knows it exists.
//
// A wrong URL does not fail loudly here: under the SPA fallback a path nothing
// serves is answered with index.html and a 200 (CLAUDE.md, "The SPA fallback
// masks 404s"). So a response only counts if it says it is the service's own:
// NDJSON for a chat, JSON with `ok` for the health check.

// Whether this build talks to the service at all. Off unless the build says
// so (VITE_CITYCHAT=1, or a VITE_CITYCHAT_URL), because a host with no
// service answers the probe with a 404, and a static build that is never
// going to have one (GitHub Pages, the CI build the browser suites run
// against) should not make a request it knows will fail. `npm run dev` is
// always on: that is where the service is developed.
export const CITYCHAT_ENABLED = Boolean(
  import.meta.env.DEV || import.meta.env.VITE_CITYCHAT === '1' || import.meta.env.VITE_CITYCHAT_URL,
);

export function cityChatUrl(path = '') {
  const configured = import.meta.env.VITE_CITYCHAT_URL;
  const base = configured ? configured.replace(/\/$/, '') : `${import.meta.env.BASE_URL}api/citychat`;
  return `${base}${path}`;
}

/** Is the service there? Resolves to its provider name, or null. */
export async function probeCityChat({ signal } = {}) {
  if (!CITYCHAT_ENABLED) return null;
  try {
    const response = await fetch(cityChatUrl('/health'), { signal, headers: { Accept: 'application/json' } });
    if (!response.ok || !/json/.test(response.headers.get('content-type') ?? '')) return null;
    const body = await response.json();
    return body?.ok ? body.provider ?? 'unknown' : null;
  } catch {
    return null;
  }
}

/** A failure the page explains: `code` is a key under citychat.errors. */
export class CityChatError extends Error {
  constructor(code) {
    super(code);
    this.name = 'CityChatError';
    this.code = code;
  }
}

/**
 * Ask one question. Calls `onEvent` for each event as it arrives (tool calls,
 * then the answer) and resolves with the answer event.
 *
 * @param {object} p
 * @param {{ role: 'user'|'assistant', text: string }[]} p.messages
 */
export async function askCityChat({ messages, persona, city, lang, signal, onEvent }) {
  let response;
  try {
    response = await fetch(cityChatUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
      body: JSON.stringify({ messages, persona, city: city || undefined, lang }),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new CityChatError('unavailable');
  }

  const type = response.headers.get('content-type') ?? '';
  if (!response.ok) {
    const body = /json/.test(type) ? await response.json().catch(() => null) : null;
    const known = ['rate_limited', 'busy', 'too_long'];
    throw new CityChatError(known.includes(body?.error) ? body.error : 'unavailable');
  }
  if (!/ndjson/.test(type) || !response.body) throw new CityChatError('unavailable');

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let answer = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += value;
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      if (event.type === 'error') throw new CityChatError(['too_many_steps', 'quota'].includes(event.code) ? event.code : 'provider');
      if (event.type === 'answer') answer = event;
      onEvent?.(event);
    }
    if (done) break;
  }
  if (!answer) throw new CityChatError('provider');
  return answer;
}
