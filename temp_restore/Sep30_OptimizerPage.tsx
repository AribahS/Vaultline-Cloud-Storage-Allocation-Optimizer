import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { KpiCard } from '../components/KpiCard';
import { Treemap } from '../components/Treemap';
import { SegmentedControl } from '../components/SegmentedControl';
import { useAppStore } from '../../store/useAppStore';
import { BYTE_UNITS } from '../../engine/normalizer';
import {
  Play, Settings, PlusCircle, Trash2, CheckCircle, ArrowRightLeft,
  TrendingUp, Clock, AlertTriangle, Pin, EyeOff
} from 'lucide-react';

const formatBytesHuman = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DESTINATION_PRESETS = [
  { label: 'Phone (64 GB)', bytes: 64 * BYTE_UNITS.GB },
  { label: 'Phone (128 GB)', bytes: 128 * BYTE_UNITS.GB },
  { label: 'External drive (1 TB)', bytes: 1 * BYTE_UNITS.TB },
  { label: 'Google account (15 GB)', bytes: 15 * BYTE_UNITS.GB },
  { label: 'iCloud (5 GB)', bytes: 5 * BYTE_UNITS.GB },
  { label: 'Email (25 MB)', bytes: 25 * BYTE_UNITS.MB },
];

export const OptimizerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    files, quotaBytes, setQuotaBytes, places, knapsackResult,
    isComputing, triggerRecompute, lastComputeError
  } = useAppStore();

  const [resultTab, setResultTab] = useState('Plan');
  const [showPresets, setShowPresets] = useState(false);
  const [quotaInput, setQuotaInput] = useState(String(quotaBytes / BYTE_UNITS.GB));

  const keptIds = useMemo(() => new Set(knapsackResult?.keptItems.map(i => i.id) || []), [knapsackResult]);
  const pinnedCount = files.filter(f => f.isPinned).length;
  const excludedCount = files.filter(f => f.isExcluded).length;
  const importanceRetained = knapsackResult
    ? Math.round((knapsackResult.totalValue / knapsackResult.maxPossibleValue) * 100)
    : 0;

  const handleQuotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuotaInput(e.target.value);
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      setQuotaBytes(val * BYTE_UNITS.GB);
    }
  };

  return (
    <div className="page-container animate-page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Optimizer</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Configuration pane */}
        <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Destination */}
          <Card>
            <h3 style={{ margin: '0 0 16px 0' }}>Destination</h3>
            <div style={{ marginBottom: '12px' }}>
              <label className="text-caption text-ink-3" style={{ display: 'block', marginBottom: '4px' }}>
                Available space (GB)
              </label>
              <input
                type="number"
                value={quotaInput}
                onChange={handleQuotaChange}
                min={0}
                step={0.5}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border-strong)',
                  backgroundColor: 'var(--color-canvas)',
                  fontSize: '14px',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--color-ink)',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Button variant="ghost" size="sm" onClick={() => setShowPresets(!showPresets)} style={{ width: '100%' }}>
                Quick presets
              </Button>
              {showPresets && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                  backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border-hairline)',
                  borderRadius: '8px', boxShadow: 'var(--shadow-soft-lg)', zIndex: 100, overflow: 'hidden'
                }}>
                  {DESTINATION_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setQuotaBytes(p.bytes);
                        setQuotaInput(String(p.bytes / BYTE_UNITS.GB));
                        setShowPresets(false);
                      }}
                      style={{
                        display: 'block', width: '100%', padding: '8px 16px',
                        border: 'none', background: 'none', textAlign: 'left',
                        fontSize: '13px', cursor: 'pointer', color: 'var(--color-ink)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Constraints */}
          <Card>
            <h3 style={{ margin: '0 0 12px 0' }}>Constraints</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-ink-2"><Pin size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Always keep</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{pinnedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-ink-2"><EyeOff size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Never keep</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{excludedCount}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/files')} style={{ marginTop: '4px' }}>
                Manage in Files
              </Button>
            </div>
          </Card>

          {/* Method */}
          <Card>
            <h3 style={{ margin: '0 0 12px 0' }}>Method</h3>
            <p className="text-caption text-ink-3" style={{ marginBottom: '12px' }}>
              Optimal (dynamic programming) finds the provably best plan.
            </p>
            <div style={{ fontSize: '13px', color: 'var(--color-ink-2)' }}>
              {files.length} items, {formatBytesHuman(quotaBytes)} capacity
            </div>
          </Card>

          {/* Run */}
          <Button
            variant="primary"
            size="md"
            icon={isComputing ? undefined : <Play size={16} />}
            disabled={isComputing || files.length === 0}
            onClick={() => triggerRecompute()}
            style={{ width: '100%' }}
          >
            {isComputing ? 'Computing...' : 'Run optimizer'}
          </Button>

          {lastComputeError && (
            <Card style={{ backgroundColor: '#fdf2f1', border: '1px solid #e8c6c1' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} color="var(--color-semantic-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div className="text-body-small" style={{ color: 'var(--color-semantic-danger)' }}>
                  {lastComputeError}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Result pane */}
        <div>
          {!knapsackResult ? (
            <Card style={{ textAlign: 'center', padding: '80px 24px' }}>
              <Play size={48} color="var(--color-ink-3)" style={{ margin: '0 auto 16px' }} />
              <h3>No results yet</h3>
              <p className="text-body-small text-ink-3" style={{ marginTop: '8px' }}>
                Configure your destination and run the optimizer to see results.
              </p>
            </Card>
          ) : (
            <>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <KpiCard label="Importance" value={`${importanceRetained}%`} accentColor="var(--color-brass)" />
                <KpiCard label="Kept" value={knapsackResult.keptItems.length.toLocaleString()} subtitle={formatBytesHuman(knapsackResult.totalSizeKept)} />
                <KpiCard label="Move" value={knapsackResult.droppedItems.length.toLocaleString()} subtitle={formatBytesHuman(knapsackResult.totalSizeDropped)} accentColor="var(--color-semantic-move)" />
                <KpiCard label="Runtime" value={`${knapsackResult.executionTimeMs}ms`} subtitle={`${knapsackResult.cellsComputed.toLocaleString()} cells`} />
              </div>

              {/* Tabs */}
              <div style={{ marginBottom: '16px' }}>
                <SegmentedControl options={['Plan', 'Keep list', 'Move list']} selected={resultTab} onChange={setResultTab} />
              </div>

              {resultTab === 'Plan' && (
                <Card>
                  <Treemap
                    files={files.map(f => ({ id: f.id, name: f.name, category: f.category, size: f.size }))}
                    keptIds={keptIds}
                    width={760}
                    height={400}
                  />
                </Card>
              )}

              {resultTab === 'Keep list' && (
                <Card>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: 'var(--color-surface-sunken)' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--color-border-hairline)' }}>Name</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--color-border-hairline)' }}>Size</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--color-border-hairline)' }}>Importance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {knapsackResult.keptItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-hairline)' }}>
                          <td style={{ padding: '8px 12px' }}>{item.name}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatBytesHuman(item.originalSize)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}

              {resultTab === 'Move list' && (
                <Card>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: 'var(--color-surface-sunken)' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--color-border-hairline)' }}>Name</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--color-border-hairline)' }}>Size</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--color-border-hairline)' }}>Importance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {knapsackResult.droppedItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-hairline)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--color-semantic-move)' }}>{item.name}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatBytesHuman(item.originalSize)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}

              <div style={{ marginTop: '16px' }}>
                <Button variant="ghost" size="sm" onClick={() => navigate('/algorithm')}>
                  Explain this plan (Algorithm analysis)
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

