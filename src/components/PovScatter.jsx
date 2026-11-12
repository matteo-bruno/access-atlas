import { useEffect, useMemo, useRef, useState } from 'react';
import { quadtree } from 'd3-quadtree';
import './PovScatter.css';

// A dot's radius, in pixels, for a cell of the median inhabited cell's
// population: dots follow the cartogram's rule, area proportional to
// residents, so the plot weighs places by the people in them.
const R_MEDIAN = 3.2;
const R_MIN = 1.1;
const R_MAX = 8;
// How far from the pointer a dot is still the one it is on.
const HIT = 10;

// Room the plot keeps for its own labels, inside the insets it is given:
// the note takes two lines above the plot, the median's label one more.
const AXIS = { left: 58, bottom: 44, top: 50, right: 18 };

/**
 * An axis from zero in round steps (1, 2, 2.5 or 5 × 10ⁿ), about five of
 * them, ending on the first step past the largest value.
 */
function niceAxis(value) {
  if (!(value > 0)) return { top: 1, step: 0.25 };
  const raw = value / 5;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const f = raw / exp;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
  return { top: Math.ceil(value / step) * step, step };
}

/**
 * Close & Connected's third view: every inhabited cell placed by its two
 * scores, opportunity along the bottom and proximity up the side, as the
 * platform's own viewer draws it. The dashed lines are the city's medians,
 * where the zones split it, so each quarter of the plot is one zone; a dot's
 * colour is whatever the map would paint the cell, so the scatter keeps the
 * view the reader chose. Hovering names a cell, clicking selects it, and the
 * selection is the map's: the same cell is outlined when the map comes back.
 *
 * Drawn on two canvases, the dots once and the pointer's ring over them, so
 * a city of eight thousand cells follows the pointer without redrawing them.
 *
 * @param {Array<{id, x, y, pop, color, dim}>} props.points
 * @param {{x: number, y: number} | null} props.medians
 * @param {number} props.refPop  residents of the median inhabited cell
 * @param {{top, right, bottom, left}} props.inset  room for the map's boxes
 * @param {object} props.labels  axis titles, quarter names, the median, the note
 * @param {(v: number) => string} props.format  an axis tick
 * @param {(id) => string|null} props.tooltip
 */
