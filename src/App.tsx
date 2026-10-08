import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from './ui/components/AppShell';

import { DashboardPage } from './ui/pages/DashboardPage';

import { FilesPage } from './ui/pages/FilesPage';
import { OptimizerPage } from './ui/pages/OptimizerPage';
import { useAppStore } from './store/useAppStore';
import { STUDENT_LAPTOP_DATASET } from './data/sampleDatasets';

const LandingPage = lazy(() => import('./ui/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const ReportsPage = lazy(() => import('./ui/pages/ReportsPage'));
const PlayPage = lazy(() => import('./ui/pages/PlayPage').then(module => ({ default: module.PlayPage })));

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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/landing" element={<LandingRoute />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/optimizer" element={<OptimizerPage />} />
        <Route path="/algorithm" element={<Navigate to="/" replace />} />
        <Route path="/tools" element={<Navigate to="/" replace />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AppShell>
  );
};

export default App;

