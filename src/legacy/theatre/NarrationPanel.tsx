import React from 'react';
import { TeachingStep, KnapsackItem, TableStep, TracebackStep } from '../../engine/types';

interface NarrationPanelProps {
  currentStep: TeachingStep | null;
  chosenItems: KnapsackItem[];
  totalOptimalValue: number;
}

export const NarrationPanel: React.FC<NarrationPanelProps> = ({
  currentStep,
  chosenItems,
  totalOptimalValue,
}) => {
  const isTraceback = currentStep?.type === 'traceback';
  const tableStep = currentStep?.type === 'cell' ? (currentStep as TableStep) : null;
  const tbStep = currentStep?.type === 'traceback' ? (currentStep as TracebackStep) : null;

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-sunken)' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Step Explanation
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isTraceback ? 'var(--color-file-archives)' : 'var(--color-primary-surface)',
            color: isTraceback ? 'var(--kept)' : 'var(--color-primary)',
            fontWeight: 600,
          }}
        >
          {isTraceback ? 'Traceback Phase' : 'Table Filling'}
        </span>
      </div>

      {/* Main explanation narrative box with aria-live */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--color-surface-sunken)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${isTraceback ? 'color-mix(in srgb,var(--kept) 30%,transparent)' : 'var(--color-border)'}`,
            fontSize: 'var(--text-sm)',
            lineHeight: 1.6,
            color: 'var(--color-ink)',
          }}
        >
          {currentStep ? (
            tableStep ? (
              tableStep.explanation
            ) : (
              tbStep?.reason
            )
          ) : (
            'Click Play or Step Forward to start exploring cell by cell.'
          )}
        </div>

        {/* Detailed Decision Breakdown for Table Cells */}
        {tableStep && (
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--color-surface-sunken)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--color-dim)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.04em' }}>
              Comparison Metrics
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Skip Choice:</span>
              <span className="font-mono text-warning">dp[{tableStep.i - 1}][{tableStep.w}] = {tableStep.prevCellValue}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Take Choice:</span>
              <span className="font-mono text-success">
                {tableStep.takeRemainingValue !== null
                  ? `${tableStep.item.value} + dp[${tableStep.i - 1}][${tableStep.w - tableStep.item.normalizedSize}] = ${tableStep.candidateTakeValue}`
                  : 'Does not fit'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '6px', marginTop: '4px' }}>
              <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>Outcome:</span>
              <span style={{ fontWeight: 700, color: tableStep.decision === 'take' ? 'var(--kept)' : 'var(--color-muted)' }}>
                {tableStep.decision.toUpperCase()} {tableStep.isTie ? '(Tie broken: min files)' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Live Chosen Files Reconstructed in Traceback */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink)' }}>
              Optimal Set Reconstructed:
            </span>
            <span className="font-mono text-success" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              Value: {chosenItems.reduce((acc, it) => acc + it.value, 0)} / {totalOptimalValue}
            </span>
          </div>

          <div
            style={{
              maxHeight: '130px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {chosenItems.length === 0 ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', fontStyle: 'italic', padding: '6px 0' }}>
                {isTraceback ? 'Tracing backwards to extract chosen files...' : 'Files will appear here during traceback phase.'}
              </div>
            ) : (
              chosenItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-file-archives)',
                    border: '1px solid color-mix(in srgb,var(--kept) 25%,transparent)',
                    fontSize: 'var(--text-xs)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{item.name}</span>
                  <span className="font-mono text-success" style={{ fontWeight: 600 }}>+{item.value} pts</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
