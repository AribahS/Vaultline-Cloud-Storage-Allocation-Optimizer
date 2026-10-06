import React, { useMemo, useRef, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FileMetadata } from '../../engine/types';
import { FileCode, Image, FileVideo, Music, Archive, FileText, Settings, File } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

import { formatBytes } from '../../utils/formatBytes';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const keptIds = useMemo(() => new Set(knapsackResult?.keptItems.map(item => item.id) ?? []), [knapsackResult]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
      cell: info => <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatBytes(info.getValue<number>())}</div>,
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
              <button type="button" onClick={() => resetPrioritySuggestion(file.id, suggested.score)} title="Reset to suggested" style={{ border: 0, background: 'transparent', color: 'var(--color-ink-2)', fontSize: 11, cursor: 'pointer' }}>Edited · Reset</button>
            )}
            {file.prioritySource !== 'edited' && <span className="score-reasons" title={`Suggested scores, not ground truth. ${suggested.reasons.join(', ')}`}>{suggested.reasons.length ? suggested.reasons.map(reason => <span className="score-reason-chip" key={reason}>{reason}</span>) : <span className="score-reason-chip">Suggested</span>}</span>}
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
        return file.isExcluded ? 'Never keep' : file.isPinned ? 'Always keep' : !knapsackResult ? 'Not planned' : keptIds.has(file.id) ? 'Kept' : 'Moved';
      },
    },
    {
      id: 'status',
      header: 'Status',
      size: 105,
      cell: info => info.row.original.isDuplicate ? 'Duplicate' : info.row.original.prioritySource === 'edited' ? 'Overridden' : 'Suggested',
    },
    {
      accessorKey: 'lastModified',
      header: 'Modified',
      size: 140,
      cell: info => {
        const val = info.getValue<number>();
        const d = new Date(val);
        return <div>{d.toLocaleDateString()}</div>;
      }
    }
  ], [updatePriority, resetPrioritySuggestion, selectedIds, knapsackResult, keptIds]);

  const table = useReactTable({
    data: files,
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
      ref={tableContainerRef}
      style={{ 
        height: '600px', 
        overflow: 'auto', 
        border: '1px solid var(--color-border-hairline)', 
        borderRadius: '6px',
        backgroundColor: 'var(--color-surface-raised)'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'fixed' }}>
        <thead style={{ backgroundColor: 'var(--color-surface-sunken)', position: 'sticky', top: 0, zIndex: 1, display: 'block' }}>
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
