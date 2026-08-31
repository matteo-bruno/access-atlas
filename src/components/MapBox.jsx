import './MapBox.css';

/**
 * A small card that floats over the map: the summary, the selected cell, the
 * geometry switch, the opacity.
 *
 * The map is the page now, so its controls sit on it rather than in a column
 * beside it. Each box collapses to its own title, because on a laptop four
 * open boxes and a map is mostly boxes.
 *
 * @param {string} props.title
 * @param {boolean} [props.open]      omit for a box that never collapses
 * @param {() => void} [props.onToggle]
 * @param {React.ReactNode} [props.actions]  right of the title, e.g. "clear"
 */
export function MapBox({ title, open, onToggle, actions, className = '', children }) {
  const collapsible = typeof onToggle === 'function';
  const shown = collapsible ? open : true;

  return (
    <div className={`aa-mapbox ${className}`.trim()}>
      <div className="aa-mapbox__head">
        {collapsible ? (
          <button
            type="button"
            className="aa-mapbox__toggle aa-eyebrow"
            aria-expanded={shown}
            onClick={onToggle}
          >
            <span className={`aa-mapbox__caret${shown ? ' aa-mapbox__caret--open' : ''}`}>▸</span>
            {title}
          </button>
        ) : (
          <span className="aa-eyebrow aa-mapbox__title">{title}</span>
        )}
        {shown && actions}
      </div>
      {shown && <div className="aa-mapbox__body">{children}</div>}
    </div>
  );
}
