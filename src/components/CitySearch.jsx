import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import './CitySearch.css';

/**
 * Find a city and open it. The one control the world map cannot do without:
 * twenty pins on a world map are hard to hit and impossible to scan.
 *
 * ⌘K / Ctrl-K focuses it, as the hint beside it promises.
 *
 * @param {object[]} props.cities  the coverage list on screen
 * @param {(city: object) => void} props.onOpen
 */
export function CitySearch({ cities, onOpen, inputRef: externalRef }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const ownRef = useRef(null);
  // The welcome card's call to action focuses this, so the caller may hold
  // the ref instead.
  const inputRef = externalRef ?? ownRef;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((city) => city.name.toLowerCase().includes(q)).slice(0, 6);
  }, [cities, query]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const open = (city) => {
    onOpen(city);
    setQuery('');
  };

  return (
    <div className="aa-search">
      <Icon name="search" size={14} color="var(--ink-3)" />
      <input
        ref={inputRef}
        className="aa-search__input"
        type="search"
        value={query}
        placeholder={t('platform.search')}
        aria-label={t('platform.search')}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && matches[0]) open(matches[0]);
          if (event.key === 'Escape') setQuery('');
        }}
      />
      <kbd className="aa-search__kbd">{t('platform.searchHint')}</kbd>

      {query.trim() && (
        <div className="aa-search__results">
          {matches.length === 0 && <div className="aa-search__empty">{t('platform.empty')}</div>}
          {matches.map((city) => (
            <button
              key={city.id}
              type="button"
              className="aa-search__result"
              // The input must not blur before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => open(city)}
            >
              <span>{city.name}</span>
              <span className="aa-mono aa-search__country">{city.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
