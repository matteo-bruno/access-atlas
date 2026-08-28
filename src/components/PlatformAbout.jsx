import { Modal } from './Modal.jsx';
import { useI18n } from '../i18n/index.jsx';
import { paperForPlatform } from '../data/research.js';

/**
 * The long form of a platform's explanation: what it measures, how to read
 * the map and the plot, what the summary figures are, and the method behind
 * them — the four "about" sections both upstream viewers keep in a modal.
 *
 * Every paragraph is the same copy the short explanations use, so the panel
 * and the dialog can never say different things.
 *
 * @param {string} props.platformId
 * @param {string} props.name        the platform's display name
 * @param {() => void} props.onClose
 */
export function PlatformAbout({ platformId, name, onClose }) {
  const { t } = useI18n();
  const paper = paperForPlatform(platformId);
  // Only two platforms plot their cells against each other; the other two
  // measure one thing per cell, so there is no scatter to explain.
  const hasScatter = platformId === 'pov' || platformId === 'cardep';

  return (
    <Modal title={t('city.explain.aboutTitle', { name })} onClose={onClose}>
      <h3>{t('city.explain.sections.measure')}</h3>
      <p>{t(`platform.${platformId}.intro`)}</p>

      <h3>{t('city.explain.sections.map')}</h3>
      <p>{t(`city.explain.map.${platformId}`)}</p>

      {hasScatter && (
        <>
          <h3>{t('city.explain.sections.scatter')}</h3>
          <p>{t(`city.explain.scatter.${platformId}`)}</p>
          <p>{t('city.explain.scatter.sampled')}</p>
        </>
      )}

      <h3>{t('city.explain.sections.geometry')}</h3>
      <p>{t('city.geometry.about.map')}</p>
      <p>{t('city.geometry.about.cartogram')}</p>

      <h3>{t('city.explain.sections.summary')}</h3>
      <p>{t(`city.explain.summary.${platformId}`)}</p>

      <h3>{t('city.explain.methodsTitle')}</h3>
      <p>{t(`city.explain.methods.${platformId}`)}</p>
      {paper && (
        <p>
          {t('city.explain.paperNote')}{' '}
          <a href={paper.url} target="_blank" rel="noreferrer noopener">
            {paper.title} ↗
          </a>
        </p>
      )}
    </Modal>
  );
}
