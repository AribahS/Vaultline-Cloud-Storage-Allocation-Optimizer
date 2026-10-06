import React, { useMemo, useRef, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, ColumnDef, SortingState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FileMetadata } from '../../../engine/types';
import { FileCode, Image, FileVideo, Music, Archive, FileText, Settings, File } from 'lucide-react';
import { formatBytes, formatAge } from '../../../engine/normalizer'; // assuming these exist, I'll provide fallbacks if they don't

// Basic formatters
const formatBytesHuman = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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

export const FilesTable: React.FC<{ files: FileMetadata[] }> = ({ files }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<FileMetadata>[]>(() => [
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
      cell: info => <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatBytesHuman(info.getValue<number>())}</div>,
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
  ], []);

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
        <thead style={{ backgroundColor: 'var(--color-surface-sunken)', position: 'sticky', top: 0, zIndex: 1 }}>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th 
                  key={header.id} 
                  style={{ 
                    padding: '8px 12px', 
                    textAlign: header.column.id === 'size' ? 'right' : 'left', 
                    borderBottom: '1px solid var(--color-border-hairline)',
                    width: header.getSize(),
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
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  borderBottom: '1px solid var(--color-border-hairline)'
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ padding: '4px 12px', overflow: 'hidden' }}>
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

