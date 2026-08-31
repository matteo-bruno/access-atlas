import { Modal } from './Modal.jsx';
import { RampLegend } from './RampLegend.jsx';
import { useI18n } from '../i18n/index.jsx';
import { paperForPlatform } from '../data/research.js';
import { PLATFORMS_BY_ID, ZONES } from '../data/platforms.js';

/**
 * The long form of a platform's explanation, opened from "about this layer".
 *
 * The tooltips beside the controls answer the question in front of the
 * reader; this answers the ones behind it — what the measure is, how its
 * colours are meant to be read, what the panel's figures are, and how the
 * numbers were produced. Every paragraph is the copy the tooltips use, so the
 * two can never say different things, and the colour key is the same
 * component the legend draws, so it cannot drift from the map either.
 *
 * @param {string} props.platformId
 * @param {string} props.name         the platform's display name
 * @param {object} [props.ramp]       the ramp on screen, for the colour key
 * @param {(v: number) => string} [props.tickFormat]
 * @param {() => void} props.onClose
 */
export function PlatformAbout({ platformId, name, ramp, tickFormat, onClose }) {
  const { t } = useI18n();
  const paper = paperForPlatform(platformId);
  const platform = PLATFORMS_BY_ID[platformId];
  const categorical = platformId === 'pov';

  return (
    <Modal title={t('city.explain.aboutTitle', { name })} onClose={onClose}>
      {/* What this platform is for, before what it measures: the theme is the
          reason the Atlas carries four of them rather than one. */}
      {platform && (
        <p className="aa-about__lede" style={{ borderColor: platform.accent }}>
          {t(`platform.${platformId}.label`)}
        </p>
      )}

      <h3>{t('city.explain.sections.measure')}</h3>
      <p>{t(`platform.${platformId}.intro`)}</p>

      <h3>{t('city.explain.sections.map')}</h3>
      <p>{t(`city.explain.map.${platformId}`)}</p>
      {/* The key, drawn by the same components the map's legend uses. */}
      {categorical ? (
        <ul className="aa-about__zones">
          {ZONES.map((zone) => (
            <li key={zone.id}>
              <span className="aa-swatch" style={{ background: zone.color }} />
              <strong>{t(`city.zones.${zone.key}.name`)}</strong>
              <span>{t(`city.zones.${zone.key}.desc`)}</span>
            </li>
          ))}
        </ul>
      ) : (
        ramp && (
          <RampLegend
            ramp={ramp}
            format={tickFormat}
            tailLabel={ramp.beyond ? `${ramp.beyond.value}+` : undefined}
          />
        )
      )}

      <h3>{t('city.explain.sections.geometry')}</h3>
      <p>{t('city.geometry.about.map')}</p>
      <p>{t('city.geometry.about.cartogram')}</p>

      <h3>{t('city.explain.sections.summary')}</h3>
      <p>{t(`city.explain.summary.${platformId}`)}</p>

      <h3>{t('city.explain.methodsTitle')}</h3>
      <p>{t(`city.explain.methods.${platformId}`)}</p>

      <h3>{t('city.explain.sections.source')}</h3>
      <p>
        {paper && (
          <>
            {t('city.explain.paperNote')}{' '}
            <a href={paper.url} target="_blank" rel="noreferrer noopener">
              {paper.title} ↗
            </a>
            <br />
          </>
        )}
        {platform?.url && (
          <a href={platform.url} target="_blank" rel="noreferrer noopener">
            {t('city.explain.platformSite', { name })} ↗
          </a>
        )}
      </p>
    </Modal>
  );
}
