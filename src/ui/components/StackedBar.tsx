import React from 'react';
import { formatBytes } from '../../utils/formatBytes';

// A13: Extended category color map with correct file type mappings
const FILE_CATEGORY_COLORS: Record<string, string> = {
  document:   'var(--color-file-docs)',
  photo:      'var(--color-file-photos)',
  video:      'var(--color-file-videos)',
  audio:      'var(--color-file-audio)',
  archive:    'var(--color-file-archives)',
  code:       'var(--color-file-code)',
  system:     'var(--color-file-system)',
  log_temp:   '#A8947A',
  database:   'var(--color-file-code)',
  disk_image: '#8B6E4E',
  cache:      '#B07A5A',
  other:      'var(--color-file-other)',
};

const CATEGORY_LABELS: Record<string, string> = {
  document:   'Documents',
  photo:      'Photos',
  video:      'Videos',
  audio:      'Audio',
  archive:    'Archives',
  code:       'Code',
  system:     'System',
  log_temp:   'Logs / Temp',
  database:   'Databases',
  disk_image: 'Disk images',
  cache:      'Cache & temp',
  other:      'Other',
};

interface StackedBarProps {
  data: { category: string; size: number }[];
  width?: number;
  height?: number;
}

export const StackedBar: React.FC<StackedBarProps> = ({ data, width = 280, height = 16 }) => {
  const total = data.reduce((s, d) => s + d.size, 0);
  if (total === 0) return null;

  const sorted = [...data].sort((a, b) => b.size - a.size);
  let offsetX = 0;

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', borderRadius: '6px', overflow: 'hidden' }}>
        {sorted.map(item => {
          const w = (item.size / total) * width;
          const x = offsetX;
          offsetX += w;
          const color = FILE_CATEGORY_COLORS[item.category] || FILE_CATEGORY_COLORS.other;
          return (
            <rect
              key={item.category}
              x={x} y={0} width={w} height={height}
              fill={color}
              opacity={0.9}
            />
          );
        })}
      </svg>
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {sorted.map(item => {
          const pct = ((item.size / total) * 100).toFixed(1);
          const color = FILE_CATEGORY_COLORS[item.category] || FILE_CATEGORY_COLORS.other;
          return (
            <div key={item.category} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '3px',
                backgroundColor: color,
                flexShrink: 0,
              }} />
              {/* A13: nowrap, no clipping */}
              <span style={{ flex: 1, color: 'var(--color-ink-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {CATEGORY_LABELS[item.category] || item.category}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-ink-3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {formatBytes(item.size)}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-ink-3)', width: '44px', textAlign: 'right', flexShrink: 0 }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

