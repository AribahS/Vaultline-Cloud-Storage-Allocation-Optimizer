import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-canvas)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

