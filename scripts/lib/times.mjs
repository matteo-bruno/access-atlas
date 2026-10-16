// CityChrone's travel-time matrices, from the export's .npy to the Atlas's
// own per-origin format (src/data/times.js, where the layout is described).
//
// A matrix is cells² bytes an hour: 130 MB for Rome, 14 GB for a metro area
// of 120,000 cells. Nothing here holds one whole unless it is small: the
// .npy is streamed row by row, each origin's row cut down to the kept cells
// as it passes, and the cut-down matrix is held in memory up to IN_MEMORY
// bytes and in a scratch file past it. Only then is it compressed, block by
// block, into a `.partial` file beside the target, renamed into place once
// every hour has been written (`commitTimes`).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { ByteReader } from './zip.mjs';
import {
  TIMES_FORMAT,
  TIMES_MAGIC,
  TIMES_MAX,
  TIMES_OVER,
  TIMES_VERSION,
  parseTimesPrelude,
} from '../../src/data/times.js';

/** Kept rows per block: a click fetches one block. */
export const TIMES_BLOCK = 32;
// Same as every other import (lib/datafile.mjs): level 9 costs ~6 times the
// time for ~1% on these matrices.
const LEVEL = 6;
const IN_MEMORY = 1 << 30;

/**
 * Open a .npy stream and read its header: uint8, C order, two dimensions.
 *
 * @returns {Promise<{ shape: [number, number], reader: ByteReader }>}
 */
export async function openNpy(stream, label) {
  const reader = new ByteReader(stream);
  try {
    const head = await reader.read(10);
    if (head.length < 10 || head[0] !== 0x93 || head.toString('latin1', 1, 6) !== 'NUMPY') {
      throw new Error(`${label} is not a .npy file`);
    }
    const major = head[6];
    let headerLength;
    if (major >= 2) {
      const more = await reader.read(2);
      headerLength = Buffer.concat([head.subarray(8), more]).readUInt32LE(0);
    } else {
      headerLength = head.readUInt16LE(8);
    }
    const header = (await reader.read(headerLength)).toString('latin1');
    if (!/'descr':\s*'\|u1'/.test(header)) throw new Error(`${label}: not uint8 (${header.trim()})`);
    if (/'fortran_order':\s*True/.test(header)) throw new Error(`${label}: Fortran order is not supported`);
    const shape = header.match(/'shape':\s*\((\d+),\s*(\d+)\)/);
    if (!shape) throw new Error(`${label}: no two-dimensional shape in ${header.trim()}`);
    return { shape: [Number(shape[1]), Number(shape[2])], reader };
  } catch (error) {
    reader.close();
    throw error;
  }
}

/** Check a matrix's header says n × n, reading nothing past it. */
export async function checkNpy(open, n, label) {
  const { shape, reader } = await openNpy(await open(), label);
  reader.close();
  if (shape[0] !== n || shape[1] !== n) throw new Error(`${label}: shape ${shape[0]}×${shape[1]}, expected ${n}×${n}`);
}

