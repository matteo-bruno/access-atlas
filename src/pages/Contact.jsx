import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { useI18n } from '../i18n/index.jsx';
import { CONTACT, FORMER_MEMBERS, TEAM } from '../data/team.js';
import './Contact.css';

export default function Contact() {
  const { t } = useI18n();

  return (
    <div className="aa-page">

      <main className="aa-main aa-contact" id="main">
        <section className="aa-contact__intro">
          <Eyebrow>{t('contact.eyebrow')}</Eyebrow>
          <h1 className="aa-contact__headline">
            {t('contact.headline')}
            <br />
            <span className="aa-contact__accent">{t('contact.headlineAccent')}</span>
          </h1>
          <p className="aa-contact__lede">{t('contact.lede')}</p>

          <div className="aa-card aa-contact__details">
            <dl className="aa-details">
              <DetailRow label={t('contact.fields.address')}>
                <span className="aa-details__address">{t('contact.addressValue')}</span>
              </DetailRow>
              <DetailRow label={t('contact.fields.general')} strong>
                <a href={`mailto:${CONTACT.general}`}>{CONTACT.general}</a>
              </DetailRow>
              <DetailRow label={t('contact.fields.code')} strong>
                <a href={CONTACT.codeUrl} target="_blank" rel="noreferrer noopener">
                  {CONTACT.code}
                </a>
              </DetailRow>
              <DetailRow label={t('contact.fields.phone')} strong>
                <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
              </DetailRow>
            </dl>
          </div>
        </section>

        <section className="aa-contact__team">
          <Eyebrow>{t('contact.teamTitle')}</Eyebrow>
          {/* A list of people, not a table of rows in boxes: the name leads
              and the role sits under it, so the eye runs down the names. */}
          <ul className="aa-team">
            {TEAM.map((member) => (
              <li
                key={member.name ?? 'join'}
                className={`aa-team__item${member.isJoin ? ' aa-team__item--join' : ''}`}
              >
                <div className="aa-team__name">
                  {member.isJoin ? (
                    <Link to="/work-with-us">{t('contact.joinName')}</Link>
                  ) : member.email ? (
                    <a href={`mailto:${member.email}`}>{member.name}</a>
                  ) : (
                    member.name
                  )}
                </div>
                <div className="aa-team__role">
                  {member.isJoin ? t('footer.workCta') : t(`contact.roles.${member.roleKey}`)}
                </div>
              </li>
            ))}
          </ul>

          <div className="aa-contact__former">
            <Eyebrow>{t('contact.formerTitle')}</Eyebrow>
            <ul className="aa-team aa-team--former">
              {FORMER_MEMBERS.map((member) => (
                <li key={member.name} className="aa-team__item">
                  <div className="aa-team__name">{member.name}</div>
                  <div className="aa-team__role">{t(`contact.roles.${member.roleKey}`)}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function DetailRow({ label, children, strong = false }) {
  return (
    <>
      <dt className="aa-details__label">{label}</dt>
      <dd className={`aa-details__value${strong ? ' aa-details__value--strong' : ''}`}>{children}</dd>
    </>
  );
}
