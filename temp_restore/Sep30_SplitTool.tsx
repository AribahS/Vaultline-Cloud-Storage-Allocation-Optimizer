import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { formatBytes } from '../../../engine/normalizer';
import { solveMultiPlace, StoragePlace } from '../../../engine/multiPlace';

export const SplitTool: React.FC = () => {
  const { files } = useAppStore();
  const [destinations, setDestinations] = useState<StoragePlace[]>([
    { id: '1', name: 'External SSD', quotaBytes: 15 * 1024 * 1024 * 1024, color: '#14382B' },
    { id: '2', name: 'SD Card (16GB)', quotaBytes: 16 * 1024 * 1024 * 1024, color: '#2F6B4F' },
  ]);

  const multiPlaceResult = useMemo(() => {
    if (files.length === 0) return null;
    return solveMultiPlace(files, destinations);
  }, [files, destinations]);

  if (files.length === 0) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
          <h3>No files available</h3>
          <p>Add files to your workspace to use the Split tool.</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
      <Card title="Storage Destinations">
        <p style={{ fontSize: '13px', color: 'var(--color-ink-2)', marginBottom: '16px' }}>
          Define target drives to split overflow files optimal across multiple destinations.
        </p>
        {destinations.map((dest) => (
          <div key={dest.id} style={{ padding: '12px', background: 'var(--color-sunken)', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: 'var(--color-ink)' }}>
              {dest.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>
              Capacity: {formatBytes(dest.quotaBytes)}
            </div>
          </div>
        ))}
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            const name = prompt('Destination Name:', 'USB Drive');
            if (name) {
              const gb = parseFloat(prompt('Capacity in GB:', '32') || '32') || 32;
              setDestinations(prev => [
                ...prev,
                { id: String(Date.now()), name, quotaBytes: gb * 1024 * 1024 * 1024, color: '#14382B' }
              ]);
            }
          }}
        >
          + Add Target Destination
        </Button>
      </Card>

      <Card title="Multi-Drive Allocation Plan">
        {!multiPlaceResult ? null : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {multiPlaceResult.allocations.map((p, idx) => (
                <div key={idx} style={{ border: '1px solid var(--color-hairline)', borderRadius: '8px', padding: '16px', background: 'var(--color-raised)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-forest)' }}>{p.place.name}</span>
                    <span style={{ fontSize: '13px', color: 'var(--color-ink-2)' }}>
                      {formatBytes(p.usedBytes)} / {formatBytes(p.place.quotaBytes)} ({p.place.quotaBytes > 0 ? Math.round((p.usedBytes / p.place.quotaBytes) * 100) : 0}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--color-sunken)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${p.place.quotaBytes > 0 ? Math.min(100, (p.usedBytes / p.place.quotaBytes) * 100) : 0}%`, height: '100%', background: 'var(--color-forest)' }} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-3)' }}>
                    Assigned {p.assignedFiles.length} files
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
