import React from 'react';
import clsx from 'clsx';

export interface SegmentedControlProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selected, onChange }) => {
  return (
    <div style={{
      display: 'inline-flex',
      backgroundColor: 'var(--color-surface-sunken)',
      padding: '4px',
      borderRadius: '8px',
      border: '1px solid var(--color-border-hairline)',
    }}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            style={{
              padding: '6px 16px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: isSelected ? 'var(--color-surface-raised)' : 'transparent',
              color: isSelected ? 'var(--color-ink)' : 'var(--color-ink-2)',
              boxShadow: isSelected ? '0 1px 2px rgba(20, 56, 43, 0.1)' : 'none',
              transition: 'all var(--transition-color)'
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};
