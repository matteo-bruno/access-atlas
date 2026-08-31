import {
  Suspense,
  lazy,
  startTransition,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { platformBySlug } from './data/platforms.js';
import { I18nProvider } from './i18n/index.jsx';
import { Nav } from './components/Nav.jsx';
import { Backdrop } from './components/Backdrop.jsx';
import AtlasHome from './pages/AtlasHome.jsx';

// The map routes pull in MapLibre; splitting them keeps it off the FAQ and
// Contact pages entirely.
const PlatformLanding = lazy(() => import('./pages/PlatformLanding.jsx'));
const ComparePage = lazy(() => import('./pages/ComparePage.jsx'));
// The previous home page. Kept routed rather than deleted: the landing above
// replaces it at "/", and this is what to fall back to if that is a mistake.
const Home = lazy(() => import('./pages/Home.jsx'));
const AtlasCityPage = lazy(() => import('./pages/AtlasCityPage.jsx'));
const FAQ = lazy(() => import('./pages/FAQ.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Research = lazy(() => import('./pages/Research.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'));
const Work = lazy(() => import('./pages/Work.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

/** An old per-platform city URL → the combined viewer on that layer. */
function CityRedirect() {
  const { slug, cityId } = useParams();
  const platform = platformBySlug(slug);
  return <Navigate to={`/atlas/${cityId}${platform ? `?layer=${platform.id}` : ''}`} replace />;
}

// Long enough to register as a fade, short enough to stay out of the way.
// Matched to the transition on .aa-fade in global.css.
const FADE_MS = 170;

/**
 * Cross-fades between routes, both ways.
 *
 * Every screen here is a map or a page of copy, and cutting between them is
 * abrupt in a way neither deserves. Three things make the fade actually run:
 *
 * It keeps rendering the *old* location until the fade out finishes —
 * swapping first would reveal the new page at full opacity behind the one
 * that is still fading.
 *
 * The swap is a transition, and Suspense lives *inside* the faded element.
 * Pages are loaded lazily; with the boundary outside, a route whose chunk had
 * not arrived replaced the whole faded element with the fallback, taking the
 * fade with it — which is why new content used to appear as a cut. Inside,
 * and inside a transition, React holds the old screen until the new one can
 * be shown, and it then fades in from the opacity it was left at.
 *
 * Only the path is compared. The city view keeps its layer, hour and
 * selection in the query string, and fading the map every time someone
 * changes a dropdown would be worse than not fading at all.
 */
function FadingRoutes({ children }) {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const [visible, setVisible] = useState(true);
  const [pending] = useTransition();

  useEffect(() => {
    if (location.pathname === shown.pathname) {
      // Same screen, new query: swap without a fade.
      if (location !== shown) setShown(location);
      return undefined;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(location);
      return undefined;
    }
    setVisible(false);
    const timer = window.setTimeout(() => {
      startTransition(() => setShown(location));
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [location, shown]);

  // Fade back in only once the screen being faded in is the one asked for and
  // has finished arriving; otherwise the fade would run over the old content,
  // or over a fallback.
  useEffect(() => {
    if (shown === location && !pending) setVisible(true);
  }, [shown, location, pending]);

  return (
    <div className={`aa-fade${visible ? '' : ' aa-fade--out'}`}>
      <Suspense fallback={<div className="aa-page" />}>
        <Routes location={shown}>{children}</Routes>
      </Suspense>
    </div>
  );
}

// Which tab is lit, from the path alone. The city view and the comparison
// live under the platform tab: they are that tab's screens.
const TABS = [
  ['/platforms', 'platforms'],
  ['/atlas', 'platforms'],
  ['/research', 'research'],
  ['/blog', 'blog'],
  ['/work-with-us', 'work'],
  ['/faq', 'faq'],
  ['/contact', 'contact'],
];

function activeTab(pathname) {
  return TABS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'atlas';
}

/**
 * The chrome that does not belong to any one screen.
 *
 * The nav sits *outside* the fading region, so navigating never rebuilds it:
 * the bar stays exactly where it is while the page under it cross-fades, and
 * only the lit tab changes. It also publishes its own height as `--nav-h`,
 * because the full-height screens size themselves against the viewport minus
 * this bar, and measuring beats hard-coding a number that changes whenever
 * the bar wraps.
 */
function Chrome() {
  const { pathname } = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const publish = () => {
      document.documentElement.style.setProperty(
        '--nav-h',
        `${Math.round(node.getBoundingClientRect().height)}px`,
      );
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="aa-chrome" ref={ref}>
      <Nav active={activeTab(pathname)} />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <I18nProvider>
      <ScrollToTop />
      <Backdrop />
      <Chrome />
      <FadingRoutes>
          <Route path="/" element={<AtlasHome />} />
          <Route path="/overview" element={<Home />} />
          {/* Without a slug: every published city across the four platforms. */}
          <Route path="/platforms" element={<PlatformLanding />} />
          <Route path="/platforms/:slug" element={<PlatformLanding />} />
          {/* Declared before the city route for readability; React Router
              ranks the static segment above the dynamic one either way. */}
          <Route path="/platforms/:slug/compare" element={<ComparePage />} />
          {/* There is one city view, and it is the combined one. This route
              existed when each platform had its own; links to it are still in
              the wild, so it forwards rather than 404s. */}
          <Route path="/platforms/:slug/:cityId" element={<CityRedirect />} />
          {/* The combined viewer: one city, all four visualisations. Layer
              and options ride the query string so any view is linkable. */}
          <Route path="/atlas/:cityId" element={<AtlasCityPage />} />
          <Route path="/research" element={<Research />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/work-with-us" element={<Work />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
      </FadingRoutes>
    </I18nProvider>
  );
}
