import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { useI18n } from '../i18n/index.jsx';
import { platformBySlug } from '../data/platforms.js';
import { ZONES } from '../data/platforms.js';
import { CITY_PROFILES } from '../data/mesh.js';
import { useCityMesh } from '../workers/useCityMesh.js';
import './CityPage.css';

const PAPER_URL = 'https://doi.org/10.1140/epjds';
const GITHUB_URL = 'https://github.com/sony-csl-rome';

export default function CityPage() {
  const { slug, cityId } = useParams();
  const platform = platformBySlug(slug);
  const profile = CITY_PROFILES[cityId];

  if (!platform || !profile) return <Navigate to={`/platforms/${slug ?? ''}`} replace />;
  return <CityScreen key={cityId} platform={platform} profile={profile} />;
}

function CityScreen({ platform, profile }) {
  const { t, n, lang } = useI18n();
  const { status, data } = useCityMesh(profile);
  const [activeZone, setActiveZone] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);

  const cityName = lang === 'it' ? profile.nameIt : profile.name;
  const region = lang === 'it' ? profile.regionIt : profile.region;

  const fillPaint = useMemo(
    () => ({
      'fill-color': [
        'match',
        ['get', 'zone'],
        ...ZONES.flatMap((zone, index) => [index, zone.color]),
        ZONES[3].color,
      ],
      'fill-opacity':
        activeZone == null
          ? 0.88
          : ['case', ['==', ['get', 'zone'], activeZone], 0.95, 0.14],
    }),
    [activeZone],
  );

  const highlightPaint = useMemo(
    () => ({ 'line-color': 'rgba(21,23,26,0.85)', 'line-width': 1.6 }),
    [],
  );

  const stats = data?.stats;

  return (
    <div className="aa-page aa-page--fixed">
      <Nav active="platforms" sticky={false} />

      <Subhead
        accent={platform.accent}
        label={platform.name}
        title={cityName}
        meta={
          <span className="aa-city__region">
            {t('city.region', { region, count: stats ? n(stats.cellCount) : '—' })}
          </span>
        }
      >
        <Link className="aa-chip aa-chip--active" to={`/platforms/${platform.slug}`}>
          {t('city.worldMap')}
        </Link>
        <span className="aa-chip">{t('city.compare')}</span>
        <a className="aa-chip" href={PAPER_URL} target="_blank" rel="noreferrer noopener">
          {t('platform.paper')}
        </a>
        <a className="aa-chip" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
          {t('platform.github')}
        </a>
      </Subhead>

      <main className="aa-main aa-city" id="main">
        {/* ── Zone panel ───────────────────────────────────────── */}
        <aside className="aa-city__panel">
          <Eyebrow>{t('city.zoneType')}</Eyebrow>
          <div className="aa-zones">
            {ZONES.map((zone, index) => {
              const share = stats?.zoneShares[index];
              return (
                <button
                  key={zone.id}
                  type="button"
                  className={`aa-zones__row${activeZone === index ? ' aa-zones__row--active' : ''}`}
                  onMouseEnter={() => setActiveZone(index)}
                  onMouseLeave={() => setActiveZone(null)}
                  onFocus={() => setActiveZone(index)}
                  onBlur={() => setActiveZone(null)}
                  onClick={() => setActiveZone((current) => (current === index ? null : index))}
                  aria-pressed={activeZone === index}
                >
                  <span className="aa-zones__head">
                    <span className="aa-swatch" style={{ background: zone.color }} />
                    <span className="aa-zones__name">{t(`city.zones.${zone.key}.name`)}</span>
                    <span className="aa-mono aa-zones__pct">
                      {share == null ? '—' : `${n(share, { minimumFractionDigits: 1 })}%`}
                    </span>
                  </span>
                  <span className="aa-zones__desc">{t(`city.zones.${zone.key}.desc`)}</span>
                  <span className="aa-meter aa-zones__meter">
                    <span
                      className="aa-meter__fill"
                      style={{ width: `${share ?? 0}%`, background: zone.color }}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="aa-city__summary">
            <Eyebrow>{t('city.summary.title')}</Eyebrow>
            <dl className="aa-summary">
              <SummaryRow
                label={t('city.summary.hexagons')}
                value={stats ? n(stats.cellCount) : '—'}
              />
              <SummaryRow
                label={t('city.summary.proximity')}
                value={stats ? `${n(stats.medianWalkMetres)} m` : '—'}
              />
              <SummaryRow
                label={t('city.summary.opportunity')}
                value={
                  stats
                    ? `${n(stats.medianJobsK, { minimumFractionDigits: 1 })} k`
                    : '—'
                }
              />
              <SummaryRow
                label={t('city.summary.population')}
                value={`${n(profile.population / 1e6, { minimumFractionDigits: 1 })} M`}
              />
            </dl>
          </div>
        </aside>

        {/* ── Cartogram ────────────────────────────────────────── */}
        <section className="aa-city__cartogram">
          <Eyebrow>{t('city.cartogram.title')}</Eyebrow>
          <div className="aa-city__canvas">
            {status === 'ready' ? (
              <AtlasMap
                center={profile.center}
                zoom={profile.zoom}
                graticule={false}
                label={`${cityName} — ${t('city.cartogram.title')}`}
              >
                <GeoJSONLayer
                  id="mesh"
                  data={data.geojson}
                  type="fill"
                  paint={fillPaint}
                  onHover={(feature) => setHoverCell(feature ? feature.id : null)}
                  tooltip={(feature) =>
                    `${n(feature.properties.walkMetres)} m · ${n(feature.properties.jobsK, {
                      minimumFractionDigits: 1,
                    })} k`
                  }
                />
                {hoverCell != null && (
                  <GeoJSONLayer
                    id="mesh-highlight"
                    data={data.geojson}
                    type="line"
                    paint={highlightPaint}
                    filter={['==', ['id'], hoverCell]}
                    interactive={false}
                  />
                )}
              </AtlasMap>
            ) : (
              <div className="aa-city__loading">{t('city.computing')}</div>
            )}
            {stats && (
              <div className="aa-city__caption">
                {t('city.cartogram.caption', {
                  res: stats.h3Resolution,
                  size: n(stats.cellRadiusM),
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Scatter ──────────────────────────────────────────── */}
        <section className="aa-city__scatter">
          <Eyebrow>{t('city.scatter.title')}</Eyebrow>
          <div className="aa-city__plot">
            {status === 'ready' && (
              <ScatterPlot
                points={data.scatter}
                thresholds={data.thresholds}
                activeZone={activeZone}
                hoverCell={hoverCell}
                onHoverCell={setHoverCell}
                labels={{
                  x: t('city.scatter.xAxis'),
                  y: t('city.scatter.yAxis'),
                  zones: ZONES.map((zone) => t(`city.zones.${zone.key}.name`)),
                }}
              />
            )}
          </div>
        </section>
      </main>

      <div className="aa-statusbar">
        <span>{t('city.statusHint')}</span>
        <span className="aa-mono">
          {formatCoord(profile.center[1], 'NS')} {formatCoord(profile.center[0], 'EW')}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="aa-summary__row">
      <dt>{label}</dt>
      <dd className="aa-mono">{value}</dd>
    </div>
  );
}

// Proximity (y) against opportunity (x), quadrants split on the same
// thresholds the mesh classifier used.
function ScatterPlot({ points, thresholds, activeZone, hoverCell, onHoverCell, labels }) {
  const W = 700;
  const H = 360;
  const PAD = { left: 40, right: 40, top: 20, bottom: 30 };

  const x = (v) => PAD.left + v * (W - PAD.left - PAD.right);
  const y = (v) => H - PAD.bottom - v * (H - PAD.top - PAD.bottom);

  const xCut = x(thresholds.opportunity);
  const yCut = y(thresholds.proximity);

  const quadrants = [
    // [x, y, w, h, color, opacity, labelIndex, labelAnchor]
    [PAD.left, PAD.top, xCut - PAD.left, yCut - PAD.top, ZONES[1].color, 0.06, 1],
    [xCut, PAD.top, W - PAD.right - xCut, yCut - PAD.top, ZONES[0].color, 0.08, 0],
    [PAD.left, yCut, xCut - PAD.left, H - PAD.bottom - yCut, ZONES[3].color, 0.07, 3],
    [xCut, yCut, W - PAD.right - xCut, H - PAD.bottom - yCut, ZONES[2].color, 0.06, 2],
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="aa-scatter" role="img" aria-label={labels.y}>
      {quadrants.map(([qx, qy, qw, qh, color, opacity], index) => (
        <rect
          key={index}
          x={qx}
          y={qy}
          width={Math.max(qw, 0)}
          height={Math.max(qh, 0)}
          fill={color}
          opacity={opacity}
        />
      ))}

      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="var(--ink-3)" strokeWidth="0.5" />
      <line
        x1={PAD.left}
        y1={H - PAD.bottom}
        x2={W - PAD.right}
        y2={H - PAD.bottom}
        stroke="var(--ink-3)"
        strokeWidth="0.5"
      />
      <line x1={PAD.left} y1={yCut} x2={W - PAD.right} y2={yCut} stroke="var(--ink-3)" strokeDasharray="3 3" strokeWidth="0.5" />
      <line x1={xCut} y1={PAD.top} x2={xCut} y2={H - PAD.bottom} stroke="var(--ink-3)" strokeDasharray="3 3" strokeWidth="0.5" />

      {points.map((point) => {
        const dimmed = activeZone != null && activeZone !== point.z;
        return (
          <circle
            key={point.i}
            cx={x(point.x)}
            cy={y(point.y)}
            r={hoverCell === point.i ? 4 : 2}
            fill={ZONES[point.z].color}
            opacity={dimmed ? 0.12 : 0.85}
            onMouseEnter={() => onHoverCell(point.i)}
            onMouseLeave={() => onHoverCell(null)}
          />
        );
      })}

      <text x={PAD.left + 20} y={PAD.top + 20} className="aa-scatter__label">
        {labels.zones[1]}
      </text>
      <text x={xCut + 20} y={PAD.top + 20} className="aa-scatter__label">
        {labels.zones[0]}
      </text>
      <text x={PAD.left + 20} y={H - PAD.bottom - 10} className="aa-scatter__label">
        {labels.zones[3]}
      </text>
      <text x={xCut + 20} y={H - PAD.bottom - 10} className="aa-scatter__label">
        {labels.zones[2]}
      </text>

      <text x={W / 2} y={H - 4} textAnchor="middle" className="aa-scatter__axis">
        {labels.x}
      </text>
      <text
        x={14}
        y={(H - PAD.bottom + PAD.top) / 2}
        textAnchor="middle"
        transform={`rotate(-90 14 ${(H - PAD.bottom + PAD.top) / 2})`}
        className="aa-scatter__axis"
      >
        {labels.y}
      </text>
    </svg>
  );
}

function formatCoord(value, axes) {
  const hemisphere = value >= 0 ? axes[0] : axes[1];
  return `${Math.abs(value).toFixed(3)}°${hemisphere}`;
}
