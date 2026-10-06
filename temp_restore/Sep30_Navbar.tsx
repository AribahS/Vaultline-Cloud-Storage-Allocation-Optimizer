import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

interface NavbarProps {
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHelp }) => {
  const {
    theme,
    toggleTheme,
    complexityMode,
    setComplexityMode,
    isPresentMode,
    togglePresentMode,
  } = useAppStore();

  const [detailedMenuOpen, setDetailedMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Your plan', end: true },
    { to: '/how-it-works', label: 'How it works', end: false },
    { to: '/experiments', label: 'Experiments', end: false },
  ];

  return (
    <header
      role="banner"
      style={{
        height: '64px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Left: Logo with Bento Box Icon */}
      <NavLink
        to="/"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #6C47FF 0%, #10B981 100%)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '3px',
            padding: '7px',
            boxShadow: 'var(--shadow-glow-primary)',
          }}
          aria-hidden="true"
        >
          <div style={{ background: '#FFFFFF', borderRadius: '3px', opacity: 0.95 }} />
          <div style={{ background: '#FFFFFF', borderRadius: '3px', opacity: 0.8 }} />
          <div style={{ background: '#FFFFFF', borderRadius: '3px', opacity: 0.8 }} />
          <div style={{ background: '#FFFFFF', borderRadius: '3px', opacity: 0.95 }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '20px',
                letterSpacing: '-0.03em',
                color: 'var(--color-ink)',
              }}
            >
              Vaultline
            </span>
          </div>
          <div
            className="hide-in-present"
            style={{
              fontSize: '11px',
              color: 'var(--color-muted)',
              marginTop: '-2px',
              fontWeight: 500,
            }}
          >
            The bento box storage planner
          </div>
        </div>
      </NavLink>

      {/* Center: Three-tab navigation */}
      <nav
        aria-label="Main Navigation"
        className="hide-in-present"
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface-sunken)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          gap: '4px',
          border: '1px solid var(--color-border)',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#FFFFFF' : 'var(--color-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(108, 71, 255, 0.3)' : 'none',
              transition: 'all var(--transition-fast)',
              textDecoration: 'none',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Right Controls: Simple/Detailed Switch, Theme Toggle, Need Help? */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Simple | Detailed Switch */}
        <div
          style={{ position: 'relative' }}
          className="hide-in-present"
        >
          <div
            className="segmented-control"
            role="radiogroup"
            aria-label="Complexity level"
          >
            <button
              role="radio"
              aria-checked={complexityMode === 'simple'}
              className={complexityMode === 'simple' ? 'active' : ''}
              onClick={() => setComplexityMode('simple')}
              title="Hide formulas and code"
            >
              Simple
            </button>
            <button
              role="radio"
              aria-checked={complexityMode === 'detailed'}
              className={complexityMode === 'detailed' ? 'active' : ''}
              onClick={() => {
                setComplexityMode('detailed');
              }}
              title="Show formulas, pseudocode, and algorithm details"
            >
              Detailed
            </button>
          </div>

          {/* If Detailed is active, show small button for Present Mode */}
          {complexityMode === 'detailed' && (
            <button
              onClick={togglePresentMode}
              title={isPresentMode ? 'Exit classroom mode' : 'Present: large text, hides chrome'}
              style={{
                marginLeft: '8px',
                fontSize: 'var(--text-xs)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isPresentMode ? 'var(--color-primary)' : 'var(--color-surface-sunken)',
                color: isPresentMode ? '#FFFFFF' : 'var(--color-muted)',
                fontWeight: 600,
                border: '1px solid var(--color-border)',
              }}
            >
              {isPresentMode ? 'Exit Present' : 'Present'}
            </button>
          )}
        </div>

        {/* Theme Toggle (Light / Soft Dark) */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to soft dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to soft dark theme'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-sunken)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-ink)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* "Need help?" text link */}
        <button
          onClick={onOpenHelp}
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--color-primary)',
            padding: '6px 8px',
            textDecoration: 'none',
          }}
        >
          Need help?
        </button>
      </div>
    </header>
  );
};

