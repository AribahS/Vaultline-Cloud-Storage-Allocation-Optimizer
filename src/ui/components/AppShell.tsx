import React, { useCallback, useEffect, useState } from 'react';
import { TopBar } from './TopBar';
import { PrintExecutiveSummary } from './PrintExecutiveSummary';
import { scanDroppedItems } from '../../engine/fileScanner';
import { useAppStore } from '../../store/useAppStore';
import { AlgorithmDrawerContext } from './AlgorithmDrawerContext';
import { AlgorithmDrawer } from './AlgorithmDrawer';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dragging, setDragging] = useState(false);
  const [algorithmOpen, setAlgorithmOpen] = useState(false);
  const openAlgorithm = useCallback(() => setAlgorithmOpen(true), []);
  const { addFiles, setIsScanning } = useAppStore();
  useEffect(() => {
    const over = (event: DragEvent) => { event.preventDefault(); setDragging(true); };
    const leave = (event: DragEvent) => { event.preventDefault(); if (!event.relatedTarget) setDragging(false); };
    const drop = async (event: DragEvent) => {
      event.preventDefault(); setDragging(false);
      if (!event.dataTransfer?.items) return;
      setIsScanning(true, { count: 0 });
      try { addFiles(await scanDroppedItems(event.dataTransfer.items, progress => setIsScanning(true, progress))); }
      catch (error) { console.error(error); }
      finally { setIsScanning(false, null); }
    };
    window.addEventListener('dragover', over); window.addEventListener('dragleave', leave); window.addEventListener('drop', drop);
    return () => { window.removeEventListener('dragover', over); window.removeEventListener('dragleave', leave); window.removeEventListener('drop', drop); };
  }, [addFiles, setIsScanning]);
  return <AlgorithmDrawerContext.Provider value={openAlgorithm}>
    <div className="vaultline-shell">
      {dragging && <div className="drop-overlay">Drop to add to this scan</div>}
      <TopBar />
      <main id="main-app">{children}</main>
      <PrintExecutiveSummary />
      <AlgorithmDrawer open={algorithmOpen} onClose={() => setAlgorithmOpen(false)} />
    </div>
  </AlgorithmDrawerContext.Provider>;
};
