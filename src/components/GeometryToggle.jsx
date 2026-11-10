import { Explain } from './Explain.jsx';
import { useI18n } from '../i18n/index.jsx';
import './GeometryToggle.css';

/**
 * Map ↔ cartogram: the switch both upstream viewers open with. A layer that
 * draws its cells a third way (Close & Connected's scatter, every cell placed
 * by its two scores) adds it here, because it is the same cells again, laid
 * out by another rule.
 *
 * The two geometries are two different claims about a cell — the ground it
 * covers, or the people who live on it — so this is not a display preference
 * and the explanation travels with it. Where no cartogram is available the
 * option stays visible and disabled, saying so, rather than disappearing: an
 * absent view and an unbuilt one look identical otherwise.
 *
 * @param {'geographic'|'cartogram'|'scatter'} props.value
 * @param {(next: string) => void}   props.onChange
 * @param {{geographic: boolean, cartogram: boolean, scatter?: boolean}} props.available
 *        which geometries are published for what is on screen — never
 *        inferred, because an unpublished view and an unbuilt one are the
 *        same picture from the outside. With no `scatter` the layer has no
 *        third view, and none is offered.
 * @param {boolean} [props.derived]     the cartogram is the Atlas's own rule,
 *        a provenance that is said rather than glossed
 * @param {boolean} [props.loading]      the other geometry is in flight
 * @param {boolean} [props.compact]      floating on the map rather than in a
 *        panel: the two buttons on one line, the explanation on the "?"
 */
export function GeometryToggle({
  value,
  onChange,
  available,
  derived = false,
  loading = false,
  compact = false,
}) {
  const { t } = useI18n();

  const options = [
    { key: 'geographic', label: t('city.geometry.map'), enabled: available.geographic },
    { key: 'cartogram', label: t('city.geometry.cartogram'), enabled: available.cartogram },
  ];
  if (available.scatter != null) {
    options.push({ key: 'scatter', label: t('city.geometry.scatter'), enabled: available.scatter });
  }

  return (
    <div className={`aa-geometry${compact ? ' aa-geometry--compact' : ''}`}>
      <Explain label={compact ? undefined : t('city.geometry.label')}>
        {/* One explanation, of what the cartogram is for, whichever is on
            screen: the map needs none. The scatter, where offered, has its
            own line. */}
        <p>{t('city.geometry.about.cartogram')}</p>
        {available.scatter != null && <p>{t('city.geometry.about.scatter')}</p>}
      </Explain>
      <div className="aa-toggle aa-geometry__toggle" role="group" aria-label={t('city.geometry.label')}>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`aa-toggle__btn${value === option.key ? ' aa-toggle__btn--active' : ''}`}
            aria-pressed={value === option.key}
            disabled={!option.enabled}
            title={option.enabled ? undefined : t('city.geometry.unavailable')}
            onClick={() => onChange(option.key)}
          >
            {option.label}
            {!option.enabled && !compact && (
              <span className="aa-geometry__off">{t('city.geometry.unavailable')}</span>
            )}
          </button>
        ))}
      </div>
      {loading && <p className="aa-geometry__loading">{t('city.geometry.loading')}</p>}
    </div>
  );
}
