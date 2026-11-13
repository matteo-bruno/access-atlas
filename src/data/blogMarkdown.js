// Blog posts are Markdown files, content/blog/<slug>.md, read by the site
// (src/data/blog.js, through Vite) and by Node (scripts/lib/blog-posts.mjs,
// for CityChat and test:data). This module is the one parser both use: pure,
// no dependency, and only the Markdown a post needs.
//
// A post starts with a header between two `---` lines, one `key: value` a
// line:
//
//   title     the run-up of the title, in ink                 (required)
//   accent    the half of the title in the accent colour
//   kicker    the small line above the title
//   lede      the paragraph under the title                    (required)
//   date      YYYY-MM-DD                                       (required)
//   layer     a platform id (fifteen, citychrone, cardep, pov): the home
//             page's card for that layer opens this post
//   color     the dot beside the date, e.g. #b94e3b
//   draft     true keeps the post off the site
//
// The body is Markdown: `##` and `###` headings, paragraphs, **bold**,
// *italic*, `code`, [links](/atlas/rome) (a path opens in the site, a URL in
// a new tab), lists (`-` or `1.`), `>` quotes (set large), tables, `---`
// rules, and images on a line of their own:
//
//   ![What the image shows](15-minute-city/hero.webp "The caption") {wide}
//
// A relative image path is under public/blog-images/. The text in quotes is
// the caption, and `{wide}` lets the image leave the column for the page's
// width.

const REQUIRED = ['title', 'lede', 'date'];

/** A post file → the post, or throws saying what is wrong with it. */
export function parsePost(slug, raw) {
  const text = String(raw).replace(/\r\n?/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${slug}.md: no header between --- lines`);
  const meta = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const at = line.indexOf(':');
    if (at < 0) throw new Error(`${slug}.md: header line without "key: value": ${line}`);
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  for (const key of REQUIRED) if (!meta[key]) throw new Error(`${slug}.md: the header needs "${key}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${slug}.md: date must be YYYY-MM-DD, not ${meta.date}`);
  const body = parseMarkdown(match[2]);
  return {
    slug,
    date: meta.date,
    readingTime: readingTime(match[2]),
    accent: meta.color || '#1A1F4E',
    layer: meta.layer || undefined,
    draft: meta.draft === 'true',
    en: {
      kicker: meta.kicker || '',
      title: meta.title,
      titleAccent: meta.accent || '',
      lede: meta.lede,
      body,
    },
  };
}

/** Minutes to read, at 220 words a minute, never less than one. */
function readingTime(markdown) {
  const words = markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').split(/\s+/).filter((w) => /\w/.test(w)).length;
  return Math.max(1, Math.round(words / 220));
}

const IMAGE = /^!\[([^\]]*)\]\(\s*(\S+?)(?:\s+"([^"]*)")?\s*\)\s*(\{wide\})?\s*$/;
const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

/**
 * Markdown → blocks: { type: 'h2' | 'h3' | 'p' | 'quote', text },
 * { type: 'ul' | 'ol', items }, { type: 'image', src, alt, caption, wide },
 * { type: 'table', head, rows, align }, { type: 'hr' }. Text stays Markdown
 * for its inline marks, which the page renders.
 */
export function parseMarkdown(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  const blank = (line) => !line || !line.trim();
  while (i < lines.length) {
    const line = lines[i];
    if (blank(line)) { i++; continue; }
    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) { blocks.push({ type: `h${heading[1].length}`, text: heading[2].trim() }); i++; continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { blocks.push({ type: 'hr' }); i++; continue; }
    const image = line.trim().match(IMAGE);
    if (image) {
      blocks.push({ type: 'image', alt: image[1], src: image[2], caption: image[3] ?? '', wide: Boolean(image[4]) });
      i++;
      continue;
    }
    if (line.trimStart().startsWith('>')) {
      const text = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) text.push(lines[i++].trimStart().replace(/^>\s?/, ''));
      blocks.push({ type: 'quote', text: text.join(' ').trim() });
      continue;
    }
    if (isTableRow(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = cells(line);
      const align = cells(lines[i + 1]).map((c) => (c.endsWith(':') ? (c.startsWith(':') ? 'center' : 'end') : 'start'));
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      blocks.push({ type: 'table', head, rows, align });
      continue;
    }
    const bullet = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (bullet) {
      const type = /\d/.test(bullet[1]) ? 'ol' : 'ul';
      const items = [];
      while (i < lines.length && !blank(lines[i])) {
        const item = lines[i].match(/^\s*([-*]|\d+\.)\s+(.*)$/);
        if (item) items.push(item[2].trim());
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      blocks.push({ type, items });
      continue;
    }
    const text = [];
    while (i < lines.length && !blank(lines[i]) && !/^#{2,3}\s/.test(lines[i]) && !IMAGE.test(lines[i].trim()) && !lines[i].trimStart().startsWith('>')) text.push(lines[i++].trim());
    blocks.push({ type: 'p', text: text.join(' ') });
  }
  return blocks;
}

/** Inline Markdown → tokens: { text } | { bold } | { italic } | { code } | { link, href }. */
export function parseInline(text) {
  const out = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?!\w)|(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])/g;
  let at = 0;
  for (const m of String(text).matchAll(re)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    if (m[1] != null) out.push({ bold: m[1] });
    else if (m[2] != null) out.push({ code: m[2] });
    else if (m[3] != null) out.push({ link: m[3], href: m[4] });
    else out.push({ italic: m[5] ?? m[6] });
    at = m.index + m[0].length;
  }
  if (at < String(text).length) out.push({ text: text.slice(at) });
  return out;
}

/** A post's text without its marks, for CityChat's knowledge. */
export function postPlainText(post) {
  const plain = (s) => parseInline(s).map((t) => t.text ?? t.bold ?? t.italic ?? t.code ?? t.link).join('');
  const body = post.en.body
    .map((b) => {
      if (b.type === 'ul' || b.type === 'ol') return b.items.map((x) => `- ${plain(x)}`).join('\n');
      if (b.type === 'image') return b.caption ? plain(b.caption) : '';
      if (b.type === 'table') return [b.head, ...b.rows].map((r) => r.map(plain).join(' | ')).join('\n');
      if (b.type === 'hr') return '';
      return plain(b.text);
    })
    .filter(Boolean)
    .join('\n');
  return `### ${post.en.title} ${post.en.titleAccent}\n${post.en.lede}\n${body}`;
}
