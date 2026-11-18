// The guided tours the site shows on a first visit, by the id each one is
// remembered under (`tour:<id>` in localStorage, components/Tour.jsx). The
// browser suites run as a returning reader, so a tour does not cover the
// page they measure. Bump an id here when its tour is bumped in the app
// (CITY_TOUR and the layer tours' `version` in AtlasCityPage.jsx, `marks`
// in PlatformLanding.jsx): both suites read this one list.
export const TOUR_IDS = [
  'atlas-v2',
  'city-v2',
  'layer-fifteen-v1',
  'layer-citychrone-v1',
  'layer-cardep-v3',
  'layer-pov-v2',
];

/** An init script for Playwright that marks every tour as seen. */
export const skipTours = {
  content: `try {
    for (const id of ${JSON.stringify(TOUR_IDS)}) localStorage.setItem('tour:' + id, '1');
  } catch {
    // No storage: the tours would show, and the checks would say so.
  }`,
};
