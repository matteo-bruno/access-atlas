import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Subhead } from '../components/Subhead.jsx';
import { RampLegend } from '../components/RampLegend.jsx';
import { AtlasMap, GeoJSONLayer } from '../map/AtlasMap.jsx';
import { RAMPS, rampColor } from '../map/ramps.js';
import { cityZoom, meshBounds } from '../map/framing.js';
import { useI18n } from '../i18n/index.jsx';
import { useCityMesh } from '../workers/useCityMesh.js';
import { useAtlasCityIds, useCityGeometry } from '../data/useAtlasData.js';
import { withGeometry } from '../data/adapters.js';
import { GeometryToggle } from '../components/GeometryToggle.jsx';
import { Explain } from '../components/Explain.jsx';
import { CellInspector } from '../components/CellInspector.jsx';
import { CategoryBars } from '../components/CategoryBars.jsx';
import { PlatformAbout } from '../components/PlatformAbout.jsx';
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
  const [hoverCell, setHoverCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  // This platform publishes its cells where they are; the cartogram beside
  // them is the Atlas's own, by the rule build-atlas.mjs states.
  const published = profile.geometry ?? 'geographic';
  const [geometry, setGeometry] = useState(published);
  const other = useCityGeometry(platform.id, profile.id, geometry !== published);
  const swapped = geometry !== published && other.status === 'ready';

  const drawn = useMemo(() => {
    if (!data?.geojson) return null;
    if (!swapped) return data.geojson;
    try {
      return withGeometry(data.geojson, other.collection);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[data] geometry companion unusable', error.message);
      return data.geojson;
    }
  }, [data, swapped, other.collection]);

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

  // The rows follow the selector: this platform measures forty things per
  // cell, and the one on screen is the one being read.
  const selectedRows = useMemo(() => {
    const feature = selectedCell == null ? null : data?.geojson?.features?.[selectedCell];
    if (!feature) return null;
    const p = feature.properties ?? {};
    const value = p[key];
    return [
      {
        label: `${t(`fifteen.categories.${CATEGORIES.find((c) => c.key === category).i18n}`)} · ${t(
          `fifteen.modes.${MODES.find((m) => m.key === mode).i18n}`,
        )}`,
        value:
          value == null
            ? '—'
            : `${n(value, { maximumFractionDigits: 1 })} ${t('fifteen.minutes')}`,
      },
      {
        label: t('city.cell.population'),
        value: Number.isFinite(p.population) ? n(Math.round(p.population)) : '—',
      },
    ];
  }, [selectedCell, data, key, category, mode, t, n]);

  const bounds = useMemo(() => meshBounds(data?.geojson), [data]);

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
          <Explain
            label={t('fifteen.legendValue')}
            body={t('city.explain.map.fifteen')}
            moreLabel={t('city.explain.more')}
            onMore={() => setAboutOpen(true)}
          />
          <RampLegend
            ramp={RAMPS.fifteen}
            format={(v) => n(v, { maximumFractionDigits: 1 })}
            beyondLabel={t('atlas.beyond.fifteen')}
          />

          {profile.geometry && (
            <GeometryToggle
              value={geometry}
              onChange={setGeometry}
              available={{
                geographic: published === 'geographic' || Boolean(profile.geoDataset),
                cartogram: published === 'cartogram' || Boolean(profile.cartogramDataset),
              }}
              derived={profile.cartogramSource === 'derived'}
              missingName={platform.name}
              loading={geometry !== published && other.status === 'pending'}
            />
          )}

          <div className="aa-city__summary">
            <Explain
              label={t('city.summary.title')}
              body={t('city.explain.summary.fifteen')}
              moreLabel={t('city.explain.more')}
              onMore={() => setAboutOpen(true)}
            />
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

          <CellInspector
            title={t('city.selected.title')}
            empty={t('city.selected.empty')}
            rows={selectedRows}
            clearLabel={t('city.selected.clear')}
            onClear={() => setSelectedCell(null)}
          >
            {/* The map answers one category at a time; the selected cell can
                answer all ten, which is where a place's shape shows. */}
            {selectedCell != null && data?.geojson?.features?.[selectedCell] && (
              <>
                <p className="aa-catbars__title">{t('fifteen.barsTitle')}</p>
                <CategoryBars
                  properties={data.geojson.features[selectedCell].properties}
                  mode={mode}
                />
              </>
            )}
          </CellInspector>

          <Explain label={t('city.explain.methodsTitle')} className="aa-city__methods">
            <p>{t('city.explain.methods.fifteen')}</p>
            {paper && (
              <p>
                {t('city.explain.paperNote')}{' '}
                <a href={paper.url} target="_blank" rel="noreferrer noopener">
                  {paper.title} ↗
                </a>
              </p>
            )}
          </Explain>
        </aside>

        <section className="aa-city__cartogram aa-city__cartogram--wide">
          <Eyebrow>
            {geometry === 'cartogram' ? t('city.cartogram.title') : t('fifteen.mapTitle')}
          </Eyebrow>
          <div className="aa-city__canvas">
            {status === 'ready' && drawn ? (
              <AtlasMap
                center={profile.center}
                zoom={cityZoom(profile)}
                bounds={bounds}
                fitPadding={24}
                graticule={false}
                basemap
                label={`${cityName} — ${t('fifteen.mapTitle')}`}
              >
                <GeoJSONLayer
                  id="fifteen-mesh"
                  data={drawn}
                  type="fill"
                  paint={fillPaint}
                  onHover={(feature) => setHoverCell(feature ? feature.id : null)}
                  onClick={(feature) =>
                    setSelectedCell((current) => (current === feature.id ? null : feature.id))
                  }
                  tooltip={(feature) => {
                    const value = feature.properties?.[key];
                    return value == null
                      ? '—'
                      : `${n(value, { maximumFractionDigits: 1 })} ${t('fifteen.minutes')}`;
                  }}
                />
                {hoverCell != null && (
                  <GeoJSONLayer
                    id="fifteen-mesh-highlight"
                    data={drawn}
                    type="line"
                    paint={{ 'line-color': 'rgba(21,23,26,0.85)', 'line-width': 1.6 }}
                    filter={['==', ['id'], hoverCell]}
                    interactive={false}
                  />
                )}
                {selectedCell != null && (
                  <GeoJSONLayer
                    id="fifteen-mesh-selected"
                    data={drawn}
                    type="line"
                    paint={{ 'line-color': 'rgba(21,23,26,0.95)', 'line-width': 2.6 }}
                    filter={['==', ['id'], selectedCell]}
                    interactive={false}
                  />
                )}
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
                {geometry === 'cartogram'
                  ? t('city.geometry.cartogramCaption')
                  : t('city.geometry.mapCaption')}
              </div>
            )}
          </div>
        </section>
      </main>

      {aboutOpen && (
        <PlatformAbout
          platformId={platform.id}
          name={platform.name}
          onClose={() => setAboutOpen(false)}
        />
      )}

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
