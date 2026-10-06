import React, { useMemo, useState, useRef } from 'react';
import { KnapsackResult } from '../../engine/types';
import { formatBytes } from '../../engine/normalizer';

interface QuotaCurveChartProps {
  result: KnapsackResult;
  currentQuotaBytes: number;
  onQuotaChange?: (newBytes: number) => void;
}

export const QuotaCurveChart: React.FC<QuotaCurveChartProps> = ({
  result,
  currentQuotaBytes,
  onQuotaChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ quotaBytes: number; totalValue: number } | null>(null);

  const curveData = result.quotaCurve;

  const { pathD, points, maxQuota, maxValue, currentX, currentY } = useMemo(() => {
    if (!curveData || curveData.length === 0) {
      return { pathD: '', points: [], maxQuota: 1, maxValue: 1, currentX: 0, currentY: 0 };
    }

    const maxQ = Math.max(...curveData.map((d) => d.quotaBytes), currentQuotaBytes, 1);
    const maxV = Math.max(...curveData.map((d) => d.totalValue), 1);

    const width = 500;
    const height = 140;
    const padX = 35;
    const padY = 20;

    const scaleX = (q: number) => padX + (q / maxQ) * (width - padX - 15);
    const scaleY = (v: number) => height - padY - (v / maxV) * (height - padY - 15);

    const pts = curveData.map((d) => ({
      x: scaleX(d.quotaBytes),
      y: scaleY(d.totalValue),
      quotaBytes: d.quotaBytes,
      totalValue: d.totalValue,
    }));

    let d = '';
    pts.forEach((pt, i) => {
      d += i === 0 ? `M ${pt.x},${pt.y}` : ` L ${pt.x},${pt.y}`;
    });

    const currX = scaleX(currentQuotaBytes);
    const currY = scaleY(result.totalValue);

    return { pathD: d, points: pts, maxQuota: maxQ, maxValue: maxV, currentX: currX, currentY: currY };
  }, [curveData, currentQuotaBytes, result.totalValue]);

  // Compute marginal gain (+10 GB or +20% quota adds X priority)
  const marginalGainText = useMemo(() => {
    if (!curveData || curveData.length < 2) return null;
    const currIdx = curveData.findIndex((p) => p.quotaBytes >= currentQuotaBytes);
    const targetIdx = Math.min(curveData.length - 1, (currIdx === -1 ? curveData.length - 1 : currIdx) + 5);

    if (targetIdx > currIdx && currIdx >= 0) {
      const deltaQ = curveData[targetIdx].quotaBytes - curveData[currIdx].quotaBytes;
      const deltaV = curveData[targetIdx].totalValue - curveData[currIdx].totalValue;
      if (deltaV > 0) {
        return `+${formatBytes(deltaQ)} quota adds +${deltaV} priority points`;
      }
      return 'Diminishing returns reached (plateau)';
    }
    return 'Optimal ceiling reached';
  }, [curveData, currentQuotaBytes]);

  if (!curveData || curveData.length === 0) return null;

  return (
    <div className="panel-card" style={{ padding: '16px', marginTop: '16px' }} ref={containerRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Quota-Priority Efficiency Curve
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginLeft: '8px' }}>
            Extracted from the final DP table row
          </span>
        </div>
        {marginalGainText && (
          <span
            className="font-mono"
            style={{
              fontSize: '11px',
              backgroundColor: 'var(--color-primary-blue-surface)',
              color: 'var(--color-primary-blue)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            {marginalGainText}
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', position: 'relative' }}>
        <svg
          viewBox="0 0 500 140"
          style={{ width: '100%', height: '140px', overflow: 'visible', display: 'block' }}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="35" y1="120" x2="485" y2="120" stroke="var(--color-border-subtle)" strokeWidth="1" />
          <line x1="35" y1="70" x2="485" y2="70" stroke="var(--color-border-subtle)" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="35" y1="20" x2="485" y2="20" stroke="var(--color-border-subtle)" strokeDasharray="3 3" strokeWidth="1" />

          {/* Y Axis labels */}
          <text x="5" y="24" fill="var(--color-text-dim)" fontSize="10" className="font-mono">{maxValue}</text>
          <text x="5" y="74" fill="var(--color-text-dim)" fontSize="10" className="font-mono">{Math.round(maxValue / 2)}</text>
          <text x="18" y="124" fill="var(--color-text-dim)" fontSize="10" className="font-mono">0</text>

          {/* Area fill */}
          {pathD && (
            <path
              d={`${pathD} L 485,120 L 35,120 Z`}
              fill="url(#curveGradient)"
            />
          )}

          {/* Main curve stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-accent-lime)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Current Quota Indicator Line & Handle */}
          <line
            x1={currentX}
            y1="15"
            x2={currentX}
            y2="120"
            stroke="var(--color-primary-blue)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          <circle
            cx={currentX}
            cy={currentY}
            r="6"
            fill="var(--color-primary-blue)"
            stroke="#ffffff"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.8))' }}
          />

          {/* X Axis endpoints */}
          <text x="35" y="136" fill="var(--color-text-dim)" fontSize="10" className="font-mono">0 GB</text>
          <text x="440" y="136" fill="var(--color-text-dim)" fontSize="10" className="font-mono">{formatBytes(maxQuota)}</text>
        </svg>

        {/* Hover info tooltip if hovered */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '8px',
              backgroundColor: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: '11px',
              pointerEvents: 'none',
            }}
          >
            Quota: {formatBytes(hoveredPoint.quotaBytes)} → Priority: {hoveredPoint.totalValue} pts
          </div>
        )}
      </div>
    </div>
  );
};

