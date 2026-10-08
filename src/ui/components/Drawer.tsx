import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, width = '400px' }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(20, 56, 43, 0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity var(--transition-color)'
        }}
      />
      {/* Panel */}
      <div 
        className="generic-drawer-panel responsive-surface"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width,
          backgroundColor: 'var(--color-surface-raised)',
          boxShadow: 'var(--shadow-soft-lg)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--transition-transform)'
        }}
      >
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--color-border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <Button variant="ghost" size="sm" iconOnly icon={<X size={20} />} onClick={onClose} aria-label="Close drawer" />
        </div>
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </>
  );
};
