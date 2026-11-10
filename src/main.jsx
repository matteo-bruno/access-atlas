import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Self-hosted so the Atlas renders identically offline and behind a firewall.
// Roboto is the site's working face — body, UI, everything that is read rather
// than announced. Newsreader is the display face: a variable font whose
// optical size follows the font size, so a title gets its display cut and a
// small heading its text cut. Titles are set at 400, which is why every rule
// that uses it sets `font-weight: 400`. Figures are Roboto too, with tabular
// digits (see `--font-mono` in tokens.css).
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/400-italic.css';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';

import './styles/tokens.css';
import './styles/global.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
