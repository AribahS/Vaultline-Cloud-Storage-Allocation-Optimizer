import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BYTE_UNITS, formatBytes } from '../../engine/normalizer';

interface PresetPlace {
  label: string;
  icon: string;
  bytes: number;
}

const PRESET_PLACES: PresetPlace[] = [
  { label: 'Phone (64 GB)', icon: '📱', bytes: 64 * BYTE_UNITS.GB },
  { label: 'Pen drive (32 GB)', icon: '💾', bytes: 32 * BYTE_UNITS.GB },
  { label: 'Google (15 GB)', icon: '☁️', bytes: 15 * BYTE_UNITS.GB },
  { label: 'iCloud (5 GB)', icon: '🍎', bytes: 5 * BYTE_UNITS.GB },
  { label: 'Email (25 MB)', icon: '✉️', bytes: 25 * BYTE_UNITS.MB },
  { label: 'Custom', icon: '⚙️', bytes: -1 },
];

export const WhereFittingCard: React.FC = () => {
  const {
    quotaBytes,
    setQuotaBytes,
    files,
    places,
    addPlace,
    removePlace,
    updatePlace,
  } = useAppStore();

  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState(15);
  const [customUnit, setCustomUnit] = useState<'MB' | 'GB' | 'TB'>('GB');
  const [showMultiPlaceInfo, setShowMultiPlaceInfo] = useState(false);

  const totalFilesBytes = useMemo(
    () => files.filter((f) => !f.isExcluded).reduce((sum, f) => sum + f.size, 0),
    [files]
  );

  const totalAvailableBytes = useMemo(
    () => places.reduce((sum, p) => sum + p.quotaBytes, 0),
    [places]
  );

  const handleSelectPreset = (p: PresetPlace) => {
    if (p.bytes === -1) {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    setQuotaBytes(p.bytes);
  };

  const handleCustomChange = (val: number, unit: 'MB' | 'GB' | 'TB') => {
    setCustomValue(val);
    setCustomUnit(unit);
    const multiplier = unit === 'MB' ? BYTE_UNITS.MB : unit === 'GB' ? BYTE_UNITS.GB : BYTE_UNITS.TB;
    setQuotaBytes(val * multiplier);
  };

  const handleAddSecondPlace = () => {
    const nextId = `place_${Date.now()}`;
    const colors = ['#6C47FF', '#14B8A6', '#F5A524', '#F472B6'];
    const chosenColor = colors[places.length % colors.length];
    addPlace({
      id: nextId,
      name: `Second Place (${places.length + 1})`,
      quotaBytes: 32 * BYTE_UNITS.GB,
      color: chosenColor,
    });
  };

  return (
    <div className="card" style={{ padding: '22px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink)' }}>
          Where are you fitting these?
        </h3>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>
          {places.length > 1 ? `${places.length} places active` : '1 place'}
        </span>
      </div>

      {/* Preset Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {PRESET_PLACES.map((p) => {
          const isSelected = !isCustom && p.bytes > 0 && Math.abs(quotaBytes - p.bytes) < 1024 * 1024;
          const isCustomSelected = isCustom && p.bytes === -1;
          const active = isSelected || isCustomSelected;

          return (
            <button
              key={p.label}
              onClick={() => handleSelectPreset(p)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: active ? 700 : 500,
                backgroundColor: active ? 'var(--color-primary-surface)' : 'var(--color-surface-sunken)',
                color: active ? 'var(--color-primary)' : 'var(--color-ink)',
                border: active ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Slider & Input */}
      {isCustom && (
        <div
          className="card-sunken"
          style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number"
              min="1"
              max="2000"
              value={customValue}
              onChange={(e) => handleCustomChange(Math.max(1, parseFloat(e.target.value) || 1), customUnit)}
              style={{ width: '80px', fontWeight: 600, fontSize: 'var(--text-sm)' }}
            />
            <div className="segmented-control">
              {(['MB', 'GB', 'TB'] as const).map((u) => (
                <button
                  key={u}
                  className={customUnit === u ? 'active' : ''}
                  onClick={() => handleCustomChange(customValue, u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="128"
            value={Math.min(128, customValue)}
            onChange={(e) => handleCustomChange(parseFloat(e.target.value), customUnit)}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
        </div>
      )}

      {/* Single Friendly Sentence */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: totalFilesBytes > totalAvailableBytes ? 'rgba(245, 165, 36, 0.12)' : 'var(--color-keep-surface)',
          border: `1px solid ${totalFilesBytes > totalAvailableBytes ? 'rgba(245, 165, 36, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          fontSize: 'var(--text-xs)',
          color: 'var(--color-ink)',
          lineHeight: 1.5,
        }}
      >
        Your files add up to <strong>{formatBytes(totalFilesBytes)}</strong>. You have <strong>{formatBytes(totalAvailableBytes)}</strong>.
        {totalFilesBytes > totalAvailableBytes ? (
          <span style={{ display: 'block', color: 'var(--color-warning)', marginTop: '2px', fontWeight: 600 }}>
            {formatBytes(totalFilesBytes - totalAvailableBytes)} over limit. Vaultline will pick the best mix.
          </span>
        ) : (
          <span style={{ display: 'block', color: 'var(--color-keep)', marginTop: '2px', fontWeight: 600 }}>
            All your files can fit inside!
          </span>
        )}
      </div>

      {/* Multi-place list if > 1 */}
      {places.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {places.map((place, idx) => (
            <div
              key={place.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface-sunken)',
                borderLeft: `4px solid ${place.color}`,
                fontSize: 'var(--text-xs)',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{place.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-mono">{formatBytes(place.quotaBytes)}</span>
                {idx > 0 && (
                  <button
                    onClick={() => removePlace(place.id)}
                    style={{ color: 'var(--color-dim)', fontSize: '14px', padding: '2px 4px' }}
                    title="Remove place"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Another Place Button */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={handleAddSecondPlace}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <span>＋</span> Add another place
        </button>

        <button
          onClick={() => setShowMultiPlaceInfo(!showMultiPlaceInfo)}
          style={{ color: 'var(--color-dim)', fontSize: '14px', cursor: 'pointer', padding: '4px' }}
          title="How multi-place works"
        >
          ℹ
        </button>
      </div>

      {showMultiPlaceInfo && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-muted)',
            backgroundColor: 'var(--color-surface-sunken)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            lineHeight: 1.45,
          }}
        >
          With several places, Vaultline gives a very good split, not a guaranteed perfect one (sequential knapsack heuristic).
        </div>
      )}
    </div>
  );
};

