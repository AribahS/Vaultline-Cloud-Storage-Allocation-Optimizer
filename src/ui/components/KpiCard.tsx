import React from 'react';
import { Card } from '../components/Card';

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtitle, icon, accentColor, onClick }) => {
  // C3: Apply gold-foil gradient text for brass/gold accent KPIs
  const isBrass = accentColor === 'var(--highlight)';

  return (
    <Card
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0 }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          {/* C3: Ledger-rule label */}
          <div
            className="text-caption text-ink-3"
            style={{
              marginBottom: '8px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--color-border-hairline)',
            }}
          >
            {label}
          </div>
          {/* C3: Gold-foil gradient text when accentColor is brass */}
          <div
            className={`kpi-value${isBrass ? ' gold-foil-text' : ''}`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '32px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div className="text-body-small text-ink-2" style={{ marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle}
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

