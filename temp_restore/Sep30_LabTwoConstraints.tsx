import React, { useState, useMemo } from 'react';
import { solveDualConstraint, DualConstraintItem } from '../../engine/variations/twoConstraints';

export const LabTwoConstraints: React.FC = () => {
  const [storageCap, setStorageCap] = useState(12); // GB
  const [bandwidthCap, setBandwidthCap] = useState(15); // Mbps
  const [sliceRow, setSliceRow] = useState(4);

  const items: DualConstraintItem[] = [
    { id: 'd1', name: 'Database_Sync_Service', storageGb: 4, bandwidthMbps: 8, priority: 10 },
    { id: 'd2', name: 'High_Res_Video_Stream', storageGb: 6, bandwidthMbps: 10, priority: 9 },
    { id: 'd3', name: 'Web_Frontend_Assets', storageGb: 2, bandwidthMbps: 2, priority: 8 },
    { id: 'd4', name: 'Analytics_Batch_Worker', storageGb: 5, bandwidthMbps: 3, priority: 7 },
  ];

  const result = useMemo(() => {
    return solveDualConstraint(items, storageCap, bandwidthCap, sliceRow);
  }, [items, storageCap, bandwidthCap, sliceRow]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Multi-Dimensional Knapsack: Storage + Bandwidth Constraints
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: '4px' }}>
          Real cloud workloads consume both physical disk capacity (GB) and network egress bandwidth (Mbps).
        </p>
        <div style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
          <strong>Compare with classic 0/1:</strong> Adds a second capacity dimension to DP, inflating time complexity from O(nW) to O(n · W · B). The 3D table is sliced below.
        </div>
      </div>

      {/* Constraints Controls */}
      <div className="card" style={{ padding: '18px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-dim)' }}>Storage Cap: <strong style={{ color: 'var(--color-ink)' }}>{storageCap} GB</strong></span>
          </div>
          <input
            type="range"
            min="4"
            max="18"
            value={storageCap}
            onChange={(e) => setStorageCap(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-success)' }}
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-dim)' }}>Bandwidth Cap: <strong style={{ color: 'var(--color-ink)' }}>{bandwidthCap} Mbps</strong></span>
          </div>
          <input
            type="range"
            min="4"
            max="22"
            value={bandwidthCap}
            onChange={(e) => setBandwidthCap(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
        </div>

        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>2D Table Slice at Row:</span>
          <select
            value={sliceRow}
            onChange={(e) => setSliceRow(parseInt(e.target.value))}
            style={{ marginLeft: '8px', padding: '6px 10px', fontSize: 'var(--text-xs)' }}
          >
            {items.map((it, idx) => (
              <option key={it.id} value={idx + 1}>
                Row {idx + 1}: {it.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bandwidth Violation Warning */}
      {result.storageOnlyViolatesBandwidth && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-danger-surface)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-ink)',
          }}
        >
          <strong style={{ color: 'var(--color-danger)' }}>⚠ Multi-constraint Warning: </strong>
          Solving for storage alone would select files requiring <strong>{result.storageOnlyBandwidthUsed} Mbps</strong> of network bandwidth, violating your {bandwidthCap} Mbps bandwidth quota! The dual-constraint DP prevents this violation.
        </div>
      )}

      {/* 2D Slice View of the 3D DP Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
            2D Slice of DP State: dp[{result.sliceRowIndex}][w][b]
          </h4>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
            Rows = Storage (w), Cols = Bandwidth (b)
          </span>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
          <table
            style={{
              borderCollapse: 'collapse',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-sunken)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '6px 8px', color: 'var(--color-dim)' }}>w \ b</th>
                {Array.from({ length: bandwidthCap + 1 }, (_, b) => (
                  <th key={b} style={{ padding: '6px 8px', color: 'var(--color-dim)' }}>{b}M</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.slice2D.map((rowArr, w) => (
                <tr key={w} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--color-dim)', backgroundColor: 'var(--color-surface-sunken)' }}>
                    {w}G
                  </td>
                  {rowArr.map((val, b) => (
                    <td
                      key={b}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: val > 0 ? 'var(--color-primary-surface)' : 'transparent',
                        color: val > 0 ? 'var(--color-primary)' : 'var(--color-dim)',
                        fontWeight: val > 0 ? 600 : 400,
                      }}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

