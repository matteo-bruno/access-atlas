import { Explain } from './Explain.jsx';
import { useI18n } from '../i18n/index.jsx';
import './GeometryToggle.css';

/**
 * Map ↔ cartogram: the switch both upstream viewers open with.
 *
 * The two geometries are two different claims about a cell — the ground it
 * covers, or the people who live on it — so this is not a display preference
 * and the explanation travels with it. Where a platform published no
 * cartogram the option stays visible and disabled, saying so, rather than
 * disappearing: an absent view and an unbuilt one look identical otherwise.
 *
 * @param {'geographic'|'cartogram'} props.value
 * @param {(next: string) => void}   props.onChange
 * @param {{geographic: boolean, cartogram: boolean}} props.available
 *        which geometries are published for what is on screen — never
 *        inferred, because an unpublished view and an unbuilt one are the
 *        same picture from the outside
 * @param {string}  [props.missingName]  who publishes no cartogram, for the copy
 * @param {boolean} [props.loading]      the other geometry is in flight
 */
export function GeometryToggle({
  value,
  onChange,
  available,
  missingName,
  loading = false,
}) {
  const { t } = useI18n();

  const options = [
    { key: 'geographic', label: t('city.geometry.map'), enabled: available.geographic },
    { key: 'cartogram', label: t('city.geometry.cartogram'), enabled: available.cartogram },
  ];

  return (
    <div className="aa-geometry">
      <Explain label={t('city.geometry.label')}>
        <p>{t(`city.geometry.about.${value === 'cartogram' ? 'cartogram' : 'map'}`)}</p>
        {!available.cartogram && missingName && (
          <p>{t('city.geometry.about.missing', { name: missingName })}</p>
        )}
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
            {!option.enabled && (
              <span className="aa-geometry__off">{t('city.geometry.unavailable')}</span>
            )}
          </button>
        ))}
      </div>
      {loading && <p className="aa-geometry__loading">{t('city.geometry.loading')}</p>}
    </div>
  );
}
