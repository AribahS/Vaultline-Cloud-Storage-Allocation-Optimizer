import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { KpiCard } from '../components/KpiCard';
import { Treemap } from '../components/Treemap';
import { OptimizationVisualizer } from '../components/OptimizationVisualizer';
import { SegmentedControl } from '../components/SegmentedControl';
import { useAppStore } from '../../store/useAppStore';
import { BYTE_UNITS } from '../../engine/normalizer';
import { formatSize, pluralize } from '../../lib/format';
import {
  Play, CheckCircle, ArrowRightLeft,
  TrendingUp, Clock, AlertTriangle, Pin, EyeOff, ChevronDown, ChevronUp
} from 'lucide-react';

// A6: Quick presets as chips
const PRESET_CHIPS = [
  { label: '1 GB', bytes: 1 * BYTE_UNITS.GB },
  { label: '5 GB', bytes: 5 * BYTE_UNITS.GB },
  { label: '15 GB', bytes: 15 * BYTE_UNITS.GB },
  { label: '64 GB', bytes: 64 * BYTE_UNITS.GB },
  { label: '128 GB', bytes: 128 * BYTE_UNITS.GB },
  { label: '256 GB', bytes: 256 * BYTE_UNITS.GB },
  { label: '1 TB', bytes: 1 * BYTE_UNITS.TB },
];

const UNIT_OPTIONS = [
  { label: 'MB', multiplier: BYTE_UNITS.MB },
  { label: 'GB', multiplier: BYTE_UNITS.GB },
  { label: 'TB', multiplier: BYTE_UNITS.TB },
];

