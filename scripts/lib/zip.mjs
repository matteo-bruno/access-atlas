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
//
// Every file can also be streamed (`stream()`), for the one input that does
// not fit in memory however it is read: a metro area's travel-time matrix,
// cells² bytes an hour, 14 GB at 120,000 cells. A zip nested in a zip is
// streamed too (`unzipOneStream`), from its first local header, so it needs
// neither random access nor a copy on disk.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { Readable, pipeline } from 'node:stream';

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
  stream: (position, length) => Readable.from([buffer.subarray(position, position + length)]),
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
    stream: (position, length) =>
      length > 0
        ? fs.createReadStream(file, { start: position, end: position + length - 1, highWaterMark: 1 << 20 })
        : Readable.from([]),
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
 * @returns {{ name: string, dir: boolean, size: number, read: () => Buffer, stream: () => Readable }[]}
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
    const dataStart = () => {
      const header = bytes.read(local, 30);
      if (header.readUInt32LE(0) !== LOCAL) throw new Error(`${label}: damaged entry ${name}`);
      return local + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
    };
    entries.push({
      name,
      dir,
      size,
      // The member's bytes as a stream, decoded, never held whole.
      stream() {
        if (method !== 0 && method !== 8) {
          throw new Error(`${label}: ${name} uses compression method ${method}, which is not supported`);
        }
        const raw = bytes.stream(dataStart(), compressed);
        return method === 0 ? raw : chain(raw, zlib.createInflateRaw({ chunkSize: 1 << 20 }));
      },
      read() {
        const start = dataStart();
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
          if (!JUNK.test(rel)) {
            files.push({ path: rel, read: () => fs.readFileSync(full), stream: () => fs.createReadStream(full, { highWaterMark: 1 << 20 }) });
          }
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
    return [
      {
        path: path.basename(source),
        read: () => fs.readFileSync(source),
        stream: () => fs.createReadStream(source, { highWaterMark: 1 << 20 }),
      },
    ];
  }
  return fromZip(bytes, path.basename(source));
}

/** A zip, in memory or on disk, as the same list `openSource` returns. */
export function fromZip(source, label) {
  return readZip(source, label)
    .filter((entry) => !entry.dir && !JUNK.test(entry.name))
    .map((entry) => ({ path: entry.name, read: entry.read, stream: entry.stream }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** A file's own name, without the folders above it. */
export const baseName = (p) => p.split('/').pop();

/**
 * `from` piped into `to`, returning `to`, with an error on either side
 * ending both: `.pipe()` alone leaves the reader of `to` waiting forever
 * when `from` fails.
 */
export function chain(from, to) {
  return pipeline(from, to, () => {});
}

/**
 * Exactly `n` bytes, or fewer at the end, from an async iterator of chunks;
 * and whatever is left as a stream. The one primitive a streamed zip or .npy
 * header needs.
 */
export class ByteReader {
  constructor(stream) {
    this.stream = stream;
    this.iterator = stream[Symbol.asyncIterator]();
    this.chunks = [];
    this.buffered = 0;
    this.done = false;
  }

  async read(n) {
    while (this.buffered < n && !this.done) {
      const { value, done } = await this.iterator.next();
      if (done) this.done = true;
      else if (value.length) {
        this.chunks.push(value);
        this.buffered += value.length;
      }
    }
    const all = this.chunks.length === 1 ? this.chunks[0] : Buffer.concat(this.chunks);
    const out = all.subarray(0, Math.min(n, all.length));
    const left = all.subarray(out.length);
    this.chunks = left.length ? [left] : [];
    this.buffered = left.length;
    return out;
  }

  /** Everything not yet read, as a stream. */
  rest() {
    const self = this;
    return Readable.from(
      (async function* () {
        if (self.chunks.length) yield* self.chunks;
        self.chunks = [];
        self.buffered = 0;
        if (self.done) return;
        for (;;) {
          const { value, done } = await self.iterator.next();
          if (done) return;
          yield value;
        }
      })(),
    );
  }

  close() {
    this.iterator.return?.();
    this.stream.destroy?.();
  }
}

/**
 * The first member of a zip, decoded, from a stream of the zip's bytes.
 *
 * For the hourly zips CityChrone nests in its export, which hold one file
 * each. Reading from the local header rather than the central directory
 * means a nested zip is never held in memory or copied to disk, whether or
 * not the outer archive compressed it. A deflated member ends itself; a
 * stored one runs to its stated size, which a stream-written zip (sizes in a
 * trailing descriptor) does not state, so that one case is refused.
 *
 * @returns {Promise<{ name: string, stream: Readable }>}
 */
export async function unzipOneStream(stream, label) {
  const reader = new ByteReader(stream);
  const header = await reader.read(30);
  if (header.length < 30 || header.readUInt32LE(0) !== LOCAL) {
    reader.close();
    throw new Error(`${label} is not a zip archive`);
  }
  const flags = header.readUInt16LE(6);
  const method = header.readUInt16LE(8);
  let size = header.readUInt32LE(22);
  const nameLength = header.readUInt16LE(26);
  const extraLength = header.readUInt16LE(28);
  const tail = await reader.read(nameLength + extraLength);
  const name = tail.subarray(0, nameLength).toString(flags & 0x800 ? 'utf8' : 'latin1');
  if (flags & 0x1) {
    reader.close();
    throw new Error(`${label}: ${name} is encrypted`);
  }
  // zip64: the real size is in the extra field.
  for (let at = nameLength; at + 4 <= tail.length; ) {
    const id = tail.readUInt16LE(at);
    const length = tail.readUInt16LE(at + 2);
    if (id === 0x0001 && size === 0xffffffff) size = uint64(tail, at + 4);
    at += 4 + length;
  }
  const rest = reader.rest();
  if (method === 8) return { name, stream: chain(rest, zlib.createInflateRaw({ chunkSize: 1 << 20 })) };
  if (method === 0 && !(flags & 0x8)) {
    let left = size;
    const limited = Readable.from(
      (async function* () {
        for await (const chunk of rest) {
          if (left <= 0) break;
          const part = chunk.length > left ? chunk.subarray(0, left) : chunk;
          left -= part.length;
          yield part;
        }
        rest.destroy();
      })(),
    );
    return { name, stream: limited };
  }
  reader.close();
  throw new Error(`${label}: ${name} uses compression method ${method}${flags & 0x8 ? ' with no stated size' : ''}, which is not supported`);
}
