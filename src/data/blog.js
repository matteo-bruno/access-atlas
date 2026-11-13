// Blog posts: one Markdown file each, content/blog/<slug>.md, in English.
// The slug is the file name and the address (/blog/<slug>). How a file is
// written (its header, the Markdown it may use, where its images go) is at
// the top of src/data/blogMarkdown.js, which parses it; in other languages
// the page marks the post as English (`postCopy` in Blog.jsx).
//
// The four posts with a `layer` are what the home page's cards open: each
// introduces one layer of the Atlas and hands the reader on to the city view
// and to the paper behind it.
//
// Numbers in a post are written by its author. The site's rule still holds
// for them: a figure quoted in a post is one the published data gives (the
// city view, the Stats page), checked when it is written, and dated by the
// post.

import { parsePost } from './blogMarkdown.js';

// Whether the site points readers at the blog: the nav tab, the footer link
// and the home page's layer cards. Turning it off hides all three; the
// routes and the posts stay, so a direct link still opens.
export const BLOG_LISTED = true;

// Read by Vite at build time, which replaces the glob call with the files
// themselves; the test is on import.meta.env, which Vite defines and Node
// does not (`typeof import.meta.glob` would be false in the browser too,
// where the call no longer exists). Under Node (CityChat, test:data)
// scripts/lib/blog-posts.mjs reads the same files.
const FILES = import.meta.env
  ? import.meta.glob('../../content/blog/*.md', { query: '?raw', import: 'default', eager: true })
  : {};

export const POSTS = Object.entries(FILES)
  .map(([file, raw]) => parsePost(file.split('/').pop().replace(/\.md$/, ''), raw))
  .filter((post) => !post.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

// The post that introduces one layer, by platform id: what the home page's
// cards link to.
export const POST_BY_LAYER = Object.fromEntries(
  POSTS.filter((post) => post.layer).map((post) => [post.layer, post]),
);

export function postForLayer(layerId) {
  return POST_BY_LAYER[layerId] ?? null;
}

export const POSTS_BY_SLUG = Object.fromEntries(POSTS.map((post) => [post.slug, post]));

export function postBySlug(slug) {
  return POSTS_BY_SLUG[slug] ?? null;
}