export const OptimizerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    files, quotaBytes, setQuotaBytes, knapsackResult,
    isComputing, triggerRecompute, lastComputeError,
    isPlanStale, computeProgress, cancelCompute
  } = useAppStore();

  const [resultTab, setResultTab] = useState('Plan');
  const [inputValue, setInputValue] = useState('15');
  const [inputUnit, setInputUnit] = useState(BYTE_UNITS.GB);
  const treemapContainerRef = useRef<HTMLDivElement>(null);
  const [treemapWidth, setTreemapWidth] = useState(760);

  // A6: ResizeObserver for treemap
  useEffect(() => {
    if (!treemapContainerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setTreemapWidth(Math.max(320, entry.contentRect.width - 48));
      }
    });
    ro.observe(treemapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Sync input from store
  useEffect(() => {
    const unitLabel = inputUnit;
    setInputValue(String(Math.round((quotaBytes / unitLabel) * 10) / 10));
  }, [quotaBytes, inputUnit]);

  const keptIds = useMemo(() => new Set(knapsackResult?.keptItems.map(i => i.id) || []), [knapsackResult]);
  const pinnedCount = files.filter(f => f.isPinned).length;
  const excludedCount = files.filter(f => f.isExcluded).length;
  const importanceRetained = knapsackResult
    ? Math.round((knapsackResult.totalValue / knapsackResult.maxPossibleValue) * 100)
    : 0;
  const totalFileBytes = files.reduce((total, file) => total + file.size, 0);
  const sliderQuotaBytes = Math.min(quotaBytes, totalFileBytes);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      setQuotaBytes(val * inputUnit);
    }
  };

  const handlePresetClick = (bytes: number) => {
    setQuotaBytes(bytes);
    const best = UNIT_OPTIONS.find(u => bytes >= u.multiplier) || UNIT_OPTIONS[1];
    setInputUnit(best.multiplier);
    setInputValue(String(Math.round((bytes / best.multiplier) * 10) / 10));
  };

  return (
    <div className="page-container animate-page-enter">
      <h1 className="page-title">Optimizer</h1>
      {/* The main action stays with the plan controls below. */}
      {files.length > 2000 && (
        <Card style={{ marginBottom: '16px', backgroundColor: 'var(--color-surface-sunken)', border: '1px solid var(--color-border-hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-2)', fontSize: '13px' }}>
            <AlertTriangle size={16} color="var(--color-brass)" />
                  <span>Auto-recompute is disabled for large datasets ({pluralize(files.length, 'file')} &gt; 2000). Manual recompute required.</span>
          </div>
        </Card>
      )}

      {isPlanStale && files.length > 0 && !isComputing && (
        <Card style={{ marginBottom: '24px', backgroundColor: 'var(--paper)', border: '1px solid var(--color-brass)', boxShadow: 'var(--shadow-level-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} color="var(--color-brass)" />
              <div>
                <strong style={{ display: 'block', color: 'var(--color-ink)', fontSize: '14px' }}>Plan is out of date. Recompute required.</strong>
                <span className="text-caption text-ink-2">Files or capacity changed since the last calculation.</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" icon={<Play size={14} />} onClick={() => triggerRecompute()}>
              Find the best plan
            </Button>
          </div>
        </Card>
      )}

      {isComputing && (
        <Card style={{ marginBottom: '24px', backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-brass)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="var(--color-brass)" />
                <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>
                  {computeProgress?.stage || 'Computing…'}
                </strong>
              </div>
              <Button variant="ghost" size="sm" onClick={() => cancelCompute()}>Cancel</Button>
            </div>
            <div style={{ width: '100%', backgroundColor: 'var(--color-surface-sunken)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${computeProgress?.percent || 10}%`, height: '100%', backgroundColor: 'var(--color-brass)', transition: 'width 0.2s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-ink-3)' }}>
              <span>Cells computed: {computeProgress?.cellsComputed?.toLocaleString() || 0}</span>
              <span>{computeProgress?.percent || 0}%</span>
            </div>
          </div>
        </Card>
      )}

      <div className="optimizer-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* Left: Configuration pane */}
        <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Destination */}
          <Card>
            <h3 style={{ margin: '0 0 16px 0' }}>Space available</h3>

            {/* A6: Quick preset chips */}
            <div style={{ marginBottom: '14px' }}>
              <label className="text-caption text-ink-3" style={{ display: 'block', marginBottom: '8px' }}>
                Quick presets
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_CHIPS.map(chip => {
                  const isActive = Math.abs(quotaBytes - chip.bytes) < 1;
                  return (
                    <button
                      key={chip.label}
                      onClick={() => handlePresetClick(chip.bytes)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: `1px solid ${isActive ? 'var(--color-forest-500)' : 'var(--color-border-strong)'}`,
                        backgroundColor: isActive ? 'var(--color-forest-500)' : 'var(--color-surface-raised)',
                        color: isActive ? 'var(--card)' : 'var(--color-ink-2)',
                        fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual input with unit select */}
            <div style={{ marginBottom: '12px' }}>
              <label className="text-caption text-ink-3" style={{ display: 'block', marginBottom: '4px' }}>
                Custom amount
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  value={inputValue}
                  onChange={handleInputChange}
                  min={0}
                  step={0.5}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border-strong)',
                    backgroundColor: 'var(--color-canvas)',
                    fontSize: '14px',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-ink)',
                    outline: 'none',
                  }}
                />
                <select
                  value={inputUnit}
                  onChange={e => {
                    const newUnit = Number(e.target.value);
                    setInputUnit(newUnit);
                    const val = parseFloat(inputValue);
                    if (!isNaN(val) && val > 0) setQuotaBytes(val * newUnit);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border-strong)',
                    backgroundColor: 'var(--color-canvas)',
                    fontSize: '13px',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  {UNIT_OPTIONS.map(u => (
                    <option key={u.label} value={u.multiplier}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={totalFileBytes}
              step="any"
              value={sliderQuotaBytes}
              disabled={totalFileBytes === 0}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setQuotaBytes(val);
                setInputValue(String(Math.round((val / inputUnit) * 10) / 10));
              }}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--color-ink-3)', textAlign: 'center', marginTop: '4px' }}>
              {formatSize(sliderQuotaBytes)}
            </div>
          </Card>

          {/* Constraints */}
          <Card>
            <h3 style={{ margin: '0 0 12px 0' }}>Constraints</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-ink-2"><Pin size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />Always keep</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{pinnedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-ink-2"><EyeOff size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />Never keep</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{excludedCount}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/files')} style={{ marginTop: '4px' }}>
                Manage in Files
              </Button>
            </div>
          </Card>

          {/* A2: Single primary Run button */}
          <Button
            variant="primary"
            size="md"
            icon={isComputing ? undefined : <Play size={16} />}
            disabled={isComputing || files.length === 0}
            onClick={() => triggerRecompute()}
            style={{ width: '100%' }}
          >
            {isComputing ? 'Computing…' : 'Find the best plan'}
          </Button>

          {lastComputeError && (
            <Card style={{ backgroundColor: 'var(--color-danger-surface)', border: '1px solid var(--color-danger-border)' }}>
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
              {/* C7: Empty state SVG */}
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ margin: '0 auto 16px', display: 'block' }}>
                <rect x="8" y="20" width="48" height="36" rx="6" fill="var(--color-surface-sunken)" stroke="var(--color-border-strong)" strokeWidth="1.5" />
                <circle cx="32" cy="38" r="8" fill="var(--color-forest-50)" stroke="var(--color-brass)" strokeWidth="1.5" />
                <path d="M29 38L31 40L35 36" stroke="var(--color-brass)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h3>No results yet</h3>
              <p className="text-body-small text-ink-3" style={{ marginTop: '8px' }}>
                Set your space above and click "Find the best plan" to see results.
              </p>
            </Card>
          ) : (
            <>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <KpiCard label="Importance kept" value={`${importanceRetained}%`} accentColor="var(--color-brass)" />
                <KpiCard label="Kept" value={pluralize(knapsackResult.keptItems.length, 'file')} subtitle={formatSize(knapsackResult.totalSizeKept)} />
                <KpiCard label="Files to move" value={pluralize(knapsackResult.droppedItems.length, 'file')} subtitle={formatSize(knapsackResult.totalSizeDropped)} accentColor="var(--color-semantic-move)" />
                <KpiCard label="Runtime" value={`${knapsackResult.executionTimeMs < 1 ? '<1' : Math.round(knapsackResult.executionTimeMs)}ms`} subtitle={`${knapsackResult.cellsComputed.toLocaleString()} cells`} />
              </div>

              {/* Tabs */}
              <div style={{ marginBottom: '16px' }}>
                <SegmentedControl options={['Plan', 'Optimization Visualizer', 'Keep list', 'Move list']} selected={resultTab} onChange={setResultTab} />
              </div>

              {resultTab === 'Plan' && (
                <Card ref={treemapContainerRef}>
                  <Treemap
                    files={files.map(f => ({ id: f.id, name: f.name, category: f.category, size: f.size, priority: f.priority }))}
                    keptIds={keptIds}
                    width={treemapWidth}
                    height={400}
                  />
                </Card>
              )}

              {resultTab === 'Optimization Visualizer' && <OptimizationVisualizer />}

              {resultTab === 'Keep list' && (
                <Card style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'fixed' }}>
                      <thead style={{ backgroundColor: 'var(--color-surface-sunken)' }}>
                        <tr>
                          <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid var(--color-border-hairline)' }}>Name</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid var(--color-border-hairline)', width: '110px', whiteSpace: 'nowrap' }}>Size</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid var(--color-border-hairline)', width: '110px', whiteSpace: 'nowrap' }}>Importance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {knapsackResult.keptItems.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-hairline)' }}>
                            <td style={{ padding: '10px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatSize(item.originalSize)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{item.value}/10</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {resultTab === 'Move list' && (
                <Card style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'fixed' }}>
                      <thead style={{ backgroundColor: 'var(--color-surface-sunken)' }}>
                        <tr>
                          <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid var(--color-border-hairline)' }}>Name</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid var(--color-border-hairline)', width: '110px', whiteSpace: 'nowrap' }}>Size</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid var(--color-border-hairline)', width: '110px', whiteSpace: 'nowrap' }}>Importance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {knapsackResult.droppedItems.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-hairline)' }}>
                            <td style={{ padding: '10px 14px', color: 'var(--color-semantic-move)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatSize(item.originalSize)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{item.value}/10</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

