import React, { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Folder, Sliders, LineChart, Wrench, FileText, Settings, HelpCircle, Box, PanelLeftClose, PanelLeftOpen, PieChart, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatSize, pluralize } from '../../lib/format';
import { SettingsModal } from './SettingsModal';
import { HelpModal } from './HelpModal';

export const Sidebar: React.FC = () => {
  const { files, quotaBytes, isSidebarCollapsed, toggleSidebar, isMobileDrawerOpen, setMobileDrawerOpen } = useAppStore();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const sidebarRef = useRef<HTMLElement>(null);
  const [activeModal, setActiveModal] = useState<'settings' | 'help' | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, isMobileDrawerOpen, setMobileDrawerOpen]);

  // Trap focus basic
  useEffect(() => {
    if (isMobile && isMobileDrawerOpen && sidebarRef.current) {
      const focusableElements = sidebarRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length) {
        focusableElements[0].focus();
      }
    }
  }, [isMobile, isMobileDrawerOpen]);

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Files', path: '/files', icon: Folder },
    { name: 'Optimizer', path: '/optimizer', icon: Sliders },
    { name: 'Algorithm analysis', path: '/algorithm', icon: LineChart },
    { name: 'Extra tools', path: '/tools', icon: Wrench },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const collapsed = !isMobile && isSidebarCollapsed;
  const width = collapsed ? '72px' : '240px';
  const showText = !collapsed;

  // On mobile, sidebar is hidden (bottom tabs replace it)
  if (isMobile && !isMobileDrawerOpen) {
    return (
      <>
        {activeModal === 'settings' && <SettingsModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'help' && <HelpModal onClose={() => setActiveModal(null)} />}
      </>
    );
  }

  const sidebarContent = (
    <aside
      ref={sidebarRef}
      className="vaultline-sidebar"
      style={{
        width,
        /* C6: Forest gradient sidebar */
        background: 'linear-gradient(180deg, #0E2A20 0%, #14382B 100%)',
        color: 'var(--color-ink)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(184, 137, 60, 0.15)',
        transition: 'width 200ms ease, transform 200ms ease',
        height: '100%',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 1000,
        transform: isMobile ? (isMobileDrawerOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        overflow: 'hidden',
      }}
      aria-hidden={isMobile && !isMobileDrawerOpen}
    >
      {/* Logo / collapse-toggle area */}
      <div style={{
        padding: collapsed ? '20px 0 16px' : '20px 20px 16px',
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: collapsed ? 8 : 0,
        color: '#fff',
        transition: 'padding 200ms ease',
      }}>
        {/* Logo icon (always shown) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <Box size={24} color="var(--color-brass)" style={{ flexShrink: 0 }} />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
            fontWeight: 600,
            opacity: showText ? 1 : 0,
            transition: 'opacity 200ms ease',
            whiteSpace: 'nowrap'
          }}>Vaultline</span>
        </div>

        {/* Sidebar toggle button */}
        {isMobile ? (
          <button onClick={() => setMobileDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} aria-label="Close menu">
            <X size={20} />
          </button>
        ) : collapsed ? (
          <button
            onClick={toggleSidebar}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Expand sidebar (Ctrl+B)"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>


      {/* Navigation */}
      <nav style={{ flex: 1, padding: collapsed ? '0 8px' : '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.name : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: collapsed ? '12px' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '6px',
              textDecoration: 'none',
              color: isActive ? '#fff' : 'var(--color-forest-100)',
              /* C6: active item gets faint gold fill */
              backgroundColor: isActive ? 'rgba(184, 137, 60, 0.12)' : 'transparent',
              position: 'relative',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'var(--transition-color)',
              whiteSpace: 'nowrap'
            })}
          >
            {({ isActive }) => (
              <>
                {/* C6: 3px gold bar on active */}
                {isActive && (
                  <div style={{
                    position: 'absolute', left: collapsed ? 0 : -12, top: 6, bottom: 6, width: 3,
                    backgroundColor: 'var(--color-brass)', borderRadius: '0 3px 3px 0'
                  }} />
                )}
                <item.icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ 
                  opacity: showText ? 1 : 0, 
                  transition: 'opacity 200ms ease',
                  width: showText ? 'auto' : 0,
                  overflow: 'hidden'
                }}>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Mini Card — A3: uses formatBytes */}
      <div style={{ padding: collapsed ? '16px 8px' : '16px' }}>
        <div 
          title={collapsed ? `${pluralize(files.length, 'file')}, ${formatSize(totalSize)}` : undefined}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            padding: collapsed ? '12px 0' : '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: collapsed ? 'center' : 'flex-start',
            color: 'var(--color-forest-100)'
          }}
        >
          {collapsed ? (
            <PieChart size={20} color="var(--color-brass)" />
          ) : (
            <>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#fff', whiteSpace: 'nowrap' }}>Current scan</div>
              <div style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {pluralize(files.length, 'file')} ({formatSize(totalSize)})
              </div>
              <div style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                {quotaBytes > 0 ? `${formatSize(quotaBytes)} target` : 'No target set'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Nav */}
      <div style={{ padding: collapsed ? '12px 8px' : '12px', borderTop: '1px solid rgba(184, 137, 60, 0.15)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button 
          title={collapsed ? 'Settings' : undefined}
          onClick={() => setActiveModal('settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '12px' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%', background: 'none', border: 'none', color: 'var(--color-forest-100)',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500, textAlign: 'left',
            whiteSpace: 'nowrap'
          }}
        >
          <Settings size={18} style={{ flexShrink: 0 }} />
          <span style={{ opacity: showText ? 1 : 0, width: showText ? 'auto' : 0, overflow: 'hidden' }}>Settings</span>
        </button>
        <button 
          title={collapsed ? 'Help' : undefined}
          onClick={() => setActiveModal('help')}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '12px' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%', background: 'none', border: 'none', color: 'var(--color-forest-100)',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500, textAlign: 'left',
            whiteSpace: 'nowrap'
          }}
        >
          <HelpCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ opacity: showText ? 1 : 0, width: showText ? 'auto' : 0, overflow: 'hidden' }}>Help</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {isMobile && isMobileDrawerOpen && (
        <div 
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(2px)'
          }}
        />
      )}
      {sidebarContent}
      {activeModal === 'settings' && <SettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'help' && <HelpModal onClose={() => setActiveModal(null)} />}
    </>
  );
};

