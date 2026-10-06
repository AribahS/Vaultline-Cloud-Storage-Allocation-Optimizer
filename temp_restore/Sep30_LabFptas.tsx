import React, { useState, useMemo } from 'react';
import { solveFPTAS } from '../../engine/variations/fptas';
import { KnapsackItem } from '../../engine/types';

export const LabFptas: React.FC = () => {
  const [epsilon, setEpsilon] = useState(0.2); // 20% approximation error bound
  const quotaUnits = 120; // large capacity W

  const items: KnapsackItem[] = [
    { id: 'fp-1', name: 'Database_Cluster_Snap.tar', originalSize: 35, normalizedSize: 35, value: 850 },
    { id: 'fp-2', name: 'High_Res_Render_Asset.blend', originalSize: 45, normalizedSize: 45, value: 920 },
    { id: 'fp-3', name: 'Production_Log_Archive.gz', originalSize: 25, normalizedSize: 25, value: 430 },
    { id: 'fp-4', name: 'Customer_Support_Audio.zip', originalSize: 30, normalizedSize: 30, value: 550 },
    { id: 'fp-5', name: 'Virtual_Machine_Image.qcow', originalSize: 50, normalizedSize: 50, value: 990 },
  ];

  const result = useMemo(() => {
    return solveFPTAS(items, quotaUnits, epsilon);
  }, [items, quotaUnits, epsilon]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Fully Polynomial-Time Approximation Scheme (FPTAS)
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: '4px' }}>
          When capacity W is millions of bytes, standard DP table O(nW) is too large. FPTAS scales down values by K = (ε · V_max) / n, achieving a guaranteed (1 - ε)·OPT approximation with table size polynomial in 1/ε.
        </p>
        <div style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
          <strong>Compare with classic 0/1:</strong> Swaps the table dimension from capacity W to scaled value V, guaranteeing a controllable error margin ε with quadratic speedup.
        </div>
      </div>

      {/* Epsilon Slider & Metrics */}
      <div className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Approximation Tolerance (ε)</span>
          <div className="font-mono" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px' }}>
            ε = {epsilon.toFixed(2)} ({(epsilon * 100).toFixed(0)}%)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 200px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>0.05</span>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.01"
            value={epsilon}
            onChange={(e) => setEpsilon(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-success)' }}
          />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>0.50</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>Guaranteed Bound</div>
            <div className="font-mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-warning)' }}>
              ≥ {(result.guaranteedRatio * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>Achieved Ratio</div>
            <div className="font-mono text-success" style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
              {(result.achievedRatio * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Grid: Exact DP vs FPTAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '12px' }}>
            Exact 0/1 Knapsack
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Exact Optimum Value:</span>
              <span className="font-mono" style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{result.exactOptimalValue} pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Table Columns (Capacity W):</span>
              <span className="font-mono" style={{ color: 'var(--color-dim)' }}>{result.exactTableColumns} columns</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Total DP Cells:</span>
              <span className="font-mono" style={{ color: 'var(--color-dim)' }}>{items.length * result.exactTableColumns} cells</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px', border: '1.5px solid var(--color-primary-glow)' }}>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '12px' }}>
            FPTAS Approximate Knapsack
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Approximated Value:</span>
              <span className="font-mono text-success" style={{ fontWeight: 700 }}>{result.approxValueOriginal} pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Scaling Factor K:</span>
              <span className="font-mono" style={{ color: 'var(--color-dim)' }}>{result.scalingFactorK}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Scaled Value Table Dimension:</span>
              <span className="font-mono" style={{ color: 'var(--color-dim)' }}>{result.scaledTableColumns} columns</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Cell Space Reduction:</span>
              <span className="font-mono text-success" style={{ fontWeight: 600 }}>~{result.speedupPercentage}% fewer cells</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

