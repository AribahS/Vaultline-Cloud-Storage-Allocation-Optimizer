import React, { useState, useMemo } from 'react';
import { solveFractionalKnapsack, FractionalItem } from '../../engine/variations/fractional';

export const LabFractional: React.FC = () => {
  const [quotaGb, setQuotaGb] = useState(10);
  const items: FractionalItem[] = [
    { id: 'f1', name: 'Raw_Video_Archive.mov', sizeGb: 6, priority: 30 }, // ratio = 5.0
    { id: 'f2', name: 'Database_Snapshots.tar', sizeGb: 5, priority: 24 }, // ratio = 4.8
    { id: 'f3', name: 'Telemetry_Logs.dump', sizeGb: 5, priority: 24 }, // ratio = 4.8
  ];

  // 0/1 optimum on this exact set with quota 10 is 48 (items f2 + f3)
  const zeroOneOpt = 48;

  const result = useMemo(() => {
    return solveFractionalKnapsack(items, quotaGb, zeroOneOpt);
  }, [quotaGb]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Continuous Relaxation: Fractional Knapsack
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: '4px' }}>
          When items can be divided continuously (e.g. streaming chunks or compressed shards), the greedy algorithm by density is provably optimal.
        </p>
        <div style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
          <strong>Compare with classic 0/1:</strong> Fractional knapsack is solvable in O(n log n) by a pure greedy strategy, and its solution acts as a rigorous mathematical upper bound on the 0/1 integer optimum.
        </div>
      </div>

      {/* Quota slider & Upper bound comparison */}
      <div className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Continuous Quota</span>
          <div className="font-mono" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-ink)', marginTop: '2px' }}>
            {quotaGb} GB
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 200px' }}>
          <input
            type="range"
            min="3"
            max="16"
            value={quotaGb}
            onChange={(e) => setQuotaGb(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-success)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>Fractional Optimum</div>
            <div className="font-mono text-success" style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
              {result.totalPriorityAchieved} pts
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>0/1 Integer Opt</div>
            <div className="font-mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-muted)' }}>
              {zeroOneOpt} pts
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>Integrality Gap</div>
            <div className="font-mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-warning)' }}>
              +{result.gapPriority} pts
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chunk Bars */}
      <div className="card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '14px', color: 'var(--color-ink)' }}>
          Fractional Fill Breakdown
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {result.chunks.map((chunk) => {
            const pct = Math.round(chunk.fractionTaken * 100);

            return (
              <div
                key={chunk.item.id}
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--color-surface-sunken)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{chunk.item.name}</span>
                  <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
                    Density: {chunk.ratio.toFixed(2)} pts/GB • {chunk.sizeTakenGb} of {chunk.item.sizeGb} GB taken ({pct}%)
                  </span>
                </div>

                {/* Progress fill bar */}
                <div style={{ height: '10px', backgroundColor: 'var(--color-surface)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: chunk.isPartial ? 'var(--color-warning)' : 'var(--color-success)',
                      transition: 'width var(--transition-normal)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '6px' }}>
                  <span>{chunk.isPartial ? 'Split Chunk (Partial file slice)' : chunk.fractionTaken === 1 ? '100% Retained' : '0% (Exceeded Quota)'}</span>
                  <span className="font-mono" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>+{chunk.priorityAchieved} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

