import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Play, Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { scanFileList } from '../../engine/fileScanner';

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '/': return 'Dashboard';
    case '/files': return 'Files';
    case '/optimizer': return 'Optimizer';
    case '/algorithm': return 'Algorithm analysis';
    case '/tools': return 'Extra tools';
    case '/reports': return 'Reports';
    default: return 'Vaultline';
  }
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const { setMobileDrawerOpen, searchQuery, setSearchQuery, triggerRecompute, isComputing, addFiles, setIsScanning, files } = useAppStore();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsScanning(true, { count: 0 });
    try {
      const newFiles = await scanFileList(e.target.files, (p) => setIsScanning(true, p));
      addFiles(newFiles);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false, null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunOptimizer = () => {
    if (files.length === 0) {
      navigate('/files');
      return;
    }
    triggerRecompute();
  };

  return (
    <>
      <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
      <header style={{
        height: '64px',
        backgroundColor: 'var(--color-surface-raised)',
        borderBottom: '1px solid var(--color-border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '16px',
      }}>
        {/* Breadcrumb / Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isMobile && (
            <button 
              onClick={() => setMobileDrawerOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--color-ink)' }}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
          )}
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>{pageTitle}</h2>
        </div>

        {/* Center Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isSearchFocused ? 'var(--color-surface-raised)' : 'var(--color-canvas)',
          border: `1px solid ${isSearchFocused ? 'var(--color-forest-500)' : 'var(--color-border-hairline)'}`,
          borderRadius: '6px',
          padding: '6px 12px',
          width: '320px',
          maxWidth: '100%',
          gap: '8px',
          transition: 'border-color 150ms ease, background-color 150ms ease',
        }}>
          <Search size={16} color="var(--color-ink-3)" />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search files (Ctrl+K)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              color: 'var(--color-ink)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--color-ink-3)' }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '6px',
              border: '1px solid var(--color-border-strong)',
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-ink)',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
          >
            <Plus size={16} />
            Add files
          </button>
          <button 
            onClick={handleRunOptimizer}
            disabled={isComputing}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '6px',
              border: 'none',
              backgroundColor: isComputing ? 'var(--color-ink-3)' : 'var(--color-forest-500)',
              color: '#fff',
              fontSize: '14px', fontWeight: 500, 
              cursor: isComputing ? 'not-allowed' : 'pointer',
              opacity: isComputing ? 0.7 : 1,
              transition: 'opacity 150ms ease',
            }}
          >
            <Play size={16} />
            {isComputing ? 'Computing...' : 'Run optimizer'}
          </button>
        </div>
      </header>
    </>
  );
};

