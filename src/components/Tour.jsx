import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/index.jsx';
import './Tour.css';

/**
 * A guided tour over a screen: the page goes dark, the parts a step is about
 * stay lit (one or several at once, each with a short tag), and a card says
 * what they are, with Back, Next and Skip.
 *
 * Shown once per reader: whether it has been seen is kept in localStorage
 * under `tour:<id>`, and in memory for a browser that keeps nothing, so a
 * private window does not replay it on every screen. A tour can be several
 * put together (the city view's own, then the open layer's): the caller
 * passes the steps still to show and every id they stand for (`marks`), and
 * all of them are marked seen when the tour closes.
 *
 * A step:
 *   { title, body,                     // what the card says (strings or nodes)
 *     targets: [{ selector, tag?, tagAt?: 'inside'|'below'|'above', all? }],
 *     anchor?: selector,               // the card goes under this
 *     within?: selector,               // or centred in this; else in the window
 *   }
 * `all` lights the box around every element the selector matches (a row of
 * buttons). A target that is not on screen is simply not lit.
 */

const seenInSession = new Set();

export function tourSeen(id) {
  if (seenInSession.has(id)) return true;
  try {
    return window.localStorage.getItem(`tour:${id}`) === '1';
  } catch {
    return false;
  }
}

function markSeen(id) {
  seenInSession.add(id);
  try {
    window.localStorage.setItem(`tour:${id}`, '1');
  } catch {
    // Nothing kept: the in-memory mark still holds for this session.
  }
}

// Room around a lit element, so its edge is not flush with the dark.
const PAD = 6;
const CARD_W = 360;
const GAP = 14;

function rectOf(target) {
  const nodes = target.all
    ? [...document.querySelectorAll(target.selector)]
    : [document.querySelector(target.selector)].filter(Boolean);
  const rects = nodes
    .map((node) => node.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0);
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((r) => r.left)) - PAD;
  const top = Math.min(...rects.map((r) => r.top)) - PAD;
  const right = Math.max(...rects.map((r) => r.right)) + PAD;
  const bottom = Math.max(...rects.map((r) => r.bottom)) + PAD;
  return { left, top, width: right - left, height: bottom - top };
}

function measure(step) {
  const holes = (step.targets ?? [])
    .map((target) => ({ target, rect: rectOf(target) }))
    .filter((hole) => hole.rect);
  const box = (selector) => {
    const node = selector ? document.querySelector(selector) : null;
    const r = node?.getBoundingClientRect();
    return r && r.width > 0 ? { left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom } : null;
  };
  return { holes, anchor: box(step.anchor), within: box(step.within), vw: window.innerWidth, vh: window.innerHeight };
}

function cardStyle({ anchor, within, vw, vh }) {
  const width = Math.min(CARD_W, vw - 32);
  if (!anchor) {
    const area = within ?? { left: 0, top: 0, width: vw, height: vh };
    return {
      width,
      left: Math.min(Math.max(16, area.left + area.width / 2 - width / 2), vw - width - 16),
      top: Math.max(16, area.top + area.height / 2 - 140),
    };
  }
  // Under the anchor, centred on it and kept on screen.
  const left = Math.min(Math.max(16, anchor.left + anchor.width / 2 - width / 2), vw - width - 16);
  const top = Math.min(anchor.bottom + PAD + GAP, vh - 220);
  return { width, left, top: Math.max(16, top) };
}

function tagStyle(hole) {
  const { rect, target } = hole;
  const at = target.tagAt ?? 'inside';
  if (at === 'below') return { left: rect.left, top: rect.top + rect.height + 8 };
  if (at === 'above') return { left: rect.left, top: rect.top - 8, transform: 'translateY(-100%)' };
  return {
    left: rect.left + rect.width / 2,
    top: rect.top + rect.height / 2,
    transform: 'translate(-50%, -50%)',
  };
}

/**
 * @param {object} props
 * @param {(string|null)[]} props.marks  what "seen" is remembered under
 * @param {boolean} props.ready    start once the screen is laid out
 * @param {object[]} props.steps
 * @param {number} [props.replay]  raise it to show the tour again, seen or not
 * @param {() => void} [props.onClose]
 */
export function Tour({ marks, ready, steps, replay = 0, onClose }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState(null);
  const titleId = useId();
  const primaryRef = useRef(null);

  // Started when the screen is ready and something in it was never seen.
  const ids = marks.filter(Boolean);
  const marksKey = ids.join(' ');
  useEffect(() => {
    if (ready && !open && steps.length > 0 && ids.some((id) => !tourSeen(id))) {
      setIndex(0);
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, open, marksKey, steps.length]);

  // Asked for again (the "?" beside the map): from the first step.
  useEffect(() => {
    if (replay > 0) {
      setIndex(0);
      setOpen(true);
    }
  }, [replay]);

  const step = open && steps.length ? steps[Math.min(index, steps.length - 1)] : null;

  // Measured every frame while open: the lit parts move when the page lays
  // itself out (a box fading in, a font arriving, a resize).
  useLayoutEffect(() => {
    if (!step) return undefined;
    let frame = 0;
    let last = '';
    const tick = () => {
      const next = measure(step);
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setLayout(next);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const close = useCallback(() => {
    for (const id of marksKey.split(' ')) if (id) markSeen(id);
    setOpen(false);
    onClose?.();
  }, [marksKey, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (event.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, steps.length]);

  useEffect(() => {
    if (open) primaryRef.current?.focus({ preventScroll: true });
  }, [open, index]);

  if (!step || !layout) return null;
  const last = index >= steps.length - 1;
  const { holes, vw, vh } = layout;

  return createPortal(
    <div className="aa-tour" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <svg className="aa-tour__veil" width={vw} height={vh} aria-hidden="true">
        <defs>
          <mask id={`${titleId}-mask`}>
            <rect width={vw} height={vh} fill="white" />
            {holes.map(({ rect }, i) => (
              <rect key={i} x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx="10" fill="black" />
            ))}
          </mask>
        </defs>
        <rect
          width={vw}
          height={vh}
          className={`aa-tour__shade${holes.length ? '' : ' aa-tour__shade--light'}`}
          mask={`url(#${titleId}-mask)`}
        />
        {holes.map(({ rect }, i) => (
          <rect
            key={i}
            className="aa-tour__ring"
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx="10"
          />
        ))}
      </svg>

      {holes.map((hole, i) =>
        hole.target.tag ? (
          <span key={i} className="aa-tour__tag" style={tagStyle(hole)}>
            {hole.target.tag}
          </span>
        ) : null,
      )}

      <section className="aa-tour__card" style={cardStyle(layout)}>
        <p className="aa-tour__count aa-mono">
          {t('tour.step', { n: index + 1, total: steps.length })}
        </p>
        <h2 className="aa-tour__title" id={titleId}>
          {step.title}
        </h2>
        <div className="aa-tour__body">{step.body}</div>
        <div className="aa-tour__actions">
          {!last && (
            <button type="button" className="aa-tour__skip" onClick={close}>
              {t('tour.skip')}
            </button>
          )}
          <span className="aa-tour__spacer" />
          {index > 0 && (
            <button type="button" className="aa-btn aa-btn--ghost aa-tour__btn" onClick={() => setIndex(index - 1)}>
              {t('tour.back')}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            className="aa-btn aa-btn--solid aa-tour__btn"
            onClick={() => (last ? close() : setIndex(index + 1))}
          >
            {last ? t('tour.done') : t('tour.next')}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
