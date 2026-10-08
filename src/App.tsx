import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './ui/components/AppShell';

import { DashboardPage } from './ui/pages/DashboardPage';

import { FilesPage } from './ui/pages/FilesPage';
import { OptimizerPage } from './ui/pages/OptimizerPage';
import ReportsPage from './ui/pages/ReportsPage';
import { PlayPage } from './ui/pages/PlayPage';

export const App: React.FC = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/optimizer" element={<OptimizerPage />} />
        <Route path="/algorithm" element={<Navigate to="/" replace />} />
        <Route path="/tools" element={<Navigate to="/" replace />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

export default App;

