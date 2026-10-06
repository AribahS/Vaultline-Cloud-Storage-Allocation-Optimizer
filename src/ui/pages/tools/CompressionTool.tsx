import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { Card } from '../../components/Card';
import { formatBytes } from '../../../engine/normalizer';

export const CompressionTool: React.FC = () => {
  const { files } = useAppStore();

  const stats = useMemo(() => {
    let original = 0;
    let compressed = 0;
    files.forEach((f) => {
      original += f.size;
      let r = 1.0;
      if (f.category === 'document' || f.category === 'code') r = 0.3;
      else if (f.category === 'archive') r = 0.95;
      else if (f.category === 'photo') r = 0.92;
      else if (f.category === 'video') r = 0.98;
      else if (f.category === 'audio') r = 0.90;
      else r = 0.8;
      compressed += f.size * r;
    });
    return { original, compressed, saved: original - compressed };
  }, [files]);

  if (files.length === 0) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
          <h3>No files available</h3>
          <p>Add files to your workspace to simulate compression.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Compression Savings Simulator">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={{ padding: '16px', background: 'var(--color-sunken)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>Original Size</div>
          <div style={{ fontSize: '24px', fontFamily: 'Fraunces, serif' }}>{formatBytes(stats.original)}</div>
        </div>
        <div style={{ padding: '16px', background: 'var(--color-sunken)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>Compressed</div>
          <div style={{ fontSize: '24px', fontFamily: 'Fraunces, serif', color: 'var(--color-forest)' }}>{formatBytes(stats.compressed)}</div>
        </div>
        <div style={{ padding: '16px', background: 'var(--color-sunken)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>Saved</div>
          <div style={{ fontSize: '24px', fontFamily: 'Fraunces, serif', color: 'var(--color-brass)' }}>{formatBytes(stats.saved)}</div>
        </div>
      </div>
    </Card>
  );
};
