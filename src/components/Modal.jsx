import { useEffect, useId, useRef } from 'react';
import './Modal.css';

/**
 * A dialog for the long form of an explanation — the "full explanation" both
 * upstream viewers open from their legends.
 *
 * The short version stays in the panel where it can be read beside the map;
 * this is for the account that would crowd it out. Escape and the backdrop
 * close it, and focus moves in on open so a keyboard is not left behind on
 * the page underneath.
 */
export function Modal({ title, onClose, children }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="aa-modal"
      // The backdrop closes, but only when it is the backdrop that was
      // clicked — a drag that ends outside the panel should not.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="aa-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="aa-modal__head">
          <h2 className="aa-modal__title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="aa-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="aa-modal__body">{children}</div>
      </div>
    </div>
  );
}
