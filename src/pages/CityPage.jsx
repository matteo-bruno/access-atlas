import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { RampLegend } from '../components/RampLegend.jsx';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { RAMPS, rampColor } from '../map/ramps.js';
import { useI18n } from '../i18n/index.jsx';
import { platformBySlug } from '../data/platforms.js';
import { ZONES } from '../data/platforms.js';
import { useAtlasCityIds, useCityGeometry, useCityProfile } from '../data/useAtlasData.js';
import { withGeometry } from '../data/adapters.js';
import { GeometryToggle } from '../components/GeometryToggle.jsx';
import { paperForPlatform } from '../data/research.js';
import { cityZoom } from '../map/framing.js';
import { useCityMesh } from '../workers/useCityMesh.js';
import { FifteenCityPage } from './FifteenCityPage.jsx';
import './CityPage.css';

const GITHUB_URL = 'https://github.com/matteo-bruno/access-atlas';

export default function CityPage() {
  const { slug, cityId } = useParams();
  const platform = platformBySlug(slug);
  // Resolving the profile reads the catalogue, so a city that exists only as
  // published data still gets a page. The hook runs before any early return —
  // it must be called unconditionally.
  const { status, profile } = useCityProfile(platform?.id, cityId);

  if (!platform) return <Navigate to="/platforms" replace />;
  if (status === 'pending') return <div className="aa-page" />;
  if (status === 'missing' || !profile) return <Navigate to={`/platforms/${slug}`} replace />;
  // 15minCity measures ten categories across two modes rather than
  // classifying each cell once, so its city view is a different screen.
  if (platform.id === 'fifteen') {
    return <FifteenCityPage key={cityId} platform={platform} profile={profile} />;
  }
  return <CityScreen key={cityId} platform={platform} profile={profile} />;
}

