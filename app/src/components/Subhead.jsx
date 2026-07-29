import './Subhead.css';

/**
 * The bar under the nav on map screens: a coloured dot, a label, the title,
 * then whatever trailing controls the page needs. Shared by the platform
 * landings and the city detail pages — it lives in its own component so its
 * styles ship with every route that uses it.
 */
export function Subhead({ accent, label, title, meta, children }) {
  return (
    <div className="aa-subhead">
      <span className="aa-dot" style={{ background: accent }} />
      <span className="aa-subhead__label">{label}</span>
      <h1 className="aa-subhead__name">{title}</h1>
      {meta}
      <div className="aa-subhead__spacer" />
      {children}
    </div>
  );
}
