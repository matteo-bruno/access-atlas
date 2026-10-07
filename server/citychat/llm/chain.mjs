// A list of models to try in order, for when the first one will not answer.
//
// Free tiers run out, models get overloaded, and a model name that worked last
// month is retired this month. So CityChat is configured with a list, not a
// model, and a turn that fails for a reason another model might not share
// (llm/http.mjs, RETRYABLE) is run again, from the start, on the next one.
//
// From the start, not from where it failed: a turn carries the model's own
// parts (Gemini's thought signatures), which only that model accepts back.
// The tools are cheap and deterministic, so running them twice costs nothing
// a reader would notice.
//
// A model that failed is set aside for a while, so the next question does
// not queue behind the same refusal: as long as a 429 asked for, a few
// minutes for an outage, hours for a model that does not exist. If every
// model is set aside, all of them are tried anyway, in order: waiting is
// never better than asking.

const COOLDOWN = {
  missing: 6 * 60 * 60 * 1000, // 404: retired or never existed
  forbidden: 30 * 60 * 1000, // 403: not open to this key or tier
  quota: 60 * 1000, // 429 with no stated delay
  outage: 30 * 1000, // 5xx, timeout, unreadable answer
};
const MAX_QUOTA_WAIT = 30 * 60 * 1000;

function cooldownFor(error) {
  if (error.status === 404) return COOLDOWN.missing;
  if (error.status === 403) return COOLDOWN.forbidden;
  if (error.status === 429) return Math.min(error.retryAfterMs ?? COOLDOWN.quota, MAX_QUOTA_WAIT);
  return COOLDOWN.outage;
}

/**
 * @param {() => Promise<object[]>} resolve  the providers, in order of preference
 *        (async, because `auto` asks the API which models exist)
 * @param {{ label?: string, now?: () => number }} [options]
 */
export function createChain(resolve, { label, now = Date.now } = {}) {
  const until = new Map(); // provider name → time it may be tried again
  let last = null; // what the chain resolved to, for /health

  return {
    get name() {
      return last ? last.map((p) => p.name).join(' > ') : label ?? 'models';
    },

    /** Providers to try for one turn: the available ones first, in order. */
    async candidates() {
      const all = await resolve();
      last = all;
      const t = now();
      const ready = all.filter((p) => !(until.get(p.name) > t));
      const resting = all.filter((p) => until.get(p.name) > t);
      return [...ready, ...resting];
    },

    succeeded(provider) {
      until.delete(provider.name);
    },

    failed(provider, error) {
      until.set(provider.name, now() + cooldownFor(error));
    },
  };
}

/** A single provider is a chain of one. */
export function asChain(providerOrChain) {
  if (typeof providerOrChain?.candidates === 'function') return providerOrChain;
  const one = providerOrChain;
  return createChain(async () => [one], { label: one.name });
}
