import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { useI18n } from '../i18n/index.jsx';
import { localeFor } from '../i18n/locales.js';
import { POSTS } from '../data/blog.js';
import './Blog.css';

export default function Blog() {
  const { t, n, lang } = useI18n();
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

  // Laid out as the Research page is: the title on one line, then the posts
  // as cards, each card the link.
  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-blog__intro">
          <h1 className="aa-blog__headline">
            {t('blog.headline')} <span className="aa-accent">{t('blog.headlineAccent')}</span>
          </h1>
          <p className="aa-blog__lede">{t('blog.lede')}</p>
        </section>

        <section className="aa-shell aa-block">
          <div className="aa-blog__list">
            {posts.map((post) => {
              const { copy, attrs } = postCopy(post, lang);
              return (
                <Link key={post.slug} className="aa-card aa-lift aa-postcard" to={`/blog/${post.slug}`}>
                  <div className="aa-postcard__kicker">
                    <span className="aa-dot aa-dot--sm" style={{ background: post.accent }} />
                    <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{t('blog.readingTime', { count: n(post.readingTime) })}</span>
                  </div>
                  <h2 className="aa-postcard__title" {...attrs}>
                    {postTitle(copy)}
                  </h2>
                  <p className="aa-postcard__lede" {...attrs}>
                    {copy.lede}
                  </p>
                  <div className="aa-postcard__more">{t('platform.learnMore')}</div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// A post in the reader's language, or the English one marked as English: in
// Arabic an English paragraph left in the page's right-to-left direction
// moves its full stop to the wrong end, and a screen reader reads it with the
// wrong voice.
export function postCopy(post, lang) {
  const own = post[lang];
  return { copy: own ?? post.en, attrs: own || lang === 'en' ? {} : { lang: 'en', dir: 'ltr' } };
}

// A post's title in one line: the run-up and the coloured half together.
export function postTitle(copy) {
  return copy.titleAccent ? `${copy.title} ${copy.titleAccent}` : copy.title;
}

export function formatDate(iso, lang) {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
