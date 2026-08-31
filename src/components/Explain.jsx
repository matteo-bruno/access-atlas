import { useId, useRef, useState } from 'react';
import './Explain.css';

/**
 * A "?" beside a heading that shows its explanation as a tooltip.
 *
 * The tooltip follows the pointer's intent rather than a click: it appears on
 * hover or focus and leaves when the pointer does, so reading one costs
 * nothing and dismissing it is not a second decision. It stays while the
 * pointer is over the tooltip itself, which is what makes a link inside one
 * reachable. Escape closes it for the keyboard.
 *
 * The long form is not here — it is behind the page's "about" dialog, so a
 * tooltip never has to be big enough to hold an argument.
 *
 * @param {string} [props.label]   heading text; omitted for a bare "?"
 * @param {string} [props.body]    the explanation, or pass children
 * @param {'left'|'right'} [props.align]  which edge the tooltip hangs from
 */
export function Explain({ label, body, children, align = 'left', className = '' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const content = children ?? body;
  // A pointer crossing the gap between button and tooltip should not close it,
  // so the whole wrapper owns the hover rather than the button alone.
  const wrapRef = useRef(null);

  return (
    <div className={`aa-explain ${className}`.trim()}>
      <div className={`aa-explain__head${label ? ' aa-eyebrow' : ''}`}>
        {label && <span>{label}</span>}
        <span
          className="aa-explain__wrap"
          ref={wrapRef}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            className={`aa-explain__btn${open ? ' aa-explain__btn--open' : ''}`}
            aria-expanded={open}
            aria-describedby={open ? id : undefined}
            // The glyph says nothing to a screen reader, and "?" alone would
            // not say what is being explained.
            aria-label={label ? `${label} — ?` : '?'}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onClick={() => setOpen((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false);
            }}
          >
            ?
          </button>
          {open && content && (
            <span
              className={`aa-explain__tip aa-explain__tip--${align}`}
              id={id}
              role="tooltip"
            >
              {typeof content === 'string' ? <span>{content}</span> : content}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
