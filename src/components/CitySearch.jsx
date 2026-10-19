import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import { cityLabel } from '../data/catalogue.js';
import { searchCities, searchEntry } from '../data/citySearch.js';
import './CitySearch.css';

const MAX_RESULTS = 8;

const IS_APPLE =
  typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);

/**
 * Find a city and open it. The one control the world map cannot do without:
 * twenty pins on a world map are hard to hit and impossible to scan.
 *
 * It searches every city the Atlas publishes, whichever layer is open: a city
 * is a city, and the city view opens on a layer it has. Names match in any
 * language the catalogue carries, without accents, and by country.
 *
 * A combobox in the ARIA sense: the arrows move through the results, Enter
 * opens the one highlighted, Escape clears and then leaves. ⌘K / Ctrl-K
 * focuses it from anywhere on the page, as the hint beside it promises.
 *
 * @param {object[]} props.cities  `{ id, name, nameIt?, region?, regionIt?,
 *                                  country?, extent?, population? }`
 * @param {(city: object) => void} props.onOpen
 * @param {(city: object|null) => void} [props.onActive]  the highlighted
 *        result, so the map can point at it
 */
export function CitySearch({ cities, onOpen, onActive, inputRef: externalRef }) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ownRef = useRef(null);
  const listId = useId();
  // The welcome card's call to action focuses this, so the caller may hold
  // the ref instead.
  const inputRef = externalRef ?? ownRef;

  // The ranking is shared with CityChat's find_cities (data/citySearch.js).
  const index = useMemo(() => cities.map(searchEntry), [cities]);
  const matches = useMemo(() => searchCities(index, query, MAX_RESULTS), [index, query]);

  const shown = open && query.trim() !== '';
  const current = shown ? (matches[active] ?? null) : null;

  // A new query starts from the top of its own results.
  useEffect(() => setActive(0), [query]);

  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;
  useEffect(() => {
    onActiveRef.current?.(current);
  }, [current]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputRef]);

  const choose = (city) => {
    if (!city) return;
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
    onOpen(city);
  };

  const onKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setOpen(true);
        if (matches.length) setActive((i) => (i + 1) % matches.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (matches.length) setActive((i) => (i - 1 + matches.length) % matches.length);
        break;
      case 'Enter':
        event.preventDefault();
        if (shown) choose(matches[active]);
        break;
      case 'Escape':
        // First Escape clears; the second, on an empty box, leaves it.
        if (query) setQuery('');
        else inputRef.current?.blur();
        break;
      default:
    }
  };

  const hint = IS_APPLE ? t('platform.searchHint') : t('platform.searchHint').replace('⌘', 'Ctrl ');

  return (
    <div className={`aa-search${shown ? ' aa-search--open' : ''}`}>
      <Icon name="search" size={14} color="var(--ink-3)" />
      <input
        ref={inputRef}
        className="aa-search__input"
        type="search"
        role="combobox"
        aria-expanded={shown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={current ? `${listId}-${current.id}` : undefined}
        autoComplete="off"
        spellCheck={false}
        value={query}
        placeholder={t('platform.search')}
        aria-label={t('platform.search')}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {query ? (
        <button
          type="button"
          className="aa-search__clear"
          aria-label={t('platform.searchClear')}
          // Keep the focus in the box: clearing is not leaving.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
        >
          <Icon name="close" size={12} color="var(--ink-3)" />
        </button>
      ) : (
        <kbd className="aa-search__kbd">{hint}</kbd>
      )}

      {shown && (
        <div className="aa-search__results" id={listId} role="listbox" aria-label={t('platform.search')}>
          {matches.length === 0 && <div className="aa-search__empty">{t('platform.empty')}</div>}
          {matches.map((city, i) => (
            <div
              key={city.id}
              id={`${listId}-${city.id}`}
              role="option"
              aria-selected={i === active}
              className={`aa-search__result${i === active ? ' aa-search__result--active' : ''}`}
              // The input must not blur before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(city)}
            >
              <span className="aa-search__name">{cityLabel(city, lang, t)}</span>
              <span className="aa-search__country">
                {(lang === 'it' ? city.regionIt : null) ?? city.region ?? city.country}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
