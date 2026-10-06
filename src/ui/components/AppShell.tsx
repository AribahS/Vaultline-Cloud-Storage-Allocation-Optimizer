import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PrintExecutiveSummary } from './PrintExecutiveSummary';
import { scanDroppedItems } from '../../engine/fileScanner';
import { useAppStore } from '../../store/useAppStore';
import { LayoutDashboard, Folder, Sliders, Wrench, FileText } from 'lucide-react';

const MOBILE_TABS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Files',     path: '/files', icon: Folder },
  { name: 'Plan',      path: '/optimizer', icon: Sliders },
  { name: 'Tools',     path: '/tools', icon: Wrench },
  { name: 'Reports',   path: '/reports', icon: FileText },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const { addFiles, setIsScanning } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: DragEvent) => { e.preventDefault(); if (!e.relatedTarget) setIsDragging(false); };
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer?.items) {
        setIsScanning(true, { count: 0 });
        try {
          const newFiles = await scanDroppedItems(e.dataTransfer.items, (p) => setIsScanning(true, p));
          addFiles(newFiles);
        } catch (err) {
          console.error(err);
        } finally {
          setIsScanning(false, null);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addFiles, setIsScanning]);

  return (
    /* A8: height:100vh + overflow:hidden — only <main> scrolls, TopBar stays fixed outside scroll container */
    <div style={{ display: 'flex', height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {isDragging && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(20, 56, 43, 0.8)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <h2 style={{ color: '#EFE3C6' }}>Drop to add to this scan</h2>
        </div>
      )}

      {/* Sidebar hidden on mobile; replaced by bottom tabs */}
      {!isMobile && <Sidebar />}

      {/* Main column — flex column, overflow hidden so only <main> scrolls */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <TopBar />
        <main
          id="main-app"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'var(--color-canvas)',
            /* D7: add bottom padding on mobile for the tab bar */
            paddingBottom: isMobile ? '72px' : 0,
          }}
        >
          {children}
        </main>
      </div>

      {/* D7: Mobile bottom tab bar replaces sidebar on small screens */}
      {isMobile && (
        <nav
          className="mobile-bottom-tabs"
          aria-label="Main navigation"
        >
          {MOBILE_TABS.map(tab => {
            const isActive = tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path);
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={isActive ? 'active' : undefined}
                style={{ textDecoration: 'none' }}
                aria-label={tab.name}
              >
                <tab.icon size={20} />
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      <PrintExecutiveSummary />
    </div>
  );
};

