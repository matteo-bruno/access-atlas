// Reading the source archives the platforms hand over.
//
// Node has no zip reader, and the inputs arrive zipped (CityChrone's even
// nests one zip per hour inside the outer one), so this is the smallest reader
// that covers them: the central directory, stored and deflated entries,
// zip64, no encryption. It reads the archive from disk member by member
// rather than whole, so an export past Node's 2 GiB file read is fine as long
// as each member fits in memory. Anything else is refused by name rather than
// half-read, because a truncated member would otherwise surface much later as
// a city with missing cells.
//
// `openSource` puts a zip and an unpacked folder behind one interface, so an
// importer does not care which of the two it was handed.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const EOCD = 0x06054b50;
const EOCD64 = 0x06064b50;
const EOCD64_LOCATOR = 0x07064b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

/**
 * Random access to an archive's bytes: `read(position, length)` and `size`.
 *
 * A zip is read from the end (the directory) and then member by member, so
 * nothing needs the whole archive in memory, and nothing can: Node reads at
 * most 2 GiB into one buffer, and CityChrone's exports for a large city are
 * past that (Rome's is 3.2 GB).
 */
const bufferBytes = (buffer) => ({
  size: buffer.length,
  read: (position, length) => buffer.subarray(position, position + length),
});

function fileBytes(file) {
  const size = fs.statSync(file).size;
  return {
    size,
    read(position, length) {
      const out = Buffer.allocUnsafe(length);
      const fd = fs.openSync(file, 'r');
      try {
        let done = 0;
        while (done < length) {
          // One read call moves at most 2 GiB, so a large member is read in parts.
          const n = fs.readSync(fd, out, done, Math.min(length - done, 1 << 30), position + done);
          if (n === 0) break;
          done += n;
        }
        if (done !== length) throw new Error(`${file}: unexpected end of file`);
      } finally {
        fs.closeSync(fd);
      }
      return out;
    },
  };
}

const uint64 = (buffer, offset) => {
  const value = buffer.readBigUInt64LE(offset);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('zip64 field out of range');
  return Number(value);
};

/**
 * The entries of a zip archive.
 *
 * @param {Buffer | { size: number, read: (position: number, length: number) => Buffer }} source
 *   the whole archive, or random access to it
 * @param {string} label   for error messages
 * @returns {{ name: string, dir: boolean, size: number, read: () => Buffer }[]}
 */
export function readZip(source, label = 'archive') {
  const bytes = Buffer.isBuffer(source) ? bufferBytes(source) : source;

  // The end-of-central-directory record sits in the last 22 bytes plus an
  // optional comment of up to 64 KiB.
  const tailStart = Math.max(0, bytes.size - 22 - 0xffff);
  const tail = bytes.read(tailStart, bytes.size - tailStart);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail.readUInt32LE(i) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error(`${label} is not a zip archive`);

  let count = tail.readUInt16LE(eocd + 10);
  let directorySize = tail.readUInt32LE(eocd + 12);
  let offset = tail.readUInt32LE(eocd + 16);
  if (count === 0xffff || directorySize === 0xffffffff || offset === 0xffffffff) {
    // zip64: a locator just before the record points at the 64-bit one.
    const locatorAt = tailStart + eocd - 20;
    const locator = locatorAt >= 0 ? bytes.read(locatorAt, 20) : null;
    if (!locator || locator.readUInt32LE(0) !== EOCD64_LOCATOR) {
      throw new Error(`${label}: damaged zip64 end of central directory`);
    }
    const record = bytes.read(uint64(locator, 8), 56);
    if (record.readUInt32LE(0) !== EOCD64) throw new Error(`${label}: damaged zip64 end of central directory`);
    count = uint64(record, 32);
    directorySize = uint64(record, 40);
    offset = uint64(record, 48);
  }

  const directory = bytes.read(offset, directorySize);
  let at = 0;
  const entries = [];
  for (let n = 0; n < count; n++) {
    if (directory.readUInt32LE(at) !== CENTRAL) throw new Error(`${label}: damaged central directory`);
    const flags = directory.readUInt16LE(at + 8);
    const method = directory.readUInt16LE(at + 10);
    let compressed = directory.readUInt32LE(at + 20);
    let size = directory.readUInt32LE(at + 24);
    const nameLength = directory.readUInt16LE(at + 28);
    const extraLength = directory.readUInt16LE(at + 30);
    const commentLength = directory.readUInt16LE(at + 32);
    let local = directory.readUInt32LE(at + 42);
    // Bit 11 marks a UTF-8 name; anything else is CP437, which for the
    // file names these archives carry is ASCII either way.
    const name = directory
      .subarray(at + 46, at + 46 + nameLength)
      .toString(flags & 0x800 ? 'utf8' : 'latin1');

    // A zip64 extra field carries, in this order, whichever of the three
    // 32-bit fields above were saturated.
    let extra = at + 46 + nameLength;
    const extraEnd = extra + extraLength;
    while (extra + 4 <= extraEnd) {
      const id = directory.readUInt16LE(extra);
      const length = directory.readUInt16LE(extra + 2);
      if (id === 0x0001) {
        let field = extra + 4;
        if (size === 0xffffffff) (size = uint64(directory, field)), (field += 8);
        if (compressed === 0xffffffff) (compressed = uint64(directory, field)), (field += 8);
        if (local === 0xffffffff) local = uint64(directory, field);
      }
      extra += 4 + length;
    }
    at = extraEnd + commentLength;

    if (flags & 0x1) throw new Error(`${label}: ${name} is encrypted`);
    const dir = name.endsWith('/');
    entries.push({
      name,
      dir,
      size,
      read() {
        const header = bytes.read(local, 30);
        if (header.readUInt32LE(0) !== LOCAL) throw new Error(`${label}: damaged entry ${name}`);
        const start = local + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
        const data = bytes.read(start, compressed);
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
  const bytes = fileBytes(source);
  // A single file that is not an archive is its own one-file source.
  const head = bytes.read(0, Math.min(4, bytes.size));
  if ((head.length < 4 || head.readUInt32LE(0) !== LOCAL) && !/\.zip$/i.test(source)) {
    return [{ path: path.basename(source), read: () => fs.readFileSync(source) }];
  }
  return fromZip(bytes, path.basename(source));
}

/** A zip, in memory or on disk, as the same list `openSource` returns. */
export function fromZip(source, label) {
  return readZip(source, label)
    .filter((entry) => !entry.dir && !JUNK.test(entry.name))
    .map((entry) => ({ path: entry.name, read: entry.read }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** A file's own name, without the folders above it. */
export const baseName = (p) => p.split('/').pop();
