import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { useI18n } from '../i18n/index.jsx';
import { postBySlug } from '../data/blog.js';
import { formatDate, postCopy } from './Blog.jsx';
import './Blog.css';

const BASE = import.meta.env?.BASE_URL ?? '/';
const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';
const FIGURES_URL = `${BASE}blog-figures/figures.json?v=${BUILD_ID}`;

// The figures file is shared by every post and cannot change within a
// session, so it is fetched once. A failed fetch clears the memo, so the
// next post opened tries again (the catalogue's rule, CLAUDE.md).
let figuresPromise = null;
function loadFigures() {
  if (!figuresPromise) {
    figuresPromise = fetch(FIGURES_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`figures: HTTP ${response.status}`);
        return response.json();
      })
      .then((doc) => {
        // The SPA fallback answers a missing file with index.html and a 200.
        if (doc?.format !== 'atlas-blog-figures') throw new Error('figures: not the figures file');
        return doc;
      })
      .catch((error) => {
        figuresPromise = null;
        throw error;
      });
  }
  return figuresPromise;
}

function useFigures() {
  const [state, setState] = useState({ doc: null, failed: false });
  useEffect(() => {
    let alive = true;
    loadFigures().then(
      (doc) => alive && setState({ doc, failed: false }),
      () => alive && setState({ doc: null, failed: true }),
    );
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = postBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;
  return <PostScreen post={post} />;
}

function PostScreen({ post }) {
  const { t, n, lang } = useI18n();
  const { copy, attrs } = postCopy(post, lang);
  const { doc, failed } = useFigures();
  // `{key}` in the copy is a value from the figures file.
  const fill = (text) =>
    String(text ?? '').replace(/\{([\w.-]+)\}/g, (_, key) => doc?.values?.[key] ?? '…');

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
            {failed && <p className="aa-post__note">{t('blog.figuresFailed')}</p>}
            {copy.body.map((block, index) => (
              <Block key={index} block={block} fill={fill} figures={doc?.figures} />
            ))}
            {doc?.generatedAt && (
              <p className="aa-post__source">
                {t('blog.figuresAsOf', { date: formatDate(doc.generatedAt, lang) })}
              </p>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

function Block({ block, fill, figures }) {
  if (block.h2) {
    return (
      <h2 className="aa-post__h2">
        {block.badge && <span className="aa-post__badge">{block.badge}</span>}
        {fill(block.h2)}
      </h2>
    );
  }
  if (block.note) return <p className="aa-post__note">{fill(block.note)}</p>;
  if (block.pull) return <blockquote className="aa-post__pull">{fill(block.pull)}</blockquote>;
  if (block.formula) return <p className="aa-post__formula">{block.formula}</p>;
  if (block.facts) {
    return (
      <div className="aa-post__facts">
        {block.facts.map((fact, index) => (
          <div key={index} className="aa-post__fact">
            <b className="aa-mono">{fill(fact.value)}</b>
            <span>{fill(fact.text)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (block.figure) return <Figure block={block} fill={fill} figures={figures} />;
  // Where a post hands the reader on: a page of the Atlas, or the paper
  // behind the layer. Rendered as chips rather than inline links so they
  // read as the end of the article rather than an aside inside it.
  if (block.links) {
    return (
      <div className="aa-post__links">
        {block.links.map((link) =>
          link.to ? (
            <Link key={link.to} className="aa-chip aa-chip--solid" to={link.to}>
              {link.label}
            </Link>
          ) : (
            <a key={link.url} className="aa-chip" href={link.url} target="_blank" rel="noreferrer noopener">
              {link.label}
            </a>
          ),
        )}
      </div>
    );
  }
  if (block.ul) {
    return (
      <ul className="aa-post__list">
        {block.ul.map((item, index) => (
          <li key={index}>
            <Rich text={fill(item)} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="aa-post__p">
      <Rich text={fill(block.p)} />
    </p>
  );
}

// A map or a chart, drawn by scripts/build-blog.mjs from the published data
// and committed beside it; the post names it and gives it a title and a
// caption. The figure's HTML is the script's own output, not a reader's.
function Figure({ block, fill, figures }) {
  const html = figures?.[block.figure];
  const classes = ['aa-bfig'];
  if (block.wide) classes.push('aa-bfig--wide');
  if (block.bare) classes.push('aa-bfig--bare');
  return (
    <figure className={classes.join(' ')}>
      {block.title && (
        <p className="aa-bfig__title">
          {block.badge && <span className="aa-post__badge">{block.badge}</span>}
          {fill(block.title)}
        </p>
      )}
      {block.sub && <p className="aa-bfig__sub">{fill(block.sub)}</p>}
      {html ? (
        <div className="aa-bfig__body" dangerouslySetInnerHTML={{ __html: html.replaceAll('{base}', BASE) }} />
      ) : (
        <div className="aa-bfig__body aa-bfig__body--pending" aria-hidden="true" />
      )}
      {block.caption && (
        <figcaption>
          <Rich text={fill(block.caption)} />
        </figcaption>
      )}
    </figure>
  );
}

// Article copy uses **bold** for a term it defines and [text](/path) for a
// link into the Atlas. Parsed here rather than with a Markdown dependency or
// dangerouslySetInnerHTML.
function Rich({ text }) {
  const parts = String(text).split(/(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, index) => {
        const bold = part.match(/^\*\*(.+)\*\*$/);
        if (bold) return <strong key={index}>{bold[1]}</strong>;
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return link[2].startsWith('/') ? (
            <Link key={index} to={link[2]}>
              {link[1]}
            </Link>
          ) : (
            <a key={index} href={link[2]} target="_blank" rel="noreferrer noopener">
              {link[1]}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
