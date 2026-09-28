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
