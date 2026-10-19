import { useEffect, useState } from 'react';

/** The width under which a screen is laid out as a phone. */
export const PHONE_QUERY = '(max-width: 860px)';

const matches = (query) =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/** Whether a media query matches now, kept current as the window changes. */
export function useMediaQuery(query) {
  const [value, setValue] = useState(() => matches(query));
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const list = window.matchMedia(query);
    const onChange = () => setValue(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return value;
}

/** Whether the screen is laid out as a phone, read once (for initial state). */
export const isPhoneNow = () => matches(PHONE_QUERY);
