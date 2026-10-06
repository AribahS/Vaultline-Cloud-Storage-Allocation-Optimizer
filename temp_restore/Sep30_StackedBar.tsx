import React from 'react';

const FILE_CATEGORY_COLORS: Record<string, string> = {
  document: '#2D5A7B',
  photo: '#B5654A',
  video: '#C58B2B',
  audio: '#7A5C8C',
  archive: '#4E8A6B',
  code: '#3E6E73',
  system: '#7B7F73',
  log_temp: '#7B7F73',
  database: '#3E6E73',
  other: '#A89F86',
};

const CATEGORY_LABELS: Record<string, string> = {
  document: 'Documents',
  photo: 'Photos',
  video: 'Videos',
  audio: 'Audio',
  archive: 'Archives',
  code: 'Code',
  system: 'System',
  log_temp: 'Logs/Temp',
  database: 'Databases',
  other: 'Other',
};

const formatBytesHuman = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <svg width={width} height={height} style={{ display: 'block', borderRadius: '4px', overflow: 'hidden' }}>
        {sorted.map(item => {
          const w = (item.size / total) * width;
          const x = offsetX;
          offsetX += w;
          return (
            <rect
              key={item.category}
              x={x}
              y={0}
              width={w}
              height={height}
              fill={FILE_CATEGORY_COLORS[item.category] || FILE_CATEGORY_COLORS.other}
              opacity={0.85}
            />
          );
        })}
      </svg>
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {sorted.map(item => {
          const pct = ((item.size / total) * 100).toFixed(1);
          return (
            <div key={item.category} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '3px',
                backgroundColor: FILE_CATEGORY_COLORS[item.category] || FILE_CATEGORY_COLORS.other,
                flexShrink: 0
              }} />
              <span style={{ flex: 1, color: 'var(--color-ink-2)' }}>
                {CATEGORY_LABELS[item.category] || item.category}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-ink-3)' }}>
                {formatBytesHuman(item.size)}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-ink-3)', width: '44px', textAlign: 'right' }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

