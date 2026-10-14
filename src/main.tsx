import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource/fraunces/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import './index.css'
import App from './App.tsx'

import { ErrorBoundary } from './ui/components/ErrorBoundary'
import { clearStaleSession } from './lib/clearSession'

// Wipe any stale IndexedDB currentSession from old builds so the file count
// always comes from the initial store state (12 sample files), not a cached list.
clearStaleSession();

// Landing page shows on every fresh page load through the same router used by
// every other screen, so it can only be mounted by the /landing route.
localStorage.removeItem('vaultline_landing_seen');
sessionStorage.removeItem('vaultline_landing_seen_session');

if (!window.location.hash) window.location.hash = '#/landing';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackType="root">
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
