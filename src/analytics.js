// Visit statistics, through a Matomo the lab hosts itself.
//
// Off unless the build names a Matomo (VITE_MATOMO_URL and
// VITE_MATOMO_SITE_ID), so `npm run dev`, CI and the browser suites load
// nothing from another host, like the basemap with VITE_BASEMAP_STYLE=none.
//
// Matomo is told to set no cookies, which is what lets the site go without a
// consent banner. A page view is counted per path, not per address: the city
// view keeps its layer, hour and selected cell in the query string, and every
// dropdown would otherwise count as a page. The query is left out of the URL
// sent, for the same reason.

const base = import.meta.env.VITE_MATOMO_URL;
const siteId = import.meta.env.VITE_MATOMO_SITE_ID;

export const analyticsEnabled = Boolean(base && siteId);

let started = false;
let lastPath = null;
let lastUrl = null;

function start() {
  if (started) return;
  started = true;
  const root = base.replace(/\/?$/, '/');
  const queue = (window._paq = window._paq || []);
  queue.push(['disableCookies']);
  queue.push(['enableLinkTracking']);
  queue.push(['setTrackerUrl', `${root}matomo.php`]);
  queue.push(['setSiteId', String(siteId)]);
  const script = document.createElement('script');
  script.async = true;
  script.src = `${root}matomo.js`;
  document.head.appendChild(script);
}

/** Counts one page view for a router path, once per change of path. */
export function trackPageView(pathname) {
  if (!analyticsEnabled || typeof window === 'undefined') return;
  // React mounts every effect twice in development: one path, one view.
  if (pathname === lastPath) return;
  lastPath = pathname;
  start();
  const url = `${window.location.origin}${window.location.pathname}`;
  const queue = window._paq;
  if (lastUrl) queue.push(['setReferrerUrl', lastUrl]);
  queue.push(['setCustomUrl', url]);
  queue.push(['setDocumentTitle', document.title]);
  queue.push(['trackPageView']);
  lastUrl = url;
}
