import { legendRange, rampGradient, rampPosition } from '../map/ramps.js';
import './RampLegend.css';

/**
 * The legend for a continuous ramp: the gradient itself, with the values it
 * spans labelled underneath. A banded legend can list a share per band; a
 * continuous one cannot, so the bar carries the reading instead.
 *
 * `beyond` describes a tail the bar deliberately does not show — the 15minCity
 * scale keeps darkening past 30 minutes to black at 120, and stretching the
 * bar that far would squash the range nearly every cell sits in.
 */
export function RampLegend({ ramp, format = (v) => v, beyondLabel }) {
  const ticks = ramp.ticks ?? legendRange(ramp);

  return (
    <div className="aa-ramp">
      <div className="aa-ramp__bar" style={{ background: rampGradient(ramp) }} />
      <div className="aa-ramp__ticks aa-mono">
        {ticks.map((value, index) => (
          <span
            key={value}
            className="aa-ramp__tick"
            style={{
              // First and last hug the ends so their labels stay inside the bar.
              left: `${rampPosition(ramp, value)}%`,
              transform:
                index === 0
                  ? 'translateX(0)'
                  : index === ticks.length - 1
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)',
            }}
          >
            {format(value)}
          </span>
        ))}
      </div>
      {ramp.beyond && beyondLabel && (
        <div className="aa-ramp__beyond">
          <span className="aa-swatch" style={{ background: ramp.beyond.color }} />
          <span>{beyondLabel}</span>
        </div>
      )}
    </div>
  );
}
