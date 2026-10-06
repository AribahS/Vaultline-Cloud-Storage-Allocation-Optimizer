import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { Card } from '../../components/Card';
import { formatBytes } from '../../../engine/normalizer';

export const CleanupTool: React.FC = () => {
  const { files } = useAppStore();

  const cleanupCandidates = useMemo(() => {
    return files.filter(f => 
      f.name.endsWith('.tmp') || 
      f.name.endsWith('.log') || 
      f.name.endsWith('.bak') || 
      f.path.includes('/Cache/') ||
      f.path.includes('/node_modules/') ||
      f.name.startsWith('.DS_Store') ||
      f.priority <= 2
    );
  }, [files]);

  const cleanupBytes = useMemo(() => cleanupCandidates.reduce((acc, f) => acc + f.size, 0), [cleanupCandidates]);

  if (files.length === 0) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
          <h3>No files available</h3>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Junk & Temporary File Assistant">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p>Identifies temporary files and low-priority items.</p>
        <div style={{ fontSize: '18px', color: 'var(--color-forest)' }}>
          Found {cleanupCandidates.length} files ({formatBytes(cleanupBytes)})
        </div>
      </div>
      {cleanupCandidates.length > 0 && (
        <div style={{ border: '1px solid var(--color-hairline)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-sunken)', borderBottom: '1px solid var(--color-hairline)' }}>
                <th style={{ padding: '8px' }}>File</th>
                <th style={{ padding: '8px' }}>Size</th>
                <th style={{ padding: '8px' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {cleanupCandidates.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                  <td style={{ padding: '8px' }}>{f.name}</td>
                  <td style={{ padding: '8px' }}>{formatBytes(f.size)}</td>
                  <td style={{ padding: '8px', color: 'var(--color-danger)' }}>{f.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
