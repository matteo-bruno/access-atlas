// "§ 01 · A single map of access, four lenses. — hover any platform to preview"
export function SectionHeading({ tag, title, hint }) {
  return (
    <div className="aa-section-head">
      {tag && <div className="aa-eyebrow">§ {tag}</div>}
      <h2 className="aa-section-head__title">{title}</h2>
      {hint && <div className="aa-section-head__hint">{hint}</div>}
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
