import { CATEGORIES, BANDS, formatTime, measureKey } from '../data/fifteen.js';
import { RAMPS, colorAt } from '../map/ramps.js';
import { useI18n } from '../i18n/index.jsx';
import './CategoryBars.css';

/**
 * How far every category of service is from one cell, as bars.
 *
 * The map answers one category at a time; a selected cell can answer all ten
 * at once, which is where a place's shape shows — a cell four minutes from
 * shops and twenty from a school is not the same as one evenly nine minutes
 * from everything, and the map cannot say so.
 *
 * Bars run against a fixed axis per mode (the top of that mode's bands), not
 * against the cell's own maximum, so two cells are comparable. Colours come
 * from the map's ramp, so a bar and its cell are the same colour.
 *
 * @param {object} props.properties  the selected feature's properties
 * @param {'foot'|'bicycle'} props.mode
 */
export function CategoryBars({ properties, mode }) {
  const { t, n } = useI18n();
  const bands = BANDS[mode] ?? BANDS.foot;
  const axis = bands[bands.length - 1];

  const rows = CATEGORIES.map((category) => ({
    key: category.key,
    label: t(`fifteen.categories.${category.i18n}`),
    value: Number(properties?.[measureKey(category.key, mode)]),
    // The first entry is the average across the other nine, not a service of
    // its own, so it is set apart rather than ranked among them.
    average: category.key === 'proximity_time',
  }));

  if (!rows.some((row) => Number.isFinite(row.value))) return null;

  return (
    <div className="aa-catbars">
      {rows.map((row) => (
        <div
          className={`aa-catbars__row${row.average ? ' aa-catbars__row--average' : ''}`}
          key={row.key}
        >
          <span className="aa-catbars__label">{row.label}</span>
          <span className="aa-catbars__track">
            {Number.isFinite(row.value) && (
              <span
                className="aa-catbars__fill"
                style={{
                  width: `${Math.min((row.value / axis) * 100, 100)}%`,
                  background: colorAt(RAMPS.fifteen, row.value),
                }}
              />
            )}
          </span>
          <span className="aa-mono aa-catbars__value">
            {Number.isFinite(row.value) ? formatTime(row.value) : '—'}
          </span>
        </div>
      ))}
      <p className="aa-catbars__axis">
        {t('fifteen.barsAxis', { max: n(axis), unit: t('fifteen.minutes') })}
      </p>
    </div>
  );
}
