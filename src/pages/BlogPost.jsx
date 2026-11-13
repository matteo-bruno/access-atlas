import { Link, Navigate, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { useI18n } from '../i18n/index.jsx';
import { postBySlug } from '../data/blog.js';
import { parseInline } from '../data/blogMarkdown.js';
import { formatDate, postCopy } from './Blog.jsx';
import './Blog.css';

const BASE = import.meta.env?.BASE_URL ?? '/';

// A post's images are under public/blog-images/ unless they name a URL.
const imageUrl = (src) => (/^(https?:)?\/\//.test(src) || src.startsWith('/') ? src : `${BASE}blog-images/${src}`);

export default function BlogPost() {
  const { slug } = useParams();
  const post = postBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;
  return <PostScreen post={post} />;
}

function PostScreen({ post }) {
  const { t, n, lang } = useI18n();
  const { copy, attrs } = postCopy(post, lang);

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <article className="aa-shell aa-post">
          <Link className="aa-post__back" to="/blog">
            {t('blog.backToBlog')}
          </Link>

          <Eyebrow>
            {copy.kicker ? (
              <span {...attrs}>
                <span className="aa-dot aa-post__kickerdot" style={{ background: post.accent }} />
                {copy.kicker}
              </span>
            ) : (
              t('blog.eyebrow')
            )}
          </Eyebrow>
          <h1 className="aa-post__headline" {...attrs}>
            {copy.title}
            {copy.titleAccent && (
              <>
                {' '}
                <span className="aa-accent">{copy.titleAccent}</span>
              </>
            )}
          </h1>
          <p className="aa-post__lede" {...attrs}>
            {copy.lede}
          </p>

          <div className="aa-post__meta aa-mono">
            <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
            <span aria-hidden="true">·</span>
            <span>{t('blog.readingTime', { count: n(post.readingTime) })}</span>
          </div>

          <div className="aa-post__body" {...attrs}>
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
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="aa-post__h2">
          <Inline text={block.text} />
        </h2>
      );
    case 'h3':
      return (
        <h3 className="aa-post__h3">
          <Inline text={block.text} />
        </h3>
      );
    case 'quote':
      return (
        <blockquote className="aa-post__pull">
          <Inline text={block.text} />
        </blockquote>
      );
    case 'hr':
      return <hr className="aa-post__hr" />;
    case 'ul':
    case 'ol': {
      const List = block.type;
      return (
        <List className="aa-post__list">
          {block.items.map((item, index) => (
            <li key={index}>
              <Inline text={item} />
            </li>
          ))}
        </List>
      );
    }
    case 'image':
      return (
        <figure className={`aa-post__figure${block.wide ? ' aa-post__figure--wide' : ''}`}>
          <img src={imageUrl(block.src)} alt={block.alt} loading="lazy" />
          {block.caption && (
            <figcaption>
              <Inline text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    case 'table':
      return (
        <div className="aa-post__tablewrap">
          <table className="aa-post__table">
            <thead>
              <tr>
                {block.head.map((cell, index) => (
                  <th key={index} style={{ textAlign: block.align[index] }}>
                    <Inline text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, index) => (
                    <td key={index} style={{ textAlign: block.align[index] }}>
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return (
        <p className="aa-post__p">
          <Inline text={block.text} />
        </p>
      );
  }
}

// Inline marks as React elements, not HTML: **bold**, *italic*, `code`, and
// links, a path into the site or a URL opened in a new tab.
function Inline({ text }) {
  return (
    <>
      {parseInline(text).map((token, index) => {
        if (token.bold != null) return <strong key={index}>{token.bold}</strong>;
        if (token.italic != null) return <em key={index}>{token.italic}</em>;
        if (token.code != null) return <code key={index}>{token.code}</code>;
        if (token.link != null) {
          return token.href.startsWith('/') ? (
            <Link key={index} to={token.href}>
              {token.link}
            </Link>
          ) : (
            <a key={index} href={token.href} target="_blank" rel="noreferrer noopener">
              {token.link}
            </a>
          );
        }
        return <span key={index}>{token.text}</span>;
      })}
    </>
  );
}
