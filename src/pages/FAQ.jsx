import { useState } from 'react';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { useI18n } from '../i18n/index.jsx';
import { CONTACT } from '../data/team.js';
import './FAQ.css';

// The design opens entries 1 and 3 by default.
const INITIALLY_OPEN = [0, 2];

export default function FAQ() {
  const { t, n } = useI18n();
  const items = t('faq.items');
  const [open, setOpen] = useState(() => new Set(INITIALLY_OPEN));

  const toggle = (index) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <div className="aa-page">

      <main className="aa-main aa-faq" id="main">
        <div className="aa-faq__aside">
          <Eyebrow>{t('faq.eyebrow')}</Eyebrow>
          <h1 className="aa-faq__headline">{t('faq.headline')}</h1>
          <p className="aa-faq__lede">
            <Interpolate
              template={t('faq.lede')}
              values={{
                email: (
                  <a className="aa-faq__email" href={`mailto:${CONTACT.general}`}>
                    {CONTACT.general}
                  </a>
                ),
              }}
            />
          </p>
          <dl className="aa-faq__meta">
            <MetaRow label={t('faq.meta.updated')} value={t('faq.meta.updatedValue')} />
            <MetaRow label={t('faq.meta.entries')} value={n(items.length)} />
            <MetaRow label={t('faq.meta.languages')} value={t('faq.meta.languagesValue')} />
          </dl>
        </div>

        <div className="aa-faq__list">
          {items.map((item, index) => {
            const isOpen = open.has(index);
            return (
              <div key={item.q} className="aa-faq__entry">
                <button
                  type="button"
                  className="aa-faq__question"
                  aria-expanded={isOpen}
                  onClick={() => toggle(index)}
                >
                  <span className="aa-faq__qtext">
                    <span className="aa-mono aa-faq__index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="aa-faq__q">{item.q}</span>
                  </span>
                  <Icon name={isOpen ? 'minus' : 'plus'} size={15} color="var(--ink-3)" />
                </button>
                {isOpen && <p className="aa-faq__answer">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="aa-faq__metarow">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
