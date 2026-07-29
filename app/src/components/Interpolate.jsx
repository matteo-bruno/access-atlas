import { Fragment } from 'react';

/**
 * Renders a translated template with React nodes substituted for {placeholders}:
 *
 *   <Interpolate
 *     template={t('home.hero.lede')}
 *     values={{ proximity: <strong>{t('home.hero.ledeProximity')}</strong> }}
 *   />
 *
 * Keeps sentence structure inside the dictionaries, where translators can move
 * the emphasised words around freely.
 */
export function Interpolate({ template, values }) {
  if (typeof template !== 'string') return null;

  const keys = Object.keys(values ?? {});
  if (!keys.length) return template;

  const pattern = new RegExp(`\\{(${keys.join('|')})\\}`, 'g');
  const parts = template.split(pattern);

  return parts.map((part, index) =>
    // split() with one capture group alternates: text, key, text, key, …
    index % 2 === 1 ? (
      <Fragment key={index}>{values[part]}</Fragment>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
