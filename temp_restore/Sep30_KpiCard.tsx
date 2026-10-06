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
  return (
    <Card
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="text-caption text-ink-3" style={{ marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '32px',
            fontWeight: 600,
            color: accentColor || 'var(--color-forest)',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {value}
          </div>
          {subtitle && (
            <div className="text-body-small text-ink-2" style={{ marginTop: '6px' }}>
              {subtitle}
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-forest-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

