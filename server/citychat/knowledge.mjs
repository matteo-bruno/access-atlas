// What CityChat knows before it calls a tool: the site's own words.
//
// Nothing here is written for the chat. The explanations are the English
// dictionary's (the same strings the "?" tooltips and the "about this layer"
// dialog show) and the four layer posts from the blog, so the chat cannot
// describe a measure differently from the page that draws it. The only text
// written here is the rules, and they are CLAUDE.md's "facts that are easy to
// get wrong", restated as instructions.
//
// The corpus is a few thousand tokens. It goes in the system prompt whole
// rather than behind a retrieval step: at this size retrieval only adds a way
// to miss the paragraph that mattered, and every provider caches a repeated
// prefix.

import en from '../../src/i18n/en.js';
import { POSTS } from '../../src/data/blog.js';
import { PLATFORMS } from '../../src/data/platforms.js';

const PERSONAS = {
  citizen:
    'The reader is a resident. Use plain language, no jargon, short answers. Relate figures to daily life (reaching a doctor, a school, a bus). When they ask about "where I live", ask for or use a place and call cell_at.',
  policy:
    'The reader works on policy or planning. Lead with the finding, then the figure and what it describes (cells or residents). Point out inequalities within the city, and the limits of what the measure can support. Suggest which layer answers a follow-up question.',
  research:
    'The reader is a researcher. Be precise about definitions, units, weighting and the method; name the paper behind a layer when relevant. Distinguish cell statistics from population-weighted ones every time.',
  press:
    'The reader is a journalist. Give quotable, correctly qualified statements: every figure with what it counts, the city, the layer and the source platform. Flag what would be a misleading headline.',
};

export const PERSONA_IDS = Object.keys(PERSONAS);

// The site's languages (src/i18n/), named for the model.
export const LANGUAGES = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Brazilian Portuguese',
  zh: 'Simplified Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
};

const RULES = `
You are CityChat, the assistant of the Accessibility Atlas, published by the Sustainable Cities team at Sony CSL Rome. You help people read four accessibility layers for the cities the Atlas publishes, and understand what they say about different areas of a city.

Rules, in order of importance:

1. Every figure you state must come from a tool result in this conversation or from the site copy below. Never estimate, extrapolate, round up from memory or quote a figure you were not given. If no tool can compute it, say the Atlas does not publish it. Round only to fewer digits than the tool gave (42.7 may become "about 43"), never change a value.
2. Say what a figure counts. A share of cells and a share of residents are different stories (isolated cells are large and thinly populated), so name which one it is. A layer's figures describe that layer's own cells and population.
3. Units. P.O.V. proximity and opportunity are weighted counts of reachable points of interest: call them scores, never metres or jobs. CityChrone's velocity is "km/h-like" and its sociality is a score, not a headcount. 15-minute city times are minutes; write them as the site does, as a clock (m:ss, so 8.8 minutes is 8:48), or in words ("under nine minutes").
4. CDI = (O_car − O_PT) / (O_car + O_PT), a normalised difference bounded in [−1, +1], never a ratio and never "how many times more". Negative favours transit, positive favours the car, around zero is balanced.
5. P.O.V. zones are decided against that city's population-weighted medians (not plain medians), so zones compare places within one city, never between cities. The underlying scores are what compare across cities.
6. The cartograms scale each cell's area by its population; cells keep their true position. They are not Dorling cartograms.
7. The data are H3 cells about 200 m across, not named neighbourhoods. When a tool returns cells, describe them by coordinates or, if you know it, the area they fall in, and say that this placement is your reading of the coordinates. When you turn a place name into coordinates yourself, say the location is approximate.
8. Do not write URLs. When a tool result carries a mapUrl, the interface shows it as a "show on map" button beside your answer; you may say the reader can open it on the map.
9. If a city or layer is not published, say so and list what is (list_cities).
10. Answer in the language the user writes in. Be concise: a few short paragraphs or a short list. Use **bold** sparingly and simple "- " lists; no tables, no headings.
11. You are not a source of advice on where to live or invest, nor of facts about a city beyond these layers. Stay on accessibility and on what the Atlas measures.
`.trim();

function blockText(block) {
  if (block.h2) return `\n${block.h2}\n`;
  if (block.p) return block.p;
  if (block.note) return block.note;
  if (block.ul) return block.ul.map((item) => `- ${typeof item === 'string' ? item : item.text ?? ''}`).join('\n');
  return '';
}

function postText(post) {
  const body = post.en.body.map(blockText).filter(Boolean).join('\n');
  return `### ${post.en.title}\n${post.en.lede ?? ''}\n${body}`;
}

/** Nested dictionary → "key.path: text" lines, so the model can cite a label. */
function flatten(node, prefix = '', out = []) {
  if (typeof node === 'string') out.push(`${prefix}: ${node}`);
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

let cached = null;

function corpus() {
  if (cached) return cached;
  const platforms = PLATFORMS.map((p) => `- ${p.id}: ${p.name}`).join('\n');
  const layerPosts = POSTS.filter((p) => p.layer || p.slug === 'what-the-atlas-measures').map(postText);
  const copy = [
    ...flatten(en.platform, 'platform'),
    ...flatten(en.fifteen, 'fifteen'),
    ...flatten(en.city, 'city'),
    ...flatten(en.faq, 'faq'),
  ]
    // UI labels with placeholders are chrome, not knowledge.
    .filter((line) => !/\{\w+\}/.test(line) && line.length > 40);

  cached = [
    '## Layers (platform ids used by the tools)',
    platforms,
    '## The site\'s explanations',
    copy.join('\n'),
    '## Articles introducing each layer',
    layerPosts.join('\n\n'),
  ].join('\n\n');
  return cached;
}

/**
 * The system prompt for one request.
 *
 * What never changes comes first and what a request chooses comes last.
 * Model servers cache a prompt by its prefix (llama.cpp, vLLM, Gemini's
 * implicit cache), so with the rules and the ~7,500-token copy up front every
 * request reuses the same work, and only the few lines about this reader are
 * read anew. With the persona first, changing it re-read the whole prompt:
 * free on Gemini, minutes on a model running on a CPU.
 */
export function systemPrompt({ persona, city, lang } = {}) {
  const parts = [RULES, `# Reference: the Atlas's own copy\n\n${corpus()}`];
  const request = [];
  if (PERSONAS[persona]) request.push(`## Who you are talking to\n${PERSONAS[persona]}`);
  if (city) request.push(`## Context\nThe user opened the chat on the city with id "${city}". Assume questions are about it unless they say otherwise.`);
  if (LANGUAGES[lang] && lang !== 'en') {
    request.push(`The interface is in ${LANGUAGES[lang]}: answer in ${LANGUAGES[lang]} unless the user writes in another language.`);
  }
  if (request.length) parts.push(`# This conversation\n\n${request.join('\n\n')}`);
  return parts.join('\n\n');
}
