import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { Icon } from '../components/Icon.jsx';
import { useI18n } from '../i18n/index.jsx';
import { POSTS } from '../data/blog.js';
import './Blog.css';

export default function Blog() {
  const { t, n, lang } = useI18n();
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="aa-page">
      <Nav active="blog" />

      <main className="aa-main aa-blog" id="main">
        <div className="aa-blog__aside">
          <Eyebrow>{t('blog.eyebrow')}</Eyebrow>
          <h1 className="aa-blog__headline">{t('blog.headline')}</h1>
          <p className="aa-blog__lede">{t('blog.lede')}</p>
          <dl className="aa-blog__meta">
            <div className="aa-blog__metarow">
              <dt>{t('blog.postsLabel')}</dt>
              <dd className="aa-mono">{n(posts.length)}</dd>
            </div>
          </dl>
        </div>

        <div className="aa-blog__list">
          {posts.map((post) => {
            const copy = post[lang] ?? post.en;
            return (
              <article key={post.slug} className="aa-card aa-lift aa-postcard">
                <div className="aa-postcard__kicker">
                  <span className="aa-dot" style={{ background: post.accent }} />
                  <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{t('blog.readingTime', { count: n(post.readingTime) })}</span>
                </div>
                <h2 className="aa-postcard__title">
                  <Link to={`/blog/${post.slug}`}>{copy.title}</Link>
                </h2>
                <p className="aa-postcard__lede">{copy.lede}</p>
                <Link className="aa-postcard__more" to={`/blog/${post.slug}`}>
                  {t('platform.learnMore')}
                  <Icon name="arrow" size={13} color="var(--ink-3)" />
                </Link>
              </article>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function formatDate(iso, lang) {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
