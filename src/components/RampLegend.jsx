import { legendRange, rampGradient, rampPosition, rampTailGradient } from '../map/ramps.js';
import './RampLegend.css';

/**
 * The legend for a continuous ramp: the gradient itself, with the values it
 * spans labelled underneath. A banded legend can list a share per band; a
 * continuous one cannot, so the bar carries the reading instead.
 *
 * Where a ramp keeps going past its bar — 15-minute city darkens to black at
 * 120 minutes, the isochrones to 180 — the rest is drawn beside it as a
 * compressed tail rather than described in a sentence. Stretching the bar
 * that far would squash the range nearly every cell sits in; leaving the tail
 * off entirely means colours appear on the map that are nowhere on the
 * legend.
 */
export function RampLegend({ ramp, format = (v) => v, tailLabel }) {
  const ticks = ramp.ticks ?? legendRange(ramp);
  const tail = tailLabel ? rampTailGradient(ramp) : null;

  return (
    <div className="aa-ramp">
      <div className="aa-ramp__row">
        <div className="aa-ramp__seg">
          <div className="aa-ramp__bar" style={{ background: rampGradient(ramp) }} />
          <div className="aa-ramp__ticks aa-mono">
            {ticks.map((value, index) => (
              <span
                key={value}
                className="aa-ramp__tick"
                style={{
                  // First and last hug the ends so their labels stay inside.
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
        </div>

        {tail && (
          <div className="aa-ramp__seg aa-ramp__seg--tail">
            <div className="aa-ramp__bar" style={{ background: tail }} />
            <div className="aa-ramp__ticks aa-mono">
              {/* The break in scale is the point: the tail covers four times
                  the range of the bar beside it, in a quarter of the width. */}
              <span className="aa-ramp__tick aa-ramp__tick--break">…</span>
              <span className="aa-ramp__tick" style={{ left: '100%', transform: 'translateX(-100%)' }}>
                {tailLabel}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
