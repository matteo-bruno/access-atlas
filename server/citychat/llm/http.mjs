// Shared by the provider adapters: one error type and the two HTTP calls.

// Failures another model might not have: the model is over its quota (429),
// overloaded or down (5xx), unknown or retired (404), not open to this key or
// this tier (403), or did not answer in time. A request the API rejects as
// malformed (400) is the same request for every model, so it is not here.
const RETRYABLE = new Set([403, 404, 408, 429, 500, 502, 503, 504]);

/** A provider failure the user can be told about without leaking details. */
export class ProviderError extends Error {
  constructor(message, { status, detail, retryable, retryAfterMs } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
    this.detail = detail;
    // Whether the next model in the chain is worth trying.
    this.retryable = retryable ?? (status == null || RETRYABLE.has(status));
    // How long this model said to wait, when it said.
    this.retryAfterMs = retryAfterMs ?? null;
  }
}

/**
 * How long a 429 asked us to wait: the Retry-After header, or Google's
 * RetryInfo in the error body (`"retryDelay": "37s"`).
 */
function retryAfter(response, text) {
  const header = Number(response.headers.get('retry-after'));
  if (Number.isFinite(header) && header > 0) return header * 1000;
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(text);
  return m ? Number(m[1]) * 1000 : null;
}

async function request(url, { method, body, headers = {}, timeoutMs, label }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let text;
  try {
    response = await fetch(url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    text = await response.text();
  } catch (error) {
    throw new ProviderError(`${label}: request failed (${error.name === 'AbortError' ? 'timeout' : error.message})`);
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new ProviderError(`${label}: HTTP ${response.status}`, {
      status: response.status,
      detail: text.slice(0, 2000),
      retryAfterMs: response.status === 429 ? retryAfter(response, text) : null,
    });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ProviderError(`${label}: response was not JSON`, { detail: text.slice(0, 500), retryable: true });
  }
}

/** POST JSON with a deadline; the body of a failed response is in the error. */
export function postJSON(url, body, options) {
  return request(url, { ...options, method: 'POST', body });
}

/** GET JSON with a deadline. */
export function getJSON(url, options) {
  return request(url, { ...options, method: 'GET' });
}

/**
 * POST and read the answer as Server-Sent Events, one parsed `data:` payload
 * at a time.
 *
 * The deadline is not on the call, it is on silence. A model that thinks
 * for a long time before writing is working, and one that is writing is
 * certainly working, so neither is cut off: `firstByteMs` bounds only the
 * wait for the first byte (a thinking model says nothing until it has
 * thought), and once anything has arrived `idleMs` bounds only a gap between
 * two chunks, which is a stalled connection rather than a slow answer. There
 * is no limit on the whole.
 *
 * A failure before the first byte can go to the next model like any other.
 * One after it is marked `started`, for the log: the model was answering.
 *
 * @param {(data: object) => void} onData  called per event; `[DONE]` ends the stream
 */
export async function postSSE(url, body, { headers = {}, firstByteMs, idleMs, label, onData }) {
  const controller = new AbortController();
  let started = false;
  let timer = null;
  let timedOut = false;
  const arm = (ms) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, ms);
  };
  const fail = (message, extra = {}) =>
    Object.assign(new ProviderError(`${label}: ${message}`, extra), { started });

  arm(firstByteMs);
  try {
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      throw fail(timedOut ? `no answer within ${Math.round(firstByteMs / 1000)} s` : `request failed (${error.message})`);
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw fail(`HTTP ${response.status}`, {
        status: response.status,
        detail: text.slice(0, 2000),
        retryAfterMs: response.status === 429 ? retryAfter(response, text) : null,
      });
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let dataLines = [];
    const dispatch = () => {
      if (!dataLines.length) return false;
      const payload = dataLines.join('\n');
      dataLines = [];
      if (payload.trim() === '[DONE]') return true;
      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        throw fail('unreadable event in the stream', { detail: payload.slice(0, 500), retryable: true });
      }
      onData(parsed);
      return false;
    };

    const reader = response.body.getReader();
    for (;;) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (error) {
        throw fail(
          timedOut
            ? started
              ? `stream stalled for ${Math.round(idleMs / 1000)} s`
              : `no answer within ${Math.round(firstByteMs / 1000)} s`
            : `stream broke (${error.message})`,
        );
      }
      if (chunk.done) break;
      if (!started) started = true;
      arm(idleMs);
      buffer += decoder.decode(chunk.value, { stream: true });
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).replace(/\r$/, '');
        buffer = buffer.slice(newline + 1);
        if (line === '') {
          if (dispatch()) {
            reader.cancel().catch(() => {});
            return;
          }
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).replace(/^ /, ''));
        }
        // `event:`, `id:` and comments carry nothing these APIs use.
      }
    }
    buffer += decoder.decode();
    if (buffer.startsWith('data:')) dataLines.push(buffer.slice(5).replace(/^ /, ''));
    dispatch();
  } finally {
    clearTimeout(timer);
  }
}
