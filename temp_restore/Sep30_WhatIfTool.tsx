import React, { useState, useMemo } from 'react';
import { Card } from '../../components/Card';
import { useAppStore } from '../../../store/useAppStore';
import { normaliseItemSize, normaliseQuota } from '../../../engine/normalizer';
import { solveGreedy } from '../../../engine/greedy';
import { formatBytes } from '../../../engine/fileUtils';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function pct(val: number, total: number) {
  if (total === 0) return '0';
  return ((val / total) * 100).toFixed(1);
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */
export const WhatIfTool: React.FC = () => {
  const { files, quotaBytes, quotaUnitOption } = useAppStore();

  // Hypothetical quota as a percentage of the current quota (50% – 200%)
  const [quotaPct, setQuotaPct] = useState(100);
  // Hypothetical minimum priority threshold (0–100)
  const [minPriority, setMinPriority] = useState(0);

  const totalFileBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  const hypotheticalQuotaBytes = useMemo(
    () => Math.round((quotaPct / 100) * quotaBytes),
    [quotaPct, quotaBytes]
  );

  // Build KnapsackItems from files, applying the minPriority filter
  const result = useMemo(() => {
    if (files.length === 0) return null;
    const { unitBytes } = normaliseQuota(hypotheticalQuotaBytes, quotaUnitOption);
    const quotaUnits = Math.floor(hypotheticalQuotaBytes / unitBytes);

    const items = files
      .filter((f) => !f.isExcluded && f.priority >= minPriority)
      .map((f) => ({
        id: f.id,
        name: f.name,
        originalSize: f.size,
        normalizedSize: normaliseItemSize(f.size, unitBytes),
        value: f.priority,
        category: f.category,
        isPinned: f.isPinned,
        isExcluded: false,
      }));

    if (items.length === 0) return { keptItems: [], droppedItems: [], totalValue: 0, totalSizeKept: 0, steps: [] };

    return solveGreedy(items, { quotaUnits, quotaBytes: hypotheticalQuotaBytes, unitBytes });
  }, [files, hypotheticalQuotaBytes, minPriority, quotaUnitOption]);

  /* ---- empty state ---- */
  if (files.length === 0) {
    return (
      <Card>
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗂️</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--color-ink-2)' }}>No files loaded</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Add files from the Files page to use What-If Explorer.</p>
        </div>
      </Card>
    );
  }

  const keptCount = result?.keptItems.length ?? 0;
  const keptBytes = result?.keptItems.reduce((s, it) => s + it.originalSize, 0) ?? 0;
  const droppedCount = result?.droppedItems.length ?? 0;
  const eligible = (result?.keptItems.length ?? 0) + (result?.droppedItems.length ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <Card>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>
          Adjust hypothetical scenario
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Quota slider */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--color-ink-2)' }}>
              Target quota
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <input
                id="whatif-quota-slider"
                type="range"
                min={10}
                max={300}
                step={5}
                value={quotaPct}
                onChange={(e) => setQuotaPct(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-brass)' }}
              />
              <span style={{
                minWidth: 72, textAlign: 'right', fontWeight: 700,
                color: quotaPct < 100 ? 'var(--color-semantic-move)' : quotaPct > 100 ? 'var(--color-semantic-keep)' : 'var(--color-ink-1)',
                fontSize: 15,
              }}>
                {quotaPct}%
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>
              Current: {formatBytes(quotaBytes)} → Hypothetical:{' '}
              <strong style={{ color: 'var(--color-ink-1)' }}>{formatBytes(hypotheticalQuotaBytes)}</strong>
            </div>
          </div>

          {/* Min priority slider */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--color-ink-2)' }}>
              Minimum priority threshold
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <input
                id="whatif-priority-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={minPriority}
                onChange={(e) => setMinPriority(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-brass)' }}
              />
              <span style={{ minWidth: 72, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>
                ≥ {minPriority}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>
              Only files with priority ≥ {minPriority} are considered ({eligible} of {files.length} files)
            </div>
          </div>
        </div>
      </Card>

      {/* Result KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Files to keep', value: keptCount.toLocaleString(), sub: `${pct(keptCount, eligible)}% of eligible` },
          { label: 'Space used', value: formatBytes(keptBytes), sub: `${pct(keptBytes, hypotheticalQuotaBytes)}% of quota` },
          { label: 'Space free', value: formatBytes(Math.max(0, hypotheticalQuotaBytes - keptBytes)), sub: 'remaining headroom' },
          { label: 'Files left out', value: droppedCount.toLocaleString(), sub: `${pct(droppedCount, eligible)}% of eligible` },
        ].map((kpi) => (
          <Card key={kpi.label} style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink-1)', marginBottom: 2 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{kpi.sub}</div>
          </Card>
        ))}
      </div>

      {/* Visual quota bar */}
      <Card>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-ink-2)' }}>
          <span>Quota utilisation</span>
          <span style={{ fontWeight: 600 }}>
            {formatBytes(keptBytes)} / {formatBytes(hypotheticalQuotaBytes)}
          </span>
        </div>
        <div style={{ height: 14, borderRadius: 7, backgroundColor: 'var(--color-border-hairline)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (keptBytes / hypotheticalQuotaBytes) * 100)}%`,
            borderRadius: 7,
            background: keptBytes > hypotheticalQuotaBytes
              ? 'var(--color-semantic-move)'
              : 'linear-gradient(90deg, var(--color-brass) 0%, var(--color-forest-400) 100%)',
            transition: 'width 300ms ease',
          }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-ink-3)' }}>
          Total file library: {formatBytes(totalFileBytes)} across {files.length.toLocaleString()} files
        </div>
      </Card>

      {/* Top kept files table */}
      {result && result.keptItems.length > 0 && (
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>
            Top files that would be kept ({Math.min(result.keptItems.length, 10)} of {result.keptItems.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-strong)', color: 'var(--color-ink-3)', textAlign: 'left' }}>
                <th style={{ padding: '6px 10px', fontWeight: 600 }}>File</th>
                <th style={{ padding: '6px 10px', fontWeight: 600, textAlign: 'right' }}>Size</th>
                <th style={{ padding: '6px 10px', fontWeight: 600, textAlign: 'right' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {result.keptItems.slice(0, 10).map((item, i) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-hairline)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                  <td style={{ padding: '7px 10px', color: 'var(--color-ink-1)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--color-ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatBytes(item.originalSize)}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      backgroundColor: item.value >= 70 ? 'var(--color-semantic-keep-soft)' : item.value >= 40 ? 'rgba(184,137,60,0.12)' : 'var(--color-border-hairline)',
                      color: item.value >= 70 ? 'var(--color-semantic-keep)' : item.value >= 40 ? 'var(--color-brass)' : 'var(--color-ink-3)',
                    }}>
                      {item.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

