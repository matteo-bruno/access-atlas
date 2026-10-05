import { Fragment } from 'react';
import { isRtl, useI18n } from '../i18n/index.jsx';

/**
 * Renders a translated template with React nodes substituted for {placeholders}:
 *
 *   <Interpolate
 *     template={t('home.hero.lede')}
 *     values={{ proximity: <strong>{t('home.hero.ledeProximity')}</strong> }}
 *   />
 *
 * Keeps sentence structure inside the dictionaries, where translators can move
 * the emphasised words around freely. In a right-to-left language each value
 * is a <bdi>, for the reason t() isolates its values (see i18n/index.jsx).
 */
export function Interpolate({ template, values }) {
  const { lang } = useI18n();
  if (typeof template !== 'string') return null;
  const Value = isRtl(lang) ? 'bdi' : Fragment;

  const keys = Object.keys(values ?? {});
  if (!keys.length) return template;

  const pattern = new RegExp(`\\{(${keys.join('|')})\\}`, 'g');
  const parts = template.split(pattern);

  return parts.map((part, index) =>
    // split() with one capture group alternates: text, key, text, key, …
    index % 2 === 1 ? (
      <Value key={index}>{values[part]}</Value>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
