// CityChrone's travel times, as the Atlas publishes them: one file per hour,
// read one origin at a time.
//
// The isochrone view only ever draws one row of an hour's matrix, the
// origin's. A `.npy` has to be fetched whole to get at it, which is ~10 MB
// gzipped for Rome and gigabytes for a metro area of 100,000 cells, so a
// large city's matrix is stored as blocks of consecutive rows, each
// compressed on its own, behind a small index. The browser reads the index,
// then asks for one block with an HTTP Range request. A host that ignores
// Range answers with the whole file, which still works, only slower.
//
//   bytes 0–7     "AATIMES" and the format version (1)
//   bytes 8–11    uint32 LE, the length of the JSON header
//   header        { format, version, cells, rows, block, blocks, layout,
//                   codec, max, over }
//   keep          ceil(cells / 8) bytes, bit i (LSB first) set when layer
//                 row i is an origin and a destination
//   sizes         uint32 LE × blocks, each block's compressed length
//   blocks        deflate-raw, one per `block` consecutive kept rows
//
// What is left out is what nobody sees. Rows and columns are the layer's
// rows where someone lives (the viewer never draws an empty cell, so it is
// neither clicked nor coloured), and every time over `max` minutes is stored
// as `over`: one class on the map, "over 120", and a long run of one byte
// value that compresses to nothing. Rome's 24 hours went from 252 MB as
// whole gzipped matrices to 104 MB, and a click reads at most 56 kB.
//
// `layout` is how a block's bytes are ordered. `rows`: row after row, so a
// row's neighbour is the row before it, which deflate finds while a row fits
// in its 32 kB window. `columns`: the block's rows interleaved, one
// destination at a time, so neighbouring origins sit side by side even when
// a row is far wider than the window (a metro area's is ~100 kB). The
// importer measures both and keeps the smaller.
//
// Kept rows are in the layer's own order (H3), so a layer row number indexes
// this file exactly as it indexes the scores.

export const TIMES_MAGIC = 'AATIMES';
export const TIMES_VERSION = 1;
export const TIMES_FORMAT = 'atlas-times';
/** Minutes past which a time is one class, "over". */
export const TIMES_MAX = 120;
/** A time over TIMES_MAX. */
export const TIMES_OVER = 255;
/** A cell the file holds no time for (nobody lives there). Never stored. */
export const TIMES_NONE = 254;

/** Bytes worth reading first: the prelude of any city short of ~200,000 cells. */
export const TIMES_HEAD_BYTES = 64 * 1024;

const PRELUDE_FIXED = 12;

/**
 * Parse a file's prelude from its first bytes.
 *
 * @param {Uint8Array} bytes  the start of the file (or all of it)
 * @returns {{ need: number } | object}  `{ need }` when more bytes are needed
 *   to read it, else the parsed index (see the fields below)
 */
export function parseTimesPrelude(bytes) {
  if (bytes.length < PRELUDE_FIXED) return { need: PRELUDE_FIXED };
  const magic = String.fromCharCode(...bytes.subarray(0, 7));
  if (magic !== TIMES_MAGIC) throw new Error('not an atlas-times file');
  if (bytes[7] !== TIMES_VERSION) throw new Error(`atlas-times version ${bytes[7]} is not supported`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLength = view.getUint32(8, true);
  if (bytes.length < PRELUDE_FIXED + headerLength) return { need: PRELUDE_FIXED + headerLength };
  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(PRELUDE_FIXED, PRELUDE_FIXED + headerLength)));
  if (header.format !== TIMES_FORMAT) throw new Error(`format is ${header.format}, not ${TIMES_FORMAT}`);
  if (header.codec !== 'deflate-raw') throw new Error(`codec ${header.codec} is not supported`);
  if (header.layout !== 'rows' && header.layout !== 'columns') throw new Error(`layout ${header.layout} is not supported`);

  const keepAt = PRELUDE_FIXED + headerLength;
  const keepLength = Math.ceil(header.cells / 8);
  const sizesAt = keepAt + keepLength;
  const dataAt = sizesAt + 4 * header.blocks;
  if (bytes.length < dataAt) return { need: dataAt };

  const keep = bytes.subarray(keepAt, sizesAt);
  // Layer row → kept row, and back.
  const rank = new Int32Array(header.cells).fill(-1);
  const kept = new Int32Array(header.rows);
  let r = 0;
  for (let i = 0; i < header.cells; i++) {
    if (keep[i >> 3] & (1 << (i & 7))) {
      if (r >= header.rows) throw new Error('more kept cells than rows');
      rank[i] = r;
      kept[r++] = i;
    }
  }
  if (r !== header.rows) throw new Error(`${r} kept cells for ${header.rows} rows`);
  if (header.blocks !== Math.ceil(header.rows / header.block)) throw new Error('block count does not match the rows');

  // Absolute byte offsets of each block, and of the end.
  const offsets = new Array(header.blocks + 1);
  offsets[0] = dataAt;
  for (let b = 0; b < header.blocks; b++) offsets[b + 1] = offsets[b] + view.getUint32(sizesAt + 4 * b, true);

  return { ...header, rank, kept, offsets, dataAt, size: offsets[header.blocks] };
}

/** The block holding a layer row, or null when the file has no row for it. */
export function blockOf(prelude, layerRow) {
  const r = prelude.rank[layerRow];
  if (r == null || r < 0) return null;
  const block = Math.floor(r / prelude.block);
  return { block, start: prelude.offsets[block], end: prelude.offsets[block + 1], local: r - block * prelude.block };
}

/** Rows in a block: `block`, except in the last one. */
export const rowsInBlock = (prelude, block) => Math.min(prelude.block, prelude.rows - block * prelude.block);

/**
 * One origin's times to every layer row, from its decompressed block.
 *
 * @returns {Uint8Array}  one value per layer row: minutes up to `max`,
 *   TIMES_OVER past it, TIMES_NONE where the file holds nothing
 */
export function rowFromBlock(prelude, block, local, decoded) {
  const k = prelude.rows;
  const m = rowsInBlock(prelude, block);
  if (decoded.length !== m * k) throw new Error(`block ${block} decodes to ${decoded.length} bytes, not ${m * k}`);
  const out = new Uint8Array(prelude.cells).fill(TIMES_NONE);
  const { kept } = prelude;
  if (prelude.layout === 'rows') {
    const row = decoded.subarray(local * k, (local + 1) * k);
    for (let c = 0; c < k; c++) out[kept[c]] = row[c];
  } else {
    for (let c = 0; c < k; c++) out[kept[c]] = decoded[c * m + local];
  }
  return out;
}
