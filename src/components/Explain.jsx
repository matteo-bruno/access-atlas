import { useId, useState } from 'react';
import './Explain.css';

/**
 * A heading with a "?" that opens a short explanation in place.
 *
 * Both upstream viewers put one of these next to anything a reader could
 * misread — a legend, an axis, a summary figure — and open them on *click*
 * rather than hover, so the text stays put long enough to read and works on a
 * touch screen. The explanation sits in the flow underneath rather than
 * floating over the map, so opening one never covers what it describes.
 *
 * The short text answers the question in front of the reader; anything longer
 * belongs behind "more info", which opens the full account in a dialog rather
 * than pushing the map off the screen.
 *
 * @param {string} [props.label]     heading text; omitted for a bare "?"
 * @param {string} [props.body]      the explanation, or pass children
 * @param {Function} [props.onMore]  opens the long form
 * @param {boolean} [props.open]     open on first render
 */
export function Explain({
  label,
  body,
  children,
  onMore,
  moreLabel,
  defaultOpen = false,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const content = children ?? body;

  return (
    <div className={`aa-explain ${className}`.trim()}>
      <div className={`aa-explain__head${label ? ' aa-eyebrow' : ''}`}>
        {label && <span>{label}</span>}
        <button
          type="button"
          className={`aa-explain__btn${open ? ' aa-explain__btn--open' : ''}`}
          aria-expanded={open}
          aria-controls={id}
          // The visible glyph carries no meaning to a screen reader, and
          // "?" alone would not say what is being explained.
          aria-label={label ? `${label} — ?` : '?'}
          onClick={() => setOpen((current) => !current)}
        >
          ?
        </button>
      </div>
      {open && (
        <div className="aa-explain__body" id={id} role="note">
          {typeof content === 'string' ? <p>{content}</p> : content}
          {onMore && (
            <button type="button" className="aa-explain__more" onClick={onMore}>
              {moreLabel} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
