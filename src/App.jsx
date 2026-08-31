import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { platformBySlug } from './data/platforms.js';
import { I18nProvider } from './i18n/index.jsx';
import Home from './pages/Home.jsx';

// The map routes pull in MapLibre; splitting them keeps it off the FAQ and
// Contact pages entirely.
const PlatformLanding = lazy(() => import('./pages/PlatformLanding.jsx'));
const ComparePage = lazy(() => import('./pages/ComparePage.jsx'));
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
        <Routes>
          <Route path="/" element={<Home />} />
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
        </Routes>
      </Suspense>
    </I18nProvider>
  );
}
