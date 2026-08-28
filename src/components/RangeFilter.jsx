import './RangeFilter.css';

/**
 * A two-thumb range filter: keep the cells whose value falls between the
 * thumbs, and dim the rest rather than hiding them, so what is filtered out
 * still reads as part of the city.
 *
 * Two stacked native sliders rather than a custom widget — they arrive with
 * keyboard support, and the thumbs are the only part that takes the pointer,
 * so whichever is nearer wins the drag.
 *
 * @param {[number, number]} props.value        current [low, high]
 * @param {(next: [number, number]) => void} props.onChange
 * @param {number} props.min
 * @param {number} props.max
 * @param {number} [props.step]
 * @param {(v: number) => string} [props.format]
 */
export function RangeFilter({
  value,
  onChange,
  min,
  max,
  step = 0.01,
  format = (v) => String(v),
  label,
  resetLabel,
}) {
  const [low, high] = value;
  const span = max - min || 1;
  const pct = (v) => ((v - min) / span) * 100;
  const filtered = low > min || high < max;

  // The thumbs cannot cross: each clamps against the other rather than
  // swapping, which would make a drag jump under the pointer.
  const setLow = (next) => onChange([Math.min(next, high), high]);
  const setHigh = (next) => onChange([low, Math.max(next, low)]);

  return (
    <div className="aa-range">
      <div className="aa-range__values aa-mono">
        <span>{format(low)}</span>
        {filtered && (
          <button type="button" className="aa-range__reset" onClick={() => onChange([min, max])}>
            {resetLabel}
          </button>
        )}
        <span>{format(high)}</span>
      </div>
      <div className="aa-range__slider">
        <div className="aa-range__track" />
        <div
          className="aa-range__fill"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        <input
          type="range"
          className="aa-range__input"
          min={min}
          max={max}
          step={step}
          value={low}
          aria-label={`${label} — ${format(min)}`}
          onChange={(event) => setLow(Number(event.target.value))}
        />
        <input
          type="range"
          className="aa-range__input"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label={`${label} — ${format(max)}`}
          onChange={(event) => setHigh(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
