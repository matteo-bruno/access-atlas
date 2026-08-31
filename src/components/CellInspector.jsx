import { Eyebrow } from './SectionHeading.jsx';
import './CellInspector.css';

/**
 * The "selected hexagon" panel both upstream viewers carry: click a cell — on
 * the map or on the scatter — and read everything measured for it, rather
 * than the one value a tooltip has room for.
 *
 * The rows are the caller's, because what a cell *is* differs per platform:
 * a zone and two scores here, a signed index and its two sides there. This
 * component owns the empty state and the layout, nothing about the meaning.
 *
 * @param {string} props.title
 * @param {string} props.empty                 prompt shown with no selection
 * @param {{label: string, value: string, accent?: string}[]} [props.rows]
 * @param {React.ReactNode} [props.children]  extra detail under the rows
 * @param {boolean} [props.bare]  omit the heading — the container has one
 * @param {() => void} [props.onClear]
 */
export function CellInspector({ title, empty, rows, clearLabel, onClear, children, bare = false }) {
  return (
    <div className={`aa-inspector${bare ? ' aa-inspector--bare' : ''}`}>
      {!bare && (
        <div className="aa-inspector__head">
          <Eyebrow>{title}</Eyebrow>
          {rows && onClear && (
            <button type="button" className="aa-inspector__clear" onClick={onClear}>
              {clearLabel}
            </button>
          )}
        </div>
      )}
      {rows ? (
        <>
          <dl className="aa-summary aa-inspector__rows">
            {rows.map((row) => (
              <div className="aa-summary__row" key={row.label}>
                <dt>
                  {row.accent && (
                    <span className="aa-swatch" style={{ background: row.accent }} />
                  )}
                  {row.label}
                </dt>
                <dd className="aa-mono">{row.value}</dd>
              </div>
            ))}
          </dl>
          {children}
        </>
      ) : (
        <p className="aa-inspector__empty">{empty}</p>
      )}
    </div>
  );
}