function CityScreen({ platform, profile }) {
  const { t, n, lang } = useI18n();
  const { status, data, source } = useCityMesh(profile, platform.id);
  const atlasCityIds = useAtlasCityIds();
  // The paper that defines this platform's method, from the bibliography.
  const paper = paperForPlatform(platform.id);
  const [activeZone, setActiveZone] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);

  // ── Geometry ───────────────────────────────────────────────────────
  // The published file is a cartogram, so that is what opens — the same
  // default both upstream viewers use. The hexagons are a second file,
  // fetched only if someone asks for them.
  // What the published file's own polygons are — the view that opens, and
  // the one that needs no second request.
  const published = profile.geometry ?? 'cartogram';
  const [geometry, setGeometry] = useState(published);
  const other = useCityGeometry(platform.id, profile.id, geometry !== published);
  const swapped = geometry !== published && other.status === 'ready';

  const drawn = useMemo(() => {
    if (!data?.geojson) return null;
    if (!swapped) return data.geojson;
    try {
      return withGeometry(data.geojson, other.collection);
    } catch (error) {
      // A companion that does not line up is a broken file, not a broken
      // page: keep drawing the geometry that does line up.
      if (import.meta.env.DEV) console.warn('[data] geometry companion unusable', error.message);
      return data.geojson;
    }
  }, [data, swapped, other.collection]);

  const cityName = lang === 'it' ? profile.nameIt : profile.name;
  const region = lang === 'it' ? profile.regionIt : profile.region;

  // P.O.V. classifies cells into four named zones — genuinely categorical, so
  // it keeps discrete colours, a share per zone and zone isolation. Car
  // Dependency is a continuous index and is coloured by interpolation; its
  // `zone` band survives only as the scatter's colouring, which needs a
  // discrete hue per point.
  const isCdi = platform.id === 'cardep';

  const bands = useMemo(() => {
    if (isCdi) {
      const labels = t('platform.cardep.legend');
      return platform.scale.map((color, index) => ({
        id: `cdi-${index}`,
        color,
        name: labels[index],
        desc: bandRange(platform.stops, index),
      }));
    }
    return ZONES.map((zone) => ({
      id: zone.id,
      color: zone.color,
      name: t(`city.zones.${zone.key}.name`),
      desc: t(`city.zones.${zone.key}.desc`),
    }));
  }, [isCdi, platform, t]);

  const fillPaint = useMemo(() => {
    if (isCdi) {
      return {
        'fill-color': rampColor(RAMPS.cdi, ['coalesce', ['get', 'cdi'], 0]),
        // Short of opaque, so the basemap reads through the cartogram.
        'fill-opacity': ['case', ['has', 'cdi'], 0.8, 0],
      };
    }
    return {
      'fill-color': [
        'match',
        ['get', 'zone'],
        ...bands.flatMap((band, index) => [index, band.color]),
        bands[bands.length - 1].color,
      ],
      'fill-opacity':
        activeZone == null
          ? 0.8
          : ['case', ['==', ['get', 'zone'], activeZone], 0.95, 0.14],
    };
  }, [isCdi, activeZone, bands]);

  const highlightPaint = useMemo(
    () => ({ 'line-color': 'rgba(21,23,26,0.85)', 'line-width': 1.6 }),
    [],
  );

  const stats = data?.stats;
  // A published file's own population sum is the better number when it exists;
  // the profile's figure is editorial and may cover a different extent.
  const population = stats?.population ?? profile.population ?? null;

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
        {atlasCityIds.has(profile.id) && (
          <Link className="aa-chip" to={`/atlas/${profile.id}?layer=${platform.id}`}>
            {t('atlas.label')}
          </Link>
        )}
        <span className="aa-chip">{t('city.compare')}</span>
        {paper && (
          <a className="aa-chip" href={paper.url} target="_blank" rel="noreferrer noopener">
            {t('platform.paper')}
          </a>
        )}
        <a className="aa-chip" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
          {t('platform.github')}
        </a>
      </Subhead>

      <main className="aa-main aa-city" id="main">
        {/* ── Zone panel ───────────────────────────────────────── */}
        <aside className="aa-city__panel">
          <Eyebrow>{isCdi ? t('platform.cardep.legendUnit') : t('city.zoneType')}</Eyebrow>
          {isCdi ? (
            <>
              <RampLegend ramp={RAMPS.cdi} format={(v) => (v === 0 ? '0' : formatIndex(v, n))} />
              <p className="aa-city__hint">{t('city.cdiHint')}</p>
            </>
          ) : (
          <div className="aa-zones">
            {bands.map((zone, index) => {
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
                    <span className="aa-zones__name">{zone.name}</span>
                    <span className="aa-mono aa-zones__pct">
                      {share == null ? '—' : `${n(share, { minimumFractionDigits: 1 })}%`}
                    </span>
                  </span>
                  <span className="aa-zones__desc">{zone.desc}</span>
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
          )}

          {/* Only where the catalogue publishes a geometry to switch to. A
              seed mesh is a generated arrangement of cells, and neither of
              these two words would be true of it. */}
          {profile.geometry && (
            <GeometryToggle
              value={geometry}
              onChange={setGeometry}
              available={{
                geographic: published === 'geographic' || Boolean(profile.geoDataset),
                cartogram: published === 'cartogram',
              }}
              missingName={platform.name}
              loading={geometry !== published && other.status === 'pending'}
            />
          )}

          <div className="aa-city__summary">
            <Eyebrow>{t('city.summary.title')}</Eyebrow>
            <dl className="aa-summary">
              <SummaryRow
                label={t('city.summary.hexagons')}
                value={stats ? n(stats.cellCount) : '—'}
              />
              {isCdi ? (
                <>
                  <SummaryRow
                    label={t('city.summary.medianCdi')}
                    value={formatIndex(stats?.medianCdi, n)}
                  />
                  <SummaryRow
                    label={t('city.summary.weightedCdi')}
                    value={formatIndex(stats?.weightedCdi, n)}
                  />
                </>
              ) : (
                <>
                  <SummaryRow
                    label={t('city.summary.proximity')}
                    value={
                      stats?.medianWalkMetres != null
                        ? `${n(stats.medianWalkMetres)} m`
                        : formatMedian(stats?.medianProximity, n)
                    }
                  />
                  <SummaryRow
                    label={t('city.summary.opportunity')}
                    value={
                      stats?.medianJobsK != null
                        ? `${n(stats.medianJobsK, { minimumFractionDigits: 1 })} k`
                        : formatMedian(stats?.medianOpportunity, n)
                    }
                  />
                </>
              )}
              <SummaryRow
                label={t('city.summary.population')}
                value={
                  population == null
                    ? '—'
                    : `${n(population / 1e6, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })} M`
                }
              />
            </dl>
          </div>
        </aside>

        {/* ── Cartogram ────────────────────────────────────────── */}
        <section className="aa-city__cartogram">
          <Eyebrow>
            {geometry === 'cartogram' ? t('city.cartogram.title') : t('city.geometry.mapTitle')}
          </Eyebrow>
          <div className="aa-city__canvas">
            {status === 'ready' && drawn ? (
              <AtlasMap
                center={profile.center}
                zoom={cityZoom(profile)}
                graticule={false}
                basemap
                label={`${cityName} — ${t('city.cartogram.title')}`}
              >
                <GeoJSONLayer
                  id="mesh"
                  data={drawn}
                  type="fill"
                  paint={fillPaint}
                  onHover={(feature) => setHoverCell(feature ? feature.id : null)}
                  tooltip={(feature) => formatCellTooltip(feature.properties, n)}
                />
                {hoverCell != null && (
                  <GeoJSONLayer
                    id="mesh-highlight"
                    data={drawn}
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
            {/* Cell geometry is metadata the catalogue supplies; a published
                file that omits it gets no caption rather than a made-up one. */}
            {/* Name the grid only when we know it; otherwise state the cell
                size alone rather than assert a tiling the data is not on. */}
            {stats?.cellRadiusM != null && (
              <div className="aa-city__caption">
                {stats.h3Resolution != null
                  ? t('city.cartogram.caption', {
                      res: stats.h3Resolution,
                      size: n(stats.cellRadiusM),
                    })
                  : t('city.cartogram.captionSize', { size: n(stats.cellRadiusM) })}
                {' · '}
                {geometry === 'cartogram'
                  ? t('city.geometry.cartogramCaption')
                  : t('city.geometry.mapCaption')}
              </div>
            )}
          </div>
        </section>

        {/* ── Scatter ──────────────────────────────────────────── */}
        <section className="aa-city__scatter">
          <Eyebrow>
            {isCdi ? t('city.scatterCdi.title') : t('city.scatter.title')}
          </Eyebrow>
          <div className="aa-city__plot">
            {status === 'ready' && (
              <ScatterPlot
                points={data.scatter}
                thresholds={data.thresholds}
                colors={bands.map((band) => band.color)}
                activeZone={activeZone}
                hoverCell={hoverCell}
                onHoverCell={setHoverCell}
                labels={
                  isCdi
                    ? {
                        x: t('city.scatterCdi.xAxis'),
                        y: t('city.scatterCdi.yAxis'),
                        diagonal: t('city.scatterCdi.diagonal'),
                        zones: bands.map((band) => band.name),
                      }
                    : {
                        x: t('city.scatter.xAxis'),
                        y: t('city.scatter.yAxis'),
                        zones: bands.map((band) => band.name),
                      }
                }
              />
            )}
          </div>
        </section>
      </main>

      <div className="aa-statusbar">
        {/* A generated mesh must never be mistaken for a measured one. */}
        <span>{source === 'seed' ? t('city.seeded') : t('city.statusHint')}</span>
        <span className="aa-mono">
          {formatCoord(profile.center[1], 'NS')} {formatCoord(profile.center[0], 'EW')}
        </span>
      </div>
    </div>
  );
}

// Published P.O.V. files measure proximity and opportunity as weighted POI
// counts, not the seed mesh's metres and thousands of jobs. Rather than invent
// a unit, show the number the dataset actually states.
function formatMedian(value, n) {
  return value == null ? '—' : n(value, { maximumFractionDigits: 1 });
}

// The index is signed and small; the sign is the whole point, so keep it.
function formatIndex(value, n) {
  if (value == null) return '—';
  const text = n(Math.abs(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `−${text}` : `+${text}`;
}

// Band label for the Car Dependency panel: the slice of the index it covers.
function bandRange(stops, index) {
  const lo = index === 0 ? -1 : stops[index - 1];
  const hi = stops[index];
  const fmt = (v) => (v < 0 ? `−${Math.abs(v)}` : `+${v}`);
  return `${fmt(lo)} … ${fmt(hi)}`;
}

function formatCellTooltip(properties, n) {
  if (properties.cdi != null) {
    return `CDI ${formatIndex(properties.cdi, n)}`;
  }
  if (properties.walkMetres != null && properties.jobsK != null) {
    return `${n(properties.walkMetres)} m · ${n(properties.jobsK, {
      minimumFractionDigits: 1,
    })} k`;
  }
  return [properties.proximity, properties.opportunity]
    .filter((value) => value != null)
    .map((value) => n(value, { maximumFractionDigits: 1 }))
    .join(' · ');
}

function SummaryRow({ label, value }) {
  return (
    <div className="aa-summary__row">
      <dt>{label}</dt>
      <dd className="aa-mono">{value}</dd>
    </div>
  );
}

// Two references, one plot. P.O.V. splits the plane into quadrants on the same
// thresholds the classifier used; Car Dependency has no quadrants — what
// matters is the y = x line, where a car and public transport reach the same
// amount, so `thresholds: null` switches to the diagonal.
function ScatterPlot({
  points,
  thresholds,
  colors,
  activeZone,
  hoverCell,
  onHoverCell,
  labels,
}) {
  const W = 700;
  const H = 360;
  const PAD = { left: 40, right: 40, top: 20, bottom: 30 };

  const x = (v) => PAD.left + v * (W - PAD.left - PAD.right);
  const y = (v) => H - PAD.bottom - v * (H - PAD.top - PAD.bottom);

  const xCut = thresholds ? x(thresholds.opportunity) : null;
  const yCut = thresholds ? y(thresholds.proximity) : null;

  const quadrants = thresholds
    ? [
        // [x, y, w, h, color, opacity]
        [PAD.left, PAD.top, xCut - PAD.left, yCut - PAD.top, colors[1], 0.06],
        [xCut, PAD.top, W - PAD.right - xCut, yCut - PAD.top, colors[0], 0.08],
        [PAD.left, yCut, xCut - PAD.left, H - PAD.bottom - yCut, colors[3], 0.07],
        [xCut, yCut, W - PAD.right - xCut, H - PAD.bottom - yCut, colors[2], 0.06],
      ]
    : [];

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
      {thresholds ? (
        <>
          <line x1={PAD.left} y1={yCut} x2={W - PAD.right} y2={yCut} stroke="var(--ink-3)" strokeDasharray="3 3" strokeWidth="0.5" />
          <line x1={xCut} y1={PAD.top} x2={xCut} y2={H - PAD.bottom} stroke="var(--ink-3)" strokeDasharray="3 3" strokeWidth="0.5" />
        </>
      ) : (
        <>
          <line
            x1={x(0)}
            y1={y(0)}
            x2={x(1)}
            y2={y(1)}
            stroke="var(--ink-3)"
            strokeDasharray="4 3"
            strokeWidth="0.7"
          />
          <text x={x(0.62)} y={y(0.68)} className="aa-scatter__label">
            {labels.diagonal}
          </text>
        </>
      )}

      {points.map((point) => {
        const dimmed = activeZone != null && activeZone !== point.z;
        return (
          <circle
            key={point.i}
            cx={x(point.x)}
            cy={y(point.y)}
            r={hoverCell === point.i ? 4 : 2}
            fill={colors[point.z] ?? colors[colors.length - 1]}
            opacity={dimmed ? 0.12 : 0.85}
            onMouseEnter={() => onHoverCell(point.i)}
            onMouseLeave={() => onHoverCell(null)}
          />
        );
      })}

      {/* Quadrant names only make sense where there are quadrants. */}
      {thresholds && (
        <>
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
        </>
      )}

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
