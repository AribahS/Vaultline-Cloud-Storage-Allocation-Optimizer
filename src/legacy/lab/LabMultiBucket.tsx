import React, { useState, useMemo } from 'react';
import { solveMultiBucketSequential, StorageBucket } from '../../engine/variations/multiBucket';
import { KnapsackItem } from '../../engine/types';

export const LabMultiBucket: React.FC = () => {
  const [buckets, setBuckets] = useState<StorageBucket[]>([
    { id: 'b1', name: 'Ultra-Fast NVMe SSD', quotaGb: 8, color: 'var(--kept)' },
    { id: 'b2', name: 'Primary Cloud S3', quotaGb: 14, color: 'var(--color-primary)' },
    { id: 'b3', name: 'Secondary Cold Storage', quotaGb: 20, color: 'var(--highlight)' },
  ]);

  const items: KnapsackItem[] = [
    { id: 'm1', name: 'Main_Database_Postgres.sql', originalSize: 6 * 1024, normalizedSize: 6, value: 10 },
    { id: 'm2', name: 'API_Telemetry_Traces.json', originalSize: 4 * 1024, normalizedSize: 4, value: 8 },
    { id: 'm3', name: 'Frontend_Production_Build.zip', originalSize: 3 * 1024, normalizedSize: 3, value: 7 },
    { id: 'm4', name: 'Raw_Video_Footage.mp4', originalSize: 10 * 1024, normalizedSize: 10, value: 6 },
    { id: 'm5', name: 'Quarterly_Financial_Audits.xlsx', originalSize: 2 * 1024, normalizedSize: 2, value: 9 },
    { id: 'm6', name: 'Disaster_Recovery_VM.ova', originalSize: 12 * 1024, normalizedSize: 12, value: 8 },
    { id: 'm7', name: 'Historical_Logs_2023.tar', originalSize: 8 * 1024, normalizedSize: 8, value: 3 },
  ];

  const handleQuotaChange = (id: string, newQuota: number) => {
    setBuckets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, quotaGb: Math.max(1, newQuota) } : b))
    );
  };

  const result = useMemo(() => {
    return solveMultiBucketSequential(items, buckets);
  }, [items, buckets]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Multiple Buckets: Sequential Knapsack Heuristic
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: '4px' }}>
          Distribute files across multiple independent storage tiers or cloud providers, each with its own capacity limit.
        </p>
        <div style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
          <strong>Compare with classic 0/1:</strong> The Multiple Knapsack Problem (MKP) is strongly NP-hard even when items are identical. A practical approach is sequential DP (filling high-priority buckets first).
        </div>
      </div>

      {/* Bucket Quota Editors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {buckets.map((b) => (
          <div
            key={b.id}
            className="card"
            style={{ padding: '16px', borderLeft: `4px solid ${b.color}` }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
              {b.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>Quota:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={b.quotaGb}
                onChange={(e) => handleQuotaChange(b.id, parseInt(e.target.value) || 1)}
                style={{ width: '64px', padding: '4px 8px', fontWeight: 600, fontSize: 'var(--text-sm)' }}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>GB</span>
            </div>
          </div>
        ))}
      </div>

      {/* Allocations Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {result.allocations.map((alloc) => (
          <div key={alloc.bucket.id} className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: alloc.bucket.color }}>
                {alloc.bucket.name}
              </span>
              <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                {alloc.usedGb} / {alloc.bucket.quotaGb} GB
              </span>
            </div>

            <div style={{ height: '6px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (alloc.usedGb / alloc.bucket.quotaGb) * 100)}%`,
                  backgroundColor: alloc.bucket.color,
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alloc.assignedItems.length === 0 ? (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', textAlign: 'center', padding: '16px 0' }}>
                  No items allocated to this bucket
                </div>
              ) : (
                alloc.assignedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-surface-sunken)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{item.name}</span>
                    <span className="font-mono" style={{ color: 'var(--color-dim)' }}>{item.normalizedSize} GB (v={item.value})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Academic Note */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'var(--color-surface-sunken)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-muted)',
          lineHeight: 1.55,
        }}
      >
        {result.isHeuristicNote}
      </div>
    </div>
  );
};
