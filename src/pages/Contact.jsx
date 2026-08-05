import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { useI18n } from '../i18n/index.jsx';
import { CONTACT, FORMER_MEMBERS, TEAM } from '../data/team.js';
import './Contact.css';

export default function Contact() {
  const { t } = useI18n();

  return (
    <div className="aa-page">
      <Nav active="contact" />

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
          <div className="aa-card aa-team">
            {TEAM.map((member) => (
              <div
                key={member.name ?? 'join'}
                className={`aa-team__row${member.isJoin ? ' aa-team__row--join' : ''}`}
              >
                <div className="aa-team__name">
                  {member.isJoin ? (
                    t('contact.joinName')
                  ) : member.email ? (
                    <a href={`mailto:${member.email}`}>{member.name}</a>
                  ) : (
                    member.name
                  )}
                </div>
                <div className="aa-team__role">{t(`contact.roles.${member.roleKey}`)}</div>
                {/* The join row points at the page that says what is actually
                    open, rather than a mailto for no vacancy. */}
                {member.isJoin && (
                  <Link className="aa-mono aa-team__link" to="/work-with-us">
                    {t('footer.workCta')}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="aa-contact__former">
            <Eyebrow>{t('contact.formerTitle')}</Eyebrow>
            <div className="aa-card aa-team aa-team--former">
              {FORMER_MEMBERS.map((member) => (
                <div key={member.name} className="aa-team__row">
                  <div className="aa-team__name">{member.name}</div>
                  <div className="aa-team__role">{t(`contact.roles.${member.roleKey}`)}</div>
                </div>
              ))}
            </div>
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
