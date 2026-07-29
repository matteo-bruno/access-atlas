import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider } from './i18n/index.jsx';
import Home from './pages/Home.jsx';

// The map routes pull in MapLibre; splitting them keeps it off the FAQ and
// Contact pages entirely.
const PlatformLanding = lazy(() => import('./pages/PlatformLanding.jsx'));
const CityPage = lazy(() => import('./pages/CityPage.jsx'));
const FAQ = lazy(() => import('./pages/FAQ.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Research = lazy(() => import('./pages/Research.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

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
          <Route path="/platforms/:slug" element={<PlatformLanding />} />
          <Route path="/platforms/:slug/:cityId" element={<CityPage />} />
          <Route path="/research" element={<Research />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </I18nProvider>
  );
}
