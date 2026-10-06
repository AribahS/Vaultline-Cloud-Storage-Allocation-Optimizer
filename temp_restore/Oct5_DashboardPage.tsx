import React, { useMemo, useEffect, useState } from 'react';
import { pluralize } from '../../utils/pluralize';
import { formatBytes } from '../../utils/formatBytes';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { KpiCard } from '../components/KpiCard';
import { Button } from '../components/Button';
import { Treemap } from '../components/Treemap';
import { StackedBar } from '../components/StackedBar';
import { useAppStore } from '../../store/useAppStore';
import {
  Files, HardDrive, CheckCircle, TrendingUp,
  FolderPlus, FilePlus, Download,
  Search, Clock, Copy, AlertTriangle,
  Shield, Cpu, FolderOpen, LineChart,
  Play, CheckSquare, Check
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    files, quotaBytes, knapsackResult, isComputing,
    triggerRecompute, autoRunOptimizer, isPlanStale
  } = useAppStore();

  // A12: Auto-run on mount when autoRun is ON and no result yet
  useEffect(() => {
    if (autoRunOptimizer && files.length > 0 && !knapsackResult && !isComputing) {
      triggerRecompute();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const keptIds = useMemo(() => new Set(knapsackResult?.keptItems.map(i => i.id) || []), [knapsackResult]);
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    files.forEach(f => map.set(f.category, (map.get(f.category) || 0) + f.size));
    return Array.from(map.entries()).map(([category, size]) => ({ category, size }));
  }, [files]);

  const dupCount = files.filter(f => f.isDuplicate).length;
  const staleFiles = files.filter(f => (Date.now() - f.lastModified) > 365 * 24 * 60 * 60 * 1000);
  const largeFiles = files.filter(f => f.size > totalSize * 0.1 && totalSize > 0);

  const importanceRetained = knapsackResult
    ? Math.round((knapsackResult.totalValue / knapsackResult.maxPossibleValue) * 100)
    : 0;

  // D1: 3-step progress
  const hasFiles = files.length > 0;
  const hasQuota = quotaBytes > 0;
  const hasPlan = !!knapsackResult;
  const currentStep = !hasFiles ? 1 : !hasPlan ? 2 : 3;

  // --- EMPTY STATE ---
  if (files.length === 0) {
    return (
      <div className="page-container animate-page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', maxWidth: '900px', alignItems: 'center' }}>
          {/* Left column */}
          <div>
            <h1 style={{ fontSize: '36px', lineHeight: 1.2, marginBottom: '16px' }}>
              Decide what to keep.
            </h1>
            <p className="text-ink-2" style={{ fontSize: '16px', lineHeight: 1.7, marginBottom: '32px' }}>
              Vaultline reads your file names, sizes and dates, then finds the best mix to fit your space.
              Nothing leaves your device.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button variant="primary" icon={<FolderPlus size={16} />} onClick={() => navigate('/files')}>
                Add folder
              </Button>
              <Button variant="secondary" icon={<FilePlus size={16} />} onClick={() => navigate('/files')}>
                Add files
              </Button>
              <Button variant="ghost" icon={<Download size={16} />} onClick={() => { useAppStore.getState().loadPreset('student'); }}>
                Try sample data
              </Button>
            </div>
          </div>

          {/* Right column: illustration */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="280" height="220" viewBox="0 0 280 220" fill="none" aria-hidden="true">
              <rect x="40" y="60" width="200" height="140" rx="12" fill="var(--color-forest-50)" stroke="var(--color-forest-500)" strokeWidth="2" />
              <path d="M40 72 C40 65 46 60 52 60 H100 L112 48 H220 C226 48 232 54 232 60 V60 H40 Z" fill="var(--color-forest-100)" stroke="var(--color-forest-500)" strokeWidth="2" />
              <rect x="80" y="100" width="120" height="80" rx="8" fill="var(--color-surface-raised)" stroke="var(--color-brass)" strokeWidth="2" strokeDasharray="6 3" />
              <rect x="95" y="115" width="40" height="12" rx="3" fill="var(--color-file-docs)" opacity="0.8" />
              <rect x="95" y="133" width="55" height="12" rx="3" fill="var(--color-file-photos)" opacity="0.8" />
              <rect x="95" y="151" width="30" height="12" rx="3" fill="var(--color-file-code)" opacity="0.8" />
              <circle cx="195" cy="140" r="16" fill="var(--color-brass-soft)" stroke="var(--color-brass)" strokeWidth="1.5" />
              <path d="M189 140 L193 144 L201 136" stroke="var(--color-brass)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Bottom cards */}
        <div style={{ marginTop: '48px', display: 'flex', gap: '24px', maxWidth: '900px', width: '100%' }}>
          {[
            { icon: <Shield size={20} color="var(--color-forest-500)" />, title: 'Private by design', desc: 'Only file names, sizes and dates. Nothing uploaded.' },
            { icon: <Cpu size={20} color="var(--color-forest-500)" />, title: 'Optimal, not guessed', desc: 'Dynamic programming finds the provably best plan.' },
            { icon: <FolderOpen size={20} color="var(--color-forest-500)" />, title: 'Works on real folders', desc: 'Drop 100,000 files. The table stays smooth.' },
          ].map((card) => (
            <Card key={card.title} style={{ flex: 1, padding: '20px' }}>
              <div style={{ marginBottom: '8px' }}>{card.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{card.title}</div>
              <div className="text-caption text-ink-3">{card.desc}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- ACTIVE STATE ---
  return (
    <div className="page-container animate-page-enter">

      {/* D1: 3-step progress strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0', marginBottom: '24px',
        backgroundColor: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-hairline)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-level-1)',
      }}>
        {[
          { n: 1, label: 'Add files', done: hasFiles },
          { n: 2, label: 'Set your space', done: hasQuota },
          { n: 3, label: 'See your plan', done: hasPlan },
        ].map((step, i) => {
          const isActive = currentStep === step.n;
          return (
            <React.Fragment key={step.n}>
              <div
                onClick={() => {
                  if (step.n === 1) navigate('/files');
                  else if (step.n === 2) navigate('/optimizer');
                  else if (step.n === 3 && !hasPlan) triggerRecompute();
                }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '14px 20px',
                  backgroundColor: isActive ? 'rgba(184,137,60,0.08)' : 'transparent',
                  cursor: step.n <= currentStep ? 'pointer' : 'default',
                  transition: 'background-color 150ms',
                  borderRight: i < 2 ? '1px solid var(--color-border-hairline)' : 'none',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: step.done ? 'var(--color-forest-500)' : isActive ? 'var(--color-brass)' : 'var(--color-surface-sunken)',
                  color: step.done || isActive ? '#fff' : 'var(--color-ink-3)',
                  fontSize: '13px', fontWeight: 700,
                }}>
                  {step.done ? <Check size={14} /> : step.n}
                </div>
                <span style={{
                  fontSize: '14px', fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-forest)' : step.done ? 'var(--color-ink-2)' : 'var(--color-ink-3)',
                  whiteSpace: 'nowrap',
                }}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* D3: Result headline after plan runs */}
      {knapsackResult && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '20px',
          backgroundColor: 'var(--color-forest)',
          borderRadius: 'var(--radius-card)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px',
          color: '#fff',
        }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'var(--font-heading)' }}>
              Keep {pluralize(knapsackResult.keptItems.length, 'file')} ({formatBytes(knapsackResult.totalSizeKept)}).
              {knapsackResult.droppedItems.length > 0 && ` Move ${pluralize(knapsackResult.droppedItems.length, 'file')} (${formatBytes(knapsackResult.totalSizeDropped)}).`}
              {' '}You keep {importanceRetained}% of what matters.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/reports')}
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
            Export checklist
          </Button>
        </div>
      )}

      {/* A2: Page header has NO Run optimizer button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Dashboard</h1>
        {/* Show stale notice + run if auto-run is off */}
        {(isPlanStale || !knapsackResult) && !autoRunOptimizer && !isComputing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-ink-3)' }}>
              {knapsackResult ? 'Plan out of date' : 'Not run yet'}
            </span>
            <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={() => triggerRecompute()}>
              Find the best plan
            </Button>
          </div>
        )}
        {isComputing && (
          <span style={{ fontSize: '13px', color: 'var(--color-ink-3)' }}>Computing…</span>
        )}
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiCard
          label="Total files"
          value={files.length.toLocaleString()}
          subtitle={formatBytes(totalSize)}
          icon={<Files size={20} color="var(--color-forest-500)" />}
          onClick={() => navigate('/files')}
        />
        <KpiCard
          label="Space available"
          value={formatBytes(quotaBytes)}
          subtitle={quotaBytes > 0 ? 'Target capacity' : 'Not set yet'}
          icon={<HardDrive size={20} color="var(--color-forest-500)" />}
          onClick={() => navigate('/optimizer')}
        />
        <KpiCard
          label="Kept by plan"
          value={knapsackResult ? knapsackResult.keptItems.length.toLocaleString() : '--'}
          subtitle={knapsackResult ? formatBytes(knapsackResult.totalSizeKept) : isComputing ? 'Computing…' : 'Run optimizer first'}
          icon={<CheckCircle size={20} color="var(--color-semantic-keep)" />}
          accentColor="var(--color-semantic-keep)"
        />
        <KpiCard
          label="How much you need"
          value={knapsackResult ? `${importanceRetained}%` : '--'}
          subtitle={knapsackResult ? `${knapsackResult.totalValue} of ${knapsackResult.maxPossibleValue} total` : isComputing ? 'Computing…' : 'Run optimizer first'}
          icon={<TrendingUp size={20} color="var(--color-brass)" />}
          accentColor="var(--color-brass)"
        />
      </div>

      {/* Main content row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(240px, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Treemap card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Optimised plan</h3>
              {knapsackResult && (
                <p className="text-body-small text-ink-2" style={{ marginTop: '4px' }}>
                  Keep {knapsackResult.keptItems.length} files ({formatBytes(knapsackResult.totalSizeKept)} of {formatBytes(quotaBytes)}).
                  Move {pluralize(knapsackResult.droppedItems.length, 'file')} ({formatBytes(knapsackResult.totalSizeDropped)}).
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/optimizer')}>
              Open in Optimizer
            </Button>
          </div>
          {knapsackResult ? (
            <Treemap
              files={files.map(f => ({ id: f.id, name: f.name, category: f.category, size: f.size, priority: f.priority }))}
              keptIds={keptIds}
              width={600}
              height={320}
            />
          ) : (
            <div style={{
              height: '320px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--color-surface-sunken)',
              borderRadius: '8px',
              color: 'var(--color-ink-3)',
              gap: '12px',
            }}>
              {isComputing ? (
                <>
                  <Play size={36} color="var(--color-brass)" style={{ opacity: 0.6 }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>Computing your plan…</p>
                </>
              ) : (
                <>
                  {/* C7: Open vault SVG empty state */}
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <rect x="8" y="20" width="48" height="36" rx="6" fill="var(--color-surface-raised)" stroke="var(--color-border-strong)" strokeWidth="1.5" />
                    <path d="M8 26C8 22.7 10.7 20 14 20H50C53.3 20 56 22.7 56 26V26H8V26Z" fill="var(--color-surface-sunken)" />
                    <circle cx="32" cy="38" r="8" fill="var(--color-forest-50)" stroke="var(--color-brass)" strokeWidth="1.5" />
                    <path d="M29 38L31 40L35 36" stroke="var(--color-brass)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    {autoRunOptimizer ? 'Waiting for optimizer…' : 'Run the optimizer to see your plan'}
                  </p>
                  {!autoRunOptimizer && (
                    <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={() => triggerRecompute()}>
                      Find the best plan
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </Card>

        {/* Space by type */}
        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Space by type</h3>
          <StackedBar data={categoryData} width={280} height={12} />
        </Card>
      </div>

      {/* Insights row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {largeFiles.length > 0 && (
              <InsightRow
                icon={<AlertTriangle size={16} color="var(--color-semantic-warning)" />}
                text={`${pluralize(largeFiles.length, 'file')} over 10% of total space`}
                action="Review"
                onClick={() => navigate('/files')}
              />
            )}
            {staleFiles.length > 0 && (
              <InsightRow
                icon={<Clock size={16} color="var(--color-ink-3)" />}
                text={`${pluralize(staleFiles.length, 'file')} not modified in over a year`}
                action="Review"
                onClick={() => navigate('/files')}
              />
            )}
            {dupCount > 0 && (
              <InsightRow
                icon={<Copy size={16} color="var(--color-semantic-info)" />}
                text={`${pluralize(dupCount, 'possible duplicate')}`}
                action="Review"
                onClick={() => navigate('/files')}
              />
            )}
            {largeFiles.length === 0 && staleFiles.length === 0 && dupCount === 0 && (
              <div className="text-body-small text-ink-3">No insights yet. Add more files to get recommendations.</div>
            )}
          </div>
        </Card>

        {/* A2: Quick actions — no duplicate "Run optimizer" */}
        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Quick actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<FolderPlus size={16} />} onClick={() => navigate('/files')}>
              Add folder
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<Download size={16} />} onClick={() => navigate('/reports')}>
              Export checklist
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<LineChart size={16} />} onClick={() => navigate('/algorithm')}>
              Algorithm analysis
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<Search size={16} />} onClick={() => navigate('/files')}>
              Find duplicates
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Small helper component
const InsightRow: React.FC<{ icon: React.ReactNode; text: string; action: string; onClick: () => void }> = ({ icon, text, action, onClick }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--color-border-hairline)' }}>
    {icon}
    <span className="text-body-small" style={{ flex: 1 }}>{text}</span>
    <button
      onClick={onClick}
      className="vault-btn btn-ghost btn-sm"
      style={{ fontSize: '13px' }}
    >
      {action}
    </button>
  </div>
);

