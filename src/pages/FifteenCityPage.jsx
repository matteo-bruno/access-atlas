import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useCityMesh } from '../workers/useCityMesh.js';
import { useAtlasCityIds } from '../data/useAtlasData.js';
import { summariseMeasure } from '../data/adapters.js';
import { BANDS, CATEGORIES, MODES, measureKey } from '../data/fifteen.js';
import './CityPage.css';
import './FifteenCityPage.css';

const PAPER_URL = 'https://doi.org/10.1140/epjds/s13688-026-00623-8';
const GITHUB_URL = 'https://github.com/matteo-bruno/access-atlas';

/**
 * 15minCity's city view. The other two platforms classify each cell once and
 * draw the result; this one measures ten categories across two modes, so the
 * choice of what to draw is the interface. No scatter — the platform has two
 * axes (category and mode), not two measures to plot against each other.
 */
export function FifteenCityPage({ platform, profile }) {
  const { t, n, lang } = useI18n();
  const { status, data, source } = useCityMesh(profile, platform.id);
  const atlasCityIds = useAtlasCityIds();

  const [mode, setMode] = useState(MODES[0].key);
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [activeBand, setActiveBand] = useState(null);

  const cityName = lang === 'it' ? profile.nameIt : profile.name;
  const region = lang === 'it' ? profile.regionIt : profile.region;

  const key = measureKey(category, mode);
  const bands = BANDS[mode];
  const scale = platform.scale;

  const measure = useMemo(
    () => (data?.geojson ? summariseMeasure(data.geojson, key, bands) : null),
    [data, key, bands],
  );

  // Colour straight from the selected property with a step expression, so
  // switching category or mode is a paint change rather than a reload.
  const fillPaint = useMemo(() => {
    const steps = [];
    for (let i = 0; i < bands.length - 1; i++) steps.push(scale[i], bands[i]);
    steps.push(scale[bands.length - 1]);
    return {
      'fill-color': ['step', ['coalesce', ['get', key], -999], scale[0], ...steps.slice(1)],
      'fill-opacity':
        activeBand == null
          ? 0.85
          : [
              'case',
              bandFilter(key, bands, activeBand),
              0.95,
              0.1,
            ],
    };
  }, [key, bands, scale, activeBand]);

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
        {atlasCityIds.has(profile.id) && (
          <Link className="aa-chip" to={`/atlas/${profile.id}?layer=${platform.id}`}>
            {t('atlas.label')}
          </Link>
        )}
        <a className="aa-chip" href={PAPER_URL} target="_blank" rel="noreferrer noopener">
          {t('platform.paper')}
        </a>
        <a className="aa-chip" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
          {t('platform.github')}
        </a>
      </Subhead>

      <main className="aa-main aa-city aa-city--nochart" id="main">
        <aside className="aa-city__panel">
          {/* ── Controls ─────────────────────────────────────── */}
          <Eyebrow>{t('fifteen.controls.mode')}</Eyebrow>
          <div className="aa-toggle" role="group" aria-label={t('fifteen.controls.mode')}>
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`aa-toggle__btn${mode === m.key ? ' aa-toggle__btn--active' : ''}`}
                aria-pressed={mode === m.key}
                onClick={() => setMode(m.key)}
              >
                {t(`fifteen.modes.${m.i18n}`)}
              </button>
            ))}
          </div>

          <label className="aa-field">
            <Eyebrow>{t('fifteen.controls.category')}</Eyebrow>
            <select
              className="aa-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {t(`fifteen.categories.${c.i18n}`)}
                </option>
              ))}
            </select>
          </label>

          <p className="aa-city__hint">{t('fifteen.hint')}</p>

          {/* ── Legend with the share of cells in each band ───── */}
          <Eyebrow>{t('fifteen.legendValue')}</Eyebrow>
          <div className="aa-bands">
            {bands.map((edge, index) => {
              const share = measure?.shares[index];
              return (
                <button
                  key={edge}
                  type="button"
                  className={`aa-bands__row${activeBand === index ? ' aa-bands__row--active' : ''}`}
                  aria-pressed={activeBand === index}
                  onMouseEnter={() => setActiveBand(index)}
                  onMouseLeave={() => setActiveBand(null)}
                  onFocus={() => setActiveBand(index)}
                  onBlur={() => setActiveBand(null)}
                  onClick={() => setActiveBand((cur) => (cur === index ? null : index))}
                >
                  <span className="aa-swatch" style={{ background: scale[index] }} />
                  <span className="aa-bands__label aa-mono">
                    {bandLabel(bands, index, n)}
                  </span>
                  <span className="aa-mono aa-bands__pct">
                    {share == null ? '—' : `${n(share, { minimumFractionDigits: 1 })}%`}
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
                label={t('fifteen.summary.median')}
                value={
                  measure?.median == null
                    ? '—'
                    : `${n(measure.median, { maximumFractionDigits: 1 })} ${t('fifteen.minutes')}`
                }
              />
              <SummaryRow
                label={t('city.summary.population')}
                value={
                  stats?.population == null
                    ? '—'
                    : `${n(stats.population / 1e6, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })} M`
                }
              />
            </dl>
          </div>
        </aside>

        <section className="aa-city__cartogram aa-city__cartogram--wide">
          <Eyebrow>{t('fifteen.mapTitle')}</Eyebrow>
          <div className="aa-city__canvas">
            {status === 'ready' ? (
              <AtlasMap
                center={profile.center}
                zoom={profile.zoom}
                graticule={false}
                label={`${cityName} — ${t('fifteen.mapTitle')}`}
              >
                <GeoJSONLayer
                  id="fifteen-mesh"
                  data={data.geojson}
                  type="fill"
                  paint={fillPaint}
                  tooltip={(feature) => {
                    const value = feature.properties?.[key];
                    return value == null
                      ? '—'
                      : `${n(value, { maximumFractionDigits: 1 })} ${t('fifteen.minutes')}`;
                  }}
                />
              </AtlasMap>
            ) : (
              <div className="aa-city__loading">{t('city.computing')}</div>
            )}
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
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="aa-statusbar">
        <span>{source === 'seed' ? t('city.seeded') : t('fifteen.statusHint')}</span>
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

// MapLibre expression selecting the cells inside one legend band.
function bandFilter(key, bands, index) {
  const value = ['coalesce', ['get', key], -999];
  const upper = bands[index];
  if (index === 0) return ['<=', value, upper];
  const lower = bands[index - 1];
  if (index === bands.length - 1) return ['>', value, lower];
  return ['all', ['>', value, lower], ['<=', value, upper]];
}

function bandLabel(bands, index, n) {
  if (index === 0) return `≤ ${n(bands[0])}`;
  if (index === bands.length - 1) return `> ${n(bands[bands.length - 2])}`;
  return `${n(bands[index - 1])} – ${n(bands[index])}`;
}

function formatCoord(value, axes) {
  const hemisphere = value >= 0 ? axes[0] : axes[1];
  return `${Math.abs(value).toFixed(3)}°${hemisphere}`;
}
