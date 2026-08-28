import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { RampLegend } from '../components/RampLegend.jsx';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { RAMPS, rampColor } from '../map/ramps.js';
import { cityZoom } from '../map/framing.js';
import { useI18n } from '../i18n/index.jsx';
import { useCityMesh } from '../workers/useCityMesh.js';
import { useAtlasCityIds } from '../data/useAtlasData.js';
import { GeometryToggle } from '../components/GeometryToggle.jsx';
import { summariseMeasure } from '../data/adapters.js';
import { CATEGORIES, MODES, measureKey } from '../data/fifteen.js';
import { paperForPlatform } from '../data/research.js';
import './CityPage.css';
import './FifteenCityPage.css';

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

  const cityName = lang === 'it' ? profile.nameIt : profile.name;
  const region = lang === 'it' ? profile.regionIt : profile.region;

  const key = measureKey(category, mode);
  const paper = paperForPlatform(platform.id);

  // One scale for every category and mode (src/map/ramps.js), so a colour
  // means the same number of minutes wherever it appears — including in the
  // combined viewer, which paints this layer from the same ramp.
  const measure = useMemo(
    () => (data?.geojson ? summariseMeasure(data.geojson, key, RAMPS.fifteen.ticks) : null),
    [data, key],
  );

  // Colour straight from the selected property, so switching category or mode
  // is a paint change rather than a reload.
  const fillPaint = useMemo(
    () => ({
      'fill-color': rampColor(RAMPS.fifteen, ['coalesce', ['get', key], 0]),
      // Short of opaque, so the basemap reads through the mesh.
      'fill-opacity': ['case', ['has', key], 0.8, 0],
    }),
    [key],
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
        {atlasCityIds.has(profile.id) && (
          <Link className="aa-chip" to={`/atlas/${profile.id}?layer=${platform.id}`}>
            {t('atlas.label')}
          </Link>
        )}
        {paper && (
          <a className="aa-chip" href={paper.url} target="_blank" rel="noreferrer noopener">
            {t('platform.paper')}
          </a>
        )}
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

          {/* ── Legend ───────────────────────────────────────── */}
          <Eyebrow>{t('fifteen.legendValue')}</Eyebrow>
          <RampLegend
            ramp={RAMPS.fifteen}
            format={(v) => n(v, { maximumFractionDigits: 1 })}
            beyondLabel={t('atlas.beyond.fifteen')}
          />

          {/* 15minCity publishes its cells where they are and nothing else,
              so the switch is here to say that rather than to offer it. */}
          {profile.geometry && (
            <GeometryToggle
              value="geographic"
              onChange={() => {}}
              available={{ geographic: true, cartogram: false }}
              missingName={platform.name}
            />
          )}

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
                zoom={cityZoom(profile)}
                graticule={false}
                basemap
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
                {' · '}
                {t('city.geometry.mapCaption')}
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

function formatCoord(value, axes) {
  const hemisphere = value >= 0 ? axes[0] : axes[1];
  return `${Math.abs(value).toFixed(3)}°${hemisphere}`;
}
