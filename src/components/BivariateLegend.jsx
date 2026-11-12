import { useEffect, useRef } from 'react';
import { BIVARIATE_CORNERS, bivariateColor } from '../map/bivariate.js';
import { useI18n } from '../i18n/index.jsx';
import './BivariateLegend.css';

// Pixels per side of the drawn square, before the screen's own density.
const SIDE = 88;

/**
 * The key to Close & Connected's bivariate map: the colour square itself,
 * opportunity along the bottom and proximity up the side, each running from
 * the city's lowest-scoring residents to its highest, with the medians drawn
 * across it. The four corners are named beside it, in the zones' terms, since
 * each corner is the far end of one zone.
 */
export function BivariateLegend() {
  const { t } = useI18n();
  const canvas = useRef(null);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.round(SIDE * ratio);
    node.width = size;
    node.height = size;
    const ctx = node.getContext('2d');
    // Cells of a few pixels: the mix is smooth, so no pattern shows.
    const step = Math.max(1, Math.round(2 * ratio));
    for (let px = 0; px < size; px += step) {
      for (let py = 0; py < size; py += step) {
        ctx.fillStyle = bivariateColor(1 - py / size, px / size);
        ctx.fillRect(px, py, step, step);
      }
    }
  }, []);

  const corners = [
    { color: BIVARIATE_CORNERS[3], label: t('atlas.bivariate.both'), zone: t('city.zones.inclusion.name') },
    { color: BIVARIATE_CORNERS[1], label: t('atlas.bivariate.proximity'), zone: t('city.zones.spatial.name') },
    { color: BIVARIATE_CORNERS[2], label: t('atlas.bivariate.opportunity'), zone: t('city.zones.social.name') },
    { color: BIVARIATE_CORNERS[0], label: t('atlas.bivariate.neither'), zone: t('city.zones.total.name') },
  ];

  return (
    <div className="aa-bivariate">
      <div className="aa-bivariate__square">
        <span className="aa-bivariate__axis aa-bivariate__axis--y">{t('atlas.bivariate.axisY')}</span>
        <div className="aa-bivariate__frame">
          <canvas ref={canvas} className="aa-bivariate__canvas" aria-hidden="true" />
          {/* The medians: where the zones split the city. */}
          <span className="aa-bivariate__median aa-bivariate__median--x" />
          <span className="aa-bivariate__median aa-bivariate__median--y" />
        </div>
        <span className="aa-bivariate__axis aa-bivariate__axis--x">{t('atlas.bivariate.axisX')}</span>
      </div>
      <ul className="aa-bivariate__key">
        {corners.map((corner) => (
          <li key={corner.color} className="aa-bivariate__row">
            <span className="aa-swatch" style={{ background: corner.color }} />
            <span className="aa-bivariate__label">
              {corner.label}
              <span className="aa-bivariate__zone">{corner.zone}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
