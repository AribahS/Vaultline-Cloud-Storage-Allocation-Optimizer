import React from 'react';
import { X, Moon, Sun, Layers, Zap, Trash2, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface SettingsModalProps {
  onClose: () => void;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-ink-muted)',
    marginBottom: '12px',
    marginTop: '24px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--color-border-hairline)',
  }}>
    {children}
  </div>
);

const Row: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '10px 0',
    borderBottom: '1px solid var(--color-border-hairline)',
  }}>
    <div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink)' }}>{label}</div>
      {description && <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>{description}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: () => void; id: string }> = ({ checked, onChange, id }) => (
  <button
    id={id}
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    style={{
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: checked ? 'var(--color-forest)' : 'var(--color-border)',
      position: 'relative',
      transition: 'background-color 200ms ease',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute',
      top: '2px',
      left: checked ? '22px' : '2px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: '#fff',
      transition: 'left 200ms ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    theme, toggleTheme,
    complexityMode, setComplexityMode,
    autoRunOptimizer, setAutoRunOptimizer,
    clearFiles,
  } = useAppStore();

  const isDark = theme === 'dark';
  const isDetailed = complexityMode === 'detailed';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2001,
          width: '480px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border-hairline)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-ink)' }}>
            Settings
          </h2>
          <button
            id="settings-modal-close"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-ink-muted)', padding: '4px', borderRadius: '6px',
              display: 'flex', alignItems: 'center',
            }}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Appearance ── */}
        <SectionTitle>Appearance</SectionTitle>

        <Row
          label="Dark mode"
          description="Switch between light and dark colour schemes"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={14} color="var(--color-ink-muted)" />
            <Toggle checked={isDark} onChange={toggleTheme} id="settings-dark-mode-toggle" />
            <Moon size={14} color="var(--color-ink-muted)" />
          </div>
        </Row>

        <Row
          label="Detailed mode"
          description="Show advanced metrics, algorithm internals, and raw numbers"
        >
          <Toggle
            checked={isDetailed}
            onChange={() => setComplexityMode(isDetailed ? 'simple' : 'detailed')}
            id="settings-detailed-mode-toggle"
          />
        </Row>

        {/* ── Optimizer ── */}
        <SectionTitle>Optimizer</SectionTitle>

        <Row
          label="Auto-run optimizer"
          description="Automatically recompute the plan when files or quota change"
        >
          <Toggle
            checked={autoRunOptimizer}
            onChange={() => setAutoRunOptimizer(!autoRunOptimizer)}
            id="settings-auto-run-toggle"
          />
        </Row>

        {/* ── Data ── */}
        <SectionTitle>Data</SectionTitle>

        <Row
          label="Clear all files"
          description="Remove all loaded files and reset the optimizer result"
        >
          <button
            id="settings-clear-files-btn"
            onClick={() => { clearFiles(); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '6px',
              border: '1px solid var(--color-error, #dc2626)',
              background: 'transparent',
              color: 'var(--color-error, #dc2626)',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            }}
          >
            <Trash2 size={14} />
            Clear files
          </button>
        </Row>

        <Row
          label="Reset app settings"
          description="Restore all preferences to their defaults (page reload required)"
        >
          <button
            id="settings-reset-btn"
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-ink)',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </Row>

        {/* Close button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-forest)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};

