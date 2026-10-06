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

const LANDING_SEEN_KEY = 'vaultline_landing_seen';

function Root() {
  const [showLanding, setShowLanding] = useState(
    () => !localStorage.getItem(LANDING_SEEN_KEY)
  );

  const handleEnter = () => {
    localStorage.setItem(LANDING_SEEN_KEY, '1');
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

