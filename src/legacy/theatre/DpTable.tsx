import React, { useMemo } from 'react';
import { KnapsackItem, TeachingStep, TableStep, TracebackStep } from '../../engine/types';

interface DpTableProps {
  items: KnapsackItem[];
  W: number;
  table: number[][]; // complete (n+1) x (W+1) table
  currentStepIndex: number;
  steps: TeachingStep[];
}

export const DpTable: React.FC<DpTableProps> = ({
  items,
  W,
  table,
  currentStepIndex,
  steps,
}) => {
  const n = items.length;
  const currentStep = steps[currentStepIndex] || null;

  // Find max value in table for heat intensity calculation
  const maxTableVal = useMemo(() => {
    let m = 1;
    for (let r = 0; r <= n; r++) {
      for (let c = 0; c <= W; c++) {
        if (table[r]?.[c] > m) m = table[r][c];
      }
    }
    return m;
  }, [table, n, W]);

  // Set of computed cells up to current step
  const computedCells = useMemo(() => {
    const set = new Set<string>();
    // Row 0 is always computed (base case)
    for (let w = 0; w <= W; w++) {
      set.add(`0_${w}`);
    }

    for (let s = 0; s <= currentStepIndex; s++) {
      const step = steps[s];
      if (step && step.type === 'cell') {
        set.add(`${step.i}_${step.w}`);
      }
    }
    return set;
  }, [currentStepIndex, steps, W]);

  // Active cell and dependency cells
  const isCellStep = currentStep?.type === 'cell';
  const isTraceback = currentStep?.type === 'traceback';

  const activeCellCoord = isCellStep ? { r: (currentStep as TableStep).i, c: (currentStep as TableStep).w } : null;
  const skipDepCoord = isCellStep && activeCellCoord ? { r: activeCellCoord.r - 1, c: activeCellCoord.c } : null;

  const takeDepCoord = useMemo(() => {
    if (!isCellStep || !activeCellCoord) return null;
    const item = items[activeCellCoord.r - 1];
    if (item && item.normalizedSize <= activeCellCoord.c) {
      return { r: activeCellCoord.r - 1, c: activeCellCoord.c - item.normalizedSize };
    }
    return null;
  }, [isCellStep, activeCellCoord, items]);

  // Traceback visited path up to current step
  const tracebackPath = useMemo(() => {
    const path: { r: number; c: number; taken: boolean }[] = [];
    for (let s = 0; s <= currentStepIndex; s++) {
      const step = steps[s];
      if (step && step.type === 'traceback') {
        const tb = step as TracebackStep;
        path.push({ r: tb.i, c: tb.remainingQuota + (tb.taken ? tb.item.normalizedSize : 0), taken: tb.taken });
      }
    }
    return path;
  }, [currentStepIndex, steps]);

  const tracebackPathCoords = useMemo(() => {
    const set = new Set<string>();
    tracebackPath.forEach((p) => set.add(`${p.r}_${p.c}`));
    return set;
  }, [tracebackPath]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Permanent Color & Pattern Legend */}
      <div
        style={{
          padding: '10px 18px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-sunken)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: 'var(--text-xs)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Legend:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-primary)', borderRadius: '3px' }} />
          <span style={{ color: 'var(--color-ink)' }}>Computing (Active)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-warning-surface)', borderRadius: '3px', border: '1.5px dashed var(--color-warning)' }} />
          <span style={{ color: 'var(--color-ink)' }}>Dependencies (Skip & Take)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-success-surface)', borderRadius: '3px', border: '2px solid var(--color-success)' }} />
          <span style={{ color: 'var(--color-ink)' }}>Traceback Path</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-surface)', borderRadius: '3px', border: '1px solid var(--color-border)' }} />
          <span style={{ color: 'var(--color-dim)' }}>Computed / Idle</span>
        </div>
      </div>

      {/* Main DP Table Viewport */}
      <div
        className="grid-paper-bg"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          position: 'relative',
        }}
      >
        <table
          style={{
            borderCollapse: 'separate',
            borderSpacing: '3px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            margin: '0 auto',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-muted)',
                  fontSize: 'var(--text-xs)',
                  textAlign: 'left',
                  minWidth: '160px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10,
                }}
              >
                File (Size, Priority)
              </th>
              {Array.from({ length: W + 1 }, (_, w) => (
                <th
                  key={w}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: activeCellCoord?.c === w ? 'var(--color-primary)' : 'var(--color-dim)',
                    textAlign: 'center',
                    minWidth: '38px',
                    fontWeight: activeCellCoord?.c === w ? 700 : 500,
                  }}
                >
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Row 0: Base Case (No items, all 0) */}
            <tr>
              <td
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-dim)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10,
                  fontSize: '11px',
                }}
              >
                0: [Base: 0 items]
              </td>
              {Array.from({ length: W + 1 }, (_, w) => {
                const isSkipDep = skipDepCoord?.r === 0 && skipDepCoord?.c === w;
                const isTakeDep = takeDepCoord?.r === 0 && takeDepCoord?.c === w;
                const isTb = tracebackPathCoords.has(`0_${w}`);

                let cellBg = 'var(--color-surface-sunken)';
                let border = '1px solid var(--color-border)';

                if (isSkipDep || isTakeDep) {
                  cellBg = 'var(--color-warning-surface)';
                  border = '1.5px dashed var(--color-warning)';
                } else if (isTb) {
                  cellBg = 'var(--color-success-surface)';
                  border = '2px solid var(--color-success)';
                }

                return (
                  <td
                    key={w}
                    className="dp-cell"
                    style={{
                      textAlign: 'center',
                      padding: '6px 4px',
                      backgroundColor: cellBg,
                      border,
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-dim)',
                    }}
                  >
                    0
                  </td>
                );
              })}
            </tr>

            {/* Rows 1 to n: Items */}
            {items.map((item, itemIdx) => {
              const r = itemIdx + 1;

              return (
                <tr key={item.id}>
                  <td
                    style={{
                      padding: '6px 12px',
                      backgroundColor: activeCellCoord?.r === r ? 'var(--color-primary-surface)' : 'var(--color-surface)',
                      border: activeCellCoord?.r === r ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      fontSize: '11px',
                      color: 'var(--color-ink)',
                      fontWeight: activeCellCoord?.r === r ? 600 : 400,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }} title={item.name}>
                        {r}. {item.name}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--color-dim)' }}>
                        ({item.normalizedSize}G, v={item.value})
                      </span>
                    </div>
                  </td>

                  {Array.from({ length: W + 1 }, (_, w) => {
                    const isComputed = computedCells.has(`${r}_${w}`);
                    const isActive = activeCellCoord?.r === r && activeCellCoord?.c === w;
                    const isSkipDep = skipDepCoord?.r === r && skipDepCoord?.c === w;
                    const isTakeDep = takeDepCoord?.r === r && takeDepCoord?.c === w;
                    const isTb = tracebackPathCoords.has(`${r}_${w}`);

                    const cellVal = table[r]?.[w] ?? 0;
                    const heatOpacity = isComputed ? (cellVal / maxTableVal) * 0.25 : 0;

                    let bg = isComputed ? `rgba(91, 63, 217, ${heatOpacity})` : 'var(--color-surface-sunken)';
                    let border = '1px solid var(--color-border)';
                    let textColor = isComputed ? 'var(--color-ink)' : 'var(--color-dim)';
                    let fontWeight = 400;

                    if (isActive) {
                      bg = 'var(--color-primary)';
                      border = '2px solid #fff';
                      textColor = '#ffffff';
                      fontWeight = 700;
                    } else if (isSkipDep || isTakeDep) {
                      bg = 'var(--color-warning-surface)';
                      border = '1.5px dashed var(--color-warning)';
                      textColor = 'var(--color-warning)';
                      fontWeight = 700;
                    } else if (isTb) {
                      bg = 'var(--color-success-surface)';
                      border = '2px solid var(--color-success)';
                      textColor = 'var(--color-success)';
                      fontWeight = 700;
                    }

                    return (
                      <td
                        key={w}
                        className="dp-cell"
                        style={{
                          textAlign: 'center',
                          padding: '6px 4px',
                          backgroundColor: bg,
                          border,
                          borderRadius: 'var(--radius-sm)',
                          color: textColor,
                          fontWeight,
                          transition: 'all var(--transition-fast)',
                          position: 'relative',
                        }}
                      >
                        {isComputed ? cellVal : ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recurrence Equation Bar Under the Table */}
      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-sunken)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--text-xs)',
        }}
      >
        <span style={{ color: 'var(--color-dim)', fontWeight: 600 }}>
          Recurrence:
        </span>
        <div className="font-mono" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
          {isCellStep && (currentStep as TableStep).recurrenceFormula ? (
            (currentStep as TableStep).recurrenceFormula
          ) : isTraceback ? (
            `Traceback: ${(currentStep as TracebackStep).taken ? 'TAKE file & reduce quota' : 'SKIP file'}`
          ) : (
            'dp[i][w] = max(dp[i-1][w], value_i + dp[i-1][w - size_i])'
          )}
        </div>
      </div>
    </div>
  );
};
