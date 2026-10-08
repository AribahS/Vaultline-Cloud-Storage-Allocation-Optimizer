import React from 'react';
import { TeachingStep } from '../../engine/types';

interface PseudocodePanelProps {
  currentStep: TeachingStep | null;
  isTraceback: boolean;
}

export const PseudocodePanel: React.FC<PseudocodePanelProps> = ({
  currentStep,
  isTraceback,
}) => {
  // Determine active pseudocode line
  let activeLine = 0;

  if (isTraceback) {
    if (currentStep && currentStep.type === 'traceback') {
      activeLine = currentStep.taken ? 14 : 15;
    } else {
      activeLine = 13;
    }
  } else if (currentStep && currentStep.type === 'cell') {
    if (currentStep.decision === 'fit_skip') {
      activeLine = 6;
    } else if (currentStep.isTie) {
      activeLine = 10;
    } else if (currentStep.decision === 'take') {
      activeLine = 8;
    } else {
      activeLine = 9;
    }
  }

  const lines = [
    { num: 1, text: '// 0/1 Knapsack Dynamic Programming' },
    { num: 2, text: 'for i = 1 to n:' },
    { num: 3, text: '  for w = 0 to W:' },
    { num: 4, text: '    if size[i] > w:' },
    { num: 5, text: '      // Item does not fit' },
    { num: 6, text: '      dp[i][w] = dp[i - 1][w]' },
    { num: 7, text: '    else:' },
    { num: 8, text: '      take = value[i] + dp[i - 1][w - size[i]]' },
    { num: 9, text: '      skip = dp[i - 1][w]' },
    { num: 10, text: '      dp[i][w] = max(skip, take) // tie: min files' },
    { num: 11, text: '' },
    { num: 12, text: '// Traceback: reconstruct chosen set' },
    { num: 13, text: 'while i > 0 and w > 0:' },
    { num: 14, text: '  if dp[i][w] != dp[i-1][w]: take(i); w -= size[i]' },
    { num: 15, text: '  else: skip(i); i--' },
  ];

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-sunken)' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Pseudocode
        </span>
        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
          O(nW)
        </span>
      </div>

      <div
        className="grid-paper-bg"
        style={{
          flex: 1,
          padding: '12px 8px',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '11.5px',
          lineHeight: '1.7',
        }}
      >
        {lines.map((line) => {
          const isActive = line.num === activeLine;
          return (
            <div
              key={line.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: isActive
                  ? isTraceback
                    ? 'var(--color-file-archives)'
                    : 'var(--color-primary-surface)'
                  : 'transparent',
                borderLeft: isActive
                  ? `3px solid ${isTraceback ? 'var(--kept)' : 'var(--color-primary)'}`
                  : '3px solid transparent',
                color: isActive
                  ? 'var(--color-ink)'
                  : line.text.startsWith('//')
                  ? 'var(--color-dim)'
                  : 'var(--color-muted)',
                fontWeight: isActive ? 600 : 400,
                transition: 'all var(--transition-fast)',
              }}
            >
              <span
                style={{
                  width: '24px',
                  display: 'inline-block',
                  color: 'var(--color-dim)',
                  userSelect: 'none',
                  fontSize: '10px',
                }}
              >
                {line.num}
              </span>
              <span style={{ whiteSpace: 'pre' }}>{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
