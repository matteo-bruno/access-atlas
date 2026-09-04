// Reading a published data file, compressed or not.
//
// A platform's files may be stored either way: 15minCity keeps only
// `<name>.geojson.gz` so the served tree stays small on a self-hosted server,
// while the others are still plain `.geojson`. Everything that reads
// `public/data/` goes through here so the two cases never have to be handled
// at a call site — and so switching a platform over is a change to the
// exporter and the catalogue, not to every consumer.
//
// The catalogue names whichever file actually exists, so a path ending in
// `.gz` is the normal case rather than a fallback. `readDataFile` still
// accepts either spelling and finds the other, which keeps a half-migrated
// tree working while a platform is being converted.

import fs from 'node:fs';
import zlib from 'node:zlib';

/**
 * Resolve a data path to the file that is actually on disk.
 *
 * @param {string} file  absolute path, with or without a `.gz` suffix
 * @returns {{ path: string, gzipped: boolean } | null}
 */
export function resolveDataFile(file) {
  if (fs.existsSync(file)) return { path: file, gzipped: file.endsWith('.gz') };
  if (file.endsWith('.gz')) {
    const plain = file.slice(0, -3);
    if (fs.existsSync(plain)) return { path: plain, gzipped: false };
    return null;
  }
  const gz = `${file}.gz`;
  if (fs.existsSync(gz)) return { path: gz, gzipped: true };
  return null;
}

/** Raw bytes of a data file, decompressed if it is stored gzipped. */
export function readDataBuffer(file) {
  const found = resolveDataFile(file);
  if (!found) throw new Error(`data file not found: ${file}`);
  const raw = fs.readFileSync(found.path);
  return found.gzipped ? zlib.gunzipSync(raw) : raw;
}

/** Parsed JSON of a data file, decompressed if it is stored gzipped. */
export function readDataJSON(file) {
  return JSON.parse(readDataBuffer(file).toString('utf8'));
}

/**
 * Write a data file, gzipped when the target path says so.
 *
 * Returns both sizes, because the thing worth reporting after an import is
 * what the tree grew by *and* what a client will transfer.
 *
 * @returns {{ raw: number, stored: number }}
 */
export function writeDataFile(file, body) {
  const buf = Buffer.from(body);
  if (!file.endsWith('.gz')) {
    fs.writeFileSync(file, buf);
    return { raw: buf.length, stored: buf.length };
  }
  const gz = zlib.gzipSync(buf, { level: zlib.constants.Z_BEST_COMPRESSION });
  fs.writeFileSync(file, gz);
  // A stale plain copy beside the compressed one would be served by a static
  // host in preference to nothing and silently go out of date.
  const plain = file.slice(0, -3);
  if (fs.existsSync(plain)) fs.rmSync(plain);
  return { raw: buf.length, stored: gz.length };
}
