import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { Card } from '../../components/Card';
import { KnapsackItem } from '../../../engine/types';
import { solveFullKnapsack } from '../../../engine/knapsack';
import { solveFPTAS } from '../../../engine/variations/fptas';

export const ApproximateTool: React.FC = () => {
  const { files, quotaBytes } = useAppStore();
  const [epsilon, setEpsilon] = useState(0.2);

  const cmp = useMemo(() => {
    if (files.length === 0) return null;
    const quota = quotaBytes || 10 * 1024 * 1024 * 1024;
    const unitBytes = 1024 * 1024;
    const quotaUnits = Math.max(1, Math.floor(quota / unitBytes));
    const items: KnapsackItem[] = files.map(f => ({
      id: f.id, name: f.name, originalSize: f.size, normalizedSize: Math.max(1, Math.round(f.size / unitBytes)), value: f.priority
    }));
    
    const t0 = performance.now();
    const ex = solveFullKnapsack(items, { quotaUnits, quotaBytes: quota, unitBytes });
    const t1 = performance.now();
    const fp = solveFPTAS(items, quotaUnits, epsilon);
    const t2 = performance.now();
    
    return {
      exTime: t1 - t0, fpTime: t2 - t1, exVal: ex.totalValue, fpVal: fp.approxValueOriginal
    };
  }, [files, quotaBytes, epsilon]);

  if (files.length === 0) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
          <h3>No files available</h3>
        </div>
      </Card>
    );
  }

  return (
    <Card title="FPTAS Benchmark">
      <div style={{ marginBottom: '20px' }}>
        <label>Epsilon: {epsilon.toFixed(2)}</label>
        <input type="range" min="0.05" max="0.5" step="0.05" value={epsilon} onChange={e => setEpsilon(parseFloat(e.target.value))} style={{ width: '100%', maxWidth: '300px', display: 'block' }} />
      </div>
      {cmp && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '16px', border: '1px solid var(--color-hairline)' }}>
            <h4>Exact DP</h4>
            <p>Value: {cmp.exVal}</p>
            <p>Time: {cmp.exTime.toFixed(2)} ms</p>
          </div>
          <div style={{ padding: '16px', border: '1px solid var(--color-hairline)' }}>
            <h4>FPTAS Approximation</h4>
            <p>Value: {cmp.fpVal}</p>
            <p>Time: {cmp.fpTime.toFixed(2)} ms</p>
          </div>
        </div>
      )}
    </Card>
  );
};
