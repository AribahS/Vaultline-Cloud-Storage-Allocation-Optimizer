import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from './ui/components/AppShell';

import { FilesPage } from './ui/pages/FilesPage';
import { useAppStore } from './store/useAppStore';
import { STUDENT_LAPTOP_DATASET } from './data/sampleDatasets';

const LandingPage = lazy(() => import('./ui/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const ReportsPage = lazy(() => import('./ui/pages/ReportsPage'));
const PlayPage = lazy(() => import('./ui/pages/PlayPage').then(module => ({ default: module.PlayPage })));

const HomeRoute: React.FC = () => {
  return <Navigate to="/files" replace />;
};

const LandingRoute: React.FC = () => {
  const navigate = useNavigate();
  const setFiles = useAppStore(state => state.setFiles);
  return <LandingPage onEnter={(path) => {
    if (path === '/play') setFiles(STUDENT_LAPTOP_DATASET);
    navigate(path ?? '/');
  }} />;
};

export const App: React.FC = () => {
  return (
    <AppShell>
      <Suspense fallback={<div role="status" className="page-container">Loading screen…</div>}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/dashboard" element={<HomeRoute />} />
        <Route path="/landing" element={<LandingRoute />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/optimizer" element={<Navigate to="/plan" replace />} />
        <Route path="/algorithm" element={<HomeRoute />} />
        <Route path="/tools" element={<Navigate to="/" replace />} />
        <Route path="/plan" element={<ReportsPage />} />
        <Route path="/reports" element={<Navigate to="/plan" replace />} />
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
      </Suspense>
    </AppShell>
  );
};

export default App;

