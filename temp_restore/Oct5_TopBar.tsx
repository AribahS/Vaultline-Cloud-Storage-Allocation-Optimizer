import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { scanFileList } from '../../engine/fileScanner';

/**
 * A5: Breadcrumb-aware title.  
 * For sub-pages like /tools/split → "Extra tools / Split across destinations".
 */
const TOOLS_NAMES: Record<string, string> = {
  split: 'Split across destinations',
  transfer: 'Transfer time planner',
  compression: 'Compression-aware planning',
  'what-if': 'What-if explorer',
  approximate: 'Approximate mode',
  cleanup: 'Cleanup finder',
};

const getPageBreadcrumb = (pathname: string): string[] => {
  if (pathname === '/') return ['Dashboard'];
  if (pathname === '/files') return ['Files'];
  if (pathname === '/optimizer') return ['Optimizer'];
  if (pathname === '/algorithm') return ['Algorithm analysis'];
  if (pathname === '/reports') return ['Reports'];
  
  if (pathname.startsWith('/tools')) {
    const sub = pathname.replace('/tools/', '').replace('/tools', '');
    if (!sub) return ['Extra tools'];
    const toolName = TOOLS_NAMES[sub] || sub;
    return ['Extra tools', toolName];
  }
  
  return ['Vaultline'];
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumb = getPageBreadcrumb(location.pathname);
  const { setMobileDrawerOpen, searchQuery, setSearchQuery, addFiles, setIsScanning } = useAppStore();
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

  /* A2: Removed "Run optimizer" button from top bar — only one Run button per route */

  return (
    <>
      <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
      <header className="vaultline-topbar" style={{
        height: '64px',
        backgroundColor: 'var(--color-surface-raised)',
        borderBottom: '1px solid var(--color-border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0,
      }}>
        {/* A5: Breadcrumb title */}
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
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {breadcrumb.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: 'var(--color-ink-3)', fontSize: '14px' }}>/</span>}
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: i === 0 && breadcrumb.length === 1 ? '18px' : '15px',
                  fontWeight: 600,
                  color: i === breadcrumb.length - 1 ? 'var(--color-forest)' : 'var(--color-ink-3)',
                }}>
                  {part}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Center Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isSearchFocused ? 'var(--color-surface-raised)' : 'var(--color-canvas)',
          border: `1px solid ${isSearchFocused ? 'var(--color-forest-500)' : 'var(--color-border-hairline)'}`,
          borderRadius: 'var(--radius-control)',
          padding: '6px 12px',
          flex: '0 1 320px',
          minWidth: '120px',
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

        {/* Actions — only Add files, no Run optimizer (A2) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius-control)',
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
        </div>
      </header>
    </>
  );
};

