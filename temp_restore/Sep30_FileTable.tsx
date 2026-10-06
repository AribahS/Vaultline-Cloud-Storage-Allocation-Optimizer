import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FileMetadata } from '../../engine/types';
import { formatBytes } from '../../engine/normalizer';
import { CategoryIcon } from '../common/CategoryIcon';

export const FileTable: React.FC = () => {
  const {
    files,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    sortOrder,
    setSort,
    togglePin,
    toggleExclude,
    updatePriority,
    removeFile,
    clearFiles,
    deduplicateKeepOneAction,
    folderMode,
    setFolderMode,
    capStrategy,
    setCapStrategy,
    knapsackResult,
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(420);

  // Resize observer to get accurate table viewport height
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter & sort files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        if (categoryFilter !== 'all' && file.category !== categoryFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'size') diff = a.size - b.size;
        else if (sortBy === 'priority') diff = a.priority - b.priority;
        else if (sortBy === 'date') diff = a.lastModified - b.lastModified;
        else diff = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [files, categoryFilter, searchQuery, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const totalFiles = files.length;
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const activeFiles = files.filter((f) => !f.isExcluded);
    const activeBytes = activeFiles.reduce((acc, f) => acc + f.size, 0);
    const duplicateCount = files.filter((f) => f.isDuplicate).length;
    return { totalFiles, totalBytes, activeFiles: activeFiles.length, activeBytes, duplicateCount };
  }, [files]);

  const keptIdSet = useMemo(() => {
    if (!knapsackResult) return new Set<string>();
    return new Set(knapsackResult.keptItems.map((i) => i.id));
  }, [knapsackResult]);

  // Virtualization parameters
  const rowHeight = 42;
  const totalRows = filteredFiles.length;
  const totalContentHeight = totalRows * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 4);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + 8;
  const endIndex = Math.min(totalRows, startIndex + visibleCount);
  const visibleItems = filteredFiles.slice(startIndex, endIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const handleSelectAll = (select: boolean) => {
    files.forEach((f) => {
      if (select && f.isExcluded) toggleExclude(f.id);
      if (!select && !f.isExcluded) toggleExclude(f.id);
    });
  };

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Table Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Top line of toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-main)' }}>
              Source Items
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-bg-base)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              {stats.activeFiles} of {stats.totalFiles} included ({formatBytes(stats.activeBytes)})
            </span>
          </div>

          {/* Folder mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Mode:</span>
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--color-bg-base)',
                borderRadius: 'var(--radius-md)',
                padding: '2px',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <button
                onClick={() => setFolderMode(false)}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: !folderMode ? 'var(--color-bg-elevated)' : 'transparent',
                  color: !folderMode ? 'var(--color-text-main)' : 'var(--color-text-dim)',
                }}
              >
                By File
              </button>
              <button
                onClick={() => setFolderMode(true)}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: folderMode ? 'var(--color-bg-elevated)' : 'transparent',
                  color: folderMode ? 'var(--color-text-main)' : 'var(--color-text-dim)',
                }}
              >
                By Folder
              </button>
            </div>
          </div>
        </div>

        {/* Filter / Search Row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 180px' }}>
            <input
              type="text"
              placeholder="Search file name or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '28px' }}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-dim)"
              strokeWidth="2"
              style={{ position: 'absolute', left: '9px', top: '9px' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '6px 8px' }}
            aria-label="Filter by file category"
          >
            <option value="all">All Types</option>
            <option value="database">Databases</option>
            <option value="document">Documents</option>
            <option value="code">Source Code</option>
            <option value="photo">Photos</option>
            <option value="video">Videos</option>
            <option value="archive">Archives</option>
            <option value="log_temp">Logs & Temp</option>
          </select>

          <button
            onClick={() => handleSelectAll(true)}
            style={{ fontSize: '11px', padding: '6px 8px', color: 'var(--color-text-muted)' }}
          >
            All
          </button>
          <button
            onClick={() => handleSelectAll(false)}
            style={{ fontSize: '11px', padding: '6px 8px', color: 'var(--color-text-muted)' }}
          >
            None
          </button>
          <button
            onClick={clearFiles}
            style={{ fontSize: '11px', padding: '6px 8px', color: 'var(--color-danger)' }}
          >
            Clear
          </button>
        </div>

        {/* Duplicate Banner if duplicates detected */}
        {stats.duplicateCount > 0 && (
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--color-amber-surface)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <span style={{ color: 'var(--color-amber)' }}>
              ⚠ {stats.duplicateCount} duplicate files detected (identical name + size).
            </span>
            <button
              onClick={deduplicateKeepOneAction}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-bg-base)',
                backgroundColor: 'var(--color-amber)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Keep one, exclude rest
            </button>
          </div>
        )}

        {/* Capping Notice if > 500 files */}
        {files.length > 500 && !folderMode && (
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--color-primary-blue-surface)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
            }}
          >
            <span style={{ color: 'var(--color-primary-blue)' }}>
              DP item limit (500 files exceeded). Choose capping strategy:
            </span>
            <select
              value={capStrategy}
              onChange={(e) => setCapStrategy(e.target.value as any)}
              style={{ padding: '2px 6px', fontSize: '11px' }}
            >
              <option value="largest_500">Top 500 Largest</option>
              <option value="bundle_small_files">Bundle Small Files (&lt;5MB)</option>
              <option value="folder_mode">Switch to Folder Mode</option>
            </select>
          </div>
        )}
      </div>

      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '40px 60px 1fr 90px 80px 100px 30px',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: 'var(--color-bg-base)',
          borderBottom: '1px solid var(--color-border-subtle)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <span>Inc</span>
        <span>Pin</span>
        <span
          onClick={() => setSort('name')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          File Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </span>
        <span
          onClick={() => setSort('size')}
          style={{ cursor: 'pointer', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}
        >
          Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
        </span>
        <span
          onClick={() => setSort('date')}
          style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </span>
        <span
          onClick={() => setSort('priority')}
          style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
        </span>
        <span />
      </div>

      {/* Virtual Table Body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          minHeight: '320px',
        }}
      >
        {filteredFiles.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--color-text-dim)',
              fontSize: '13px',
            }}
          >
            No files match the active search or category filter.
          </div>
        ) : (
          <div style={{ height: `${totalContentHeight}px`, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${startIndex * rowHeight}px)`,
              }}
            >
              {visibleItems.map((file) => {
                const isKept = keptIdSet.has(file.id);
                const isExcluded = file.isExcluded;

                return (
                  <div
                    key={file.id}
                    style={{
                      height: `${rowHeight}px`,
                      display: 'grid',
                      gridTemplateColumns: '40px 60px 1fr 90px 80px 100px 30px',
                      alignItems: 'center',
                      padding: '0 16px',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      backgroundColor: isExcluded
                        ? 'rgba(0, 0, 0, 0.2)'
                        : isKept
                        ? 'var(--color-accent-lime-surface)'
                        : 'transparent',
                      opacity: isExcluded ? 0.45 : 1,
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    {/* Include Checkbox */}
                    <div>
                      <input
                        type="checkbox"
                        checked={!file.isExcluded}
                        onChange={() => toggleExclude(file.id)}
                        aria-label={`Include ${file.name}`}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>

                    {/* Pin Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => togglePin(file.id)}
                        disabled={file.isExcluded}
                        title={file.isPinned ? 'Pinned: Must keep in quota' : 'Pin to forcibly include'}
                        aria-label={file.isPinned ? 'Unpin file' : 'Pin file'}
                        style={{
                          color: file.isPinned ? 'var(--color-amber)' : 'var(--color-text-dim)',
                          padding: '2px',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={file.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="17" x2="12" y2="22" />
                          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A4 4 0 0 1 14 9V4h1a1 1 0 0 0 0-2H9a1 1 0 0 0 0 2h1v5a4 4 0 0 1-2.11 3.56l-1.78.89A2 2 0 0 0 5 15.24Z" />
                        </svg>
                      </button>
                    </div>

                    {/* Name + Category Icon + Path Tooltip */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        overflow: 'hidden',
                        paddingRight: '12px',
                      }}
                      title={`${file.path}\nSize: ${formatBytes(file.size)}\nStatus: ${isKept ? 'Optimal Keep' : 'Drop'}`}
                    >
                      <CategoryIcon category={file.category} size={15} className="text-dim" />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '13px',
                          color: isKept ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                          fontWeight: isKept ? 500 : 400,
                        }}
                      >
                        {file.name}
                      </span>
                      {file.isDuplicate && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            backgroundColor: 'var(--color-amber-surface)',
                            color: 'var(--color-amber)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          DUP
                        </span>
                      )}
                    </div>

                    {/* Size */}
                    <div className="font-mono" style={{ textAlign: 'right', fontSize: '12px' }}>
                      {formatBytes(file.size)}
                    </div>

                    {/* Last Modified */}
                    <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-dim)' }}>
                      {new Date(file.lastModified).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>

                    {/* Editable Priority 1-10 + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={file.priority}
                        onChange={(e) => updatePriority(file.id, Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                        aria-label={`Priority for ${file.name}`}
                        style={{
                          width: '42px',
                          padding: '2px 4px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          color: file.prioritySource === 'edited' ? 'var(--color-primary-blue)' : 'var(--color-text-dim)',
                        }}
                      >
                        {file.prioritySource}
                      </span>
                    </div>

                    {/* Delete item */}
                    <div style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => removeFile(file.id)}
                        aria-label={`Remove ${file.name}`}
                        style={{ color: 'var(--color-text-dim)', padding: '2px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

