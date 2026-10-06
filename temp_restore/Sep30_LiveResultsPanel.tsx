import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { VaultTreemap } from './VaultTreemap';
import { QuotaCurveChart } from './QuotaCurveChart';
import { formatBytes } from '../../engine/normalizer';
import {
  generateCsvExport,
  generateJsonExport,
  generateTextSummary,
  generateActionPlanBash,
  generateActionPlanPowerShell,
  downloadTextFile,
} from '../../engine/exportPlan';

export const LiveResultsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { files, quotaBytes, knapsackResult, isComputing, lastComputeError } = useAppStore();
  const [activeTab, setActiveTab] = useState<'keep' | 'move'>('keep');
  const [copiedText, setCopiedText] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const res = knapsackResult;

  if (lastComputeError) {
    return (
      <div className="card" style={{ padding: '28px', border: '1.5px solid var(--color-danger)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-danger)', marginBottom: '12px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Something went wrong</h3>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', lineHeight: 1.6 }}>
          {lastComputeError}
        </p>
      </div>
    );
  }

  if (!res || isComputing) {
    return (
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: 'var(--radius-full)',
          border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
          Finding the best combination…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const keptPctValue = res.maxPossibleValue > 0
    ? Math.round((res.totalValue / res.maxPossibleValue) * 100)
    : 0;

  const storageUsedPercent = Math.min(100, Math.round((res.totalSizeKept / Math.max(1, quotaBytes)) * 100));

  const handleCopySummary = () => {
    const text = generateTextSummary(files, res);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleExportCsv = () => { downloadTextFile('vaultline_plan.csv', generateCsvExport(files, res), 'text/csv'); setShowExportMenu(false); };
  const handleExportJson = () => { downloadTextFile('vaultline_plan.json', generateJsonExport(files, res), 'application/json'); setShowExportMenu(false); };
  const handleExportBash = () => { downloadTextFile('vaultline_plan.sh', generateActionPlanBash(files, res), 'text/x-sh'); setShowExportMenu(false); };
  const handleExportPowerShell = () => { downloadTextFile('vaultline_plan.ps1', generateActionPlanPowerShell(files, res), 'text/plain'); setShowExportMenu(false); };

  const greedyVal = res.greedyResult?.totalValue ?? 0;
  const gap = res.totalValue - greedyVal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Hero Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <MetricCard
          label="Importance kept"
          value={`${res.totalValue}`}
          sub={`${keptPctValue}% of total`}
          valueColor="var(--color-success)"
          suffix={` / ${res.maxPossibleValue}`}
        />
        <MetricCard
          label="Space used"
          value={`${storageUsedPercent}%`}
          sub={`${formatBytes(res.totalSizeKept)} of ${formatBytes(quotaBytes)}`}
          valueColor="var(--color-primary)"
        />
        <MetricCard
          label="Files kept"
          value={`${res.keptItems.length}`}
          sub="Safe in your cloud"
          valueColor="var(--color-success)"
        />
        <MetricCard
          label="Files to move"
          value={`${res.droppedItems.length}`}
          sub={`${formatBytes(res.totalSizeDropped)} to archive`}
          valueColor="var(--color-dropped)"
        />
      </div>

      {/* Storage bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '8px', color: 'var(--color-muted)' }}>
          <span>Used: <strong style={{ color: 'var(--color-ink)' }}>{formatBytes(res.totalSizeKept)}</strong></span>
          <span className="font-mono">Limit: {formatBytes(quotaBytes)}</span>
        </div>
        <div style={{ height: '8px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${storageUsedPercent}%`,
              background: 'linear-gradient(90deg, var(--color-success), var(--color-primary))',
              borderRadius: '4px',
              transition: 'width var(--transition-normal)',
            }}
          />
        </div>
      </div>

      {/* Treemap */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: '2px' }}>
              Storage map
            </h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
              Area = file size. Green = keep. Hatched = move to archive.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {gap > 0 && (
              <span className="chip chip-success">
                Smart plan: +{gap} pts vs greedy
              </span>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/how-it-works')}
            >
              See why →
            </button>
          </div>
        </div>
        <VaultTreemap files={files} result={res} quotaBytes={quotaBytes} />
      </div>

      {/* Keep / Move Lists + Export */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button
              onClick={() => setActiveTab('keep')}
              style={{
                padding: '6px 14px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'keep' ? 'var(--color-success-surface)' : 'transparent',
                color: activeTab === 'keep' ? 'var(--color-success)' : 'var(--color-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              Keep ({res.keptItems.length})
            </button>
            <button
              onClick={() => setActiveTab('move')}
              style={{
                padding: '6px 14px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTab === 'move' ? 'var(--color-dropped-surface)' : 'transparent',
                color: activeTab === 'move' ? 'var(--color-dropped)' : 'var(--color-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              Move ({res.droppedItems.length})
            </button>
          </div>

          {/* Export */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export plan
              <span style={{ fontSize: '10px', marginLeft: '4px' }}>▾</span>
            </button>

            {showExportMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 29 }} onClick={() => setShowExportMenu(false)} />
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: '220px',
                    zIndex: 30,
                    padding: '6px',
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  <ExportBtn label="Shell script (.sh)" onClick={handleExportBash} />
                  <ExportBtn label="PowerShell (.ps1)" onClick={handleExportPowerShell} />
                  <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 6px' }} />
                  <ExportBtn label="CSV spreadsheet" onClick={handleExportCsv} />
                  <ExportBtn label="JSON data" onClick={handleExportJson} />
                  <ExportBtn
                    label={copiedText ? '✓ Copied!' : 'Copy text summary'}
                    onClick={handleCopySummary}
                    accent
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* File list */}
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {(activeTab === 'keep' ? res.keptItems : res.droppedItems).map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: 'var(--color-surface-sunken)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px', flex: 1 }}>
                <span style={{ color: 'var(--color-ink)' }}>{item.name}</span>
                {item.isPinned && (
                  <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--color-warning)' }}>📌</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                <span className="font-mono" style={{ color: 'var(--color-dim)' }}>{formatBytes(item.originalSize)}</span>
                <span className="font-mono" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quota Curve Chart */}
      <QuotaCurveChart result={res} currentQuotaBytes={quotaBytes} />
    </div>
  );
};

/* ─── Metric Card ─── */
const MetricCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  valueColor: string;
  suffix?: string;
}> = ({ label, value, sub, valueColor, suffix }) => (
  <div className="card" style={{ padding: '16px' }}>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
      {label}
    </div>
    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: valueColor, marginTop: '6px' }}>
      {value}
      {suffix && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontWeight: 400 }}>{suffix}</span>}
    </div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', marginTop: '2px' }}>
      {sub}
    </div>
  </div>
);

/* ─── Export Button ─── */
const ExportBtn: React.FC<{ label: string; onClick: () => void; accent?: boolean }> = ({ label, onClick, accent }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      textAlign: 'left',
      padding: '8px 12px',
      fontSize: 'var(--text-xs)',
      color: accent ? 'var(--color-primary)' : 'var(--color-ink)',
      borderRadius: 'var(--radius-sm)',
      transition: 'background var(--transition-fast)',
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-sunken)'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
  >
    {label}
  </button>
);

