import React, { useMemo } from 'react';
import { KnapsackItem } from '../../engine/types';
import { solveGreedy } from '../../engine/greedy';
import { solveFullKnapsack } from '../../engine/knapsack';

interface GreedyVsDpComparisonProps {
  items: KnapsackItem[];
  quota: number;
  onLoadCounterexample: () => void;
}

export const GreedyVsDpComparison: React.FC<GreedyVsDpComparisonProps> = ({
  items,
  quota,
  onLoadCounterexample,
}) => {
  const unitBytes = 1024 * 1024 * 1024; // 1 GB unit
  const greedy = useMemo(() => {
    return solveGreedy(items, {
      quotaUnits: quota,
      quotaBytes: quota * unitBytes,
      unitBytes,
    });
  }, [items, quota]);

  const dp = useMemo(() => {
    return solveFullKnapsack(items, {
      quotaUnits: quota,
      quotaBytes: quota * unitBytes,
      unitBytes,
    });
  }, [items, quota]);

  const gap = dp.totalValue - greedy.totalValue;

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-ink)' }}>
            Side-by-Side: Greedy Heuristic vs Dynamic Programming
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: '2px' }}>
            Greedy sorts files by density (priority / size); DP explores the complete recurrence space.
          </p>
        </div>

        <button
          onClick={onLoadCounterexample}
          className="btn btn-secondary btn-sm"
        >
          Show counterexample: Greedy fails (30 vs 48)
        </button>
      </div>

      {/* Comparison Explanation Banner */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: gap > 0 ? 'var(--color-file-archives)' : 'var(--color-surface-sunken)',
          border: `1px solid ${gap > 0 ? 'color-mix(in srgb,var(--kept) 30%,transparent)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          marginBottom: '18px',
          fontSize: 'var(--text-sm)',
        }}
      >
        {gap > 0 ? (
          <span style={{ color: 'var(--kept)', fontWeight: 500 }}>
            Dynamic programming achieved <strong>+{gap} more priority points</strong> than greedy! Greedy took a large high-density item, leaving an awkward gap that could not fit complementary items.
          </span>
        ) : (
          <span style={{ color: 'var(--color-muted)' }}>
            Both algorithms matched on this dataset ({dp.totalValue} points). Greedy heuristic found the global optimum here, but has no worst-case guarantee for 0/1 knapsack.
          </span>
        )}
      </div>

      {/* Side-by-side Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Left: Greedy Approach */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-surface-sunken)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>
              Greedy by Density (Value / Size)
            </span>
            <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink)', fontWeight: 600 }}>
              Total: {greedy.totalValue} pts
            </span>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginBottom: '12px' }}>
            Sorted descending by density. Once capacity is exhausted, subsequent items are dropped.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {greedy.steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: step.fits ? 'var(--color-file-code)' : 'var(--color-surface)',
                  border: `1px solid ${step.fits ? 'color-mix(in srgb,var(--highlight) 30%,transparent)' : 'var(--color-border)'}`,
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: step.fits ? 1 : 0.55,
                }}
              >
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{step.item.name}</span>
                  <div style={{ fontSize: '10px', color: 'var(--color-dim)' }}>
                    density: {step.ratio.toFixed(2)} pts/unit • size: {step.item.normalizedSize}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 600, color: step.fits ? 'var(--ink)' : 'var(--color-dim)' }}>
                    {step.fits ? 'KEPT' : 'SKIPPED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: DP Optimal Approach */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-surface-sunken)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--kept)' }}>
              Dynamic Programming (Provably Optimal)
            </span>
            <span className="font-mono text-success" style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
              Total: {dp.totalValue} pts
            </span>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginBottom: '12px' }}>
            Guaranteed optimal solution by evaluating optimal subproblems:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dp.keptItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-file-archives)',
                  border: '1px solid color-mix(in srgb,var(--kept) 30%,transparent)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{item.name}</span>
                  <div style={{ fontSize: '10px', color: 'var(--color-dim)' }}>
                    weight: {item.normalizedSize} units • value: {item.value}
                  </div>
                </div>
                <div className="font-mono text-success" style={{ fontWeight: 600 }}>
                  +{item.value} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
