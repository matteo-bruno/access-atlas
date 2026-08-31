import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { platformBySlug } from './data/platforms.js';
import { I18nProvider } from './i18n/index.jsx';
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
 * Cross-fades between routes.
 *
 * Every screen here is a map or a page of copy, and cutting between them is
 * abrupt in a way neither deserves. The trick is to keep rendering the *old*
 * location while the fade runs, then swap and fade back in — otherwise the
 * new page appears at full opacity behind the fading one.
 *
 * Only the path is compared. The city view keeps its layer, hour and
 * selection in the query string, and fading the map every time someone
 * changes a dropdown would be worse than not fading at all.
 */
function FadingRoutes({ children }) {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const [visible, setVisible] = useState(true);

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
      setShown(location);
      setVisible(true);
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [location, shown]);

  return (
    <div className={`aa-fade${visible ? '' : ' aa-fade--out'}`}>
      <Routes location={shown}>{children}</Routes>
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
      <Suspense fallback={<div className="aa-page" />}>
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
      </Suspense>
    </I18nProvider>
  );
}
