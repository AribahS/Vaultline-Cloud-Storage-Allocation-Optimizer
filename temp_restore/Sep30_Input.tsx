import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-2)' }}>
          {label}
        </label>
      )}
      <input
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: error ? '1px solid var(--color-danger)' : '1px solid var(--color-hairline)',
          backgroundColor: 'var(--color-raised)',
          color: 'var(--color-ink)',
          fontSize: '14px',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;