export function PovScatter({
  points,
  medians,
  refPop,
  inset,
  labels,
  format,
  tooltip,
  selectedId,
  onSelect,
  onHover,
}) {
  const box = useRef(null);
  const base = useRef(null);
  const overlay = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The plot's frame and its two scales.
  const frame = useMemo(() => {
    const { width, height } = size;
    if (!width || !height || !points.length) return null;
    const left = inset.left + AXIS.left;
    const right = width - inset.right - AXIS.right;
    const top = inset.top + AXIS.top;
    const bottom = height - inset.bottom - AXIS.bottom;
    if (right - left < 120 || bottom - top < 120) return null;
    let maxX = 0;
    let maxY = 0;
    for (const p of points) {
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const xAxis = niceAxis(maxX * 1.02);
    const yAxis = niceAxis(maxY * 1.02);
    const x1 = xAxis.top;
    const y1 = yAxis.top;
    const sx = (v) => left + (v / x1) * (right - left);
    const sy = (v) => bottom - (v / y1) * (bottom - top);
    return { left, right, top, bottom, x1, y1, sx, sy, xStep: xAxis.step, yStep: yAxis.step };
  }, [size, points, inset]);

  // Screen positions and radii, largest first so the small dots stay on top.
  const placed = useMemo(() => {
    if (!frame) return [];
    const ref = refPop > 0 ? refPop : 1;
    return points
      .map((p) => ({
        ...p,
        px: frame.sx(p.x),
        py: frame.sy(p.y),
        r: Math.min(R_MAX, Math.max(R_MIN, R_MEDIAN * Math.sqrt(Math.max(p.pop, 0) / ref))),
      }))
      .sort((a, b) => b.r - a.r);
  }, [points, frame, refPop]);

  const tree = useMemo(
    () => quadtree().x((p) => p.px).y((p) => p.py).addAll(placed),
    [placed],
  );

  // The plot: grid, medians, quarter names, dots.
  useEffect(() => {
    const canvas = base.current;
    if (!canvas || !size.width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    if (!frame) return;
    const { left, right, top, bottom, x1, y1, sx, sy, xStep, yStep } = frame;
    const css = getComputedStyle(canvas);
    const ink3 = css.getPropertyValue('--ink-3').trim() || '#73767d';
    const ink4 = css.getPropertyValue('--ink-4').trim() || '#9d9fa4';
    const hair = css.getPropertyValue('--hair').trim() || '#e1dcce';
    const font = css.getPropertyValue('--font-sans').trim() || 'sans-serif';

    // Grid and ticks, in round steps.
    ctx.font = `10.5px ${font}`;
    ctx.lineWidth = 1;
    ctx.strokeStyle = hair;
    ctx.fillStyle = ink3;
    for (let vx = 0; vx <= x1 + xStep / 2; vx += xStep) {
      const gx = Math.round(sx(vx)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, top);
      ctx.lineTo(gx, bottom);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(format(vx), gx, bottom + 6);
    }
    for (let vy = 0; vy <= y1 + yStep / 2; vy += yStep) {
      const gy = Math.round(sy(vy)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(left, gy);
      ctx.lineTo(right, gy);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(format(vy), left - 7, gy);
    }

    // Axis titles.
    ctx.font = `500 11.5px ${font}`;
    ctx.fillStyle = ink3;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(labels.x, right, bottom + 24);
    ctx.save();
    ctx.translate(left - 46, top);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(labels.y, 0, 0);
    ctx.restore();

    // The quarters' names, faint, in their corners.
    ctx.font = `italic 12px ${font}`;
    ctx.fillStyle = ink4;
    const pad = 10;
    const corner = (text, x, y, align, baseline) => {
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      ctx.fillText(text, x, y);
    };
    corner(labels.quarters.both, right - pad, top + pad, 'right', 'top');
    corner(labels.quarters.proximity, left + pad, top + pad, 'left', 'top');
    corner(labels.quarters.opportunity, right - pad, bottom - pad, 'right', 'bottom');
    corner(labels.quarters.neither, left + pad, bottom - pad, 'left', 'bottom');

    // The dots, clipped to the plot.
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.clip();
    for (const p of placed) {
      ctx.globalAlpha = p.dim ? 0.1 : 0.82;
      ctx.fillStyle = p.color ?? ink4;
      ctx.beginPath();
      ctx.arc(p.px, p.py, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // The medians, over the dots so they are never lost under a crowd.
    if (medians) {
      ctx.strokeStyle = 'rgba(21, 23, 26, 0.55)';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1;
      const mx = Math.round(sx(medians.x)) + 0.5;
      const my = Math.round(sy(medians.y)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(mx, top);
      ctx.lineTo(mx, bottom);
      ctx.moveTo(left, my);
      ctx.lineTo(right, my);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `10.5px ${font}`;
      ctx.fillStyle = ink3;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(labels.median, mx + 4, top - 3);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(labels.median, right, my - 3);
    }

    // The axes themselves.
    ctx.strokeStyle = ink4;
    ctx.beginPath();
    ctx.moveTo(left + 0.5, top);
    ctx.lineTo(left + 0.5, bottom + 0.5);
    ctx.lineTo(right, bottom + 0.5);
    ctx.stroke();
  }, [size, frame, placed, medians, labels, format]);

  // The pointer's dot and the selected one, over the plot.
  useEffect(() => {
    const canvas = overlay.current;
    if (!canvas || !size.width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    const ring = (p, width) => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color ?? '#9d9fa4';
      ctx.beginPath();
      ctx.arc(p.px, p.py, Math.max(p.r, 4) + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = width;
      ctx.strokeStyle = 'rgba(21, 23, 26, 0.95)';
      ctx.stroke();
    };
    const selected = selectedId == null ? null : placed.find((p) => p.id === selectedId);
    if (selected) ring(selected, 2.4);
    if (hover && hover.id !== selectedId) ring(hover, 1.5);
  }, [size, placed, hover, selectedId]);

  const pick = (event) => {
    const rect = box.current.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const found = tree.find(mx, my, HIT);
    return found ? { ...found, mx, my } : null;
  };

  const onMove = (event) => {
    const found = pick(event);
    setHover(found);
    onHover?.(found ? found.id : null);
  };

  const tip = hover ? tooltip(hover.id) : null;

  return (
    <div
      ref={box}
      className="aa-scatter"
      onPointerMove={onMove}
      onPointerLeave={() => {
        setHover(null);
        onHover?.(null);
      }}
      onClick={(event) => {
        const found = pick(event);
        if (found) onSelect(found.id);
      }}
      style={{ cursor: hover ? 'pointer' : 'default' }}
    >
      <canvas ref={base} className="aa-scatter__canvas" aria-hidden="true" />
      <canvas ref={overlay} className="aa-scatter__canvas" aria-hidden="true" />
      {frame && (
        <p
          className="aa-scatter__note"
          style={{ insetInlineStart: frame.left, top: inset.top, maxWidth: frame.right - frame.left }}
        >
          {labels.note}
        </p>
      )}
      {tip && (
        <div
          className="aa-scatter__tip"
          style={{
            left: hover.mx + 14,
            top: hover.my + 14,
            transform: hover.mx > size.width - inset.right - 220 ? 'translateX(calc(-100% - 28px))' : undefined,
          }}
        >
          {tip}
        </div>
      )}
    </div>
  );
}
