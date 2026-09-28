// Reading the source archives the platforms hand over.
//
// Node has no zip reader, and the inputs arrive zipped (CityChrone's even
// nests one zip per hour inside the outer one), so this is the smallest reader
// that covers them: the central directory, stored and deflated entries, no
// encryption, no zip64. Anything else is refused by name rather than
// half-read, because a truncated member would otherwise surface much later as
// a city with missing cells.
//
// `openSource` puts a zip and an unpacked folder behind one interface, so an
// importer does not care which of the two it was handed.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

/**
 * The entries of a zip archive.
 *
 * @param {Buffer} buffer  the whole archive
 * @param {string} label   for error messages
 * @returns {{ name: string, dir: boolean, size: number, read: () => Buffer }[]}
 */
export function readZip(buffer, label = 'archive') {
  // The end-of-central-directory record sits in the last 22 bytes plus an
  // optional comment of up to 64 KiB.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 0xffff); i--) {
    if (buffer.readUInt32LE(i) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error(`${label} is not a zip archive`);

  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  if (offset === 0xffffffff || count === 0xffff) throw new Error(`${label} is a zip64 archive, which is not supported`);

  const entries = [];
  for (let n = 0; n < count; n++) {
    if (buffer.readUInt32LE(offset) !== CENTRAL) throw new Error(`${label}: damaged central directory`);
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const local = buffer.readUInt32LE(offset + 42);
    // Bit 11 marks a UTF-8 name; anything else is CP437, which for the
    // file names these archives carry is ASCII either way.
    const name = buffer
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString(flags & 0x800 ? 'utf8' : 'latin1');
    offset += 46 + nameLength + extraLength + commentLength;

    if (flags & 0x1) throw new Error(`${label}: ${name} is encrypted`);
    const dir = name.endsWith('/');
    entries.push({
      name,
      dir,
      size,
      read() {
        if (buffer.readUInt32LE(local) !== LOCAL) throw new Error(`${label}: damaged entry ${name}`);
        const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
        const data = buffer.subarray(start, start + compressed);
        let out;
        if (method === 0) out = Buffer.from(data);
        else if (method === 8) out = zlib.inflateRawSync(data);
        else throw new Error(`${label}: ${name} uses compression method ${method}, which is not supported`);
        if (out.length !== size) throw new Error(`${label}: ${name} decoded to ${out.length} bytes, expected ${size}`);
        return out;
      },
    });
  }
  return entries;
}

// Archive debris that is never data: macOS resource forks and Finder files.
const JUNK = /(^|\/)(__MACOSX\/|\._|\.DS_Store$)/;

/**
 * A source as a flat list of files, whether it is a zip or a folder.
 *
 * Paths are relative to the source, with `/` separators. Directories and
 * archive debris are dropped.
 *
 * @returns {{ path: string, read: () => Buffer }[]}
 */
export function openSource(source) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    const files = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const rel = path.relative(source, full).split(path.sep).join('/');
          if (!JUNK.test(rel)) files.push({ path: rel, read: () => fs.readFileSync(full) });
        }
      }
    };
    walk(source);
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }
  const buffer = fs.readFileSync(source);
  // A single file that is not an archive is its own one-file source.
  if (buffer.readUInt32LE(0) !== LOCAL && !/\.zip$/i.test(source)) {
    return [{ path: path.basename(source), read: () => buffer }];
  }
  return fromZip(buffer, path.basename(source));
}

/** A zip held in memory, as the same list `openSource` returns. */
export function fromZip(buffer, label) {
  return readZip(buffer, label)
    .filter((entry) => !entry.dir && !JUNK.test(entry.name))
    .map((entry) => ({ path: entry.name, read: entry.read }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** A file's own name, without the folders above it. */
export const baseName = (p) => p.split('/').pop();
