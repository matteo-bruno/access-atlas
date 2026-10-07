// Every figure in an answer has to come from somewhere.
//
// The Atlas publishes a number only if it can be traced to a file (CLAUDE.md,
// "computed from the published datasets or omitted"). A chat model is exactly
// the thing that breaks that rule quietly: it will write 64% where the tool
// said 67.7, or quote a figure it remembers from training. So after the model
// answers, every number in the answer is checked against the numbers the
// conversation actually contains: the tool results of this turn, the site's
// own copy in the system prompt, and what the user wrote. What is left over is
// reported, the model gets one chance to fix it, and the UI marks anything
// that survives that.
//
// Matching is by displayed precision: "43%" matches 42.7, "1.2 million"
// matches 1,201,023, "8:48" (the site's clock form for minutes) matches 8.8.
// Both locales' separators are tried, because "1,636" is a count in English
// and a decimal in Italian, and the check cannot know which one the model
// meant; accepting either keeps it from crying wolf.
//
// What it cannot do: it matches values, not meanings. "99% of cells favour
// the car" passes if 99.3 is in the results for any reason (it is, in Milan:
// the share within 15 minutes by bicycle). It catches invented and
// misremembered figures, which is the common failure; it does not prove an
// answer attributes each figure correctly. The rules in the prompt, and the
// tool trace the page shows under each answer, carry the rest.

// Too small to be a claim worth checking: "two layers", "the 4 zones".
const TRIVIAL = 10;

const SCALE_WORDS = [
  [/^(million|millions|milioni|milione|mln)\b/i, 1e6],
  [/^(thousand|thousands|mila|k)\b/i, 1e3],
];

/** Every number in a value, however deeply nested. */
export function collectNumbers(value, out = new Set()) {
  if (typeof value === 'number' && Number.isFinite(value)) out.add(value);
  else if (typeof value === 'string') for (const n of numbersInText(value)) for (const c of n.candidates) out.add(c.value);
  else if (Array.isArray(value)) for (const v of value) collectNumbers(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectNumbers(v, out);
  return out;
}

/**
 * Numbers as written in prose, each with the readings it could have and the
 * precision it was written at.
 */
export function numbersInText(text) {
  // Links, inline code and H3 ids carry digits that are not figures.
  const clean = String(text)
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/`[^`]*`/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\b[0-9a-f]{15}\b/gi, ' ');

  const found = [];
  const re = /(\d{1,2}):(\d{2})\b|(\d[\d.,  ']*\d|\d)(\s*%)?/g;
  let m;
  while ((m = re.exec(clean))) {
    if (m[1] != null) {
      // m:ss — the clock form the site uses for 15-minute times — or hh:00.
      const minutes = Number(m[1]) + Number(m[2]) / 60;
      found.push({
        raw: m[0],
        candidates: [
          { value: minutes, tolerance: 0.5 / 60 + 0.05 },
          { value: Number(m[1]), tolerance: 0 },
        ],
      });
      continue;
    }
    const token = m[3];
    const after = clean.slice(re.lastIndex).replace(/^\s+/, '');
    let scale = 1;
    for (const [word, factor] of SCALE_WORDS) if (word.test(after)) scale = factor;
    const candidates = readings(token).map(({ value, decimals }) => ({
      value: value * scale,
      tolerance: 0.5 * 10 ** -decimals * scale,
    }));
    if (candidates.length) found.push({ raw: m[0].trim(), candidates });
  }
  return found;
}

/** A digit string read the English way and the Italian way. */
function readings(token) {
  const t = token.replace(/[  ']/g, '');
  const out = [];
  const add = (thousands, decimal) => {
    const parts = t.split(decimal);
    if (parts.length > 2) return;
    const [intPart, frac = ''] = parts;
    const groups = intPart.split(thousands);
    // Thousands groups are exactly three digits after the first.
    if (groups.length > 1 && !groups.slice(1).every((g) => /^\d{3}$/.test(g))) return;
    if (!groups.every((g) => /^\d+$/.test(g)) || (frac && !/^\d+$/.test(frac))) return;
    out.push({ value: Number(`${groups.join('')}.${frac || 0}`), decimals: frac.length });
  };
  add(',', '.');
  add('.', ',');
  return out;
}

/**
 * The numbers in `answer` that nothing in `allowed` accounts for.
 *
 * @param {string} answer
 * @param {Set<number>} allowed
 * @returns {string[]}  the offending tokens as written
 */
export function unverifiedNumbers(answer, allowed) {
  const pool = [...allowed].map(Math.abs);
  const bad = [];
  for (const n of numbersInText(answer)) {
    const plausible = n.candidates.filter((c) => c.value > TRIVIAL || !Number.isInteger(c.value));
    if (!plausible.length) continue;
    // Years are dates, not measurements.
    if (n.candidates.some((c) => Number.isInteger(c.value) && c.value >= 1900 && c.value <= 2100 && c.tolerance <= 0.5)) continue;
    const ok = plausible.some((c) => pool.some((v) => Math.abs(v - c.value) <= c.tolerance + 1e-9));
    if (!ok) bad.push(n.raw);
  }
  return [...new Set(bad)];
}
