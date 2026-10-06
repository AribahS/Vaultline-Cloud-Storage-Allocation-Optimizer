import React from 'react';
import { useAppStore } from '../../store/useAppStore';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { loadPreset, complexityMode } = useAppStore();

  if (!isOpen) return null;

  const handleTryExample = () => {
    loadPreset('student');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 17, 43, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '36px',
          animation: 'fadeIn 0.25s ease-out',
          backgroundColor: 'var(--color-surface-solid)',
          boxShadow: 'var(--shadow-elevation)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h2 id="help-title" style={{ fontSize: 'var(--text-2xl)', marginBottom: '6px' }}>
              Welcome to Vaultline
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
              The bento box storage planner. Fit the right files into the space you have.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--color-dim)', fontSize: '22px', padding: '4px', lineHeight: 1, cursor: 'pointer' }}
            aria-label="Close help"
          >
            ✕
          </button>
        </div>

        {/* 3-Card Guided Overlay */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Card 1 */}
          <div
            className="card-sunken"
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(108, 71, 255, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              1
            </div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-ink)' }}>
              Add files
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Drop files, folders, or pick an example. Nothing is uploaded — all analysis stays on your device.
            </div>
          </div>

          {/* Card 2 */}
          <div
            className="card-sunken"
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 165, 36, 0.14)',
                color: 'var(--color-attention)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              2
            </div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-ink)' }}>
              Choose your limit
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Select where they need to fit: a phone, pen drive, free Google Drive (15 GB), iCloud (5 GB), or custom size.
            </div>
          </div>

          {/* Card 3 */}
          <div
            className="card-sunken"
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                color: 'var(--color-keep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              3
            </div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-ink)' }}>
              See the best mix
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Vaultline fits the most important files snug into your box. You get an interactive treemap and action checklist.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button
            className="btn btn-primary"
            onClick={handleTryExample}
          >
            Try an example (Student laptop)
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Got it, take me to the app
          </button>
        </div>

        {/* Detailed Academic Info if in Detailed mode */}
        {complexityMode === 'detailed' && (
          <div style={{ marginTop: '28px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
              For Professors & Students: The 0/1 Knapsack Engine
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.6 }}>
              Vaultline maps this problem to classic 0/1 knapsack where Space = Capacity W, File = Item, Size = Weight, and Importance = Value.
              Visit <strong>"How it works"</strong> for step-by-step table filling, recurrence verification, traceback, and greedy comparison.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

