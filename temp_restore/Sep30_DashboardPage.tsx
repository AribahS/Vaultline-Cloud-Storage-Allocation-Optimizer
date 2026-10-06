import React, { useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { KpiCard } from '../components/KpiCard';
import { Button } from '../components/Button';
import { Treemap } from '../components/Treemap';
import { StackedBar } from '../components/StackedBar';
import { useAppStore } from '../../store/useAppStore';
import {
  Files, HardDrive, CheckCircle, TrendingUp,
  FolderPlus, FilePlus, Download, Play,
  Search, Clock, Copy, AlertTriangle,
  Shield, Cpu, FolderOpen, LineChart
} from 'lucide-react';

const formatBytesHuman = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { files, quotaBytes, knapsackResult, isComputing, loadPreset, triggerRecompute } = useAppStore();

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const keptIds = useMemo(() => new Set(knapsackResult?.keptItems.map(i => i.id) || []), [knapsackResult]);
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    files.forEach(f => map.set(f.category, (map.get(f.category) || 0) + f.size));
    return Array.from(map.entries()).map(([category, size]) => ({ category, size }));
  }, [files]);

  // Insights
  const dupCount = files.filter(f => f.isDuplicate).length;
  const staleFiles = files.filter(f => (Date.now() - f.lastModified) > 365 * 24 * 60 * 60 * 1000);
  const largeFiles = files.filter(f => f.size > totalSize * 0.1 && totalSize > 0);

  const importanceRetained = knapsackResult
    ? Math.round((knapsackResult.totalValue / knapsackResult.maxPossibleValue) * 100)
    : 0;

  // --- EMPTY STATE ---
  if (files.length === 0) {
    return (
      <div className="page-container animate-page-enter" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
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
              <Button variant="ghost" icon={<Download size={16} />} onClick={() => { loadPreset('student'); }}>
                Try sample data
              </Button>
            </div>
          </div>

          {/* Right column: illustration */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <svg width="280" height="220" viewBox="0 0 280 220" fill="none">
              {/* Stylised folder */}
              <rect x="40" y="60" width="200" height="140" rx="12" fill="var(--color-forest-50)" stroke="var(--color-forest-500)" strokeWidth="2" />
              <path d="M40 72 C40 65 46 60 52 60 H100 L112 48 H220 C226 48 232 54 232 60 V60 H40 Z" fill="var(--color-forest-100)" stroke="var(--color-forest-500)" strokeWidth="2" />
              {/* Container box */}
              <rect x="80" y="100" width="120" height="80" rx="8" fill="var(--color-surface-raised)" stroke="var(--color-brass)" strokeWidth="2" strokeDasharray="6 3" />
              {/* Files inside */}
              <rect x="95" y="115" width="40" height="12" rx="3" fill="var(--color-file-docs)" opacity="0.8" />
              <rect x="95" y="133" width="55" height="12" rx="3" fill="var(--color-file-photos)" opacity="0.8" />
              <rect x="95" y="151" width="30" height="12" rx="3" fill="var(--color-file-code)" opacity="0.8" />
              {/* Brass accent */}
              <circle cx="195" cy="140" r="16" fill="var(--color-brass-soft)" stroke="var(--color-brass)" strokeWidth="1.5" />
              <path d="M189 140 L193 144 L201 136" stroke="var(--color-brass)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Bottom cards */}
        <div style={{ position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '24px', maxWidth: '900px' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Dashboard</h1>
        <Button
          variant="primary"
          icon={isComputing ? undefined : <Play size={16} />}
          disabled={isComputing}
          onClick={() => triggerRecompute()}
        >
          {isComputing ? 'Computing...' : 'Run optimizer'}
        </Button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard
          label="Total files"
          value={files.length.toLocaleString()}
          subtitle={formatBytesHuman(totalSize)}
          icon={<Files size={20} color="var(--color-forest-500)" />}
          onClick={() => navigate('/files')}
        />
        <KpiCard
          label="Selected space"
          value={formatBytesHuman(quotaBytes)}
          subtitle={quotaBytes > 0 ? 'Target capacity' : 'Not set yet'}
          icon={<HardDrive size={20} color="var(--color-forest-500)" />}
          onClick={() => navigate('/optimizer')}
        />
        <KpiCard
          label="Kept by plan"
          value={knapsackResult ? knapsackResult.keptItems.length.toLocaleString() : '--'}
          subtitle={knapsackResult ? formatBytesHuman(knapsackResult.totalSizeKept) : 'Run optimizer first'}
          icon={<CheckCircle size={20} color="var(--color-semantic-keep)" />}
          accentColor="var(--color-semantic-keep)"
        />
        <KpiCard
          label="Importance retained"
          value={knapsackResult ? `${importanceRetained}%` : '--'}
          subtitle={knapsackResult ? `${knapsackResult.totalValue} of ${knapsackResult.maxPossibleValue} total` : 'Run optimizer first'}
          icon={<TrendingUp size={20} color="var(--color-brass)" />}
          accentColor="var(--color-brass)"
        />
      </div>

      {/* Main content row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Treemap card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Optimised plan</h3>
              {knapsackResult && (
                <p className="text-body-small text-ink-2" style={{ marginTop: '4px' }}>
                  Keep {knapsackResult.keptItems.length} files ({formatBytesHuman(knapsackResult.totalSizeKept)} of {formatBytesHuman(quotaBytes)}).
                  Move {knapsackResult.droppedItems.length} files ({formatBytesHuman(knapsackResult.totalSizeDropped)}).
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/optimizer')}>
              Open in Optimizer
            </Button>
          </div>
          {knapsackResult ? (
            <Treemap
              files={files.map(f => ({ id: f.id, name: f.name, category: f.category, size: f.size }))}
              keptIds={keptIds}
              width={700}
              height={360}
            />
          ) : (
            <div style={{
              height: '360px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--color-surface-sunken)',
              borderRadius: '8px',
              color: 'var(--color-ink-3)'
            }}>
              Run the optimizer to see your plan
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {largeFiles.length > 0 && (
              <InsightRow
                icon={<AlertTriangle size={16} color="var(--color-semantic-warning)" />}
                text={`${largeFiles.length} file${largeFiles.length !== 1 ? 's' : ''} over 10% of total space`}
                action="Review"
                onClick={() => navigate('/files')}
              />
            )}
            {staleFiles.length > 0 && (
              <InsightRow
                icon={<Clock size={16} color="var(--color-ink-3)" />}
                text={`${staleFiles.length} file${staleFiles.length !== 1 ? 's' : ''} not modified in over a year`}
                action="Review"
                onClick={() => navigate('/files')}
              />
            )}
            {dupCount > 0 && (
              <InsightRow
                icon={<Copy size={16} color="var(--color-semantic-info)" />}
                text={`${dupCount} possible duplicate${dupCount !== 1 ? 's' : ''}`}
                action="Review"
                onClick={() => navigate('/files')}
              />
            )}
            {largeFiles.length === 0 && staleFiles.length === 0 && dupCount === 0 && (
              <div className="text-body-small text-ink-3">No insights yet. Add more files to get recommendations.</div>
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Quick actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<FolderPlus size={16} />} onClick={() => navigate('/files')}>
              Add folder
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<Play size={16} />} onClick={() => triggerRecompute()}>
              Run optimizer
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<Download size={16} />} onClick={() => navigate('/reports')}>
              Export checklist
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<LineChart size={16} />} onClick={() => navigate('/algorithm')}>
              Algorithm analysis
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

