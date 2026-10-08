import React, { useMemo, useRef, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FileMetadata } from '../../engine/types';
import { FileCode, Image, FileVideo, Music, Archive, FileText, Settings, File, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

import { formatDateDmy, formatSize } from '../../lib/format';
import { suggestFileScore } from '../../lib/scoring';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'code': return <FileCode size={16} color="var(--color-file-code)" />;
    case 'photo': return <Image size={16} color="var(--color-file-photos)" />;
    case 'video': return <FileVideo size={16} color="var(--color-file-videos)" />;
    case 'audio': return <Music size={16} color="var(--color-file-audio)" />;
    case 'archive': return <Archive size={16} color="var(--color-file-archives)" />;
    case 'document': return <FileText size={16} color="var(--color-file-docs)" />;
    case 'system': return <Settings size={16} color="var(--color-file-system)" />;
    default: return <File size={16} color="var(--color-file-other)" />;
  }
};

export const FilesTable: React.FC<{ 
  files: FileMetadata[];
  onRowClick?: (file: FileMetadata) => void;
}> = ({ files, onRowClick }) => {
  const updatePriority = useAppStore(state => state.updatePriority);
  const resetPrioritySuggestion = useAppStore(state => state.resetPrioritySuggestion);
  const knapsackResult = useAppStore(state => state.knapsackResult);
  const quotaBytes = useAppStore(state => state.quotaBytes);
  const bulkSetPlacement = useAppStore(state => state.bulkSetPlacement);
  const bulkSetImportance = useAppStore(state => state.bulkSetImportance);
  const resetPrioritySuggestions = useAppStore(state => state.resetPrioritySuggestions);
  const removeFile = useAppStore(state => state.removeFile);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const keptIds = useMemo(() => new Set(knapsackResult?.keptItems.map(item => item.id) ?? []), [knapsackResult]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const selectedFiles = files.filter(file => selectedIds.has(file.id));
  const selectedSuggested = selectedFiles.map(file => ({ file, suggestion: suggestFileScore(file, !!file.isDuplicate, Date.now()) }));

  const columns = useMemo<ColumnDef<FileMetadata>[]>(() => [
    {
      id: 'selected',
      header: 'Select',
      size: 58,
      cell: info => <input type="checkbox" aria-label={`Select ${info.row.original.name}`} checked={selectedIds.has(info.row.original.id)} onClick={event => event.stopPropagation()} onChange={event => setSelectedIds(previous => { const next = new Set(previous); if (event.target.checked) next.add(info.row.original.id); else next.delete(info.row.original.id); return next; })} />,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 400,
      cell: info => {
        const file = info.row.original;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            {getCategoryIcon(file.category)}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {file.name}
              </div>
              <div className="text-caption text-ink-3" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {file.path}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      size: 100,
    },
    {
      accessorKey: 'size',
      header: 'Size',
      size: 120,
      cell: info => {
        const size = info.getValue<number>();
        const isWarning = size > quotaBytes * 0.1;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            {isWarning && <span title="Over 10% of target capacity" style={{ display: 'flex' }}><AlertTriangle size={14} color="var(--color-semantic-warning)" /></span>}
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatSize(size)}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Importance',
      size: 140,
      cell: info => {
        const file = info.row.original;
        const suggested = suggestFileScore(file, !!file.isDuplicate, Date.now());
        const score = file.priority;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <select
              aria-label={`Suggested importance score for ${file.name}`}
              value={score}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) updatePriority(file.id, val);
              }}
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                backgroundColor: score >= 8 ? 'var(--color-forest-50)' : score >= 5 ? 'var(--color-brass-soft)' : 'var(--color-surface-sunken)',
                color: 'var(--color-ink-2)',
                border: '1px solid var(--color-border-hairline)',
                cursor: 'pointer'
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n}/10 {n >= 8 ? '★ High' : n >= 5 ? '• Mid' : ' Low'}</option>
              ))}
            </select>
            {file.prioritySource === 'edited' && (
              <><span className="score-edited-mark">Edited</span><button type="button" onClick={() => resetPrioritySuggestion(file.id, suggested.score)} title="Reset to suggested" style={{ border: 0, background: 'transparent', color: 'var(--color-ink-2)', fontSize: 11, cursor: 'pointer' }}>Reset to suggested</button></>
            )}
            <span className="score-reasons" title={`Suggested scores, a heuristic, not ground truth. ${suggested.reasons.join(', ')}`}>
              <span className="score-suggested-value">Suggested {suggested.score}/10</span>
              {suggested.reasons.length ? suggested.reasons.map((reason: string) => <span className="score-reason-chip" key={reason}>{reason}</span>) : <span className="score-reason-chip">Suggested</span>}
            </span>
          </div>
        );
      }
    },
    {
      id: 'placement',
      header: 'Placement',
      size: 100,
      cell: info => {
        const file = info.row.original;
        if (!knapsackResult) return 'Not planned';
        const isKept = keptIds.has(file.id);
        return (
          <span style={{
            display: 'inline-flex', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
            backgroundColor: isKept ? 'rgba(145,199,177,0.2)' : 'rgba(179,57,81,0.1)',
            color: isKept ? 'var(--color-semantic-keep-stroke)' : 'var(--color-semantic-move)',
            border: `1px solid ${isKept ? 'var(--color-semantic-keep-stroke)' : 'var(--color-semantic-move)'}`
          }}>
            {isKept ? 'Kept' : 'Moved'}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      size: 105,
      cell: info => {
        const file = info.row.original;
        if (file.isPinned) return 'Always keep';
        if (file.isExcluded) return 'Never keep';
        if (file.isDuplicate) return 'Duplicate';
        return 'none';
      }
    },
    {
      accessorKey: 'lastModified',
      header: 'Modified',
      size: 140,
      cell: info => {
        const val = info.getValue<number>();
        const d = new Date(val);
        return <div>{formatDateDmy(d.getTime())}</div>;
      }
    }
  ], [updatePriority, resetPrioritySuggestion, selectedIds, knapsackResult, keptIds, quotaBytes]);

  const searchQuery = useAppStore(state => state.searchQuery);
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const table = useReactTable({
    data: filteredFiles,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  return (
    <div 
      className="table-scroll responsive-scroll"
      ref={tableContainerRef}
      style={{ 
        height: '600px', 
        overflow: 'auto', 
        border: '1px solid var(--color-border-hairline)', 
        borderRadius: '6px',
        backgroundColor: 'var(--color-surface-raised)',
        position: 'relative'
      }}
    >
      {selectedIds.size > 0 && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          backgroundColor: 'var(--color-brass-soft)', padding: '12px 16px',
          borderBottom: '1px solid var(--color-border-strong)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>
            {selectedIds.size} selected
          </span>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-border-hairline)', margin: '0 4px' }} />
          <button className="vault-btn btn-sm btn-secondary" onClick={() => { bulkSetPlacement(Array.from(selectedIds), 'always_keep'); setSelectedIds(new Set()); }}>Always keep</button>
          <button className="vault-btn btn-sm btn-secondary" onClick={() => { bulkSetPlacement(Array.from(selectedIds), 'never_keep'); setSelectedIds(new Set()); }}>Never keep</button>
          <button className="vault-btn btn-sm btn-secondary" onClick={() => { bulkSetPlacement(Array.from(selectedIds), 'auto'); setSelectedIds(new Set()); }}>Clear constraint</button>
          <button className="vault-btn btn-sm btn-secondary" onClick={() => { resetPrioritySuggestions(Array.from(selectedIds)); setSelectedIds(new Set()); }}>Reset to suggested</button>
          <select 
            aria-label="Set importance"
            className="vault-btn btn-sm btn-secondary"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', paddingRight: '24px' }}
            onChange={(e) => {
              if (e.target.value) {
                bulkSetImportance(Array.from(selectedIds), parseInt(e.target.value, 10));
                setSelectedIds(new Set());
                e.target.value = '';
              }
            }}
          >
            <option value="">Set importance...</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <option key={score} value={score}>{score}/10 {score >= 8 ? '★ High' : score >= 5 ? '• Mid' : 'Low'}</option>
            ))}
          </select>
          <div className="bulk-score-suggestions" aria-label="Suggested scores for selected files">
            {selectedSuggested.map(({ file, suggestion }) => <div key={file.id}>
              <span>{file.name}: suggested {suggestion.score}/10</span>{file.prioritySource === 'edited' && <span className="score-edited-mark">Edited</span>}
              <span className="score-reasons">{suggestion.reasons.map(reason => <span className="score-reason-chip" key={reason}>{reason}</span>)}</span>
            </div>)}
            <small>Suggested scores, a heuristic, not ground truth</small>
          </div>
          <div style={{ flex: 1 }} />
          <button className="vault-btn btn-sm btn-danger" onClick={() => { Array.from(selectedIds).forEach(removeFile); setSelectedIds(new Set()); }}>Remove from list</button>
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'fixed' }}>
        <thead style={{ backgroundColor: 'var(--color-surface-sunken)', position: 'sticky', top: selectedIds.size > 0 ? 53 : 0, zIndex: 1, display: 'block' }}>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
              {headerGroup.headers.map(header => (
                <th 
                  key={header.id} 
                  style={{ 
                    padding: '8px 12px', 
                    textAlign: header.column.id === 'size' ? 'right' : 'left', 
                    borderBottom: '1px solid var(--color-border-hairline)',
                    width: header.getSize(),
                    minWidth: header.getSize(),
                    maxWidth: header.getSize(),
                    boxSizing: 'border-box',
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                    color: 'var(--color-forest)'
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: ' ↑',
                    desc: ' ↓',
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index];
            return (
              <tr 
                key={row.id} 
                onClick={() => onRowClick?.(row.original)}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  borderBottom: '1px solid var(--color-border-hairline)',
                  cursor: onRowClick ? 'pointer' : 'default'
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    style={{ 
                      width: cell.column.getSize(), 
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                      padding: '4px 12px', 
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      textAlign: cell.column.id === 'size' ? 'right' : 'left'
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
