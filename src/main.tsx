import { StrictMode, useState } from 'react'
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
import { LandingPage } from './ui/pages/LandingPage'
import { deleteAutoSession } from './engine/storageDb'

deleteAutoSession();

// Landing page shows on every fresh page load.
// sessionStorage/localStorage keys cleaned up.
localStorage.removeItem('vaultline_landing_seen');
sessionStorage.removeItem('vaultline_landing_seen_session');

function Root() {
  const [showLanding, setShowLanding] = useState(() => !window.location.hash);

  const handleEnter = () => {
    window.location.hash = '#/';
    setShowLanding(false);
  };

  if (showLanding) {
    return (
      <ErrorBoundary fallbackType="root">
        <LandingPage onEnter={handleEnter} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallbackType="root">
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
