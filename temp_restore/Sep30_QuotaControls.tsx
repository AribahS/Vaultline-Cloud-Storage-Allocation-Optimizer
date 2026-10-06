import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BYTE_UNITS, RoundingUnitOption, normaliseQuota, resolveUnitBytes, formatBytes } from '../../engine/normalizer';

export const QuotaControls: React.FC = () => {
  const {
    quotaBytes,
    setQuotaBytes,
    quotaUnitOption,
    setRoundingUnitOption,
    pricePerGbMonth,
    setPricePerGb,
    files,
    knapsackResult,
  } = useAppStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Unit converter
  const currentUnit = useMemo(() => {
    if (quotaBytes >= BYTE_UNITS.TB) return 'TB';
    if (quotaBytes >= BYTE_UNITS.GB) return 'GB';
    return 'MB';
  }, [quotaBytes]);

  const numericValue = useMemo(() => {
    const divider = currentUnit === 'TB' ? BYTE_UNITS.TB : currentUnit === 'GB' ? BYTE_UNITS.GB : BYTE_UNITS.MB;
    return parseFloat((quotaBytes / divider).toFixed(2));
  }, [quotaBytes, currentUnit]);

  const handleNumericChange = (val: number, unit: string) => {
    const multiplier = unit === 'TB' ? BYTE_UNITS.TB : unit === 'GB' ? BYTE_UNITS.GB : BYTE_UNITS.MB;
    setQuotaBytes(Math.max(1 * BYTE_UNITS.MB, val * multiplier));
  };

  // Table columns info for advanced section
  const unitBytes = resolveUnitBytes(quotaBytes, quotaUnitOption);
  const tableColumnsW = normaliseQuota(quotaBytes, unitBytes);
  const isHighColumnWarning = tableColumnsW > 20000;

  // Pricing
  const totalAllBytes = files.filter((f) => !f.isExcluded).reduce((acc, f) => acc + f.size, 0);
  const keptBytes = knapsackResult?.totalSizeKept ?? 0;
  const costKeepingAll = (totalAllBytes / BYTE_UNITS.GB) * pricePerGbMonth;
  const costOptimal = (keptBytes / BYTE_UNITS.GB) * pricePerGbMonth;
  const monthlySavings = Math.max(0, costKeepingAll - costOptimal);

  const plans = [
    { label: '15 GB', sub: 'Free', bytes: 15 * BYTE_UNITS.GB },
    { label: '100 GB', sub: 'Basic', bytes: 100 * BYTE_UNITS.GB },
    { label: '200 GB', sub: 'Standard', bytes: 200 * BYTE_UNITS.GB },
    { label: '2 TB', sub: 'Premium', bytes: 2 * BYTE_UNITS.TB },
  ];

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-ink)' }}>
          Space limit
        </span>
        <span className="chip chip-primary" style={{ fontFamily: 'var(--font-mono)' }}>
          {formatBytes(quotaBytes)}
        </span>
      </div>

      {/* Quick plan buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {plans.map((plan) => {
          const isActive = quotaBytes === plan.bytes;
          return (
            <button
              key={plan.label}
              onClick={() => setQuotaBytes(plan.bytes)}
              style={{
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                backgroundColor: isActive ? 'var(--color-primary-surface)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textAlign: 'center',
              }}
            >
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
              }}>
                {plan.label}
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-dim)',
                marginTop: '1px',
              }}>
                {plan.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom input + slider */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="number"
          min="1"
          step="0.5"
          value={numericValue}
          onChange={(e) => handleNumericChange(parseFloat(e.target.value) || 1, currentUnit)}
          style={{ width: '90px', fontWeight: 600, fontSize: 'var(--text-sm)' }}
          aria-label="Storage amount"
        />
        <select
          value={currentUnit}
          onChange={(e) => handleNumericChange(numericValue, e.target.value)}
          style={{ padding: '8px 10px' }}
          aria-label="Storage unit"
        >
          <option value="MB">MB</option>
          <option value="GB">GB</option>
          <option value="TB">TB</option>
        </select>
        <input
          type="range"
          min={1 * BYTE_UNITS.GB}
          max={500 * BYTE_UNITS.GB}
          step={1 * BYTE_UNITS.GB}
          value={Math.min(500 * BYTE_UNITS.GB, quotaBytes)}
          onChange={(e) => setQuotaBytes(parseInt(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--color-primary)' }}
          aria-label="Adjust storage limit"
        />
      </div>

      {/* Cost estimator */}
      {knapsackResult && monthlySavings > 0.005 && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-success-surface)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
            Estimated monthly cost: <strong style={{ color: 'var(--color-ink)' }}>${costOptimal.toFixed(2)}</strong>
            <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
            <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>${costKeepingAll.toFixed(2)}</span>
          </div>
          <span className="chip chip-success" style={{ fontWeight: 600 }}>
            Saves ~${monthlySavings.toFixed(2)}/mo
          </span>
        </div>
      )}

      {/* Advanced toggle — hidden by default (progressive disclosure) */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
          }}
        >
          <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>▸</span>
          Advanced: precision & rounding
        </button>

        {showAdvanced && (
          <div
            style={{
              marginTop: '12px',
              padding: '14px 16px',
              backgroundColor: 'var(--color-surface-sunken)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Rounding unit:</span>
              <select
                value={quotaUnitOption}
                onChange={(e) => setRoundingUnitOption(e.target.value as RoundingUnitOption)}
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
              >
                <option value="auto">Auto (keeps table ~2,000 cols)</option>
                <option value="1MB">1 MB / unit</option>
                <option value="10MB">10 MB / unit</option>
                <option value="100MB">100 MB / unit</option>
                <option value="1GB">1 GB / unit</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
              <span className="font-mono" style={{ color: 'var(--color-dim)' }}>
                Table columns W: <strong>{tableColumnsW.toLocaleString()}</strong>
              </span>
              <span style={{ color: 'var(--color-dim)' }}>
                Unit: {formatBytes(unitBytes)}
              </span>
            </div>

            {isHighColumnWarning && (
              <div style={{ color: 'var(--color-warning)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠</span>
                <span>&gt;20,000 columns may slow things down. Try "Auto" or a larger unit.</span>
              </div>
            )}

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)', lineHeight: 1.5 }}>
              File sizes are rounded <em>up</em> to the unit so the result never exceeds your real cloud quota.
            </div>

            {/* Price per GB */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Price per GB/month:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-dim)' }}>$</span>
                <input
                  type="number"
                  min="0.001"
                  step="0.005"
                  value={pricePerGbMonth}
                  onChange={(e) => setPricePerGb(parseFloat(e.target.value) || 0.02)}
                  style={{ width: '70px', fontSize: 'var(--text-xs)', padding: '4px 6px' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

