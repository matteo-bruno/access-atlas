import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { Interpolate } from '../components/Interpolate.jsx';
import { useI18n } from '../i18n/index.jsx';
import { LAB } from '../data/lab.js';
import { Logo } from '../components/Logo.jsx';
import './Prose.css';

// What the group does, as three corners of one triangle: the research, the
// platforms that replicate it on many cities, and the use cases built for a
// city from those platforms, which raise the next questions for research.
const WHAT_WE_DO = ['research', 'platform', 'useCase'];

// The triangle, in its own viewBox: the three corners, top, bottom left and
// bottom right, and how far an edge stops short of a corner's disc.
const CORNERS = { research: [180, 40], platform: [40, 282], useCase: [320, 282] };
const DISC = 27;
const GAP = DISC + 8;

// One edge, from corner `a` to corner `b`, stopping short of both discs.
function edgePath(a, b) {
  const [x1, y1] = CORNERS[a];
  const [x2, y2] = CORNERS[b];
  const length = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / length;
  const uy = (y2 - y1) / length;
  return `M${x1 + ux * GAP},${y1 + uy * GAP} L${x2 - ux * GAP},${y2 - uy * GAP}`;
}

/**
 * The triangle itself: a soft face, the three corners as numbered discs in
 * the brand's colours, and its edges as arrows that go round, research to
 * platform to use case and back, each named. The city sits in the middle.
 */
function Triangle() {
  const { t } = useI18n();
  const edges = [
    { from: 'research', to: 'platform', label: t('about.do.cycle.replicate'), at: [86, 158], anchor: 'end' },
    { from: 'platform', to: 'useCase', label: t('about.do.cycle.refine'), at: [180, 314], anchor: 'middle' },
    { from: 'useCase', to: 'research', label: t('about.do.cycle.questions'), at: [274, 158], anchor: 'start' },
  ];
  return (
    <svg className="aa-mission__svg" viewBox="0 0 360 330" role="img" aria-label={t('about.doTitle')}>
      <defs>
        <linearGradient id="aa-mission-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--magenta)" stopOpacity="0.10" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.10" />
        </linearGradient>
        <marker id="aa-mission-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" fill="var(--ink-3)" />
        </marker>
      </defs>
      {/* The card's paper under the tint, so the backdrop's map does not
          show through the face. */}
      <polygon points={Object.values(CORNERS).map((p) => p.join(',')).join(' ')} fill="var(--card)" />
      <polygon
        className="aa-mission__face"
        points={Object.values(CORNERS).map((p) => p.join(',')).join(' ')}
        fill="url(#aa-mission-face)"
      />
      {edges.map((edge) => (
        <g key={edge.from}>
          <path className="aa-mission__edge" d={edgePath(edge.from, edge.to)} markerEnd="url(#aa-mission-arrow)" />
          <text className="aa-mission__edgelabel" x={edge.at[0]} y={edge.at[1]} textAnchor={edge.anchor}>
            {edge.label}
          </text>
        </g>
      ))}
      <text className="aa-mission__centre" x="180" y="214" textAnchor="middle">
        {t('about.do.cycle.centre')}
      </text>
      {WHAT_WE_DO.map((key, index) => (
        <g key={key} className={`aa-mission__corner aa-mission__corner--${key}`}>
          <circle cx={CORNERS[key][0]} cy={CORNERS[key][1]} r={DISC} />
          <text x={CORNERS[key][0]} y={CORNERS[key][1]} textAnchor="middle" dominantBaseline="central">
            {String(index + 1).padStart(2, '0')}
          </text>
        </g>
      ))}
    </svg>
  );
}

// The topics the group works on. Labels only, not links.
const TOPICS = ['accessibility', 'justice', 'sustainability', 'green', 'walkability', 'bikeability'];

/**
 * Who we are: the page every other page assumes.
 *
 * The Atlas is one output of a research line, not a product from a company,
 * and nothing else on the site says so plainly. This does, then says what the
 * group does and which topics it works on.
 */
export default function SustainableCities() {
  const { t } = useI18n();

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-prose__intro aa-prose__intro--split">
          <div>
            <h1 className="aa-prose__headline">
              {t('about.headline')}
              <br />
              <span className="aa-accent">{t('about.headlineAccent')}</span>
            </h1>
            <p className="aa-prose__lede">{t('about.lede')}</p>
          </div>

          <div className="aa-prose__links aa-prose__links--side">
            <a className="aa-prose__sidelink" href={LAB.url} target="_blank" rel="noreferrer noopener">
              <Logo variant="symbol" tone="color" height={16} alt="" />
              {t('about.labLink')}
            </a>
            <Link className="aa-prose__sidelink" to="/contact">
              {t('about.teamLink')}
            </Link>
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('about.doTitle')} />
          {/* The triangle in the middle, each corner's text beside it:
              research above, the platform to the left, the use case to the
              right. */}
          <div className="aa-mission">
            <div className="aa-mission__figure">
              <Triangle />
            </div>
            {WHAT_WE_DO.map((key, index) => (
              <article key={key} className={`aa-mission__step aa-mission__step--${key}`}>
                <span className="aa-mission__num aa-mono">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="aa-mission__title">{t(`about.do.${key}.title`)}</h3>
                <p className="aa-mission__desc">
                  {t(`about.do.${key}.desc`)}
                  {key === 'useCase' && (
                    <>
                      {' '}
                      <Link className="aa-prose__link" to="/consulting">
                        {t('about.do.useCase.cta')}
                      </Link>
                    </>
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="aa-shell aa-block">
          <SectionHeading title={t('about.topicsTitle')} />
          <ul className="aa-prose__topics">
            {TOPICS.map((key) => (
              <li key={key} className="aa-prose__topic">
                {t(`about.topics.${key}`)}
              </li>
            ))}
          </ul>
          <p className="aa-prose__p aa-prose__topicsnote">
            <Interpolate
              template={t('about.topicsNote')}
              values={{
                research: (
                  <Link className="aa-prose__link" to="/research">
                    {t('about.topicsResearch')}
                  </Link>
                ),
                contact: (
                  <Link className="aa-prose__link" to="/contact">
                    {t('about.topicsContact')}
                  </Link>
                ),
              }}
            />
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
