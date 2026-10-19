import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Explain.css';

// The tooltip's own width, and how far it keeps off the window's edges. The
// width is here as well as in the stylesheet because the placement has to know
// it before the browser has laid the tooltip out.
const TIP_W = 258;
const MARGIN = 10;

/** Where the tooltip sits, given the button it belongs to. */
function place(button, align) {
  const rect = button.getBoundingClientRect();
  const width = window.innerWidth;
  const height = window.innerHeight;
  // The same edges as before: hanging left from the button, or right from it.
  let left = align === 'right' ? rect.right + 6 - TIP_W : rect.left - 6;
  left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, width - TIP_W - MARGIN));
  // Below the button, unless the room is above it — a control near the foot of
  // a tall column has none below.
  const below = rect.bottom + 7;
  const flip = height - rect.bottom < 160 && rect.top > height - rect.bottom;
  return { left, top: flip ? undefined : below, bottom: flip ? height - rect.top + 7 : undefined };
}

/**
 * A "?" beside a heading that shows its explanation in a small panel.
 *
 * It opens on a click and stays open until the reader closes it: another
 * click on the "?", a click anywhere else, or Escape. It used to follow the
 * pointer, opening on hover; the lab preferred an explanation that is asked
 * for and stays put while it is read, and that a link inside it can be
 * reached without chasing it.
 *
 * The long form is not here — it is behind the page's "about" dialog, so a
 * tooltip never has to be big enough to hold an argument.
 *
 * **The panel is drawn in a portal, fixed to the page.** These sit in the
 * city view's controls column, which scrolls — and a scrolling box clips what
 * its children paint outside it, whatever their z-index, so a tooltip was cut
 * off at the map's edge exactly where it had the most to say. Out of the
 * column, positioned against the button's own rectangle, it is bounded by the
 * window instead: it hangs from the same edge as before, flips above the
 * button when there is no room below, and is nudged back inside the viewport
 * rather than off it.
 *
 * @param {string} [props.label]   heading text; omitted for a bare "?"
 * @param {string} [props.body]    the explanation, or pass children
 * @param {'left'|'right'} [props.align]  which edge the tooltip hangs from
 * @param {React.ReactNode} [props.trigger]  the button's own content, for a
 *        note opened from a line of text ("Notice a mistake?") rather than a
 *        "?" beside a heading; it opens the same panel the same way
 * @param {string} [props.triggerClassName]  the class of that button
 */
export function Explain({
  label,
  body,
  children,
  align = 'left',
  className = '',
  trigger,
  triggerClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(null);
  const id = useId();
  const content = children ?? body;
  const btnRef = useRef(null);
  const tipRef = useRef(null);

  // Closed by a click anywhere but the "?" and the panel, or by Escape.
  useEffect(() => {
    if (!open) return undefined;
    const away = (event) => {
      if (btnRef.current?.contains(event.target) || tipRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Measured before the browser paints, so the tooltip never appears at last
  // time's position first.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return undefined;
    const put = () => btnRef.current && setAt(place(btnRef.current, align));
    put();
    // The column it hangs off scrolls, and so does the page under it.
    window.addEventListener('scroll', put, true);
    window.addEventListener('resize', put);
    return () => {
      window.removeEventListener('scroll', put, true);
      window.removeEventListener('resize', put);
    };
  }, [open, align]);

  const tip =
    open && content && at ? (
      <span
        ref={tipRef}
        className="aa-explain__tip"
        id={id}
        role="tooltip"
        style={{ left: at.left, top: at.top, bottom: at.bottom }}
      >
        {typeof content === 'string' ? <span>{content}</span> : content}
      </span>
    ) : null;

  if (trigger) {
    return (
      <div className={`aa-explain ${className}`.trim()}>
        <button
          ref={btnRef}
          type="button"
          className={triggerClassName}
          aria-expanded={open}
          aria-describedby={open ? id : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          {trigger}
        </button>
        {tip && createPortal(tip, document.body)}
      </div>
    );
  }

  return (
    <div className={`aa-explain ${className}`.trim()}>
      <div className={`aa-explain__head${label ? ' aa-eyebrow' : ''}`}>
        {label && <span>{label}</span>}
        <span className="aa-explain__wrap">
          <button
            ref={btnRef}
            type="button"
            className={`aa-explain__btn${open ? ' aa-explain__btn--open' : ''}`}
            aria-expanded={open}
            aria-describedby={open ? id : undefined}
            // The glyph says nothing to a screen reader, and "?" alone would
            // not say what is being explained.
            aria-label={label ? `${label} — ?` : '?'}
            onClick={() => setOpen((value) => !value)}
          >
            ?
          </button>
        </span>
      </div>
      {tip && createPortal(tip, document.body)}
    </div>
  );
}
