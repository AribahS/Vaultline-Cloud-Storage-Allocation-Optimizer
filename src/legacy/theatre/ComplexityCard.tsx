import React, { useMemo } from 'react';
import { solveBruteForce } from '../../engine/bruteForce';
import { KnapsackItem } from '../../engine/types';

interface ComplexityCardProps {
  n: number;
  W: number;
  items: KnapsackItem[];
  cellsComputed: number;
  runtimeMs: number;
}

export const ComplexityCard: React.FC<ComplexityCardProps> = ({
  n,
  W,
  items,
  cellsComputed,
  runtimeMs,
}) => {
  // If n <= 20, compute real brute force count 2^n and timing
  const bruteForce = useMemo(() => {
    if (n > 20) return null;
    try {
      return solveBruteForce(items, W);
    } catch {
      return null;
    }
  }, [items, n, W]);

  const subsetsTotal = Math.pow(2, n);

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Theoretical & Runtime Complexity
        </span>
        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
          Pseudo-Polynomial Time
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time Complexity</div>
          <div className="font-mono" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink)', marginTop: '2px' }}>
            O(n · W)
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '2px' }}>
            {n} × {W} = {(n * W).toLocaleString()} operations
          </div>
        </div>

        <div style={{ padding: '12px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Space Complexity</div>
          <div className="font-mono" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink)', marginTop: '2px' }}>
            O(W) / O(nW)
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '2px' }}>
            Rolling row: {W} ints + bit array
          </div>
        </div>

        <div style={{ padding: '12px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cells Evaluated</div>
          <div className="font-mono" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
            {cellsComputed.toLocaleString()}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '2px' }}>
            Measured: {runtimeMs.toFixed(2)} ms
          </div>
        </div>

        {n <= 20 && (
          <div style={{ padding: '12px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Brute Force 2ⁿ</div>
            <div className="font-mono" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-warning)', marginTop: '2px' }}>
              {subsetsTotal.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '2px' }}>
              Subsets checked ({bruteForce ? `${bruteForce.executionTimeMs.toFixed(2)} ms` : 'N/A'})
            </div>
          </div>
        )}
      </div>

      {/* Academic Explanatory Note */}
      <div
        style={{
          padding: '12px 14px',
          backgroundColor: 'var(--color-surface-sunken)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)',
          lineHeight: '1.55',
          color: 'var(--color-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        <strong style={{ color: 'var(--color-ink)' }}>Academic Notice (Pseudo-polynomial vs NP-Complete):</strong> The 0/1 Knapsack Problem is weakly NP-complete. Dynamic programming solves it in <span className="font-mono" style={{ color: 'var(--color-primary)' }}>O(nW)</span> time, where <span className="font-mono">W</span> is the numeric value of the quota. Because input length is measured in bits (<span className="font-mono">log₂ W</span>), this runtime is polynomial in the <em>value</em> of <span className="font-mono">W</span>, but exponential in the <em>number of bits</em> of <span className="font-mono">W</span>.
      </div>
    </div>
  );
};
