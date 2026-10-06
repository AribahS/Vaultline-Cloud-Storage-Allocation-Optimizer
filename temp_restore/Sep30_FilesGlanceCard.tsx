import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FileCategory } from '../../engine/types';
import { formatBytes } from '../../engine/normalizer';
import { detectInsights } from '../../engine/insights';
import { CATEGORY_META, getCategoryColor } from '../../engine/categoryMeta';

export const FilesGlanceCard: React.FC = () => {
  const {
    files,
    categoryFilter,
    setCategoryFilter,
    setSearchQuery,
    setFileImportanceTier,
    deduplicateKeepOneAction,
  } = useAppStore();

  const activeFiles = useMemo(() => files.filter((f) => !f.isExcluded), [files]);
  const totalBytes = useMemo(() => activeFiles.reduce((acc, f) => acc + f.size, 0), [activeFiles]);

  // Group by category for the stacked bar
  const typeBreakdown = useMemo(() => {
    const map: Record<string, { bytes: number; count: number; category: FileCategory }> = {};
    for (const f of activeFiles) {
      if (!map[f.category]) {
        map[f.category] = { bytes: 0, count: 0, category: f.category };
      }
      map[f.category].bytes += f.size;
      map[f.category].count += 1;
    }
    return Object.values(map).sort((a, b) => b.bytes - a.bytes);
  }, [activeFiles]);

  // Run insight detectors
  const insights = useMemo(() => detectInsights(files), [files]);

  const handleMarkStaleCanGo = () => {
    insights.staleFilesOverYear.files.forEach((f) => {
      setFileImportanceTier(f.id, 'can_go');
    });
  };

  const handleReviewHogs = () => {
    if (insights.biggestSpaceHogs.files.length > 0) {
      setSearchQuery(insights.biggestSpaceHogs.files[0].name.slice(0, 10));
    }
  };

  return (
    <div className="card" style={{ padding: '22px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink)' }}>
            Your files at a glance
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: '1px' }}>
            Tap a type to filter below. Metadata analysis only.
          </p>
        </div>

        <span
          title="Detection uses only metadata (name + size for duplicates, file date for age). File contents are never read."
          style={{ fontSize: '14px', color: 'var(--color-dim)', cursor: 'help' }}
        >
          ℹ
        </span>
      </div>

      {/* Horizontal Stacked Bar of Space by Type */}
      <div>
        <div
          style={{
            height: '14px',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            display: 'flex',
            backgroundColor: 'var(--color-surface-sunken)',
            border: '1px solid var(--color-border)',
          }}
        >
          {typeBreakdown.map((item) => {
            const pct = (item.bytes / Math.max(1, totalBytes)) * 100;
            if (pct < 0.5) return null;
            const color = getCategoryColor(item.category);
            const isSelected = categoryFilter === item.category;

            return (
              <div
                key={item.category}
                onClick={() => setCategoryFilter(categoryFilter === item.category ? 'all' : item.category)}
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  opacity: categoryFilter === 'all' || isSelected ? 1 : 0.4,
                  transition: 'opacity var(--transition-fast)',
                }}
                title={`${CATEGORY_META[item.category]?.label}: ${formatBytes(item.bytes)} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Tappable Type Chips Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {typeBreakdown.slice(0, 5).map((item) => {
            const isSelected = categoryFilter === item.category;
            const meta = CATEGORY_META[item.category];

            return (
              <button
                key={item.category}
                onClick={() => setCategoryFilter(categoryFilter === item.category ? 'all' : item.category)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: isSelected ? 'var(--color-primary-surface)' : 'var(--color-surface-sunken)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-muted)',
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: meta.color }} />
                <span>{meta.label}</span>
                <span className="font-mono text-dim">{formatBytes(item.bytes)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Insight Rows with Count & One-Tap Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        {/* Insight 1: Space Hogs */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-sunken)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Biggest space hogs: </span>
            <span style={{ color: 'var(--color-muted)' }}>
              {insights.biggestSpaceHogs.files.map((f) => `${f.name} (${formatBytes(f.size)})`).join(', ') || 'None'}
            </span>
          </div>
          <button
            onClick={handleReviewHogs}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0 }}
          >
            Review
          </button>
        </div>

        {/* Insight 2: Not touched in over a year */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-sunken)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Not touched in &gt;1 year: </span>
            <span style={{ color: 'var(--color-muted)' }}>
              {insights.staleFilesOverYear.count} files, {formatBytes(insights.staleFilesOverYear.totalBytes)}
            </span>
          </div>
          <button
            onClick={handleMarkStaleCanGo}
            disabled={insights.staleFilesOverYear.count === 0}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0 }}
          >
            Mark as Can go
          </button>
        </div>

        {/* Insight 3: Possible Duplicates */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-sunken)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Possible duplicates: </span>
            <span style={{ color: 'var(--color-muted)' }}>
              {insights.duplicates.count} files, {formatBytes(insights.duplicates.wastedBytes)} wasted
            </span>
          </div>
          <button
            onClick={deduplicateKeepOneAction}
            disabled={insights.duplicates.count === 0}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0 }}
          >
            Keep one
          </button>
        </div>
      </div>
    </div>
  );
};

