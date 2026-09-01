import { Link, Navigate, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { useI18n } from '../i18n/index.jsx';
import { postBySlug } from '../data/blog.js';
import { formatDate } from './Blog.jsx';
import './Blog.css';

export default function BlogPost() {
  const { slug } = useParams();
  const post = postBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;
  return <PostScreen post={post} />;
}

function PostScreen({ post }) {
  const { t, n, lang } = useI18n();
  const copy = post[lang] ?? post.en;

  return (
    <div className="aa-page">

      <main className="aa-main" id="main">
        <article className="aa-shell aa-post">
          <Link className="aa-post__back" to="/blog">
            {t('blog.backToBlog')}
          </Link>

          <Eyebrow>{t('blog.eyebrow')}</Eyebrow>
          <h1 className="aa-post__headline">{copy.title}</h1>
          <p className="aa-post__lede">{copy.lede}</p>

          <div className="aa-post__meta aa-mono">
            <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
            <span aria-hidden="true">·</span>
            <span>{t('blog.readingTime', { count: n(post.readingTime) })}</span>
          </div>

          <div className="aa-post__body">
            {copy.body.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

function Block({ block }) {
  if (block.h2) return <h2 className="aa-post__h2">{block.h2}</h2>;
  if (block.note) return <p className="aa-post__note">{block.note}</p>;
  // Where a post hands the reader on: the platform it describes, the paper
  // behind it. Rendered as chips rather than inline links so they read as the
  // end of the article rather than an aside inside it.
  if (block.links) {
    return (
      <div className="aa-post__links">
        {block.links.map((link) => (
          <a
            key={link.url}
            className="aa-chip"
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {link.label}
          </a>
        ))}
      </div>
    );
  }
  if (block.ul) {
    return (
      <ul className="aa-post__list">
        {block.ul.map((item, index) => (
          <li key={index}>
            <Emphasis text={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="aa-post__p">
      <Emphasis text={block.p} />
    </p>
  );
}

// Article bodies use **bold** for the term a list item defines. Splitting on
// the delimiter keeps the copy readable in the data file without reaching for
// a Markdown dependency or dangerouslySetInnerHTML.
function Emphasis({ text }) {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>,
      )}
    </>
  );
}
