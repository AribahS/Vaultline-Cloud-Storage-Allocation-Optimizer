import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './ui/components/AppShell';

import { DashboardPage } from './ui/pages/DashboardPage';

import { FilesPage } from './ui/pages/FilesPage';
const OptimizerPage = () => <div className="page-container"><h1>Optimizer</h1></div>;
const AlgorithmPage = () => <div className="page-container"><h1>Algorithm Analysis</h1></div>;
const ToolsPage = () => <div className="page-container"><h1>Extra Tools</h1></div>;
const ReportsPage = () => <div className="page-container"><h1>Reports</h1></div>;

export const App: React.FC = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/optimizer" element={<OptimizerPage />} />
        <Route path="/algorithm" element={<AlgorithmPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

export default App;

