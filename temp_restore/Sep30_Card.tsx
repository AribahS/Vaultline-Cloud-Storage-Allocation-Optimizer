import React from 'react';
import clsx from 'clsx';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div
      className={clsx(
        "bg-[var(--color-surface-raised)] border border-[var(--color-border-hairline)] rounded-[var(--radius-card)] shadow-[var(--shadow-soft-sm)]",
        className
      )}
      style={{
        backgroundColor: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-hairline)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-soft-sm)',
        padding: '24px'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

