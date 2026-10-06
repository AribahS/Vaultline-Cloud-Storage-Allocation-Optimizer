import React, { useState, useMemo } from 'react';
import { solveStorageTiers, StorageTierId, DEFAULT_STORAGE_TIERS, TierItemInput } from '../../engine/variations/storageTiers';

export const LabStorageTiers: React.FC = () => {
  const [budget, setBudget] = useState(1.5); // $1.50 / month
  const [items] = useState<TierItemInput[]>([
    { id: 't1', name: 'Database_Daily_Dump.sql', sizeGb: 25, basePriority: 10 },
    { id: 't2', name: 'Raw_Video_Footage.mov', sizeGb: 40, basePriority: 7 },
    { id: 't3', name: 'Company_Tax_Returns_2023.pdf', sizeGb: 2, basePriority: 9 },
    { id: 't4', name: 'Development_Docker_Cache.tar', sizeGb: 35, basePriority: 4 },
    { id: 't5', name: 'Customer_Support_Audio.wav', sizeGb: 15, basePriority: 6 },
  ]);

  const result = useMemo(() => {
    return solveStorageTiers(items, budget);
  }, [items, budget]);

  const tierColors: Record<StorageTierId, string> = {
    hot: 'var(--color-success)',
    cool: 'var(--color-primary)',
    archive: 'var(--color-warning)',
    skip: 'var(--color-dim)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Intro & Compare Header */}
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Storage Tiers: Multiple-Choice Knapsack (MCKP)
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: '4px' }}>
          Files don't have to be strictly binary (0 or 1). Instead of keeping full or discarding, files can be demoted to Cool (75% priority, 0.4x cost) or Glacier Archive (45% priority, 0.1x cost).
        </p>
        <div style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
          <strong>Compare with classic 0/1:</strong> Replaces binary decision {'{0, 1}'} with a set of mutually exclusive tier choices per item, adding a tier group dimension to the DP state.
        </div>
      </div>

      {/* Budget Slider */}
      <div className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Cloud Budget</span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px' }}>
            ${budget.toFixed(2)}/mo
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>$0.20</span>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={budget}
            onChange={(e) => setBudget(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--color-success)' }}
          />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>$3.00</span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>Total Achieved Priority</div>
          <div className="font-mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)' }}>
            {result.totalPriority} pts <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>(${(result.totalCost).toFixed(2)} spent)</span>
          </div>
        </div>
      </div>

      {/* Tier Allocations Table */}
      <div className="card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '14px', color: 'var(--color-ink)' }}>
          Optimal File Placement Across Tiers
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {result.allocations.map((alloc) => (
            <div
              key={alloc.item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'var(--color-surface-sunken)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{alloc.item.name}</span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '2px' }}>
                  {alloc.item.sizeGb} GB • Base Priority: {alloc.item.basePriority}
                </div>
              </div>

              {/* Chosen tier chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink)' }}>
                    ${alloc.monthlyCost.toFixed(3)}/mo
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-dim)' }}>
                    eff. prio: {alloc.effectivePriority}
                  </div>
                </div>

                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: tierColors[alloc.chosenTier],
                    backgroundColor: 'var(--color-surface)',
                    border: `1.5px solid ${tierColors[alloc.chosenTier]}`,
                  }}
                >
                  {DEFAULT_STORAGE_TIERS[alloc.chosenTier].name.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

