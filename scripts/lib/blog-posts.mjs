// The blog's posts read from disk, for Node: CityChat's knowledge and
// test:data. The site reads the same files through Vite (src/data/blog.js);
// both parse them with src/data/blogMarkdown.js.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePost } from '../../src/data/blogMarkdown.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const POSTS_DIR = path.join(ROOT, 'content', 'blog');
export const IMAGES_DIR = path.join(ROOT, 'public', 'blog-images');

/** Every post, drafts included (`draft` says which), newest first. */
export function readPosts() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parsePost(f.replace(/\.md$/, ''), fs.readFileSync(path.join(POSTS_DIR, f), 'utf8')))
    .sort((a, b) => b.date.localeCompare(a.date));
}
