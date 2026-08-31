import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Subhead } from '../components/Subhead.jsx';
import { Explain } from '../components/Explain.jsx';
import { useI18n } from '../i18n/index.jsx';
import { platformBySlug, ZONES } from '../data/platforms.js';
import { usePlatformSummary } from '../data/useAtlasData.js';
import { RAMPS, colorAt } from '../map/ramps.js';
import './ComparePage.css';

/**
 * One row per city instead of one per cell — the screen both upstream viewers
 * end on, and the one the city pages' "Compare cities" chip has been pointing
 * at with nowhere to go.
 *
 * Every figure comes from the published summary file, computed offline from
 * the same features the city pages draw, so a number here is the number
 * there. Nothing is recomputed in the browser from a sample.
 */
export default function ComparePage() {
  const { slug } = useParams();
  const platform = platformBySlug(slug);
  const summary = usePlatformSummary(platform?.id);

  if (!platform) return <Navigate to="/platforms" replace />;
  return <CompareScreen platform={platform} summary={summary} />;
}

function CompareScreen({ platform, summary }) {
  const { t, n, lang } = useI18n();
  const isCdi = platform.id === 'cardep';
  const [sort, setSort] = useState(isCdi ? 'weightedCdi' : 'inclusion');
  // Zone shares can count cells or the people in them. Isolated cells are
  // large and thinly populated, so the two are genuinely different pictures
  // and neither is the "right" one to show alone.
  const [basis, setBasis] = useState('cells');

  const name = (row) =>
    lang === 'it' ? row.profile.nameIt ?? row.profile.name : row.profile.name;

  const shares = (row) =>
    (basis === 'residents' ? row.zonePopulationShares : row.zoneShares) ?? row.zoneShares;

  const sorted = useMemo(() => {
    const rows = [...summary.cities];
    const by = {
      name: (a, b) => name(a).localeCompare(name(b)),
      population: (a, b) => b.population - a.population,
      weightedCdi: (a, b) => a.weightedCdi - b.weightedCdi,
      medianCdi: (a, b) => a.medianCdi - b.medianCdi,
      ptShare: (a, b) => b.ptShare - a.ptShare,
      inclusion: (a, b) => (shares(b)?.[0] ?? 0) - (shares(a)?.[0] ?? 0),
      proximity: (a, b) => b.medianProximity - a.medianProximity,
      opportunity: (a, b) => b.medianOpportunity - a.medianOpportunity,
    };
    return rows.sort(by[sort] ?? by.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.cities, sort, basis, lang]);

  const sortOptions = isCdi
    ? ['weightedCdi', 'medianCdi', 'ptShare', 'population', 'name']
    : ['inclusion', 'proximity', 'opportunity', 'population', 'name'];

  const cityHref = (row) => `/atlas/${row.id}?layer=${platform.id}`;

  if (summary.status === 'pending') {
    return (
      <div className="aa-page">
        <main className="aa-main aa-compare" id="main">
          <p className="aa-compare__note">{t('compare.loading')}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="aa-page">

      <Subhead
        accent={platform.accent}
        label={t('compare.label')}
        title={platform.name}
        meta={
          <span className="aa-city__region">
            {t('compare.count', { count: n(summary.cities.length) })} · {t('compare.lede')}
          </span>
        }
      >
        <Link className="aa-chip" to={`/platforms/${platform.slug}`}>
          {t('compare.back')}
        </Link>
      </Subhead>

      <main className="aa-main aa-compare" id="main">
        {summary.status !== 'ready' ? (
          <p className="aa-compare__note">
            {t(summary.status === 'error' ? 'compare.error' : 'compare.empty')}
          </p>
        ) : (
          <>
            <div className="aa-compare__controls">
              <label className="aa-field">
                <span className="aa-eyebrow">{t('compare.sortBy')}</span>
                <select
                  className="aa-select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  {sortOptions.map((key) => (
                    <option key={key} value={key}>
                      {t(`compare.sort.${key}`)}
                    </option>
                  ))}
                </select>
              </label>

              {!isCdi && (
                <div className="aa-field">
                  <span className="aa-eyebrow">{t('compare.basis.label')}</span>
                  <div className="aa-toggle" role="group" aria-label={t('compare.basis.label')}>
                    {['cells', 'residents'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`aa-toggle__btn${basis === key ? ' aa-toggle__btn--active' : ''}`}
                        aria-pressed={basis === key}
                        onClick={() => setBasis(key)}
                      >
                        {t(`compare.basis.${key}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Ranking ──────────────────────────────────────────── */}
            <section className="aa-compare__section">
              <Explain
                label={isCdi ? t('compare.ranking.cardep') : t('compare.ranking.pov')}
                body={isCdi ? t('compare.ranking.aboutCardep') : t('compare.ranking.aboutPov')}
              />
              {isCdi ? (
                <DivergingBars rows={sorted} name={name} href={cityHref} n={n} />
              ) : (
                <StackedBars rows={sorted} name={name} href={cityHref} shares={shares} n={n} t={t} />
              )}
            </section>

            {/* ── City scatter ─────────────────────────────────────── */}
            <section className="aa-compare__section">
              <Explain
                label={isCdi ? t('compare.scatter.cardep') : t('compare.scatter.pov')}
                body={isCdi ? t('compare.scatter.aboutCardep') : t('compare.scatter.aboutPov')}
              />
              <CityScatter
                rows={sorted}
                name={name}
                href={cityHref}
                x={(r) => (isCdi ? r.weightedByCar : r.weightedOpportunity)}
                y={(r) => (isCdi ? r.weightedByTransit : r.weightedProximity)}
                colour={(r) =>
                  isCdi
                    ? colorAt(RAMPS.cdi, r.weightedCdi)
                    : ZONES[dominantZone(shares(r))].color
                }
                diagonal={isCdi}
                labels={
                  isCdi
                    ? { x: t('city.cell.byCar'), y: t('city.cell.byTransit') }
                    : { x: t('city.cell.opportunity'), y: t('city.cell.proximity') }
                }
                n={n}
              />
            </section>

            {/* ── Distribution (Car Dependency only) ───────────────── */}
            {isCdi && sorted.some((row) => row.cdf) && (
              <section className="aa-compare__section">
                <Explain
                  label={t('compare.distribution.title')}
                  body={t('compare.distribution.about')}
                />
                <CdfChart rows={sorted} name={name} n={n} />
              </section>
            )}

            {/* ── Table ────────────────────────────────────────────── */}
            <section className="aa-compare__section">
              <Explain label={t('compare.table.title')} body={t('compare.lede')} />
              <div className="aa-compare__scroll">
                <table className="aa-table aa-compare__table">
                  <thead>
                    <tr>
                      <th>{t('compare.th.city')}</th>
                      <th>{t('compare.th.cells')}</th>
                      <th>{t('compare.th.population')}</th>
                      {isCdi ? (
                        <>
                          <th>{t('compare.th.medianCdi')}</th>
                          <th>{t('compare.th.weightedCdi')}</th>
                          <th>{t('compare.th.ptCells')}</th>
                          <th>{t('compare.th.carCells')}</th>
                        </>
                      ) : (
                        <>
                          <th>{t('compare.th.proximity')}</th>
                          <th>{t('compare.th.opportunity')}</th>
                          {ZONES.map((zone) => (
                            <th key={zone.id}>{t(`city.zones.${zone.key}.name`)}</th>
                          ))}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link to={cityHref(row)}>{name(row)}</Link>
                        </td>
                        <td className="aa-mono">{n(row.cells)}</td>
                        <td className="aa-mono">{n(row.population)}</td>
                        {isCdi ? (
                          <>
                            <td className="aa-mono">{signed(row.medianCdi, n)}</td>
                            <td className="aa-mono">{signed(row.weightedCdi, n)}</td>
                            <td className="aa-mono">{pct(row.ptShare, n)}</td>
                            <td className="aa-mono">{pct(row.carShare, n)}</td>
                          </>
                        ) : (
                          <>
                            <td className="aa-mono">
                              {n(row.medianProximity, { maximumFractionDigits: 1 })}
                            </td>
                            <td className="aa-mono">
                              {n(row.medianOpportunity, { maximumFractionDigits: 1 })}
                            </td>
                            {(shares(row) ?? []).map((share, index) => (
                              <td className="aa-mono" key={ZONES[index].id}>
                                {pct(share, n)}
                              </td>
                            ))}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/** Population-weighted index per city, diverging from zero. */
function DivergingBars({ rows, name, href, n }) {
  const extent = Math.max(0.05, ...rows.map((row) => Math.abs(row.weightedCdi))) * 1.05;
  return (
    <div className="aa-bars">
      {rows.map((row) => {
        const width = (Math.abs(row.weightedCdi) / extent) * 50;
        const negative = row.weightedCdi < 0;
        return (
          <Link className="aa-bars__row" key={row.id} to={href(row)}>
            <span className="aa-bars__name">{name(row)}</span>
            <span className="aa-bars__track">
              <span className="aa-bars__zero" />
              <span
                className="aa-bars__fill"
                style={{
                  left: negative ? `${50 - width}%` : '50%',
                  width: `${width}%`,
                  background: colorAt(RAMPS.cdi, row.weightedCdi),
                }}
              />
            </span>
            <span className="aa-mono aa-bars__value">{signed(row.weightedCdi, n)}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** The four zones as one bar per city. */
function StackedBars({ rows, name, href, shares, n, t }) {
  return (
    <div className="aa-bars">
      <div className="aa-bars__key">
        {ZONES.map((zone) => (
          <span className="aa-bars__keyitem" key={zone.id}>
            <span className="aa-swatch" style={{ background: zone.color }} />
            {t(`city.zones.${zone.key}.name`)}
          </span>
        ))}
      </div>
      {rows.map((row) => {
        const values = shares(row) ?? [];
        return (
          <Link className="aa-bars__row" key={row.id} to={href(row)}>
            <span className="aa-bars__name">{name(row)}</span>
            <span className="aa-bars__stack">
              {values.map((share, index) => (
                <span
                  key={ZONES[index].id}
                  className="aa-bars__seg"
                  style={{ width: `${share}%`, background: ZONES[index].color }}
                  title={`${t(`city.zones.${ZONES[index].key}.name`)} ${pct(share, n)}`}
                />
              ))}
            </span>
            <span className="aa-mono aa-bars__value">{pct(values[0] ?? 0, n)}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** One circle per city, sized by population. */
function CityScatter({ rows, name, href, x, y, colour, diagonal, labels, n }) {
  const W = 720;
  const H = 420;
  const PAD = { left: 62, right: 30, top: 24, bottom: 46 };
  const values = rows.map((row) => [x(row), y(row)]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (!values.length) return null;

  // Both axes share one top when the diagonal has to mean something.
  const maxX = Math.max(...values.map(([a]) => a)) * 1.08;
  const maxY = Math.max(...values.map(([, b]) => b)) * 1.08;
  const top = diagonal ? Math.max(maxX, maxY) : null;
  const spanX = top ?? maxX;
  const spanY = top ?? maxY;

  const px = (v) => PAD.left + (v / spanX) * (W - PAD.left - PAD.right);
  const py = (v) => H - PAD.bottom - (v / spanY) * (H - PAD.top - PAD.bottom);
  const maxPop = Math.max(...rows.map((row) => row.population));
  const radius = (pop) => 5 + Math.sqrt(pop / maxPop) * 13;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="aa-cityscatter" role="img" aria-label={labels.y}>
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="var(--ink-3)" strokeWidth="0.5" />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="var(--ink-3)" strokeWidth="0.5" />
      {diagonal && (
        <line
          x1={px(0)}
          y1={py(0)}
          x2={px(spanX)}
          y2={py(spanY)}
          stroke="var(--ink-3)"
          strokeDasharray="4 3"
          strokeWidth="0.7"
        />
      )}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <text key={f} x={px(spanX * f)} y={H - PAD.bottom + 14} textAnchor="middle" className="aa-scatter__axis">
          {compact(spanX * f, n)}
        </text>
      ))}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <text key={f} x={PAD.left - 8} y={py(spanY * f) + 3} textAnchor="end" className="aa-scatter__axis">
          {compact(spanY * f, n)}
        </text>
      ))}

      {rows.map((row) => {
        const cx = x(row);
        const cy = y(row);
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
        return (
          <a key={row.id} href={href(row)} className="aa-cityscatter__dot">
            <circle
              cx={px(cx)}
              cy={py(cy)}
              r={radius(row.population)}
              fill={colour(row)}
              fillOpacity="0.72"
              stroke="var(--card)"
              strokeWidth="1.4"
            />
            <text x={px(cx)} y={py(cy) - radius(row.population) - 4} textAnchor="middle" className="aa-scatter__label">
              {name(row)}
            </text>
          </a>
        );
      })}

      <text x={W / 2} y={H - 6} textAnchor="middle" className="aa-scatter__axis">
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

/** Cumulative share of each city's residents at or below an index value. */
function CdfChart({ rows, name, n }) {
  const W = 720;
  const H = 360;
  const PAD = { left: 52, right: 110, top: 20, bottom: 44 };
  const px = (v) => PAD.left + ((v + 1) / 2) * (W - PAD.left - PAD.right);
  const py = (v) => H - PAD.bottom - v * (H - PAD.top - PAD.bottom);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="aa-cdf" role="img">
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="var(--ink-3)" strokeWidth="0.5" />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="var(--ink-3)" strokeWidth="0.5" />
      {/* CDI = 0: where a car and public transport reach the same amount. */}
      <line x1={px(0)} y1={PAD.top} x2={px(0)} y2={H - PAD.bottom} stroke="var(--ink-3)" strokeDasharray="3 3" strokeWidth="0.5" />
      {[-1, -0.5, 0, 0.5, 1].map((v) => (
        <text key={v} x={px(v)} y={H - PAD.bottom + 14} textAnchor="middle" className="aa-scatter__axis">
          {v === 0 ? '0' : signed(v, n)}
        </text>
      ))}
      {[0, 0.5, 1].map((v) => (
        <text key={v} x={PAD.left - 8} y={py(v) + 3} textAnchor="end" className="aa-scatter__axis">
          {n(Math.round(v * 100))}%
        </text>
      ))}
      {rows.map((row) =>
        row.cdf ? (
          <polyline
            key={row.id}
            points={row.cdf.map(([v, share]) => `${px(v)},${py(share)}`).join(' ')}
            fill="none"
            stroke={colorAt(RAMPS.cdi, row.weightedCdi)}
            strokeWidth="1.6"
            opacity="0.85"
          >
            <title>{name(row)}</title>
          </polyline>
        ) : null,
      )}
      {/* Curves are unlabelled where they run together; the end of each one
          is where it can be read, so the names sit there. */}
      {rows.map((row, index) =>
        row.cdf ? (
          <text
            key={row.id}
            x={W - PAD.right + 6}
            y={PAD.top + 11 + index * 11}
            className="aa-scatter__label"
            fill={colorAt(RAMPS.cdi, row.weightedCdi)}
          >
            {name(row)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function dominantZone(shares) {
  if (!shares?.length) return 0;
  return shares.indexOf(Math.max(...shares));
}

function signed(value, n) {
  if (!Number.isFinite(value)) return '—';
  const text = n(Math.abs(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `−${text}` : `+${text}`;
}

function pct(value, n) {
  return Number.isFinite(value)
    ? `${n(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
    : '—';
}

function compact(value, n) {
  if (!Number.isFinite(value)) return '—';
  return value >= 1000 ? `${n(Math.round(value / 1000))}k` : n(Math.round(value));
}