/** Where kept rows are held while the matrix streams in. */
function rowStore(rows, width, inMemory) {
  const size = rows * width;
  if (size <= inMemory) {
    const buffer = Buffer.alloc(size);
    return {
      put: (r, row) => row.copy(buffer, r * width),
      get: (from, count) => buffer.subarray(from * width, (from + count) * width),
      close() {},
    };
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-times-'));
  const file = path.join(dir, 'matrix');
  const fd = fs.openSync(file, 'w+');
  return {
    put: (r, row) => fs.writeSync(fd, row, 0, width, r * width),
    get(from, count) {
      const out = Buffer.allocUnsafe(count * width);
      let done = 0;
      while (done < out.length) {
        const n = fs.readSync(fd, out, done, Math.min(out.length - done, 1 << 30), from * width + done);
        if (!n) throw new Error('scratch matrix is short');
        done += n;
      }
      return out;
    },
    close() {
      fs.closeSync(fd);
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** A block's bytes in the given layout: rows as they are, or interleaved. */
function laidOut(rows, count, width, layout) {
  if (layout === 'rows') return rows;
  const out = Buffer.allocUnsafe(rows.length);
  for (let r = 0; r < count; r++) {
    const from = r * width;
    for (let c = 0; c < width; c++) out[c * count + r] = rows[from + c];
  }
  return out;
}

const deflate = (bytes) => zlib.deflateRawSync(bytes, { level: LEVEL });

/**
 * The smaller layout, measured on a sample of blocks. Which one wins is a
 * property of the city: `rows` while a row fits in deflate's 32 kB window,
 * `columns` once it does not (src/data/times.js).
 */
function chooseLayout(store, rows, width, block, blocks) {
  if (!blocks) return 'rows';
  const step = Math.max(1, Math.floor(blocks / 24));
  let asRows = 0;
  let asColumns = 0;
  for (let b = 0; b < blocks; b += step) {
    const count = Math.min(block, rows - b * block);
    const bytes = store.get(b * block, count);
    asRows += deflate(bytes).length;
    asColumns += deflate(laidOut(bytes, count, width, 'columns')).length;
  }
  return asColumns < asRows ? 'columns' : 'rows';
}

/** Two files hold the same bytes. */
function sameFile(a, b) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return false;
  if (fs.statSync(a).size !== fs.statSync(b).size) return false;
  const fa = fs.openSync(a, 'r');
  const fb = fs.openSync(b, 'r');
  try {
    const ba = Buffer.allocUnsafe(1 << 20);
    const bb = Buffer.allocUnsafe(1 << 20);
    for (let at = 0; ; at += ba.length) {
      const na = fs.readSync(fa, ba, 0, ba.length, at);
      const nb = fs.readSync(fb, bb, 0, bb.length, at);
      if (na !== nb || ba.compare(bb, 0, nb, 0, na) !== 0) return false;
      if (na < ba.length) return true;
    }
  } finally {
    fs.closeSync(fa);
    fs.closeSync(fb);
  }
}

/**
 * Write one hour's matrix in the Atlas's format, to `<target>.partial`.
 *
 * @param {object} input
 * @param {() => Promise<import('node:stream').Readable>} input.open  the .npy, decoded
 * @param {string} input.label        for messages
 * @param {number[]} input.order      layer row → export row (the layer's H3 order)
 * @param {number[]} input.population per export row; a cell where nobody lives is left out,
 *                                    unless nobody lives anywhere, and then none is
 * @param {string} input.target       absolute path of the published file
 * @param {string} [input.layout]     force a layout rather than measure (tests)
 * @param {number} [input.inMemory]   bytes held in memory before a scratch file (tests)
 * @returns {Promise<{ partial: string|null, changed: boolean, raw: number, stored: number, rows: number, layout: string }>}
 */
export async function writeTimesFile({ open, label, order, population, target, layout: forced, inMemory = IN_MEMORY }) {
  const n = order.length;
  // A layer that states no resident anywhere (an export whose `pop` is
  // missing, or under 0.5 everywhere and rounded away) leaves nothing to cut
  // on, and cutting on it would keep no origin at all: every cell is kept.
  const keepAll = !population.some((p) => Number(p) > 0);
  const keepMask = new Uint8Array(Math.ceil(n / 8));
  const keptExport = [];
  for (let r = 0; r < n; r++) {
    if (keepAll || Number(population[order[r]]) > 0) {
      keepMask[r >> 3] |= 1 << (r & 7);
      keptExport.push(order[r]);
    }
  }
  const k = keptExport.length;
  const exportRank = new Int32Array(n).fill(-1);
  keptExport.forEach((e, r) => (exportRank[e] = r));

  const { shape, reader } = await openNpy(await open(), label);
  if (shape[0] !== n || shape[1] !== n) {
    reader.close();
    throw new Error(`${label}: shape ${shape[0]}×${shape[1]}, expected ${n}×${n}`);
  }

  const store = rowStore(k, k, inMemory);
  try {
    // One pass over the export, origin by origin in its own order.
    const out = Buffer.allocUnsafe(k);
    for (let e = 0; e < n; e++) {
      const row = await reader.read(n);
      if (row.length < n) throw new Error(`${label} is truncated at row ${e} of ${n}`);
      const r = exportRank[e];
      if (r < 0) continue;
      for (let c = 0; c < k; c++) {
        const v = row[keptExport[c]];
        out[c] = v > TIMES_MAX ? TIMES_OVER : v;
      }
      store.put(r, out);
    }
    reader.close();

    const blocks = Math.ceil(k / TIMES_BLOCK);
    const layout = forced ?? chooseLayout(store, k, k, TIMES_BLOCK, blocks);
    const header = Buffer.from(
      JSON.stringify({
        format: TIMES_FORMAT,
        version: TIMES_VERSION,
        cells: n,
        rows: k,
        block: TIMES_BLOCK,
        blocks,
        layout,
        codec: 'deflate-raw',
        max: TIMES_MAX,
        over: TIMES_OVER,
      }),
    );
    const fixed = Buffer.alloc(12);
    fixed.write(TIMES_MAGIC, 0, 'latin1');
    fixed[7] = TIMES_VERSION;
    fixed.writeUInt32LE(header.length, 8);
    const sizes = Buffer.alloc(4 * blocks);
    const dataAt = fixed.length + header.length + keepMask.length + sizes.length;

    const partial = `${target}.partial`;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const fd = fs.openSync(partial, 'w');
    let at = dataAt;
    try {
      for (let b = 0; b < blocks; b++) {
        const count = Math.min(TIMES_BLOCK, k - b * TIMES_BLOCK);
        const packed = deflate(laidOut(store.get(b * TIMES_BLOCK, count), count, k, layout));
        sizes.writeUInt32LE(packed.length, 4 * b);
        fs.writeSync(fd, packed, 0, packed.length, at);
        at += packed.length;
      }
      const prelude = Buffer.concat([fixed, header, Buffer.from(keepMask), sizes]);
      fs.writeSync(fd, prelude, 0, prelude.length, 0);
    } finally {
      fs.closeSync(fd);
    }

    // What was written must read back as written.
    const head = Buffer.alloc(Math.min(at, dataAt));
    const check = fs.openSync(partial, 'r');
    fs.readSync(check, head, 0, head.length, 0);
    fs.closeSync(check);
    const parsed = parseTimesPrelude(head);
    if (parsed.need || parsed.size !== at || parsed.rows !== k) {
      fs.rmSync(partial, { force: true });
      throw new Error(`${label}: written file does not read back`);
    }

    const raw = 12 + header.length + keepMask.length + k * k;
    if (sameFile(partial, target)) {
      fs.rmSync(partial);
      return { partial: null, changed: false, raw, stored: at, rows: k, layout };
    }
    return { partial, changed: true, raw, stored: at, rows: k, layout };
  } finally {
    store.close();
    reader.close();
  }
}
