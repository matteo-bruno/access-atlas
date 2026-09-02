// "§ 01 · A single map of access, four lenses."
//
// The italic note that used to sit at the far right of a heading is gone: it
// restated the section under it in three words, and read as a caption for
// something that was not there yet.
export function SectionHeading({ tag, title }) {
  return (
    <div className="aa-section-head">
      {tag && <div className="aa-eyebrow">§ {tag}</div>}
      <h2 className="aa-section-head__title">{title}</h2>
    </div>
  );
}

export function Eyebrow({ children, mono = false, className = '' }) {
  return (
    <div className={`aa-eyebrow${mono ? ' aa-eyebrow--mono' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}
