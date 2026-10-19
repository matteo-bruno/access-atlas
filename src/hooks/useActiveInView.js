import { useEffect, useRef } from 'react';

/**
 * A row that scrolls sideways (the layer pickers on a phone) keeps its active
 * item in sight: otherwise a layer late in the row is chosen off screen, and
 * the row says nothing about which one is on.
 *
 * @param {unknown} key  what decides the active item (the layer's id)
 * @returns a ref for the scrolling row
 */
export function useActiveInView(key, selector = '.aa-picker__item--active') {
  const ref = useRef(null);
  useEffect(() => {
    const row = ref.current;
    const item = row?.querySelector(selector);
    if (!row || !item || row.scrollWidth <= row.clientWidth) return;
    const start = item.offsetLeft - row.offsetLeft;
    const end = start + item.offsetWidth;
    if (start < row.scrollLeft || end > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: Math.max(0, start - 8), behavior: 'smooth' });
    }
  }, [key, selector]);
  return ref;
}
