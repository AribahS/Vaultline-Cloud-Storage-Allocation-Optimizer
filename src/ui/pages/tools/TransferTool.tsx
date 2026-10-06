import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { Card } from '../../components/Card';
import { formatBytes } from '../../../engine/normalizer';
import { SegmentedControl } from '../../components/SegmentedControl';

export const TransferTool: React.FC = () => {
  const { files, knapsackResult } = useAppStore();
  const [presetSpeed, setPresetSpeed] = useState<string>('wifi');
  const [transferSpeedMbps, setTransferSpeedMbps] = useState<number>(100);

  const transferStats = useMemo(() => {
    const totalBytes = knapsackResult ? knapsackResult.totalSizeDropped : files.reduce((acc, f) => acc + f.size, 0);
    const speedBytesPerSec = (transferSpeedMbps * 1000 * 1000) / 8;
    const durationSeconds = speedBytesPerSec > 0 ? totalBytes / speedBytesPerSec : 0;
    
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = Math.floor(durationSeconds % 60);

    return {
      totalBytes,
      formattedTime: `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`,
    };
  }, [files, knapsackResult, transferSpeedMbps]);

  if (files.length === 0) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-3)' }}>
          <h3>No files available</h3>
          <p>Add files to your workspace to estimate transfer times.</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
      <Card title="Speed Settings">
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-2)', display: 'block', marginBottom: '6px' }}>
            Preset Connection Speed
          </label>
          <SegmentedControl
            options={['wifi', 'fiber', 'usb3']}
            selected={presetSpeed}
            onChange={(val) => {
              setPresetSpeed(val);
              if (val === 'wifi') setTransferSpeedMbps(100);
              if (val === 'fiber') setTransferSpeedMbps(1000);
              if (val === 'usb3') setTransferSpeedMbps(5000);
            }}
          />
        </div>
      </Card>
      <Card title="Transfer Time Matrix">
        <div style={{ fontSize: '32px', fontFamily: 'Fraunces, serif', color: 'var(--color-forest)', fontWeight: 600 }}>
          {transferStats.formattedTime}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-ink-3)', marginTop: '4px' }}>
          To transfer payload of {formatBytes(transferStats.totalBytes)} at {transferSpeedMbps} Mbps
        </div>
      </Card>
    </div>
  );
};
