import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { KpiCard } from '../components/KpiCard';
import { Button } from '../components/Button';
import { StackedBar } from '../components/StackedBar';
import { useAppStore } from '../../store/useAppStore';
import { formatSize, pluralize } from '../../lib/format';
import {
  Files, HardDrive, CheckCircle, TrendingUp,
  FilePlus, Download, Search, FileText
} from 'lucide-react';
import { STUDENT_LAPTOP_DATASET } from '../../data/sampleDatasets';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { files, quotaBytes, knapsackResult, setFiles, isComputing, triggerRecompute, autoRunOptimizer, isPlanStale } = useAppStore();

  useEffect(() => {
    if (autoRunOptimizer && files.length > 0 && !knapsackResult && !isPlanStale && !isComputing) {
      triggerRecompute();
    }
  }, [autoRunOptimizer, files.length, knapsackResult, isComputing, isPlanStale, triggerRecompute]);

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    files.forEach(f => map.set(f.category, (map.get(f.category) || 0) + f.size));
    return Array.from(map.entries()).map(([category, size]) => ({ category, size }));
  }, [files]);

  // Insights
  const largeFiles = files.filter(f => f.size > totalSize * 0.1 && totalSize > 0);
  const largestFile = files.length > 0 ? [...files].sort((a, b) => b.size - a.size)[0] : null;

  const importanceRetained = knapsackResult
    ? Math.round((knapsackResult.totalValue / knapsackResult.maxPossibleValue) * 100)
    : 0;

  // --- EMPTY STATE ---
  if (files.length === 0) {
    return (
      <div className="page-container responsive-page dashboard-page animate-page-enter" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
        <h1 className="page-title">Dashboard</h1>
        <p style={{ fontSize: '16px', color: 'var(--color-ink-2)', margin: 0 }}>Decide what to keep.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="primary" onClick={() => setFiles(STUDENT_LAPTOP_DATASET)}>Try sample data</Button>
          <Button variant="secondary" onClick={() => navigate('/files')}>Add files</Button>
        </div>
      </div>
    );
  }

  // --- ACTIVE STATE ---
  return (
    <div className="page-container responsive-page dashboard-page animate-page-enter">
      <h1 className="page-title">Dashboard</h1>
      {/* KPI Row */}
      <div className="dashboard-kpis responsive-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiCard
          label="Total files"
          value={pluralize(files.length, 'file')}
          subtitle={formatSize(totalSize)}
          icon={<Files size={20} color="var(--color-forest-500)" />}
        />
        <KpiCard
          label="Selected space"
          value={formatSize(quotaBytes)}
          subtitle="Target capacity"
          icon={<HardDrive size={20} color="var(--color-forest-500)" />}
        />
        <KpiCard
          label="Kept by plan"
          value={knapsackResult ? pluralize(knapsackResult.keptItems.length, 'file') : (isComputing ? '...' : '--')}
          subtitle={knapsackResult ? formatSize(knapsackResult.totalSizeKept) : (isComputing ? 'Computing...' : '--')}
          icon={<CheckCircle size={20} color="var(--color-semantic-keep)" />}
          accentColor="var(--color-semantic-keep)"
        />
        <KpiCard
          label="Importance retained"
          value={knapsackResult ? `${importanceRetained}%` : (isComputing ? '...' : '--')}
          subtitle={knapsackResult ? `${knapsackResult.totalValue} of ${knapsackResult.maxPossibleValue}` : (isComputing ? 'Computing...' : '--')}
          icon={<TrendingUp size={20} color="var(--color-brass)" />}
          accentColor="var(--color-brass)"
        />
      </div>

      <div className="dashboard-grid responsive-stack" style={{ marginBottom: '24px' }}>
        {/* Optimised plan card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 12px 0' }}>Optimised plan</h3>
              {knapsackResult ? (
                <p className="text-body-small text-ink-2" style={{ margin: 0, lineHeight: 1.6 }}>
                  {pluralize(knapsackResult.keptItems.length, 'file')} fit within {formatSize(quotaBytes)}. {pluralize(knapsackResult.droppedItems.length, 'file')} ({formatSize(knapsackResult.totalSizeDropped)}) {knapsackResult.droppedItems.length === 1 ? 'moves' : 'move'} elsewhere.
                </p>
              ) : (
                <p className="text-body-small text-ink-2" style={{ margin: 0 }}>
                  Computing your plan...
                </p>
              )}
            </div>
            <Button variant="primary" onClick={() => navigate('/optimizer')}>
              Open optimizer
            </Button>
          </div>
        </Card>

        {/* Space by type */}
        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Space by type</h3>
          <StackedBar data={categoryData} width={280} height={12} />
        </Card>
      </div>

      <div className="dashboard-insights responsive-stack">
        {/* Insights */}
        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Insights</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-ink-2)', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {largeFiles.length > 0 && (
              <li>{pluralize(largeFiles.length, 'file')} {largeFiles.length === 1 ? 'is' : 'are'} over 10% of total space</li>
            )}
            {largestFile && (
              <li>Largest file: {largestFile.name} ({formatSize(largestFile.size)})</li>
            )}
            {knapsackResult && knapsackResult.droppedItems.length > 0 && (
              <li>Moving {pluralize(knapsackResult.droppedItems.length, 'file')} frees {formatSize(knapsackResult.totalSizeDropped)}</li>
            )}
            {files.length > 0 && largeFiles.length === 0 && (!knapsackResult || knapsackResult.droppedItems.length === 0) && (
              <li>No significant insights found.</li>
            )}
          </ul>
        </Card>

        {/* Quick actions */}
        <Card>
          <h3 style={{ margin: '0 0 16px 0' }}>Quick actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<FilePlus size={16} />} onClick={() => navigate('/files')}>
              Add files
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<Download size={16} />} onClick={() => setFiles(STUDENT_LAPTOP_DATASET)}>
              Load sample data
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<Search size={16} />} onClick={() => navigate('/files')}>
              Review files
            </Button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start' }} icon={<FileText size={16} />} onClick={() => navigate('/reports')}>
              Export report
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
