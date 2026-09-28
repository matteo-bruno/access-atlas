// Shared by the provider adapters: one error type and one JSON POST.

/** A provider failure the user can be told about without leaking details. */
export class ProviderError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
    this.detail = detail;
  }
}

/** fetch with a deadline, and the body of a failed response in the error. */
export async function postJSON(url, body, { headers = {}, timeoutMs, label }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ProviderError(`${label}: request failed (${error.name === 'AbortError' ? 'timeout' : error.message})`);
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  if (!response.ok) {
    throw new ProviderError(`${label}: HTTP ${response.status}`, { status: response.status, detail: text.slice(0, 2000) });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ProviderError(`${label}: response was not JSON`, { detail: text.slice(0, 500) });
  }
}
