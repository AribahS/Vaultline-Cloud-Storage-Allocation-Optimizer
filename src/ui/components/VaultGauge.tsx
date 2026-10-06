import React, { useEffect, useState } from 'react';

interface VaultGaugeProps {
  /** 0–1 fill ratio */
  fill: number;
  /** Total size kept (formatted) */
  kept: string;
  /** Quota (formatted) */
  quota: string;
  /** Size in px for the gauge circle */
  size?: number;
}

/**
 * C1: Vault Gauge — a circular progress gauge styled like a vault door,
 * with an animated fill arc, center text, and gold tick marks.
 */
export const VaultGauge: React.FC<VaultGaugeProps> = ({
  fill,
  kept,
  quota,
  size = 160,
}) => {
  const [animatedFill, setAnimatedFill] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedFill(fill), 50);
    return () => clearTimeout(t);
  }, [fill]);

  const radius = (size / 2) * 0.8;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.07;
  const circumference = 2 * Math.PI * radius;
  // Leave a gap at the bottom (270° arc starting from 225° = -135deg)
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const dashOffset = arcLength * (1 - Math.min(1, animatedFill));

  // Tick marks (12 evenly around the 270° arc)
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angleDeg = -135 + (i * 270) / 11;
    const angleRad = (angleDeg * Math.PI) / 180;
    const r1 = radius + strokeWidth * 0.7;
    const r2 = radius + strokeWidth * 1.2;
    return {
      x1: cx + r1 * Math.cos(angleRad),
      y1: cy + r1 * Math.sin(angleRad),
      x2: cx + r2 * Math.cos(angleRad),
      y2: cy + r2 * Math.sin(angleRad),
    };
  });

  const overFill = animatedFill > 1;
  const arcColor = overFill
    ? 'var(--color-semantic-danger)'
    : animatedFill > 0.9
    ? 'var(--color-semantic-warning)'
    : 'var(--color-forest-500)';

  return (
    <div
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      aria-label={`Storage: ${kept} of ${quota} used`}
      role="img"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--color-surface-sunken)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-135 ${cx} ${cy})`}
        />
        {/* Fill arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-135 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1), stroke 300ms ease' }}
        />
        {/* Gold tick marks (C1) */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="var(--color-brass)"
            strokeWidth={1.5}
            opacity={0.5}
          />
        ))}
        {/* Inner detail ring */}
        <circle
          cx={cx} cy={cy}
          r={radius - strokeWidth * 0.6}
          fill="none"
          stroke="var(--color-border-hairline)"
          strokeWidth={0.5}
          opacity={0.6}
        />
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '20%',
      }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: size * 0.14,
          fontWeight: 600,
          color: 'var(--color-forest)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}>
          {Math.round(animatedFill * 100)}%
        </div>
        <div style={{ fontSize: size * 0.08, color: 'var(--color-ink-3)', marginTop: 2 }}>
          {kept}
        </div>
        <div style={{ fontSize: size * 0.07, color: 'var(--color-ink-3)', opacity: 0.7 }}>
          of {quota}
        </div>
      </div>
    </div>
  );
};

